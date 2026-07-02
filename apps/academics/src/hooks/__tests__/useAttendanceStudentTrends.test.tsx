/**
 * Tests for `useAttendanceStudentTrends` (Sprint 2, ATT-TREND-2.2): the batch
 * roster-sparkline hook. Asserts it (a) is disabled for an empty page, and
 * (b) calls the service with SORTED ids so the query key is stable regardless
 * of row order.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('../../services/academics.service', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return { ...actual, getAttendanceStudentTrends: vi.fn() }
})

import { getAttendanceStudentTrends } from '../../services/academics.service'
import { useAttendanceStudentTrends } from '../useAttendance'

const mock = getAttendanceStudentTrends as unknown as ReturnType<typeof vi.fn>

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

const WINDOW = { startDate: '2026-05-11', endDate: '2026-06-09' }

describe('useAttendanceStudentTrends', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not fetch when the visible page is empty', () => {
    renderHook(
      () => useAttendanceStudentTrends({ schoolId: 's1', studentIds: [], ...WINDOW }),
      { wrapper: makeWrapper() },
    )
    expect(mock).not.toHaveBeenCalled()
  })

  it('does not fetch without a schoolId', () => {
    renderHook(
      () => useAttendanceStudentTrends({ schoolId: '', studentIds: ['a'], ...WINDOW }),
      { wrapper: makeWrapper() },
    )
    expect(mock).not.toHaveBeenCalled()
  })

  it('fetches with sorted studentIds (stable key) when the page is non-empty', async () => {
    mock.mockResolvedValue({ a: { rate: 90, series: [90, 95], trend: 'stable', totalDays: 2, absentDays: 0 } })
    renderHook(
      () => useAttendanceStudentTrends({ schoolId: 's1', studentIds: ['c', 'a', 'b'], ...WINDOW }),
      { wrapper: makeWrapper() },
    )
    await waitFor(() => expect(mock).toHaveBeenCalled())
    // The hook forwards react-query's abort signal (cancels superseded fetches).
    expect(mock).toHaveBeenCalledWith('s1', ['a', 'b', 'c'], WINDOW.startDate, WINDOW.endDate, expect.any(AbortSignal))
  })
})
