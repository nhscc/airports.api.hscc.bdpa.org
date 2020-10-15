import { MongoClient } from 'mongodb'
import { NULL_KEY, DUMMY_KEY } from 'universe/backend'
import { getDb, setClientAndDb, destroyDb, initializeDb, getDbClient } from 'universe/backend/db'
import { MongoMemoryServer } from 'mongodb-memory-server'
import cloneDeep from 'clone-deep'
import { nearFuture, farFuture } from 'relative-random-time'
import { getEnv } from 'universe/backend/env'

import type { Db, WithId } from 'mongodb'

import type {
    ApiKey,
    InternalFlight,
    InternalAirport,
    NoFlyListEntry,
    InternalAirline,
    RequestLogEntry,
    LimitedLogEntry,
    InternalInfo,
    PublicFlight,
} from 'types/global'

export const EXPAND_RESULTS_BY_MULT = 2.5;

export type DummyDbData = {
    keys: ApiKey[];
    flights: InternalFlight[];
    airports: InternalAirport[];
    noFlyList: NoFlyListEntry[];
    airlines: InternalAirline[];
    info: InternalInfo;
};

export type HydratedDummyDbData = {
    [P in keyof DummyDbData]: DummyDbData[P] extends (Array<infer T> | undefined)
        ? WithId<T>[]
        : WithId<DummyDbData[P]>;
};

export const convertIFlightToPFlight = (flight: WithId<InternalFlight>): PublicFlight => {
    const { _id, bookerKey, stochasticStates, ...flightData } = flight;

    return {
        flight_id: _id.toHexString(),
        bookable: flight.type == 'arrival' ? false : bookerKey == DUMMY_KEY,
        ...flightData,
        ...Object.entries(stochasticStates).reduce((prev, entry) => {
            if(Number(entry[0]) <= Date.now())
                return entry[1];
            else
                return prev;
        }, Object.values(stochasticStates)[0])
    }
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
            chapterKey: DUMMY_KEY
        },
        {
            name: 'Second Chapter Airport',
            shortName: 'SCA',
            city: 'Chicago',
            state: 'IL',
            country: 'USA',
            chapterKey: 'xyz4c4d3-294a-4086-9751-f3fce82da'
        },
        {
            name: 'Third Chapter Airport',
            shortName: 'TC3',
            city: 'New York',
            state: 'NY',
            country: 'USA',
            chapterKey: '35b6ny53-83a7-gf0r-b060-b4ywayrht'
        },
        {
            name: 'Four Chapter Airport',
            shortName: 'CHF',
            city: 'Atlanta',
            state: 'GA',
            country: 'USA',
            chapterKey: 'h90wgbrd-294a-536h-9751-rydmjetgg'
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
            bookerKey: DUMMY_KEY,
            type: 'arrival',
            airline: 'Delta',
            comingFrom: 'SCA',
            landingAt: 'F1A',
            departingTo: 'TC3',
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
                '0': {
                    departFromSender: nearFuture(),
                    arriveAtReceiver: nearFuture(),
                    departFromReceiver: null,
                    status: 'scheduled',
                    gate: null,
                },
                [nearFuture().toString()]: {
                    departFromSender: nearFuture(),
                    arriveAtReceiver: nearFuture(),
                    departFromReceiver: null,
                    status: 'landed',
                    gate: 'A1',
                },
            }
        },
        {
            bookerKey: null,
            type: 'departure',
            airline: 'United',
            comingFrom: 'CHF',
            landingAt: 'TC3',
            departingTo: null,
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
                '0': {
                    departFromSender: farFuture(),
                    arriveAtReceiver: farFuture(),
                    departFromReceiver: farFuture(),
                    status: 'boarding',
                    gate: 'B2',
                },
                [Date.now().toString()]: {
                    departFromSender: farFuture(),
                    arriveAtReceiver: farFuture(),
                    departFromReceiver: farFuture(),
                    status: 'departed',
                    gate: 'C3',
                },
            }
        },
    ],
    info: {
        // !! => order is important!! => From cheapest to most expensive => !!
        seatClasses: ['economy', 'exit row', 'economy plus', 'first class'],
        // !! => order is important!! => From cheapest to most expensive => !!
        allExtras: ['pillow', 'blanket', 'headphones', 'wifi', 'extra food'],
    }
};

const count = getEnv().RESULTS_PER_PAGE * EXPAND_RESULTS_BY_MULT;
const specialFlightIndex = count - 2;

// ? Rapidly add a bunch of flights for testing purposes
unhydratedDummyDbData.flights = [...Array(Math.floor(count))].map((_, ndx) => {
    const flight = cloneDeep(unhydratedDummyDbData.flights[ndx % unhydratedDummyDbData.flights.length]);

    if(ndx == specialFlightIndex) {
        flight.airline = 'Spirit';
        flight.ffms = 100000000;
        flight.stochasticStates = {
            '0': {
                departFromSender: farFuture(),
                arriveAtReceiver: farFuture(),
                departFromReceiver: farFuture(),
                status: 'boarding',
                gate: 'B2',
            },
            '1': {
                departFromSender: 500,
                arriveAtReceiver: 700,
                departFromReceiver: 1000,
                status: 'past',
                gate: null,
            },
        };
    }

    return flight;
});

export async function hydrateDb(db: Db, data: DummyDbData) {
    const newData = cloneDeep(data);

    await Promise.all([
        ...[newData.keys.length ? db.collection('keys').insertMany(newData.keys) : null],
        ...[newData.airports.length ? db.collection('airports').insertMany(newData.airports) : null],
        ...[newData.airlines.length ? db.collection('airlines').insertMany(newData.airlines) : null],
        ...[newData.noFlyList.length ? db.collection('no-fly-list').insertMany(newData.noFlyList) : null],
        ...[newData.flights.length ? db.collection('flights').insertMany(newData.flights) : null],
        ...[newData.info ? db.collection('info').insertMany([newData.info]) : null],

        db.collection<WithId<RequestLogEntry>>('request-log').insertMany([...Array(22)].map((_, ndx) => ({
            ip: '1.2.3.4',
            key: ndx % 2 ? null : NULL_KEY,
            method: ndx % 3 ? 'GET' : 'POST',
            route: 'fake/route',
            time: Date.now() + 10**6,
            resStatusCode: 200,
        }))),

        db.collection<WithId<LimitedLogEntry>>('limited-log-mview').insertMany([
            { ip: '1.2.3.4', until: Date.now() + 1000 * 60 * 15 } as LimitedLogEntry,
            { ip: '5.6.7.8', until: Date.now() + 1000 * 60 * 15 } as LimitedLogEntry,
            { key: NULL_KEY, until: Date.now() + 1000 * 60 * 60 } as LimitedLogEntry
        ])
    ]);

    return newData as HydratedDummyDbData;
}

export function setupJest() {
    const port = getEnv().DEBUG_MODE ? getEnv().MONGODB_MS_PORT : undefined;

    const server = new MongoMemoryServer({
        instance: {
            port,
            // ? Latest mongo versions error without this line
            args: ['--enableMajorityReadConcern=0']
        }
    });

    let uri: string;
    let hydratedData: HydratedDummyDbData;
    let oldEnv: typeof process.env;

    /**
     * Similar to getDb except it creates a new MongoClient connection before
     * selecting and returning the database.
     */
    const getNewClientAndDb = async () => {
        uri = uri ?? await server.getUri('test'); // ? Ensure singleton
        const client = await MongoClient.connect(uri, { useUnifiedTopology: true });
        const db = client.db();

        if(!db)
            throw new Error('unable to connect to database');

        return { client, db };
    };

    beforeAll(async () => {
        setClientAndDb(await getNewClientAndDb());
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
        const client = await getDbClient();
        client.isConnected() && await client.close();
        await server.stop();
    });

    return {
        getDb,
        getDbClient,
        getNewClientAndDb,
        getHydratedData: () => hydratedData,
    };
}
