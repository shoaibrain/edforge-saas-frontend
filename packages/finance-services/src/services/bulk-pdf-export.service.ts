/**
 * Sprint F.6 — bulk-PDF-export service client.
 *
 * Wraps the F.4 backend endpoint `POST
 * /finance/schools/:schoolId/invoices/bulk-pdf-export` + the F.3 worker
 * job polling at `GET /finance/jobs/:jobId`.
 *
 * Two functions:
 *   1. `bulkInvoicePdfExport(schoolId, dto)` — kicks off the worker.
 *      Returns 202 + `{jobId, message}`. Mints + sends a fresh
 *      `Idempotency-Key` UUID per submission (backend Sprint 0.2 +
 *      MVP.5 sentinel dedupe rapid double-clicks).
 *   2. `getFinanceJob(jobId)` — polls a single job row. Different URL
 *      shape than `getAsyncBulkJob` (the D1-D4 polling endpoint lives
 *      under `/finance/schools/:schoolId/<domain>/jobs/:jobId`; F.3/F.4
 *      jobs live under `/finance/jobs/:jobId` because the backend's
 *      JOB-record lookup is NOT school-scoped — the Sprint D.3 BE
 *      controller resolves the school from the row itself per
 *      404-not-403 enumerability contract).
 *
 * Error envelope from F.4:
 *   202 → `{jobId, message}` — happy path.
 *   400 → Zod validation error (bad body shape).
 *   409 ACTIVE_EXPORT_ALREADY_RUNNING — sentinel collision; the body
 *       carries `runningJobId` so the modal can deep-link to the
 *       in-flight job's status.
 *   413 PAYLOAD_TOO_LARGE — ids above the per-format cap (see
 *       `BULK_PDF_EXPORT_LIMITS`); body carries `{limit, requested}`.
 */

import { apiGet, apiPost } from '@edforge/api-client'

/**
 * Output formats accepted by both bulk-PDF-export endpoints (Sprint H.3/H.4).
 * The merged-PDF cap is lower because pdf-lib holds the concatenated output
 * in memory on the worker — mirror of the backend `BULK_EXPORT_CAPS`.
 */
export type BulkPdfExportFormat = 'zip' | 'merged_pdf'

export const BULK_PDF_EXPORT_LIMITS: Record<BulkPdfExportFormat, number> = {
  zip: 2000,
  merged_pdf: 1000,
}

export interface BulkInvoicePdfExportDto {
  invoiceIds: string[]
  /**
   * Sprint H.4 — both formats supported. Backend F.4 controller enforces
   * the per-format caps in `BULK_PDF_EXPORT_LIMITS` (surfaces as 413).
   */
  format: BulkPdfExportFormat
}

export interface BulkInvoicePdfExportAck {
  jobId: string
  message: string
}

/**
 * F.3 worker job-row shape — read from the Sprint D.3 `GET /finance/jobs/:jobId`
 * endpoint. Mirrors the backend `FinanceJobEntity` projection; the modal
 * watches `status` (transitions to `succeeded` / `failed`) and the
 * format-matching `output` URL (`zipUrl` / `mergedPdfUrl`). Presigned URLs
 * are re-minted by the backend on poll when within 60s of expiry, so a
 * manual refetch after `urlExpiresAt` yields a fresh link.
 */
export interface FinanceJobRow {
  jobId: string
  schoolId: string
  jobType: 'bulk_invoice_generate' | 'bulk_invoice_pdf_export' | 'bulk_receipt_pdf_export'
  status: 'queued' | 'running' | 'succeeded' | 'failed'
  counters: {
    requested: number
    succeeded: number
    failed: number
    skipped: number
  }
  outputFormat?: BulkPdfExportFormat | null
  output?: {
    zipKey?: string
    zipUrl?: string
    /**
     * Sprint H.3 — populated on merged_pdf jobs. Absent when
     * `outputFormat === 'zip'` AND absent for the P2 all-skipped merged
     * case (succeeded=0 + skipped=N → markCompleted without an artifact).
     * Consumers MUST guard for undefined before rendering a download link.
     */
    mergedPdfKey?: string
    mergedPdfUrl?: string
    urlExpiresAt?: string
  }
  failedInvoiceIds?: string[]
  errors?: Array<{ at: string; message: string }>
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export async function bulkInvoicePdfExport(
  schoolId: string,
  dto: BulkInvoicePdfExportDto,
): Promise<BulkInvoicePdfExportAck> {
  return apiPost<BulkInvoicePdfExportAck, BulkInvoicePdfExportDto>(
    `/finance/schools/${schoolId}/invoices/bulk-pdf-export`,
    dto,
    {
      headers: {
        'Idempotency-Key': crypto.randomUUID(),
      },
    },
  )
}

export async function getFinanceJob(jobId: string): Promise<FinanceJobRow> {
  return apiGet<FinanceJobRow>(`/finance/jobs/${jobId}`)
}

// ============================================================================
// Sprint G.3/G.4 — bulk RECEIPT PDF export
// ============================================================================

/**
 * Sprint G.3 request body for `POST /finance/schools/:schoolId/payments/bulk-pdf-export`.
 * Mirror of `BulkInvoicePdfExportDto` with `paymentIds` instead of `invoiceIds`.
 */
export interface BulkReceiptPdfExportDto {
  paymentIds: string[]
  /** Sprint H.4 — see BulkInvoicePdfExportDto.format for cap details. */
  format: BulkPdfExportFormat
}

/**
 * 202 ack from the Sprint G.3 endpoint. Same shape as the invoice ack —
 * only jobType on the resulting FinanceJob differs.
 */
export type BulkReceiptPdfExportAck = BulkInvoicePdfExportAck

export async function bulkReceiptPdfExport(
  schoolId: string,
  dto: BulkReceiptPdfExportDto,
): Promise<BulkReceiptPdfExportAck> {
  return apiPost<BulkReceiptPdfExportAck, BulkReceiptPdfExportDto>(
    `/finance/schools/${schoolId}/payments/bulk-pdf-export`,
    dto,
    {
      headers: {
        'Idempotency-Key': crypto.randomUUID(),
      },
    },
  )
}
