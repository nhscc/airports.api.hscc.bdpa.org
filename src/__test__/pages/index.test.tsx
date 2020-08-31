import { setupJest } from 'universe/__test__/db'
import * as IndexPage from 'universe/pages/index'

const { getDb } = setupJest();

process.env.REQUESTS_PER_CONTRIVED_ERROR = '0';

describe('pages/index', () => {
    void getDb;
    void IndexPage;

    test.todo('functions as expected');
});
