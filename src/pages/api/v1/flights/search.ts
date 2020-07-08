import { handleEndpoint } from 'universe/backend/middleware'
import { searchFlights, convertPFlightToPFlightForV1Only } from 'universe/backend'
import { sendHttpOk, sendHttpBadRequest } from 'multiverse/respond'
import { NotFoundError } from 'universe/backend/error'
import { ObjectId } from 'mongodb'

import type { NextApiResponse, NextApiRequest } from 'next'

// ? This is a NextJS special "config" export
export { config } from 'universe/backend/middleware';

export default async function(req: NextApiRequest, res: NextApiResponse) {
    await handleEndpoint(async ({ req, res }) => {
        const key = req.headers.key?.toString() || '';
        let after: ObjectId | null;
        let match: Record<string, unknown> | null = null;
        let regexMatch: Record<string, unknown> | null = null;

        try { after = req.query.after ? new ObjectId(req.query.after.toString()) : null }
        catch(e) { throw new NotFoundError(req.query.after.toString()) }

        try {
            match = JSON.parse((req.query.match || '{}').toString());
            regexMatch = JSON.parse((req.query.regexMatch || '{}').toString());
        }
        catch(e) { sendHttpBadRequest(res, { error: `bad match or regexMatch: ${e}` }) }

        if(!match || !regexMatch) return;

        const localSort = (req.query.sort || 'asc').toString();

        if(!['asc', 'desc'].includes(localSort))
            sendHttpBadRequest(res, { error: 'unrecognized sort option' });

        else {
            // ? seatPrice in match/regexMatch? Convert it to a proper query!
            if(match.seatPrice) {
                match['seats.economy.priceDollars'] = match.seatPrice;
                delete match.seatPrice;
            }

            if(regexMatch.seatPrice) {
                regexMatch['seats.economy.priceDollars'] = regexMatch.seatPrice;
                delete regexMatch.seatPrice;
            }

            sendHttpOk(res, {
                flights: (await searchFlights({
                    key,
                    after,
                    // @ts-expect-error: validation is handled
                    match,
                    // @ts-expect-error: validation is handled
                    regexMatch,
                    sort: localSort as 'asc' | 'desc'
                })).map(convertPFlightToPFlightForV1Only)
            });
        }
    }, { req, res, methods: [ 'GET' ], apiVersion: 1 });
}
