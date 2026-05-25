/**
 * Invoices Service
 *
 * API client for invoice operations (CRUD, generation, filtering).
 */

import { apiGet, apiPost, apiPatch } from '@edforge/api-client'
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
  const baseParams = { ...(filters as Record<string, unknown> | undefined) }
  const allItems: Invoice[] = []
  const seenCursors = new Set<string>()

  let cursor: string | undefined = undefined
  let hasMore = true
  let pageCount = 0
  const MAX_PAGES = 500

  while (hasMore && pageCount < MAX_PAGES) {
    const response = await apiGet<FinancePaginatedResponse<Invoice> | Invoice[]>(
      `/finance/schools/${schoolId}/invoices`,
      {
        ...baseParams,
        ...(cursor ? { cursor } : {}),
      }
    )

    // Backward compatibility: tolerate legacy bare-array response shape.
    if (Array.isArray(response)) {
      allItems.push(...response)
      return { items: allItems, hasMore: false }
    }

    const pageItems = response?.items ?? []
    allItems.push(...pageItems)

    const nextCursor = response?.lastEvaluatedKey
    hasMore = Boolean(response?.hasMore && nextCursor)

    if (!hasMore) {
      return { items: allItems, hasMore: false }
    }

    if (seenCursors.has(nextCursor!)) {
      // Defensive break to avoid infinite loops on malformed cursor chains.
      return { items: allItems, hasMore: true, lastEvaluatedKey: nextCursor }
    }

    seenCursors.add(nextCursor!)
    cursor = nextCursor
    pageCount += 1
  }

  return {
    items: allItems,
    hasMore,
    lastEvaluatedKey: cursor,
  }
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
