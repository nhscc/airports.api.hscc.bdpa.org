const restrictedGlobals = require('confusing-browser-globals');

module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: [
        'jest',
        '@typescript-eslint',
        'import'
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
    ],
    parserOptions: {
        ecmaVersion: 8,
        sourceType: 'module',
        ecmaFeatures: {
            impliedStrict: true,
            experimentalObjectRestSpread: true,
            jsx: true,
        },
        project: 'tsconfig.eslint.json'
    },
    env: {
        es6: true,
        node: true,
        jest: true,
        'jest/globals': true,
        browser: true,
        webextensions: true,
    },
    rules: {
        'no-console': 'warn',
        'no-return-await': 'warn',
        'no-await-in-loop': 'warn',
        'require-atomic-updates': 'warn',
        'import/no-unresolved': ['error', { commonjs: true }],
        'no-restricted-globals': ['warn'].concat(restrictedGlobals),
        'no-extra-boolean-cast': 'off',
        '@typescript-eslint/camelcase': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/prefer-ts-expect-error': 'warn',
        '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true, ignoreIIFE: true }],
        '@typescript-eslint/ban-ts-comment': ['warn', {
            'ts-expect-error': 'allow-with-description',
            minimumDescriptionLength: 6,
        }],
        // ? Disable these rules for all files...
        'no-undef': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        'no-unused-vars': 'off',
    },
    overrides: [{
        // ? ... but enable these rules specifically for TypeScript files
        files: ['*.ts', '*.tsx'],
        rules: {
            'no-undef': 'error',
            '@typescript-eslint/no-var-requires': 'error',
            // ? Already handled by vscode
            '@typescript-eslint/no-unused-vars': 'off',
        }
    }, {
        files: ['*.test.*'],
        extends: [
            'plugin:jest/all',
            'plugin:jest/style',
        ],
        rules: {
            'jest/lowercase': 'off',
            'jest/consistent-test-it': 'off',
            'jest/require-top-level-describe': 'off',
            'jest/valid-describe': 'off',
        }
    }],
    settings: {
        'react': {
            version: 'detect'
        },
        'import/extensions': [
            '.ts', '.tsx', '.js', '.jsx',
        ],
        // ? Switch parsers depending on which type of file we're looking at
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx'],
            'babel-eslint': ['.js', '.jsx'],
        },
        'import/resolver': {
            alias : {
                map: [
                    // ! If changed, also update these aliases in tsconfig.js &
                    // ! package.json
                    ['universe','./src'],
                    ['multiverse','./lib'],
                    ['types','./types'],
                ],
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
            },
            typescript: {},
        },
        'import/ignore': [
            // ? Don't go complaining about anything that we don't own
            '.*/node_modules/.*',
            '.*/bin/.*'
        ]
    },
    ignorePatterns: ['coverage', 'build', '/gulpfile.js', '/next.config.js', 'bin']
};
