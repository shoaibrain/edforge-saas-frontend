/**
 * Sprint F.6 — useBulkInvoicePdfExport hook.
 *
 * Mutation wrapper around the F.4 backend `POST
 * /finance/schools/:schoolId/invoices/bulk-pdf-export` endpoint.
 *
 * The mutation returns the 202 ack `{jobId, message}`. The caller
 * (typically a JobProgressModal in F.5) then passes the jobId to
 * `useFinanceJob(jobId)` for polling.
 *
 * Error envelope from F.4 (per server controller D7 decision):
 *   - 409 ACTIVE_EXPORT_ALREADY_RUNNING — body.runningJobId is the
 *     existing job; caller can use it to switch the modal to "show
 *     the in-flight job's progress" instead of starting a new one.
 *   - 413 PAYLOAD_TOO_LARGE — body.{limit, requested}; caller can
 *     translate to a toast with the operator-facing message.
 *   - 501 FORMAT_NOT_SUPPORTED — only fires if F.5 wires up
 *     'merged_pdf' (deferred to H.3); the F.5 menu should hide it.
 *
 * Per `feedback_react_query_no_polling_for_event_driven_data` memory,
 * this mutation does NOT invalidate any queries on success — the
 * subsequent `useFinanceJob(jobId)` polling handles the lifecycle.
 */

import { useMutation } from '@tanstack/react-query'
import {
  bulkInvoicePdfExport,
  type BulkInvoicePdfExportAck,
  type BulkInvoicePdfExportDto,
} from '../services/bulk-pdf-export.service'

export function useBulkInvoicePdfExport(schoolId: string) {
  return useMutation<BulkInvoicePdfExportAck, Error, BulkInvoicePdfExportDto>({
    mutationFn: (dto) => bulkInvoicePdfExport(schoolId, dto),
  })
}
