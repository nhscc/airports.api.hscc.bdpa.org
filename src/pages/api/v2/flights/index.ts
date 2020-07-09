import { handleEndpoint } from 'universe/backend/middleware'

import type { NextApiResponse, NextApiRequest } from 'next'

// ? This is a NextJS special "config" export
export { config } from 'universe/backend/middleware';

export default async function(req: NextApiRequest, res: NextApiResponse) {
    // TODO: transform flight_id searches into _id searches as an alternative to
    // TODO: the old with-ids endpoint
    await handleEndpoint(async () => undefined, { req, res, methods: [ 'GET' ], apiVersion: 2 });
}
