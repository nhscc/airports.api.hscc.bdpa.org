import { sendHttpOk } from '@-xun/respond';
import { getExtras } from '@nhscc/backend-airports~npm';

import { withMiddleware } from 'universe:route-wrapper.ts';

export { defaultConfig as config } from '@nhscc/backend-airports~npm/api';

export const metadata = {
  descriptor: '/v2/info/all-extras',
  apiVersion: '2'
};

export default withMiddleware(
  async (_req, res) => {
    // * GET
    sendHttpOk(res, { extras: await getExtras() });
  },
  {
    descriptor: metadata.descriptor,
    options: {
      allowedMethods: ['GET'],
      apiVersion: metadata.apiVersion
    }
  }
);
