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
 *   413 PAYLOAD_TOO_LARGE — invoiceIds > 2000; body carries
 *       `{limit: 2000, requested: N}`.
 *   501 FORMAT_NOT_SUPPORTED — `format='merged_pdf'` (deferred to H.3).
 */

import { apiGet, apiPost } from '@edforge/api-client'

export interface BulkInvoicePdfExportDto {
  invoiceIds: string[]
  format: 'zip' // 'merged_pdf' enables in Sprint H.3
}

export interface BulkInvoicePdfExportAck {
  jobId: string
  message: string
}

/**
 * F.3 worker job-row shape — read from the Sprint D.3 `GET /finance/jobs/:jobId`
 * endpoint. Mirrors the backend `FinanceJobEntity` projection; the modal
 * watches `status` (transitions to `succeeded` / `failed`) and `output.zipUrl`.
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
  outputFormat?: 'zip' | 'merged_pdf' | null
  output?: {
    zipKey?: string
    zipUrl?: string
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
