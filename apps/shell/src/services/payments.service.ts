/**
 * Payments Service
 *
 * API client for payment operations. The frontend NEVER calls
 * gateway APIs (eSewa, Khalti) directly — all payment initiation
 * goes through EdForge backend which resolves the correct gateway adapter.
 *
 * Security: No gateway credentials are handled client-side.
 */

import { apiGet, apiPost } from '../lib/api'
import type {
  Payment,
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  VerifyPaymentResponse,
  Receipt,
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
 */
export async function getSchoolPayments(
  schoolId: string,
  params?: { status?: string; page?: number; pageSize?: number }
): Promise<Payment[]> {
  return apiGet<Payment[]>(
    `/finance/schools/${schoolId}/payments`,
    params as Record<string, unknown>
  )
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
// CONVENIENCE EXPORT
// ============================================================================

export const paymentsService = {
  initiatePayment,
  verifyPayment,
  getInvoicePayments,
  getSchoolPayments,
  getPaymentReceipt,
}
