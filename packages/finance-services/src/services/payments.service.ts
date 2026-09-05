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
import type { FinanceListQueryParams } from '../types/pagination'
import type { FinancePaginatedResponse } from '../types/pagination'
import { normalizeFinanceListResponse } from '../utils/normalize-finance-list-response'

export type SchoolPaymentListParams = FinanceListQueryParams & {
  status?: string
  gateway?: string
}

// ============================================================================
// PAYMENT INITIATION
// ============================================================================

export async function initiatePayment(
  schoolId: string,
  request: InitiatePaymentRequest,
): Promise<InitiatePaymentResponse> {
  return apiPost<InitiatePaymentResponse, InitiatePaymentRequest>(
    `/finance/schools/${schoolId}/payments/initiate`,
    request,
  )
}

// ============================================================================
// PAYMENT VERIFICATION
// ============================================================================

export async function verifyPayment(
  sessionId: string,
  callbackParams?: Record<string, string>,
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
  invoiceId: string,
): Promise<Payment[]> {
  return apiGet<Payment[]>(`/finance/schools/${schoolId}/invoices/${invoiceId}/payments`)
}

export async function getSchoolPayments(
  schoolId: string,
  params?: SchoolPaymentListParams,
): Promise<FinancePaginatedResponse<Payment>> {
  const response = await apiGet<FinancePaginatedResponse<Payment> | Payment[]>(
    `/finance/schools/${schoolId}/payments`,
    params as Record<string, unknown>,
  )
  return normalizeFinanceListResponse(response)
}

// ============================================================================
// RECEIPT
// ============================================================================

/**
 * Fetch the JSON receipt for a completed payment.
 *
 * `schoolId` is a QUERY PARAM, not a path segment. The backend route is
 * `GET /finance/payments/:paymentId/receipt?schoolId=<sid>`
 * (payments.controller.ts:179). There is NO `/finance/schools/:schoolId/...`
 * variant — calling one produces a 403 SigV4 (API Gateway has no such
 * route and falls through to its IAM auth default). The controller
 * resolves the payment via SK `PAYMENT#{schoolId}#{paymentId}`, so a
 * missing schoolId yields `PAYMENT#undefined#...` → null → 404.
 */
export async function getPaymentReceipt(
  paymentId: string,
  schoolId: string,
): Promise<Receipt> {
  return apiGet<Receipt>(`/finance/payments/${paymentId}/receipt`, {
    schoolId,
  })
}

// ============================================================================
// MANUAL PAYMENT / VOID / REFUND
// ============================================================================

export async function recordManualPayment(
  schoolId: string,
  data: RecordManualPaymentDto,
): Promise<Payment> {
  return apiPost<Payment, RecordManualPaymentDto>(
    `/finance/schools/${schoolId}/payments/manual`,
    data,
  )
}

export async function voidPayment(
  schoolId: string,
  paymentId: string,
  data: VoidPaymentDto,
): Promise<Payment> {
  return apiPost<Payment, VoidPaymentDto>(
    `/finance/schools/${schoolId}/payments/${paymentId}/void`,
    data,
  )
}

export async function createRefund(
  schoolId: string,
  paymentId: string,
  data: CreateRefundDto,
): Promise<Refund> {
  return apiPost<Refund, CreateRefundDto>(
    `/finance/schools/${schoolId}/payments/${paymentId}/refund`,
    data,
  )
}

// ============================================================================
// DASHBOARD
// ============================================================================

export async function getDashboardSummary(
  schoolId: string,
  filters?: { from?: string; to?: string; academicYear?: string },
): Promise<DashboardSummary> {
  return apiGet<DashboardSummary>(
    `/finance/schools/${schoolId}/dashboard/summary`,
    filters as Record<string, unknown>,
  )
}

// ============================================================================
// CSV EXPORT
// ============================================================================

export async function exportInvoicesCsv(
  schoolId: string,
  filters?: Record<string, unknown>,
): Promise<Blob> {
  const response = await api.get(
    `/finance/schools/${schoolId}/invoices/export`,
    { params: filters, responseType: 'blob' },
  )
  return response.data
}

export async function exportPaymentsCsv(
  schoolId: string,
  filters?: Record<string, unknown>,
): Promise<Blob> {
  const response = await api.get(
    `/finance/schools/${schoolId}/payments/export`,
    { params: filters, responseType: 'blob' },
  )
  return response.data
}

export async function downloadReceiptPdf(
  paymentId: string,
  schoolId: string,
): Promise<Blob> {
  try {
    const response = await api.get(`/finance/payments/${paymentId}/receipt/pdf`, {
      params: { schoolId },
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    })
    if (!response.data || !(response.data instanceof Blob)) {
      throw new Error('Server returned an invalid response for receipt PDF')
    }
    return response.data
  } catch (error: any) {
    if (error?.response?.data instanceof Blob) {
      const text = await error.response.data.text()
      let parsedMessage: string | undefined
      try {
        const parsed = JSON.parse(text)
        const candidate = parsed?.message
        if (typeof candidate === 'string') {
          parsedMessage = candidate
        } else if (candidate != null) {
          try {
            parsedMessage = JSON.stringify(candidate)
          } catch {
            // fall through
          }
        }
      } catch {
        // not JSON
      }
      throw new Error(parsedMessage || text || 'Failed to download receipt PDF')
    }
    throw error instanceof Error
      ? error
      : new Error('Failed to download receipt PDF')
  }
}

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
  exportPaymentsCsv,
  downloadReceiptPdf,
}
