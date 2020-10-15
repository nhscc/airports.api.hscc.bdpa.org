import { WithId, ObjectId } from 'mongodb'
import * as Backend from 'universe/backend'
import { getEnv } from 'universe/backend/env'
import sha256 from 'crypto-js/sha256'

import {
    setupJest,
    unhydratedDummyDbData,
    EXPAND_RESULTS_BY_MULT,
    convertIFlightToPFlight
} from 'testverse/db'

import {
    RequestLogEntry,
    LimitedLogEntry,
    InternalFlight
} from 'types/global'

import type{ NextApiRequest, NextApiResponse } from 'next'

const { getHydratedData, getDb } = setupJest();

const PFlightKeys = [
    'type',
    'airline',
    'comingFrom',
    'landingAt',
    'departingTo',
    'flightNumber',
    'baggage',
    'ffms',
    'seats',
    'extras',
    'flight_id',
    'bookable',
    'departFromSender',
    'arriveAtReceiver',
    'departFromReceiver',
    'status',
    'gate',
];

const key = Backend.DUMMY_KEY;

describe('universe/backend', () => {
    describe('::getNoFlyList', () => {
        it('returns the No Fly List data as expected', async () => {
            expect.hasAssertions();
            expect(await Backend.getNoFlyList()).toStrictEqual(unhydratedDummyDbData.noFlyList.map(nfl => {
                // @ts-expect-error: checking for existence of _id
                const { _id, ...publicNFL } = nfl;
                return publicNFL;
            }));
        });
    });

    describe('::getAirports', () => {
        it('returns the airport adhering to the PublicAirport type', async () => {
            expect.hasAssertions();
            expect(await Backend.getAirports()).toStrictEqual(unhydratedDummyDbData.airports.map(airport => {
                // @ts-expect-error: checking for existence of _id
                const { _id, chapterKey, ...publicAirport } = airport;
                return publicAirport;
            }));
        });
    });

    describe('::getAirlines', () => {
        it('returns the airline data as expected', async () => {
            expect.hasAssertions();
            expect(await Backend.getAirlines()).toStrictEqual(unhydratedDummyDbData.airlines.map(airline => {
                // @ts-expect-error: checking for existence of _id
                const { _id, ...publicAirline } = airline;
                return publicAirline;
            }));
        });
    });

    describe('::getExtras', () => {
        it('returns the extras data as expected', async () => {
            expect.hasAssertions();
            expect(await Backend.getExtras()).toStrictEqual(unhydratedDummyDbData.info.allExtras);
        });
    });

    describe('::getSeats', () => {
        it('returns the seats data as expected', async () => {
            expect.hasAssertions();
            expect(await Backend.getSeats()).toStrictEqual(unhydratedDummyDbData.info.seatClasses);
        });
    });

    describe('::getApiKeys', () => {
        it('returns the airline data as expected', async () => {
            expect.hasAssertions();

            expect(await Backend.getApiKeys()).toStrictEqual(unhydratedDummyDbData.keys.map(key => {
                // @ts-expect-error: checking for existence of _id
                const { _id, ...publicApiKey } = { ...key, key: sha256(key.key).toString() };
                return publicApiKey;
            }));
        });
    });

    describe('::getFlightsById', () => {
        it('throws if bad arguments', async () => {
            expect.hasAssertions();

            // @ts-expect-error: testing bad arguments
            await expect(Backend.getFlightsById()).toReject();
            // @ts-expect-error: testing bad arguments
            await expect(Backend.getFlightsById({})).toReject();
            // @ts-expect-error: testing bad arguments
            await expect(Backend.getFlightsById(getHydratedData().flights[0]._id)).toReject();
            // @ts-expect-error: testing bad arguments
            await expect(Backend.getFlightsById(null)).toReject();
            // @ts-expect-error: testing bad arguments
            await expect(Backend.getFlightsById(undefined)).toReject();
            // @ts-expect-error: testing bad arguments
            await expect(Backend.getFlightsById(5)).toReject();
            // @ts-expect-error: testing bad arguments
            await expect(Backend.getFlightsById({ ids: 5, key })).toReject();
            // @ts-expect-error: testing bad arguments
            await expect(Backend.getFlightsById({ ids: {}, key })).toReject();
            // @ts-expect-error: testing bad arguments
            await expect(Backend.getFlightsById({ ids: null, key })).toReject();
            // @ts-expect-error: testing bad arguments
            await expect(Backend.getFlightsById({ ids: [null], key })).toReject();
            // @ts-expect-error: testing bad arguments
            await expect(Backend.getFlightsById({ ids: [undefined], key })).toReject();
            // @ts-expect-error: testing bad arguments
            await expect(Backend.getFlightsById({ ids: [''], key })).toReject();
        });

        it('throws if too many ids', async () => {
            expect.hasAssertions();
            await expect(Backend.getFlightsById({
                ids: [...Array(getEnv().RESULTS_PER_PAGE + 1)].map(() => new ObjectId()),
                key
            })).toReject();
        });

        it('returns nothing when no ids are passed', async () => {
            expect.hasAssertions();
            expect(await Backend.getFlightsById({ ids: [], key })).toStrictEqual([]);
        });

        it('returns nothing when incorrect or bad ids are passed', async () => {
            expect.hasAssertions();
            expect(await Backend.getFlightsById({ ids: [new ObjectId()], key })).toStrictEqual([]);
            expect(await Backend.getFlightsById({
                ids: [new ObjectId(), new ObjectId()],
                key
            })).toStrictEqual([]);
        });

        it('returns only public flight data when correct ids are passed', async () => {
            expect.hasAssertions();
            const flight1 = getHydratedData().flights[0];
            const flight2 = getHydratedData().flights[1];

            const result1 = await Backend.getFlightsById({ ids: [flight1._id, flight2._id], key });

            expect([result1[0]?.bookable, result1[1]?.bookable]).toStrictEqual([
                flight1.type == 'departure' && flight1.bookerKey == Backend.DUMMY_KEY,
                flight2.type == 'departure' && flight2.bookerKey == Backend.DUMMY_KEY
            ]);

            expect(result1.every(flight => {
                const keys = Object.keys(flight);
                return keys.every(key => PFlightKeys.includes(key))
                    && keys.length == PFlightKeys.length;
            })).toBeTrue();

            expect((await Backend.getFlightsById({
                ids: [flight2._id],
                key
            }))[0].flight_id).toBe(flight2._id.toHexString());
        });
    });

    describe('::searchFlights', () => {
        it('throws if bad parameters', async () => {
            expect.hasAssertions();
            // @ts-expect-error: testing bad arguments
            await expect(Backend.searchFlights()).toReject();
            // @ts-expect-error: testing bad arguments
            await expect(Backend.searchFlights({})).toReject();
            // @ts-expect-error: testing bad arguments
            await expect(Backend.searchFlights(getHydratedData().flights[0]._id)).toReject();
            // @ts-expect-error: testing bad arguments
            await expect(Backend.searchFlights(null)).toReject();
            // @ts-expect-error: testing bad arguments
            await expect(Backend.searchFlights(undefined)).toReject();
            // @ts-expect-error: testing bad arguments
            await expect(Backend.searchFlights(5)).toReject();
            // @ts-expect-error: testing bad arguments
            await expect(Backend.searchFlights({ key, after: null, match: {}, regexMatch: {} })).toReject();
            // @ts-expect-error: testing bad arguments
            await expect(Backend.searchFlights({ key, after: null, sort: 'asc', match: {} })).toReject();
            // @ts-expect-error: testing bad arguments
            await expect(Backend.searchFlights({ key, after: 'bad', sort: 'asc', match: {}, regexMatch: {} })).toReject();
            // @ts-expect-error: testing bad arguments
            await expect(Backend.searchFlights({ key, after: null, sort: 'bad', match: {}, regexMatch: {} })).toReject();

            await expect(Backend.searchFlights({
                key, after: null, sort: 'asc', match: { bad: 'bad' }, regexMatch: {}
            })).toReject();

            await expect(Backend.searchFlights({
                // @ts-expect-error: testing bad arguments
                key, after: null, sort: 'asc', match: {}, regexMatch: { bad: undefined }
            })).toReject();

            // @ts-expect-error: testing bad arguments
            await expect(Backend.searchFlights({
                after: null, sort: 'asc', match: {}, regexMatch: {}
            })).toReject();

            await expect(Backend.searchFlights({
                key, after: null, sort: 'asc', match: { _id: 'bad' }, regexMatch: {}
            })).toReject();

            await expect(Backend.searchFlights({
                key, after: null, sort: 'asc', match: {}, regexMatch: { _id: 'bad' }
            })).toReject();

            await expect(Backend.searchFlights({
                key, after: null, sort: 'asc', match: { stochasticStates: 'bad' }, regexMatch: {}
            })).toReject();

            await expect(Backend.searchFlights({
                key, after: null, sort: 'asc', match: {}, regexMatch: { stochasticStates: 'bad' }
            })).toReject();

            await expect(Backend.searchFlights({
                // @ts-expect-error: testing bad arguments
                key, after: null, sort: 'asc', match: {}, regexMatch: { ffms: { $gt: 1000000 }}
            })).toReject();

            await expect(Backend.searchFlights({
                key, after: null, sort: 'asc', match: { $gt: 1000000 }, regexMatch: {}
            })).toReject();

            await expect(Backend.searchFlights({
                key, after: null, sort: 'asc', match: { type: {} }, regexMatch: {}
            })).toReject();

            await expect(Backend.searchFlights({
                // @ts-expect-error: testing bad arguments
                key, after: null, sort: 'asc', match: { type: { $in: [] } }, regexMatch: {}
            })).toReject();

            await expect(Backend.searchFlights({
                key, after: null, sort: 'asc', match: { type: { $lte: undefined } }, regexMatch: {}
            })).toReject();

            await expect(Backend.searchFlights({
                key, after: null, sort: 'asc', match: { '$_id': 'that' }, regexMatch: {}
            })).toReject();
        });

        it('search returns expected paginated records with empty asc/desc queries', async () => {
            expect.hasAssertions();
            const count = getEnv().RESULTS_PER_PAGE;

            const result1 = await Backend.searchFlights({
                key,
                after: null,
                match: {},
                regexMatch: {},
                sort: 'asc',
            });

            const result2 = await Backend.searchFlights({
                key,
                after: null,
                match: {},
                regexMatch: {},
                sort: 'desc',
            });

            const expFlights = getHydratedData().flights;
            const expectedFlights1 = expFlights.slice(0, count).map(convertIFlightToPFlight);
            const expectedFlights2 = expFlights.slice(-count).reverse().map(convertIFlightToPFlight);

            expect(result1).toStrictEqual(expectedFlights1);
            expect(result2).toStrictEqual(expectedFlights2);
            expect(result1.every(flight => Object.keys(flight).every(key => PFlightKeys.includes(key)))).toBeTrue();
        });

        it('search returns expected paginated records with various queries', async () => {
            expect.hasAssertions();
            const count = getEnv().RESULTS_PER_PAGE;
            const totalRecords = count * EXPAND_RESULTS_BY_MULT;
            const expFlights = getHydratedData().flights;

            const result1 = await Backend.searchFlights({
                key,
                after: null,
                match: { type: 'arrival' },
                regexMatch: {},
                sort: 'desc',
            });

            expect(result1).toHaveLength(count);
            expect(result1.every(flight => flight.type == 'arrival')).toBeTrue();
            expect(result1).toStrictEqual(expFlights
                .filter(flight => flight.type == 'arrival')
                .reverse()
                .slice(0, count)
                .map(convertIFlightToPFlight)
            );

            const result2 = await Backend.searchFlights({
                key,
                after: new ObjectId(result1[result1.length - 2].flight_id),
                match: { type: 'arrival' },
                regexMatch: {},
                sort: 'desc',
            });

            expect(result2).toHaveLength(totalRecords / 2 - count + 1);
            expect(result2.every(flight => flight.type == 'arrival')).toBeTrue();
            expect(result2[0].flight_id).toStrictEqual(result1[result1.length - 1].flight_id);
            expect(result2.slice(-1)[0].flight_id).toStrictEqual(expFlights
                .filter(flight => flight.type == 'arrival')
                .reverse()
                .slice(-1)
                .map(convertIFlightToPFlight)[0].flight_id
            );

            const result3 = await Backend.searchFlights({
                key,
                after: expFlights.slice(-3)[0]._id,
                match: { type: 'arrival' },
                regexMatch: {},
                sort: 'asc',
            });

            expect(result3).toHaveLength(1);
            expect(result3.every(flight => flight.type == 'arrival')).toBeTrue();
            expect(result3[0].flight_id).toStrictEqual(expFlights
                .filter(flight => flight.type == 'arrival')
                .slice(-1)
                .map(convertIFlightToPFlight)[0].flight_id
            );

            const result3desc = await Backend.searchFlights({
                key,
                after: expFlights[2]._id,
                match: { type: 'arrival' },
                regexMatch: {},
                sort: 'desc',
            });

            expect(result3desc).toHaveLength(1);
            expect(result3desc[0].flight_id).toStrictEqual(expFlights
                .filter(flight => flight.type == 'arrival')
                .reverse()
                .slice(-1)
                .map(convertIFlightToPFlight)[0].flight_id
            );

            const result4 = await Backend.searchFlights({
                key,
                after: expFlights[2]._id,
                match: {},
                regexMatch: {},
                sort: 'desc',
            });

            expect(result4).toHaveLength(2);

            const result5 = await Backend.searchFlights({
                key,
                after: expFlights.slice(-3)[0]._id,
                match: {},
                regexMatch: {},
                sort: 'asc',
            });

            expect(result5).toHaveLength(2);

            const result6 = await Backend.searchFlights({
                key,
                after: expFlights[2]._id,
                match: {},
                regexMatch: {},
                sort: 'desc',
            });

            expect(result6).toHaveLength(expFlights
                .filter(flight => flight.type == 'arrival')
                .slice(0, 2)
                .length
            );

            const result6X = await Backend.searchFlights({
                key,
                after: expFlights.slice(-2)[0]._id,
                match: {},
                regexMatch: {},
                sort: 'desc',
            });

            expect(result6X).toHaveLength(count);

            const result7 = await Backend.searchFlights({
                key,
                after: expFlights.slice(-1)[0]._id,
                match: {},
                regexMatch: {},
                sort: 'asc',
            });

            expect(result7).toHaveLength(0);

            const result8 = await Backend.searchFlights({
                key,
                after: null,
                match: { type: 'DNE' },
                regexMatch: {},
                sort: 'desc',
            });

            expect(result8).toHaveLength(0);

            const result9 = await Backend.searchFlights({
                key,
                after: null,
                match: { type: 'DNE' },
                regexMatch: { type: '^arr' },
                sort: 'desc',
            });

            // ? regexMatch keys override match keys!
            expect(result9).toHaveLength(count);

            const result9X = await Backend.searchFlights({
                key,
                after: null,
                match: { type: 'arrival' },
                regexMatch: { type: 'DNE' },
                sort: 'desc',
            });

            expect(result9X).toHaveLength(0);

            const result10 = await Backend.searchFlights({
                key,
                after: null,
                match: {},
                regexMatch: { type: '^arr' },
                sort: 'desc',
            });

            expect(result10).toStrictEqual(result1);

            const result11 = await Backend.searchFlights({
                key,
                after: null,
                match: {},
                regexMatch: { type: '^ARR' },
                sort: 'desc',
            });

            expect(result11).toStrictEqual(result1);

            const result12 = await Backend.searchFlights({
                key,
                after: null,
                match: {},
                regexMatch: { type: 'ArTuRe$' },
                sort: 'desc',
            });

            expect(result12).toHaveLength(count);
            expect(result12.every(flight => flight.type == 'departure')).toBeTrue();

            const result13 = await Backend.searchFlights({
                key,
                after: null,
                match: { ffms: { $gt: 1000000 }},
                regexMatch: {},
                sort: 'desc',
            });

            expect(result13).toHaveLength(1);

            const result14 = await Backend.searchFlights({
                key,
                after: null,
                match: { ffms: { $lt: 1000000 }},
                regexMatch: {},
                sort: 'desc',
            });

            expect(result14).toHaveLength(count);

            const result15 = await Backend.searchFlights({
                key,
                after: null,
                match: {},
                regexMatch: { airline: 's.*t' },
                sort: 'desc',
            });

            expect(result15).toHaveLength(1);

            const result16 = await Backend.searchFlights({
                key,
                after: null,
                match: { arriveAtReceiver: { $lt: 10000 }},
                regexMatch: {},
                sort: 'desc',
            });

            expect(result16).toHaveLength(1);

            const result17 = await Backend.searchFlights({
                key,
                after: null,
                match: { ffms: { $gte: 1000000 }, departFromSender: 500 },
                regexMatch: { airline: 's.*t' },
                sort: 'desc',
            });

            expect(result17).toHaveLength(1);

            const result18 = await Backend.searchFlights({
                key,
                after: new ObjectId(result17[0].flight_id),
                match: { ffms: { $gte: 1000000 }, departFromSender: 500 },
                regexMatch: { airline: 's.*t' },
                sort: 'desc',
            });

            expect(result18).toHaveLength(0);

            const result19 = await Backend.searchFlights({
                key,
                after: null,
                match: { status: 'past' },
                regexMatch: {},
                sort: 'desc',
            });

            expect(result19.every(flight => flight.gate === null)).toBeTrue();
        });

        it('search returns expected paginated records with secondary matchers', async () => {
            expect.hasAssertions();
            const count = getEnv().RESULTS_PER_PAGE;

            const result1 = await Backend.searchFlights({
                key,
                after: null,
                match: { arriveAtReceiver: { $gte: Date.now() }},
                regexMatch: {},
                sort: 'asc',
            });

            const result2 = await Backend.searchFlights({
                key,
                after: null,
                match: { arriveAtReceiver: { $gte: Date.now() }},
                regexMatch: {},
                sort: 'desc',
            });

            const result3 = await Backend.searchFlights({
                key,
                after: null,
                match: {},
                regexMatch: { status: 'landed|departed' },
                sort: 'asc',
            });

            const result4 = await Backend.searchFlights({
                key,
                after: null,
                match: {},
                regexMatch: { status: 'landed|departed' },
                sort: 'desc',
            });

            const expFlights = getHydratedData().flights.map(convertIFlightToPFlight);
            const expectedFlights1 = expFlights.filter(f => f.arriveAtReceiver >= Date.now()).slice(0, count);
            const expectedFlights2 = expFlights
                .filter(f => f.arriveAtReceiver >= Date.now())
                .slice(-count)
                .reverse();
            const expectedFlights3 = expFlights.filter(f => /landed|departed/.test(f.status)).slice(0, count);
            const expectedFlights4 = expFlights
                .filter(f => /landed|departed/.test(f.status))
                .slice(-count)
                .reverse();

            expect(result1).toStrictEqual(expectedFlights1);
            expect(result2).toStrictEqual(expectedFlights2);
            expect(result3).toStrictEqual(expectedFlights3);
            expect(result4).toStrictEqual(expectedFlights4);
            expect(result1.every(flight => Object.keys(flight).every(key => PFlightKeys.includes(key)))).toBeTrue();
            expect(result3.every(flight => Object.keys(flight).every(key => PFlightKeys.includes(key)))).toBeTrue();
        });

        it('does not throw when there are no flights in the system', async () => {
            expect.hasAssertions();
            await (await getDb()).collection('flights').deleteMany({});

            await expect(Backend.searchFlights({
                key,
                after: null,
                match: {},
                regexMatch: {},
                sort: 'asc',
            })).not.toReject();
        });

        it('searches by flight_id via match and regexMatch work as expected', async () => {
            expect.hasAssertions();
            const expectedFlights = getHydratedData().flights.slice(2, 4).map(convertIFlightToPFlight);

            expect(await Backend.searchFlights({
                key,
                after: null,
                match: { flight_id: expectedFlights[0].flight_id },
                regexMatch: {},
                sort: 'asc',
            })).toStrictEqual([expectedFlights[0]]);

            expect(await Backend.searchFlights({
                key,
                after: null,
                match: {},
                regexMatch: { flight_id: expectedFlights.map(f => f.flight_id).join('|') },
                sort: 'asc',
            })).toStrictEqual(expectedFlights);
        });
    });

    describe('::generateFlights', () => {
        it('rejects if there are no airports', async () => {
            expect.hasAssertions();
            process.env.FLIGHTS_GENERATE_DAYS = '1';
            await (await getDb()).collection('airports').deleteMany({});
            await expect(Backend.generateFlights(/*silent=*/true)).toReject();
        });

        it('rejects if there are no airlines', async () => {
            expect.hasAssertions();
            process.env.FLIGHTS_GENERATE_DAYS = '1';
            await (await getDb()).collection('airlines').deleteMany({});
            await expect(Backend.generateFlights(/*silent=*/true)).toReject();
        });

        it('does something if airports/airlines exist', async () => {
            expect.hasAssertions();
            process.env.FLIGHTS_GENERATE_DAYS = '1';
            const flightsDb = (await getDb()).collection<WithId<InternalFlight>>('flights');
            await flightsDb.deleteMany({});

            const lastFlightId1 = (await flightsDb.find().sort({ _id: -1 }).limit(1).next())?._id;
            expect(lastFlightId1).toBeUndefined();

            expect(await Backend.generateFlights(/*silent=*/true)).not.toBe(0);

            const lastFlightId2 = (await flightsDb.find().sort({ _id: -1 }).limit(1).next())?._id;
            expect(lastFlightId2).not.toBeUndefined();
        });
    });

    describe('::addToRequestLog', () => {
        it('adds request to log as expected', async () => {
            expect.hasAssertions();
            const req1 = {
                headers: { 'x-forwarded-for': '9.9.9.9' },
                method: 'POST',
                url: '/api/route/path1'
            } as unknown as NextApiRequest;

            const req2 = {
                headers: {
                    'x-forwarded-for': '8.8.8.8',
                    'key': Backend.NULL_KEY
                },
                method: 'GET',
                url: '/api/route/path2'
            } as unknown as NextApiRequest;

            const res1 = { statusCode: 1111 } as NextApiResponse;
            const res2 = { statusCode: 2222 } as NextApiResponse;

            const now = Date.now();
            const _now = Date.now;
            Date.now = () => now;

            await Backend.addToRequestLog({ req: req1, res: res1 });
            await Backend.addToRequestLog({ req: req2, res: res2 });

            Date.now = _now;

            const reqlog = (await getDb()).collection<WithId<RequestLogEntry>>('request-log');

            const { _id: ignored1, ...log1 } = await reqlog.findOne({ resStatusCode: 1111 }) || {};
            const { _id: ignored2, ...log2 } = await reqlog.findOne({ resStatusCode: 2222 }) || {};

            expect(log1).toStrictEqual({
                ip: '9.9.9.9',
                key: null,
                route: 'route/path1',
                method: 'POST',
                time: now,
                resStatusCode: 1111,
            });

            expect(log2).toStrictEqual({
                ip: '8.8.8.8',
                key: Backend.NULL_KEY,
                route: 'route/path2',
                method: 'GET',
                time: now,
                resStatusCode: 2222
            });
        });
    });

    describe('::isRateLimited', () => {
        it('returns true if ip or key are rate limited', async () => {
            expect.hasAssertions();
            const _now = Date.now;
            const now = Date.now();
            Date.now = () => now;

            const req1 = await Backend.isRateLimited({
                headers: { 'x-forwarded-for': '1.2.3.4' },
                method: 'POST',
                url: '/api/route/path1'
            } as unknown as NextApiRequest);

            const req2 = await Backend.isRateLimited({
                headers: {
                    'x-forwarded-for': '8.8.8.8',
                    'key': Backend.NULL_KEY
                },
                method: 'GET',
                url: '/api/route/path2'
            } as unknown as NextApiRequest);

            const req3 = await Backend.isRateLimited({
                headers: {
                    'x-forwarded-for': '1.2.3.4',
                    'key': 'fake-key'
                },
                method: 'POST',
                url: '/api/route/path1'
            } as unknown as NextApiRequest);

            const req4 = await Backend.isRateLimited({
                headers: {
                    'x-forwarded-for': '5.6.7.8',
                },
                method: 'POST',
                url: '/api/route/path1'
            } as unknown as NextApiRequest);

            const req5 = await Backend.isRateLimited({
                headers: {
                    'x-forwarded-for': '1.2.3.4',
                    'key': Backend.NULL_KEY
                },
                method: 'POST',
                url: '/api/route/path1'
            } as unknown as NextApiRequest);

            expect(req1.limited).toBeTrue();
            expect(req2.limited).toBeTrue();
            expect(req3.limited).toBeTrue();
            expect(req4.limited).toBeTrue();
            expect(req5.limited).toBeTrue();

            expect(req1.retryAfter).toBeWithin(1000 * 60 * 15 - 1000, 1000 * 60 * 15 + 1000);
            expect(req2.retryAfter).toBeWithin(1000 * 60 * 60 - 1000, 1000 * 60 * 60 + 1000);
            expect(req3.retryAfter).toBeWithin(1000 * 60 * 15 - 1000, 1000 * 60 * 15 + 1000);
            expect(req4.retryAfter).toBeWithin(1000 * 60 * 15 - 1000, 1000 * 60 * 15 + 1000);
            // ? Should return greater of the two ban times (key time > ip time)
            expect(req5.retryAfter).toBeWithin(1000 * 60 * 60 - 1000, 1000 * 60 * 60 + 1000);

            Date.now = _now;
        });

        it('returns false iff both ip and key (if provided) are not rate limited', async () => {
            expect.hasAssertions();
            const req1 = {
                headers: { 'x-forwarded-for': '1.2.3.5' },
                method: 'POST',
                url: '/api/route/path1'
            } as unknown as NextApiRequest;

            const req2 = {
                headers: {
                    'x-forwarded-for': '8.8.8.8',
                    'key': 'fake-key'
                },
                method: 'GET',
                url: '/api/route/path2'
            } as unknown as NextApiRequest;

            expect(await Backend.isRateLimited(req1)).toStrictEqual({ limited: false, retryAfter: 0 });
            expect(await Backend.isRateLimited(req2)).toStrictEqual({ limited: false, retryAfter: 0 });
        });

        it('returns false if "until" time has passed', async () => {
            expect.hasAssertions();
            const req = {
                headers: { 'x-forwarded-for': '1.2.3.4' },
                method: 'POST',
                url: '/api/route/path1'
            } as unknown as NextApiRequest;

            expect(await Backend.isRateLimited(req)).toContainEntry([ 'limited', true ]);

            await (await getDb()).collection<LimitedLogEntry>('limited-log-mview').updateOne(
                { ip: '1.2.3.4' },
                { $set: { until: Date.now() - 10**5 }}
            );

            expect(await Backend.isRateLimited(req)).toStrictEqual({ limited: false, retryAfter: 0 });
        });
    });

    describe('::isDueForContrivedError', () => {
        it('returns true after REQUESTS_PER_CONTRIVED_ERROR invocations', async () => {
            expect.hasAssertions();
            const rate = getEnv().REQUESTS_PER_CONTRIVED_ERROR;

            expect([...Array(rate * 2)].map(() => Backend.isDueForContrivedError())).toStrictEqual([
                ...[...Array(rate - 1)].map(() => false),
                true,
                ...[...Array(rate - 1)].map(() => false),
                true
            ]);
        });
    });
});
