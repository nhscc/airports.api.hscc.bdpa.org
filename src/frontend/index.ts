import { fetchEndpoint } from 'multiverse/fetch-endpoint'
import { getEnv } from 'universe/backend/env'
import { AppError } from 'universe/backend/error'

import type { Options } from 'multiverse/fetch-endpoint'

type FetchFn = (...params: Parameters<typeof fetchEndpoint>) => ReturnType<typeof fetchEndpoint>;

export type UpsOveEntForParams = {
    adminKey: string;
    json: Record<string, unknown> | null;
    code: number | null;
    targetTeam: string;
};

export type FinOneFliOrNulParams = {
    adminKey: string;
    criteria: Record<string, unknown>;
};

const fetcher = (fetchFn: FetchFn, options: Options & { adminKey?: string }) =>
    (...params: Parameters<FetchFn>) => fetchFn(params[0], params[1] ?? options);

const api = async (endpoint: string, fetchFn: FetchFn) => {
    const rawApiUrl = getEnv().API_ROOT_URI;

    if(!rawApiUrl)
        throw new AppError('illegal environment detected, check environment variables');

    const apiUri = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;
    return fetchFn(`${apiUri}/${endpoint}`);
};

const PUT = (adminKey: string) => fetcher(fetchEndpoint.put, { adminKey })
const GET = (adminKey: string) => fetcher(fetchEndpoint.get, { adminKey });

export async function isValidAdminKey(adminKey: string) {
    return (await api('admin/response-override', GET(adminKey))).res.status != 401;
}

export async function findOneFlightOrNull({ adminKey, criteria }: FinOneFliOrNulParams) {
    const serialized = encodeURIComponent(JSON.stringify(criteria));
    const { data, res } = await api(`admin/find-one/${serialized}`, PUT(adminKey));

    return { error: data.error, res, flightId: data.flight_id || null };
}

export async function getCurrentAndNextFlightStates({ adminKey, flightId }: { adminKey: string, flightId: string }) {
    const  { data, res } = await api(`admin/get-states/${flightId}`, PUT(adminKey));
    const { currentState, nextState } = data;

    return { error: data.error, res, currentState, nextState };
}

export async function forceNextFlightState({ adminKey, flightId }: { adminKey: string, flightId: string }) {
    const  { data, res } = await api(`admin/advance-state/${flightId}`, PUT(adminKey));
    const { newCurrentState, newNextState } = data;

    return { error: data.error, res, newCurrentState, newNextState };
}

export async function upsertOverrideEntryFor({ adminKey, json, code, targetTeam }: UpsOveEntForParams) {
    const serialized = encodeURIComponent(JSON.stringify(json));
    const { data, res } = await api(`admin/response-override/${targetTeam}/${code}/${serialized}`, PUT(adminKey));

    return { error: data.error, res };
}

export async function deleteOverrideEntryFor({ adminKey, targetTeam }: { adminKey: string, targetTeam: string }) {
    const  { data, res } = await api(`admin/delete-override/${targetTeam}`, PUT(adminKey));
    return { error: data.error, res };
}
