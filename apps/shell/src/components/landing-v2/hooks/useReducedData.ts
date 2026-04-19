import { useEffect, useState } from 'react'

type NetworkInformation = { saveData?: boolean }

/**
 * useReducedData — reflects data-saving preferences.
 *
 * True when either the standard `prefers-reduced-data: reduce` media query
 * matches OR the non-standard but widely-supported
 * `navigator.connection.saveData` flag is set (e.g. user enabled Data Saver
 * mode in Chrome/Edge).
 *
 * Sections that autoplay video should suppress it and show a poster
 * fallback instead.
 */
export function useReducedData(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const mq = window.matchMedia('(prefers-reduced-data: reduce)')
    if (mq.matches) return true
    const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection
    return conn?.saveData === true
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-data: reduce)')
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return reduced
}
