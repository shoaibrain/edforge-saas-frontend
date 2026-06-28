import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

/**
 * Regression coverage for the retry policy on useAsyncBulkJob.
 *
 * The backend (PR #339 Sprint D.3) intentionally returns 404 for missing
 * OR cross-school jobs — the non-enumerability contract: a caller cannot
 * distinguish "this job doesn't exist" from "this job exists but isn't
 * yours." The shell QueryClient default is retry: 1, so without an
 * explicit override a 404 in the 2s polling loop would double DDB reads
 * and double log noise per missing-job poll.
 *
 * The hook now ships a discriminated retry function: skip retry only on
 * 404, preserve retry-once on genuine 5xx / network errors.
 *
 * Mirrors the regression tests added to the parallel useFinanceJob
 * implementation on the closed PR #240 (commit fff3fec).
 */

vi.mock('../services/async-bulk-jobs.service', async () => {
  const actual = await vi.importActual<
    typeof import('../services/async-bulk-jobs.service')
  >('../services/async-bulk-jobs.service')
  return {
    ...actual,
    getAsyncBulkJob: vi.fn(),
  }
})

import { getAsyncBulkJob } from '../services/async-bulk-jobs.service'
import { useAsyncBulkJob } from '../hooks/useAsyncBulkJob'
import type { AsyncBulkJobResult } from '../types/async-jobs'

const mockGetAsyncBulkJob = vi.mocked(getAsyncBulkJob)

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

function succeededJob(jobId: string): AsyncBulkJobResult {
  return {
    jobId,
    status: 'succeeded',
    totalRecords: 1,
    succeeded: 1,
    failed: 0,
    skipped: 0,
    createdAt: '2026-06-28T00:00:00.000Z',
    updatedAt: '2026-06-28T00:00:01.000Z',
  }
}

function httpError(status: number): Error & { response: { status: number } } {
  const err = new Error(`HTTP ${status}`) as Error & { response: { status: number } }
  err.response = { status }
  return err
}

describe('useAsyncBulkJob — retry policy (PR #339 non-enumerability)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does NOT retry on 404 (BE non-enumerability contract; one request only)', async () => {
    mockGetAsyncBulkJob.mockRejectedValue(httpError(404))

    // Use the shell-default retry: 1 (no override) — the hook MUST short-circuit it.
    const client = new QueryClient({
      defaultOptions: { queries: { retry: 1, retryDelay: 0 } },
    })
    const { result } = renderHook(
      () => useAsyncBulkJob('sch-1', 'payments', 'missing-job'),
      { wrapper: wrapper(client) },
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(mockGetAsyncBulkJob).toHaveBeenCalledTimes(1)
  })

  it('DOES retry once on a transient 5xx (preserves the shell retry-once default)', async () => {
    mockGetAsyncBulkJob
      .mockRejectedValueOnce(httpError(500))
      .mockResolvedValueOnce(succeededJob('job-1'))

    // retryDelay: 0 neutralizes TanStack's default exponential backoff,
    // which would otherwise race the 1s waitFor default.
    const client = new QueryClient({
      defaultOptions: { queries: { retry: 1, retryDelay: 0 } },
    })
    const { result } = renderHook(
      () => useAsyncBulkJob('sch-1', 'payments', 'job-1'),
      { wrapper: wrapper(client) },
    )

    await waitFor(() => {
      expect(result.current.data?.status).toBe('succeeded')
    })

    expect(mockGetAsyncBulkJob).toHaveBeenCalledTimes(2)
  })

  it('does NOT retry indefinitely on repeated transient errors (caps at retry-once)', async () => {
    mockGetAsyncBulkJob.mockRejectedValue(httpError(503))

    const client = new QueryClient({
      defaultOptions: { queries: { retry: 1, retryDelay: 0 } },
    })
    const { result } = renderHook(
      () => useAsyncBulkJob('sch-1', 'payments', 'job-2'),
      { wrapper: wrapper(client) },
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(mockGetAsyncBulkJob).toHaveBeenCalledTimes(2)
  })
})
