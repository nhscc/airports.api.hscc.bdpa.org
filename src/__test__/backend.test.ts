import { WithId } from 'mongodb';
import * as Backend from 'universe/backend'
import { setupJest, unhydratedDummyDbData } from 'universe/__test__/db'
import { getEnv } from 'universe/backend/env'
import { populateEnv } from 'universe/dev-utils'

import {
    RequestLogEntry,
    LimitedLogEntry,
    InternalFlight,
    PublicFlight
} from 'types/global'

import type{ NextApiRequest, NextApiResponse } from 'next'

populateEnv();

const { getHydratedData, getDb } = setupJest();

// ? Public flight properties
const PFlightProps = [
    'flight_id',
    'type',
    'airline',
    'senderAirport',
    'receiverAirport',
    'flightNumber',
    'baggage',
    'ffms',
    'seats',
    'extras',
    'bookable',
    'depart_from_sender',
    'arrive_at_receiver',
    'depart_from_receiver',
    'status',
    'gate',
];

describe('universe/backend', () => {
    describe('::getNoFlyList', () => {
        it('returns the No Fly List data as expected', async () => {
            expect(await Backend.getNoFlyList()).toBe(unhydratedDummyDbData.noFlyList.map(nfl => {
                // @ts-expect-error: checking for existence of _id
                const { _id, ...publicNFL } = nfl;
                return publicNFL;
            }));
        });
    });

    describe('::getAirports', () => {
        it('returns the airport adhering to the PublicAirport type', async () => {
            expect(await Backend.getAirports()).toBe(unhydratedDummyDbData.airports.map(airport => {
                // @ts-expect-error: checking for existence of _id
                const { _id, ...publicAirport } = airport;
                return publicAirport;
            }));
        });
    });

    describe('::getAirlines', () => {
        it('returns the airline data as expected', async () => {
            expect(await Backend.getAirlines()).toBe(unhydratedDummyDbData.airlines.map(airline => {
                // @ts-expect-error: checking for existence of _id
                const { _id, ...publicAirline } = airline;
                return publicAirline;
            }));
        });
    });

    describe('::getFlightsById', () => {
        it('throws if bad arguments', () => {
            // @ts-expect-error: testing bad arguments
            expect(() => Backend.getFlightsById()).toThrow();
            // @ts-expect-error: testing bad arguments
            expect(() => Backend.getFlightsById({})).toThrow();
            // @ts-expect-error: testing bad arguments
            expect(() => Backend.getFlightsById(getHydratedData().flights[0]._id)).toThrow();
            // @ts-expect-error: testing bad arguments
            expect(() => Backend.getFlightsById(null)).toThrow();
            // @ts-expect-error: testing bad arguments
            expect(() => Backend.getFlightsById(undefined)).toThrow();
            // @ts-expect-error: testing bad arguments
            expect(() => Backend.getFlightsById(5)).toThrow();
        });

        it('returns nothing when no ids are passed', async () => {
            expect(await Backend.getFlightsById([])).toBe([]);
        });

        it('returns nothing when incorrect or bad ids are passed', async () => {
            // @ts-expect-error: testing bad arguments
            expect(await Backend.getFlightsById([null])).toBe([]);
            // @ts-expect-error: testing bad arguments
            expect(await Backend.getFlightsById([undefined])).toBe([]);
            // @ts-expect-error: testing bad arguments
            expect(await Backend.getFlightsById([''])).toBe([]);
            // @ts-expect-error: testing bad arguments
            expect(await Backend.getFlightsById([5])).toBe([]);
            // @ts-expect-error: testing bad arguments
            expect(await Backend.getFlightsById(['incorrect'])).toBe([]);
            // @ts-expect-error: testing bad arguments
            expect(await Backend.getFlightsById(['incorrect1', 'incorrect2'])).toBe([]);
        });

        it('returns only public flight data when correct ids are passed', async () => {
            const flight1 = getHydratedData().flights[0];
            const flight2 = getHydratedData().flights[1];

            const result1 = await Backend.getFlightsById([flight1._id, flight2._id]);

            expect([result1[0].booker_key, result1[1].booker_key]).toBe([flight1.booker_key, flight2.booker_key]);

            expect(result1.every(flight => Object.keys(flight).every(key => PFlightProps.includes(key)))).toBeTrue();

            expect((await Backend.getFlightsById([flight2._id]))[0].booker_key).toBe(flight2.booker_key);
        });
    });

    describe('::searchFlights', () => {
        it('throws if bad arguments', () => {
            // @ts-expect-error: testing bad arguments
            expect(() => Backend.searchFlights()).toThrow();
            // @ts-expect-error: testing bad arguments
            expect(() => Backend.searchFlights({})).toThrow();
            // @ts-expect-error: testing bad arguments
            expect(() => Backend.searchFlights(getHydratedData().flights[0]._id)).toThrow();
            // @ts-expect-error: testing bad arguments
            expect(() => Backend.searchFlights(null)).toThrow();
            // @ts-expect-error: testing bad arguments
            expect(() => Backend.searchFlights(undefined)).toThrow();
            // @ts-expect-error: testing bad arguments
            expect(() => Backend.searchFlights(5)).toThrow();
        });

        it('throws if bad query parameters', () => {
            // @ts-expect-error: testing bad arguments
            expect(() => expect(await Backend.searchFlights({
                after: null,
                match: {},
                regexMatch: {},
                sort: 'desc',
            }))).toThrow();

            // @ts-expect-error: testing bad arguments
            expect(() => Backend.searchFlights({})).toThrow();
            // @ts-expect-error: testing bad arguments
            expect(() => Backend.searchFlights(getHydratedData().flights[0]._id)).toThrow();
            // @ts-expect-error: testing bad arguments
            expect(() => Backend.searchFlights(null)).toThrow();
            // @ts-expect-error: testing bad arguments
            expect(() => Backend.searchFlights(undefined)).toThrow();
            // @ts-expect-error: testing bad arguments
            expect(() => Backend.searchFlights(5)).toThrow();
            // @ts-expect-error: testing bad arguments
            expect(() => Backend.searchFlights({ after: null, match: {}, regexMatch: {} })).toThrow();
            // @ts-expect-error: testing bad arguments
            expect(() => Backend.searchFlights({ after: null, sort: 'asc', match: {} })).toThrow();
            // @ts-expect-error: testing bad arguments
            expect(() => Backend.searchFlights({ after: 'bad', sort: 'asc', match: {}, regexMatch: {} })).toThrow();
            // @ts-expect-error: testing bad arguments
            expect(() => Backend.searchFlights({ after: null, sort: 'bad', match: {}, regexMatch: {} })).toThrow();

            // @ts-expect-error: testing bad arguments
            expect(() => Backend.searchFlights({
                after: null, sort: 'asc', match: { bad: 'bad' }, regexMatch: {}
            })).toThrow();

            // @ts-expect-error: testing bad arguments
            expect(() => Backend.searchFlights({
                after: null, sort: 'asc', match: {}, regexMatch: { bad: undefined }
            })).toThrow();

            // @ts-expect-error: testing bad arguments
            expect(() => Backend.searchFlights({
                after: null, sort: 'asc', match: { _id: 'bad' }, regexMatch: {}
            })).toThrow();

            // @ts-expect-error: testing bad arguments
            expect(() => Backend.searchFlights({
                after: null, sort: 'asc', match: {}, regexMatch: { _id: 'bad' }
            })).toThrow();

            // @ts-expect-error: testing bad arguments
            expect(() => Backend.searchFlights({
                after: null, sort: 'asc', match: { stochasticStates: 'bad' }, regexMatch: {}
            })).toThrow();

            // @ts-expect-error: testing bad arguments
            expect(() => Backend.searchFlights({
                after: null, sort: 'asc', match: {}, regexMatch: { stochasticStates: 'bad' }
            })).toThrow();

            // @ts-expect-error: testing bad arguments
            expect(() => Backend.searchFlights({
                after: null, sort: 'asc', match: {}, regexMatch: { ffms: { $gt: 1000000 }}
            })).toThrow();
        });

        it('search returns expected paginated records with empty asc/desc queries', async () => {
            const convertIFlightToPFlight = (flight: InternalFlight, ndx: number): PublicFlight => {
                const { booker_key, stochasticStates , ...flightData } = flight;

                return {
                    flight_id: getHydratedData().flights[ndx]._id,
                    bookable: booker_key == Backend.DUMMY_KEY,
                    ...flightData,
                    ...Object.values(stochasticStates)[0]
                }
            };

            const count = unhydratedDummyDbData.flights.length;
            const resultsPerPage = getEnv().RESULTS_PER_PAGE;

            const result1 = await Backend.searchFlights({
                after: null,
                match: {},
                regexMatch: {},
                sort: 'asc',
            });

            const result2 = await Backend.searchFlights({
                after: null,
                match: {},
                regexMatch: {},
                sort: 'desc',
            });

            expect(result1).toBe(unhydratedDummyDbData.flights.slice(50).map(convertIFlightToPFlight));
            expect(result2).toBe(unhydratedDummyDbData.flights.slice(50).reverse().map(convertIFlightToPFlight));
            expect(result1.every(flight => Object.keys(flight).every(key => PFlightProps.includes(key)))).toBeTrue();
        });

        it('search returns expected paginated records with various queries', async () => {
            const count = getEnv().RESULTS_PER_PAGE;

            const result1 = await Backend.searchFlights({
                after: null,
                match: { type: 'arrival' },
                regexMatch: {},
                sort: 'desc',
            });

            expect(result1.length).toBe(count);
            expect(result1.every(flight => flight.type == 'arrival')).toBeTrue();

            const result2 = await Backend.searchFlights({
                after: result1[result1.length - 2].flight_id,
                match: { type: 'arrival' },
                regexMatch: {},
                sort: 'desc',
            });

            expect(result2.length).toBe(count);
            expect(result2.every(flight => flight.type == 'arrival')).toBeTrue();
            expect(result2[0].flight_id).toBe(result1[result1.length - 1].flight_id);

            const result3 = await Backend.searchFlights({
                after: getHydratedData().flights.slice(-3)[0]._id,
                match: { type: 'arrival' },
                regexMatch: {},
                sort: 'asc',
            });

            expect(result3.length).toBe(1);
            expect(result3.every(flight => flight.type == 'arrival')).toBeTrue();

            const result3desc = await Backend.searchFlights({
                after: getHydratedData().flights.slice(-3)[0]._id,
                match: { type: 'arrival' },
                regexMatch: {},
                sort: 'desc',
            });

            expect(result3desc.length).toBe(1);
            expect(result3desc).toEqual(result3.reverse());

            const result4 = await Backend.searchFlights({
                after: getHydratedData().flights.slice(-3)[0]._id,
                match: {},
                regexMatch: {},
                sort: 'desc',
            });

            expect(result4.length).toBe(2);

            const result5 = await Backend.searchFlights({
                after: getHydratedData().flights.slice(-3)[0]._id,
                match: {},
                regexMatch: {},
                sort: 'asc',
            });

            expect(result5).toEqual(result4.reverse());

            const result6 = await Backend.searchFlights({
                after: getHydratedData().flights.slice(-2)[0]._id,
                match: {},
                regexMatch: {},
                sort: 'desc',
            });

            expect(result6.length).toBe(1);

            const result7 = await Backend.searchFlights({
                after: getHydratedData().flights.slice(-1)[0]._id,
                match: {},
                regexMatch: {},
                sort: 'asc',
            });

            expect(result7.length).toBe(0);

            const result8 = await Backend.searchFlights({
                after: null,
                match: { type: 'DNE' },
                regexMatch: {},
                sort: 'desc',
            });

            expect(result8.length).toBe(0);

            const result9 = await Backend.searchFlights({
                after: null,
                match: { type: 'DNE' },
                regexMatch: { type: '^arr' },
                sort: 'desc',
            });

            expect(result9.length).toBe(0);

            const result9X = await Backend.searchFlights({
                after: null,
                match: { type: 'arrival' },
                regexMatch: { type: 'DNE' },
                sort: 'desc',
            });

            expect(result9X.length).toBe(0);

            const result10 = await Backend.searchFlights({
                after: null,
                match: {},
                regexMatch: { type: '^arr' },
                sort: 'desc',
            });

            expect(result10).toEqual(result1);

            const result11 = await Backend.searchFlights({
                after: null,
                match: {},
                regexMatch: { type: '^ARR' },
                sort: 'desc',
            });

            expect(result11).toEqual(result1);

            const result12 = await Backend.searchFlights({
                after: null,
                match: {},
                regexMatch: { type: 'ArTuRe$' },
                sort: 'desc',
            });

            expect(result12.length).toBe(count);
            expect(result12.every(flight => flight.type == 'departure')).toBeTrue();

            const result13 = await Backend.searchFlights({
                after: null,
                match: { ffms: { $gt: 1000000 }},
                regexMatch: {},
                sort: 'desc',
            });

            expect(result13.length).toBe(1);

            const result14 = await Backend.searchFlights({
                after: null,
                match: { ffms: { $lt: 1000000 }},
                regexMatch: {},
                sort: 'desc',
            });

            expect(result14.length).toBe(count);

            const result15 = await Backend.searchFlights({
                after: null,
                match: {},
                regexMatch: { airline: 's.*t' },
                sort: 'desc',
            });

            expect(result15.length).toBe(1);

            const result16 = await Backend.searchFlights({
                after: null,
                match: { arrive_at_receiver: { $lt: 10000 }},
                regexMatch: {},
                sort: 'desc',
            });

            expect(result16.length).toBe(1);

            const result17 = await Backend.searchFlights({
                after: null,
                match: { ffms: { $gte: 1000000 }, depart_from_sender: 500 },
                regexMatch: { airline: 's.*t' },
                sort: 'desc',
            });

            expect(result17.length).toBe(1);

            const result18 = await Backend.searchFlights({
                after: result1[0].flight_id,
                match: { ffms: { $gte: 1000000 }, depart_from_sender: 500 },
                regexMatch: { airline: 's.*t' },
                sort: 'desc',
            });

            expect(result18.length).toBe(1);

            const result19 = await Backend.searchFlights({
                after: null,
                match: { status: 'past' },
                regexMatch: {},
                sort: 'desc',
            });

            expect(result19.every(flight => flight.gate === null)).toBeTrue();
        });
    });

    describe('::generateFlights', () => {
        it('does nothing if there are no airports or no airlines', async () => {
            expect(await Backend.generateFlights()).toBe(0);
        });

        test.todo('does something if airports/airlines exist but only AFTER the latest entry if proper time', async () => {
            const flightsDb = (await getDb()).collection<WithId<InternalFlight>>('flights');

            expect(await Backend.generateFlights()).not.toBe(0);
            expect(await Backend.generateFlights()).toBe(0);

            const lastFlightId = (await flightsDb.find().sort({ _id: -1 }).limit(1).next())?._id;

            expect(lastFlightId).toBeTruthy();
            expect((await flightsDb.deleteOne({ _id: lastFlightId })).deletedCount).toBe(1);
            expect(await Backend.generateFlights()).toBe(1);
        });
    });

    describe('::addToRequestLog', () => {
        it('adds request to log as expected', async () => {
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

            expect(log1).toEqual({
                ip: '9.9.9.9',
                key: null,
                route: 'route/path1',
                method: 'POST',
                time: now,
                resStatusCode: 1111,
            });

            expect(log2).toEqual({
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

            expect(await Backend.isRateLimited(req1)).toEqual({ limited: false, retryAfter: 0 });
            expect(await Backend.isRateLimited(req2)).toEqual({ limited: false, retryAfter: 0 });
        });

        it('returns false if "until" time has passed', async () => {
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

            expect(await Backend.isRateLimited(req)).toEqual({ limited: false, retryAfter: 0 });
        });
    });

    describe('::isDueForContrivedError', () => {
        it('returns true after REQUESTS_PER_CONTRIVED_ERROR invocations', async () => {
            const rate = getEnv().REQUESTS_PER_CONTRIVED_ERROR;

            expect([...Array(rate * 2)].map(() => Backend.isDueForContrivedError())).toEqual([
                ...[...Array(rate - 1)].map(() => false),
                true,
                ...[...Array(rate - 1)].map(() => false),
                true
            ]);
        });
    });
});
