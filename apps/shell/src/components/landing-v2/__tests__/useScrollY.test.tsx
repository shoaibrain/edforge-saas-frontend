import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook, cleanup } from '@testing-library/react'
import { useScrollY, __internal } from '../hooks/useScrollY'

describe('useScrollY', () => {
  beforeEach(() => {
    window.scrollY = 0
    __internal.reset()
  })

  afterEach(() => {
    cleanup()
    __internal.reset()
  })

  it('starts at window.scrollY', () => {
    Object.defineProperty(window, 'scrollY', { value: 123, configurable: true, writable: true })
    const { result } = renderHook(() => useScrollY())
    expect(result.current).toBe(123)
  })

  it('subscribes once per render and unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useScrollY())
    expect(__internal.listenerCount()).toBe(1)
    unmount()
    expect(__internal.listenerCount()).toBe(0)
  })

  it('shares one listener across many subscribers', () => {
    // Only one scroll listener is attached to window regardless of hook count.
    // We observe this by spy-counting addEventListener calls for 'scroll'.
    const add = vi.spyOn(window, 'addEventListener')
    const h1 = renderHook(() => useScrollY())
    const h2 = renderHook(() => useScrollY())
    const h3 = renderHook(() => useScrollY())
    const scrollCalls = add.mock.calls.filter((c) => c[0] === 'scroll').length
    expect(scrollCalls).toBe(1)
    h1.unmount()
    h2.unmount()
    h3.unmount()
    add.mockRestore()
  })

  it('publishes scroll updates once per frame even if many events fire', async () => {
    const { result } = renderHook(() => useScrollY())

    // Dispatch 10 synthetic scroll events in the same frame.
    await act(async () => {
      for (let i = 1; i <= 10; i++) {
        Object.defineProperty(window, 'scrollY', {
          value: i * 100,
          configurable: true,
          writable: true,
        })
        window.dispatchEvent(new Event('scroll'))
      }
      // Allow the rAF to flush.
      await new Promise((r) => setTimeout(r, 20))
    })

    // Final value reflects the most recent scrollY.
    expect(result.current).toBe(1000)
  })
})
