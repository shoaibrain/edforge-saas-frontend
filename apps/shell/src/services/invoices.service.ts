/**
 * Invoices Service
 *
 * API client for invoice operations (CRUD, generation, filtering).
 */

import { apiGet, apiPost, apiPatch } from '../lib/api'
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

/**
 * Get paginated invoices for a school, with optional filters.
 * Backend returns { items, hasMore } — we normalise consistently.
 */
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

/**
 * Get a single invoice with full line items.
 */
export async function getInvoice(
  schoolId: string,
  invoiceId: string
): Promise<Invoice> {
  return apiGet<Invoice>(`/finance/schools/${schoolId}/invoices/${invoiceId}`)
}

// ============================================================================
// INVOICE MUTATIONS
// ============================================================================

/**
 * Generate a new invoice from fee structures for a student.
 */
export async function generateInvoice(
  schoolId: string,
  data: GenerateInvoiceDto
): Promise<Invoice> {
  return apiPost<Invoice, GenerateInvoiceDto>(
    `/finance/schools/${schoolId}/invoices`,
    data
  )
}

/**
 * Update an invoice (status, notes, discounts).
 */
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

/**
 * Issue a draft invoice (transitions from draft → issued).
 */
export async function issueInvoice(
  schoolId: string,
  invoiceId: string
): Promise<Invoice> {
  return apiPost<Invoice, undefined>(
    `/finance/schools/${schoolId}/invoices/${invoiceId}/issue`,
    undefined as any
  )
}

/**
 * Cancel an invoice (sets status to cancelled).
 */
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

/**
 * Get student accounts for a school.
 * Filter by studentId to get a specific student's account.
 */
export async function getStudentAccounts(
  schoolId: string,
  params?: { studentId?: string }
): Promise<StudentAccount[]> {
  return apiGet<StudentAccount[]>(
    `/finance/schools/${schoolId}/student-accounts`,
    params as Record<string, unknown>
  )
}

/**
 * Get the account ledger (transaction history) for a student account.
 */
export async function getStudentLedger(
  schoolId: string,
  accountId: string
): Promise<StudentLedgerEntry[]> {
  return apiGet<StudentLedgerEntry[]>(
    `/finance/schools/${schoolId}/student-accounts/${accountId}/ledger`
  )
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/** Bulk-generate response from the backend */
export interface BulkGenerateInvoiceResponse {
  generated: number
  skipped: number
  invoiceIds: string[]
  errors?: { studentAccountId: string; reason: string }[]
}

/** DTO for bulk generate — matches BulkGenerateInvoiceDto from shared-types */
export interface BulkGenerateInvoiceDto {
  studentAccountIds: string[]
  academicYear: string
  billingPeriod?: string
  feeStructureIds: string[]
  dueDate: string
  notes?: string
}

/**
 * Bulk-generate invoices for multiple students at once.
 */
export async function bulkGenerateInvoices(
  schoolId: string,
  data: BulkGenerateInvoiceDto
): Promise<BulkGenerateInvoiceResponse> {
  return apiPost<BulkGenerateInvoiceResponse, BulkGenerateInvoiceDto>(
    `/finance/schools/${schoolId}/invoices/bulk-generate`,
    data
  )
}

/** DTO for bulk issue */
export interface BulkIssueInvoicesDto {
  invoiceIds: string[]
}

/** Bulk-issue response from the backend */
export interface BulkIssueInvoicesResponse {
  issued: number
  skipped: number
  errors?: { invoiceId: string; reason: string }[]
}

/**
 * Bulk-issue multiple draft invoices at once.
 */
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
}
