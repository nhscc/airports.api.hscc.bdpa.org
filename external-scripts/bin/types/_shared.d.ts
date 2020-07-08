import type { NextApiRequest, NextApiResponse } from 'next';
export declare type Primitive = string | number | bigint | boolean | symbol | null | undefined;
export declare type Falsy = false | '' | 0 | null | undefined;
export declare type Nil = false | null | undefined;
export declare type SuccessJsonResponse = {
    success: true;
};
export declare type ErrorJsonResponse = {
    error: string;
};
export declare type HttpJsonResponse2xx = SuccessJsonResponse;
export declare type HttpJsonResponse3xx = SuccessJsonResponse;
export declare type HttpJsonResponse4xx = ErrorJsonResponse;
export declare type HttpJsonResponse5xx = ErrorJsonResponse;
export declare type HttpJsonResponse429 = HttpJsonResponse4xx & {
    retryAfter: number;
};
export declare type HttpStatusCode = 100 | 101 | 102 | 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 | 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 419 | 420 | 420 | 422 | 423 | 424 | 424 | 425 | 426 | 428 | 429 | 431 | 444 | 449 | 450 | 451 | 451 | 494 | 495 | 496 | 497 | 499 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 509 | 510 | 511 | 555 | 598 | 599;
export declare type NextParamsRR<T = Record<string, unknown>> = {
    req: NextApiRequest;
    res: NextApiResponse<T>;
};
export declare type NextParamsRRQ = NextParamsRR & {
    query: string | string[];
};
export declare type WithConfig<T> = T & {
    config?: Record<string, unknown>;
};
export declare type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends Array<infer I> ? Array<DeepPartial<I>> : DeepPartial<T[P]>;
};
export interface AnyObject {
    [key: string]: unknown;
    [key: number]: unknown;
}
export declare type UnionObjects<T extends AnyObject, U extends AnyObject> = Omit<T, keyof U> & {
    [P in keyof T & keyof U]: T[P] | U[P];
} & Omit<U, keyof T>;
