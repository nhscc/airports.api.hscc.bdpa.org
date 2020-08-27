import { ObjectId } from 'mongodb'
import { getEnv } from 'universe/backend/env'
import { getDb, pipelines } from 'universe/backend/db'
import { isArray } from 'util'
import { getClientIp } from 'request-ip'
import { shuffle } from 'fast-shuffle'
import cloneDeep from 'clone-deep'
import randomInt from 'random-int'
import uniqueRandomArray from 'unique-random-array'

import {
    IdTypeError,
    ApiKeyTypeError,
    FlightGenerationError,
    GuruMeditationError,
    ValidationError,
    AppError,
} from 'universe/backend/error'

import type { NextApiRequest } from 'next'
import type { WithId } from 'mongodb'
import { pseudoRandomBytes } from 'crypto'

import type {
    NextParamsRR,
    RequestLogEntry,
    LimitedLogEntry,
    ApiKey,
    NoFlyListEntry,
    InternalAirport,
    InternalAirline,
    InternalFlight,
    PublicFlight,
    InternalInfo,
} from 'types/global'

const isObject = (object: unknown) => !isArray(object) && object !== null && typeof object == 'object';

let requestCounter = 0;

export const MIN_RESULT_PER_PAGE = 15;
export const MIN_SEATS_PER_PLANE = 10;
export const SEATS_PER_PLANE = 100;
export const NULL_KEY = '00000000-0000-0000-0000-000000000000';
export const DUMMY_KEY = '12349b61-83a7-4036-b060-213784b491';

export type GetFliByIdParams = {
    ids: ObjectId[];
    key: string;
};

const primaryMatchTargets = [
    'type',
    'airline',
    'comingFrom',
    'landingAt',
    'departingTo',
    'flightNumber',
    'ffms',
    'seats.economy.priceDollars',
    '_id'
];

const secondaryMatchTargets = [
    'departFromSender',
    'arriveAtReceiver',
    'departFromReceiver',
    'status',
    'gate',
];

const matchableStrings = [
    ...primaryMatchTargets,
    ...secondaryMatchTargets,
];

const matchableSubStrings = ['$gt', '$lt', '$gte', '$lte'];

type StatelessFlight = Omit<InternalFlight, 'stochasticStates'> & {
    stochasticStates?: InternalFlight['stochasticStates'];
};

export type SeaFliParams = {
    key: string;
    after: ObjectId | null;
    match: {
        [specifier: string]: string | number | ObjectId | {
            [subspecifier in '$gt' | '$lt' | '$gte' | '$lte']?: string | number
        }
    };
    regexMatch: {
        [specifier: string]: string | ObjectId
    };
    sort: 'asc' | 'desc';
};

export function convertPFlightToPFlightForV1Only(flight: PublicFlight) {
    const { extras, baggage, ffms, seats, ...publicV1Flight } = flight;

    return {
        ...publicV1Flight,
        seatPrice: Object.values(seats)[0].priceDollars
    };
}

export async function isKeyAuthentic(key: string): Promise<boolean> {
    if(!key || typeof key != 'string')
        throw new ApiKeyTypeError();

    return !!await (await getDb()).collection<WithId<ApiKey>>('keys').find({ key }).limit(1).count();
}

/**
 * Note that this async function does not have to be awaited. It's fire and
 * forget!
 */
export async function addToRequestLog({ req, res }: NextParamsRR): Promise<void> {
    const logEntry: RequestLogEntry = {
        ip: getClientIp(req),
        key: req.headers?.key?.toString() || null,
        method: req.method || null,
        route: req.url?.replace(/^\/api\//, '') || null,
        resStatusCode: res.statusCode,
        time: Date.now()
    };

    await (await getDb()).collection<WithId<RequestLogEntry>>('request-log').insertOne(logEntry);
}

export async function isRateLimited(req: NextApiRequest): Promise<{ limited: boolean; retryAfter: number }> {
    const ip = getClientIp(req);
    const key = req.headers?.key?.toString() || null;

    const limited = (await (await getDb()).collection<WithId<LimitedLogEntry>>('limited-log-mview').find({
        $or: [...(ip ? [{ ip }]: []), ...(key ? [{ key }]: [])],
        until: { $gt: Date.now() }
    }).sort({ until: -1 }).limit(1).toArray())[0] || null;

    return {
        limited: !!limited,
        retryAfter: (limited?.until || Date.now()) - Date.now()
    };
}

export function isDueForContrivedError(): boolean {
    const reqPerErr = getEnv().REQUESTS_PER_CONTRIVED_ERROR;

    if(reqPerErr && ++requestCounter >= reqPerErr) {
        requestCounter = 0;
        return true;
    }

    return false;
}

export async function getNoFlyList() {
    return (await getDb()).collection<WithId<NoFlyListEntry>>('no-fly-list').find().sort({ id: 1 }).project({
        _id: false,
    }).toArray();
}

export async function getAirports() {
    return (await getDb()).collection<WithId<InternalAirport>>('airports').find().sort({ id: 1 }).project({
        _id: false,
        chapterKey: false,
    }).toArray();
}

export async function getAirlines() {
    return (await getDb()).collection<WithId<InternalAirline>>('airlines').find().sort({ id: 1 }).project({
        _id: false,
    }).toArray();
}

export async function getExtras() {
    return (await (await getDb()).collection<WithId<InternalInfo>>('info').findOne({}))?.allExtras;
}

export async function getSeats() {
    return (await (await getDb()).collection<WithId<InternalInfo>>('info').findOne({}))?.seatClasses;
}

export async function getFlightsById(params: GetFliByIdParams) {
    const { ids, key } = params;

    if(!Array.isArray(ids))
        throw new IdTypeError();

    if(ids.length > getEnv().RESULTS_PER_PAGE)
        throw new ValidationError('too many flight_ids specified');

    if(!ids.every(id => id instanceof ObjectId))
        throw new IdTypeError();

    if(!key || typeof key != 'string')
        throw new ApiKeyTypeError();

    if(!ids.length)
        return [];

    return (await getDb()).collection<WithId<InternalFlight>>('flights').aggregate<PublicFlight>([
        { $match: { _id: { $in: ids }}},
        ...pipelines.resolveFlightState(key, /*removeId=*/true)
    ]).toArray();
}

export async function searchFlights(params: SeaFliParams) {
    const { key, after, match, regexMatch, sort } = params;
    let regexMatchObjectIds: ObjectId[] = [];

    if(!key || typeof key != 'string')
        throw new ApiKeyTypeError();

    if(after !== null && !(after instanceof ObjectId))
        throw new IdTypeError(after);

    if(typeof sort != 'string' || !['asc', 'desc'].includes(sort))
        throw new ValidationError('invalid sort');

    if(!isObject(match) || !isObject(regexMatch))
        throw new ValidationError('missing match and/or regexMatch');

    if(match._id)
        throw new ValidationError('invalid match object (1)');

    if(regexMatch._id)
        throw new ValidationError('invalid regexMatch object (1)');

    try {
        if(match.flight_id) {
            match._id = new ObjectId(match.flight_id as string);
            delete match.flight_id;
        }

        if(regexMatch.flight_id) {
            regexMatchObjectIds = regexMatch.flight_id.toString().split('|').map(oid => new ObjectId(oid));
            delete regexMatch.flight_id;
        }
    }

    catch(e) {
        throw new ValidationError('bad flight_id encountered')
    }

    const matchKeys = Object.keys(match);
    const regexMatchKeys = Object.keys(regexMatch);

    const matchKeysAreValid = () => matchKeys.every(ky => {
        const val = match[ky];
        let valNotEmpty = false;

        const test = () => Object.keys(val).every(subky => (valNotEmpty = true) && matchableSubStrings.includes(subky)
            && typeof (val as Record<string, unknown>)[subky] == 'number');

        return !isArray(val)
            && matchableStrings.includes(ky)
            && (val instanceof ObjectId || ['number', 'string'].includes(typeof(val)) || (isObject(val) && test() && valNotEmpty));
    });

    const regexMatchKeysAreValid = () => regexMatchKeys.every(k =>
        matchableStrings.includes(k) && (regexMatch[k] instanceof ObjectId || typeof regexMatch[k] == 'string'));

    if(matchKeys.length && !matchKeysAreValid())
        throw new ValidationError('invalid match object (2)');

    if(regexMatchKeys.length && !regexMatchKeysAreValid())
        throw new ValidationError('invalid regexMatch object (2)');

    const primaryMatchers: Record<string, unknown> = {};
    const secondaryMatchers: Record<string, unknown> = {};

    // ? We need to split off the search params that need flight state resolved
    // ? for both normal matchers and regex matchers (the latter takes
    // ? precedence due to code order)

    for(const [prop, val] of Object.entries(match)) {
        if(primaryMatchTargets.includes(prop))
            primaryMatchers[prop] = val;

        else if(secondaryMatchTargets.includes(prop))
            secondaryMatchers[prop] = val;

        else
            throw new GuruMeditationError(`matcher "${prop}" is somehow neither primary nor secondary (1)`);
    }

    for(const [prop, val] of Object.entries(regexMatch)) {
        const regexVal = { $regex: val, $options: 'i' };

        if(primaryMatchTargets.includes(prop))
            primaryMatchers[prop] = regexVal;

        else if(secondaryMatchTargets.includes(prop))
            secondaryMatchers[prop] = regexVal;

        else
            throw new GuruMeditationError(`matcher "${prop}" is somehow neither primary nor secondary (2)`);
    }

    const primaryMatchStage = {
        $match: {
            ...(after ? { _id: { [sort == 'asc' ? '$gt' : '$lt']: new ObjectId(after) }} : {}),
            ...primaryMatchers
        }
    };

    const pipeline = [
        ...(Object.keys(primaryMatchStage.$match).length ? [primaryMatchStage] : []),
        ...(regexMatchObjectIds.length ? [{ $match: { _id: { $in: regexMatchObjectIds }}}] : []),
        ...pipelines.resolveFlightState(key, /*removeId=*/false),
        ...(Object.keys(secondaryMatchers).length ? [{ $match: { ...secondaryMatchers }}] : []),
        { $sort: { _id: sort == 'asc' ? 1 : -1 }},
        { $limit: getEnv().RESULTS_PER_PAGE },
        { $project: { _id: false }}
    ];

    // TODO: the database design can be optimized by popping the stochastic
    // TODO: states out of their flight documents and placing them in their own
    // TODO: collection, where we can put an index on them. But unless the slow
    // TODO: queries become a problem, this will do for now.
    return (await getDb()).collection<InternalFlight>('flights').aggregate<PublicFlight>(pipeline).toArray();
}

export async function generateFlights(silent = false) {
    const db = await getDb();
    const airports = await db.collection<WithId<InternalAirport>>('airports').find().toArray();
    const airlines = await db.collection<WithId<InternalAirline>>('airlines').find().toArray();
    const info = await db.collection('info').find().next() as WithId<InternalInfo>;

    const flightDb = db.collection<WithId<InternalFlight>>('flights');

    if(airports.length < 2 || airlines.length < 2)
        throw new FlightGenerationError('cannot generate flights without at least two airports and airlines');

    // ? Let's setup some helpers...

    let objectIdCounter = randomInt(2**10, 2**21 - 1);
    const objectIdRandom = pseudoRandomBytes(5).toString('hex');

    const targetDaysInMs = getEnv().FLIGHTS_GENERATE_DAYS * 24 * 60 * 60 * 1000;
    const threeMinutesInMs = 3 * 60 * 1000;
    const fiveMinutesInMs = 5 * 60 * 1000;
    const tenMinutesInMs = 10 * 60 * 1000;
    const fifteenMinutesInMs = 15 * 60 * 1000;
    const sixteenMinutesInMs = 16 * 60 * 1000;
    const thirtyMinutesInMs = 30 * 60 * 1000;
    const thirtyOneMinutesInMs = 31 * 60 * 1000;
    const oneHourInMs = 60 * 60 * 1000;
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

    const chance = () => randomInt(1, 100);
    const hourLevelMsDilation = (epoch: number) => Math.floor(epoch / oneHourInMs) * oneHourInMs;

    // ? We make our own MongoDb Ids so that we can sort them and quickly delete
    // ? outdated flights. Very cool!
    // * See: https://docs.mongodb.com/manual/reference/method/ObjectId/#ObjectId
    const generateObjectIdFromMs = (epoch: number) => {
        const hex = (Math.floor(epoch / 1000).toString(16)
            + objectIdRandom
            + (++objectIdCounter).toString(16)
        ).padEnd(24, '0');

        return new ObjectId(hex);
    };

    // ? Delete any entries created more than 7 days ago
    const deleteResult = await flightDb.deleteMany({
        _id: { $lt: generateObjectIdFromMs(Date.now() - sevenDaysInMs) }
    });

    // eslint-disable-next-line no-console
    !silent && console.info(`api   - Deleted ${deleteResult.deletedCount} flights older than 7 days`);

    // ? Determine how many hours (if any) need flights generated for them
    const lastFlightId = (await flightDb.find().sort({ _id: -1 }).limit(1).next())?._id ?? new ObjectId();
    const lastFlightHourMs = hourLevelMsDilation(lastFlightId.getTimestamp().getTime());
    const totalHoursToGenerate = (hourLevelMsDilation(Date.now() + targetDaysInMs) - lastFlightHourMs) / oneHourInMs;

    // eslint-disable-next-line no-console
    !silent && console.info(`api   - Generating ${totalHoursToGenerate} hours worth of flights...`);

    if(!totalHoursToGenerate)
        return 0;

    // ? Setup some shared structures for later cloning
    const flightNumPool = [...Array(9999)].map((_, j) => j + 1);
    const gatePool = ('abcdefghijklmnopqrstuvwxyz').split('').slice(0, getEnv().AIRPORT_NUM_OF_GATE_LETTERS).map(x => {
        return [...Array(getEnv().AIRPORT_GATE_NUMBERS_PER_LETTER)].map((_, n) => `${x}${n + 1}`);
    }).flat();

    // ? Carve out a place to stash all flights in existence...
    // TODO: We could implement this more memory-efficiently by writing out
    // TODO: our results incrementally using a MongoDB bulk write operation
    // TODO: instead of stashing them all in one spot
    const flights: WithId<InternalFlight>[] = [];

    // ? Ensure a fair distribution of arrivals and departures
    let isArrival = false;

    // ? And now, for every hour, generate a bunch of flights!
    [...Array(totalHoursToGenerate)].forEach((_, i) => {
        if(chance() > getEnv().FLIGHT_HOUR_HAS_FLIGHTS_PERCENT)
            return;

        const currentHour = lastFlightHourMs + oneHourInMs + i * oneHourInMs;
        const activeAirlines = shuffle(airlines).slice(0, randomInt(2, airlines.length)) as WithId<InternalAirline>[];
        const getFlightNum = activeAirlines.reduce<{ [objectId: string]: () => number }>((map, airline) => {
            return {
                ...map,
                [airline._id.toHexString()]: uniqueRandomArray(cloneDeep(flightNumPool))
            };
        }, {});

        // eslint-disable-next-line no-console
        !silent && console.info(`api   ↳ Generating flights for hour ${currentHour} (${i+1}/${totalHoursToGenerate})`);

        // ? Arrivals land at firstAirport and came from secondAirport
        // ? Departures land at firstAirport and depart to secondAirport; which
        // ? airport they came from is randomly determined
        airports.forEach(firstAirport => {
            // ? Thanks to arrivals and departures both using firstAirport to
            // ? land, the following becomes possible:
            const localGatePool: typeof gatePool = shuffle(cloneDeep(gatePool));
            const releaseGate = (gate: string) => localGatePool.push(gate);
            const getGate = () => {
                const gate = localGatePool.shift();
                if(!gate) throw new GuruMeditationError('ran out of gates');
                return gate;
            };

            // ? Prepare a place to store unfinished business
            const statelessFlights: WithId<StatelessFlight>[] = [];

            // ? First we generate stateless flight data
            airports.forEach(secondAirport => {
                // ? Sometimes we skip a source-dest pair in a given hour (and
                // ? planes can't come from and land at the same airport)
                if(firstAirport._id.equals(secondAirport._id) || chance() > getEnv().AIRPORT_PAIR_USED_PERCENT)
                    return;

                activeAirlines.forEach(airline => {
                    // ? This flight will be the opposite type of the last one
                    isArrival = !isArrival;

                    // ? Next, we determine how many checked bags and carry-ons
                    // ? people can bring how much they'll be gouged
                    const maxChecked = randomInt(0, 10);
                    const maxCarry = randomInt(0, 4);

                    // ? Now we calculate seat prices and availability
                    const seats: InternalFlight['seats'] = {};

                    let prevSeat$ = randomInt(60, 150);
                    let prevSeatFfms = randomInt(5000, 8000);

                    // ? We do this out here so we can sort and sum them easily
                    const numSeats = [...Array(info.seatClasses.length)].map(_ => {
                        return randomInt(MIN_SEATS_PER_PLANE, SEATS_PER_PLANE / info.seatClasses.length);
                    }).sort((a, b) => b - a);

                    // ? Give any remaining seats to the cheapest option
                    numSeats[0] += SEATS_PER_PLANE - numSeats.reduce((p, c) => p + c, 0);

                    for(const [ndx, seatClass] of Object.entries(info.seatClasses)) {
                        // ? Prices can at most double... greedy capitalists!
                        prevSeat$ = randomInt(prevSeat$, prevSeat$ * 2) + Number(Math.random().toFixed(2));
                        prevSeatFfms = randomInt(prevSeatFfms, prevSeatFfms * 2);

                        seats[seatClass] = {
                            total: numSeats[Number(ndx)],
                            priceDollars: prevSeat$,
                            priceFfms: prevSeatFfms
                        };
                    }

                    // ? We also calculate prices and availability of extras
                    const extras: InternalFlight['extras'] = {};

                    let prevItem$ = 1;
                    let prevItemFfms = randomInt(10, 150);

                    for(const item of info.allExtras) {
                        // ? 25% chance one of the items is not included
                        if(chance() > 75) continue;

                        // ? Prices can multiply by 2.5x... greedy capitalists!
                        prevItem$ = randomInt(prevItem$, prevItem$ * 2.5) + Number(Math.random().toFixed(2));
                        prevItemFfms = randomInt(prevItemFfms, prevItemFfms * 2);

                        extras[item] = {
                            priceDollars: prevItem$,
                            priceFfms: prevItemFfms,
                        };
                    }

                    // ? Finally, let's put it all together...
                    statelessFlights.push({
                        _id: generateObjectIdFromMs(currentHour),
                        bookerKey: isArrival ? null : firstAirport.chapterKey,
                        type: isArrival ? 'arrival' : 'departure',
                        airline: airline.name,

                        comingFrom: isArrival
                            ? secondAirport.shortName
                            : ((shuffle(airports) as InternalAirport[]).filter(a => {
                                return a.shortName != firstAirport.shortName
                            })[0]).shortName,

                        landingAt: firstAirport.shortName,
                        departingTo: isArrival ? null : secondAirport.shortName,
                        flightNumber: airline.codePrefix + getFlightNum[airline._id.toHexString()]().toString(),
                        baggage: {
                            checked: {
                                max: maxChecked,
                                prices: [...Array(maxChecked)].reduce<number[]>($ => {
                                    const prev = $.slice(-1)[0];
                                    return [
                                        ...$,
                                        // ? Greedy little airlines
                                        randomInt(prev || 0, (prev || 35) * 2)
                                    ];
                                }, []),
                            },
                            carry: {
                                max: maxCarry,
                                prices: [...Array(maxCarry)].reduce<number[]>($ => {
                                    const prev = $.slice(-1)[0];
                                    return [
                                        ...$,
                                        // ? Greedy little airlines
                                        randomInt(prev || 0, (prev || 15) * 2)
                                    ];
                                }, []),
                            },
                        },
                        ffms: randomInt(2000, 6000),
                        seats,
                        extras
                    });
                });
            });

            const getMostRecentState = (flight: StatelessFlight) => {
                if(!flight.stochasticStates)
                    throw new GuruMeditationError('expected stochastic state to exist');

                return Object.values(flight.stochasticStates).slice(-1)[0];
            };

            // ? And now we run all the flights we generated for this airport
            // ? through each stage of the markov model. For some stages, we
            // ? loop through the entire repository of flights. This results in
            // ? multiple passthroughs over the statelessFlights dataset. We do
            // ? it this way so that we can maintain memory of which flights are
            // ? using which gates and when

            // ? Stages 1 and 2: initialize things
            statelessFlights.forEach(flight => {
                let prevActiveAfter = 0;
                let done = false;

                const isArrival = flight.type == 'arrival';

                const arriveAtReceiver = randomInt(
                    currentHour,
                    // ? We do the subtraction of minutes to ensure our
                    // ? stochastic process remains within the hour. This
                    // ? assumption is crucial to the functionality of this
                    // ? API!
                    currentHour + oneHourInMs - (isArrival ? sixteenMinutesInMs : thirtyOneMinutesInMs)
                );

                // ? Initialize this flight's stochastic state
                flight.stochasticStates = {
                    '0': {
                        arriveAtReceiver,
                        departFromSender: arriveAtReceiver - randomInt(2 * oneHourInMs, 5 * oneHourInMs),
                        departFromReceiver: isArrival ? null : arriveAtReceiver + fifteenMinutesInMs,
                        // ? The flight hasn't taken off yet! (initial state)
                        status: 'scheduled',
                        gate: null
                    }
                };

                // ? Here we use a markov model to generate future flight
                // ? stochastic information states that we transition into
                // ? sequentially over time, giving API users the impression
                // ? that flight information is changing.
                // ?
                // ? There are 10 total stochastic decision making stages we run
                // ? through to generate flight state (init state + 9). These
                // ? are the first 3.

                for(let stage = 1; !done && stage < 3; ++stage) {
                    const state = { ...getMostRecentState(flight) };

                    switch(stage) {
                        case 1:
                            // ? This flight just took off!
                            prevActiveAfter = state.departFromSender;

                            // ? 80% chance this flight is not cancelled
                            if(chance() > 80) {
                                state.status = 'cancelled';
                                done = true;
                            }

                            else state.status = 'on time';

                            flight.stochasticStates[prevActiveAfter.toString()] = state;
                            break;

                        case 2:
                            // ? 75% chance this flight is not delayed
                            if(chance() > 75) {
                                prevActiveAfter = randomInt(
                                    state.arriveAtReceiver - 2 * oneHourInMs,
                                    state.departFromSender + fifteenMinutesInMs
                                );

                                state.status = 'delayed';
                                state.arriveAtReceiver += randomInt(fiveMinutesInMs, fifteenMinutesInMs);

                                if(state.departFromReceiver)
                                    state.departFromReceiver += randomInt(fiveMinutesInMs, fifteenMinutesInMs);

                                flight.stochasticStates[prevActiveAfter.toString()] = state;
                            }

                            break;

                        default:
                            throw new GuruMeditationError('unreachable stage encountered (1)');
                    }
                }
            });

            // ? Second, third, and fourth passthroughs are sequential to keep
            // ? track of gates

            // ? Stage 3: this flight's gate gets determined now
            statelessFlights.forEach(flight => {
                if(!flight.stochasticStates)
                    throw new GuruMeditationError('stage 3 encountered impossible condition');

                const recentState = getMostRecentState(flight);

                if(recentState.status == 'cancelled')
                    return;

                flight.stochasticStates[randomInt(
                    recentState.arriveAtReceiver - 2 * oneHourInMs,
                    recentState.arriveAtReceiver - fifteenMinutesInMs,
                ).toString()] = {
                    ...recentState,
                    gate: getGate()
                };
            });

            // ? Stage 4: this flight just landed!
            statelessFlights.forEach(flight => {
                if(!flight.stochasticStates)
                    throw new GuruMeditationError('stage 4 encountered impossible condition');

                const recentState = getMostRecentState(flight);

                if(recentState.status == 'cancelled')
                    return;

                let gate = recentState.gate;
                if(!gate) throw new GuruMeditationError('gate was not predetermined?!');

                // ? 50% chance this flight's gate changes
                if(chance() > 50) {
                    releaseGate(gate);
                    gate = getGate();
                }

                flight.stochasticStates[randomInt(
                    recentState.arriveAtReceiver - thirtyMinutesInMs,
                    recentState.arriveAtReceiver - fiveMinutesInMs,
                ).toString()] = {
                    ...recentState,
                    gate,
                    status: 'landed'
                };
            });

            // ? Stage 5: this flight has arrived at the gate!
            statelessFlights.forEach(flight => {
                if(!flight.stochasticStates)
                    throw new GuruMeditationError('stage 5 encountered impossible condition');

                const recentState = getMostRecentState(flight);

                if(recentState.status == 'cancelled')
                    return;

                let gate = recentState.gate;
                if(!gate) throw new GuruMeditationError('gate was not predetermined?!');

                // ? 15% chance this flight's gate changes again
                if(chance() > 85) {
                    releaseGate(gate);
                    gate = getGate();
                }

                flight.stochasticStates[recentState.arriveAtReceiver] = {
                    ...recentState,
                    gate,
                    status: 'arrived'
                };
            });

            // ? Stages 6-10: wraps things up
            statelessFlights.forEach(flight => {
                if(!flight.stochasticStates)
                    throw new GuruMeditationError('stage 6-9 encountered impossible condition');

                const recentState = getMostRecentState(flight);

                if(recentState.status == 'cancelled')
                    return;

                let prevActiveAfter = 0;
                let done = false;

                const isArrival = flight.type == 'arrival';

                for(let stage = 6; !done && stage < 10; ++stage) {
                    const state = { ...recentState };

                    switch(stage) {
                        case 6:
                            if(!isArrival) continue;

                            // ? This flight is done!
                            prevActiveAfter = currentHour + oneHourInMs;
                            state.status = 'past';
                            state.gate = null;
                            done = true;
                            break;

                        case 7:
                            if(isArrival)
                                throw new GuruMeditationError('arrival type encountered in departure-only model');

                            // ? This flight has started boarding
                            prevActiveAfter = state.arriveAtReceiver + randomInt(threeMinutesInMs, tenMinutesInMs);
                            state.status = 'boarding';
                            break;

                        case 8:
                            // ? This flight just departed!
                            if(!state.departFromReceiver)
                                throw new GuruMeditationError('illegal departure state encountered in model (1)');

                            prevActiveAfter = state.departFromReceiver;
                            state.status = 'departed';
                            break;

                        case 9:
                            // ? This flight is done!
                            if(!state.departFromReceiver)
                                throw new GuruMeditationError('illegal departure state encountered in model (2)');

                            prevActiveAfter = state.departFromReceiver + randomInt(2 * oneHourInMs, 5 * oneHourInMs);
                            state.status = 'past';
                            state.gate = null;
                            break;

                        default:
                            throw new GuruMeditationError('unreachable stage encountered (2)');
                    }

                    flight.stochasticStates[prevActiveAfter.toString()] = state;
                }
            });

            // ? Push this airport's flights into the main repository
            flights.push(...statelessFlights as WithId<InternalFlight>[]);
        });
    });

    try {
        if(!flights.length)
            return 0;

        // eslint-disable-next-line no-console
        !silent && console.info(`api   - Committing ${flights.length} flights into database...`);

        // ? All the main repository of flight data to the database in one shot!
        const operation = await flightDb.insertMany(flights);

        if(!operation.result.ok)
            throw new FlightGenerationError('flight insertion failed');

        if(operation.insertedCount != flights.length)
            throw new GuruMeditationError('assert failed: operation.insertedCount != totalHoursToGenerate');

        // eslint-disable-next-line no-console
        !silent && console.info(`api   - Operation completed successfully!`);

        return operation.insertedCount;
    }

    catch(e) { throw (e instanceof AppError ? e : new FlightGenerationError(e)) }
}
