import { setupJest } from 'universe/__test__/db'
import { testApiEndpoint } from 'multiverse/test-api-endpoint'
import * as V1_all from 'universe/pages/api/v1/flights/all'
import * as V1_search from 'universe/pages/api/v1/flights/search'
import * as V1_with_ids from 'universe/pages/api/v1/flights/with-ids'
import * as V2_flights from 'universe/pages/api/v2/flights/[[...params]]'
import { getEnv } from 'universe/backend/env'
import { DUMMY_KEY } from 'universe/backend'

import type { WithConfig } from 'types/global'

const { getHydratedData } = setupJest();

const v1AllEndpoint: WithConfig<typeof V1_all.default> = V1_all.default;
v1AllEndpoint.config = V1_all.config;

const v1Search: WithConfig<typeof V1_search.default> = V1_search.default;
v1Search.config = V1_search.config;

const v1WithIds: WithConfig<typeof V1_with_ids.default> = V1_with_ids.default;
v1WithIds.config = V1_with_ids.config;

const v2Flights: WithConfig<typeof V2_flights.default> = V2_flights.default;
v2Flights.config = V2_flights.config;

process.env.REQUESTS_PER_CONTRIVED_ERROR = '0';

describe('api/v1/flights', () => {
    describe('/all', () => {
        it('returns data as expected', async () => {
            test.todo('TODO');
            // await testApiEndpoint({
            //     next: v1AllEndpoint,
            //     test: async ({ fetch }) => {
            //         const response = await fetch({ headers: { DUMMY_KEY } });
            //         const json = await response.json();
            //     }
            // });
        });
    });

    describe('/search', () => {
        it('returns data as expected', async () => {
            test.todo('TODO');
            // await testApiEndpoint({
            //     next: v1Search,
            //     test: async ({ fetch }) => {
            //         const response = await fetch({ headers: { DUMMY_KEY } });
            //         const json = await response.json();
            //     }
            // });
        });
    });

    describe('/search', () => {
        it('returns data as expected', async () => {
            test.todo('TODO');
            // await testApiEndpoint({
            //     next: v1WithIds,
            //     test: async ({ fetch }) => {
            //         const response = await fetch({ headers: { DUMMY_KEY } });
            //         const json = await response.json();
            //     }
            // });
        });
    });
});

describe('api/v2/flights', () => {
    it('returns data as expected', async () => {
        test.todo('TODO');
        // await testApiEndpoint({
        //     next: v2Flights,
        //     test: async ({ fetch }) => {
        //         const response = await fetch({ headers: { DUMMY_KEY } });
        //         const json = await response.json();
        //     }
        // });
    });
});
