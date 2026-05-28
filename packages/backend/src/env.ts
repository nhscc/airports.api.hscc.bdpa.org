import { getEnv as getDefaultEnv } from '@-xun/env';

import type { Environment } from '@-xun/env';

let envOverrides: Environment = {};

// TODO: replace validation logic with arktype instead (including defaults)

/**
 * Returns an object representing the application's runtime environment.
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function getEnv<T extends Environment = Environment>() {
  const env = {
    ...getDefaultEnv(),
    ...envOverrides
  };

  return env as typeof env & T;
}

/**
 * Set an internal `overrides` object that will be merged over any environment
 * variables coming from `process.env`. The values of `overrides` _must_ be in
 * their final form, e.g. of type `number` (✅ `42`) instead of a string (🚫
 * `"42"`), the latter being what the real `process.env` would provide but that
 * this function does not support.
 *
 * This function should only be used in a multitenant situation where relying on
 * exclusive access to `process.env` is not possible (e.g. `@nhscc/bdpa-cli`).
 */
export function overwriteEnv(overrides: typeof envOverrides) {
  envOverrides = overrides;
}
