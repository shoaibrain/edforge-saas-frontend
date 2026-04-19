import { useEffect, type ReactNode } from 'react'

/**
 * LandingRoot — sets `data-surface="landing"` on the document element on mount
 * and clears it on unmount, activating the landing-v2 token scope defined in
 * packages/theme/src/landing-tokens.css.
 *
 * Wrap every landing-v2 route in this component. Nothing else should set
 * data-surface="landing".
 */
export function LandingRoot({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement
    const previous = root.dataset.surface
    root.dataset.surface = 'landing'
    return () => {
      if (previous === undefined) {
        delete root.dataset.surface
      } else {
        root.dataset.surface = previous
      }
    }
  }, [])

  return <main id="lp-main">{children}</main>
}
