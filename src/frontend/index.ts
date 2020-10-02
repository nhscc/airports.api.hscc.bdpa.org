import { fetch } from 'multiverse/quick-fetch'
import { getEnv } from 'universe/backend/env'
import { AppError } from 'universe/backend/error'

import type { FetchConfig } from 'multiverse/quick-fetch'

type FetchFn = (...params: Parameters<typeof fetch>) => ReturnType<typeof fetch>;

export type UpsOveEntForParams = {
    toolKey: string;
    json: Record<string, unknown> | null;
    code: number | null;
    targetTeam: string;
};

export type FinOneFliOrNulParams = {
    toolKey: string;
    criteria: Record<string, unknown>;
};

const fetcher = (fetchFn: FetchFn, options: FetchConfig & { toolKey?: string }) =>
    (...params: Parameters<FetchFn>) => fetchFn(params[0], params[1] ?? options);

const api = async (endpoint: string, fetchFn: FetchFn) => {
    const rawApiUrl = getEnv().API_ROOT_URI;

    if(!rawApiUrl)
        throw new AppError('illegal environment detected, check environment variables');

    const apiUri = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;
    return fetchFn(`${apiUri}/${endpoint}`);
};

const PUT = (toolKey: string) => fetcher(fetch.put, { toolKey })
const GET = (toolKey: string) => fetcher(fetch.get, { toolKey });

export async function isValidToolKey(toolKey: string) {
    return (await api('admin/response-override', GET(toolKey))).res.status != 401;
}

export async function findOneFlightOrNull({ toolKey, criteria }: FinOneFliOrNulParams) {
    const serialized = encodeURIComponent(JSON.stringify(criteria));
    const { data, res } = await api(`admin/find-one/${serialized}`, PUT(toolKey));

    return { error: data.error, res, flightId: data.flight_id || null };
}

export async function getCurrentAndNextFlightStates({ toolKey, flightId }: { toolKey: string, flightId: string }) {
    const  { data, res } = await api(`admin/get-states/${flightId}`, PUT(toolKey));
    const { currentState, nextState } = data;

    return { error: data.error, res, currentState, nextState };
}

export async function forceNextFlightState({ toolKey, flightId }: { toolKey: string, flightId: string }) {
    const  { data, res } = await api(`admin/advance-state/${flightId}`, PUT(toolKey));
    const { newCurrentState, newNextState } = data;

    return { error: data.error, res, newCurrentState, newNextState };
}

export async function upsertOverrideEntryFor({ toolKey, json, code, targetTeam }: UpsOveEntForParams) {
    const serialized = encodeURIComponent(JSON.stringify(json));
    const { data, res } = await api(`admin/response-override/${targetTeam}/${code}/${serialized}`, PUT(toolKey));

    return { error: data.error, res };
}

export async function deleteOverrideEntryFor({ toolKey, targetTeam }: { toolKey: string, targetTeam: string }) {
    const  { data, res } = await api(`admin/delete-override/${targetTeam}`, PUT(toolKey));
    return { error: data.error, res };
}
