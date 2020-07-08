import { MongoClient, Db, WithId } from 'mongodb';
import { getDb } from 'universe/backend/db';
import type { ApiKey, InternalFlight, InternalAirport, NoFlyListEntry, InternalAirline, InternalInfo, PublicFlight } from 'types/global';
export declare const EXPAND_RESULTS_BY_MULT = 2.5;
export declare type DummyDbData = {
    keys: ApiKey[];
    flights: InternalFlight[];
    airports: InternalAirport[];
    noFlyList: NoFlyListEntry[];
    airlines: InternalAirline[];
    info: InternalInfo;
};
export declare type HydratedDummyDbData = {
    [P in keyof DummyDbData]: DummyDbData[P] extends (Array<infer T> | undefined) ? WithId<T>[] : WithId<DummyDbData[P]>;
};
export declare const convertIFlightToPFlight: (flight: WithId<InternalFlight>) => PublicFlight;
export declare const unhydratedDummyDbData: DummyDbData;
export declare function hydrateDb(db: Db, data: DummyDbData): Promise<HydratedDummyDbData>;
export declare function setupJest(): {
    getDb: typeof getDb;
    getConnection: () => MongoClient;
    getHydratedData: () => HydratedDummyDbData;
};
