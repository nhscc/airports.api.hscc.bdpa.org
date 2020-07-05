import * as Time from './index'
import 'jest-extended'

const now = Date.now();
Date.now = (): number => now;

describe('relative-random-time', () => {
    describe('::fromTimespan', () => {
        it('returns a random integer within the bounds provided', () => {
            expect(Time.fromTimespan({ bounds: [0, 0] })).toEqual(now);
            expect(Time.fromTimespan({ bounds: [1, 1] })).toEqual(now + 1);
            expect(Time.fromTimespan({ bounds: [-1, -1] })).toEqual(now - 1);
            expect(() => Time.fromTimespan({ bounds: [-(10**10), -(10**3)] })).not.toThrow();
            expect(() => Time.fromTimespan({ bounds: [(10**10), (10**3)] })).not.toThrow();
        });

        it('returns a random integer within the bounds provided regardless of order', () => {
            expect(Time.fromTimespan({ bounds: [0, -1] })).toBeOneOf([now - 1, now]);
            expect(Time.fromTimespan({ bounds: [-1, 0] })).toBeOneOf([now - 1, now]);
        });

        it('returns a random integer within the bounds provided but before X', () => {
            expect(Time.fromTimespan({ bounds: [10**10, -2], before: now })).toBeOneOf([now, now - 1, now - 2]);
        });

        it('returns a random integer within the bounds provided but after X', () => {
            expect(Time.fromTimespan({ bounds: [-(10**10), 1], after: now })).toEqual(now + 1);
        });

        it('returns a random integer within the bounds provided but before X and after Y', () => {
            expect(Time.fromTimespan({ bounds: [-(10**3), 10**3], before: now + 1, after: now - 1 })).toEqual(now);
        });

        it('throws when before and after are within one millisecond of each other', () => {
            expect(() => Time.fromTimespan({ bounds: [-(10**3), 10**3], before: now, after: now })).toThrow();
            expect(() => Time.fromTimespan({ bounds: [-(10**3), 10**3], before: now - 1, after: now })).toThrow();
            expect(() => Time.fromTimespan({ bounds: [-(10**3), 10**3], before: now + 1, after: now })).toThrow();
            expect(() => Time.fromTimespan({ bounds: [-(10**3), 10**3], before: now, after: now - 1 })).toThrow();
            expect(() => Time.fromTimespan({ bounds: [-(10**3), 10**3], before: now, after: now + 1 })).toThrow();
        });
    });

    describe('::present', () => {
        it('returns the expected time', () => {
            expect(Time.present()).toEqual<number>(now);
        });
    });
});
