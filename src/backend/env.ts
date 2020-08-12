import { isNumber, isUndefined as isU } from 'util'
import { parse as parseAsBytes } from 'bytes'
import isServer from 'multiverse/is-server-side'
import { MIN_RESULT_PER_PAGE } from 'universe/backend'
import { AppError } from 'universe/backend/error'
import {ApiError} from 'next/dist/next-server/server/api-utils'

export function getEnv(loud=false) {
    const env = {
        NODE_ENV: process.env.NODE_ENV || process.env.BABEL_ENV || process.env.APP_ENV || 'unknown',
        MONGODB_URI: (process.env.MONGODB_URI || '').toString(),
        MONGODB_MS_PORT: !!process.env.MONGODB_MS_PORT ? parseInt(process.env.MONGODB_MS_PORT ?? '-Infinity') : null,
        DISABLED_API_VERSIONS: !!process.env.DISABLED_API_VERSIONS ? process.env.DISABLED_API_VERSIONS.split(',') : [],
        FLIGHTS_GENERATE_DAYS: parseInt(process.env.FLIGHTS_GENERATE_DAYS ?? '-Infinity'),
        AIRPORT_NUM_OF_GATE_LETTERS: parseInt(process.env.AIRPORT_NUM_OF_GATE_LETTERS ?? '-Infinity'),
        AIRPORT_GATE_NUMBERS_PER_LETTER: parseInt(process.env.AIRPORT_GATE_NUMBERS_PER_LETTER ?? '-Infinity'),
        AIRPORT_PAIR_USED_PERCENT: parseInt(process.env.AIRPORT_PAIR_USED_PERCENT ?? '-Infinity'),
        FLIGHT_HOUR_HAS_FLIGHTS_PERCENT: parseInt(process.env.FLIGHT_HOUR_HAS_FLIGHTS_PERCENT ?? '-Infinity'),
        RESULTS_PER_PAGE: parseInt(process.env.RESULTS_PER_PAGE ?? '-Infinity'),
        IGNORE_RATE_LIMITS: !!process.env.IGNORE_RATE_LIMITS && process.env.IGNORE_RATE_LIMITS !== 'false',
        LOCKOUT_ALL_KEYS: !!process.env.LOCKOUT_ALL_KEYS && process.env.LOCKOUT_ALL_KEYS !== 'false',
        DISALLOWED_METHODS: !!process.env.DISALLOWED_METHODS ? process.env.DISALLOWED_METHODS.split(',') : [],
        REQUESTS_PER_CONTRIVED_ERROR: parseInt(process.env.REQUESTS_PER_CONTRIVED_ERROR ?? '-Infinity'),
        MAX_CONTENT_LENGTH_BYTES: parseAsBytes(process.env.MAX_CONTENT_LENGTH_BYTES || '-Infinity'),
        HYDRATE_DB_ON_STARTUP: !isU(process.env.HYDRATE_DB_ON_STARTUP) && process.env.HYDRATE_DB_ON_STARTUP !== 'false',
        DEBUG_MODE: /--debug|--inspect/.test(process.execArgv.join(' ')),
        ifExists: (variable: string, action?: string) => {
            if(process.env[variable] === undefined)
                throw new AppError(`attempted ${action ? 'to ' + action : 'execution'} without first defining ${variable} in environment`);

            return process.env[variable] as string;
        }
    };

    const onlyIfServer = (envVar: unknown) => isServer() ? [envVar] : [];

    const _mustBeGtZero = [
        env.FLIGHTS_GENERATE_DAYS,
        env.AIRPORT_NUM_OF_GATE_LETTERS,
        env.AIRPORT_GATE_NUMBERS_PER_LETTER,
        ...onlyIfServer(env.AIRPORT_PAIR_USED_PERCENT),
        ...onlyIfServer(env.FLIGHT_HOUR_HAS_FLIGHTS_PERCENT),
        env.RESULTS_PER_PAGE,
        env.REQUESTS_PER_CONTRIVED_ERROR,
        env.MAX_CONTENT_LENGTH_BYTES
    ];

    if(loud && env.NODE_ENV == 'development') {
        /* eslint-disable-next-line no-console */
        console.info(`debug - ${env}`);
    }

    // ? Typescript troubles
    const NODE_X: string = env.NODE_ENV;

    if(NODE_X == 'unknown' || (isServer() && env.MONGODB_URI === '') ||
       _mustBeGtZero.some(v => !isNumber(v) || v < 0)) {
        throw new AppError('illegal environment detected, check environment variables');
    }

    if(env.RESULTS_PER_PAGE < MIN_RESULT_PER_PAGE)
        throw new AppError(`RESULTS_PER_PAGE must be >= ${MIN_RESULT_PER_PAGE}`);

    if(env.AIRPORT_NUM_OF_GATE_LETTERS > 26)
        throw new AppError(`AIRPORT_NUM_OF_GATE_LETTERS must be <= 26`);

    if(isServer() && env.AIRPORT_PAIR_USED_PERCENT > 100)
        throw new AppError(`AIRPORT_PAIR_USED_PERCENT must between 0 and 100`);

    if(isServer() && env.FLIGHT_HOUR_HAS_FLIGHTS_PERCENT > 100)
        throw new AppError(`FLIGHT_HOUR_HAS_FLIGHTS_PERCENT must between 0 and 100`);

    if(isServer() && env.MONGODB_MS_PORT && env.MONGODB_MS_PORT <= 1024)
        throw new AppError(`optional environment variable MONGODB_MS_PORT must be > 1024`);

    return env;
}
