/**
 * useBreakpoint — synchronous-first-paint breakpoint hook.
 *
 * The load-bearing behavior: the FIRST render already returns the correct
 * breakpoint (no desktop-chrome flash on phones, unlike useMediaQuery which
 * initializes to false), and boundary changes at 640/1024 re-render.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBreakpoint, useIsPhone } from './useBreakpoint'

type Listener = (e: { matches: boolean }) => void

function installMatchMedia(initialWidth: number) {
  let width = initialWidth
  const listeners = new Map<string, Set<Listener>>()

  const queryMatches = (query: string): boolean => {
    const m = query.match(/min-width:\s*(\d+)px/)
    return m ? width >= Number(m[1]) : false
  }

  window.matchMedia = vi.fn((query: string) => ({
    get matches() {
      return queryMatches(query)
    },
    media: query,
    addEventListener: (_: 'change', cb: Listener) => {
      if (!listeners.has(query)) listeners.set(query, new Set())
      listeners.get(query)!.add(cb)
    },
    removeEventListener: (_: 'change', cb: Listener) => {
      listeners.get(query)?.delete(cb)
    },
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia

  return {
    setWidth(next: number) {
      width = next
      for (const [query, set] of listeners) {
        for (const cb of set) cb({ matches: queryMatches(query) })
      }
    },
  }
}

describe('useBreakpoint', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it.each([
    [320, 'phone'],
    [639, 'phone'],
    [640, 'tablet'],
    [1023, 'tablet'],
    [1024, 'desktop'],
    [1512, 'desktop'],
  ] as const)('width %ipx → %s on the FIRST render (no flash)', (width, expected) => {
    installMatchMedia(width)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current).toBe(expected)
  })

  it('re-renders across the 640 and 1024 boundaries', () => {
    const mm = installMatchMedia(375)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current).toBe('phone')

    act(() => mm.setWidth(768))
    expect(result.current).toBe('tablet')

    act(() => mm.setWidth(1280))
    expect(result.current).toBe('desktop')

    act(() => mm.setWidth(500))
    expect(result.current).toBe('phone')
  })

  it('useIsPhone tracks the phone breakpoint only', () => {
    const mm = installMatchMedia(375)
    const { result } = renderHook(() => useIsPhone())
    expect(result.current).toBe(true)

    act(() => mm.setWidth(800))
    expect(result.current).toBe(false)
  })
})
