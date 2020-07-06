import { setupJest } from 'universe/__test__/db'
import { testApiEndpoint } from 'multiverse/test-api-endpoint'
import * as V1_airlines from 'universe/pages/api/v1/info/airlines'
import * as V1_airports from 'universe/pages/api/v1/info/airports'
import * as V1_no_fly_list from 'universe/pages/api/v1/info/no-fly-list'
import * as V2_airlines from 'universe/pages/api/v2/info/airlines'
import * as V2_airports from 'universe/pages/api/v2/info/airports'
import * as V2_all_extras from 'universe/pages/api/v2/info/all-extras'
import * as V2_no_fly_list from 'universe/pages/api/v2/info/no-fly-list'
import * as V2_seat_classes from 'universe/pages/api/v2/info/seat-classes'
import { getEnv } from 'universe/backend/env'
import { DUMMY_KEY } from 'universe/backend'

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

describe('api/v1/info', () => {
    describe('/airlines', () => {
        it('returns data as expected', async () => {
            test.todo('TODO');
        });
    });

    describe('/airports', () => {
        it('returns data as expected', async () => {
            test.todo('TODO');
        });
    });

    describe('/no-fly-list', () => {
        it('returns data as expected', async () => {
            test.todo('TODO');
        });
    });
});

describe('api/v1/info', () => {
    describe('/airlines', () => {
        it('returns data as expected', async () => {
            test.todo('TODO');
        });
    });

    describe('/airports', () => {
        it('returns data as expected', async () => {
            test.todo('TODO');
        });
    });

    describe('/all-extras', () => {
        it('returns data as expected', async () => {
            test.todo('TODO');
        });
    });

    describe('/no-fly-list', () => {
        it('returns data as expected', async () => {
            test.todo('TODO');
        });
    });

    describe('/seat-classes', () => {
        it('returns data as expected', async () => {
            test.todo('TODO');
        });
    });
});
