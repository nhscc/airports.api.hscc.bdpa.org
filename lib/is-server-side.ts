/**
 * Returns `true` if this code is currently executing on the server or with SSR.
 */
export default function isServerSide() {
    return typeof window == 'undefined';
}

/**
 * Alias for `isServerSide()`
 */
export const isServer = isServerSide;
