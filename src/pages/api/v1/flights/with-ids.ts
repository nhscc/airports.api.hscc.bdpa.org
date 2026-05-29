import { getAuthedClientToken } from '@-xun/api-strategy/auth';
import { sendHttpOk } from '@-xun/respond';
import { getFlightsById } from '@nhscc/backend-airports~npm';
import { toPublicFlightV1 } from '@nhscc/backend-airports~npm/db';

import { withMiddleware } from 'universe:route-wrapper.ts';

export { defaultConfig as config } from '@nhscc/backend-airports~npm/api';

export const metadata = {
  descriptor: '/v1/flights/with-ids',
  apiVersion: '1'
};

export default withMiddleware(
  async (req, res) => {
    const clientToken = await getAuthedClientToken(req);

    try {
      // * GET
      sendHttpOk(res, {
        flights: (
          await getFlightsById({
            booker_id: clientToken?.auth_id,
            flight_ids: req.query.ids?.toString()
          })
        )
          // eslint-disable-next-line unicorn/no-array-callback-reference
          .map(toPublicFlightV1)
      });
    } catch {
      sendHttpOk(res, { flights: [] });
    }
  },
  {
    descriptor: metadata.descriptor,
    options: {
      allowedMethods: ['GET'],
      apiVersion: metadata.apiVersion
    }
  }
);
