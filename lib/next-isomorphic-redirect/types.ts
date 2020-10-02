import type { NextApiResponse } from 'next'
import type { HttpStatusCode } from '@ergodark/next-types'

export type FrontendRedirectConfig = {
    replace?: boolean;
    bypassRouter?: boolean;
};

export type BackendRedirectConfig = {
    res: NextApiResponse;
    status?: HttpStatusCode;
    immediate?: boolean;
};

export type IsomorphicRedirectConfig = FrontendRedirectConfig & BackendRedirectConfig;
export type { HttpStatusCode };
