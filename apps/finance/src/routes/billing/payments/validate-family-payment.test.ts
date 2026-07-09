import { describe, it, expect } from 'vitest'
import {
  validateFamilyPayment,
  type FamilyOpenInvoiceRow,
} from './validate-family-payment'

const OPEN_INVOICES: FamilyOpenInvoiceRow[] = [
  { invoiceId: 'inv-1', amountDue: 5000 },
  { invoiceId: 'inv-2', amountDue: 3000 },
]

describe('validateFamilyPayment', () => {
  it('accepts a valid partial allocation across siblings', () => {
    const result = validateFamilyPayment(
      { 'inv-1': '5000', 'inv-2': '1000' },
      OPEN_INVOICES,
    )
    expect(result).toEqual({ valid: true, errors: [] })
  })

  it('rejects a single non-zero allocation — family mode needs ≥2 invoices', () => {
    const result = validateFamilyPayment(
      { 'inv-1': '2500', 'inv-2': '0' },
      OPEN_INVOICES,
    )
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('recordPayment.family.validation.minTwo')
  })

  it('rejects over-allocation beyond an invoice balance', () => {
    const result = validateFamilyPayment(
      { 'inv-1': '6000', 'inv-2': '0' },
      OPEN_INVOICES,
    )
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('recordPayment.family.validation.overAllocated')
  })

  it('rejects an all-zero allocation (nothing to pay)', () => {
    const result = validateFamilyPayment(
      { 'inv-1': '0', 'inv-2': '0' },
      OPEN_INVOICES,
    )
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('recordPayment.family.validation.noAllocation')
  })

  it('rejects an empty allocation map (no invoices touched)', () => {
    const result = validateFamilyPayment({}, OPEN_INVOICES)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('recordPayment.family.validation.noAllocation')
  })

  it('rejects an allocation for an unknown invoice', () => {
    const result = validateFamilyPayment(
      { 'inv-1': '1000', 'inv-999': '500' },
      OPEN_INVOICES,
    )
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('recordPayment.family.validation.unknownInvoice')
  })

  it('rejects a negative amount', () => {
    const result = validateFamilyPayment(
      { 'inv-1': '-100', 'inv-2': '0' },
      OPEN_INVOICES,
    )
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('recordPayment.family.validation.negativeAmount')
  })

  it('treats a non-numeric amount as zero (no crash), yielding noAllocation', () => {
    const result = validateFamilyPayment(
      { 'inv-1': 'abc', 'inv-2': '' },
      OPEN_INVOICES,
    )
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('recordPayment.family.validation.noAllocation')
  })
})
