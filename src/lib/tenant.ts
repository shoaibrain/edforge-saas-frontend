/**
 * Tenant Resolution Utility
 * Derives TenantID from the subdomain of the current hostname.
 */

/**
 * Extracts the tenant ID from a hostname.
 * - tenant1.edforge.com → 'tenant1'
 * - app.edforge.com → 'app'
 * - localhost → null
 * - 127.0.0.1 → null
 */
export function resolveTenantIdFromHostname(hostname: string): string | null {
  // Handle localhost and IP addresses - no tenant
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.')
  ) {
    return null
  }

  const parts = hostname.split('.')
  
  // Need at least a subdomain (e.g., tenant1.edforge.com has 3 parts)
  // For development, also accept tenant1.localhost (2 parts)
  if (parts.length >= 2) {
    const subdomain = parts[0]
    // Don't treat 'www' as a tenant
    if (subdomain === 'www') {
      return parts.length >= 3 ? parts[1] : null
    }
    return subdomain
  }

  return null
}

/**
 * Gets the current tenant ID from window.location.hostname
 */
export function getTenantId(): string | null {
  if (typeof window === 'undefined') return null
  return resolveTenantIdFromHostname(window.location.hostname)
}

/**
 * React hook for accessing the current tenant ID
 */
export function useTenantId(): string | null {
  // In a CSR app, this is stable after initial mount
  return getTenantId()
}

