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
  // Family-billing (FB) — agreement provenance on a per-line basis. Set when
  // the line was billed via an active agreement rather than the fee catalog.
  agreementId?: string
  /** Fee-structure ids this agreement line suppressed (catalog overrides). */
  suppressedFeeStructureIds?: string[]
  /** Discount-rule id that produced this line's discount, when rule-driven. */
  discountRuleId?: string
}

/**
 * One status transition on an invoice, recorded server-side. `from` is null
 * for the creation entry on older rows; `changedBy` is a display name or
 * user id depending on backend resolution.
 */
export interface InvoiceStatusHistoryEntry {
  from: InvoiceStatus | null
  to: InvoiceStatus
  changedAt: string // ISO datetime
  changedBy?: string
  reason?: string
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
  /** Status-transition audit trail; present on detail reads, absent on older rows. */
  statusHistory?: InvoiceStatusHistoryEntry[]
  notes?: string
  // Family-billing (FB) — how this invoice was priced. `catalog` = standard
  // fee-structure billing; `agreement` = priced via an active agreement.
  feeOverrideMode?: 'catalog' | 'agreement'
  /** The agreement that priced this invoice, when feeOverrideMode === 'agreement'. */
  agreementId?: string
  /** The agreement version in effect at invoice issue time. */
  agreementVersion?: number
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
  /**
   * Sprint B.1 — gradeLevel filter routes the backend through GSI14.
   * Snapshot value captured at invoice issue time (immutable through
   * student promotion).
   */
  gradeLevel?: string
  /**
   * Family-billing (FB) — filter by how invoices were priced.
   * `standard` = fee-catalog only, `agreement` = agreement-priced. The
   * backend accepts exactly these two values (anything else is a 400).
   */
  billingSource?: 'standard' | 'agreement'
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

// ============================================================================
// FAMILY-BILLING AGREEMENTS (finance)
// ============================================================================

/**
 * Agreement lifecycle. A draft is edited freely; activation is guarded
 * (open-invoice / overlap conflicts). A superseded agreement is one whose
 * successor version was activated. No `isActive` — lifecycle is `status`.
 */
export type AgreementStatus =
  | 'draft'
  | 'active'
  | 'expired'
  | 'cancelled'
  | 'superseded'

/** Fixed-total vs per-student pricing model for an agreement. */
export type AgreementType = 'fixed_total' | 'per_student'

/** The payer on an agreement (family primary contact, or an ad-hoc payer). */
export interface AgreementPayer {
  name: string
  phone?: string
  email?: string
}

/** Fixed-total terms: one total, allocated across the covered students. */
export interface FixedTotalTerms {
  agreementType: 'fixed_total'
  totalAmount: number
  allocation: Array<{
    studentId: string
    amount: number
  }>
}

/** Per-student terms: an explicit line per student (optionally per fee type). */
export interface PerStudentTerms {
  agreementType: 'per_student'
  lines: Array<{
    studentId: string
    feeType?: string
    feeStructureId?: string
    amount: number
  }>
}

/** Discriminated union of the two supported agreement pricing shapes. */
export type AgreementTerms = FixedTotalTerms | PerStudentTerms

/** One status transition on an agreement, recorded server-side. */
export interface AgreementStatusHistoryEntry {
  from: AgreementStatus
  to: AgreementStatus
  changedAt: string
  changedBy: string
  reason?: string
}

/**
 * A family-billing agreement. Versioned: activating a new version supersedes
 * the prior one (`versionParentId` chains the lineage). No `isActive`.
 */
export interface Agreement {
  id: string
  schoolId: string
  familyId?: string
  title: string
  payer: AgreementPayer
  studentIds: string[]
  agreementType: AgreementType
  terms: AgreementTerms
  coveredFeeTypes: string[]
  billingFrequency: string
  currency: string
  effectiveFrom: string
  effectiveTo: string
  status: AgreementStatus
  version: number
  versionParentId?: string
  approvedBy?: string
  notes?: string
  statusHistory: AgreementStatusHistoryEntry[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

/** Version history for an agreement (GET .../agreements/:id/versions). */
export type AgreementVersion = Agreement

/**
 * Create-draft body for POST .../agreements. No server-owned fields
 * (id/status/version/statusHistory/createdBy/timestamps). `currency` is
 * optional — the server defaults it from tenant workspace settings.
 */
export interface CreateAgreementDto {
  familyId?: string
  title: string
  payer: AgreementPayer
  studentIds: string[]
  agreementType: AgreementType
  terms: AgreementTerms
  coveredFeeTypes: string[]
  billingFrequency: string
  currency?: string
  effectiveFrom: string
  effectiveTo: string
  notes?: string
}

/** Body for POST .../agreements/:id/activate. */
export interface ActivateAgreementDto {
  version: number
  /** Acknowledge (and proceed past) an open-invoice conflict on activation. */
  acknowledgeOpenInvoices?: boolean
}

/** Body for POST .../agreements/:id/cancel. */
export interface CancelAgreementDto {
  version: number
  reason?: string
}

/** Query filter for the agreements list. */
export interface AgreementFilterDto {
  status?: AgreementStatus
  limit?: number
  cursor?: string
}

// ============================================================================
// INVOICE PROVENANCE (finance) — where each invoice line came from
// ============================================================================

/** The origin of a single provenance line. */
export type ProvenanceLineSource = 'fee_structure' | 'agreement' | 'custom'

/** One line of an invoice's provenance record. */
export interface InvoiceProvenanceLine {
  lineId: string
  description: string
  source: ProvenanceLineSource
  feeStructureId?: string
  feeStructureVersion?: number
  feeStructureName?: string
  agreementId?: string
  agreementVersion?: number
  agreementTitle?: string
  /** Catalog fee structures this agreement line suppressed. */
  suppressedFeeStructures?: Array<{
    id: string
    name: string
    feeType: string
  }>
  discount?: {
    amount: number
    reason?: string
    discountRuleId?: string
    ruleName?: string
  }
}

/**
 * Full provenance for an invoice — GET .../invoices/:invoiceId/provenance.
 * Explains, line by line, whether pricing came from the catalog, an
 * agreement, or a custom line, plus any operator override that bypassed a
 * fee structure at generate time.
 */
export interface InvoiceProvenance {
  invoiceId: string
  invoiceNumber: string
  feeOverrideMode?: 'catalog' | 'agreement'
  agreementId?: string
  agreementVersion?: number
  lines: InvoiceProvenanceLine[]
  overrides?: Array<{
    agreementId: string
    agreementTitle?: string
    requestedFeeStructureIds: string[]
    bypassedAt?: string
    operatorId?: string
  }>
}
