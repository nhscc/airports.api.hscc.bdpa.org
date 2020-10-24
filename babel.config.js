// * Every now and then, we adopt best practices from CRA
// * https://tinyurl.com/yakv4ggx

// ? https://nodejs.org/en/about/releases
const NODE_OLDEST_LTS = '10.13.0';

// ! This is pretty aggressive. It targets modern browsers only.
// ? For some projects, less aggressive targets will make much more
// ? sense!
const browserTargets = 'Chrome >= 60, Safari >= 10.1, iOS >= 10.3, Firefox >= 54, Edge >= 15';
// ? Something like the following might be more appropriate:
//const targets = '>1% in US and not ie 11';

// ? Next.js-specific Babel settings
const nextBabelPreset = ['next/babel', {
    'preset-env': {
        targets: browserTargets,

        // ? If users import all core-js they're probably not concerned with
        // ? bundle size. We shouldn't rely on magic to try and shrink it.
        useBuiltIns: false,

        // ? Do not transform modules to CJS
        // ! MUST BE FALSE (see: https://nextjs.org/docs/#customizing-babel-config)
        modules: false,

        // ? Exclude transforms that make all code slower
        exclude: ['transform-typeof-symbol'],
    },
    'class-properties': {
        // ? Justification: https://github.com/facebook/create-react-app/issues/4263
        loose: true
    },
    'preset-typescript': {
        allowDeclareFields: true
    }
}];

module.exports = {
    parserOpts: { strictMode: true },
    plugins: [
        '@babel/plugin-proposal-export-default-from',
        '@babel/plugin-proposal-function-bind',
        '@babel/plugin-transform-typescript',
    ],
    // ? Sub-keys under the "env" config key will augment the above
    // ? configuration depending on the value of NODE_ENV and friends. Default
    // ? is: development
    env: {
        // * Used by Jest and `npm test`
        test: {
            sourceMaps: 'both',
            presets: [
                ['@babel/preset-env', { targets: { node: true }}],
                '@babel/preset-react',
                ['@babel/preset-typescript', { allowDeclareFields: true }],
                // ? We don't care about minification
            ]
        },
        // * Used by Vercel and `npm start`
        production: {
            // ? Source maps are handled by Next.js and Webpack
            presets: [nextBabelPreset],
            // ? Minification is handled by Webpack
        },
        // * Used by `npm run dev`; is also the default environment
        development: {
            // ? Source maps are handled by Next.js and Webpack
            presets: [nextBabelPreset],
            // ? https://reactjs.org/docs/error-boundaries.html#how-about-event-handlers
            plugins: ['@babel/plugin-transform-react-jsx-source'],
            // ? We don't care about minification
        },
        // * Used by `npm run generate` and `npm run regenerate`
        generator: {
            sourceMaps: 'inline',
            comments: false,
            presets: [
                ['@babel/preset-env', { targets: { node: NODE_OLDEST_LTS }}],
                ['@babel/preset-typescript', { allowDeclareFields: true }],
                // ? We don't care about minification
            ]
        },
        // * Used by `npm run build-externals`
        external: {
            presets: [
                ['@babel/preset-env', { targets: { node: NODE_OLDEST_LTS } }],
                ['@babel/preset-typescript', { allowDeclareFields: true }],
                // ? Webpack will handle minification
            ]
        }
    }
};
