import { describe, it, expect } from 'vitest'
import type { Payment } from '@edforge/types'
import { splitEligibleVoid } from '../BulkVoidPaymentsDrawer'

function makePayment(
  id: string,
  status: Payment['status'],
  receiptNumber: string | null,
): Payment {
  return {
    id,
    status,
    receiptNumber,
    amount: 1000,
    gateway: 'cash',
  } as unknown as Payment
}

describe('splitEligibleVoid', () => {
  it('eligible = completed + has receipt; everything else skipped with reason', () => {
    const payments = [
      makePayment('a', 'completed', 'R001'),
      makePayment('b', 'completed', null),
      makePayment('c', 'refunded', 'R003'),
      makePayment('d', 'failed', null),
      makePayment('e', 'completed', 'R005'),
    ]
    const { eligible, skipped } = splitEligibleVoid(payments)
    expect(eligible.map((p) => p.id)).toEqual(['a', 'e'])
    expect(skipped.map((s) => s.payment.id)).toEqual(['b', 'c', 'd'])
    // skip reasons distinguish 'not completed' from 'no receipt number'
    expect(skipped.find((s) => s.payment.id === 'b')?.reason).toBe('no receipt number')
    expect(skipped.find((s) => s.payment.id === 'c')?.reason).toMatch(/not completed/)
    expect(skipped.find((s) => s.payment.id === 'd')?.reason).toMatch(/not completed/)
  })

  it('partially-refunded is NOT eligible (only "completed" is)', () => {
    const payments = [makePayment('a', 'partially_refunded' as Payment['status'], 'R001')]
    const { eligible, skipped } = splitEligibleVoid(payments)
    expect(eligible).toEqual([])
    expect(skipped).toHaveLength(1)
  })

  it('empty input → empty output', () => {
    expect(splitEligibleVoid([])).toEqual({ eligible: [], skipped: [] })
  })
})
