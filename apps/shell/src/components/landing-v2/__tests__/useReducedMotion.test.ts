import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, cleanup } from '@testing-library/react'
import { useReducedMotion } from '../hooks/useReducedMotion'

type MatchMediaMock = {
  matches: boolean
  media: string
  onchange: null
  addListener: () => void
  removeListener: () => void
  addEventListener: (event: string, handler: (e: MediaQueryListEvent) => void) => void
  removeEventListener: (event: string, handler: (e: MediaQueryListEvent) => void) => void
  dispatchEvent: () => boolean
}

function makeMatchMedia(matches: boolean) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = []
  const mq: MatchMediaMock = {
    matches,
    media: '',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: (_e, h) => listeners.push(h),
    removeEventListener: (_e, h) => {
      const i = listeners.indexOf(h)
      if (i >= 0) listeners.splice(i, 1)
    },
    dispatchEvent: () => false,
  }
  return {
    mq,
    fire: (newMatches: boolean) => {
      mq.matches = newMatches
      for (const h of listeners) h({ matches: newMatches } as MediaQueryListEvent)
    },
  }
}

describe('useReducedMotion', () => {
  const originalMM = window.matchMedia

  afterEach(() => {
    cleanup()
    window.matchMedia = originalMM
  })

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns false when prefers-reduced-motion is NOT set', () => {
    const { mq } = makeMatchMedia(false)
    window.matchMedia = vi.fn().mockReturnValue(mq) as unknown as typeof window.matchMedia
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })

  it('returns true when prefers-reduced-motion IS set', () => {
    const { mq } = makeMatchMedia(true)
    window.matchMedia = vi.fn().mockReturnValue(mq) as unknown as typeof window.matchMedia
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })
})
