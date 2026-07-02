import { describe, it, expect } from 'vitest'
import {
  MANUAL_PAYMENT_MAX,
  validateRecordPayment,
} from '../record-payment-validation'

const base = { amountDue: 12000, gateway: 'cash' as const, reference: '' }

describe('validateRecordPayment', () => {
  it('requires a positive amount', () => {
    expect(validateRecordPayment({ ...base, amount: 0 })).toBe('amount_required')
    expect(validateRecordPayment({ ...base, amount: -5 })).toBe('amount_required')
    expect(validateRecordPayment({ ...base, amount: Number.NaN })).toBe('amount_required')
  })

  it('blocks overpayment above the amount due', () => {
    expect(validateRecordPayment({ ...base, amount: 12001 })).toBe('overpayment')
    expect(validateRecordPayment({ ...base, amount: 12000 })).toBeNull()
  })

  it('enforces the backend 10M per-payment cap before the overpayment check', () => {
    expect(
      validateRecordPayment({
        ...base,
        amountDue: MANUAL_PAYMENT_MAX * 2,
        amount: MANUAL_PAYMENT_MAX + 1,
      })
    ).toBe('over_cap')
  })

  it('requires a reference for non-cash gateways', () => {
    expect(
      validateRecordPayment({ ...base, amount: 5000, gateway: 'bank_transfer' })
    ).toBe('reference_required')
    expect(
      validateRecordPayment({ ...base, amount: 5000, gateway: 'cheque', reference: '   ' })
    ).toBe('reference_required')
    expect(
      validateRecordPayment({
        ...base,
        amount: 5000,
        gateway: 'bank_transfer',
        reference: 'NIBL-2083-118842',
      })
    ).toBeNull()
  })

  it('accepts cash without a reference', () => {
    expect(validateRecordPayment({ ...base, amount: 5000 })).toBeNull()
  })
})
