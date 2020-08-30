import { setupJest } from 'universe/__test__/db'

const { getDb } = setupJest();

describe('external-scripts/ban-hammer', () => {
    void getDb;
    test.todo('test this script');
});
