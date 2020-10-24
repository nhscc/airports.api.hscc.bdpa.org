module.exports = {
    collectCoverageFrom: [
        'src/**/*.ts?(x)',
        'external-scripts/**/*.ts?(x)',
    ],
    testEnvironment: 'node',
    testRunner: 'jest-circus/runner',
    verbose: false,
    testPathIgnorePatterns: [ '/node_modules/' ],
    // ! If changed, also update these aliases in tsconfig.json,
    // ! webpack.config.js, next.config.ts, and .eslintrc.js
    moduleNameMapper: {
        '^universe/(.*)$': '<rootDir>/src/$1',
        '^multiverse/(.*)$': '<rootDir>/lib/$1',
        '^testverse/(.*)$': '<rootDir>/test/$1',
        '^externals/(.*)$': '<rootDir>/external-scripts/$1',
        '^types/(.*)$': '<rootDir>/types/$1',
    },
    setupFilesAfterEnv: [ './test/setup.ts' ],
};
