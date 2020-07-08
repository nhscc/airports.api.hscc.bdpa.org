import { handleEndpoint } from 'universe/backend/middleware'
import { searchFlights, convertPFlightToPFlightForV1Only } from 'universe/backend'
import { sendHttpOk } from 'multiverse/respond'
import { NotFoundError } from 'universe/backend/error'
import { ObjectId } from 'mongodb'

import type { NextApiResponse, NextApiRequest } from 'next'

// ? This is a NextJS special "config" export
export { config } from 'universe/backend/middleware';

export default async function(req: NextApiRequest, res: NextApiResponse) {
    await handleEndpoint(async ({ req, res }) => {
        const key = req.headers.key?.toString() || '';
        let after: ObjectId | null;

        try { after = req.query.after ? new ObjectId(req.query.after.toString()) : null }
        catch(e) { throw new NotFoundError(req.query.after.toString()) }

        sendHttpOk(res, {
            flights: (await searchFlights({
                key,
                after,
                match: {},
                regexMatch: {},
                sort: 'asc'
            })).map(convertPFlightToPFlightForV1Only)
        });
    }, { req, res, methods: [ 'GET' ], apiVersion: 1 });
}
