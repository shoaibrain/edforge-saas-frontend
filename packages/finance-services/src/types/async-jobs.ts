/**
 * Async-job types for the finance D1–D4 framework.
 *
 * Backend repo: claude/finance-d1-d4-async-job-framework (PR #339).
 * Mirrors the established IEMIS-import async pattern (apps/academics →
 * iemis-import.types.ts) but is a separate type tree because finance
 * jobs are per-record dispatch (one input row → one outcome row) rather
 * than the IEMIS file-row shape.
 *
 * All four POST endpoints return AsyncBulkJobAck (202) and clients poll
 * GET /finance/.../jobs/:jobId for the AsyncBulkJobResult terminal row.
 * The result shape is intentionally generic — job-type-specific extra
 * counters (e.g. `delivered` vs `bounced` for sends) live in a typed
 * `meta` bag rather than being part of the canonical envelope.
 */

export type AsyncBulkJobStatus = 'queued' | 'running' | 'succeeded' | 'failed'

/** 202 ack returned synchronously by every D1–D4 POST. */
export interface AsyncBulkJobAck {
  jobId: string
  status: 'queued'
  totalRecords: number
}

export interface AsyncBulkJobFailure {
  recordId: string
  reason: string
}

/**
 * Terminal / polling shape returned by GET /finance/.../jobs/:jobId.
 *
 * `succeeded + failed + skipped === totalRecords` on terminal states.
 * `failures[]` is capped server-side (typically 50) to keep responses
 * small; UI should never assume failures.length === failed.
 */
export interface AsyncBulkJobResult {
  jobId: string
  status: AsyncBulkJobStatus
  totalRecords: number
  succeeded: number
  failed: number
  skipped: number
  failures?: AsyncBulkJobFailure[]
  startedAt?: string
  completedAt?: string
  durationMs?: number
  /** Top-level error message when status === 'failed' (job didn't start). */
  error?: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Per-endpoint request DTOs (D1–D4)
// ============================================================================

/** D1 — POST /finance/schools/:schoolId/payments/bulk-send-receipt */
export interface BulkSendReceiptDto {
  paymentIds: string[]
  channel: 'email' | 'sms' | 'both'
}

/** D2 — POST /finance/schools/:schoolId/invoices/bulk-send-reminder */
export interface BulkSendReminderDto {
  invoiceIds: string[]
  channel: 'email' | 'sms' | 'both'
  customNote?: string
}

/** D3 — POST /finance/schools/:schoolId/student-accounts/bulk-send-statement */
export interface BulkSendStatementDto {
  accountIds: string[]
  /** SMS would be link-only; only email surfaces the full statement PDF. */
  channel: 'email'
}

/**
 * D4 — POST /finance/schools/:schoolId/student-accounts/bulk-adjust
 *
 * Ledger writes are fast and transactional; D4 still uses the job framework
 * for uniform UX (consistent toast/progress) but typically terminates in
 * <2s. The frontend treats it identically to D1–D3.
 *
 * `overrideSignThreshold = true` suppresses the BE guard that refuses
 * adjustments crossing a sign boundary without explicit override (e.g.
 * crediting an already-surplus account).
 */
export interface BulkAdjustBalanceDto {
  accountIds: string[]
  type: 'debit' | 'credit'
  amount: number
  reason: string
  effectiveDate: string
  overrideSignThreshold?: boolean
}
