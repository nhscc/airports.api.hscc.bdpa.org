import * as Time from './index'
import 'jest-extended'

const now = Date.now();
Date.now = (): number => now;

describe('relative-random-time', () => {
    describe('::fromTimespan', () => {
        it('returns a random integer within the bounds provided', () => {
            expect.hasAssertions();

            expect(Time.fromTimespan({ bounds: [0, 0] })).toStrictEqual(now);
            expect(Time.fromTimespan({ bounds: [1, 1] })).toStrictEqual(now + 1);
            expect(Time.fromTimespan({ bounds: [-1, -1] })).toStrictEqual(now - 1);
            expect(() => Time.fromTimespan({ bounds: [-(10**10), -(10**3)] })).not.toThrow();
            expect(() => Time.fromTimespan({ bounds: [(10**10), (10**3)] })).not.toThrow();
        });

        it('returns a random integer within the bounds provided regardless of order', () => {
            expect.hasAssertions();

            expect(Time.fromTimespan({ bounds: [0, -1] })).toBeOneOf([now - 1, now]);
            expect(Time.fromTimespan({ bounds: [-1, 0] })).toBeOneOf([now - 1, now]);
        });

        it('returns a random integer within the bounds provided but before X', () => {
            expect.hasAssertions();

            expect(Time.fromTimespan({ bounds: [10**10, -2], before: now })).toBeOneOf([now, now - 1, now - 2]);
        });

        it('returns a random integer within the bounds provided but after X', () => {
            expect.hasAssertions();

            expect(Time.fromTimespan({ bounds: [-(10**10), 1], after: now })).toStrictEqual(now + 1);
        });

        it('returns a random integer within the bounds provided but before X and after Y', () => {
            expect.hasAssertions();

            expect(Time.fromTimespan({ bounds: [-(10**3), 10**3], before: now + 1, after: now - 1 })).toStrictEqual(now);
        });

        it('throws when before and after are within one millisecond of each other', () => {
            expect.hasAssertions();

            expect(() => Time.fromTimespan({ bounds: [-(10**3), 10**3], before: now, after: now })).toThrow(Time.BadBoundsError);
            expect(() => Time.fromTimespan({ bounds: [-(10**3), 10**3], before: now - 1, after: now })).toThrow(Time.BadBoundsError);
            expect(() => Time.fromTimespan({ bounds: [-(10**3), 10**3], before: now + 1, after: now })).toThrow(Time.BadBoundsError);
            expect(() => Time.fromTimespan({ bounds: [-(10**3), 10**3], before: now, after: now - 1 })).toThrow(Time.BadBoundsError);
            expect(() => Time.fromTimespan({ bounds: [-(10**3), 10**3], before: now, after: now + 1 })).toThrow(Time.BadBoundsError);
        });
    });

    describe('::present', () => {
        it('returns the expected time', () => {
            expect.hasAssertions();
            expect(Time.present()).toStrictEqual<number>(now);
        });
    });
});
