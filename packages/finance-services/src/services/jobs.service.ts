/**
 * Finance jobs service — Sprint D.5
 *
 * Read-side client for the async finance job framework introduced in
 * Sprint D (backend D.1-D.4). The bulk-generate / bulk-pdf-export endpoints
 * return 202 + jobId; consumers poll `GET /finance/jobs/{jobId}` via
 * `useFinanceJob(jobId)` until the row reaches a terminal status.
 *
 * Backend contract source: docs plan §2 #4 (FinanceJob entity shape) and
 * §3 Sprint D.3 (GET endpoint). The job's `schoolId` scope is enforced
 * server-side as a **404, not 403**, on cross-school access — jobIds are
 * deliberately not enumerable across schools.
 */

import { apiGet } from '@edforge/api-client'

export type FinanceJobStatus = 'queued' | 'running' | 'succeeded' | 'failed'

export type FinanceJobType =
  | 'bulk_invoice_generate'
  | 'bulk_invoice_pdf_export'
  | 'bulk_receipt_pdf_export'

export type FinanceJobOutputFormat = 'zip' | 'merged_pdf'

export interface FinanceJobCounters {
  requested: number
  processed: number
  succeeded: number
  failed: number
  skipped: number
}

export interface FinanceJobOutput {
  zipKey?: string
  mergedPdfKey?: string
  zipUrl?: string
  mergedPdfUrl?: string
  urlExpiresAt?: string
}

export interface FinanceJobErrorEntry {
  at: string
  message: string
}

export interface FinanceJob {
  jobId: string
  tenantId: string
  schoolId: string
  operatorId: string
  jobType: FinanceJobType
  status: FinanceJobStatus
  counters: FinanceJobCounters
  outputFormat?: FinanceJobOutputFormat | null
  output?: FinanceJobOutput
  failedStudentIds: string[]
  errors: FinanceJobErrorEntry[]
  createdAt: string
  updatedAt: string
  startedAt?: string
  completedAt?: string
}

/**
 * Fetch a single finance job by id. Returns 404 if the job is missing OR
 * belongs to a school outside the caller's scope — do not retry on 404 in
 * the polling layer.
 */
export async function getFinanceJob(jobId: string): Promise<FinanceJob> {
  return apiGet<FinanceJob>(`/finance/jobs/${jobId}`)
}
