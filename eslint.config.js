import reactConfig from './packages/config/eslint-react.js'
import mfeNavConfig from './packages/config/eslint-mfe-nav.js'

export default [
    ...reactConfig,
    // M0.7 — block hard-coded shell-owned route prefixes inside MFE
    // `navigate({to: ...})` calls. See packages/config/eslint-mfe-nav.js
    // for the rationale + the helpers MFE code should use instead.
    mfeNavConfig,
    {
        ignores: ['**/dist/**', '**/node_modules/**', '**/.turbo/**', '**/.rsbuild/**'],
    },
]
