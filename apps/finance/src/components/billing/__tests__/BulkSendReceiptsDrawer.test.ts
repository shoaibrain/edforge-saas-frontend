import { describe, it, expect } from 'vitest'
import type { Payment } from '@edforge/types'
import { splitEligibleReceipts } from '../BulkSendReceiptsDrawer'

function p(id: string, overrides: Partial<Payment> = {}): Payment {
  return {
    id,
    studentName: id,
    status: 'completed',
    receiptNumber: `R-${id}`,
    amount: 100,
    schoolId: 's',
    invoiceId: 'inv',
    studentId: 'stu',
    paymentDate: '2026-06-01',
    gateway: 'cash',
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
    ...overrides,
  } as Payment
}

describe('splitEligibleReceipts', () => {
  it('keeps completed payments that have a receipt number', () => {
    const { eligible, skipped } = splitEligibleReceipts([p('a'), p('b')])
    expect(eligible.map((x) => x.id)).toEqual(['a', 'b'])
    expect(skipped).toHaveLength(0)
  })

  it('skips refunded / cancelled / failed rows with status reason', () => {
    const { eligible, skipped } = splitEligibleReceipts([
      p('a'),
      p('b', { status: 'refunded' }),
      p('c', { status: 'failed' }),
    ])
    expect(eligible.map((x) => x.id)).toEqual(['a'])
    expect(skipped.map((s) => s.payment.id)).toEqual(['b', 'c'])
    expect(skipped[0].reason).toMatch(/refunded/)
  })

  it('skips rows missing a receipt number', () => {
    const { eligible, skipped } = splitEligibleReceipts([
      p('a'),
      p('b', { receiptNumber: undefined }),
    ])
    expect(eligible.map((x) => x.id)).toEqual(['a'])
    expect(skipped.map((s) => s.payment.id)).toEqual(['b'])
    expect(skipped[0].reason).toMatch(/no receipt/)
  })

  it('empty input → empty output', () => {
    expect(splitEligibleReceipts([])).toEqual({ eligible: [], skipped: [] })
  })
})
