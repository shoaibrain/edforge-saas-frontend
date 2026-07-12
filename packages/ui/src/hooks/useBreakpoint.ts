import { useSyncExternalStore } from 'react'

/**
 * Canonical shell breakpoints: phone < 640px, tablet 640–1023px,
 * desktop ≥ 1024px (matches the Tailwind sm/lg scale).
 */
export type Breakpoint = 'phone' | 'tablet' | 'desktop'

const SM_QUERY = '(min-width: 640px)'
const LG_QUERY = '(min-width: 1024px)'

function subscribe(callback: () => void): () => void {
  const sm = window.matchMedia(SM_QUERY)
  const lg = window.matchMedia(LG_QUERY)
  sm.addEventListener('change', callback)
  lg.addEventListener('change', callback)
  return () => {
    sm.removeEventListener('change', callback)
    lg.removeEventListener('change', callback)
  }
}

function getSnapshot(): Breakpoint {
  if (window.matchMedia(LG_QUERY).matches) return 'desktop'
  if (window.matchMedia(SM_QUERY).matches) return 'tablet'
  return 'phone'
}

function getServerSnapshot(): Breakpoint {
  return 'desktop'
}

/**
 * Returns the current breakpoint, read synchronously on first render.
 *
 * Unlike `useMediaQuery` (which initializes to `false` and corrects itself in
 * an effect), this never paints one frame of the wrong chrome — components
 * that swap whole chrome trees per breakpoint (Header, Sidebar, tab bar)
 * must use this hook.
 */
export function useBreakpoint(): Breakpoint {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function useIsPhone(): boolean {
  return useBreakpoint() === 'phone'
}
