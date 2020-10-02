// This webpack config is only used for compiling the external scripts. For the
// NextJS specific webpack configs, check config/next.config.ts

// ? Running an environment check first just to make sure everything is okay...
require('./src/dev-utils').populateEnv();

const DotenvPlugin = require('dotenv-webpack');

process.env.NODE_ENV = 'external';

module.exports = {
    mode: 'production',
    target: 'node',

    entry: {
        'ban-hammer': `${__dirname}/external-scripts/ban-hammer.ts`,
        'prune-logs': `${__dirname}/external-scripts/prune-logs.ts`,
        'generate-flights': `${__dirname}/external-scripts/generate-flights.ts`,
    },

    output: {
        filename: '[name].js',
        path: `${__dirname}/external-scripts/bin`
    },

    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json'],
        // ! If changed, also update these aliases in tsconfig.json,
        // ! jest.config.js, and .eslintrc.js
        alias: {
            universe: `${__dirname}/src/`,
            multiverse: `${__dirname}/lib/`,
            testverse: `${__dirname}/src/__test__/`
            // ? We don't care about types at this point
        }
    },

    module: { rules: [{ test: /\.(ts|js)x?$/, loader: 'babel-loader', exclude: /node_modules/ }]},
    stats: { warningsFilter: [/critical dependency:/i] },
    plugins: [ new DotenvPlugin() ]
};
