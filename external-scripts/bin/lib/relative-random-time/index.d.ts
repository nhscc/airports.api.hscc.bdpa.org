export declare type TimeParams = {
    before?: number;
    after?: number;
};
export declare type TimespanParams = TimeParams & {
    bounds: number[];
};
/**
 * Returns a number between bounds[0] and bounds[1] (inclusive) that is higher
 * than `before` but lower than `after`.
 */
export declare function fromTimespan({ bounds, before, after }: TimespanParams): number;
/**
 * Returns a number that is higher than `before` but lower than `after`
 * representing a time in the distant past (months to decades).
 */
export declare function farPast({ before, after }?: TimeParams): number;
/**
 * Returns a number that is higher than `before` but lower than `after`
 * representing a time in the near past (seconds to minutes).
 */
export declare function nearPast({ before, after }?: TimeParams): number;
/**
 * Returns Date.now()
 */
export declare function present(): number;
/**
 * Returns a number that is higher than `before` but lower than `after`
 * representing a time in the distant future (months to decades).
 */
export declare function nearFuture({ before, after }?: TimeParams): number;
/**
 * Returns a number that is higher than `before` but lower than `after`
 * representing a time in the near future (seconds to minutes).
 */
export declare function farFuture({ before, after }?: TimeParams): number;
