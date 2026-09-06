/**
 * Finance Utilities
 *
 * Shared formatters for finance data display across modules.
 */

// ============================================================================
// FEE TYPE FORMATTING
// ============================================================================

const FEE_TYPE_LABELS: Record<string, string> = {
  admission: "Admission fees",
  tuition: "Tuition fees",
  exam: "Exam fees",
  transport: "Transport fees",
  library: "Library fees",
  lab: "Lab fees",
  hostel: "Hostel fees",
  uniform: "Uniform fees",
  miscellaneous: "Miscellaneous fees",
  custom: "Custom fees",
};

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
    type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) + " fees"
  );
}

// ============================================================================
// GATEWAY LABEL FORMATTING
// ============================================================================

const GATEWAY_LABELS: Record<string, string> = {
  cash: "Cash",
  cheque: "Cheque",
  bank_transfer: "Bank transfer",
  esewa: "eSewa",
  khalti: "Khalti",
  fonepay: "FonePay",
  connectips: "ConnectIPS",
  stripe: "Stripe",
};

/**
 * Format a payment gateway key into a display label.
 */
export function formatGatewayLabel(gateway: string): string {
  return (
    GATEWAY_LABELS[gateway] ??
    gateway.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

// ============================================================================
// INVOICE STATUS FORMATTING
// ============================================================================

const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  issued: "Issued",
  partially_paid: "Partially paid",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
  written_off: "Written off",
};

/**
 * Format an invoice status key into a display label.
 */
export function formatInvoiceStatus(status: string): string {
  return (
    INVOICE_STATUS_LABELS[status] ??
    status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
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
export interface RelativeDateFormatOptions {
  locale?: string;
  today?: string;
  yesterday?: string;
  daysAgo?: (days: number) => string;
}

export function formatRelativeDate(
  dateString: string,
  options: RelativeDateFormatOptions = {},
): string {
  // A date-only value names a calendar day. It has no clock time, so it is
  // parsed as LOCAL midnight and rendered without one (#349).
  //
  // Both halves used to be wrong. The zone test below is anchored on `T` now
  // because `/[Z+-]\d{0,2}:?\d{0,2}$/` matched the date's own "-06", so
  // "2026-09-06" was treated as already zoned, parsed as UTC midnight, and
  // then read back through local getters: west of UTC that is the previous
  // evening. A payment recorded today displayed as "Yesterday · 7:00 PM".
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  const hasZone = /T.*(?:Z|[+-]\d{2}:?\d{2})$/.test(dateString);
  const normalized = isDateOnly
    ? `${dateString}T00:00:00`
    : hasZone
      ? dateString
      : dateString + "Z";
  const date = new Date(normalized);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.floor(
    (today.getTime() - eventDay.getTime()) / (1000 * 60 * 60 * 24),
  );

  const locale = options.locale?.startsWith("ne") ? "ne-NP" : "en-US";
  const time = date.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  // A date-only value carries no time, so none is shown.
  const withTime = (label: string) => (isDateOnly ? label : `${label} · ${time}`);

  if (diffDays === 0) return withTime(options.today ?? "Today");
  if (diffDays === 1) return withTime(options.yesterday ?? "Yesterday");
  if (diffDays < 7)
    return withTime(options.daysAgo?.(diffDays) ?? `${diffDays} days ago`);

  const monthDay = date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
  return withTime(monthDay);
}
