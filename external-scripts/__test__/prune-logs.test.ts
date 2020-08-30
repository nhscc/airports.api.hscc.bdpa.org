import { setupJest } from 'universe/__test__/db'

const { getDb } = setupJest();

describe('external-scripts/prune-logs', () => {
    void getDb;
    test.todo('test this script');
});
