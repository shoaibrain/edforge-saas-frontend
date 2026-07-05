import { useEffect, useRef } from 'react'

import { useAuthStore } from '@/stores/auth.store'
import { registerSession, touchSession } from '@/services/users.service'

/** How often to rebind the session to the current access token (SR.3). */
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000

/**
 * Registers the caller's session after sign-in (SR.1) and keeps it fresh with a
 * periodic heartbeat that rebinds the row to the current access token after a
 * silent Cognito refresh (SR.3). Mount once inside the authenticated shell.
 *
 * Best-effort by design: session tracking must never break the app, so every
 * network call is guarded. A revoked or expired session surfaces through the
 * api client's global 401 interceptor (which signs the user out) — not here.
 */
export function useSessionLifecycle(): void {
  const userId = useAuthStore((s) => s.user?.id)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const sessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      sessionIdRef.current = null
      return
    }

    let cancelled = false
    let heartbeat: ReturnType<typeof setInterval> | undefined

    const beat = async () => {
      const sessionId = sessionIdRef.current
      if (!sessionId) return
      try {
        await touchSession(userId, sessionId)
      } catch {
        // best-effort; 401s are handled by the api interceptor
      }
    }

    void (async () => {
      try {
        const session = await registerSession(userId)
        if (cancelled) return
        sessionIdRef.current = session.sessionId
      } catch {
        // never block the app on session registration
      }
      if (cancelled) return
      heartbeat = setInterval(beat, HEARTBEAT_INTERVAL_MS)
    })()

    return () => {
      cancelled = true
      if (heartbeat) clearInterval(heartbeat)
    }
  }, [userId, isAuthenticated])
}
