import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

/**
 * Sprint D.5 — Route-shape + polling-behavior guard for `useFinanceJob`.
 *
 * Pins the contract documented in the plan §3 Sprint D.3:
 *   GET /finance/jobs/{jobId}   — bare path, no query params; 404 on missing OR cross-school.
 *
 * The route-shape half (no MFE rewrites the URL or smuggles a schoolId
 * query param onto the call) is the same trap that the
 * `payments-service-routes.test.ts` and `grade-filter-routes.test.ts` files
 * exist to catch — a frontend that silently invents a different REST path
 * collapses at runtime to a 403 SigV4 (API GW falls through to IAM auth)
 * or a 404 (rproxy misses) without any local typecheck signal.
 *
 * The polling half pins the IEMIS-pattern lifecycle: refetch every 2s while
 * the job is `queued`/`running`, STOP on `succeeded`/`failed`. A regression
 * here would either hammer the backend forever (no terminal stop) or stall
 * the operator's wizard UX (premature stop).
 */

vi.mock('@edforge/api-client', () => ({
  apiGet: vi.fn(),
}))

import { apiGet } from '@edforge/api-client'
import { getFinanceJob, type FinanceJob } from '../services/jobs.service'
import { financeJobKeys, useFinanceJob } from '../hooks/useFinanceJob'
import { paymentKeys } from '../hooks/usePayments'

const mockApiGet = vi.mocked(apiGet)

const JOB_ID = 'job-123'
const SCHOOL_ID = 'sch-1'

function buildJob(overrides: Partial<FinanceJob> = {}): FinanceJob {
  return {
    jobId: JOB_ID,
    tenantId: 'tenant-1',
    schoolId: SCHOOL_ID,
    operatorId: 'op-1',
    jobType: 'bulk_invoice_generate',
    status: 'running',
    counters: {
      requested: 100,
      processed: 25,
      succeeded: 24,
      failed: 1,
      skipped: 0,
    },
    failedStudentIds: [],
    errors: [],
    createdAt: '2026-06-28T10:00:00Z',
    updatedAt: '2026-06-28T10:00:30Z',
    ...overrides,
  }
}

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children)
  }
}

describe('jobs.service route shape (Sprint D.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiGet.mockResolvedValue(buildJob())
  })

  it('getFinanceJob → GET /finance/jobs/{jobId} (exact path)', async () => {
    await getFinanceJob(JOB_ID)
    expect(mockApiGet).toHaveBeenCalledWith(`/finance/jobs/${JOB_ID}`)
  })

  it('getFinanceJob does NOT pass any query params', async () => {
    await getFinanceJob(JOB_ID)
    // apiGet's second arg is the query-param object. The contract is a
    // bare path GET — no `schoolId` smuggling, no `t=now` cache buster.
    expect(mockApiGet.mock.calls[0]).toHaveLength(1)
    expect(mockApiGet.mock.calls[0][1]).toBeUndefined()
  })
})

describe('financeJobKeys factory (Sprint D.5)', () => {
  it('exposes a stable `all` segment and a detail(jobId) tuple', () => {
    expect(financeJobKeys.all).toEqual(['finance-jobs'])
    expect(financeJobKeys.detail(JOB_ID)).toEqual(['finance-jobs', JOB_ID])
  })
})

describe('useFinanceJob (Sprint D.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('seeds the cache under financeJobKeys.detail(jobId)', async () => {
    mockApiGet.mockResolvedValue(buildJob({ status: 'succeeded' }))
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const { result } = renderHook(() => useFinanceJob(JOB_ID), {
      wrapper: wrapper(client),
    })

    await waitFor(() => expect(result.current.data?.jobId).toBe(JOB_ID))

    const cacheKeys = client
      .getQueryCache()
      .getAll()
      .map((q) => q.queryKey)
    expect(cacheKeys).toContainEqual(['finance-jobs', JOB_ID])
  })

  it('stops polling once status is `succeeded`', async () => {
    mockApiGet.mockResolvedValue(buildJob({ status: 'succeeded' }))
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const { result } = renderHook(() => useFinanceJob(JOB_ID), {
      wrapper: wrapper(client),
    })

    await waitFor(() => expect(result.current.data?.status).toBe('succeeded'))

    const callsAfterTerminal = mockApiGet.mock.calls.length
    // Give the refetch loop ample wall-time to misbehave. Polling cadence
    // is 2s, so 2.6s would cover at least one extra tick if the terminal
    // gate failed.
    await new Promise((resolve) => setTimeout(resolve, 2600))
    expect(mockApiGet.mock.calls.length).toBe(callsAfterTerminal)
  })

  it('stops polling once status is `failed`', async () => {
    mockApiGet.mockResolvedValue(buildJob({ status: 'failed' }))
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const { result } = renderHook(() => useFinanceJob(JOB_ID), {
      wrapper: wrapper(client),
    })

    await waitFor(() => expect(result.current.data?.status).toBe('failed'))

    const callsAfterTerminal = mockApiGet.mock.calls.length
    await new Promise((resolve) => setTimeout(resolve, 2600))
    expect(mockApiGet.mock.calls.length).toBe(callsAfterTerminal)
  })

  it('invalidates paymentKeys.invoices(schoolId) on succeeded', async () => {
    mockApiGet.mockResolvedValue(buildJob({ status: 'succeeded' }))
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(
      () => useFinanceJob(JOB_ID, { schoolId: SCHOOL_ID }),
      { wrapper: wrapper(client) },
    )

    await waitFor(() => expect(result.current.data?.status).toBe('succeeded'))
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: paymentKeys.invoices(SCHOOL_ID),
      })
    })
  })

  it('does NOT invalidate on succeeded when schoolId is omitted', async () => {
    mockApiGet.mockResolvedValue(buildJob({ status: 'succeeded' }))
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(() => useFinanceJob(JOB_ID), {
      wrapper: wrapper(client),
    })

    await waitFor(() => expect(result.current.data?.status).toBe('succeeded'))
    // Give the useEffect a tick.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(invalidateSpy).not.toHaveBeenCalledWith({
      queryKey: paymentKeys.invoices(expect.any(String) as unknown as string),
    })
  })

  it('does NOT invalidate while status is still `running`', async () => {
    mockApiGet.mockResolvedValue(buildJob({ status: 'running' }))
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(
      () => useFinanceJob(JOB_ID, { schoolId: SCHOOL_ID }),
      { wrapper: wrapper(client) },
    )

    await waitFor(() => expect(result.current.data?.status).toBe('running'))
    expect(invalidateSpy).not.toHaveBeenCalledWith({
      queryKey: paymentKeys.invoices(SCHOOL_ID),
    })
  })

  it('is disabled when jobId is undefined', () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    renderHook(() => useFinanceJob(undefined), {
      wrapper: wrapper(client),
    })

    expect(mockApiGet).not.toHaveBeenCalled()
  })

  it('is disabled when options.enabled === false', () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    renderHook(() => useFinanceJob(JOB_ID, { enabled: false }), {
      wrapper: wrapper(client),
    })

    expect(mockApiGet).not.toHaveBeenCalled()
  })
})
