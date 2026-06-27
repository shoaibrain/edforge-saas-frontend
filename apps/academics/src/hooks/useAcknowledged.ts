import { useCallback, useEffect, useState } from 'react'

const PREFIX = 'edforge.ack.'

/**
 * Persisted one-time acknowledgement, keyed by a stable string. Returns
 * `[acknowledged, acknowledge]`. Re-syncs when the key changes — useful when the
 * key embeds an async-loaded value (e.g. the attendance mode) so the dismissed
 * state reflects the correct key once that value resolves.
 */
export function useAcknowledged(key: string): [boolean, () => void] {
  const storageKey = `${PREFIX}${key}`

  const read = () => {
    if (typeof window === 'undefined') return false
    try {
      return window.localStorage.getItem(storageKey) === '1'
    } catch {
      return false
    }
  }

  const [acknowledged, setAcknowledged] = useState<boolean>(read)

  // Re-read when the key changes (e.g. the mode loads after first render).
  useEffect(() => {
    setAcknowledged(read())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  const acknowledge = useCallback(() => {
    setAcknowledged(true)
    try {
      window.localStorage.setItem(storageKey, '1')
    } catch {
      /* ignore */
    }
  }, [storageKey])

  return [acknowledged, acknowledge]
}
