import { getAuthedClientToken } from '@-xun/api-strategy/auth';
import { sendHttpOk } from '@-xun/respond';
import { searchFlights } from '@nhscc/backend-airports~npm';
import { toPublicFlightV1 } from '@nhscc/backend-airports~npm/db';

import { withMiddleware } from 'universe:route-wrapper.ts';

export { defaultConfig as config } from '@nhscc/backend-airports~npm/api';

export const metadata = {
  descriptor: '/v1/flights/all',
  apiVersion: '1'
};

export default withMiddleware(
  async (req, res) => {
    const clientToken = await getAuthedClientToken(req);

    // * GET
    sendHttpOk(res, {
      flights: (
        await searchFlights({
          booker_id: clientToken?.auth_id,
          after_id: req.query.after?.toString(),
          match: undefined,
          regexMatch: undefined,
          sort: 'asc'
        })
      )
        // eslint-disable-next-line unicorn/no-array-callback-reference
        .map(toPublicFlightV1)
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
