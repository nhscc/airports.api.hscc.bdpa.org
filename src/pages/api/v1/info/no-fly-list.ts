import { sendHttpOk } from '@-xun/respond';
import { getNoFlyList } from '@nhscc/backend-airports~npm';

import { withMiddleware } from 'universe:route-wrapper.ts';

export { defaultConfig as config } from '@nhscc/backend-airports~npm/api';

export const metadata = {
  descriptor: '/v1/info/no-fly-list',
  apiVersion: '1'
};

export default withMiddleware(
  async (_req, res) => {
    // * GET
    sendHttpOk(res, { noFlyList: await getNoFlyList() });
  },
  {
    descriptor: metadata.descriptor,
    options: {
      allowedMethods: ['GET'],
      apiVersion: metadata.apiVersion
    }
  }
);
