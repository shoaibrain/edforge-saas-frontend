/**
 * useFinanceJob — TanStack Query polling hook for the async finance job
 * framework introduced in Sprint D (backend D.1-D.4). Mirrors the IEMIS
 * pattern (`useIemisImportJob`): poll every 2s while the job is queued or
 * running, stop on terminal status (`succeeded` | `failed`).
 *
 * On terminal `succeeded`, invalidates `paymentKeys.invoices(schoolId)` so
 * the operator-visible invoice list refetches and any rows that the worker
 * just wrote become visible without a manual refresh. The schoolId for the
 * invalidation has to be passed in by the caller — the job row itself
 * carries one, but at the moment the operator clicks "View invoices" we
 * want to invalidate the cache scoped to the *active* school, which the
 * caller knows in form/wizard context.
 *
 * Query key uses the `financeJobKeys` factory below so external invalidators
 * (e.g. a global retry button) can target every finance job at once via
 * `financeJobKeys.all`.
 */

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getFinanceJob, type FinanceJob } from '../services/jobs.service'
import { paymentKeys } from './usePayments'

export const financeJobKeys = {
  all: ['finance-jobs'] as const,
  detail: (jobId: string | undefined) =>
    [...financeJobKeys.all, jobId ?? ''] as const,
}

export interface UseFinanceJobOptions {
  /** Defaults to true. Pass `false` to gate the query off (e.g. before submit). */
  enabled?: boolean
  /**
   * The school the polling caller cares about. When the job transitions to
   * `succeeded`, this is the schoolId whose invoice list cache will be
   * invalidated. If omitted, no invalidation fires — useful for read-only
   * status views where the caller does not own an invoice list.
   */
  schoolId?: string
}

export function useFinanceJob(
  jobId: string | undefined,
  options?: UseFinanceJobOptions,
) {
  const queryClient = useQueryClient()
  const isEnabled = options?.enabled !== false && !!jobId

  const query = useQuery<FinanceJob, Error>({
    queryKey: financeJobKeys.detail(jobId),
    queryFn: () => getFinanceJob(jobId as string),
    enabled: isEnabled,
    refetchInterval: (q) => {
      const status = q.state.data?.status
      return status === 'succeeded' || status === 'failed' ? false : 2000
    },
    refetchIntervalInBackground: false,
    staleTime: 0,
    gcTime: 60_000,
    /**
     * Address PR #240 review (P2): the BE intentionally returns a bare 404
     * for a missing OR cross-school job (non-enumerability contract from
     * D.3). Without an explicit retry policy this hook would inherit the
     * shell QueryClient's default `retry: 1` and re-poll the same 404 once
     * before giving up — wasted RTT, noisy logs, and (in a polling loop)
     * doubled DDB read pressure. We skip retry on 404 specifically; keep
     * the shell's retry-once on genuine transient errors (network, 5xx).
     */
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 404) return false
      return failureCount < 1
    },
  })

  // Invalidate the invoice list cache exactly once when the job reaches
  // `succeeded`. Done via `useEffect` rather than the IEMIS-style `select`
  // side-effect because `select` re-runs on every cache subscription,
  // including unrelated components mounting/unmounting — that fires the
  // invalidation N times and on `succeeded` causes a refetch storm.
  useEffect(() => {
    if (query.data?.status === 'succeeded' && options?.schoolId) {
      queryClient.invalidateQueries({
        queryKey: paymentKeys.invoices(options.schoolId),
      })
    }
  }, [query.data?.status, options?.schoolId, queryClient])

  return query
}
