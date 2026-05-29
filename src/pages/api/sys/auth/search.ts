import {
  deleteTokens,
  getTokens,
  updateTokensAttributes
} from '@-xun/api-strategy/auth';

import { sendHttpOk } from '@-xun/respond';
import { validateAndParseJson } from '@nhscc/backend-airports~npm/util';

import { withSysMiddleware } from 'universe:route-wrapper.ts';


// ? https://nextjs.org/docs/api-routes/api-middlewares#custom-config
export { defaultConfig as config } from '@nhscc/backend-airports~npm/api';

export default withSysMiddleware(
  async (req, res) => {
    const filter = validateAndParseJson<object>(req.query.filter?.toString(), 'filter');

    switch (req.method) {
      case 'GET': {
        sendHttpOk(res, {
          fullTokens: await getTokens({ filter, after_id: req.query.after?.toString() })
        });
        break;
      }

      case 'PATCH': {
        sendHttpOk(res, {
          updated: await updateTokensAttributes({
            filter,
            data: req.body?.attributes
          })
        });
        break;
      }

      case 'DELETE': {
        sendHttpOk(res, { deleted: await deleteTokens({ filter }) });
        break;
      }
    }
  },
  {
    descriptor: '/sys/auth/search',
    options: { allowedMethods: ['GET', 'PATCH', 'DELETE'] }
  }
);
