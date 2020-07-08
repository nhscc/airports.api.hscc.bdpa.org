import { handleEndpoint } from 'universe/backend/middleware'
import { getFlightsById, convertPFlightToPFlightForV1Only } from 'universe/backend'
import { sendHttpOk } from 'multiverse/respond'
import { ObjectId } from 'mongodb'

import type { NextApiResponse, NextApiRequest } from 'next'

// ? This is a NextJS special "config" export
export { config } from 'universe/backend/middleware';

export default async function(req: NextApiRequest, res: NextApiResponse) {
    await handleEndpoint(async ({ req, res }) => {
        const key = req.headers.key?.toString() || '';
        let ids: ObjectId[];

        try {
            const json: string[] = JSON.parse(req.query.ids.toString());
            ids = json.map(id => {
                try { return new ObjectId(id) }
                catch(e) { return null }
            }).filter((id): id is ObjectId => id != null);

            sendHttpOk(res, { flights: (await getFlightsById({ key, ids })).map(convertPFlightToPFlightForV1Only) });
        }

        catch(e) { sendHttpOk(res, { flights: [] }) }
    }, { req, res, methods: [ 'GET' ], apiVersion: 1 });
}
