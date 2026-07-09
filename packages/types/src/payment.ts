/**
 * Payment Domain Types
 *
 * Gateway-agnostic payment types supporting eSewa, Khalti, and future gateways.
 * The frontend NEVER handles gateway credentials — all secrets stay server-side.
 *
 * Payment lifecycle: pending → processing → completed | failed | cancelled → refunded
 *
 * Security:
 * - PaymentGatewayConfig.credentials is NEVER sent to the client
 * - PaymentGatewayPublicConfig is the client-safe projection
 * - All payment initiation goes through EdForge backend, never direct to gateway
 * - Idempotency via paymentSessionId prevents double-charge
 */

// ============================================================================
// PAYMENT GATEWAY
// ============================================================================

/** Supported payment gateways */
export type PaymentGateway =
  | 'esewa'
  | 'khalti'
  | 'fonepay'
  | 'connectips'
  | 'stripe'
  | 'cash'
  | 'bank_transfer'
  | 'cheque'

/** Manual (offline) payment methods that don't require gateway redirect */
export const OFFLINE_GATEWAYS: ReadonlySet<PaymentGateway> = new Set([
  'cash',
  'bank_transfer',
  'cheque',
])

/**
 * Public-facing gateway config — safe to send to browser.
 * Credentials are NEVER included.
 */
export interface PaymentGatewayPublicConfig {
  id: string
  schoolId: string
  gateway: PaymentGateway
  isEnabled: boolean
  isTestMode: boolean
  displayName: string
  displayOrder: number
}

/**
 * Full gateway config — admin-only, credentials masked after save.
 * The server returns `****` for credential values after initial save.
 */
export interface PaymentGatewayConfig extends PaymentGatewayPublicConfig {
  /** Gateway-specific credential fields. Values masked as `****` in API responses. */
  credentials: Record<string, string>
}

export interface SaveGatewayConfigDto {
  isEnabled: boolean
  isTestMode: boolean
  displayName?: string
  displayOrder?: number
  credentials: Record<string, string>
}

// ============================================================================
// PAYMENT
// ============================================================================

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded'

export interface Payment {
  id: string
  invoiceId: string
  studentAccountId: string
  schoolId: string
  amount: number // NPR
  currency: string
  gateway: PaymentGateway
  gatewayTransactionId?: string // Gateway's own reference
  gatewaySessionId?: string // Session from initiate call
  status: PaymentStatus
  paidAt: string | null // ISO datetime
  paidBy: string | null // userId who initiated
  receiptNumber: string | null
  metadata: Record<string, unknown> // Gateway-specific response data
  refunds: Refund[]
  studentName?: string // Denormalized from invoice for display
  invoiceNumber?: string // Denormalized from invoice for display
  createdAt: string
  updatedAt: string
}

export interface Refund {
  id: string
  paymentId: string
  amount: number
  reason: string
  gatewayRefundId?: string
  status: 'pending' | 'completed' | 'failed'
  refundedAt: string | null
  createdAt: string
}

// ============================================================================
// PAYMENT FLOW — API REQUEST / RESPONSE TYPES
// ============================================================================

/** Frontend sends this to initiate a gateway payment */
export interface InitiatePaymentRequest {
  invoiceId: string
  gateway: PaymentGateway
  amount: number // NPR — must match invoice amountDue (server validates)
  currency: string
  returnUrl: string // Frontend callback URL for success/failure
  cancelUrl: string // Frontend cancel URL
}

/** Backend responds with a redirect URL to the gateway's hosted payment page */
export interface InitiatePaymentResponse {
  paymentSessionId: string
  redirectUrl: string // Gateway payment page URL
  expiresAt: string // Session TTL (ISO datetime)
  /** For gateways that require form POST (e.g. eSewa), the hidden form fields */
  formData?: Record<string, string>
  /** 'redirect' = simple URL redirect (Khalti), 'form_post' = hidden form auto-submit (eSewa) */
  method: 'redirect' | 'form_post'
}

/** Frontend calls this on callback to verify payment status */
export interface VerifyPaymentResponse {
  payment: Payment
  invoice: {
    id: string
    invoiceNumber: string
    status: string
    amountDue: number
    grandTotal: number
  }
  receipt: Receipt | null // null if payment failed
  status: 'completed' | 'failed' | 'cancelled'
}

// ============================================================================
// RECORD MANUAL PAYMENT (cash, bank_transfer, cheque)
// ============================================================================

export interface RecordManualPaymentDto {
  /**
   * Single-target payment. Optional now that family-billing supports a
   * multi-target `applications[]` alternative — exactly one of `invoiceId`
   * or `applications` must be present (server-validated).
   */
  invoiceId?: string
  /**
   * Family-billing (FB) — multi-target application: split one payment across
   * 2..20 distinct invoices (typically the open invoices of a family's
   * students). Alternative to `invoiceId`; same /manual endpoint.
   */
  applications?: Array<{
    invoiceId: string
    amount: number
  }>
  /** Family the payment is applied against, when using `applications[]`. */
  familyId?: string
  gateway: 'cash' | 'bank_transfer' | 'cheque'
  amount: number // NPR
  /**
   * Optional — the backend always inherits currency from the referenced
   * invoice(s) and rejects any mismatch (`PAYMENT_CURRENCY_MISMATCH`).
   * Clients should omit it (mirrors `recordManualPaymentSchema`).
   */
  currency?: string
  referenceNumber?: string // Bank ref / cheque number
  notes?: string
  paidDate?: string // ISO date, defaults to today on server
  idempotencyKey?: string // UUID to prevent double-record
}

// ============================================================================
// VOID / REFUND
// ============================================================================

export interface VoidPaymentDto {
  reason: string
}

export interface CreateRefundDto {
  amount: number
  reason: string
}

// ============================================================================
// PAYMENT FILTER
// ============================================================================

export interface PaymentFilterDto {
  status?: PaymentStatus | PaymentStatus[]
  gateway?: PaymentGateway
  invoiceId?: string
  studentId?: string
  dateFrom?: string
  dateTo?: string
}

// ============================================================================
// DASHBOARD SUMMARY
// ============================================================================

export interface DashboardSummary {
  totalInvoiced: number
  totalCollected: number
  outstanding: number
  overdue: number
  collectionRate: number // 0-100
  invoicesByStatus: Record<string, number>
  paymentsByGateway: Record<string, number>
  byFeeType: Array<{
    feeType: string
    invoiceCount: number
    totalAmount: number
    collectedAmount: number
  }>
  agingReport: Array<{
    label: string
    minDays: number
    maxDays: number | null
    count: number
    amount: number
  }>
  monthlyCollections: Array<{
    month: string
    collected: number
    invoiced: number
    paymentCount: number
  }>
  byGradeLevel: Array<{
    gradeLevel: string
    invoiceCount: number
    totalInvoiced: number
    totalCollected: number
    outstanding: number
  }>
  recentPayments: Array<{
    id: string
    amount: number
    gateway: string
    status: string
    receiptNumber?: string
    paidAt?: string
    createdAt: string
  }>
  recentInvoices: Array<{
    id: string
    invoiceNumber: string
    studentName: string
    grandTotal: number
    amountDue: number
    status: string
    issuedDate: string
    createdAt: string
  }>
  /**
   * Family-billing (FB) — agreement-coverage rollup for the dashboard.
   * Optional: absent until agreements exist for the school.
   */
  agreementCoverage?: {
    studentsCovered: number
    activeAgreements: number
    invoicedViaAgreement: {
      count: number
      amount: number
    }
  }
}

// ============================================================================
// RECEIPT
// ============================================================================

/**
 * Receipt is a read-only snapshot generated after successful payment.
 * Includes all data needed for print/PDF without additional API calls.
 */
export interface Receipt {
  receiptNumber: string
  paymentId: string
  invoiceNumber: string
  transactionId: string // Gateway transaction ID
  studentName: string
  studentId: string
  studentNumber?: string // School's operator-facing roll number — primary on-receipt identifier
  emisStudentId?: string // CEHRD/IEMIS government identifier — secondary, for official reconciliation
  schoolName: string
  schoolAddress?: string
  schoolPhone?: string
  paidDate: string // ISO date
  amount: number
  currency: string
  gateway: PaymentGateway
  gatewayDisplayName: string
  lineItems: Array<{
    description: string
    amount: number
    taxAmount: number
    total: number
  }>
  subtotal: number
  taxTotal: number
  discountTotal: number
  grandTotal: number
  taxBreakdown: {
    panNumber?: string // School's PAN
    vatNumber?: string // School's VAT
    taxableAmount: number
    taxAmount: number
  }
  paidBy: string // Name of person who paid
  notes?: string
}

