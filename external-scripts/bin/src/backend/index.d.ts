import { ObjectId } from 'mongodb';
import type { NextApiRequest } from 'next';
import type { WithId } from 'mongodb';
import type { NextParamsRR, NoFlyListEntry, InternalAirport, InternalAirline, PublicFlight } from 'types/global';
export declare const MIN_RESULT_PER_PAGE = 15;
export declare const MIN_SEATS_PER_PLANE = 10;
export declare const SEATS_PER_PLANE = 100;
export declare const NULL_KEY = "00000000-0000-0000-0000-000000000000";
export declare const DUMMY_KEY = "12349b61-83a7-4036-b060-213784b491";
export declare type GetFliByIdParams = {
    ids: ObjectId[];
    key: string;
};
export declare type SeaFliParams = {
    key: string;
    after: ObjectId | null;
    match: {
        [specifier: string]: string | number | {
            [subspecifier in '$gt' | '$lt' | '$gte' | '$lte']?: string | number;
        };
    };
    regexMatch: {
        [specifier: string]: string;
    };
    sort: 'asc' | 'desc';
};
export declare function isKeyAuthentic(key: string): Promise<boolean>;
/**
 * Note that this async function does not have to be awaited. It's fire and
 * forget!
 */
export declare function addToRequestLog({ req, res }: NextParamsRR): Promise<void>;
export declare function isRateLimited(req: NextApiRequest): Promise<{
    limited: boolean;
    retryAfter: number;
}>;
export declare function isDueForContrivedError(): boolean;
export declare function getNoFlyList(): Promise<WithId<NoFlyListEntry>[]>;
export declare function getAirports(): Promise<WithId<InternalAirport>[]>;
export declare function getAirlines(): Promise<WithId<InternalAirline>[]>;
export declare function getFlightsById(params: GetFliByIdParams): Promise<PublicFlight[]>;
export declare function searchFlights(params: SeaFliParams): Promise<PublicFlight[]>;
export declare function generateFlights(): Promise<number>;
