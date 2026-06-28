import { describe, it, expect } from 'vitest'
import type { StudentAccount } from '@edforge/types'
import { splitEligibleStatements } from '../BulkSendStatementsDrawer'

function acct(id: string): StudentAccount {
  return {
    id,
    studentId: id,
    schoolId: 's',
    studentName: id,
    balance: 0,
    totalPaid: 0,
    lastPaymentDate: null,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  }
}

describe('splitEligibleStatements', () => {
  it('every selected account is eligible (no client-side filter)', () => {
    const { eligible, skipped } = splitEligibleStatements([acct('a'), acct('b')])
    expect(eligible.map((x) => x.id)).toEqual(['a', 'b'])
    expect(skipped).toEqual([])
  })

  it('returns a fresh array — caller can mutate without leaking back', () => {
    const input = [acct('a')]
    const { eligible } = splitEligibleStatements(input)
    expect(eligible).not.toBe(input)
  })

  it('empty input → empty output', () => {
    expect(splitEligibleStatements([])).toEqual({ eligible: [], skipped: [] })
  })
})
