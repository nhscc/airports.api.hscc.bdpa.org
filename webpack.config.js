// This webpack config is used for compiling the scripts under
// external-scripts/. For the NextJS specific webpack configs, check
// config/next.config.ts

// ? Running an environment check first just to make sure everything is okay...
require('./src/dev-utils').populateEnv();

const DotenvPlugin = require('dotenv-webpack');
const nodeExternals = require('webpack-node-externals');


module.exports = {
    name: 'externals',
    mode: 'production',
    target: 'node',
    node: false,

    entry: {
        'ban-hammer': `${__dirname}/external-scripts/ban-hammer.ts`,
        'prune-logs': `${__dirname}/external-scripts/prune-logs.ts`,
        'generate-flights': `${__dirname}/external-scripts/generate-flights.ts`,
    },

    output: {
        filename: '[name].js',
        path: `${__dirname}/external-scripts/bin`,
    },

    externals: [nodeExternals()],

    stats: {
        //orphanModules: true, // ? Webpack 5
        providedExports: true,
        usedExports: true,
    },

    resolve: {
        extensions: ['.ts', '.wasm', '.mjs', '.cjs', '.js', '.json'],
        // ! If changed, also update these aliases in tsconfig.json,
        // ! jest.config.js, next.config.ts, and .eslintrc.js
        alias: {
            universe: `${__dirname}/src/`,
            multiverse: `${__dirname}/lib/`,
            testverse: `${__dirname}/test/`,
            externals: `${__dirname}/external-scripts/`,
            types: `${__dirname}/types/`
        },
    },

    module: { rules: [{ test: /\.(ts|js)x?$/, loader: 'babel-loader', exclude: /node_modules/ }] },
    optimization: { usedExports: true },
    //ignoreWarnings: [/critical dependency:/i], // ? Webpack 5
    plugins: [ new DotenvPlugin() ],
};
