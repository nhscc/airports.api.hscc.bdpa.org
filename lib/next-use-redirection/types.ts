import type { FrontendRedirectConfig } from 'next-isomorphic-redirect'
import type { FetchConfig } from 'isomorphic-json-fetch'

export type RedirectParams<T=Record<string, unknown>> = {
    uri: string,
    redirectIf?: (data: T) => boolean,
    redirectTo?: string,
    fetchConfig?: FetchConfig,
    redirectConfig?: FrontendRedirectConfig
};
