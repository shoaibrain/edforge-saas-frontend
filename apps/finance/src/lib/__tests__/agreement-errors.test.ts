import { describe, expect, it } from 'vitest'
import {
  conflictKindFromError,
  openInvoiceConflictsFromError,
  parseAgreementActive,
} from '../agreement-errors'

/** The 409 exactly as the backend GlobalExceptionFilter emits it. */
function wire409(payload: Record<string, unknown>) {
  return {
    response: {
      status: 409,
      data: {
        statusCode: 409,
        errorCode: 'CONFLICT',
        message: 'This agreement already priced an invoice this term.',
        ...payload,
        timestamp: '2026-09-06T00:00:00.000Z',
        requestId: 'req-1',
        path: '/finance/schools/s-1/invoices',
      },
    },
  }
}

describe('parseAgreementActive (wire envelope)', () => {
  it('opens the override dialog off the read-time guard (with existingInvoiceId)', () => {
    const parsed = parseAgreementActive(
      wire409({
        code: 'AGREEMENT_ACTIVE',
        agreementId: 'agr-1',
        existingInvoiceId: 'inv-1',
        existingInvoiceNumber: 'INV-2083-0001',
        coveredFeeTypes: ['tuition', 'exam'],
      }),
    )
    expect(parsed).toEqual({
      code: 'AGREEMENT_ACTIVE',
      message: 'This agreement already priced an invoice this term.',
      agreementId: 'agr-1',
      existingInvoiceId: 'inv-1',
      coveredFeeTypes: ['tuition', 'exam'],
    })
  })

  it('still opens off the lock backstop (no existingInvoiceId)', () => {
    const parsed = parseAgreementActive(
      wire409({ code: 'AGREEMENT_ACTIVE', agreementId: 'agr-1' }),
    )
    expect(parsed?.agreementId).toBe('agr-1')
    expect(parsed?.existingInvoiceId).toBeUndefined()
    expect(parsed?.coveredFeeTypes).toEqual([])
  })

  it('ignores a 409 without the domain code (errorCode alone is not enough)', () => {
    expect(parseAgreementActive(wire409({ agreementId: 'agr-1' }))).toBeNull()
  })

  it('ignores other domain codes and non-409 statuses', () => {
    expect(
      parseAgreementActive(wire409({ code: 'AGREEMENT_OVERLAP', agreementId: 'agr-1' })),
    ).toBeNull()
    const err = wire409({ code: 'AGREEMENT_ACTIVE', agreementId: 'agr-1' })
    err.response.status = 400
    expect(parseAgreementActive(err)).toBeNull()
    expect(parseAgreementActive(new Error('Network Error'))).toBeNull()
  })
})


/** The 409 exactly as the backend GlobalExceptionFilter emits it. */
function activate409(payload: Record<string, unknown>) {
  return {
    response: {
      status: 409,
      data: {
        statusCode: 409,
        errorCode: 'CONFLICT',
        message: 'conflict',
        ...payload,
        timestamp: '2026-09-06T00:00:00.000Z',
        requestId: 'req-1',
        path: '/finance/schools/s-1/agreements/a-1/activate',
      },
    },
  }
}

const CONFLICTS = [
  { invoiceId: 'inv-1', invoiceNumber: 'INV-2083-0001', grandTotal: 15000, matchedFeeTypes: ['tuition'] },
  { invoiceId: 'inv-2', invoiceNumber: 'INV-2083-0002', grandTotal: 2500, matchedFeeTypes: ['exam'] },
]

describe('activate 409 classification (wire envelope)', () => {
  it('classifies CONFLICTING_OPEN_INVOICES and lists the conflicts', () => {
    const err = activate409({ code: 'CONFLICTING_OPEN_INVOICES', conflicts: CONFLICTS })
    expect(conflictKindFromError(err)).toBe('openInvoices')
    expect(openInvoiceConflictsFromError(err)).toEqual(CONFLICTS)
  })

  it('classifies AGREEMENT_OVERLAP as terminal', () => {
    const err = activate409({
      code: 'AGREEMENT_OVERLAP',
      studentIds: ['stu-1'],
      conflictingAgreementId: 'agr-9',
    })
    expect(conflictKindFromError(err)).toBe('overlap')
    expect(openInvoiceConflictsFromError(err)).toEqual([])
  })

  it('does not classify off errorCode alone', () => {
    expect(conflictKindFromError(activate409({}))).toBeNull()
    expect(conflictKindFromError(new Error('Network Error'))).toBeNull()
  })

  it('tolerates malformed conflict entries', () => {
    const err = activate409({
      code: 'CONFLICTING_OPEN_INVOICES',
      conflicts: [null, 'x', { invoiceId: 'inv-3' }],
    })
    expect(openInvoiceConflictsFromError(err)).toEqual([
      { invoiceId: 'inv-3', invoiceNumber: '', grandTotal: 0, matchedFeeTypes: [] },
    ])
  })
})
