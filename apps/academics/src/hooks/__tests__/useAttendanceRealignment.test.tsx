/**
 * Tests for the attendance-realignment hooks: useAttendancePolicy + usePresenceLocks
 * (enabled-gating + service call args) and useExportIemisAttendance (mutation fires
 * the export with the right args).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('../../services/academics.service', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    getAttendancePolicy: vi.fn(),
    getPresenceLocks: vi.fn(),
    exportIemisAttendance: vi.fn(),
  }
})

import {
  getAttendancePolicy,
  getPresenceLocks,
  exportIemisAttendance,
} from '../../services/academics.service'
import { useAttendancePolicy, usePresenceLocks, useExportIemisAttendance } from '../useAttendance'

const policyMock = getAttendancePolicy as unknown as ReturnType<typeof vi.fn>
const locksMock = getPresenceLocks as unknown as ReturnType<typeof vi.fn>
const exportMock = exportIemisAttendance as unknown as ReturnType<typeof vi.fn>

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

describe('useAttendancePolicy', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not fetch without a schoolId', () => {
    renderHook(() => useAttendancePolicy(undefined), { wrapper: makeWrapper() })
    expect(policyMock).not.toHaveBeenCalled()
  })

  it('fetches the policy for a schoolId', async () => {
    policyMock.mockResolvedValue({ schoolId: 's1', effectiveMode: 'daily_presence', modeSource: 'archetype' })
    renderHook(() => useAttendancePolicy('s1'), { wrapper: makeWrapper() })
    await waitFor(() => expect(policyMock).toHaveBeenCalledWith('s1'))
  })
})

describe('usePresenceLocks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not fetch without schoolId+date', () => {
    renderHook(() => usePresenceLocks('s1', undefined), { wrapper: makeWrapper() })
    expect(locksMock).not.toHaveBeenCalled()
  })

  it('fetches locks for schoolId+date', async () => {
    locksMock.mockResolvedValue({ schoolId: 's1', date: '2026-06-15', locks: [] })
    renderHook(() => usePresenceLocks('s1', '2026-06-15'), { wrapper: makeWrapper() })
    await waitFor(() => expect(locksMock).toHaveBeenCalledWith('s1', '2026-06-15'))
  })
})

describe('useExportIemisAttendance', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fires the export with schoolId/yearMonth/academicYearId on mutate', async () => {
    exportMock.mockResolvedValue({ schoolId: 's1', yearMonth: '2026-06', generatedAt: 'x', rowCount: 0, rows: [] })
    const { result } = renderHook(() => useExportIemisAttendance(), { wrapper: makeWrapper() })
    act(() => {
      result.current.mutate({ schoolId: 's1', yearMonth: '2026-06', academicYearId: 'ay-1' })
    })
    await waitFor(() =>
      expect(exportMock).toHaveBeenCalledWith('s1', '2026-06', 'ay-1'),
    )
  })
})
