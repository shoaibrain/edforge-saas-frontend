/**
 * Tenant-Aware Remote Resolution Plugin
 *
 * This runtime plugin intercepts module federation requests and resolves
 * remote URLs based on the current tenant configuration.
 */

import type { FederationRuntimePlugin } from '@module-federation/enhanced/runtime'

interface TenantConfig {
  id: string
  remoteUrls: {
    // [MVP-PARKED] edfi?: string
    academics?: string
    finance?: string
    people?: string
    portal?: string
    integrations?: string
  }
}

declare global {
  interface Window {
    __EDFORGE_CONFIG__?: {
      tenantId?: string
      remotes?: {
        // [MVP-PARKED] edfi?: string
        academics?: string
        finance?: string
        people?: string
        portal?: string
        integrations?: string
      }
    }
  }
}

/**
 * Get tenant configuration from environment or session
 */
function getTenantConfig(): TenantConfig {
  // 1. Runtime Injection (Preferred for Production/Docker)
  if (typeof window !== 'undefined' && window.__EDFORGE_CONFIG__?.remotes) {
    return {
      id: window.__EDFORGE_CONFIG__.tenantId || 'default',
      remoteUrls: window.__EDFORGE_CONFIG__.remotes,
    }
  }

  // 2. Local Development (Static Ports)
  if (import.meta.env.DEV) {
    return {
      id: 'dev',
      remoteUrls: {
        // [MVP-PARKED] edfi: 'http://localhost:3001',
        academics: 'http://localhost:3002',
        finance: 'http://localhost:3003',
        people: 'http://localhost:3004',
        portal: 'http://localhost:3005',
        integrations: 'http://localhost:3006',
      },
    }
  }

  // 3. Build-time Environment Variables (Legacy/CI)
  const tenantId = resolveTenantFromHostname()

  return {
    id: tenantId || 'default',
    remoteUrls: {
      // [MVP-PARKED] edfi: `${import.meta.env.VITE_EDFI_URL || ''}/remoteEntry.js`,
      academics: `${import.meta.env.VITE_ACADEMICS_URL || ''}/remoteEntry.js`,
      finance: `${import.meta.env.VITE_FINANCE_URL || ''}/remoteEntry.js`,
      people: `${import.meta.env.VITE_PEOPLE_URL || ''}/remoteEntry.js`,
      portal: `${import.meta.env.VITE_PORTAL_URL || ''}/remoteEntry.js`,
      integrations: `${import.meta.env.VITE_INTEGRATIONS_URL || ''}/remoteEntry.js`,
    },
  }
}

/**
 * Resolve tenant ID from the current hostname
 * Supports both subdomain and path-based multi-tenancy
 */
function resolveTenantFromHostname(): string | null {
  if (typeof window === 'undefined') return null

  const hostname = window.location.hostname

  // Skip tenant resolution for localhost and known domains
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.edforge.app')
  ) {
    // Check for subdomain: tenant.edforge.app
    const parts = hostname.split('.')
    if (parts.length > 2) {
      return parts[0]
    }

    // Check for path-based: /tenant/{id}
    const pathMatch = window.location.pathname.match(/^\/tenant\/([^/]+)/)
    if (pathMatch) {
      return pathMatch[1]
    }
  }

  return null
}

/**
 * Module Federation runtime plugin for tenant-aware remote resolution
 */
const tenantResolverPlugin: FederationRuntimePlugin = {
  name: 'tenant-resolver',

  beforeRequest(args) {
    const config = getTenantConfig()
    const remoteName = args.id as keyof TenantConfig['remoteUrls']
    const remoteUrl = config.remoteUrls[remoteName]

    if (!remoteUrl) {
      console.warn(`[MFE] No remote URL configured for: ${remoteName}`)
      return args
    }

    // Override the remote entry URL
    return {
      ...args,
      options: {
        ...args.options,
        remoteEntry: remoteUrl.endsWith('/remoteEntry.js')
          ? remoteUrl
          : `${remoteUrl}/remoteEntry.js`,
      },
    }
  },

  // Error handling for failed remote loads
  errorLoadRemote(args) {
    console.error(`[MFE] Failed to load remote: ${args.id}`, args.error)

    // Could trigger a fallback UI or retry logic here
    return args
  },

  // Log when remotes are loaded successfully
  afterResolve(args) {
    console.log(`[MFE] Resolved remote: ${args.id} → ${args.remoteInfo?.entry}`)
    return args
  },
}

export default tenantResolverPlugin

