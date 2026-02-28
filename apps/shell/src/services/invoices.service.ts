/**
 * Invoices Service
 *
 * API client for invoice operations (CRUD, generation, filtering).
 */

import { apiGet, apiPost, apiPatch, type PaginatedResponse } from '../lib/api'
import type {
  Invoice,
  InvoiceFilterDto,
  GenerateInvoiceDto,
  UpdateInvoiceDto,
  StudentAccount,
  StudentLedgerEntry,
} from '@edforge/types'

// ============================================================================
// INVOICE QUERIES
// ============================================================================

/**
 * Get paginated invoices for a school, with optional filters.
 */
export async function getInvoices(
  schoolId: string,
  filters?: InvoiceFilterDto
): Promise<PaginatedResponse<Invoice>> {
  return apiGet<PaginatedResponse<Invoice>>(
    `/finance/schools/${schoolId}/invoices`,
    filters as Record<string, unknown>
  )
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
