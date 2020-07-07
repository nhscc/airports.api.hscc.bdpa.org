import { setupJest } from 'universe/__test__/db'
import { testApiEndpoint } from 'multiverse/test-api-endpoint'
import { DUMMY_KEY } from 'universe/backend'
import * as Middleware from 'universe/backend/middleware'
import { getEnv } from 'universe/backend/env'
import { populateEnv } from 'universe/dev-utils'
import { shuffle } from 'fast-shuffle'

import type { TestParams } from 'multiverse/test-api-endpoint'
import type { NextApiRequest, NextApiResponse } from 'next'
import * as BackendError from 'universe/backend/error'
import { RequestLogEntry, LimitedLogEntry } from 'types/global'

populateEnv();

const { getDb } = setupJest();
const noop = async ({ res }: { res: NextApiResponse }) => res.status(200).send({});
const nextApiHandler = (p: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) => {
    const api = async (req: NextApiRequest, res: NextApiResponse) => p(req, res);
    api.config = Middleware.config;
    return api;
};

jest.setTimeout(10**6);

describe('universe/backend/middleware', () => {
    describe('::handleEndpoint', () => {
        it('rejects requests that are too big when exporting config', async () => {
            await testApiEndpoint({
                next: nextApiHandler((req, res) => Middleware.handleEndpoint(noop, { req, res, methods: ['POST'] })),
                test: async ({ fetch }) => {
                    const clientResponse = await fetch({
                        method: 'POST',
                        body: [...Array(getEnv().MAX_CONTENT_LENGTH_BYTES + 1)].map(() => 'x').join('')
                    });

                    expect(clientResponse.status).toBe(413);
                }
            });
        });

        it('injects contrived errors at the required rate', async () => {
            process.env.REQUESTS_PER_CONTRIVED_ERROR = '10';

            const expectedReqPerError = parseInt(process.env.REQUESTS_PER_CONTRIVED_ERROR);
            const getMethod = () => shuffle(['GET', 'POST', 'PUT', 'DELETE'])[0];
            const getStatus = async (res: Promise<Response>) => (await res).status;

            await testApiEndpoint({
                requestPatcher: req => req.headers.key = DUMMY_KEY,
                next: (req: NextApiRequest, res: NextApiResponse) => Middleware.handleEndpoint(noop, {
                    req, res,
                    methods: ['GET', 'POST', 'PUT', 'DELETE']
                }),
                test: async ({ fetch }: TestParams) => {
                    const results1 = await Promise.all([
                        ...[...Array(expectedReqPerError - 1)].map(_ => getStatus(fetch({ method: getMethod() }))),
                        getStatus(fetch({ method: getMethod() })),
                        ...[...Array(expectedReqPerError - 1)].map(_ => getStatus(fetch({ method: getMethod() }))),
                        getStatus(fetch({ method: getMethod() }))
                    ].map(p => p.then(s => s, _ => null)));

                    process.env.REQUESTS_PER_CONTRIVED_ERROR = '0';

                    const results2 = await Promise.all([
                        ...[...Array(expectedReqPerError)].map(_ => getStatus(fetch({ method: getMethod() }))),
                    ].map(p => p.then(s => s, _ => null)));

                    expect(results1).toIncludeSameMembers([
                        ...[...Array(expectedReqPerError - 1)].map(_ => 200),
                        555,
                        ...[...Array(expectedReqPerError - 1)].map(_ => 200),
                        555
                    ]);

                    expect(results2).toEqual([
                        ...[...Array(expectedReqPerError)].map(_ => 200),
                    ]);
                }
            });
        });

        it('responds with 501 not implemented when required', async () => {
            await testApiEndpoint({
                requestPatcher: req => req.headers.key = DUMMY_KEY,
                next: (req: NextApiRequest, res: NextApiResponse) => Middleware.handleEndpoint(async () => undefined, {
                    req, res,
                    methods: ['GET']
                }),
                test: async ({ fetch }) => expect((await fetch()).status).toBe(501)
            });
        });

        it('logs requests properly', async () => {
            const genStatus = function*() {
                yield 502;
                yield 404;
                yield 403;
                yield 200;
            }();

            await testApiEndpoint({
                requestPatcher: req => {
                    req.headers = {
                        ...req.headers,
                        'x-forwarded-for': '10.0.0.115',
                        'key': DUMMY_KEY
                    };

                    req.url = '/api/v1/handlerX';
                },
                next: (req: NextApiRequest, res: NextApiResponse) => Middleware.handleEndpoint(async ({ res }) => {
                    res.status(genStatus.next().value || 0).send({});
                }, { req, res,  methods: ['GET', 'POST', 'PUT', 'DELETE'] }),
                test: async ({ fetch }) => {
                    await fetch({ method: 'GET' });
                    await fetch({ method: 'POST' });
                    await fetch({ method: 'PUT' });
                    await fetch({ method: 'DELETE' });

                    // ? Logs are added asynchronously, so let's wait a bit...
                    await new Promise(resolve => setTimeout(() => resolve(), 500));

                    const logs = await (await getDb()).collection<RequestLogEntry>('request-log').find().sort({
                        time: 1
                    }).limit(4).project({
                        _id: false,
                        time: false,
                    }).toArray();

                    expect(logs).toIncludeAllMembers([
                        {
                            ip: '10.0.0.115',
                            key: DUMMY_KEY,
                            method: 'GET',
                            route: 'v1/handlerX',
                            resStatusCode: 502
                        },
                        {
                            ip: '10.0.0.115',
                            key: DUMMY_KEY,
                            method: 'POST',
                            route: 'v1/handlerX',
                            resStatusCode: 404
                        },
                        {
                            ip: '10.0.0.115',
                            key: DUMMY_KEY,
                            method: 'PUT',
                            route: 'v1/handlerX',
                            resStatusCode: 403
                        },
                        {
                            ip: '10.0.0.115',
                            key: DUMMY_KEY,
                            method: 'DELETE',
                            route: 'v1/handlerX',
                            resStatusCode: 200
                        }
                    ]);
                }
            });
        });

        it('sends 405 when encountering unlisted methods', async () => {
            await testApiEndpoint({
                requestPatcher: req => req.headers.key = DUMMY_KEY,
                next: (req: NextApiRequest, res: NextApiResponse) => Middleware.handleEndpoint(noop, {
                    req, res,
                    methods: ['POST', 'PUT']
                }),
                test: async ({ fetch }) => {
                    expect((await fetch({ method: 'GET' })).status).toBe(405);
                    expect((await fetch({ method: 'POST' })).status).toBe(200);
                    expect((await fetch({ method: 'PUT' })).status).toBe(200);
                    expect((await fetch({ method: 'DELETE' })).status).toBe(405);
                }
            });
        });

        it('sends 405 when encountering globally disallowed methods', async () => {
            process.env.DISALLOWED_METHODS = 'POST,PUT,DELETE';

            await testApiEndpoint({
                requestPatcher: req => req.headers.key = DUMMY_KEY,
                next: (req: NextApiRequest, res: NextApiResponse) => Middleware.handleEndpoint(noop, {
                    req, res,
                    methods: ['POST', 'PUT', 'GET', 'DELETE']
                }),
                test: async ({ fetch }) => {
                    expect((await fetch({ method: 'GET' })).status).toBe(200);
                    expect((await fetch({ method: 'POST' })).status).toBe(405);
                    expect((await fetch({ method: 'PUT' })).status).toBe(405);
                    expect((await fetch({ method: 'DELETE' })).status).toBe(405);
                }
            });
        });

        it('sends correct HTTP error codes when certain errors occur', async () => {
            const genError = function*() {
                yield new BackendError.IdTypeError();
                yield new BackendError.ApiKeyTypeError();
                yield new BackendError.ValidationError();
                yield new BackendError.FlightGenerationError();
                yield new BackendError.NotAuthorizedError();
                yield new BackendError.NotFoundError();
                yield new BackendError.AppError();
                yield new BackendError.GuruMeditationError();
            }();

            const genErrorStatus = function*() {
                yield 400;
                yield 400;
                yield 400;
                yield 400;
                yield 403;
                yield 404;
                yield 500;
                yield 500;
            }();

            await testApiEndpoint({
                requestPatcher: req => req.headers.key = DUMMY_KEY,
                next: (req: NextApiRequest, res: NextApiResponse) => Middleware.handleEndpoint(async () => {
                    throw genError.next().value;
                }, { req, res, methods: ['GET'] }),
                test: async ({ fetch }) => {
                    let next = null;

                    while(!(next = genErrorStatus.next()).done) {
                        expect((await fetch()).status).toBe(next.value);
                    }
                }
            });
        });

        it('responds properly to unauthenticatable requests', async () => {
            await testApiEndpoint({
                next: (req: NextApiRequest, res: NextApiResponse) => Middleware.handleEndpoint(async () => undefined, {
                    req, res,
                    methods: ['GET']
                }),
                test: async ({ fetch }) => expect((await fetch()).status).toBe(401)
            });

            await testApiEndpoint({
                next: (req: NextApiRequest, res: NextApiResponse) => Middleware.handleEndpoint(noop, {
                    req, res,
                    methods: ['GET']
                }),
                test: async ({ fetch }) => expect((await fetch()).status).toBe(401)
            });
        });

        it('treats authenticatable requests as unauthenticatable when locking out all keys', async () => {
            await testApiEndpoint({
                next: (req: NextApiRequest, res: NextApiResponse) => Middleware.handleEndpoint(noop, {
                    req, res,
                    methods: ['GET']
                }),
                test: async ({ fetch }) => {
                    expect((await fetch({ headers: { key: DUMMY_KEY }})).status).toBe(200);

                    process.env.LOCKOUT_ALL_KEYS = 'true';
                    expect((await fetch({ headers: { key: DUMMY_KEY }})).status).toBe(401);

                  process.env.LOCKOUT_ALL_KEYS = 'false';
                    expect((await fetch({ headers: { key: DUMMY_KEY }})).status).toBe(200);
            }
            });
        });

        it('confirm headers are automatically lowercased', async () => {
            await testApiEndpoint({
                next: (req: NextApiRequest, res: NextApiResponse) => Middleware.handleEndpoint(noop, {
                    req, res,
                    methods: ['GET']
                }),
                test: async ({ fetch }) => expect((await fetch({
                    headers: { 'KEY': DUMMY_KEY }
                })).status).toBe(200)
            });
        });

        it('requests are limited in accordance with the database except when ignoring rate limits', async () => {
            const ip = '7.7.7.7';
            const key = DUMMY_KEY;
            const limitedLog = (await getDb()).collection<LimitedLogEntry>('limited-log-mview');

            await testApiEndpoint({
                requestPatcher: req => req.headers['x-forwarded-for'] = ip,
                next: (req: NextApiRequest, res: NextApiResponse) => Middleware.handleEndpoint(noop, {
                    req, res,
                    methods: ['GET']
                }),
                test: async ({ fetch }) => {
                    let entry = null;

                    expect((await fetch({ headers: { key } })).status).toBe(200);

                    const _now = Date.now;
                    const now = Date.now();
                    Date.now = () => now;

                    entry = await limitedLog.insertOne({ ip, until: now + 1000 * 60 * 15 });
                    const res = await fetch({ headers: { key } });
                    expect(res.status).toBe(429);

                    expect(await res.json()).toContainEntry<{ retryAfter: number }>([ 'retryAfter', 1000 * 60 * 15 ]);

                    await limitedLog.deleteOne({ _id: entry.insertedId });
                    expect((await fetch({ headers: { key } })).status).toBe(200);

                    entry = await limitedLog.insertOne({ key, until: Date.now() + 1000 * 60 * 60 });
                    expect((await fetch({ headers: { key } })).status).toBe(429);

                    process.env.IGNORE_RATE_LIMITS = 'true';
                    expect((await fetch({ headers: { key } })).status).toBe(200);

                    process.env.IGNORE_RATE_LIMITS = 'false';
                    expect((await fetch({ headers: { key } })).status).toBe(429);

                    await limitedLog.deleteOne({ _id: entry.insertedId });
                    expect((await fetch({ headers: { key } })).status).toBe(200);

                    Date.now = _now;
                }
            });
        });

        it('API does not respond if its corresponding version is disabled', async () => {
            await testApiEndpoint({
                requestPatcher: req => req.headers.key = DUMMY_KEY,
                next: (req: NextApiRequest, res: NextApiResponse) => Middleware.handleEndpoint(noop, {
                    apiVersion: 1,
                    req, res,
                    methods: ['GET']
                }),
                test: async ({ fetch }: TestParams) => {
                    process.env.DISABLED_API_VERSIONS = '1';
                    expect((await fetch()).status).toBe(404);

                    process.env.DISABLED_API_VERSIONS = '2';
                    expect((await fetch()).status).toBe(200);

                    process.env.DISABLED_API_VERSIONS = '2,1';
                    expect((await fetch()).status).toBe(404);

                    process.env.DISABLED_API_VERSIONS = '3,2';
                    expect((await fetch()).status).toBe(200);
                }
            });

            process.env.DISABLED_API_VERSIONS = '3,4,2';

            await testApiEndpoint({
                requestPatcher: req => req.headers.key = DUMMY_KEY,
                next: (req: NextApiRequest, res: NextApiResponse) => Middleware.handleEndpoint(noop, {
                    apiVersion: 1, req, res, methods: ['GET']
                }),
                test: async ({ fetch }: TestParams) => expect((await fetch()).status).toBe(200)
            });

            await testApiEndpoint({
                requestPatcher: req => req.headers.key = DUMMY_KEY,
                next: (req: NextApiRequest, res: NextApiResponse) => Middleware.handleEndpoint(noop, {
                    apiVersion: 2, req, res, methods: ['GET']
                }),
                test: async ({ fetch }: TestParams) => expect((await fetch()).status).toBe(404)
            });

            await testApiEndpoint({
                requestPatcher: req => req.headers.key = DUMMY_KEY,
                next: (req: NextApiRequest, res: NextApiResponse) => Middleware.handleEndpoint(noop, {
                    apiVersion: 3, req, res, methods: ['GET']
                }),
                test: async ({ fetch }: TestParams) => expect((await fetch()).status).toBe(404)
            });

            await testApiEndpoint({
                requestPatcher: req => req.headers.key = DUMMY_KEY,
                next: (req: NextApiRequest, res: NextApiResponse) => Middleware.handleEndpoint(noop, {
                    apiVersion: 4, req, res, methods: ['GET']
                }),
                test: async ({ fetch }: TestParams) => expect((await fetch()).status).toBe(404)
            });

            await testApiEndpoint({
                requestPatcher: req => req.headers.key = DUMMY_KEY,
                next: (req: NextApiRequest, res: NextApiResponse) => Middleware.handleEndpoint(async () => undefined, {
                    apiVersion: 4, req, res, methods: ['GET']
                }),
                test: async ({ fetch }) => expect((await fetch()).status).toBe(404)
            });

            await testApiEndpoint({
                requestPatcher: req => req.headers.key = DUMMY_KEY,
                next: (req: NextApiRequest, res: NextApiResponse) => Middleware.handleEndpoint(noop, {
                    req, res, methods: ['GET']
                }),
                test: async ({ fetch }: TestParams) => expect((await fetch()).status).toBe(200)
            });

            process.env.DISABLED_API_VERSIONS = '';

            await testApiEndpoint({
                requestPatcher: req => req.headers.key = DUMMY_KEY,
                next: (req: NextApiRequest, res: NextApiResponse) => Middleware.handleEndpoint(noop, {
                    apiVersion: 1, req, res, methods: ['GET']
                }),
                test: async ({ fetch }: TestParams) => expect((await fetch()).status).toBe(200)
            });

            await testApiEndpoint({
                requestPatcher: req => req.headers.key = DUMMY_KEY,
                next: (req: NextApiRequest, res: NextApiResponse) => Middleware.handleEndpoint(noop, {
                    req, res, methods: ['GET']
                }),
                test: async ({ fetch }: TestParams) => expect((await fetch()).status).toBe(200)
            });
        });
    });
});
