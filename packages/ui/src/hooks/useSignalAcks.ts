import { useCallback, useState } from 'react'

const STORAGE_KEY = 'edforge.signal-acks'

/**
 * Per-user acknowledge store for Attention Corner signals: signalId → epoch ms.
 * Interim persistence is localStorage (per browser ≈ per user), matching the
 * approved prototype — the /users/:id/preferences endpoint is a fixed schema
 * with no key-value slot today, so cross-device roaming is a flagged backend
 * gap. Un-acknowledge deletes the key. Dismissals are NOT stored here — those
 * are session-scoped inside AttentionCorner by design.
 */
export function useSignalAcks(): {
  acked: ReadonlySet<string>
  ack: (id: string) => void
  unack: (id: string) => void
} {
  const [ackMap, setAckMap] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, number>
    } catch {
      return {}
    }
  })

  const persist = useCallback((next: Record<string, number>) => {
    setAckMap(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* storage unavailable — acks stay in memory for the session */
    }
  }, [])

  const ack = useCallback(
    (id: string) => {
      persist({ ...ackMap, [id]: Date.now() })
    },
    [ackMap, persist],
  )

  const unack = useCallback(
    (id: string) => {
      const next = { ...ackMap }
      delete next[id]
      persist(next)
    },
    [ackMap, persist],
  )

  return { acked: new Set(Object.keys(ackMap)), ack, unack }
}
