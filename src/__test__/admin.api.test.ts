import { setupJest } from 'testverse/db'
import { testApiHandler } from 'next-test-api-route-handler'
import * as ApiAdminEndpoint from 'universe/pages/api/[[...admin]]'

const { getDb } = setupJest();

process.env.REQUESTS_PER_CONTRIVED_ERROR = '0';

describe('api/admin', () => {
    void getDb;
    void ApiAdminEndpoint;
    void testApiHandler;

    test.todo('functions as expected');
});
