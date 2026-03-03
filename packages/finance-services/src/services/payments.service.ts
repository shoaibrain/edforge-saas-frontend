/**
 * Payments Service
 *
 * API client for payment operations. The frontend NEVER calls
 * gateway APIs (eSewa, Khalti) directly — all payment initiation
 * goes through EdForge backend which resolves the correct gateway adapter.
 */

import { api, apiGet, apiPost } from '@edforge/api-client'
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

export async function getInvoicePayments(
  schoolId: string,
  invoiceId: string
): Promise<Payment[]> {
  return apiGet<Payment[]>(`/finance/schools/${schoolId}/invoices/${invoiceId}/payments`)
}

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

export async function getPaymentReceipt(paymentId: string): Promise<Receipt> {
  return apiGet<Receipt>(`/finance/payments/${paymentId}/receipt`)
}

// ============================================================================
// RECORD MANUAL PAYMENT
// ============================================================================

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

export async function getDashboardSummary(
  schoolId: string
): Promise<DashboardSummary> {
  return apiGet<DashboardSummary>(`/finance/schools/${schoolId}/dashboard/summary`)
}

// ============================================================================
// EXPORT (CSV)
// ============================================================================

export async function exportInvoicesCsv(schoolId: string): Promise<Blob> {
  try {
    const response = await api.get(`/finance/schools/${schoolId}/invoices/export`, {
      params: { format: 'csv' },
      responseType: 'blob',
    })
    if (!response.data || !(response.data instanceof Blob)) {
      throw new Error('Server returned an invalid response for CSV export')
    }
    return response.data
  } catch (error: any) {
    // If the error response is a blob (e.g. JSON error wrapped in blob), parse it
    if (error?.response?.data instanceof Blob) {
      const text = await error.response.data.text()
      try {
        const parsed = JSON.parse(text)
        throw new Error(parsed.message || 'Failed to export invoices')
      } catch {
        throw new Error(text || 'Failed to export invoices')
      }
    }
    throw error instanceof Error
      ? error
      : new Error('Failed to export invoices CSV')
  }
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
