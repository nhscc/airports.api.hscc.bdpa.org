import { createServer, IncomingMessage, ServerResponse } from 'http'
import listen from 'test-listen'
import { apiResolver } from 'next/dist/next-server/server/api-utils'
import fetch from 'isomorphic-unfetch'

export type TestParams = { fetch: (init?: RequestInit) => ReturnType<typeof fetch> };

export type TesApiEndParams = {
    test: (obj: TestParams) => Promise<void>;
    params?: Record<string, unknown>;
    requestPatcher?: (req: IncomingMessage) => void;
    responsePatcher?: (res: ServerResponse) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    next: any;
};

/**
 * Uses Next's internal `apiResolver` to execute endpoints in a Next-like
 * testing environment. Useful for unit testing Next /api endpoints.
 *
 * `test` should be a function that returns a promise (or async) where Jest
 * tests and the like can be run.
 *
 * `params` are passed directly to the api handler and represent processed
 * dynamic routes, i.e. testing `/api/user/:id` would need `params: { id: ... }`
 *
 * `requestPatcher` and `responsePatcher` are functions that receive an
 * IncomingMessage and ServerResponse instance respectively. Use these functions
 * to edit the request and response before they're injected into the api
 * handler.
 *
 * `next` is the actual api handler under test. It should be an async function
 * that accepts a NextApiRequest and NextApiResult as its two parameters.
 */
export async function testApiEndpoint({ test, params, requestPatcher, responsePatcher, next }: TesApiEndParams) {
    let server = null;

    const url = await listen(server = createServer((req, res) => {
        requestPatcher && requestPatcher(req);
        responsePatcher && responsePatcher(res);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return apiResolver(req, res, params, next, undefined as any);
    }));

    await test({ fetch: (init?: RequestInit) => fetch(url, init) });

    server.close();
}
