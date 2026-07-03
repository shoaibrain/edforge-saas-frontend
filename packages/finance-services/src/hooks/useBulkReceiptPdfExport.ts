/**
 * Sprint G.4 — useBulkReceiptPdfExport hook.
 *
 * Mutation wrapper around the Sprint G.3 backend `POST
 * /finance/schools/:schoolId/payments/bulk-pdf-export` endpoint.
 *
 * Mirror of `useBulkInvoicePdfExport` (F.6). Same error envelope semantics:
 *   - 409 ACTIVE_EXPORT_ALREADY_RUNNING — body.runningJobId is the
 *     existing in-flight job (invoice OR receipt — MVP.5 sentinel is
 *     jobType-agnostic per D1+D8, so the pivot works transparently).
 *   - 413 PAYLOAD_TOO_LARGE — body.{limit, requested}; caps are
 *     per-format (`BULK_PDF_EXPORT_LIMITS`).
 *
 * Per `feedback_react_query_no_polling_for_event_driven_data` memory,
 * this mutation does NOT invalidate any queries on success — the
 * subsequent `useFinanceJob(jobId)` polling handles the lifecycle.
 */

import { useMutation } from '@tanstack/react-query'
import {
  bulkReceiptPdfExport,
  type BulkReceiptPdfExportAck,
  type BulkReceiptPdfExportDto,
} from '../services/bulk-pdf-export.service'

export function useBulkReceiptPdfExport(schoolId: string) {
  return useMutation<BulkReceiptPdfExportAck, Error, BulkReceiptPdfExportDto>({
    mutationFn: (dto) => bulkReceiptPdfExport(schoolId, dto),
  })
}
