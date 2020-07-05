import randomInt from 'random-int'

export type TimeParams = { before?: number; after?: number };
export type TimespanParams = TimeParams & { bounds: number[] };

const FAR_LARGEST_ABS = 10**12;
const FAR_SMALLEST_ABS = 10**9;
const NEAR_LARGEST_ABS = 10**5;
const NEAR_SMALLEST_ABS = 10**3;

const dateTLS = (time: number): string => (!isFinite(time) && time.toString()) || (new Date(time)).toLocaleString();

/**
 * Returns a number between bounds[0] and bounds[1] (inclusive) that is higher
 * than `before` but lower than `after`.
 */
export function fromTimespan({ bounds, before, after }: TimespanParams): number {
    // ? Ensure sorting happens in ascending order
    bounds.sort((a, b) => a - b);

    const now = Date.now();
    const floor = Math.max((after ?? -Infinity) + 1, now + bounds[0]);
    const ceiling = Math.min((before ?? Infinity) - 1, now + bounds[1]);

    if(floor > ceiling) {
        const errorPreamble = 'bad bounds. Cannot choose a time that occurs before';
        throw new Error(`${errorPreamble} ${dateTLS(ceiling)} yet after ${dateTLS(floor)}`);
    }

    return randomInt(ceiling, floor);
}

/**
 * Returns a number that is higher than `before` but lower than `after`
 * representing a time in the distant past (months to decades).
 */
export function farPast({ before, after }: TimeParams = {}): number {
    return fromTimespan({ bounds: [-FAR_SMALLEST_ABS, -FAR_LARGEST_ABS], before, after });
}

/**
 * Returns a number that is higher than `before` but lower than `after`
 * representing a time in the near past (seconds to minutes).
 */
export function nearPast({ before, after }: TimeParams = {}): number {
    return fromTimespan({ bounds: [-NEAR_SMALLEST_ABS, -NEAR_LARGEST_ABS], before, after });
}

/**
 * Returns Date.now()
 */
export function present(): number {
    return Date.now();
}

/**
 * Returns a number that is higher than `before` but lower than `after`
 * representing a time in the distant future (months to decades).
 */
export function nearFuture({ before, after }: TimeParams = {}): number {
    return fromTimespan({ bounds: [NEAR_SMALLEST_ABS, NEAR_LARGEST_ABS], before, after });
}

/**
 * Returns a number that is higher than `before` but lower than `after`
 * representing a time in the near future (seconds to minutes).
 */
export function farFuture({ before, after }: TimeParams = {}): number {
    return fromTimespan({ bounds: [FAR_SMALLEST_ABS, FAR_LARGEST_ABS], before, after });
}
