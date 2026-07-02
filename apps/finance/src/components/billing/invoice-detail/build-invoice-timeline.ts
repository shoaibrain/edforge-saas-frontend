/**
 * Derive the invoice Activity timeline from the server-side statusHistory
 * audit trail plus the payment list. Pure — the component maps event kinds
 * to icons/tones/i18n.
 *
 * Falls back to synthesizing created/issued/overdue events from the
 * invoice's own dates when `statusHistory` is absent (older rows).
 */

import type { Invoice, Payment } from '@edforge/types'

export type InvoiceTimelineEventKind =
  | 'created'
  | 'issued'
  | 'overdue'
  | 'payment'
  | 'paid'
  | 'cancelled'
  | 'written_off'

export interface InvoiceTimelineEvent {
  kind: InvoiceTimelineEventKind
  /** ISO timestamp the event happened. */
  at: string
  /** Display name (or user id on older rows) that triggered it, if known. */
  by?: string
  reason?: string
  /** Payment events only. */
  amount?: number
  gateway?: string
  receiptNumber?: string
  paymentId?: string
}

const PAYMENT_LIKE_STATUSES = new Set(['completed', 'refunded', 'partially_refunded'])

function historyEvents(invoice: Invoice): InvoiceTimelineEvent[] {
  const history = invoice.statusHistory ?? []
  const events: InvoiceTimelineEvent[] = []
  for (const entry of history) {
    const base = { at: entry.changedAt, by: entry.changedBy, reason: entry.reason }
    switch (entry.to) {
      case 'draft':
        // Only the creation entry (from null/draft) is timeline-worthy.
        if (entry.from == null) events.push({ kind: 'created', ...base })
        break
      case 'issued':
        events.push({ kind: 'issued', ...base })
        break
      case 'overdue':
        events.push({ kind: 'overdue', ...base })
        break
      case 'paid':
        events.push({ kind: 'paid', ...base })
        break
      case 'cancelled':
        events.push({ kind: 'cancelled', ...base })
        break
      case 'written_off':
        events.push({ kind: 'written_off', ...base })
        break
      case 'partially_paid':
        // The payment event itself (from the payments list) covers this.
        break
    }
  }
  return events
}

function synthesizedEvents(invoice: Invoice): InvoiceTimelineEvent[] {
  const events: InvoiceTimelineEvent[] = []
  if (invoice.createdAt) events.push({ kind: 'created', at: invoice.createdAt })
  if (invoice.issuedDate && invoice.status !== 'draft') {
    // issuedDate is date-only while createdAt is a timestamp — clamp so a
    // same-day issuance never sorts before the creation event.
    const issuedMs = Date.parse(invoice.issuedDate)
    const createdMs = Date.parse(invoice.createdAt)
    const at =
      Number.isFinite(issuedMs) && Number.isFinite(createdMs) && issuedMs < createdMs
        ? invoice.createdAt
        : invoice.issuedDate
    events.push({ kind: 'issued', at })
  }
  if (invoice.status === 'overdue' && invoice.dueDate) {
    events.push({ kind: 'overdue', at: invoice.dueDate })
  }
  if (invoice.status === 'cancelled' && invoice.updatedAt) {
    events.push({ kind: 'cancelled', at: invoice.updatedAt })
  }
  if (invoice.status === 'written_off' && invoice.updatedAt) {
    events.push({ kind: 'written_off', at: invoice.updatedAt })
  }
  return events
}

export function buildInvoiceTimeline(
  invoice: Invoice,
  payments: Payment[] = []
): InvoiceTimelineEvent[] {
  const statusEvents =
    (invoice.statusHistory?.length ?? 0) > 0 ? historyEvents(invoice) : synthesizedEvents(invoice)

  const paymentEvents: InvoiceTimelineEvent[] = payments
    .filter((p) => PAYMENT_LIKE_STATUSES.has(p.status))
    .map((p) => ({
      kind: 'payment' as const,
      at: p.paidAt ?? p.createdAt,
      amount: p.amount,
      gateway: p.gateway,
      receiptNumber: p.receiptNumber ?? undefined,
      paymentId: p.id,
    }))

  // Newest first. Ties (e.g. a full payment and its `paid` transition in the
  // same second) rank the terminal status above the payment that caused it.
  const RANK: Record<InvoiceTimelineEventKind, number> = {
    created: 0,
    issued: 1,
    overdue: 2,
    payment: 3,
    paid: 4,
    cancelled: 4,
    written_off: 4,
  }
  return [...statusEvents, ...paymentEvents].sort((a, b) => {
    const dt = Date.parse(b.at) - Date.parse(a.at)
    if (dt !== 0) return dt
    return RANK[b.kind] - RANK[a.kind]
  })
}
