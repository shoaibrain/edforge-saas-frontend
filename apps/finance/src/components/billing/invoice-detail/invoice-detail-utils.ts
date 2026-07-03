/**
 * Pure helpers shared across the invoice-detail components.
 */

import { toBSString } from '@edforge/date-utils'
import type { Invoice, InvoiceStatus } from '@edforge/types'
import type { ResolvedSettings } from '@edforge/config/resolved-settings'

/** Statuses on which a payment can be recorded / a reminder makes sense. */
export const PAYABLE_STATUSES: ReadonlyArray<InvoiceStatus> = [
  'issued',
  'partially_paid',
  'overdue',
]

export function isPayable(status: InvoiceStatus): boolean {
  return PAYABLE_STATUSES.includes(status)
}

/**
 * Whole days past the due date, for the "Nd late" chip and the red
 * amount-due treatment. 0 for settled/cancelled/draft invoices, unparsable
 * dates, or anything not yet due.
 */
export function overdueDaysOf(invoice: Invoice, now: Date = new Date()): number {
  if (!invoice.dueDate) return 0
  if (!isPayable(invoice.status)) return 0
  if ((invoice.amountDue ?? 0) <= 0) return 0
  const due = Date.parse(invoice.dueDate)
  if (!Number.isFinite(due)) return 0
  const days = Math.floor((now.getTime() - due) / 86_400_000)
  return Math.max(0, days)
}

/**
 * Secondary BS date line ("2083/01/31") for AD-primary displays. Null when
 * the tenant doesn't use dual Bikram Sambat display — callers skip the line.
 */
export function bsSubOf(
  dateStr: string | null | undefined,
  settings: ResolvedSettings
): string | null {
  if (!dateStr) return null
  if (settings.calendarSystem !== 'bikram_sambat' || !settings.enableDualDateDisplay) return null
  try {
    return toBSString(dateStr)
  } catch {
    return null
  }
}
