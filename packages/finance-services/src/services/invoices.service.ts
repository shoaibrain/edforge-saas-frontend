/**
 * Invoices Service
 *
 * API client for invoice operations (CRUD, generation, filtering).
 */

import { api, apiGet, apiPost, apiPatch, apiPostWithStatus } from '@edforge/api-client'
import type {
  Invoice,
  InvoiceFilterDto,
  GenerateInvoiceDto,
  UpdateInvoiceDto,
  StudentAccount,
  StudentLedgerEntry,
  InvoiceProvenance,
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

/**
 * Family-billing (FB) — per-line provenance for an invoice: whether each
 * line came from the fee catalog, an agreement, or a custom line, plus any
 * operator override that bypassed a fee structure at generate time.
 * GET /finance/schools/:schoolId/invoices/:invoiceId/provenance
 */
export async function getInvoiceProvenance(
  schoolId: string,
  invoiceId: string,
): Promise<InvoiceProvenance> {
  return apiGet<InvoiceProvenance>(
    `/finance/schools/${schoolId}/invoices/${invoiceId}/provenance`,
  )
}

// ============================================================================
// INVOICE MUTATIONS
// ============================================================================

/**
 * Generate a single invoice.
 *
 * Family-billing (FB): when an active agreement already covers the student
 * for the requested fee types, the backend rejects with
 * 409 `AGREEMENT_ACTIVE` (body carries `agreementId`, `existingInvoiceId`,
 * `coveredFeeTypes`). Pass `opts.overrideAgreement` to bypass the guard and
 * bill from the fee catalog anyway — the service posts
 * `{ ...data, overrideAgreement: true }` on the same route.
 */
export async function generateInvoice(
  schoolId: string,
  data: GenerateInvoiceDto,
  opts?: { overrideAgreement?: boolean },
): Promise<Invoice> {
  const body = opts?.overrideAgreement
    ? { ...data, overrideAgreement: true }
    : data
  return apiPost<Invoice, GenerateInvoiceDto & { overrideAgreement?: boolean }>(
    `/finance/schools/${schoolId}/invoices`,
    body,
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
  errors?: { studentId: string; reason: string }[] | string[]
  /** Sprint C — populated when caller used grades/legacy paths; mirrors resolvedStudentCount on the BE. */
  resolvedStudentCount?: number
}

/**
 * Sprint E — async worker branch on `bulk-generate`.
 *
 * The BE returns 202 + { jobId } when the resolved student count exceeds
 * the sync threshold (currently 25) OR the caller opts in with
 * `?async=true`. Worker creates DRAFT invoices (operator-review by
 * design — operator clicks Issue to dispatch). Poll via
 * `useAsyncBulkJob(schoolId, 'invoices', jobId)` until terminal.
 */
export type BulkGenerateResult =
  | ({ mode: 'sync' } & BulkGenerateInvoiceResponse)
  | { mode: 'async'; jobId: string }

export interface BulkGenerateOptions {
  /**
   * Opt into the async worker path regardless of resolved student count.
   * Sent as `?async=true`. When omitted, the BE picks sync vs async by
   * the configured threshold (>25 students → async).
   */
  async?: boolean
  /**
   * Value for the required `Idempotency-Key` header.
   *
   * The route is `@Idempotent()` on the server, which both REQUIRES the
   * header (a request without it is rejected 400) and uses it to
   * deduplicate a double submit. Callers should therefore keep one key for
   * one submission and reuse it when retrying that same submission —
   * minting a fresh key per attempt satisfies the header check but
   * defeats the deduplication it exists for. Defaults to a new UUID.
   */
  idempotencyKey?: string
}

/**
 * Sprint C Phase 1 — three operator-facing modes (single object schema +
 * .refine() on the BE per `bulkGenerateInvoiceSchema`). All shapes share
 * the base fields; only `studentIds[]` / `gradeLevels[]` differ.
 *
 *   - selectionMode 'students' → flat studentIds[]
 *   - selectionMode 'grades'   → gradeLevels[] (or ['ALL']) → server resolves
 *   - selectionMode omitted    → legacy flat studentIds[]
 */
export interface BulkGenerateInvoiceDto {
  selectionMode?: 'students' | 'grades'
  studentIds?: string[]
  gradeLevels?: string[]
  academicYear: string
  billingPeriod?: string
  feeStructureIds: string[]
  dueDate: string
  notes?: string
  /** Sprint C Phase 1 — operator-supplied ad-hoc line items. Cap 10 BE-side. */
  customLineItems?: Array<{ name: string; amount: number }>
  /** Sprint C Phase 1 — when true, BE pre-filter drops zero-total students. */
  skipZeroTotal?: boolean
}

/**
 * Sprint C kept the simple Promise<BulkGenerateInvoiceResponse> signature
 * because there was only one return shape. Sprint E.5 widens to a
 * discriminated union — the BE now returns either:
 *
 *   - 200 + { generated, skipped, errors, resolvedStudentCount }     (sync)
 *   - 202 + { jobId }                                                (async)
 *
 * The shapes are disjoint, so we use the HTTP status code (not body
 * inspection) to pick the mode. `apiPostWithStatus` returns the raw
 * status alongside the unwrapped body — kept off the standard `apiPost`
 * path to avoid widening every caller's return type for a one-call need.
 */
export async function bulkGenerateInvoices(
  schoolId: string,
  data: BulkGenerateInvoiceDto,
  options: BulkGenerateOptions = {},
): Promise<BulkGenerateResult> {
  const url = `/finance/schools/${schoolId}/invoices/bulk-generate`
  const config = {
    headers: { 'Idempotency-Key': options.idempotencyKey ?? crypto.randomUUID() },
    ...(options.async ? { params: { async: true } } : {}),
  }
  const { status, data: body } = await apiPostWithStatus<
    BulkGenerateInvoiceResponse | { jobId: string },
    BulkGenerateInvoiceDto
  >(url, data, config)
  if (status === 202) {
    return { mode: 'async', jobId: (body as { jobId: string }).jobId }
  }
  return { mode: 'sync', ...(body as BulkGenerateInvoiceResponse) }
}

// ============================================================================
// BULK PREVIEW (Sprint C.6 + Phase 1 segment counters)
// ============================================================================

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
  /**
   * Sprint C Phase 1 — three derivable-segment counters powering the wizard
   * Step 1 rail. Each is optional (best-effort BE-side; undefined when the
   * underlying query fails OR — for studentsNotBilledThisPeriod — when no
   * billingPeriod was supplied). Frontend renders as "—" on undefined.
   */
  studentsWithBalance?: number
  studentsNotBilledThisPeriod?: number
  studentsNewAdmission?: number
  /**
   * Family-billing (FB) — per-student billing-source breakdown so the wizard
   * can flag which students in the batch will be priced via an agreement vs
   * the standard catalog. Optional (best-effort BE-side). The backend emits
   * this under the key `students` (invoices.controller.ts bulk-preview).
   */
  students?: Array<{
    studentId: string
    billingSource: 'standard' | 'agreement' | 'mixed'
    coveredFeeTypes?: string[]
    /**
     * #465 — the requested fee structures this student's agreement replaces
     * and what replaces them, so a batch totals as
     *   catalog(requested NOT suppressed) + agreementAmount
     * instead of pricing agreement-covered students at catalog rates.
     */
    suppressedFeeStructureIds?: string[]
    agreementAmount?: number
    /** The agreement already priced this term — generation will reject. */
    agreementBlocked?: boolean
  }>
  /** #465 — how many students are blocked by the once-per-term guard. */
  agreementBlockedCount?: number
  /**
   * shoaibrain/edforge#477 — how many students no requested fee structure
   * applies to, because their grade is excluded from every one of them.
   * Generation skips these rather than billing them, so they are outside
   * `eligibleCount`. Optional: absent from a backend older than that fix.
   */
  noApplicableFeesCount?: number
}

/**
 * GET /finance/schools/:schoolId/invoices/bulk-preview
 *
 * Read-only — same resolution + duplicate-detection as bulk-generate but
 * NO DDB writes. Query params are CSV strings (NOT repeated array syntax)
 * to keep the route shape consistent with the BE's CSV-based parser.
 *
 * Empty / undefined fields are omitted from the URL so the BE sees only
 * the explicitly-supplied filters.
 */
export async function getBulkPreview(
  schoolId: string,
  params: BulkPreviewParams,
): Promise<BulkPreviewResponse> {
  const q: Record<string, string> = {}
  if (params.selectionMode) q.selectionMode = params.selectionMode
  if (params.studentIds && params.studentIds.length > 0) {
    q.studentIds = params.studentIds.join(',')
  }
  if (params.gradeLevels && params.gradeLevels.length > 0) {
    q.gradeLevels = params.gradeLevels.join(',')
  }
  if (params.feeStructureIds && params.feeStructureIds.length > 0) {
    q.feeStructureIds = params.feeStructureIds.join(',')
  }
  if (params.billingPeriod) q.billingPeriod = params.billingPeriod
  return apiGet<BulkPreviewResponse>(
    `/finance/schools/${schoolId}/invoices/bulk-preview`,
    q,
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
      { responseType: 'blob', headers: { Accept: 'application/pdf' } },
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
  getInvoiceProvenance,
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
