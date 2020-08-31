module.exports = {
    collectCoverageFrom: [
        '**/*.{js,jsx,ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/bin/**'
    ],
    testEnvironment: 'node',
    testRunner: 'jest-circus/runner',
    verbose: false,
    testPathIgnorePatterns: [ '/node_modules/', '/.next/', '/bin/' ],
    moduleNameMapper: {
        '^universe/(.*)$': '<rootDir>/src/$1',
        '^multiverse/(.*)$': '<rootDir>/lib/$1',
        '^types/(.*)$': '<rootDir>/types/$1'
    },
    setupFilesAfterEnv: [ 'jest-extended' ]
};
