import { ObjectId } from 'mongodb'
import { getEnv } from 'universe/backend/env'
import { getDb, pipelines } from 'universe/backend/db'
import { isArray } from 'util'
import { getClientIp } from 'request-ip'
import { shuffle } from 'fast-shuffle'
import * as Time from 'multiverse/relative-random-time'
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
    InternalInfo
} from 'types/global'

const isObject = (object: unknown) => !isArray(object) && object !== null && typeof object == 'object';

let requestCounter = 0;

export const MIN_RESULT_PER_PAGE = 15;
export const NULL_KEY = '00000000-0000-0000-0000-000000000000';
export const DUMMY_KEY = '12349b61-83a7-4036-b060-213784b491';

export type GetFliByIdParams = {
    ids: Array<ObjectId>;
    key: string;
};

const primaryMatchTargets = [
    'type',
    'airline',
    'senderAirport',
    'receiverAirport',
    'flightNumber',
    'baggage',
    'ffms',
    'bookable',
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

export type SeaFliParams = {
    key: string;
    after: ObjectId | null;
    match: {
        [specifier: string]: string | number | {
            [subspecifier in '$gt' | '$lt' | '$gte' | '$lte']?: string | number
        }
    };
    regexMatch: {
        [specifier: string]: string
    };
    sort: 'asc' | 'desc';
};

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
    }).toArray();
}

export async function getAirlines() {
    return (await getDb()).collection<WithId<InternalAirline>>('airlines').find().sort({ id: 1 }).project({
        _id: false,
    }).toArray();
}

export async function getFlightsById(params: GetFliByIdParams) {
    const { ids, key } = params;

    if(!Array.isArray(ids))
        throw new IdTypeError();

    if(ids.length > getEnv().RESULTS_PER_PAGE)
        throw new AppError('too many flight_ids specified');

    if(!ids.every(id => id instanceof ObjectId))
        throw new IdTypeError();

    if(!key || typeof key != 'string')
        throw new ApiKeyTypeError();

    if(!ids.length)
        return [];

    return await (await getDb()).collection<WithId<InternalFlight>>('flights').aggregate<PublicFlight>([
        { $match: { _id: { $in: ids }}},
        ...pipelines.resolveFlightState(key)
    ]).toArray();
}

export async function searchFlights(params: SeaFliParams) {
    const { key, after, match, regexMatch, sort } = params;

    if(!key || typeof key != 'string')
        throw new ApiKeyTypeError();

    if(after !== null && !(after instanceof ObjectId))
        throw new IdTypeError(after);

    if(typeof sort != 'string' || !['asc', 'desc'].includes(sort))
        throw new ValidationError('invalid sort');

    if(!isObject(match) || !isObject(regexMatch))
        throw new ValidationError('missing match and/or regexMatch');

    const matchKeys = Object.keys(match);
    const regexMatchKeys = Object.keys(regexMatch);

    const matchKeysAreValid = () => matchKeys.every(ky => {
        const val = match[ky];
        let valNotEmpty = false;

        const test = () => Object.keys(val).every(subky => (valNotEmpty = true) && matchableSubStrings.includes(subky)
            && typeof (val as Record<string, unknown>)[subky] == 'number');

        return !isArray(val)
            && matchableStrings.includes(ky)
            && (['number', 'string'].includes(typeof(val)) || (isObject(val) && test() && valNotEmpty));
    });

    const regexMatchKeysAreValid = () => regexMatchKeys.every(k =>
        matchableStrings.includes(k) && ['string', 'number'].includes(typeof regexMatch[k]));

    if(matchKeys.length && !matchKeysAreValid())
        throw new AppError('invalid match object');

    if(regexMatchKeys.length && !regexMatchKeysAreValid())
        throw new AppError('invalid regexMatch object');

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
        { $sort: { _id: sort == 'asc' ? 1 : -1 }},
        { $limit: getEnv().RESULTS_PER_PAGE },
        ...pipelines.resolveFlightState(key),
        ...(Object.keys(secondaryMatchers).length ? [{ $match: { ...secondaryMatchers }}] : []),
    ];

    return await (await getDb()).collection<InternalFlight>('flights').aggregate<PublicFlight>(pipeline).toArray();
}

export async function generateFlights() {
    const db = await getDb();
    const airports = await db.collection<WithId<InternalAirport>>('airports').find().toArray();
    const airlines = await db.collection<WithId<InternalAirline>>('airlines').find().toArray();
    const info = await db.collection('info').find().next() as WithId<InternalInfo>;

    const flightDb = db.collection<WithId<InternalFlight>>('flights');

    if(!airports.length || !airlines.length)
        throw new FlightGenerationError('cannot generate flights without airports and airlines');

    let objectIdCounter = randomInt(2**10, 2**24 - 1);
    const objectIdRandom = pseudoRandomBytes(5).toString('hex');
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const oneHourInMs = 1000 * 60 * 60;

    const hourLevelMsDilation = (epoch: number) => Math.floor(epoch / oneHourInMs) * oneHourInMs;

    // * See: https://docs.mongodb.com/manual/reference/method/ObjectId/#ObjectId
    const generateObjectIdFromMs = (epoch: number) => {
        return new ObjectId(Math.floor((Date.now() + epoch) / 1000).toString(16)
            + objectIdRandom
            + (++objectIdCounter).toString(16));
    };

    // ? Delete any entries created more than 30 days from today
    await flightDb.deleteMany({
        _id: { $lt: generateObjectIdFromMs(-thirtyDaysInMs) }
    });

    // ? Determine how many hours (if any) need flights generated for them
    const lastFlightId = (await flightDb.find().sort({ _id: -1 }).limit(1).next())?._id ?? new ObjectId();
    const lastFlightHourMs = hourLevelMsDilation(lastFlightId.getTimestamp().getTime());
    const totalHoursToGenerate = (hourLevelMsDilation(Date.now() + thirtyDaysInMs) - lastFlightHourMs) / oneHourInMs;

    if(!totalHoursToGenerate)
        return 0;

    const flights: InternalFlight[] = [];
    let prevFlightType: string;

    [...Array(totalHoursToGenerate)].forEach((_, i) => {
        const flightType = prevFlightType = prevFlightType == 'arrival' ? 'departure' : 'arrival';
        const currentHour = lastFlightHourMs + oneHourInMs + i * oneHourInMs;

        // ? Here we use a markov model to generate future flight stochastic
        // ? information states that we transition into sequentially over time,
        // ? giving API users the impression that flight information is changing
        // ? randomly (like real flights do)

        const airportGatePool: { [objectId: string]: string[] } = {};
        const sourceDestPairs: { src: ObjectId, dst: ObjectId }[] = [];
        const states: InternalFlight['stochasticStates'] = {};

        // 1. Determine this flight's initial (0) state

        // 2.

        return {

        };
    });

    try {
        const operation = await flightDb.insertMany(flights);

        if(!operation.result.ok)
            throw new FlightGenerationError('flight insertion failed');

        if(operation.insertedCount != totalHoursToGenerate)
            throw new GuruMeditationError('assert failed: operation.insertedCount != totalHoursToGenerate');

        return operation.insertedCount;
    }

    catch(e) {
        throw (e instanceof AppError ? e : new FlightGenerationError(e));
    }
}
