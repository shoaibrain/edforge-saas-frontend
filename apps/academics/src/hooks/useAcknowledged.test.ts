import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAcknowledged } from './useAcknowledged'

describe('useAcknowledged', () => {
  beforeEach(() => window.localStorage.clear())

  it('starts un-acknowledged, then acknowledges and persists', () => {
    const { result } = renderHook(() => useAcknowledged('test.key'))
    expect(result.current[0]).toBe(false)
    act(() => result.current[1]())
    expect(result.current[0]).toBe(true)
    expect(window.localStorage.getItem('edforge.ack.test.key')).toBe('1')
  })

  it('reads a previously-persisted acknowledgement on mount', () => {
    window.localStorage.setItem('edforge.ack.seen.key', '1')
    const { result } = renderHook(() => useAcknowledged('seen.key'))
    expect(result.current[0]).toBe(true)
  })

  it('re-syncs when the key changes (e.g. the mode loads after first render)', () => {
    window.localStorage.setItem('edforge.ack.mode.daily_presence', '1')
    const { result, rerender } = renderHook(({ k }) => useAcknowledged(k), {
      initialProps: { k: 'mode.pending' },
    })
    expect(result.current[0]).toBe(false)
    rerender({ k: 'mode.daily_presence' })
    expect(result.current[0]).toBe(true)
  })
})
