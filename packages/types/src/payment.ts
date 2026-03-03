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
  currency: 'NPR'
  gateway: PaymentGateway
  gatewayTransactionId?: string // Gateway's own reference
  gatewaySessionId?: string // Session from initiate call
  status: PaymentStatus
  paidAt: string | null // ISO datetime
  paidBy: string | null // userId who initiated
  receiptNumber: string | null
  metadata: Record<string, unknown> // Gateway-specific response data
  refunds: Refund[]
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
  currency: 'NPR'
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
  invoiceId: string
  gateway: 'cash' | 'bank_transfer' | 'cheque'
  amount: number // NPR
  currency: 'NPR'
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
  recentPayments: Array<{
    id: string
    amount: number
    gateway: string
    status: string
    receiptNumber?: string
    paidAt?: string
    createdAt: string
  }>
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
  schoolName: string
  schoolAddress?: string
  schoolPhone?: string
  paidDate: string // ISO date
  amount: number
  currency: 'NPR'
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

// ============================================================================
// CURRENCY FORMATTING
// ============================================================================

/** NPR formatting options */
export interface CurrencyFormatOptions {
  locale?: 'en' | 'ne'
  showSymbol?: boolean // Show "रू" or "NPR"
  decimals?: number // Default 2
}

/**
 * Format an amount as NPR currency string.
 * Uses Nepal's number formatting (commas at lakh/crore positions).
 *
 * Examples:
 *   formatNPR(12500)      → "NPR 12,500.00"
 *   formatNPR(12500, { locale: 'ne', showSymbol: true }) → "रू १२,५००.००"
 *   formatNPR(150000)     → "NPR 1,50,000.00" (lakh grouping)
 */
export function formatNPR(
  amount: number,
  options: CurrencyFormatOptions = {}
): string {
  const { locale = 'en', showSymbol = true, decimals = 2 } = options

  // Format with Nepal-style grouping (##,##,###.##)
  const fixed = Math.abs(amount).toFixed(decimals)
  const [intPart, decPart] = fixed.split('.')

  // Apply lakh/crore grouping: last 3 digits, then groups of 2
  let grouped: string
  if (intPart.length <= 3) {
    grouped = intPart
  } else {
    const last3 = intPart.slice(-3)
    const rest = intPart.slice(0, -3)
    const pairs = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')
    grouped = `${pairs},${last3}`
  }

  // Convert digits to Devanagari for Nepali locale
  let formatted = decPart ? `${grouped}.${decPart}` : grouped
  if (locale === 'ne') {
    formatted = formatted.replace(/[0-9]/g, (d) =>
      String.fromCharCode(0x0966 + Number(d))
    )
  }

  if (amount < 0) formatted = `-${formatted}`

  const symbol = locale === 'ne' ? 'रू' : 'NPR'
  return showSymbol ? `${symbol} ${formatted}` : formatted
}

/**
 * Abbreviated NPR format for dashboard KPI cards.
 * Uses lakh/crore notation (Nepal convention).
 *
 * Examples:
 *   formatNPRShort(12500)      → "NPR 12,500"
 *   formatNPRShort(150000)     → "NPR 1.5 lakh"
 *   formatNPRShort(10000000)   → "NPR 1.0 crore"
 */
export function formatNPRShort(amount: number): string {
  if (amount >= 1_00_00_000) {
    return `NPR ${(amount / 1_00_00_000).toFixed(1)} crore`
  }
  if (amount >= 1_00_000) {
    return `NPR ${(amount / 1_00_000).toFixed(1)} lakh`
  }
  return formatNPR(amount, { decimals: 0 })
}
