/**
 * Sprint F.5/F.6 — useFinanceJob hook.
 *
 * Polls a single FinanceJob row via TanStack Query at 2-second cadence
 * until the row hits a terminal status (`succeeded` | `failed`). The
 * caller passes the jobId returned from the F.4 `bulkInvoicePdfExport`
 * ack (or any other Sprint F worker that writes to the
 * `FINANCE_JOB#{jobId}` partition).
 *
 * Polling rationale: per `feedback_react_query_no_polling_for_event_driven_data`
 * memory — refetchInterval is for CLOCK-DRIVEN data, not event-driven.
 * A FinanceJob's counters tick up over wall-clock time as the worker
 * processes invoices, so polling is the right fit here. Do NOT
 * cargo-cult this pattern to "invoice list auto-refresh" or similar
 * user-action data — those use `invalidateQueries` instead.
 *
 * Cache + retry policy mirrors `useAsyncBulkJob` (the sibling polling
 * hook for D1-D4 jobs):
 *   - Empty jobId / falsy schoolId → query disabled.
 *   - 404 → no retry (PR #339 404-not-403 contract; missing == not-yours).
 *   - 5xx / network → retry once.
 */

import { useQuery } from '@tanstack/react-query'
import { getFinanceJob, type FinanceJobRow } from '../services/bulk-pdf-export.service'

/**
 * Query-key factory — kept inline (not exported into the broader
 * paymentKeys tree) because FinanceJob rows aren't part of the
 * payments/invoices/accounts data graph; they're a side-band lookup
 * that only bulk-export drawers poll.
 */
const financeJobKey = (jobId: string) => ['finance-job', jobId] as const

/**
 * Pure polling hook — no side effects.
 *
 * If a caller wants to invalidate sibling queries on terminal (e.g.,
 * refetch the invoices list after a successful bulk export), do it in
 * the caller's own `useEffect` keyed on `job.data?.status`. Putting the
 * invalidate in `select` (as the first draft did) fires on every render
 * because the inline arrow reference changes each render — triggering
 * wasteful downstream refetches on every consumer re-render post-terminal.
 * React Query v5's canonical side-effect surface is `useEffect` in the
 * consumer, not the hook definition.
 */
export function useFinanceJob(jobId: string | null | undefined) {
  return useQuery<FinanceJobRow, Error>({
    queryKey: financeJobKey(jobId ?? ''),
    queryFn: () => getFinanceJob(jobId as string),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'succeeded' || status === 'failed' ? false : 2000
    },
    refetchIntervalInBackground: false,
    staleTime: 0,
    gcTime: 60_000,
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 404) return false
      return failureCount < 1
    },
  })
}
