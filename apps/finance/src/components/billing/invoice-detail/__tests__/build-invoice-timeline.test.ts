import { describe, it, expect } from 'vitest'
import type { Invoice, Payment } from '@edforge/types'
import { buildInvoiceTimeline } from '../build-invoice-timeline'

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 'inv-1',
    invoiceNumber: 'INV-420-2605-0157',
    studentAccountId: 'sa-1',
    studentId: 'stu-1',
    studentName: 'Aakriti Sah',
    schoolId: 'sch-1',
    schoolName: 'Test School',
    academicYear: '2083 BS',
    billingPeriod: 'Admission',
    lineItems: [],
    subtotal: 20000,
    taxTotal: 0,
    discountTotal: 0,
    grandTotal: 20000,
    amountPaid: 0,
    amountDue: 20000,
    currency: 'NPR',
    dueDate: '2026-05-14',
    issuedDate: '2026-05-12',
    status: 'issued',
    createdAt: '2026-05-12T08:00:00Z',
    updatedAt: '2026-05-12T08:00:00Z',
    ...overrides,
  }
}

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 'pay-1',
    invoiceId: 'inv-1',
    studentAccountId: 'sa-1',
    schoolId: 'sch-1',
    amount: 8000,
    currency: 'NPR',
    gateway: 'cash',
    status: 'completed',
    paidAt: '2026-06-08T10:00:00Z',
    paidBy: 'user-1',
    receiptNumber: 'RCP-420-2606-0002',
    metadata: {},
    refunds: [],
    createdAt: '2026-06-08T10:00:00Z',
    updatedAt: '2026-06-08T10:00:00Z',
    ...overrides,
  } as Payment
}

describe('buildInvoiceTimeline', () => {
  it('merges statusHistory and payments, newest first', () => {
    const invoice = makeInvoice({
      status: 'partially_paid',
      statusHistory: [
        { from: null, to: 'draft', changedAt: '2026-05-12T08:00:00Z', changedBy: 'Sita Adhikari' },
        { from: 'draft', to: 'issued', changedAt: '2026-05-12T09:00:00Z', changedBy: 'Sita Adhikari' },
        { from: 'issued', to: 'overdue', changedAt: '2026-05-15T00:00:00Z' },
        { from: 'overdue', to: 'partially_paid', changedAt: '2026-06-08T10:00:00Z' },
      ],
    })
    const events = buildInvoiceTimeline(invoice, [makePayment()])

    expect(events.map((e) => e.kind)).toEqual(['payment', 'overdue', 'issued', 'created'])
    expect(events[0].amount).toBe(8000)
    expect(events[0].receiptNumber).toBe('RCP-420-2606-0002')
    expect(events[3].by).toBe('Sita Adhikari')
  })

  it('skips partially_paid transitions (the payment event covers them)', () => {
    const invoice = makeInvoice({
      statusHistory: [
        { from: 'issued', to: 'partially_paid', changedAt: '2026-06-08T10:00:00Z' },
      ],
    })
    expect(buildInvoiceTimeline(invoice, [])).toEqual([])
  })

  it('ranks a terminal paid transition above the payment that caused it on timestamp ties', () => {
    const invoice = makeInvoice({
      status: 'paid',
      statusHistory: [
        { from: 'issued', to: 'paid', changedAt: '2026-06-08T10:00:00Z' },
      ],
    })
    const events = buildInvoiceTimeline(invoice, [makePayment({ amount: 20000 })])
    expect(events.map((e) => e.kind)).toEqual(['paid', 'payment'])
  })

  it('synthesizes created/issued/overdue when statusHistory is absent', () => {
    const invoice = makeInvoice({ status: 'overdue' })
    const events = buildInvoiceTimeline(invoice, [])
    expect(events.map((e) => e.kind)).toEqual(['overdue', 'issued', 'created'])
    expect(events[2].at).toBe('2026-05-12T08:00:00Z')
  })

  it('synthesizes a cancelled event from updatedAt when history is absent', () => {
    const invoice = makeInvoice({ status: 'cancelled', updatedAt: '2026-05-20T12:00:00Z' })
    const events = buildInvoiceTimeline(invoice, [])
    expect(events[0]).toMatchObject({ kind: 'cancelled', at: '2026-05-20T12:00:00Z' })
  })

  it('propagates the cancel reason from statusHistory', () => {
    const invoice = makeInvoice({
      status: 'cancelled',
      statusHistory: [
        {
          from: 'issued',
          to: 'cancelled',
          changedAt: '2026-05-20T12:00:00Z',
          changedBy: 'Sita Adhikari',
          reason: 'Duplicate of INV-420-2605-0158',
        },
      ],
    })
    const events = buildInvoiceTimeline(invoice, [])
    expect(events[0]).toMatchObject({
      kind: 'cancelled',
      by: 'Sita Adhikari',
      reason: 'Duplicate of INV-420-2605-0158',
    })
  })

  it('ignores non-completed payments', () => {
    const invoice = makeInvoice({ statusHistory: [] })
    const events = buildInvoiceTimeline(invoice, [
      makePayment({ status: 'pending' } as Partial<Payment>),
      makePayment({ id: 'pay-2', status: 'failed' } as Partial<Payment>),
    ])
    expect(events.filter((e) => e.kind === 'payment')).toEqual([])
  })
})
