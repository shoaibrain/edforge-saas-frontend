import { useEffect, useState } from 'react'

/**
 * useReducedMotion — reflects `prefers-reduced-motion: reduce`.
 *
 * Returns true when the user has explicitly requested reduced motion at the
 * OS level. Sections that run scroll-driven transforms, autoplay video, or
 * large entrance animations should consult this and suppress those effects.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return reduced
}
