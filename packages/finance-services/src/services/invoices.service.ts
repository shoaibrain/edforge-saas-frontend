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
import type {
  FinanceListQueryParams,
  FinancePaginatedResponse,
  StudentAccountListParams,
} from '../types/pagination'
import { normalizeFinanceListResponse } from '../utils/normalize-finance-list-response'

export type { FinancePaginatedResponse } from '../types/pagination'

export type InvoiceListParams = InvoiceFilterDto & FinanceListQueryParams

// ============================================================================
// INVOICE QUERIES
// ============================================================================

export async function getInvoices(
  schoolId: string,
  filters?: InvoiceListParams,
): Promise<FinancePaginatedResponse<Invoice>> {
  const response = await apiGet<FinancePaginatedResponse<Invoice> | Invoice[]>(
    `/finance/schools/${schoolId}/invoices`,
    filters as Record<string, unknown>,
  )
  return normalizeFinanceListResponse(response)
}

export async function getInvoice(
  schoolId: string,
  invoiceId: string,
): Promise<Invoice> {
  return apiGet<Invoice>(`/finance/schools/${schoolId}/invoices/${invoiceId}`)
}

// ============================================================================
// INVOICE MUTATIONS
// ============================================================================

export async function generateInvoice(
  schoolId: string,
  data: GenerateInvoiceDto,
): Promise<Invoice> {
  return apiPost<Invoice, GenerateInvoiceDto>(
    `/finance/schools/${schoolId}/invoices`,
    data,
  )
}

export async function updateInvoice(
  schoolId: string,
  invoiceId: string,
  data: UpdateInvoiceDto,
): Promise<Invoice> {
  return apiPatch<Invoice, UpdateInvoiceDto>(
    `/finance/schools/${schoolId}/invoices/${invoiceId}`,
    data,
  )
}

export async function issueInvoice(
  schoolId: string,
  invoiceId: string,
): Promise<Invoice> {
  return apiPost<Invoice, undefined>(
    `/finance/schools/${schoolId}/invoices/${invoiceId}/issue`,
    undefined as any,
  )
}

export async function cancelInvoice(
  schoolId: string,
  invoiceId: string,
  reason?: string,
): Promise<Invoice> {
  return apiPatch<Invoice, { status: string; notes?: string }>(
    `/finance/schools/${schoolId}/invoices/${invoiceId}`,
    { status: 'cancelled', ...(reason && { notes: reason }) },
  )
}

// ============================================================================
// STUDENT ACCOUNTS
// ============================================================================

/**
 * List student billing accounts. Backend supports searchTerm (name filter),
 * not studentId — do not send studentId (B-2).
 */
export async function getStudentAccounts(
  schoolId: string,
  params?: StudentAccountListParams,
): Promise<FinancePaginatedResponse<StudentAccount>> {
  const response = await apiGet<
    FinancePaginatedResponse<StudentAccount> | StudentAccount[]
  >(`/finance/schools/${schoolId}/student-accounts`, params as Record<string, unknown>)
  return normalizeFinanceListResponse(response)
}

export async function getStudentLedger(
  schoolId: string,
  accountId: string,
  params?: FinanceListQueryParams,
): Promise<FinancePaginatedResponse<StudentLedgerEntry>> {
  const response = await apiGet<
    FinancePaginatedResponse<StudentLedgerEntry> | StudentLedgerEntry[]
  >(
    `/finance/schools/${schoolId}/student-accounts/${accountId}/ledger`,
    params as Record<string, unknown>,
  )
  return normalizeFinanceListResponse(response)
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
  data: BulkGenerateInvoiceDto,
): Promise<BulkGenerateInvoiceResponse> {
  return apiPost<BulkGenerateInvoiceResponse, BulkGenerateInvoiceDto>(
    `/finance/schools/${schoolId}/invoices/bulk-generate`,
    data,
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
  data: BulkIssueInvoicesDto,
): Promise<BulkIssueInvoicesResponse> {
  return apiPost<BulkIssueInvoicesResponse, BulkIssueInvoicesDto>(
    `/finance/schools/${schoolId}/invoices/bulk-issue`,
    data,
  )
}

// ============================================================================
// INVOICE PDF DOWNLOAD (Sprint M1.3 — frontend half of C.1.5)
// ============================================================================

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
      throw new Error(parsedMessage || text || 'Failed to download invoice PDF')
    }
    throw error instanceof Error
      ? error
      : new Error('Failed to download invoice PDF')
  }
}

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
