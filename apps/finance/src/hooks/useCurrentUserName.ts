/**
 * Resolve the logged-in operator's display name from the Cognito ID token.
 *
 * The finance MFE has no auth store of its own (the shell owns identity and
 * the school-context broadcast carries no user), so this reads the token
 * directly — same precedent as apps/analytics `useTenantId`. Returns null
 * until resolved or when unauthenticated; callers should hide the field
 * rather than render a placeholder.
 */

import { useEffect, useState } from 'react'
import { getIdTokenPayload } from '@edforge/auth'

export function useCurrentUserName(): string | null {
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void getIdTokenPayload().then((payload) => {
      if (cancelled || !payload) return
      setName(payload.name ?? payload.preferred_username ?? payload.email ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return name
}
