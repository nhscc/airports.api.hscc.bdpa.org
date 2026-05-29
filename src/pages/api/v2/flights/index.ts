import { getAuthedClientToken } from '@-xun/api-strategy/auth';
import { sendHttpOk } from '@-xun/respond';
import { searchFlights } from '@nhscc/backend-airports~npm';

import { withMiddleware } from 'universe:route-wrapper.ts';

export { defaultConfig as config } from '@nhscc/backend-airports~npm/api';

export const metadata = {
  descriptor: '/v2/flights',
  apiVersion: '2'
};

export default withMiddleware(
  async (req, res) => {
    const clientToken = await getAuthedClientToken(req);

    // * GET
    sendHttpOk(res, {
      flights: await searchFlights({
        bookerKey: clientToken?.attributes.owner,
        after_id: req.query.after?.toString(),
        match: req.query.match?.toString(),
        regexMatch: req.query.regexMatch?.toString(),
        sort: req.query.sort?.toString()
      })
    });
  },
  {
    descriptor: metadata.descriptor,
    options: {
      allowedMethods: ['GET'],
      apiVersion: metadata.apiVersion
    }
  }
);
