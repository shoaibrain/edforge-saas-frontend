/**
 * Mutation + polling hooks for the four D1–D4 async-bulk-job endpoints.
 *
 * The pattern (one per endpoint):
 *
 *   const start = useBulkSendReceipts(schoolId)
 *   const [jobId, setJobId] = useState<string | null>(null)
 *   const job = useAsyncBulkJob(schoolId, 'payments', jobId)
 *
 *   await start.mutateAsync({ paymentIds, channel: 'email' })
 *     .then(ack => setJobId(ack.jobId))
 *
 *   // job.data.status drives the drawer UI;
 *   // when status === 'succeeded' | 'failed', the polling stops.
 *
 * Mirrors `useIemisImportJob` (apps/academics/src/hooks/useStudents.ts) —
 * polls every 2s while queued|running, stops on terminal, invalidates
 * the relevant list query on terminal-succeeded via the select fn.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  bulkSendReceipts,
  bulkSendInvoiceReminders,
  bulkSendStatements,
  bulkAdjustBalances,
  getAsyncBulkJob,
  type AsyncJobDomain,
} from '../services/async-bulk-jobs.service'
import type {
  AsyncBulkJobResult,
  BulkAdjustBalanceDto,
  BulkSendReceiptDto,
  BulkSendReminderDto,
  BulkSendStatementDto,
} from '../types/async-jobs'
import { paymentKeys } from './usePayments'

/** Polling key. Domain is part of the key so two simultaneous jobs of
 *  different shapes (e.g. an invoice reminder + a payment receipt batch)
 *  don't collide in the React Query cache. */
function bulkJobKey(schoolId: string, domain: AsyncJobDomain, jobId: string) {
  return ['finance-bulk-job', schoolId, domain, jobId] as const
}

/**
 * Polling query for an in-flight or terminal D1–D4 job.
 *
 * Returns React Query state — caller pulls `.data.status` to drive UI
 * and `.data.succeeded / .failed / .skipped` for the aggregate toast
 * once status reaches a terminal value.
 *
 * Pass `jobId === null/undefined` to disable the poll (the standard
 * gate while the kickoff mutation is still pending).
 *
 * On terminal-succeeded the select fn invalidates the broad
 * `paymentKeys.all` so list views (Payments, Invoices, Student Accounts)
 * re-fetch and show the new state (e.g. balance after D4 adjust).
 */
export function useAsyncBulkJob(
  schoolId: string,
  domain: AsyncJobDomain,
  jobId: string | null | undefined,
) {
  const queryClient = useQueryClient()
  return useQuery<AsyncBulkJobResult, Error>({
    queryKey: bulkJobKey(schoolId, domain, jobId ?? ''),
    queryFn: () => getAsyncBulkJob(schoolId, domain, jobId as string),
    enabled: !!jobId && !!schoolId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'succeeded' || status === 'failed' ? false : 2000
    },
    refetchIntervalInBackground: false,
    staleTime: 0,
    gcTime: 60_000,
    select: (data) => {
      if (data.status === 'succeeded') {
        queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      }
      return data
    },
  })
}

// ============================================================================
// Kickoff mutations (one per endpoint)
// ============================================================================

export function useBulkSendReceipts(schoolId: string) {
  return useMutation({
    mutationFn: (data: BulkSendReceiptDto) => bulkSendReceipts(schoolId, data),
  })
}

export function useBulkSendInvoiceReminders(schoolId: string) {
  return useMutation({
    mutationFn: (data: BulkSendReminderDto) =>
      bulkSendInvoiceReminders(schoolId, data),
  })
}

export function useBulkSendStatements(schoolId: string) {
  return useMutation({
    mutationFn: (data: BulkSendStatementDto) => bulkSendStatements(schoolId, data),
  })
}

export function useBulkAdjustBalances(schoolId: string) {
  return useMutation({
    mutationFn: (data: BulkAdjustBalanceDto) => bulkAdjustBalances(schoolId, data),
  })
}
