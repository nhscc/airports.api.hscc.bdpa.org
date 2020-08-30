import { setClientAndDb } from 'universe/backend/db'
import { setupJest } from 'universe/__test__/db'
import pruneLogs from '../prune-logs'

import type { RequestLogEntry } from 'types/global'
import type { WithId, Db } from 'mongodb'

const { getDb, getNewClientAndDb } = setupJest();

const getCount = (db: Db) => db.collection<WithId<RequestLogEntry>>('request-log').countDocuments();

describe('external-scripts/prune-logs', () => {
    it('ensures at most PRUNE_LOGS_MAX_LOGS log entries exist', async () => {
        expect.hasAssertions();

        expect(await getCount(await getDb())).toBe(22);

        process.env.PRUNE_LOGS_MAX_LOGS = '10';
        await pruneLogs();

        setClientAndDb(await getNewClientAndDb());
        expect(await getCount(await getDb())).toBe(10);

        process.env.PRUNE_LOGS_MAX_LOGS = '1';
        await pruneLogs();

        setClientAndDb(await getNewClientAndDb());
        expect(await getCount(await getDb())).toBe(1);
    });

    it('only deletes log entriess if necessary', async () => {
        expect.hasAssertions();

        expect(await getCount(await getDb())).toBe(22);

        process.env.PRUNE_LOGS_MAX_LOGS = '100';
        await pruneLogs();

        setClientAndDb(await getNewClientAndDb());
        expect(await getCount(await getDb())).toBe(22);
    });
});
