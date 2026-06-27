import { useEffect, useState } from 'react'

/**
 * True on devices with a precise, hover-capable pointer (mouse / trackpad).
 * Defaults to `true` (assume desktop) for SSR / first paint so the compact
 * hover-reveal status control isn't shown expanded on desktop before hydration.
 * On touch / coarse pointers it resolves to `false`, and callers render the
 * full status set ("always") since there is no hover to reveal it.
 */
export function useHasHover(): boolean {
  const [hasHover, setHasHover] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    setHasHover(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setHasHover(e.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  return hasHover
}
