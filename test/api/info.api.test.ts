import { setupJest } from 'testverse/db'
import { testApiHandler } from 'next-test-api-route-handler'
import * as V1_airlines from 'universe/pages/api/v1/info/airlines'
import * as V1_airports from 'universe/pages/api/v1/info/airports'
import * as V1_no_fly_list from 'universe/pages/api/v1/info/no-fly-list'
import * as V2_airlines from 'universe/pages/api/v2/info/airlines'
import * as V2_airports from 'universe/pages/api/v2/info/airports'
import * as V2_all_extras from 'universe/pages/api/v2/info/all-extras'
import * as V2_no_fly_list from 'universe/pages/api/v2/info/no-fly-list'
import * as V2_seat_classes from 'universe/pages/api/v2/info/seat-classes'
import { DUMMY_KEY as KEY } from 'universe/backend'

import type { WithConfig } from 'types/global'

const { getHydratedData } = setupJest();

const v1Airlines: WithConfig<typeof V1_airlines.default> = V1_airlines.default;
v1Airlines.config = V1_airlines.config;

const v1Airports: WithConfig<typeof V1_airports.default> = V1_airports.default;
v1Airports.config = V1_airports.config;

const v1NoFlyList: WithConfig<typeof V1_no_fly_list.default> = V1_no_fly_list.default;
v1NoFlyList.config = V1_no_fly_list.config;

const v2Airlines: WithConfig<typeof V2_airlines.default> = V2_airlines.default;
v2Airlines.config = V2_airlines.config;

const v2Airports: WithConfig<typeof V2_airports.default> = V2_airports.default;
v2Airports.config = V2_airports.config;

const v2AllExtras: WithConfig<typeof V2_all_extras.default> = V2_all_extras.default;
v2AllExtras.config = V2_all_extras.config;

const v2NoFlyList: WithConfig<typeof V2_no_fly_list.default> = V2_no_fly_list.default;
v2NoFlyList.config = V2_no_fly_list.config;

const v2SeatClasses: WithConfig<typeof V2_seat_classes.default> = V2_seat_classes.default;
v2SeatClasses.config = V2_seat_classes.config;

process.env.REQUESTS_PER_CONTRIVED_ERROR = '0';
process.env.DISABLED_API_VERSIONS = '';

describe('api/v1/info', () => {
    describe('/airlines', () => {
        it('returns data as expected', async () => {
            expect.hasAssertions();

            const airlines = getHydratedData().airlines.map(a => {
                const { name, codePrefix } = a;

                return {
                    name,
                    codePrefix
                };
            });

            await testApiHandler({
                handler: v1Airlines,
                test: async ({ fetch }) => {
                    const response = await fetch({ headers: { KEY, 'content-type': 'application/json' }});

                    expect(response.status).toBe(200);
                    expect(await response.json()).toStrictEqual({ airlines, success: true });
                }
            });
        });
    });

    describe('/airports', () => {
        it('returns data as expected', async () => {
            expect.hasAssertions();

            const airports = getHydratedData().airports.map(a => {
                const { city, country, state, name, shortName } = a;

                return {
                    city,
                    state,
                    country,
                    name,
                    shortName
                };
            });

            await testApiHandler({
                handler: v1Airports,
                test: async ({ fetch }) => {
                    const response = await fetch({ headers: { KEY, 'content-type': 'application/json' }});

                    expect(response.status).toBe(200);
                    expect(await response.json()).toStrictEqual({ airports, success: true });
                }
            });
        });
    });

    describe('/no-fly-list', () => {
        it('returns data as expected', async () => {
            expect.hasAssertions();

            const noFlyList = getHydratedData().noFlyList.map(item => {
                const { _id, ...noFly } = item;
                return noFly;
            });

            await testApiHandler({
                handler: v1NoFlyList,
                test: async ({ fetch }) => {
                    const response = await fetch({ headers: { KEY, 'content-type': 'application/json' }});

                    expect(response.status).toBe(200);
                    expect(await response.json()).toStrictEqual({ noFlyList, success: true });
                }
            });
        });
    });
});

describe('api/v2/info', () => {
    describe('/airlines', () => {
        it('returns data as expected', async () => {
            expect.hasAssertions();

            const airlines = getHydratedData().airlines.map(a => {
                const { name, codePrefix } = a;

                return {
                    name,
                    codePrefix
                };
            });

            await testApiHandler({
                handler: v2Airlines,
                test: async ({ fetch }) => {
                    const response = await fetch({ headers: { KEY, 'content-type': 'application/json' }});

                    expect(response.status).toBe(200);
                    expect(await response.json()).toStrictEqual({ airlines, success: true });
                }
            });
        });
    });

    describe('/airports', () => {
        it('returns data as expected', async () => {
            expect.hasAssertions();

            const airports = getHydratedData().airports.map(a => {
                const { city, country, state, name, shortName } = a;

                return {
                    city,
                    state,
                    country,
                    name,
                    shortName
                };
            });

            await testApiHandler({
                handler: v2Airports,
                test: async ({ fetch }) => {
                    const response = await fetch({ headers: { KEY, 'content-type': 'application/json' }});

                    expect(response.status).toBe(200);
                    expect(await response.json()).toStrictEqual({ airports, success: true });
                }
            });
        });
    });

    describe('/all-extras', () => {
        it('returns data as expected', async () => {
            expect.hasAssertions();

            await testApiHandler({
                handler: v2AllExtras,
                test: async ({ fetch }) => {
                    const response = await fetch({ headers: { KEY, 'content-type': 'application/json' }});

                    expect(response.status).toBe(200);
                    expect(await response.json()).toStrictEqual({
                        extras: getHydratedData().info.allExtras,
                        success: true
                    });
                }
            });
        });
    });

    describe('/no-fly-list', () => {
        it('returns data as expected', async () => {
            expect.hasAssertions();

            const noFlyList = getHydratedData().noFlyList.map(item => {
                const { _id, ...noFly } = item;
                return noFly;
            });

            await testApiHandler({
                handler: v2NoFlyList,
                test: async ({ fetch }) => {
                    const response = await fetch({ headers: { KEY, 'content-type': 'application/json' }});

                    expect(response.status).toBe(200);
                    expect(await response.json()).toStrictEqual({ noFlyList, success: true });
                }
            });
        });
    });

    describe('/seat-classes', () => {
        it('returns data as expected', async () => {
            expect.hasAssertions();

            await testApiHandler({
                handler: v2SeatClasses,
                test: async ({ fetch }) => {
                    const response = await fetch({ headers: { KEY, 'content-type': 'application/json' }});

                    expect(response.status).toBe(200);
                    expect(await response.json()).toStrictEqual({
                        seats: getHydratedData().info.seatClasses,
                        success: true
                    });
                }
            });
        });
    });
});
