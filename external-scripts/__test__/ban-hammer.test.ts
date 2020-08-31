import { setClientAndDb } from 'universe/backend/db'
import { setupJest } from 'universe/__test__/db'
import banHammer from '../ban-hammer'

import type { RequestLogEntry, LimitedLogEntry } from 'types/global'
import type { WithId } from 'mongodb'

jest.setTimeout(10**6);

const { getDb, getNewClientAndDb } = setupJest();

const getRequestLogDb = async () => (await getDb()).collection<WithId<RequestLogEntry>>('request-log');
const getRateLimitsDb = async () => (await getDb()).collection<WithId<LimitedLogEntry>>('limited-log-mview');
const getRateLimits = async () => (await getRateLimitsDb()).find().project({ _id: 0, ip:  1, key: 1 }).toArray();
const getRateLimitUntils = async () => (await getRateLimitsDb()).find().project({ _id: 0, until: 1 }).toArray();

describe('external-scripts/ban-hammer', () => {
    it('rate limits only the ips and their keys that exceed BAN_HAMMER_MAX_REQUESTS_PER_WINDOW/BAN_HAMMER_RESOLUTION_WINDOW_SECONDS', async () => {
        expect.hasAssertions();

        const now = Date.now();

        await (await getRequestLogDb()).updateMany({}, { $set: { time: now - 1000 }});
        await (await getRateLimitsDb()).deleteMany({});

        process.env.BAN_HAMMER_MAX_REQUESTS_PER_WINDOW = '10';
        process.env.BAN_HAMMER_RESOLUTION_WINDOW_SECONDS = '1';
        await banHammer();

        setClientAndDb(await getNewClientAndDb());
        expect(await getRateLimits()).toIncludeSameMembers([
            { ip: '1.2.3.4' },
            { key: '00000000-0000-0000-0000-000000000000' },
        ]);

        await (await getRateLimitsDb()).deleteMany({});
        await (await getRequestLogDb()).updateMany(
            { key: '00000000-0000-0000-0000-000000000000' },
            { $set: { ip: '9.8.7.6' }}
        );

        await banHammer();

        setClientAndDb(await getNewClientAndDb());
        expect(await getRateLimits()).toIncludeSameMembers([
            { ip: '1.2.3.4' },
            { ip: '9.8.7.6' },
            { key: '00000000-0000-0000-0000-000000000000' },
        ]);

        await (await getRateLimitsDb()).deleteMany({});

        await (await getRequestLogDb()).insertOne({
            ip: '1.2.3.4',
            key: '00000000-0000-0000-0000-000000000000',
            method: 'PUT',
            resStatusCode: 200,
            route: 'jest/test',
            time: now - 2000
        });

        process.env.BAN_HAMMER_MAX_REQUESTS_PER_WINDOW = '11';
        await banHammer();

        setClientAndDb(await getNewClientAndDb());
        expect(await getRateLimits()).toHaveLength(0);

        process.env.BAN_HAMMER_RESOLUTION_WINDOW_SECONDS = '5';
        await banHammer();

        setClientAndDb(await getNewClientAndDb());
        expect(await getRateLimits()).toIncludeSameMembers([
            { ip: '1.2.3.4' },
            { key: '00000000-0000-0000-0000-000000000000' },
        ]);

        await (await getRateLimitsDb()).deleteMany({});

        process.env.BAN_HAMMER_RESOLUTION_WINDOW_SECONDS = '1';
        await banHammer();

        setClientAndDb(await getNewClientAndDb());
        expect(await getRateLimits()).toHaveLength(0);
    });

    it('rate limits with respect to BAN_HAMMER_WILL_BE_CALLED_EVERY_SECONDS', async () => {
        expect.hasAssertions();

        await (await getRateLimitsDb()).deleteMany({});

        const requestLogDb = await getRequestLogDb();
        const requestLogEntry = await requestLogDb.find().limit(1).next();

        if(!requestLogEntry)
            throw new Error('No request-log entry found?!');

        const now = Date.now();

        await requestLogDb.updateMany({ key: '00000000-0000-0000-0000-000000000000' }, { $set: { ip: '9.8.7.6' }});
        await requestLogDb.updateMany({}, { $set: { time: now - 1000 }});
        await requestLogDb.insertOne({
            ip: '1.2.3.4',
            key: null,
            method: 'PUT',
            resStatusCode: 200,
            route: 'jest/test',
            time: now - 2000
        });

        process.env.BAN_HAMMER_MAX_REQUESTS_PER_WINDOW = '11';
        process.env.BAN_HAMMER_RESOLUTION_WINDOW_SECONDS = '5';
        process.env.BAN_HAMMER_WILL_BE_CALLED_EVERY_SECONDS = '1';
        await banHammer();

        setClientAndDb(await getNewClientAndDb());
        expect(await getRateLimits()).toHaveLength(0);

        process.env.BAN_HAMMER_WILL_BE_CALLED_EVERY_SECONDS = '3';
        await banHammer();

        setClientAndDb(await getNewClientAndDb());
        expect(await getRateLimits()).toIncludeSameMembers([{ ip: '1.2.3.4' }]);
    });

    it('repeat offenders are punished with respect to BAN_HAMMER_DEFAULT_BAN_TIME_MINUTES and BAN_HAMMER_RECIDIVISM_PUNISH_MULTIPLIER', async () => {
        expect.hasAssertions();

        await (await getRateLimitsDb()).deleteMany({});
        await (await getRequestLogDb()).updateMany({ key: '00000000-0000-0000-0000-000000000000' }, { $set: { ip: '9.8.7.6' }});

        process.env.BAN_HAMMER_DEFAULT_BAN_TIME_MINUTES = '10';
        await banHammer();

        setClientAndDb(await getNewClientAndDb());
        const tenMinutesInMs = 10 * 60 * 1000;
        const expectedUntils = (await getRateLimitUntils()).map(u => u.until + tenMinutesInMs);

        await (await getRateLimitsDb()).deleteMany({});

        process.env.BAN_HAMMER_DEFAULT_BAN_TIME_MINUTES = '20';
        await banHammer();

        setClientAndDb(await getNewClientAndDb());
        const actualUntils = (await getRateLimitUntils()).map(u => u.until);

        expect(actualUntils).toIncludeSameMembers(expectedUntils);

        process.env.BAN_HAMMER_RECIDIVISM_PUNISH_MULTIPLIER = '5';
        await banHammer();

        setClientAndDb(await getNewClientAndDb());
        expect((await getRateLimitUntils()).map(u => u.until)).toIncludeSameMembers(expectedUntils.map(u => u * 5))
    });

    it('does not replace longer bans with shorter bans', async () => {
        expect.hasAssertions();

        expect(await getRateLimits()).toHaveLength(3);

        await (await getRateLimitsDb()).updateMany({ ip: { $ne: '5.6.7.8' } }, { $set: { until: 9998784552826 }});
        await banHammer();

        setClientAndDb(await getNewClientAndDb());

        let saw = 0;
        (await getRateLimitUntils()).forEach(u => u.until == 9998784552826 && saw++);

        expect(saw).toBe(2);
    });

    it('deletes outdated entries outside the punishment period', async () => {
        expect.hasAssertions();

        expect(await getRateLimits()).toHaveLength(3);

        await (await getRateLimitsDb()).updateMany({ ip: { $ne: '5.6.7.8' }}, { $set: { until: 0 }});
        await banHammer();

        setClientAndDb(await getNewClientAndDb());
        expect(await getRateLimits()).toIncludeSameMembers([{ ip: '1.2.3.4' }, { ip: '5.6.7.8' }]);
    });
});
