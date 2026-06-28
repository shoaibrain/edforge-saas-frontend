/**
 * D1–D4 async-bulk-job API client.
 *
 * Four kickoff endpoints + one polling endpoint. Every POST returns
 * AsyncBulkJobAck (202); clients poll via getAsyncBulkJob until the
 * status reaches a terminal value.
 *
 * The polling endpoint URL is intentionally domain-scoped (per the
 * backend framework's queue topology) — payments jobs poll under
 * /finance/schools/:schoolId/payments/jobs/:jobId, etc. The caller
 * passes the domain so this layer doesn't need to thread it back
 * through the ack.
 */

import { apiGet, apiPost } from '@edforge/api-client'
import type {
  AsyncBulkJobAck,
  AsyncBulkJobResult,
  BulkAdjustBalanceDto,
  BulkSendReceiptDto,
  BulkSendReminderDto,
  BulkSendStatementDto,
} from '../types/async-jobs'

// ============================================================================
// D1 — Bulk send payment receipts
// ============================================================================

export async function bulkSendReceipts(
  schoolId: string,
  data: BulkSendReceiptDto,
): Promise<AsyncBulkJobAck> {
  return apiPost<AsyncBulkJobAck, BulkSendReceiptDto>(
    `/finance/schools/${schoolId}/payments/bulk-send-receipt`,
    data,
  )
}

// ============================================================================
// D2 — Bulk send invoice reminders
// ============================================================================

export async function bulkSendInvoiceReminders(
  schoolId: string,
  data: BulkSendReminderDto,
): Promise<AsyncBulkJobAck> {
  return apiPost<AsyncBulkJobAck, BulkSendReminderDto>(
    `/finance/schools/${schoolId}/invoices/bulk-send-reminder`,
    data,
  )
}

// ============================================================================
// D3 — Bulk send student-account statements
// ============================================================================

export async function bulkSendStatements(
  schoolId: string,
  data: BulkSendStatementDto,
): Promise<AsyncBulkJobAck> {
  return apiPost<AsyncBulkJobAck, BulkSendStatementDto>(
    `/finance/schools/${schoolId}/student-accounts/bulk-send-statement`,
    data,
  )
}

// ============================================================================
// D4 — Bulk adjust student-account balance
// ============================================================================

export async function bulkAdjustBalances(
  schoolId: string,
  data: BulkAdjustBalanceDto,
): Promise<AsyncBulkJobAck> {
  return apiPost<AsyncBulkJobAck, BulkAdjustBalanceDto>(
    `/finance/schools/${schoolId}/student-accounts/bulk-adjust`,
    data,
  )
}

// ============================================================================
// Polling — GET /finance/schools/:schoolId/<domain>/jobs/:jobId
// ============================================================================

export type AsyncJobDomain = 'payments' | 'invoices' | 'student-accounts'

export async function getAsyncBulkJob(
  schoolId: string,
  domain: AsyncJobDomain,
  jobId: string,
): Promise<AsyncBulkJobResult> {
  return apiGet<AsyncBulkJobResult>(
    `/finance/schools/${schoolId}/${domain}/jobs/${jobId}`,
  )
}
