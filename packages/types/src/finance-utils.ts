/**
 * Finance Utilities
 *
 * Shared formatters for finance data display across modules.
 */

// ============================================================================
// FEE TYPE FORMATTING
// ============================================================================

const FEE_TYPE_LABELS: Record<string, string> = {
  admission: 'Admission fees',
  tuition: 'Tuition fees',
  exam: 'Exam fees',
  transport: 'Transport fees',
  library: 'Library fees',
  lab: 'Lab fees',
  hostel: 'Hostel fees',
  uniform: 'Uniform fees',
  miscellaneous: 'Miscellaneous fees',
  custom: 'Custom fees',
}

/**
 * Format a fee type key into a human-readable label.
 *
 * Examples:
 *   formatFeeType('admission')  → "Admission fees"
 *   formatFeeType('lab')        → "Lab fees"
 *   formatFeeType('custom_fee') → "Custom Fee fees"
 */
export function formatFeeType(type: string): string {
  return (
    FEE_TYPE_LABELS[type] ??
    type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) + ' fees'
  )
}

// ============================================================================
// GATEWAY LABEL FORMATTING
// ============================================================================

const GATEWAY_LABELS: Record<string, string> = {
  cash: 'Cash',
  cheque: 'Cheque',
  bank_transfer: 'Bank transfer',
  esewa: 'eSewa',
  khalti: 'Khalti',
  fonepay: 'FonePay',
  connectips: 'ConnectIPS',
  stripe: 'Stripe',
}

/**
 * Format a payment gateway key into a display label.
 */
export function formatGatewayLabel(gateway: string): string {
  return (
    GATEWAY_LABELS[gateway] ??
    gateway.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

// ============================================================================
// INVOICE STATUS FORMATTING
// ============================================================================

const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  issued: 'Issued',
  partially_paid: 'Partially paid',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
  written_off: 'Written off',
}

/**
 * Format an invoice status key into a display label.
 */
export function formatInvoiceStatus(status: string): string {
  return (
    INVOICE_STATUS_LABELS[status] ??
    status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

// ============================================================================
// RELATIVE DATE FORMATTING
// ============================================================================

/**
 * Format an ISO datetime string as a relative date.
 *
 * Examples:
 *   formatRelativeDate('2026-03-19T13:54:00Z') → "Today · 1:54 PM"
 *   formatRelativeDate('2026-03-18T10:00:00Z') → "Yesterday · 10:00 AM"
 *   formatRelativeDate('2026-03-15T09:30:00Z') → "Mar 15 · 9:30 AM"
 */
export function formatRelativeDate(dateString: string): string {
  // Normalize: treat naive ISO strings (no timezone) as UTC
  const normalized = /[Z+\-]\d{0,2}:?\d{0,2}$/.test(dateString) ? dateString : dateString + 'Z'
  const date = new Date(normalized)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const eventDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  )
  const diffDays = Math.floor(
    (today.getTime() - eventDay.getTime()) / (1000 * 60 * 60 * 24)
  )

  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  if (diffDays === 0) return `Today · ${time}`
  if (diffDays === 1) return `Yesterday · ${time}`
  if (diffDays < 7) return `${diffDays} days ago · ${time}`

  const monthDay = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  return `${monthDay} · ${time}`
}
