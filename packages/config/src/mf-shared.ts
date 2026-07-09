/**
 * Shared Module Federation Configuration
 *
 * Single source of truth for shared dependency versions across all
 * micro-frontend rsbuild configs (shell, academics, people).
 * Prevents version drift and duplicate module loading.
 */

export interface MFSharedConfig {
  [key: string]: {
    singleton: boolean
    requiredVersion?: string
    eager: boolean
  }
}

/**
 * Returns the Module Federation shared dependencies config.
 *
 * @param role - 'host' for shell (eager: true), 'remote' for academics/people
 *               Currently both use eager: true per existing convention.
 */
export function getMFSharedConfig(_role: 'host' | 'remote'): MFSharedConfig {
  return {
    // Auth — CRITICAL: aws-amplify must be singleton to share token state across all modules
    'aws-amplify': { singleton: true, eager: true },
    '@edforge/auth': { singleton: true, requiredVersion: '0.0.1', eager: true },

    // Core React
    react: { singleton: true, requiredVersion: '^19.0.0', eager: true },
    'react-dom': { singleton: true, requiredVersion: '^19.0.0', eager: true },

    // Routing & State
    '@tanstack/react-query': { singleton: true, requiredVersion: '^5.60.0', eager: true },
    '@tanstack/react-router': { singleton: true, requiredVersion: '^1.82.0', eager: true },
    '@tanstack/react-table': { singleton: true, eager: true },
    zustand: { singleton: true, requiredVersion: '^5.0.0', eager: true },

    // EdForge packages
    '@edforge/ui': { singleton: true, requiredVersion: '0.0.1', eager: true },
    '@edforge/abac': { singleton: true, requiredVersion: '0.0.1', eager: true },
    '@edforge/types': { singleton: true, requiredVersion: '0.0.1', eager: true },
    '@edforge/theme': { singleton: true, requiredVersion: '0.0.1', eager: true },

    // @edforge/config — CRITICAL: hosts the school-context-channel singleton
    // (`_lastPayload` module-level variable). If not shared, each MFE bundles
    // its own copy of the singleton and the Shell's broadcasts never reach
    // the MFEs' copies → MFE forms see archetype=null → US-shape renders on
    // PABSON tenants (Sprint A.12/A.13), and Finance first-paints USD before
    // NPR settings arrive (2026-07-09 currency-flash bug).
    //
    // The key MUST be the trailing-slash PREFIX form: this package exports
    // ONLY subpaths (no "." entry — see packages/config/package.json), and
    // every consumer imports `@edforge/config/school-context-channel` etc.
    // A bare share key matches only the exact request string, so the old
    // `'@edforge/config'` entry never engaged and each container silently
    // bundled its own copy. Prefix keys match all subpath requests.
    // (requiredVersion is omitted — not meaningful for prefix shares.)
    '@edforge/config/': { singleton: true, eager: true },

    // @edforge/forms — singleton because (a) useTenantContext is a React hook
    // that must share React state with @edforge/config's broadcast subscriber,
    // and (b) AddressFields/PhoneInput components must come from the same
    // module instance to interop with react-hook-form's FormProvider context.
    '@edforge/forms': { singleton: true, requiredVersion: '0.0.1', eager: true },

    // @edforge/archetype — CRITICAL singleton, same rationale as @edforge/config:
    // it holds the governance-body profile registry. If each MFE bundled its own
    // copy, archetype-resolution could diverge across MFEs (and a future
    // module-level configured singleton would split-brain). One instance only.
    '@edforge/archetype': { singleton: true, requiredVersion: '0.0.1', eager: true },

    // i18n — singleton so language changes propagate across all modules
    '@edforge/i18n': { singleton: true, requiredVersion: '0.0.1', eager: true },
    i18next: { singleton: true, eager: true },
    'react-i18next': { singleton: true, eager: true },

    // Date utilities — singleton for consistent BS/AD formatting
    '@edforge/date-utils': { singleton: true, requiredVersion: '0.0.1', eager: true },

    // Forms
    'react-hook-form': { singleton: true, requiredVersion: '^7.50.0', eager: true },
    '@hookform/resolvers': { singleton: true, requiredVersion: '^3.9.0', eager: true },
    zod: { singleton: true, requiredVersion: '^3.23.0', eager: true },

    // Animation — aligned version across all apps
    'framer-motion': { singleton: true, requiredVersion: '^11.15.0', eager: true },
    '@react-spring/web': { singleton: true, requiredVersion: '^10.0.3', eager: true },

    // Toast notifications — singleton so toasts from MFEs render in shell's <Toaster>
    sonner: { singleton: true, eager: true },
  }
}
