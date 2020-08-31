import { handleEndpoint } from 'universe/backend/middleware'

import type { NextApiResponse, NextApiRequest } from 'next'

// ? This is a NextJS special "config" export
export { config } from 'universe/backend/middleware';

export default async function(req: NextApiRequest, res: NextApiResponse) {
    await handleEndpoint(async () => undefined, { req, res, methods: [ 'GET', 'PUT' ], apiVersion: 2, adminOnly: true });
}
