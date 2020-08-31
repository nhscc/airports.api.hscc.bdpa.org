import { setupJest } from 'universe/__test__/db'
import { testApiEndpoint } from 'multiverse/test-api-endpoint'
import * as Frontend from 'universe/frontend'
import sha256 from 'crypto-js/sha256'

const { getDb } = setupJest();

process.env.REQUESTS_PER_CONTRIVED_ERROR = '0';

describe('universe/frontend', () => {
    void getDb;
    void sha256;
    void Frontend;
    void testApiEndpoint;

    test.todo('functions as expected');
});
