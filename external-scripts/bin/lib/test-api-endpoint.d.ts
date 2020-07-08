/// <reference types="node" />
import { IncomingMessage, ServerResponse } from 'http';
import fetch from 'isomorphic-unfetch';
export declare type TestParams = {
    fetch: (init?: RequestInit) => ReturnType<typeof fetch>;
};
export declare type TesApiEndParams = {
    test: (obj: TestParams) => Promise<void>;
    params?: Record<string, unknown>;
    requestPatcher?: (req: IncomingMessage) => void;
    responsePatcher?: (res: ServerResponse) => void;
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
export declare function testApiEndpoint({ test, params, requestPatcher, responsePatcher, next }: TesApiEndParams): Promise<void>;
