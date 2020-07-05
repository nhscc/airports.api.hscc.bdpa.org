import { isNumber, isUndefined as isU } from 'util'
import { parse as parseAsBytes } from 'bytes'
import isServer from 'multiverse/is-server-side'
import { MIN_RESULT_PER_PAGE } from 'universe/backend'

export function getEnv(loud=false) {
    const env = {
        NODE_ENV: process.env.NODE_ENV || process.env.BABEL_ENV || process.env.APP_ENV || 'unknown',
        MONGODB_URI: (process.env.MONGODB_URI || '').toString(),
        V1_ENABLED: !!process.env.V1_ENABLED && process.env.V1_ENABLED !== 'false',
        V2_ENABLED: !!process.env.V2_ENABLED && process.env.V2_ENABLED !== 'false',
        FLIGHTS_GENERATE_DAYS: parseInt(process.env.FLIGHTS_GENERATE_DAYS ?? '-Infinity'),
        AIRPORT_NUM_OF_GATE_LETTERS: parseInt(process.env.AIRPORT_NUM_OF_GATE_LETTERS ?? '-Infinity'),
        AIRPORT_GATE_NUMBERS_PER_LETTER: parseInt(process.env.AIRPORT_GATE_NUMBERS_PER_LETTER ?? '-Infinity'),
        MIN_AIRPORT_PAIRS_USED_PERCENT: parseInt(process.env.MIN_AIRPORT_PAIRS_USED_PERCENT ?? '-Infinity'),
        FLIGHT_HOURS_PER_DAY: parseInt(process.env.FLIGHT_HOURS_PER_DAY ?? '-Infinity'),
        RESULTS_PER_PAGE: parseInt(process.env.RESULTS_PER_PAGE ?? '-Infinity'),
        IGNORE_RATE_LIMITS: !!process.env.IGNORE_RATE_LIMITS && process.env.IGNORE_RATE_LIMITS !== 'false',
        LOCKOUT_ALL_KEYS: !!process.env.LOCKOUT_ALL_KEYS && process.env.LOCKOUT_ALL_KEYS !== 'false',
        DISALLOWED_METHODS: !!process.env.DISALLOWED_METHODS ? process.env.DISALLOWED_METHODS.split(',') : [],
        REQUESTS_PER_CONTRIVED_ERROR: parseInt(process.env.REQUESTS_PER_CONTRIVED_ERROR ?? '-Infinity'),
        MAX_CONTENT_LENGTH_BYTES: parseAsBytes(process.env.MAX_CONTENT_LENGTH_BYTES || '-Infinity'),
        HYDRATE_DB_ON_STARTUP: !isU(process.env.HYDRATE_DB_ON_STARTUP) && process.env.HYDRATE_DB_ON_STARTUP !== 'false',
    };

    const _mustBeGtZero = [
        env.FLIGHTS_GENERATE_DAYS,
        env.AIRPORT_NUM_OF_GATE_LETTERS,
        env.AIRPORT_GATE_NUMBERS_PER_LETTER,
        env.MIN_AIRPORT_PAIRS_USED_PERCENT,
        env.FLIGHT_HOURS_PER_DAY,
        env.RESULTS_PER_PAGE,
        env.REQUESTS_PER_CONTRIVED_ERROR,
        env.MAX_CONTENT_LENGTH_BYTES
    ];

    if(loud && env.NODE_ENV == 'development') {
        /* eslint-disable-next-line no-console */
        console.info(env);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if(env.NODE_ENV == 'unknown' || (isServer() && env.MONGODB_URI === '') ||
       _mustBeGtZero.some(v => !isNumber(v) || v < 0)) {
        throw new Error('illegal environment detected, check environment variables');
    }

    if(env.RESULTS_PER_PAGE < MIN_RESULT_PER_PAGE)
        throw new Error(`RESULTS_PER_PAGE must be >= ${MIN_RESULT_PER_PAGE}`);

    if(env.AIRPORT_NUM_OF_GATE_LETTERS > 26)
        throw new Error(`AIRPORT_NUM_OF_GATE_LETTERS must be <= 26`);

    if(env.MIN_AIRPORT_PAIRS_USED_PERCENT > 100)
        throw new Error(`MIN_AIRPORT_PAIRS_USED_PERCENT must between 0 and 100`);

    if(env.FLIGHT_HOURS_PER_DAY > 24)
        throw new Error(`FLIGHT_HOURS_PER_DAY must be <= 24`);

    return env;
}
