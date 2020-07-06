import { ObjectId } from 'mongodb'
import { getEnv } from 'universe/backend/env'
import { getDb } from 'universe/backend/db'
import { isArray } from 'util'
import { getClientIp } from 'request-ip'
import * as Time from 'multiverse/relative-random-time'
import { shuffle } from 'fast-shuffle'
import randomInt from 'random-int'
import uniqueRandomArray from 'unique-random-array'

import {
    IdTypeError,
    ApiKeyTypeError,
    TimeTypeError,
    NotFoundError,
    UpsertFailedError,
    GuruMeditationError,
    ValidationError,
    AppError,
} from 'universe/backend/error'

import {
    NextParamsRR,
    RequestLogEntry,
    LimitedLogEntry,
    ApiKey,
    NoFlyListEntry,
    InternalAirport,
    InternalAirline,
    InternalFlight,
    PublicFlight
} from 'types/global'

import type { NextApiRequest } from 'next'
import type { WithId } from 'mongodb'

let requestCounter = 0;

export const MIN_RESULT_PER_PAGE = 15;
export const NULL_KEY = '00000000-0000-0000-0000-000000000000';
export const DUMMY_KEY = '12349b61-83a7-4036-b060-213784b491';

export type GetFliByIdParams = {
    ids: Array<ObjectId>;
    key: string;
};

const matchableStrings = [
    'type',
    'airline',
    'senderAirport',
    'receiverAirport',
    'flightNumber',
    'baggage',
    'ffms',
    'bookable',
    'depart_from_sender',
    'arrive_at_receiver',
    'depart_from_receiver',
    'status',
    'gate',
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

type PartialPublicFlight = Omit<InternalFlight, 'booker_key'> & Pick<PublicFlight, 'flight_id' | 'bookable'>;

const isNumber = (number: unknown) => typeof number == 'number';
const isObject = (object: unknown) => !isArray(object) && object !== null && typeof object == 'object';

const setStochasticFlightState = (flight: PartialPublicFlight): PublicFlight => {
    const { stochasticStates, ...newFlight } = flight;
    const now = Date.now();
    let lastStateKey: string | null = null;

    Object.keys(stochasticStates).some(stateTime => {
        const stateTimeNumber = Number(stateTime);

        if(!isNumber(stateTimeNumber))
            throw new AppError('non-numeric state time encountered somehow');

        if(stateTimeNumber < now) {
            lastStateKey = stateTimeNumber.toString();
            return false;
        }

        return true;
    });

    if(lastStateKey === null)
        throw new AppError('stochastic state resolution failed');

    return {
        ...newFlight,
        ...stochasticStates[lastStateKey]
    };
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

    const flights = await (await getDb()).collection<WithId<InternalFlight>>('flights').aggregate<PartialPublicFlight>([
        { $match: { _id: { $in: ids }}},
        {
            $addFields: {
                flight_id: '$_id',
                bookable: { $cond: { if: { $eq: ['$booker_key', key] }, then: true, else: false }},
            }
        },
        { $project: { _id: false, booker_key: false }},
    ]).toArray();

    return flights.map(flight => setStochasticFlightState(flight));
}

export async function searchFlights(params: SeaFliParams) {
    const { key, after, match, regexMatch, sort } = params;

    if(!key || typeof key != 'string')
        throw new ApiKeyTypeError();

    if(after !== null && !(after instanceof ObjectId))
        throw new IdTypeError(after);

    if(!isObject(match) || !isObject(regexMatch))
        throw new ValidationError('missing match and/or regexMatch');

    const matchKeys = Object.keys(match);
    const regexMatchKeys = Object.keys(regexMatch);

    const matchKeysAreValid = () => matchKeys.every(k => {
        const v = match[k];

        return !isArray(v)
            && matchableStrings.includes(k)
            && (typeof(v) == 'string' || (isObject(v) && Object.keys(v).every(subk =>
                matchableSubStrings.includes(subk) && typeof (v as Record<string, unknown>)[subk] == 'string')));
    });

    const regexMatchKeysAreValid = () => regexMatchKeys.every(k =>
        matchableStrings.includes(k) && typeof match[k] == 'string'
    );

    if(matchKeys.length && !matchKeysAreValid)
        throw new AppError('invalid match object');

    if(regexMatchKeys.length && !regexMatchKeysAreValid)
        throw new AppError('invalid regexMatch object');

    const flights = await (await getDb()).collection<WithId<InternalFlight>>('flights').aggregate<PartialPublicFlight>([
        { $match: { _id: { $in: ids }}},
        {
            $addFields: {
                flight_id: '$_id',
                bookable: { $cond: { if: { $eq: ['$booker_key', key] }, then: true, else: false }},
            }
        },
        { $project: { _id: false, booker_key: false }},
    ]).toArray();

    return flights.map(flight => setStochasticFlightState(flight));
}

export async function generateFlights() {
    // TODO (use a MongoDb pipeline for this)
    // TODO (also, if no keys, no airports, or no airlines, then stop script and output error)
}
