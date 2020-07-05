import withBundleAnalyzer from '@next/bundle-analyzer'

import type { Configuration } from 'webpack'

// ? Not using ES6/TS import syntax here because dev-utils has special
// ? circumstances
// eslint-disable-next-line import/no-unresolved, @typescript-eslint/no-var-requires
require('./src/dev-utils').populateEnv();

const paths = {
    universe: `${__dirname}/src/`,
    multiverse: `${__dirname}/lib/`,
    // types/ is purposely excluded
};

module.exports = () => {
    return withBundleAnalyzer({
        enabled: process.env.ANALYZE === 'true'
    })({
        // ? Renames the build dir "build" instead of ".next"
        distDir: 'build',

        // ? Webpack configuration
        // ! Note that the webpack configuration is executed twice: once
        // ! server-side and once client-side!
        webpack: (config: Configuration) => {
            // ? These are aliases that can be used during JS import calls
            // ! Note that you must also change these same aliases in tsconfig.json
            // ! Note that you must also change these same aliases in package.json (jest)
            config.resolve && (config.resolve.alias = {
                ...config.resolve.alias,
                universe: paths.universe,
                multiverse: paths.multiverse,
                // types/ is purposely excluded
            });

            return config;
        },

        // ? Select some environment variables defined in .env to push to the
        // ? client.
        // !! DO NOT PUT ANY SECRET ENVIRONMENT VARIABLES HERE !!
        env: {
            FLIGHTS_GENERATE_DAYS: process.env.FLIGHTS_GENERATE_DAYS,
            AIRPORT_NUM_OF_GATE_LETTERS: process.env.AIRPORT_NUM_OF_GATE_LETTERS,
            AIRPORT_GATE_NUMBERS_PER_LETTER: process.env.AIRPORT_GATE_NUMBERS_PER_LETTER,
            RESULTS_PER_PAGE: process.env.RESULTS_PER_PAGE,
            IGNORE_RATE_LIMITS: process.env.IGNORE_RATE_LIMITS,
            LOCKOUT_ALL_KEYS: process.env.LOCKOUT_ALL_KEYS,
            DISALLOWED_METHODS: process.env.DISALLOWED_METHODS,
            REQUESTS_PER_CONTRIVED_ERROR: process.env.REQUESTS_PER_CONTRIVED_ERROR,
            MAX_CONTENT_LENGTH_BYTES: process.env.MAX_CONTENT_LENGTH_BYTES,
        },

        // TODO: move these out of experimental when they're not experimental
        // TODO: anymore!
        experimental: {
            optionalCatchAll: true,
            async rewrites() {
                return [
                    // {
                    //     source: '/v1/meta',
                    //     destination: '/api/v1/meta'
                    // },
                ];
            }
        }
    });
};
