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
