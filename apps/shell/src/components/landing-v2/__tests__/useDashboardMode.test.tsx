import { describe, it, expect, afterEach, vi } from 'vitest'
import { renderHook, cleanup } from '@testing-library/react'
import { useDashboardMode } from '../hooks/useDashboardMode'

function setSearch(search: string) {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, search, pathname: '/', hash: '' },
  })
}

describe('useDashboardMode', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    setSearch('')
  })

  it('returns false when no `mode` search param is present', () => {
    setSearch('')
    const { result } = renderHook(() => useDashboardMode())
    expect(result.current).toBe(false)
  })

  it('returns false when `mode` is set to something else', () => {
    setSearch('?mode=video')
    const { result } = renderHook(() => useDashboardMode())
    expect(result.current).toBe(false)
  })

  it('returns true when `?mode=dashboard` is present', () => {
    setSearch('?mode=dashboard')
    const { result } = renderHook(() => useDashboardMode())
    expect(result.current).toBe(true)
  })

  it('survives a malformed search string', () => {
    setSearch('?;;;')
    const { result } = renderHook(() => useDashboardMode())
    expect(result.current).toBe(false)
  })
})
