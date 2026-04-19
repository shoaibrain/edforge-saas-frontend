/**
 * useTenantId — derive the current Cognito-issued tenantId.
 *
 * Reads `custom:tenantId` from the ID token payload. Returns null while
 * the token is loading or if the user isn't signed in.
 */

import { useEffect, useState } from 'react'
import { getIdTokenPayload } from '@edforge/auth'

export function useTenantId(): string | null {
  const [tenantId, setTenantId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const payload = await getIdTokenPayload()
        if (cancelled) return
        const id = (payload as Record<string, unknown> | null)?.['custom:tenantId']
        setTenantId(typeof id === 'string' ? id : null)
      } catch {
        if (!cancelled) setTenantId(null)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return tenantId
}
