import reactConfig from './packages/config/eslint-react.js'

export default [
    ...reactConfig,
    {
        ignores: ['**/dist/**', '**/node_modules/**', '**/.turbo/**', '**/.rsbuild/**'],
    },
]
