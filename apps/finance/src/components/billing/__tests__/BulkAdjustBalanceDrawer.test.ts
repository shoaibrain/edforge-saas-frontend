import { describe, it, expect } from 'vitest'
import { validateAdjustForm } from '../BulkAdjustBalanceDrawer'

describe('validateAdjustForm', () => {
  it('returns null for a valid form', () => {
    expect(
      validateAdjustForm({ amount: '50.25', reason: 'Scholarship', effectiveDate: '2026-06-15' }),
    ).toBeNull()
  })

  it('rejects non-numeric / zero / negative amounts', () => {
    expect(validateAdjustForm({ amount: '', reason: 'x', effectiveDate: '2026-06-15' })).toMatch(/amount/)
    expect(validateAdjustForm({ amount: '0', reason: 'x', effectiveDate: '2026-06-15' })).toMatch(/amount/)
    expect(validateAdjustForm({ amount: '-1', reason: 'x', effectiveDate: '2026-06-15' })).toMatch(/amount/)
    expect(validateAdjustForm({ amount: 'abc', reason: 'x', effectiveDate: '2026-06-15' })).toMatch(/amount/)
  })

  it('rejects empty or whitespace-only reason', () => {
    expect(validateAdjustForm({ amount: '10', reason: '', effectiveDate: '2026-06-15' })).toMatch(/reason/)
    expect(validateAdjustForm({ amount: '10', reason: '   ', effectiveDate: '2026-06-15' })).toMatch(/reason/)
  })

  it('requires effective date', () => {
    expect(validateAdjustForm({ amount: '10', reason: 'x', effectiveDate: '' })).toMatch(/effective date/)
  })
})
