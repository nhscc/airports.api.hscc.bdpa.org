import { sendHttpOk } from '@-xun/respond';
import { getAirlines } from '@nhscc/backend-airports~npm';

import { withMiddleware } from 'universe:route-wrapper.ts';

export { defaultConfig as config } from '@nhscc/backend-airports~npm/api';

export const metadata = {
  descriptor: '/v2/info/airlines',
  apiVersion: '2'
};

export default withMiddleware(
  async (_req, res) => {
    // * GET
    sendHttpOk(res, { airlines: await getAirlines() });
  },
  {
    descriptor: metadata.descriptor,
    options: {
      allowedMethods: ['GET'],
      apiVersion: metadata.apiVersion
    }
  }
);
