import { setupJest } from 'universe/__test__/db'

const { getDb } = setupJest();

describe('external-scripts/generate-flights', () => {
    void getDb;
    test.todo('test this script');
});
