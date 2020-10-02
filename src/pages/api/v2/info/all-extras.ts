import { getExtras } from 'universe/backend'
import { sendHttpOk } from 'next-respond'
import { handleEndpoint } from 'universe/backend/middleware'

import type { NextApiResponse, NextApiRequest } from 'next'

// ? This is a NextJS special "config" export
export { config } from 'universe/backend/middleware';

export default async function(req: NextApiRequest, res: NextApiResponse) {
    await handleEndpoint(async ({ res }) => {
        sendHttpOk(res, { extras: await getExtras() });
    }, { req, res, methods: [ 'GET' ], apiVersion: 2 });
}
