import {
    sendHttpErrorResponse,
    sendHttpUnauthenticated,
    sendHttpBadMethod,
    sendNotImplementedError,
    sendHttpError,
    sendHttpNotFound,
    sendHttpUnauthorized,
    sendHttpBadRequest,
    sendHttpRateLimited,
} from 'multiverse/respond'

import {
    GuruMeditationError,
    NotFoundError,
    NotAuthorizedError,
    FlightGenerationError,
    IdTypeError,
    ApiKeyTypeError,
    ValidationError,
    AppError
} from 'universe/backend/error'

import { isKeyAuthentic, addToRequestLog, isDueForContrivedError, isRateLimited } from 'universe/backend'
import { getEnv } from 'universe/backend/env'
import Cors from 'cors'

import type { NextApiResponse } from 'next'
import type { NextParamsRR } from 'types/global'

export type AsyncHanCallback = (params: NextParamsRR) => Promise<void>;
export type GenHanParams = NextParamsRR & {
    apiVersion?: number;
    methods: string[];
};

const cors = Cors({ methods: ['GET', 'POST', 'PUT', 'DELETE'] });

/* eslint-disable @typescript-eslint/no-explicit-any */
const runCorsMiddleware = (req: any, res: any) => {
    return new Promise((resolve, reject) => cors(req, res, (r: any) => (r instanceof Error ? reject : resolve)(r)));
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function sendHttpContrivedError(res: NextApiResponse, responseJson?: Record<string, unknown>) {
    sendHttpErrorResponse(res, 555, {
        error: '(note: do not report this contrived error)',
        ...responseJson
    });
}

export const config = { api: { bodyParser: { sizeLimit: getEnv().MAX_CONTENT_LENGTH_BYTES }}};

/**
 * Generic middleware to handle any api endpoint. You can give it an empty async
 * handler function to trigger a 501 not implemented (to stub out API
 * endpoints).
 */
export async function handleEndpoint(fn: AsyncHanCallback, { req, res, methods, apiVersion }: GenHanParams) {
    const resp = res as typeof res & { $send: typeof res.send };
    // ? This will let us know if the sent method was called
    let sent = false;

    resp.$send = resp.send;
    resp.send = (...args): void => {
        sent = true;
        void addToRequestLog({ req, res });
        resp.$send(...args);
    };

    try {
        // ? We need to pretend that the API doesn't exist if it's disabled, so
        // ? not even CORS responses are allowed here!
        if(apiVersion !== undefined && getEnv().DISABLED_API_VERSIONS.includes(apiVersion.toString()))
            // TODO: ensure this response is indistinguishable from normal
            // TODO: vercel 404
            sendHttpNotFound(resp);

        else {
            await runCorsMiddleware(req, res);

            const { limited, retryAfter } = await isRateLimited(req);

            if(!getEnv().IGNORE_RATE_LIMITS && limited)
                sendHttpRateLimited(resp, { retryAfter });

            else if(getEnv().LOCKOUT_ALL_KEYS
              || typeof req.headers.key != 'string'
              || !(await isKeyAuthentic(req.headers.key))) {
                sendHttpUnauthenticated(resp);
            }

            else if(!req.method || getEnv().DISALLOWED_METHODS.includes(req.method) || !methods.includes(req.method))
                sendHttpBadMethod(resp);

            else if(isDueForContrivedError())
                sendHttpContrivedError(resp);

            else {
                await fn({ req, res: resp });

                // ? If the response hasn't been sent yet, send one now
                !sent && sendNotImplementedError(resp);
            }
        }
    }

    catch(error) {
        if(error instanceof GuruMeditationError)
            sendHttpError(resp, { error: 'sanity check failed: please report exactly what you did just now!' });

        else if((error instanceof FlightGenerationError) ||
          (error instanceof IdTypeError) ||
          (error instanceof ApiKeyTypeError) ||
          (error instanceof ValidationError)) {
            sendHttpBadRequest(resp, { ...(error.message ? { error: error.message } : {}) });
        }

        else if(error instanceof NotAuthorizedError)
            sendHttpUnauthorized(resp);

        else if(error instanceof NotFoundError)
            sendHttpNotFound(resp);

        else if(error instanceof AppError)
            sendHttpError(resp, { ...(error.message ? { error: error.message } : {}) });

        else
            sendHttpError(resp);
    }
}
