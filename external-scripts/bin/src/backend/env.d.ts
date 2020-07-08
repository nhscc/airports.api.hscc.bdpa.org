export declare function getEnv(loud?: boolean): {
    NODE_ENV: "development" | "production" | "test";
    MONGODB_URI: string;
    MONGODB_MS_PORT: number | null;
    DISABLED_API_VERSIONS: string[];
    FLIGHTS_GENERATE_DAYS: number;
    AIRPORT_NUM_OF_GATE_LETTERS: number;
    AIRPORT_GATE_NUMBERS_PER_LETTER: number;
    AIRPORT_PAIR_USED_PERCENT: number;
    FLIGHT_HOUR_HAS_FLIGHTS_PERCENT: number;
    RESULTS_PER_PAGE: number;
    IGNORE_RATE_LIMITS: boolean;
    LOCKOUT_ALL_KEYS: boolean;
    DISALLOWED_METHODS: string[];
    REQUESTS_PER_CONTRIVED_ERROR: number;
    MAX_CONTENT_LENGTH_BYTES: number;
    HYDRATE_DB_ON_STARTUP: boolean;
    DEBUG_MODE: boolean;
};
