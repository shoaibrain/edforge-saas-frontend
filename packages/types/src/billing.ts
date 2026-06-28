/**
 * Billing Domain Types
 *
 * Ed-Fi aligned billing types for the school fee collection system.
 * Covers fee structures, student accounts, invoices, and line items.
 *
 * Design principles:
 * - NPR currency with paisa precision (2 decimal places)
 * - Multi-tenant: every entity scoped to schoolId + tenantId
 * - Invoice lifecycle: draft → issued → partially_paid → paid → overdue → cancelled → written_off
 * - Line-item-level tax & discount for Nepal PAN/VAT compliance
 */

// ============================================================================
// FEE STRUCTURE
// ============================================================================

/** Fee categories aligned with Nepal school fee taxonomy */
export type FeeType =
  | 'tuition'
  | 'admission'
  | 'exam'
  | 'transport'
  | 'library'
  | 'lab'
  | 'hostel'
  | 'uniform'
  | 'miscellaneous'
  | 'custom'

/** How often the fee is charged */
export type FeeFrequency = 'one_time' | 'monthly' | 'quarterly' | 'annual'

/** Nepal tax registration types */
export type TaxType = 'PAN' | 'VAT' | 'none'

/**
 * Fee structure defines a billable item a school charges.
 * Admin configures these; the system generates invoices from them.
 */
export interface FeeStructure {
  id: string
  schoolId: string
  name: string
  description?: string
  academicYear: string
  academicYearId: string
  feeType: FeeType
  amount: number // NPR, 2 decimal precision
  currency: string
  taxRate: number // Percentage (e.g. 13 for 13% VAT). 0 if exempt.
  taxType: TaxType
  frequency: FeeFrequency
  gradeLevels: string[] // Which grades this applies to (empty = all)
  isActive: boolean
  autoApplyOnEnrollment?: boolean
  proRateOnMidTermEntry?: boolean
  effectiveFrom: string // ISO date
  effectiveTo?: string // ISO date, null = indefinite
  version?: number
  createdAt: string
  updatedAt: string
}

export interface CreateFeeStructureDto {
  name: string
  description?: string
  academicYear: string
  academicYearId: string
  feeType: FeeType
  amount: number
  currency: string
  taxRate?: number
  taxType?: TaxType
  frequency: FeeFrequency
  gradeLevels?: string[]
  autoApplyOnEnrollment?: boolean
  proRateOnMidTermEntry?: boolean
  effectiveFrom: string
  effectiveTo?: string
}

export interface UpdateFeeStructureDto {
  name?: string
  description?: string
  amount?: number
  taxRate?: number
  taxType?: TaxType
  frequency?: FeeFrequency
  gradeLevels?: string[]
  isActive?: boolean
  effectiveFrom?: string
  effectiveTo?: string
}

// ============================================================================
// STUDENT ACCOUNT
// ============================================================================

/**
 * Tracks a student's financial ledger within a school.
 * One account per student per school.
 */
export interface StudentAccount {
  id: string
  studentId: string
  schoolId: string
  studentName: string
  balance: number // Current outstanding balance (positive = owes money)
  totalPaid: number // Lifetime total paid
  lastPaymentDate: string | null
  createdAt: string
  updatedAt: string
  // Pilot Onboarding Hardening PD.1.1 + PD.1.6 — opening-balance fields.
  // Present only when the operator has set a previous-dues / opening balance.
  openingBalance?: number
  openingBalanceAsOf?: string // YYYY-MM-DD
  openingBalanceNote?: string
  // Server-computed: openingBalance − Σ(payment allocations against opening).
  openingBalanceRemaining?: number
  // PD.1.6 mapper exposes "last set" attribution for the revision UX.
  openingBalanceLastSetAt?: string
  openingBalanceLastSetBy?: string
}

/**
 * Request body for `PUT /finance/schools/:schoolId/student-accounts/:accountId/opening-balance`.
 * Mirrors `setOpeningBalanceSchema` in @aibrains/shared-types 0.86.0+.
 */
export interface SetOpeningBalanceDto {
  amount: number // ≥ 0
  asOf: string // YYYY-MM-DD, ≤ today
  note?: string // ≤ 500 chars
}

export interface SetOpeningBalanceResponse {
  account: StudentAccount
  ledgerEntryId: string | null
  isRevision: boolean
}

// ============================================================================
// INVOICE
// ============================================================================

export type InvoiceStatus =
  | 'draft'
  | 'issued'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'written_off'

export interface InvoiceLineItem {
  id: string
  feeStructureId: string
  description: string
  amount: number // Unit price NPR
  quantity: number
  discount: number // Flat discount NPR
  discountReason?: string
  taxRate: number // Percentage
  taxAmount: number // Computed: (amount * quantity - discount) * taxRate / 100
  total: number // Computed: amount * quantity - discount + taxAmount
}

/**
 * Invoice represents a bill sent to a student/parent.
 * Contains line items, supports partial payments, and tracks status.
 */
export interface Invoice {
  id: string
  invoiceNumber: string // Human-readable sequential number
  studentAccountId: string
  studentId: string
  studentName: string
  schoolId: string
  schoolName: string
  academicYear: string
  billingPeriod?: string // e.g. "2082 Baisakh" or "2025-04"
  lineItems: InvoiceLineItem[]
  subtotal: number // Sum of (amount * quantity) before tax/discount
  taxTotal: number // Sum of all taxAmount
  discountTotal: number // Sum of all discount
  grandTotal: number // subtotal - discountTotal + taxTotal
  amountPaid: number // How much has been paid so far
  amountDue: number // grandTotal - amountPaid
  currency: string
  dueDate: string // ISO date
  issuedDate: string // ISO date
  status: InvoiceStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface GenerateInvoiceDto {
  studentId: string
  academicYear: string
  billingPeriod?: string
  feeStructureIds: string[] // Which fees to include
  dueDate: string
  notes?: string
  discounts?: Array<{
    feeStructureId: string
    amount: number
    reason?: string
  }>
}

export interface InvoiceFilterDto {
  status?: InvoiceStatus | InvoiceStatus[]
  studentId?: string
  academicYear?: string
  /** Server-side cursor pagination — prefer over deprecated page/pageSize. */
  limit?: number
  cursor?: string
}

export interface UpdateInvoiceDto {
  status?: InvoiceStatus
  notes?: string
  dueDate?: string
  discounts?: Array<{
    lineItemId: string
    amount: number
    reason?: string
  }>
}

// ============================================================================
// STUDENT ACCOUNT LEDGER
// ============================================================================

export type LedgerEntryType = 'invoice' | 'payment' | 'refund' | 'adjustment' | 'write_off'

export interface StudentLedgerEntry {
  id: string
  studentAccountId: string
  entryType: LedgerEntryType
  referenceId: string // invoiceId or paymentId
  description: string
  debit: number // Amount charged
  credit: number // Amount paid/refunded
  balance: number // Running balance after this entry
  date: string
  createdAt: string
}
