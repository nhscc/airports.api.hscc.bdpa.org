import { useState } from 'react'
import { useIsomorphicLayoutEffect as useLayoutEffect } from 'react-use'
import { frontendRedirect } from 'multiverse/next-isomorphic-redirect'
import { fetch } from 'isomorphic-json-fetch'
import useSWR from 'swr'

import type { FetchConfig } from 'isomorphic-json-fetch'
import type { FrontendRedirectConfig } from 'multiverse/next-isomorphic-redirect/types'

/**
 * Redirects to another location when configurable conditions are met.
 *
 * redirecting = null  - undecided
 * redirecting = true  - redirecting
 * redirecting = false - not redirecting
 * error is defined    - error occurred
 */
export function useRedirection<T>({ uri, redirectIf, redirectTo, redirectConfig, fetchConfig }: {
    uri: string,
    redirectIf?: (data: T) => boolean,
    redirectTo?: string,
    fetchConfig?: FetchConfig,
    redirectConfig?: FrontendRedirectConfig
}) {
    const { data, error, mutate } = useSWR(uri,
        url => fetch.get(url, { ...fetchConfig }).then(o => o.json)
    );

    const [ redirecting, setRedirecting ] = useState<boolean | null>(null);

    useLayoutEffect(() => {
        if(data === undefined) return;

        if(!redirectTo || !redirectIf || typeof redirectIf == 'function' && !redirectIf((data || {}) as T))
            setRedirecting(false);

        else {
            frontendRedirect(redirectTo, redirectConfig);
            setRedirecting(true);
        }
    }, [data, redirectIf, redirectTo, redirectConfig]);

    return { redirecting, mutate, error };
}
