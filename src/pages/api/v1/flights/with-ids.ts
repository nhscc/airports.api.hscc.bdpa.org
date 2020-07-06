import { handleEndpoint } from 'universe/backend/middleware'
import { getFlightsById } from 'universe/backend'
import { sendHttpOk, sendHttpBadRequest } from 'multiverse/respond'
import { NotFoundError } from 'universe/backend/error'
import { ObjectId } from 'mongodb'

import type { NextApiResponse, NextApiRequest } from 'next'

// ? This is a NextJS special "config" export
export { config } from 'universe/backend/middleware';

export default async function(req: NextApiRequest, res: NextApiResponse) {
    await handleEndpoint(async ({ req, res }) => {
        const key = req.headers.key?.toString() || '';
        const limit = req.query.limit ? parseInt(req.query.limit.toString()) : false;
        let after: ObjectId | false;
    }, { req, res, methods: [ 'GET' ], apiVersion: 1 });
}
