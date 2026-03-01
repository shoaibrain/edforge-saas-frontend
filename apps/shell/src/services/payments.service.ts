/**
 * Payments Service
 *
 * API client for payment operations. The frontend NEVER calls
 * gateway APIs (eSewa, Khalti) directly — all payment initiation
 * goes through EdForge backend which resolves the correct gateway adapter.
 *
 * Security: No gateway credentials are handled client-side.
 */

import { api, apiGet, apiPost } from '../lib/api'
import type {
  Payment,
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  VerifyPaymentResponse,
  Receipt,
  RecordManualPaymentDto,
  VoidPaymentDto,
  CreateRefundDto,
  Refund,
  DashboardSummary,
} from '@edforge/types'

// ============================================================================
// PAYMENT INITIATION
// ============================================================================

/**
 * Initiate a payment session with the backend.
 * Backend resolves the correct gateway adapter and returns a redirect URL.
 */
export async function initiatePayment(
  schoolId: string,
  request: InitiatePaymentRequest
): Promise<InitiatePaymentResponse> {
  return apiPost<InitiatePaymentResponse, InitiatePaymentRequest>(
    `/finance/schools/${schoolId}/payments/initiate`,
    request
  )
}

// ============================================================================
// PAYMENT VERIFICATION
// ============================================================================

/**
 * Verify a payment after gateway redirect callback.
 * Called on the callback page with the session ID and raw gateway callback params.
 */
export async function verifyPayment(
  sessionId: string,
  callbackParams?: Record<string, string>
): Promise<VerifyPaymentResponse> {
  const params = callbackParams
    ? new URLSearchParams(callbackParams).toString()
    : ''
  const qs = params ? `?${params}` : ''
  return apiGet<VerifyPaymentResponse>(`/finance/payments/verify/${sessionId}${qs}`)
}

// ============================================================================
// PAYMENT HISTORY
// ============================================================================

/**
 * Get payment history for a specific invoice.
 */
export async function getInvoicePayments(
  schoolId: string,
  invoiceId: string
): Promise<Payment[]> {
  return apiGet<Payment[]>(`/finance/schools/${schoolId}/invoices/${invoiceId}/payments`)
}

/**
 * Get all payments for a school (admin view).
 * Backend returns { items, hasMore } — unwrap to flat array.
 */
export async function getSchoolPayments(
  schoolId: string,
  params?: { status?: string; limit?: number; cursor?: string }
): Promise<Payment[]> {
  const response = await apiGet<Payment[] | { items: Payment[]; hasMore: boolean }>(
    `/finance/schools/${schoolId}/payments`,
    params as Record<string, unknown>
  )
  if (Array.isArray(response)) return response
  return response?.items ?? []
}

// ============================================================================
// RECEIPT
// ============================================================================

/**
 * Get receipt data for a completed payment.
 */
export async function getPaymentReceipt(paymentId: string): Promise<Receipt> {
  return apiGet<Receipt>(`/finance/payments/${paymentId}/receipt`)
}

// ============================================================================
// RECORD MANUAL PAYMENT (cash, bank_transfer, cheque)
// ============================================================================

/**
 * Record a manual (offline) payment — cash, bank transfer, or cheque.
 * Admin-only action. Creates the payment and credits the student account.
 */
export async function recordManualPayment(
  schoolId: string,
  data: RecordManualPaymentDto
): Promise<Payment> {
  return apiPost<Payment, RecordManualPaymentDto>(
    `/finance/schools/${schoolId}/payments/manual`,
    data
  )
}

// ============================================================================
// VOID PAYMENT
// ============================================================================

/**
 * Void a completed payment. Reverses the ledger entry.
 */
export async function voidPayment(
  schoolId: string,
  paymentId: string,
  data: VoidPaymentDto
): Promise<Payment> {
  return apiPost<Payment, VoidPaymentDto>(
    `/finance/schools/${schoolId}/payments/${paymentId}/void`,
    data
  )
}

// ============================================================================
// REFUND
// ============================================================================

/**
 * Create a refund for a completed payment (full or partial).
 */
export async function createRefund(
  schoolId: string,
  paymentId: string,
  data: CreateRefundDto
): Promise<Refund> {
  return apiPost<Refund, CreateRefundDto>(
    `/finance/schools/${schoolId}/payments/${paymentId}/refund`,
    data
  )
}

// ============================================================================
// DASHBOARD SUMMARY
// ============================================================================

/**
 * Get financial dashboard summary for a school.
 */
export async function getDashboardSummary(
  schoolId: string
): Promise<DashboardSummary> {
  return apiGet<DashboardSummary>(`/finance/schools/${schoolId}/dashboard`)
}

// ============================================================================
// EXPORT (CSV)
// ============================================================================

/**
 * Export invoices as CSV for a school.
 * Returns a Blob that can be downloaded by the client.
 */
export async function exportInvoicesCsv(schoolId: string): Promise<Blob> {
  const response = await api.get(`/finance/schools/${schoolId}/invoices/export`, {
    params: { format: 'csv' },
    responseType: 'blob',
  })
  return response.data
}

// ============================================================================
// CONVENIENCE EXPORT
// ============================================================================

export const paymentsService = {
  initiatePayment,
  verifyPayment,
  getInvoicePayments,
  getSchoolPayments,
  getPaymentReceipt,
  recordManualPayment,
  voidPayment,
  createRefund,
  getDashboardSummary,
  exportInvoicesCsv,
}
