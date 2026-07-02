/**
 * Pure helpers behind the bulk-PDF-export drawer: preflight manifest
 * aggregation, bundle estimates, filenames, and format-aware job-output
 * resolution. No React — unit-tested directly.
 */

import type { BulkPdfExportFormat, FinanceJobRow } from '@edforge/finance-services'

export type ExportDocType = 'invoice' | 'receipt'

/** Normalized row shape both drawers map their domain rows into. */
export interface ExportRowSummary {
  id: string
  /** Human number (invoiceNumber / receiptNumber) used for filenames. */
  number: string
  studentName?: string
  status: string
  /** grandTotal for invoices, amount for receipts. */
  amount: number
  gradeLevel?: string
}

export interface ExportManifest {
  /** Every selected row (the request payload — server owns skipping). */
  rows: ExportRowSummary[]
  byStatus: Array<{ status: string; count: number }>
  /** Distinct student names (0 when rows carry none). */
  studentCount: number
  /** Distinct grade levels, sorted, when rows carry them. */
  grades: string[]
  totalValue: number
  /** Rows the worker will skip (cancelled invoices / non-completed payments). */
  skippedCount: number
}

/** Rows the backend worker skips rather than renders. */
export function willBeSkipped(row: ExportRowSummary, docType: ExportDocType): boolean {
  return docType === 'invoice' ? row.status === 'cancelled' : row.status !== 'completed'
}

export function buildExportManifest(
  rows: ExportRowSummary[],
  docType: ExportDocType
): ExportManifest {
  const byStatusMap = new Map<string, number>()
  const students = new Set<string>()
  const grades = new Set<string>()
  let totalValue = 0
  let skippedCount = 0

  for (const row of rows) {
    byStatusMap.set(row.status, (byStatusMap.get(row.status) ?? 0) + 1)
    if (row.studentName) students.add(row.studentName)
    if (row.gradeLevel) grades.add(row.gradeLevel)
    totalValue += row.amount
    if (willBeSkipped(row, docType)) skippedCount += 1
  }

  return {
    rows,
    byStatus: [...byStatusMap.entries()].map(([status, count]) => ({ status, count })),
    studentCount: students.size,
    grades: [...grades].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    ),
    totalValue,
    skippedCount,
  }
}

// Worker throughput approximations for the preflight estimate — mirrors
// the prototype's numbers; an estimate label, not a promise.
const EST_BYTES_PER_PDF = 94 * 1024
const EST_SEC_PER_PDF = 0.9

export function estimateBundle(count: number): { bytes: number; seconds: number } {
  return {
    bytes: count * EST_BYTES_PER_PDF,
    seconds: Math.max(4, Math.round(count * EST_SEC_PER_PDF)),
  }
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function fileNameFor(row: ExportRowSummary): string {
  return `${row.number}.pdf`
}

export function bundleNameFor(docType: ExportDocType, format: BulkPdfExportFormat): string {
  const stem = docType === 'invoice' ? 'invoices' : 'receipts'
  return format === 'merged_pdf' ? `${stem}.pdf` : `${stem}.zip`
}

/**
 * The download URL matching the job's output format. Jobs from before the
 * merged-PDF rollout have `outputFormat` null — those are ZIPs.
 */
export function outputUrlFor(job: FinanceJobRow): string | undefined {
  return job.outputFormat === 'merged_pdf' ? job.output?.mergedPdfUrl : job.output?.zipUrl
}

/**
 * Failed document ids, read defensively: the row field is invoice-named
 * but the G.3 receipt worker writes payment ids into the same field.
 */
export function failedIdsOf(job: FinanceJobRow): string[] {
  return job.failedInvoiceIds ?? []
}
