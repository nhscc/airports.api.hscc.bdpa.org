import { setupJest } from 'universe/__test__/db'
import { testApiEndpoint } from 'multiverse/test-api-endpoint'
import * as ApiAdminEndpoint from 'universe/pages/api/admin'

const { getDb } = setupJest();

process.env.REQUESTS_PER_CONTRIVED_ERROR = '0';

describe('api/admin', () => {
    test.todo('functions as expected');
});
