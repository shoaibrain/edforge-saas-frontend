import { useEffect, useRef } from 'react'

/**
 * Fires `callback` at most once per animation frame on scroll.
 * Automatically cleans up on unmount.
 */
export function useThrottledScroll(callback: () => void) {
  const rafId = useRef<number>(0)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    let ticking = false

    const onScroll = () => {
      if (!ticking) {
        ticking = true
        rafId.current = requestAnimationFrame(() => {
          callbackRef.current()
          ticking = false
        })
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    // Fire once on mount to set initial state
    callbackRef.current()

    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId.current)
    }
  }, [])
}
