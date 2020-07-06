import { ObjectId } from 'mongodb'
import { getEnv } from 'universe/backend/env'
import { getDb } from 'universe/backend/db'
import { isUndefined, isArray, isNumber } from 'util'
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
} from 'universe/backend/error'

import type {
    NextParamsRR,
    RequestLogEntry,
    LimitedLogEntry,
    ApiKey
} from 'types/global'

import type { NextApiRequest } from 'next'
import type { WithId, AggregationCursor } from 'mongodb'

let requestCounter = 0;

export const MIN_RESULT_PER_PAGE = 15;
export const NULL_KEY = '00000000-0000-0000-0000-000000000000';
export const DUMMY_KEY = '12349b61-83a7-4036-b060-213784b491';

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

export async function generateFlightsForHour(epochHour: number) {
    // TODO (use a MongoDb pipeline for this)
    // TODO (also, if no keys, no airports, or no airlines, then stop script and output error)
    void epochHour;
}

export async function getNoFlyList() {
    // TODO
}

export async function getAirports() {
    // TODO
}

export async function getAirlines() {
    // TODO
}

export async function getFlightsById() {
    // TODO
}

export async function searchFlights() {
    // TODO
}
