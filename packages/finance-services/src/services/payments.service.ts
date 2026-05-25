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
  schoolId: string,
  filters?: { from?: string; to?: string; academicYear?: string }
): Promise<DashboardSummary> {
  return apiGet<DashboardSummary>(
    `/finance/schools/${schoolId}/dashboard/summary`,
    filters as Record<string, unknown>,
  )
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

export async function exportPaymentsCsv(schoolId: string): Promise<Blob> {
  try {
    const response = await api.get(`/finance/schools/${schoolId}/payments/export`, {
      params: { format: 'csv' },
      responseType: 'blob',
    })
    if (!response.data || !(response.data instanceof Blob)) {
      throw new Error('Server returned an invalid response for CSV export')
    }
    return response.data
  } catch (error: any) {
    if (error?.response?.data instanceof Blob) {
      const text = await error.response.data.text()
      try {
        const parsed = JSON.parse(text)
        throw new Error(parsed.message || 'Failed to export payments')
      } catch {
        throw new Error(text || 'Failed to export payments')
      }
    }
    throw error instanceof Error
      ? error
      : new Error('Failed to export payments CSV')
  }
}

// ============================================================================
// RECEIPT PDF DOWNLOAD (Sprint C.1.6 frontend)
// ============================================================================

/**
 * Download the payment receipt PDF as a Blob.
 *
 * Calls the backend endpoint shipped in Sprint C.1.6 (PR #202):
 *   GET /finance/payments/{paymentId}/receipt/pdf?schoolId=<sid>
 *
 * Backend renders the receipt server-side via `@aibrains/pdf-renderer` —
 * the returned PDF has selectable text + embedded fonts (Devanagari for
 * PABSON tenants), unlike the prior jspdf+html2canvas client-side raster
 * approach this replaces.
 *
 * The 5xx fallback chain lives entirely on the backend (graceful
 * degradation to descriptor defaults when identity is mid-deploy); from
 * the frontend's POV this is either a 200 + Blob or an error to surface.
 */
export async function downloadReceiptPdf(
  paymentId: string,
  schoolId: string,
): Promise<Blob> {
  try {
    const response = await api.get(`/finance/payments/${paymentId}/receipt/pdf`, {
      params: { schoolId },
      responseType: 'blob',
    })
    if (!response.data || !(response.data instanceof Blob)) {
      throw new Error('Server returned an invalid response for receipt PDF')
    }
    return response.data
  } catch (error: any) {
    // If the error response is a blob (server sent application/json error
    // wrapped in blob because we set responseType:'blob'), parse + surface
    // the backend's `message` field.
    //
    // **Important:** the `throw` must happen OUTSIDE the JSON.parse try
    // block — if it's inside, the surrounding `catch` swallows our thrown
    // error and re-throws with the raw text, defeating the parse. This
    // bug shape exists in the pre-existing exportInvoicesCsv +
    // exportPaymentsCsv blocks above; intentionally NOT fixing those
    // here per minimal-changes (separate cleanup PR). Fixing only this
    // C.1.6 block which I authored.
    if (error?.response?.data instanceof Blob) {
      const text = await error.response.data.text()
      let parsedMessage: string | undefined
      try {
        const parsed = JSON.parse(text)
        parsedMessage = parsed?.message
      } catch {
        // Not JSON — fall through with `parsedMessage` undefined so we
        // use the raw text or the generic fallback below.
      }
      throw new Error(parsedMessage || text || 'Failed to download receipt PDF')
    }
    throw error instanceof Error
      ? error
      : new Error('Failed to download receipt PDF')
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
  exportPaymentsCsv,
  downloadReceiptPdf,
}
