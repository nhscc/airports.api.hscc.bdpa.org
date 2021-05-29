import { setupJest, convertIFlightToPFlight } from 'testverse/db'
import { testApiHandler } from 'next-test-api-route-handler'
import v1AllEndpoint, { config as v1AllConfig } from 'universe/pages/api/v1/flights/all'
import * as V1_search from 'universe/pages/api/v1/flights/search'
import * as V1_with_ids from 'universe/pages/api/v1/flights/with-ids'
import * as V2_flights from 'universe/pages/api/v2/flights'
import { DUMMY_KEY as KEY, convertPFlightToPFlightForV1Only } from 'universe/backend'
import { getEnv } from 'universe/backend/env'
import { ObjectId } from 'mongodb'

import type { WithId } from 'mongodb'
import type { PageConfig } from 'next'
import type { WithConfig, PublicFlight, InternalFlight } from 'types/global'

const RESULT_SIZE = getEnv().RESULTS_PER_PAGE;

const { getHydratedData, getDb } = setupJest();

const v1All: typeof v1AllEndpoint & { config?: PageConfig } = v1AllEndpoint;
v1All.config = v1AllConfig;

const v1Search: WithConfig<typeof V1_search.default> = V1_search.default;
v1Search.config = V1_search.config;

const v1WithIds: WithConfig<typeof V1_with_ids.default> = V1_with_ids.default;
v1WithIds.config = V1_with_ids.config;

const v2Flights: WithConfig<typeof V2_flights.default> = V2_flights.default;
v2Flights.config = V2_flights.config;

const convertIFlightToPFlightForV1Only = (flight: WithId<InternalFlight>) => {
    return convertPFlightToPFlightForV1Only(convertIFlightToPFlight(flight));
};

process.env.REQUESTS_PER_CONTRIVED_ERROR = '0';
process.env.DISABLED_API_VERSIONS = '';

describe('api/v1/flights', () => {
    it('returns expected number of public flights by default in FIFO order', async () => {
        expect.hasAssertions();

        const results = getHydratedData().flights.slice(0, getEnv().RESULTS_PER_PAGE).map(convertIFlightToPFlightForV1Only);

        await testApiHandler({
            handler: v1All,
            test: async ({ fetch }) => {
                const response = await fetch({ headers: { KEY } });
                const json = await response.json();

                expect(response.status).toBe(200);
                expect(json.success).toBe(true);
                expect(json.flights).toStrictEqual(results);
            }
        });
    });

    it('returns expected number of public flights in FIFO order respecting offset (after)', async () => {
        expect.hasAssertions();

        const flights = getHydratedData().flights.map(convertIFlightToPFlightForV1Only);

        const genUrl = function*() {
            yield `/?after=`;
            yield `/?after=${flights[0].flight_id}`;
            yield `/?after=${flights[1].flight_id}`;
            yield `/?after=${flights[10].flight_id}`;
            yield `/?after=${flights[50].flight_id}`;
            yield `/?after=${flights[100].flight_id}`;
            yield `/?after=${flights[200].flight_id}`;
            yield `/?after=${flights[248].flight_id}`;
            yield `/?after=${flights[249].flight_id}`;
            yield `/?after=${new ObjectId()}`;
        }();

        await testApiHandler({
            requestPatcher: req => { req.url = genUrl.next().value || undefined },
            handler: v1All,
            test: async ({ fetch }) => {
                const responses = await Promise.all([...Array(10)].map(_ => {
                    return fetch({ headers: { KEY } }).then(r => r.ok ? r.json() : null);
                }));

                expect(responses.some(o => !o?.success)).toBeFalse();

                expect(responses.map(r => r.flights)).toIncludeSameMembers([
                    flights.slice(0, RESULT_SIZE),
                    flights.slice(1, RESULT_SIZE + 1),
                    flights.slice(2, RESULT_SIZE + 2),
                    flights.slice(11, RESULT_SIZE + 11),
                    flights.slice(51, RESULT_SIZE + 51),
                    flights.slice(101, RESULT_SIZE + 101),
                    flights.slice(201, RESULT_SIZE + 150),
                    flights.slice(-1),
                    [],
                    []
                ]);
            }
        });
    });

    it('does the right thing when garbage offsets (after) are provided', async () => {
        expect.hasAssertions();

        const genUrl = function*() {
            yield `/?after=-5`;
            yield `/?after=a`;
            yield `/?after=@($)`;
            yield `/?after=xyz`;
            yield `/?after=123`;
            yield `/?after=(*$)`;
            yield `/?dne=123`;
        }();

        await testApiHandler({
            requestPatcher: req => { req.url = genUrl.next().value || undefined },
            handler: v1All,
            test: async ({ fetch }) => {
                const responses = await Promise.all([...Array(7)].map(_ => {
                    return fetch({ headers: { KEY } }).then(r => r.status);
                }));

                expect(responses).toIncludeSameMembers([
                    404,
                    404,
                    404,
                    404,
                    404,
                    404,
                    200
                ]);
            }
        });
    });

    it('does not throw when there are no flights in the system', async () => {
        expect.hasAssertions();

        await (await getDb()).collection('flights').deleteMany({});

        await testApiHandler({
            handler: v1All,
            test: async ({ fetch }) => {
                const response = await fetch({ headers: { KEY } });

                expect(response.status).toBe(200);
                expect((await response.json()).success).toBe(true);
            }
        });
    });

    it('returns same flights as /all if no query params given', async () => {
        expect.hasAssertions();

        let v1AllFlight: PublicFlight[];

        await testApiHandler({
            handler: v1All,
            test: async ({ fetch }) => {
                const response = await fetch({ headers: { KEY }});
                v1AllFlight = (await response.json()).flights;
            }
        });

        await testApiHandler({
            handler: v1Search,
            test: async ({ fetch }) => {
                const response = await fetch({ headers: { KEY } });
                const json = await response.json();

                expect(response.status).toBe(200);
                expect(json.success).toBe(true);
                expect(json.flights).toStrictEqual(v1AllFlight);
            }
        });
    });

    it('returns expected public flights with respect to offset (after)', async () => {
        expect.hasAssertions();

        const flights = getHydratedData().flights.map(convertIFlightToPFlightForV1Only);

        const genUrl = function*() {
            yield `/?after=`;
            yield `/?after=${flights[0].flight_id}`;
            yield `/?after=${new ObjectId()}`;
        }();

        await testApiHandler({
            requestPatcher: req => { req.url = genUrl.next().value || undefined },

            handler: v1Search,
            test: async ({ fetch }) => {
                const responses = await Promise.all([...Array(3)].map(_ => {
                    return fetch({ headers: { KEY } }).then(r => r.ok ? r.json() : null);
                }));

                expect(responses.some(o => !o?.success)).toBeFalse();

                expect(responses.map(r => r.flights)).toIncludeSameMembers([
                    flights.slice(0, RESULT_SIZE),
                    flights.slice(1, RESULT_SIZE+1),
                    []
                ]);
            }
        });
    });

    it('returns expected public flights in the requested sort order', async () => {
        expect.hasAssertions();

        const flights = getHydratedData().flights.map(convertIFlightToPFlightForV1Only);

        const genUrl = function*() {
            yield `/?sort=`;
            yield `/?sort=desc`;
            yield `/?sort=asc`;
            yield `/?sort=bad`;
        }();

        await testApiHandler({
            requestPatcher: req => { req.url = genUrl.next().value || undefined },

            handler: v1Search,
            test: async ({ fetch }) => {
                const responses = await Promise.all([...Array(4)].map(_ => {
                    return fetch({ headers: { KEY } }).then(r => r.ok ? r.json() : r.status);
                }));

                const properResponses = responses.slice(0, 3);

                expect(properResponses.some(o => !o?.success)).toBeFalse();
                expect(properResponses.map(r => r.flights)).toIncludeSameMembers([
                    flights.slice(0, RESULT_SIZE),
                    flights.slice(150, RESULT_SIZE + 150).reverse(),
                    flights.slice(0, RESULT_SIZE)
                ]);

                expect(responses[3]).toBe(400);
            }
        });
    });

    it('returns expected public flights with respect to match', async () => {
        expect.hasAssertions();

        const flights = getHydratedData().flights.map(convertIFlightToPFlightForV1Only);
        const encode = (o: Record<string, unknown>) => encodeURIComponent(JSON.stringify(o));

        const genUrl = function*() {
            yield `/?match=${encode({ airline: 'Spirit' })}`;
            yield `/?match=${encode({ type: 'departure' })}`;
            yield `/?match=${encode({ landingAt: 'F1A' })}`;
            yield `/?match=${encode({ seatPrice: 500 })}`;
            yield `/?match=${encode({ seatPrice: { $gt: 500 } })}`;
            yield `/?match=${encode({ seatPrice: { $gte: 500 } })}`;
            yield `/?match=${encode({ seatPrice: { $lt: 500 } })}`;
            yield `/?match=${encode({ seatPrice: { $lte: 500 } })}`;
        }();

        await testApiHandler({
            requestPatcher: req => { req.url = genUrl.next().value || undefined },

            handler: v1Search,
            test: async ({ fetch }) => {
                const responses = await Promise.all([...Array(8)].map(_ => {
                    return fetch({ headers: { KEY } }).then(r => r.ok ? r.json() : r.status);
                }));

                expect(responses.some(o => !o?.success)).toBeFalse();
                expect(responses.map(r => r.flights)).toIncludeSameMembers([
                    flights.filter(f => f.airline == 'Spirit').slice(0, RESULT_SIZE),
                    flights.filter(f => f.type == 'departure').slice(0, RESULT_SIZE),
                    flights.filter(f => f.landingAt == 'F1A').slice(0, RESULT_SIZE),
                    flights.filter(f => f.seatPrice == 500).slice(0, RESULT_SIZE),
                    flights.filter(f => f.seatPrice > 500).slice(0, RESULT_SIZE),
                    flights.filter(f => f.seatPrice >= 500).slice(0, RESULT_SIZE),
                    flights.filter(f => f.seatPrice < 500).slice(0, RESULT_SIZE),
                    flights.filter(f => f.seatPrice <= 500).slice(0, RESULT_SIZE),
                ]);
            }
        });

        await testApiHandler({
            handler: v1Search,
            requestPatcher: req => { req.url = `/?match=${encode({ ffms: { $eq: 500 }})}` },
            test: async ({ fetch }) => expect((await fetch({ headers: { KEY } })).status).toBe(400)
        });

        await testApiHandler({
            handler: v1Search,
            requestPatcher: req => { req.url = `/?match=${encode({ bad: 500 })}` },
            test: async ({ fetch }) => expect((await fetch({ headers: { KEY } })).status).toBe(400)
        });
    });

    it('returns expected public flights with respect to regexMatch', async () => {
        expect.hasAssertions();

        const flights = getHydratedData().flights.map(convertIFlightToPFlightForV1Only);
        const encode = (o: Record<string, unknown>) => encodeURIComponent(JSON.stringify(o));

        const genUrl = function*() {
            yield `/?regexMatch=${encode({ airline: 'spirit' })}`;
            yield `/?regexMatch=${encode({ type: '^dep' })}`;
            yield `/?regexMatch=${encode({ flightNumber: 'u.*' })}`;
            yield `/?regexMatch=${encode({ flightNumber: 'U.*' })}`;
        }();

        await testApiHandler({
            requestPatcher: req => { req.url = genUrl.next().value || undefined },

            handler: v1Search,
            test: async ({ fetch }) => {
                const responses = await Promise.all([...Array(4)].map(_ => {
                    return fetch({ headers: { KEY } }).then(r => r.ok ? r.json() : r.status);
                }));

                expect(responses.some(o => !o?.success)).toBeFalse();
                expect(responses.map(r => r.flights)).toIncludeSameMembers([
                    flights.filter(f => /spirit/i.test(f.airline)).slice(0, RESULT_SIZE),
                    flights.filter(f => /^dep/i.test(f.type)).slice(0, RESULT_SIZE),
                    flights.filter(f => /u.*/i.test(f.flightNumber)).slice(0, RESULT_SIZE),
                    flights.filter(f => /U.*/i.test(f.flightNumber)).slice(0, RESULT_SIZE)
                ]);
            }
        });
    });

    it('regexMatch errors properly with bad inputs', async () => {
        expect.hasAssertions();

        const encode = (o: Record<string, unknown>) => encodeURIComponent(JSON.stringify(o));

        const genUrl = function*() {
            yield `/?regexMatch=${encode({ ffms: { $gt: 500 }})}`;
            yield `/?regexMatch=${encode({ bad: 'super-bad' })}`;
            yield `/?regexMatch=${encode({ seatPrice: 500 })}`;
        }();

        await testApiHandler({
            requestPatcher: req => { req.url = genUrl.next().value || undefined },

            handler: v1Search,
            test: async ({ fetch }) => {
                await Promise.all([...Array(3)].map(_ => {
                    return fetch({ headers: { KEY } }).then(r => r.status).then(s => expect(s).toBe(400));
                }));
            }
        });
    });

    it('ensure seats, baggage, extras, bookable, and _id cannot be matched against', async () => {
        expect.hasAssertions();

        const encode = (o: Record<string, unknown>) => encodeURIComponent(JSON.stringify(o));

        const genUrl = function*() {
            yield `/?match=${encode({ seats: 'super-bad' })}`;
            yield `/?match=${encode({ baggage: 'super-bad' })}`;
            yield `/?match=${encode({ extras: 'super-bad' })}`;
            yield `/?match=${encode({ bookable: 'super-bad'})}`;
            yield `/?match=${encode({ _id: 'super-bad' })}`;
            yield `/?regexMatch=${encode({ seats: 'super-bad' })}`;
            yield `/?regexMatch=${encode({ baggage: 'super-bad' })}`;
            yield `/?regexMatch=${encode({ bookable: 'super-bad' })}`;
            yield `/?regexMatch=${encode({ extras: 'super-bad' })}`;
            yield `/?regexMatch=${encode({ _id: 'super-bad' })}`;
        }();

        await testApiHandler({
            requestPatcher: req => { req.url = genUrl.next().value || undefined },

            handler: v1Search,
            test: async ({ fetch }) => {
                await Promise.all([...Array(10)].map(_ => {
                    return fetch({ headers: { KEY } }).then(r => r.status).then(s => expect(s).toBe(400));
                }));
            }
        });
    });

    it('returns expected public flights with respect to all parameters simultaneously', async () => {
        expect.hasAssertions();

        const flights = getHydratedData().flights.map(convertIFlightToPFlightForV1Only);
        const encode = (o: Record<string, unknown>) => encodeURIComponent(JSON.stringify(o));

        const genUrl = function*() {
            yield `/?sort=desc&after=${flights[249].flight_id}&match=${encode({ ffms: { $gt: 1000000 }})}&regexMatch=${encode({ airline: 'spirit' })}`;
            yield `/?sort=desc&after=${flights[0].flight_id}&match=${encode({ ffms: { $gt: 1000000 }})}&regexMatch=${encode({ airline: 'spirit' })}`;
        }();

        await testApiHandler({
            requestPatcher: req => { req.url = genUrl.next().value || undefined },

            handler: v1Search,
            test: async ({ fetch }) => {
                const responses = await Promise.all([...Array(2)].map(_ => {
                    return fetch({ headers: { KEY } }).then(r => r.ok ? r.json() : r.status);
                }));

                expect(responses.some(o => !o?.success)).toBeFalse();
                expect(responses.map(r => r.flights)).toIncludeSameMembers([
                    [flights[248]],
                    []
                ]);
            }
        });
    });

    describe('/with-ids', () => {
        it('returns expected flights by default in FIFO order', async () => {
            expect.hasAssertions();

            const flightIds = getHydratedData().flights.map(flight => flight._id.toHexString());
            const encode = (ids: string[]) => encodeURIComponent(JSON.stringify(ids));

            const genUrl = function*() {
                yield `/?ids=${encode([flightIds[0]])}`;
                yield `/?ids=${encode([flightIds[50]])}`;
                yield `/?ids=${encode([flightIds[249]])}`;
                yield `/?ids=${encode(flightIds.slice(0, 50))}`;
                yield `/?ids=${encode(flightIds.slice(90, 150))}`;
                yield `/?ids=${encode([...flightIds.slice(90, 150), (new ObjectId()).toHexString()])}`;
                yield `/?ids=${encode([(new ObjectId()).toHexString()])}`;
                yield `/?ids=${encode([(new ObjectId()).toHexString(), (new ObjectId()).toHexString()])}`;
                yield `/?ids=`;
            }();

            await testApiHandler({
                requestPatcher: req => { req.url = genUrl.next().value || undefined },
                handler: v1WithIds,
                test: async ({ fetch }) => {
                    const responses = await Promise.all([...Array(9)].map(_ => {
                        return fetch({ headers: { KEY } }).then(r => r.ok ? r.json() : null);
                    }));

                    expect(responses.some(o => !o?.success)).toBeFalse();

                    expect(responses.map(r => r.flights.map((f: PublicFlight) => f.flight_id))).toIncludeSameMembers([
                        [flightIds[0]],
                        [flightIds[50]],
                        [flightIds[249]],
                        flightIds.slice(0, 50),
                        flightIds.slice(90, 150),
                        [...flightIds.slice(90, 150)],
                        [],
                        [],
                        []
                    ]);
                }
            });
        });

        it('does the right thing when garbage ids are provided', async () => {
            expect.hasAssertions();

            const genUrl = function*() {
                yield '/?ids=${}';
                yield '/?ids=(.*)';
                yield '/?ids=flightIds';
                yield '/?ids=0,50';
                yield `/?ids=${encodeURIComponent(JSON.stringify(['lol', false]))}`;
            }();

            await testApiHandler({
                requestPatcher: req => { req.url = genUrl.next().value || undefined },
                handler: v1WithIds,
                test: async ({ fetch }) => {
                    const responses = await Promise.all([...Array(5)].map(_ => {
                        return fetch({ headers: { KEY } }).then(r => r.ok ? r.json() : null);
                    }));

                    expect(responses.some(o => !o?.success)).toBeFalse();

                    expect(responses.map(r => r.flights)).toIncludeSameMembers([
                        [],
                        [],
                        [],
                        [],
                        []
                    ]);
                }
            });
        });
    });
});

describe('api/v2/flights', () => {
    it('returns expected number of public flights by default in FIFO order', async () => {
        expect.hasAssertions();

        const results = getHydratedData().flights.slice(0, getEnv().RESULTS_PER_PAGE).map(convertIFlightToPFlight);

        await testApiHandler({
            handler: v2Flights,
            test: async ({ fetch }) => {
                const response = await fetch({ headers: { KEY } });
                const json = await response.json();

                expect(response.status).toBe(200);
                expect(json.success).toBe(true);
                expect(json.flights).toStrictEqual(results);
            }
        });
    });

    it('returns expected number of public flights in FIFO order respecting offset (after)', async () => {
        expect.hasAssertions();

        const flights = getHydratedData().flights.map(convertIFlightToPFlight);

        const genUrl = function*() {
            yield `/?after=`;
            yield `/?after=${flights[0].flight_id}`;
            yield `/?after=${flights[1].flight_id}`;
            yield `/?after=${flights[10].flight_id}`;
            yield `/?after=${flights[50].flight_id}`;
            yield `/?after=${flights[100].flight_id}`;
            yield `/?after=${flights[200].flight_id}`;
            yield `/?after=${flights[248].flight_id}`;
            yield `/?after=${flights[249].flight_id}`;
            yield `/?after=${new ObjectId()}`;
        }();

        await testApiHandler({
            requestPatcher: req => { req.url = genUrl.next().value || undefined },
            handler: v2Flights,
            test: async ({ fetch }) => {
                const responses = await Promise.all([...Array(10)].map(_ => {
                    return fetch({ headers: { KEY } }).then(r => r.ok ? r.json() : null);
                }));

                expect(responses.some(o => !o?.success)).toBeFalse();

                expect(responses.map(r => r.flights)).toIncludeSameMembers([
                    flights.slice(0, RESULT_SIZE),
                    flights.slice(1, RESULT_SIZE + 1),
                    flights.slice(2, RESULT_SIZE + 2),
                    flights.slice(11, RESULT_SIZE + 11),
                    flights.slice(51, RESULT_SIZE + 51),
                    flights.slice(101, RESULT_SIZE + 101),
                    flights.slice(201, RESULT_SIZE + 150),
                    flights.slice(-1),
                    [],
                    []
                ]);
            }
        });
    });

    it('does the right thing when garbage offsets (after) are provided', async () => {
        expect.hasAssertions();

        const genUrl = function*() {
            yield `/?after=-5`;
            yield `/?after=a`;
            yield `/?after=@($)`;
            yield `/?after=xyz`;
            yield `/?after=123`;
            yield `/?after=(*$)`;
            yield `/?dne=123`;
        }();

        await testApiHandler({
            requestPatcher: req => { req.url = genUrl.next().value || undefined },
            handler: v2Flights,
            test: async ({ fetch }) => {
                const responses = await Promise.all([...Array(7)].map(_ => {
                    return fetch({ headers: { KEY } }).then(r => r.status);
                }));

                expect(responses).toIncludeSameMembers([
                    404,
                    404,
                    404,
                    404,
                    404,
                    404,
                    200
                ]);
            }
        });
    });

    it('does not throw when there are no flights in the system', async () => {
        expect.hasAssertions();

        await (await getDb()).collection('flights').deleteMany({});

        await testApiHandler({
            handler: v2Flights,
            test: async ({ fetch }) => {
                const response = await fetch({ headers: { KEY } });

                expect(response.status).toBe(200);
                expect((await response.json()).success).toBe(true);
            }
        });
    });

    it('returns same flights as /all if no query params given', async () => {
        expect.hasAssertions();

        let v2FlightsFlight: PublicFlight[];

        await testApiHandler({
            handler: v2Flights,
            test: async ({ fetch }) => {
                const response = await fetch({ headers: { KEY }});
                v2FlightsFlight = (await response.json()).flights;
            }
        });

        await testApiHandler({
            handler: v2Flights,
            test: async ({ fetch }) => {
                const response = await fetch({ headers: { KEY } });
                const json = await response.json();

                expect(response.status).toBe(200);
                expect(json.success).toBe(true);
                expect(json.flights).toStrictEqual(v2FlightsFlight);
            }
        });
    });

    it('returns expected public flights with respect to offset (after)', async () => {
        expect.hasAssertions();

        const flights = getHydratedData().flights.map(convertIFlightToPFlight);

        const genUrl = function*() {
            yield `/?after=`;
            yield `/?after=${flights[0].flight_id}`;
            yield `/?after=${new ObjectId()}`;
        }();

        await testApiHandler({
            requestPatcher: req => { req.url = genUrl.next().value || undefined },

            handler: v2Flights,
            test: async ({ fetch }) => {
                const responses = await Promise.all([...Array(3)].map(_ => {
                    return fetch({ headers: { KEY } }).then(r => r.ok ? r.json() : null);
                }));

                expect(responses.some(o => !o?.success)).toBeFalse();

                expect(responses.map(r => r.flights)).toIncludeSameMembers([
                    flights.slice(0, RESULT_SIZE),
                    flights.slice(1, RESULT_SIZE+1),
                    []
                ]);
            }
        });
    });

    it('returns expected public flights in the requested sort order', async () => {
        expect.hasAssertions();

        const flights = getHydratedData().flights.map(convertIFlightToPFlight);

        const genUrl = function*() {
            yield `/?sort=`;
            yield `/?sort=desc`;
            yield `/?sort=asc`;
            yield `/?sort=bad`;
        }();

        await testApiHandler({
            requestPatcher: req => { req.url = genUrl.next().value || undefined },

            handler: v2Flights,
            test: async ({ fetch }) => {
                const responses = await Promise.all([...Array(4)].map(_ => {
                    return fetch({ headers: { KEY } }).then(r => r.ok ? r.json() : r.status);
                }));

                const properResponses = responses.slice(0, 3);

                expect(properResponses.some(o => !o?.success)).toBeFalse();
                expect(properResponses.map(r => r.flights)).toIncludeSameMembers([
                    flights.slice(0, RESULT_SIZE),
                    flights.slice(150, RESULT_SIZE + 150).reverse(),
                    flights.slice(0, RESULT_SIZE)
                ]);

                expect(responses[3]).toBe(400);
            }
        });
    });

    it('returns expected public flights with respect to match', async () => {
        expect.hasAssertions();

        const flights = getHydratedData().flights.map(convertIFlightToPFlight);
        const encode = (o: Record<string, unknown>) => encodeURIComponent(JSON.stringify(o));

        const genUrl = function*() {
            yield `/?match=${encode({ airline: 'Spirit' })}`;
            yield `/?match=${encode({ type: 'departure' })}`;
            yield `/?match=${encode({ landingAt: 'F1A' })}`;
        }();

        await testApiHandler({
            requestPatcher: req => { req.url = genUrl.next().value || undefined },

            handler: v2Flights,
            test: async ({ fetch }) => {
                const responses = await Promise.all([...Array(3)].map(_ => {
                    return fetch({ headers: { KEY } }).then(r => r.ok ? r.json() : r.status);
                }));

                expect(responses.some(o => !o?.success)).toBeFalse();
                expect(responses.map(r => r.flights)).toIncludeSameMembers([
                    flights.filter(f => f.airline == 'Spirit').slice(0, RESULT_SIZE),
                    flights.filter(f => f.type == 'departure').slice(0, RESULT_SIZE),
                    flights.filter(f => f.landingAt == 'F1A').slice(0, RESULT_SIZE),
                ]);
            }
        });

        await testApiHandler({
            handler: v2Flights,
            requestPatcher: req => { req.url = `/?match=${encode({ ffms: { $eq: 500 }})}` },
            test: async ({ fetch }) => expect((await fetch({ headers: { KEY } })).status).toBe(400)
        });

        await testApiHandler({
            handler: v2Flights,
            requestPatcher: req => { req.url = `/?match=${encode({ bad: 500 })}` },
            test: async ({ fetch }) => expect((await fetch({ headers: { KEY } })).status).toBe(400)
        });
    });

    it('returns expected public flights with respect to regexMatch', async () => {
        expect.hasAssertions();

        const flights = getHydratedData().flights.map(convertIFlightToPFlight);
        const encode = (o: Record<string, unknown>) => encodeURIComponent(JSON.stringify(o));

        const genUrl = function*() {
            yield `/?regexMatch=${encode({ airline: 'spirit' })}`;
            yield `/?regexMatch=${encode({ type: '^dep' })}`;
            yield `/?regexMatch=${encode({ flightNumber: 'u.*' })}`;
            yield `/?regexMatch=${encode({ flightNumber: 'U.*' })}`;
        }();

        await testApiHandler({
            requestPatcher: req => { req.url = genUrl.next().value || undefined },

            handler: v2Flights,
            test: async ({ fetch }) => {
                const responses = await Promise.all([...Array(4)].map(_ => {
                    return fetch({ headers: { KEY } }).then(r => r.ok ? r.json() : r.status);
                }));

                expect(responses.some(o => !o?.success)).toBeFalse();
                expect(responses.map(r => r.flights)).toIncludeSameMembers([
                    flights.filter(f => /spirit/i.test(f.airline)).slice(0, RESULT_SIZE),
                    flights.filter(f => /^dep/i.test(f.type)).slice(0, RESULT_SIZE),
                    flights.filter(f => /u.*/i.test(f.flightNumber)).slice(0, RESULT_SIZE),
                    flights.filter(f => /U.*/i.test(f.flightNumber)).slice(0, RESULT_SIZE)
                ]);
            }
        });
    });

    it('regexMatch errors properly with bad inputs', async () => {
        expect.hasAssertions();

        const encode = (o: Record<string, unknown>) => encodeURIComponent(JSON.stringify(o));

        const genUrl = function*() {
            yield `/?regexMatch=${encode({ ffms: { $gt: 500 }})}`;
            yield `/?regexMatch=${encode({ bad: 'super-bad' })}`;
            yield `/?regexMatch=${encode({ seatPrice: 500 })}`;
        }();

        await testApiHandler({
            requestPatcher: req => { req.url = genUrl.next().value || undefined },

            handler: v2Flights,
            test: async ({ fetch }) => {
                await Promise.all([...Array(3)].map(_ => {
                    return fetch({ headers: { KEY } }).then(r => r.status).then(s => expect(s).toBe(400));
                }));
            }
        });
    });

    it('ensure seats, baggage, extras, bookable, and _id cannot be matched against', async () => {
        expect.hasAssertions();

        const encode = (o: Record<string, unknown>) => encodeURIComponent(JSON.stringify(o));

        const genUrl = function*() {
            yield `/?match=${encode({ seats: 'super-bad' })}`;
            yield `/?match=${encode({ baggage: 'super-bad' })}`;
            yield `/?match=${encode({ extras: 'super-bad' })}`;
            yield `/?match=${encode({ bookable: 'super-bad'})}`;
            yield `/?match=${encode({ _id: 'super-bad' })}`;
            yield `/?regexMatch=${encode({ seats: 'super-bad' })}`;
            yield `/?regexMatch=${encode({ baggage: 'super-bad' })}`;
            yield `/?regexMatch=${encode({ bookable: 'super-bad' })}`;
            yield `/?regexMatch=${encode({ extras: 'super-bad' })}`;
            yield `/?regexMatch=${encode({ _id: 'super-bad' })}`;
        }();

        await testApiHandler({
            requestPatcher: req => { req.url = genUrl.next().value || undefined },

            handler: v2Flights,
            test: async ({ fetch }) => {
                await Promise.all([...Array(10)].map(_ => {
                    return fetch({ headers: { KEY } }).then(r => r.status).then(s => expect(s).toBe(400));
                }));
            }
        });
    });

    it('returns expected public flights with respect to all parameters simultaneously', async () => {
        expect.hasAssertions();

        const flights = getHydratedData().flights.map(convertIFlightToPFlight);
        const encode = (o: Record<string, unknown>) => encodeURIComponent(JSON.stringify(o));

        const genUrl = function*() {
            yield `/?sort=desc&after=${flights[249].flight_id}&match=${encode({ ffms: { $gt: 1000000 }})}&regexMatch=${encode({ airline: 'spirit' })}`;
            yield `/?sort=desc&after=${flights[0].flight_id}&match=${encode({ ffms: { $gt: 1000000 }})}&regexMatch=${encode({ airline: 'spirit' })}`;
        }();

        await testApiHandler({
            requestPatcher: req => { req.url = genUrl.next().value || undefined },

            handler: v2Flights,
            test: async ({ fetch }) => {
                const responses = await Promise.all([...Array(2)].map(_ => {
                    return fetch({ headers: { KEY } }).then(r => r.ok ? r.json() : r.status);
                }));

                expect(responses.some(o => !o?.success)).toBeFalse();
                expect(responses.map(r => r.flights)).toIncludeSameMembers([
                    [flights[248]],
                    []
                ]);
            }
        });
    });

    it('returns expected flights when searching by flight_id', async () => {
        expect.hasAssertions();

        const flightIds = getHydratedData().flights.map(flight => flight._id.toHexString());
        const encode = (ids: string[]) => encodeURIComponent(JSON.stringify({ flight_id: ids.join('|') }));

        const genUrl = function*() {
            yield `/?regexMatch=${encode([flightIds[0]])}`;
            yield `/?regexMatch=${encode([flightIds[50]])}`;
            yield `/?regexMatch=${encode([flightIds[249]])}`;
            yield `/?regexMatch=${encode(flightIds.slice(0, 50))}`;
            yield `/?regexMatch=${encode(flightIds.slice(90, 150))}`;
            yield `/?regexMatch=${encode([...flightIds.slice(90, 150), (new ObjectId()).toHexString()])}`;
            yield `/?regexMatch=${encode([(new ObjectId()).toHexString()])}`;
            yield `/?regexMatch=${encode([(new ObjectId()).toHexString(), (new ObjectId()).toHexString()])}`;
        }();

        await testApiHandler({
            requestPatcher: req => { req.url = genUrl.next().value || undefined },
            handler: v2Flights,
            test: async ({ fetch }) => {
                const responses = await Promise.all([...Array(8)].map(_ => {
                    return fetch({ headers: { KEY } }).then(r => r.ok ? r.json() : null);
                }));

                expect(responses.some(o => !o?.success)).toBeFalse();

                expect(responses.map(r => r.flights.map((f: PublicFlight) => f.flight_id))).toIncludeSameMembers([
                    [flightIds[0]],
                    [flightIds[50]],
                    [flightIds[249]],
                    flightIds.slice(0, 50),
                    flightIds.slice(90, 150),
                    flightIds.slice(90, 150),
                    [],
                    []
                ]);
            }
        });
    });
});
