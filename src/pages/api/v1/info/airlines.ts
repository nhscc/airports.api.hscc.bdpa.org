import { getAirlines } from 'universe/backend'
import { sendHttpOk } from 'multiverse/respond'
import { handleEndpoint } from 'universe/backend/middleware'

import type { NextApiResponse, NextApiRequest } from 'next'

// ? This is a NextJS special "config" export
export { config } from 'universe/backend/middleware';

export default async function(req: NextApiRequest, res: NextApiResponse) {
    await handleEndpoint(async ({ res }) => {
        sendHttpOk(res, await getAirlines());
    }, { req, res, methods: [ 'GET' ], apiVersion: 1 });
}
