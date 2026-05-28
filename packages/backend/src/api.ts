import { getEnv } from 'universe+backend:env.ts';

/**
 * The default app-wide Next.js API configuration object.
 *
 * @see https://nextjs.org/docs/api-routes/api-middlewares#custom-config
 */
export const defaultConfig = {
  api: {
    bodyParser: {
      get sizeLimit() {
        return getEnv().MAX_CONTENT_LENGTH_BYTES;
      }
    }
  }
};
