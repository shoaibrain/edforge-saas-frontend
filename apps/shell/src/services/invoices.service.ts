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
// CONVENIENCE EXPORT
// ============================================================================

export const invoicesService = {
  getInvoices,
  getInvoice,
  generateInvoice,
  updateInvoice,
  getStudentAccounts,
  getStudentLedger,
}
