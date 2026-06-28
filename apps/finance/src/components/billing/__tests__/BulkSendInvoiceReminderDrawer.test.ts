import { describe, it, expect } from 'vitest'
import type { Invoice, InvoiceStatus } from '@edforge/types'
import { splitEligibleReminders } from '../BulkSendInvoiceReminderDrawer'

function inv(id: string, status: InvoiceStatus): Invoice {
  return {
    id,
    invoiceNumber: `INV-${id}`,
    status,
    schoolId: 's',
    studentId: 'stu',
    grandTotal: 100,
    subtotal: 100,
    taxTotal: 0,
    amountPaid: 0,
    balanceDue: 100,
    lineItems: [],
    issuedDate: null,
    dueDate: '2026-07-01',
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  } as unknown as Invoice
}

describe('splitEligibleReminders', () => {
  it('keeps issued / partially_paid / overdue rows', () => {
    const { eligible, skipped } = splitEligibleReminders([
      inv('a', 'issued'),
      inv('b', 'partially_paid'),
      inv('c', 'overdue'),
    ])
    expect(eligible.map((x) => x.id).sort()).toEqual(['a', 'b', 'c'])
    expect(skipped).toHaveLength(0)
  })

  it('skips draft / paid / cancelled / written_off with status reason', () => {
    const { eligible, skipped } = splitEligibleReminders([
      inv('a', 'issued'),
      inv('b', 'draft'),
      inv('c', 'paid'),
      inv('d', 'cancelled'),
      inv('e', 'written_off'),
    ])
    expect(eligible.map((x) => x.id)).toEqual(['a'])
    expect(skipped.map((s) => s.invoice.id).sort()).toEqual(['b', 'c', 'd', 'e'])
    expect(skipped.every((s) => /not outstanding/.test(s.reason))).toBe(true)
  })

  it('empty input → empty output', () => {
    expect(splitEligibleReminders([])).toEqual({ eligible: [], skipped: [] })
  })
})
