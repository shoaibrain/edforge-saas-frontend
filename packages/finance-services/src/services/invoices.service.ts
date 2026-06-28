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
  invoiceIds?: string[]
  errors?: ({ studentId: string; reason: string } | string)[]
  resolvedStudentCount?: number
}

/**
 * Bulk Ops Sprint C.1 — discriminated union shape (mirrors backend
 * `bulkGenerateInvoiceSchema`). Local definition so the frontend
 * doesn't have to wait on the npm publish of @aibrains/shared-types
 * 0.87.0 (the schema lives there but the published version trails the
 * backend by one release cycle). Will be replaced by direct import
 * after the version bumps land.
 */
export type BulkGenerateInvoiceDto =
  | {
      // Sprint C.1 tagged "students" mode.
      selectionMode: 'students'
      studentIds: string[]
      academicYear: string
      billingPeriod?: string
      feeStructureIds: string[]
      dueDate: string
      notes?: string
    }
  | {
      // Sprint C.1 tagged "grades" mode.
      selectionMode: 'grades'
      gradeLevels: string[] // canonical grade codes OR the literal ['ALL']
      academicYear: string
      billingPeriod?: string
      feeStructureIds: string[]
      dueDate: string
      notes?: string
    }
  | {
      // Legacy flat shape — kept for back-compat with pre-C.1 callers.
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

/**
 * Bulk Ops Sprint C.6 — read-only counts for the wizard confirm step.
 * Calls `GET /finance/schools/:schoolId/invoices/bulk-preview`.
 * No DDB writes; safe to fire from a form-render effect (debounce
 * client-side to avoid spamming on every keystroke).
 */
export interface BulkPreviewParams {
  selectionMode?: 'students' | 'grades'
  studentIds?: string[]
  gradeLevels?: string[]
  feeStructureIds?: string[]
  billingPeriod?: string
}

export interface BulkPreviewResponse {
  studentCount: number
  eligibleCount: number
  duplicateCount: number
  estimatedDurationSec: number
}

export async function getBulkPreview(
  schoolId: string,
  params: BulkPreviewParams,
): Promise<BulkPreviewResponse> {
  // Backend reads these as CSV query params (one schoolId path segment
  // + flat csv lists). axios encodes arrays as repeated params by
  // default — we send strings instead so the controller's
  // `csv.split(',')` shape matches.
  const flat: Record<string, string> = {}
  if (params.selectionMode) flat.selectionMode = params.selectionMode
  if (params.studentIds?.length) flat.studentIds = params.studentIds.join(',')
  if (params.gradeLevels?.length) flat.gradeLevels = params.gradeLevels.join(',')
  if (params.feeStructureIds?.length) flat.feeStructureIds = params.feeStructureIds.join(',')
  if (params.billingPeriod) flat.billingPeriod = params.billingPeriod
  return apiGet<BulkPreviewResponse>(
    `/finance/schools/${schoolId}/invoices/bulk-preview`,
    flat,
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
