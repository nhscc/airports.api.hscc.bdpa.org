import { MongoClient, Db, WithId } from 'mongodb'
import { NULL_KEY, DUMMY_KEY } from 'universe/backend'
import { getDb, setDb, destroyDb, initializeDb } from 'universe/backend/db'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { populateEnv } from 'universe/dev-utils'
import cloneDeep from 'clone-deep'
import * as Time from 'multiverse/relative-random-time'
import { getEnv } from 'universe/backend/env'

import type {
    ApiKey,
    InternalFlight,
    InternalAirport,
    NoFlyListEntry,
    InternalAirline,
    RequestLogEntry,
    LimitedLogEntry,
} from 'types/global'

populateEnv();

export type DummyDbData = {
    keys: ApiKey[];
    flights: InternalFlight[];
    airports: InternalAirport[];
    noFlyList: NoFlyListEntry[];
    airlines: InternalAirline[];
};

export type HydratedDummyDbData = {
    [P in keyof DummyDbData]: DummyDbData[P] extends (Array<infer T> | undefined)
        ? WithId<T>[]
        : WithId<DummyDbData[P]>;
};

export const unhydratedDummyDbData: DummyDbData = {
    keys: [
        {
            owner: 'chapter1',
            key: DUMMY_KEY
        },
        {
            owner: 'chapter2',
            key: 'xyz4c4d3-294a-4086-9751-f3fce82da'
        },
        {
            owner: 'chapter3',
            key: '35b6ny53-83a7-gf0r-b060-b4ywayrht'
        },
        {
            owner: 'chapter4',
            key: 'h90wgbrd-294a-536h-9751-rydmjetgg'
        },
    ],
    airports: [
        {
            name: 'First Chapter Airport',
            shortName: 'F1A',
            city: 'Los Angeles',
            state: 'CA',
            country: 'USA',
        },
        {
            name: 'Second Chapter Airport',
            shortName: 'SCA',
            city: 'Chicago',
            state: 'IL',
            country: 'USA',
        },
        {
            name: 'Third Chapter Airport',
            shortName: 'TC3',
            city: 'New York',
            state: 'NY',
            country: 'USA',
        },
        {
            name: 'Four Chapter Airport',
            shortName: 'CHF',
            city: 'Atlanta',
            state: 'GA',
            country: 'USA',
        },
    ],
    airlines: [
        {
            name: 'Delta',
            codePrefix: 'D',
        },
        {
            name: 'American',
            codePrefix: 'A',
        },
        {
            name: 'United',
            codePrefix: 'U',
        },
        {
            name: 'Southwest',
            codePrefix: 'S',
        },
        {
            name: 'Frontier',
            codePrefix: 'F',
        },
        {
            name: 'Spirit',
            codePrefix: 'P',
        },
    ],
    noFlyList: [
        {
            name: {
                first: 'Donald',
                middle: 'John',
                last: 'Trump'
            },
            sex: 'male',
            birthdate: {
                day: 14,
                month: 6,
                year: 1946
            }
        },
        {
            name: {
                first: 'Restricted',
                middle: 'User',
                last: 'Flier'
            },
            sex: 'male',
            birthdate: {
                day: 25,
                month: 12,
                year: 1985
            }
        }
    ],
    // ! Note that dummy times here don't make sense; they're only for testing!
    flights: [
        {
            booker_key: DUMMY_KEY,
            type: 'arrival',
            airline: 'Delta',
            senderAirport: 'F1A',
            receiverAirport: 'SCA',
            flightNumber: 'D8496',
            baggage: {
                checked: {
                    max: 2,
                    prices: [30, 50]
                },
                carry: {
                    max: 2,
                    prices: [0, 0]
                }
            },
            ffms: 1500,
            seats: {
                economy: {
                    total: 100,
                    priceDollars: 250.00,
                    priceFfms: 3000,
                },
                economyPlus: {
                    total: 20,
                    priceDollars: 350.00,
                    priceFfms: 5000,
                },
                exitRow: {
                    total: 18,
                    priceDollars: 325.00,
                    priceFfms: 4000,
                },
                firstClass: {
                    total: 30,
                    priceDollars: 1000.00,
                    priceFfms: 10000,
                }
            },
            extras: {
                wifi: {
                    priceDollars: 15.99,
                    priceFfms: 500
                },
                'extra food': {
                    priceDollars: 24.50,
                    priceFfms: 800
                },
            },
            stochasticStates: {
                [Date.now()]: {
                    depart_from_sender: Time.nearFuture(),
                    arrive_at_receiver: Time.nearFuture(),
                    depart_from_receiver: null,
                    status: 'scheduled',
                    gate: null,
                },
                [Time.nearFuture()]: {
                    depart_from_sender: Time.nearFuture(),
                    arrive_at_receiver: Time.nearFuture(),
                    depart_from_receiver: null,
                    status: 'landed',
                    gate: 'A1',
                },
            }
        },
        {
            booker_key: 'xyz4c4d3-294a-4086-9751-f3fce82da',
            type: 'departure',
            airline: 'United',
            senderAirport: 'CHF',
            receiverAirport: 'TC3',
            flightNumber: 'U1234',
            baggage: {
                checked: {
                    max: 4,
                    prices: [35, 50, 100, 100]
                },
                carry: {
                    max: 3,
                    prices: [0, 25, 100]
                }
            },
            ffms: 5000,
            seats: {
                economy: {
                    total: 75,
                    priceDollars: 370.00,
                    priceFfms: 30000,
                },
                economyPlus: {
                    total: 30,
                    priceDollars: 400.00,
                    priceFfms: 50000,
                },
                exitRow: {
                    total: 10,
                    priceDollars: 420.00,
                    priceFfms: 40000,
                },
                firstClass: {
                    total: 15,
                    priceDollars: 1250.57,
                    priceFfms: 100000,
                }
            },
            extras: {
                wifi: {
                    priceDollars: 8.99,
                    priceFfms: 600
                },
                blanket: {
                    priceDollars: 2.99,
                    priceFfms: 100
                },
                pillow: {
                    priceDollars: 2.99,
                    priceFfms: 100
                },
            },
            stochasticStates: {
                [Date.now()]: {
                    depart_from_sender: Time.farFuture(),
                    arrive_at_receiver: Time.farFuture(),
                    depart_from_receiver: Time.farFuture(),
                    status: 'boarding',
                    gate: 'B2',
                },
                [Time.farFuture()]: {
                    depart_from_sender: Time.farFuture(),
                    arrive_at_receiver: Time.farFuture(),
                    depart_from_receiver: Time.farFuture(),
                    status: 'departed',
                    gate: 'C3',
                },
            }
        },
    ]
};

const count = getEnv().RESULTS_PER_PAGE * 2.5;

// ? Rapidly add a bunch of flights for testing purposes
unhydratedDummyDbData.flights = [...Array(Math.floor(count))].map((_, ndx) => {
    return cloneDeep(unhydratedDummyDbData.flights[ndx % unhydratedDummyDbData.flights.length]);
});

const specialFlightIndex = count - 2;
const specialFlight = unhydratedDummyDbData.flights[specialFlightIndex];

specialFlight.airline = 'Spirit';
specialFlight.ffms = 100000000;
specialFlight.stochasticStates = {
    0: {
        depart_from_sender: Time.farFuture(),
        arrive_at_receiver: Time.farFuture(),
        depart_from_receiver: Time.farFuture(),
        status: 'boarding',
        gate: 'B2',
    },
    1: {
        depart_from_sender: 500,
        arrive_at_receiver: 700,
        depart_from_receiver: 1000,
        status: 'past',
        gate: null,
    },
};

export async function hydrateDb(db: Db, data: DummyDbData): Promise<HydratedDummyDbData> {
    const newData = cloneDeep(data);

    // Insert keys
    if(newData.keys)
        await db.collection<WithId<ApiKey>>('keys').insertMany(newData.keys);

    // Insert airports
    if(newData.airports)
        db.collection<WithId<InternalAirport>>('airports').insertMany(newData.airports);

    // Insert airlines
    if(newData.airlines)
        db.collection<WithId<InternalAirline>>('airlines').insertMany(newData.airlines);

    // Insert no fly list
    if(newData.noFlyList)
        db.collection<WithId<NoFlyListEntry>>('no-fly-list').insertMany(newData.noFlyList);

    // Insert flight data
    if(newData.flights)
        db.collection<WithId<InternalFlight>>('flights').insertMany(newData.flights);

    // Push new requests to the log and update limited-log-mview accordingly

    await db.collection<WithId<RequestLogEntry>>('request-log').insertMany([...Array(22)].map((_, ndx) => ({
        ip: '1.2.3.4',
        key: ndx % 2 ? null : NULL_KEY,
        method: ndx % 3 ? 'GET' : 'POST',
        route: 'fake/route',
        time: Date.now() + 10**6,
        resStatusCode: 200,
     })));

    await db.collection<WithId<LimitedLogEntry>>('limited-log-mview').insertMany([
        { ip: '1.2.3.4', until: Date.now() + 1000 * 60 * 15 } as LimitedLogEntry,
        { ip: '5.6.7.8', until: Date.now() + 1000 * 60 * 15 } as LimitedLogEntry,
        { key: NULL_KEY, until: Date.now() + 1000 * 60 * 60 } as LimitedLogEntry
    ]);

    return newData as HydratedDummyDbData;
}

export function setupJest() {
    const server = new MongoMemoryServer();
    let connection: MongoClient;
    let hydratedData: HydratedDummyDbData;
    let oldEnv: typeof process.env;

    beforeAll(async () => {
        connection = await MongoClient.connect(await server.getUri(), { useUnifiedTopology: true });
        const db = connection?.db();

        if(!db)
            throw new Error('unable to connect to database');

        setDb(db);
    });

    beforeEach(async () => {
        oldEnv = process.env;
        const db = await getDb();
        await initializeDb(db);
        hydratedData = await hydrateDb(db, unhydratedDummyDbData);
    });

    afterEach(async () => {
        process.env = oldEnv;
        const db = await getDb();
        await destroyDb(db);
    })

    afterAll(async () => {
        connection.isConnected() && await connection.close();
        await server.stop();
    });

    return {
        getDb,
        getConnection: () => connection,
        getHydratedData: () => hydratedData
    };
}
