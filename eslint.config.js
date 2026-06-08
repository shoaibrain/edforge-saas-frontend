import reactConfig from './packages/config/eslint-react.js'
import mfeNavConfig from './packages/config/eslint-mfe-nav.js'
import noIdSliceInJsxConfig from './packages/config/eslint-no-id-slice-in-jsx.js'
import designSystemConfig from './packages/config/eslint-design-system.js'

export default [
    ...reactConfig,
    // M0.7 — block hard-coded shell-owned route prefixes inside MFE
    // `navigate({to: ...})` calls. See packages/config/eslint-mfe-nav.js
    // for the rationale + the helpers MFE code should use instead.
    mfeNavConfig,
    // Wave 1 — block raw UUID-fragment (`id.slice(0, N)`) renders in JSX.
    // Use @edforge/archetype's <EntityIdDisplay> / <UuidBadge> instead.
    noIdSliceInJsxConfig,
    // Governance lock-in — design-system rules are errors now that the
    // hardcoded color/arbitrary-scale baseline has been cleared.
    ...designSystemConfig,
    {
        ignores: ['**/dist/**', '**/node_modules/**', '**/.turbo/**', '**/.rsbuild/**'],
    },
]
