import { useSyncExternalStore } from 'react'

/**
 * useScrollY — single rAF-throttled scroll position shared across every
 * landing-v2 subscriber.
 *
 * One window scroll listener total, regardless of how many components call
 * this hook. Each scroll event enqueues one rAF; updates are published to
 * all subscribers via React's useSyncExternalStore.
 *
 * Returns 0 during SSR / before hydration.
 */

let scrollY = 0
let rafHandle = 0
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((fn) => fn())
}

function onScroll() {
  if (rafHandle) return
  rafHandle = requestAnimationFrame(() => {
    scrollY = window.scrollY
    rafHandle = 0
    notify()
  })
}

function subscribe(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => {}
  }
  if (listeners.size === 0) {
    scrollY = window.scrollY
    window.addEventListener('scroll', onScroll, { passive: true })
  }
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      window.removeEventListener('scroll', onScroll)
      if (rafHandle) {
        cancelAnimationFrame(rafHandle)
        rafHandle = 0
      }
    }
  }
}

function getSnapshot() {
  return scrollY
}

function getServerSnapshot() {
  return 0
}

export function useScrollY(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** Internals exposed for tests. Do not use in product code. */
export const __internal = {
  reset() {
    listeners.clear()
    scrollY = 0
    if (rafHandle) cancelAnimationFrame(rafHandle)
    rafHandle = 0
  },
  listenerCount() {
    return listeners.size
  },
}
