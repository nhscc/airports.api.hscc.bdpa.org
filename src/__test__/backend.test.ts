import { ObjectId, WithId } from 'mongodb';
import * as Backend from 'universe/backend'
import { setupJest, unhydratedDummyDbData } from 'universe/__test__/db'
import { getEnv } from 'universe/backend/env'
import { populateEnv } from 'universe/dev-utils'
import randomInt from 'random-int'

import {
    RequestLogEntry,
    LimitedLogEntry
} from 'types/global'

import type{ NextApiRequest, NextApiResponse } from 'next'

populateEnv();

const { getHydratedData, getDb } = setupJest();

describe('universe/backend', () => {
    describe('::getNoFlyList', () => {
        test.todo('unit test the backend');
    });

    describe('::getAirports', () => {
        test.todo('unit test the backend');
    });

    describe('::getAirlines', () => {
        test.todo('unit test the backend');
    });

    describe('::getFlightsById', () => {
        test.todo('unit test the backend');
    });

    describe('::searchFlights', () => {
        test.todo('unit test the backend');
    });

    describe('::addToRequestLog', () => {
        it('adds request to log as expected', async () => {
            const req1 = {
                headers: { 'x-forwarded-for': '9.9.9.9' },
                method: 'POST',
                url: '/api/route/path1'
            } as unknown as NextApiRequest;

            const req2 = {
                headers: {
                    'x-forwarded-for': '8.8.8.8',
                    'key': Backend.NULL_KEY
                },
                method: 'GET',
                url: '/api/route/path2'
            } as unknown as NextApiRequest;

            const res1 = { statusCode: 1111 } as NextApiResponse;
            const res2 = { statusCode: 2222 } as NextApiResponse;

            const now = Date.now();
            const _now = Date.now;
            Date.now = () => now;

            await Backend.addToRequestLog({ req: req1, res: res1 });
            await Backend.addToRequestLog({ req: req2, res: res2 });

            Date.now = _now;

            const reqlog = (await getDb()).collection<WithId<RequestLogEntry>>('request-log');

            const { _id: ignored1, ...log1 } = await reqlog.findOne({ resStatusCode: 1111 }) || {};
            const { _id: ignored2, ...log2 } = await reqlog.findOne({ resStatusCode: 2222 }) || {};

            expect(log1).toEqual({
                ip: '9.9.9.9',
                key: null,
                route: 'route/path1',
                method: 'POST',
                time: now,
                resStatusCode: 1111,
            });

            expect(log2).toEqual({
                ip: '8.8.8.8',
                key: Backend.NULL_KEY,
                route: 'route/path2',
                method: 'GET',
                time: now,
                resStatusCode: 2222
            });
        });
    });

    describe('::isRateLimited', () => {
        it('returns true if ip or key are rate limited', async () => {
            const _now = Date.now;
            const now = Date.now();
            Date.now = () => now;

            const req1 = await Backend.isRateLimited({
                headers: { 'x-forwarded-for': '1.2.3.4' },
                method: 'POST',
                url: '/api/route/path1'
            } as unknown as NextApiRequest);

            const req2 = await Backend.isRateLimited({
                headers: {
                    'x-forwarded-for': '8.8.8.8',
                    'key': Backend.NULL_KEY
                },
                method: 'GET',
                url: '/api/route/path2'
            } as unknown as NextApiRequest);

            const req3 = await Backend.isRateLimited({
                headers: {
                    'x-forwarded-for': '1.2.3.4',
                    'key': 'fake-key'
                },
                method: 'POST',
                url: '/api/route/path1'
            } as unknown as NextApiRequest);

            const req4 = await Backend.isRateLimited({
                headers: {
                    'x-forwarded-for': '5.6.7.8',
                },
                method: 'POST',
                url: '/api/route/path1'
            } as unknown as NextApiRequest);

            const req5 = await Backend.isRateLimited({
                headers: {
                    'x-forwarded-for': '1.2.3.4',
                    'key': Backend.NULL_KEY
                },
                method: 'POST',
                url: '/api/route/path1'
            } as unknown as NextApiRequest);

            expect(req1.limited).toBeTrue();
            expect(req2.limited).toBeTrue();
            expect(req3.limited).toBeTrue();
            expect(req4.limited).toBeTrue();
            expect(req5.limited).toBeTrue();

            expect(req1.retryAfter).toBeWithin(1000 * 60 * 15 - 1000, 1000 * 60 * 15 + 1000);
            expect(req2.retryAfter).toBeWithin(1000 * 60 * 60 - 1000, 1000 * 60 * 60 + 1000);
            expect(req3.retryAfter).toBeWithin(1000 * 60 * 15 - 1000, 1000 * 60 * 15 + 1000);
            expect(req4.retryAfter).toBeWithin(1000 * 60 * 15 - 1000, 1000 * 60 * 15 + 1000);
            // ? Should return greater of the two ban times (key time > ip time)
            expect(req5.retryAfter).toBeWithin(1000 * 60 * 60 - 1000, 1000 * 60 * 60 + 1000);

            Date.now = _now;
        });

        it('returns false iff both ip and key (if provided) are not rate limited', async () => {
            const req1 = {
                headers: { 'x-forwarded-for': '1.2.3.5' },
                method: 'POST',
                url: '/api/route/path1'
            } as unknown as NextApiRequest;

            const req2 = {
                headers: {
                    'x-forwarded-for': '8.8.8.8',
                    'key': 'fake-key'
                },
                method: 'GET',
                url: '/api/route/path2'
            } as unknown as NextApiRequest;

            expect(await Backend.isRateLimited(req1)).toEqual({ limited: false, retryAfter: 0 });
            expect(await Backend.isRateLimited(req2)).toEqual({ limited: false, retryAfter: 0 });
        });

        it('returns false if "until" time has passed', async () => {
            const req = {
                headers: { 'x-forwarded-for': '1.2.3.4' },
                method: 'POST',
                url: '/api/route/path1'
            } as unknown as NextApiRequest;

            expect(await Backend.isRateLimited(req)).toContainEntry([ 'limited', true ]);

            await (await getDb()).collection<LimitedLogEntry>('limited-log-mview').updateOne(
                { ip: '1.2.3.4' },
                { $set: { until: Date.now() - 10**5 }}
            );

            expect(await Backend.isRateLimited(req)).toEqual({ limited: false, retryAfter: 0 });
        });
    });

    describe('::isDueForContrivedError', () => {
        it('returns true after REQUESTS_PER_CONTRIVED_ERROR invocations', async () => {
            const rate = getEnv().REQUESTS_PER_CONTRIVED_ERROR;

            expect([...Array(rate * 2)].map(() => Backend.isDueForContrivedError())).toEqual([
                ...[...Array(rate - 1)].map(() => false),
                true,
                ...[...Array(rate - 1)].map(() => false),
                true
            ]);
        });
    });
});
