/**
 * Invoices Service
 *
 * API client for invoice operations (CRUD, generation, filtering).
 */

import { api, apiGet, apiPost, apiPatch } from '@edforge/api-client'
import type {
  Invoice,
  InvoiceFilterDto,
  GenerateInvoiceDto,
  UpdateInvoiceDto,
  StudentAccount,
  StudentLedgerEntry,
} from '@edforge/types'

/** Backend finance pagination shape: { items, hasMore, lastEvaluatedKey? } */
export interface FinancePaginatedResponse<T> {
  items: T[]
  hasMore: boolean
  lastEvaluatedKey?: string
}

// ============================================================================
// INVOICE QUERIES
// ============================================================================

export async function getInvoices(
  schoolId: string,
  filters?: InvoiceFilterDto
): Promise<FinancePaginatedResponse<Invoice>> {
  const response = await apiGet<FinancePaginatedResponse<Invoice> | Invoice[]>(
    `/finance/schools/${schoolId}/invoices`,
    filters as Record<string, unknown>
  )
  if (Array.isArray(response)) return { items: response, hasMore: false }
  return { items: response?.items ?? [], hasMore: response?.hasMore ?? false }
}

export async function getInvoice(
  schoolId: string,
  invoiceId: string
): Promise<Invoice> {
  return apiGet<Invoice>(`/finance/schools/${schoolId}/invoices/${invoiceId}`)
}

// ============================================================================
// INVOICE MUTATIONS
// ============================================================================

export async function generateInvoice(
  schoolId: string,
  data: GenerateInvoiceDto
): Promise<Invoice> {
  return apiPost<Invoice, GenerateInvoiceDto>(
    `/finance/schools/${schoolId}/invoices`,
    data
  )
}

export async function updateInvoice(
  schoolId: string,
  invoiceId: string,
  data: UpdateInvoiceDto
): Promise<Invoice> {
  return apiPatch<Invoice, UpdateInvoiceDto>(
    `/finance/schools/${schoolId}/invoices/${invoiceId}`,
    data
  )
}

export async function issueInvoice(
  schoolId: string,
  invoiceId: string
): Promise<Invoice> {
  return apiPost<Invoice, undefined>(
    `/finance/schools/${schoolId}/invoices/${invoiceId}/issue`,
    undefined as any
  )
}

export async function cancelInvoice(
  schoolId: string,
  invoiceId: string,
  reason?: string
): Promise<Invoice> {
  return apiPatch<Invoice, { status: string; notes?: string }>(
    `/finance/schools/${schoolId}/invoices/${invoiceId}`,
    { status: 'cancelled', ...(reason && { notes: reason }) }
  )
}

// ============================================================================
// STUDENT ACCOUNTS
// ============================================================================

export async function getStudentAccounts(
  schoolId: string,
  params?: { studentId?: string }
): Promise<StudentAccount[]> {
  const response = await apiGet<{ items: StudentAccount[]; hasMore: boolean } | StudentAccount[]>(
    `/finance/schools/${schoolId}/student-accounts`,
    params as Record<string, unknown>
  )
  if (Array.isArray(response)) return response
  return response?.items ?? []
}

export async function getStudentLedger(
  schoolId: string,
  accountId: string
): Promise<StudentLedgerEntry[]> {
  // Backend returns the FinancePaginatedResponse shape ({ items, hasMore });
  // older callers also tolerate a bare array. Mirror the unwrap pattern used
  // by getInvoices / getStudentAccounts above so the consumer always sees an array.
  const response = await apiGet<FinancePaginatedResponse<StudentLedgerEntry> | StudentLedgerEntry[]>(
    `/finance/schools/${schoolId}/student-accounts/${accountId}/ledger`
  )
  if (Array.isArray(response)) return response
  return response?.items ?? []
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export interface BulkGenerateInvoiceResponse {
  generated: number
  skipped: number
  invoiceIds: string[]
  errors?: { studentId: string; reason: string }[]
}

export interface BulkGenerateInvoiceDto {
  studentIds: string[]
  academicYear: string
  billingPeriod?: string
  feeStructureIds: string[]
  dueDate: string
  notes?: string
}

export async function bulkGenerateInvoices(
  schoolId: string,
  data: BulkGenerateInvoiceDto
): Promise<BulkGenerateInvoiceResponse> {
  return apiPost<BulkGenerateInvoiceResponse, BulkGenerateInvoiceDto>(
    `/finance/schools/${schoolId}/invoices/bulk-generate`,
    data
  )
}

export interface BulkIssueInvoicesDto {
  invoiceIds: string[]
}

export interface BulkIssueInvoicesResponse {
  issued: number
  skipped: number
  errors?: { invoiceId: string; reason: string }[]
}

export async function bulkIssueInvoices(
  schoolId: string,
  data: BulkIssueInvoicesDto
): Promise<BulkIssueInvoicesResponse> {
  return apiPost<BulkIssueInvoicesResponse, BulkIssueInvoicesDto>(
    `/finance/schools/${schoolId}/invoices/bulk-issue`,
    data
  )
}

// ============================================================================
// INVOICE PDF DOWNLOAD (Sprint M1.3 — frontend half of C.1.5)
// ============================================================================

/**
 * Download the invoice PDF as a Blob.
 *
 * Calls the backend endpoint shipped in Sprint C.1.5 (server PR #201):
 *   GET /finance/schools/{schoolId}/invoices/{invoiceId}/pdf
 *
 * Backend renders the invoice server-side via `@aibrains/pdf-renderer` —
 * the returned PDF has selectable text + embedded fonts (Devanagari for
 * PABSON tenants) + tenant-customized branding. From the frontend's
 * POV this is either a 200 + Blob or an error to surface.
 *
 * Mirrors the shape of `downloadReceiptPdf` in payments.service.ts:
 * returns the raw Blob and lets the consuming hook (M1.4
 * `useDownloadInvoicePdf`) handle filename construction + the
 * anchor-blob download dance.
 */
export async function downloadInvoicePdf(
  schoolId: string,
  invoiceId: string,
): Promise<Blob> {
  try {
    const response = await api.get(
      `/finance/schools/${schoolId}/invoices/${invoiceId}/pdf`,
      { responseType: 'blob' },
    )
    if (!response.data || !(response.data instanceof Blob)) {
      throw new Error('Server returned an invalid response for invoice PDF')
    }
    return response.data
  } catch (error: any) {
    // If the error response is a blob (server sent application/json
    // error wrapped in blob because we set responseType: 'blob'),
    // parse + surface the backend's `message` field.
    //
    // **Important:** the `throw` must happen OUTSIDE the JSON.parse
    // try block — if it's inside, the surrounding `catch` swallows
    // our thrown error and re-throws with the raw text, defeating
    // the parse. Same bug-shape that exists in the older
    // exportInvoicesCsv / exportPaymentsCsv blocks; intentionally
    // mirrored from the C.1.6 downloadReceiptPdf which got it right.
    if (error?.response?.data instanceof Blob) {
      const text = await error.response.data.text()
      let parsedMessage: string | undefined
      try {
        const parsed = JSON.parse(text)
        // Backend convention is `{ message: string }`, but a future
        // ValidationException could surface `message` as a structured
        // object. Guard the type so `new Error(...)` never receives a
        // non-string — otherwise the UI would show `"[object Object]"`.
        const candidate = parsed?.message
        if (typeof candidate === 'string') {
          parsedMessage = candidate
        } else if (candidate != null) {
          try {
            parsedMessage = JSON.stringify(candidate)
          } catch {
            // Circular ref or BigInt — fall through to the raw text.
          }
        }
      } catch {
        // Not JSON — fall through with `parsedMessage` undefined so
        // we use the raw text or the generic fallback below.
      }
      throw new Error(parsedMessage || text || 'Failed to download invoice PDF')
    }
    throw error instanceof Error
      ? error
      : new Error('Failed to download invoice PDF')
  }
}

// ============================================================================
// CONVENIENCE EXPORT
// ============================================================================

export const invoicesService = {
  getInvoices,
  getInvoice,
  generateInvoice,
  updateInvoice,
  issueInvoice,
  cancelInvoice,
  getStudentAccounts,
  getStudentLedger,
  bulkGenerateInvoices,
  bulkIssueInvoices,
  downloadInvoicePdf,
}
