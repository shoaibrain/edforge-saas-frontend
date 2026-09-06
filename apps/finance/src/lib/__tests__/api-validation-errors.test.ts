import { describe, expect, it } from 'vitest'
import {
  extractValidationErrors,
  extractApiMessage,
  extractApiErrorCode,
  extractApiErrorBody,
} from '../api-validation-errors'

/**
 * Exact nestjs-zod 400 body captured during live user testing of the
 * agreement create wizard (imagined-contract bugs): freeform coveredFeeTypes
 * and a non-enum billingFrequency.
 */
const LIVE_400_BODY = {
  statusCode: 400,
  message: 'Validation failed',
  errors: [
    {
      path: ['coveredFeeTypes', 0],
      message:
        "Invalid enum value. Expected 'tuition' | 'admission' | 'exam' | 'transport' | 'library' | 'lab' | 'hostel' | 'uniform' | 'miscellaneous' | 'custom', received 'Tuition Fee'",
      code: 'invalid_enum_value',
    },
    {
      path: ['billingFrequency'],
      message:
        "Invalid enum value. Expected 'one_time' | 'monthly' | 'quarterly' | 'annual', received 'termly'",
      code: 'invalid_enum_value',
    },
  ],
}

const axiosError = (data: unknown) => ({ response: { data } })

describe('extractValidationErrors', () => {
  it('maps the live nestjs-zod 400 body to dotted-path entries', () => {
    const result = extractValidationErrors(axiosError(LIVE_400_BODY))
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      path: 'coveredFeeTypes.0',
      message: LIVE_400_BODY.errors[0].message,
    })
    expect(result[1]).toEqual({
      path: 'billingFrequency',
      message: LIVE_400_BODY.errors[1].message,
    })
  })

  it('falls back to details.validationErrors with dotted path strings', () => {
    const result = extractValidationErrors(
      axiosError({
        statusCode: 400,
        message: 'Validation failed',
        details: {
          validationErrors: [
            { path: 'terms.lines.2.feeType', message: 'not covered' },
          ],
        },
      }),
    )
    expect(result).toEqual([
      { path: 'terms.lines.2.feeType', message: 'not covered' },
    ])
  })

  it('prefers the top-level errors array over the details mirror', () => {
    const result = extractValidationErrors(
      axiosError({
        errors: [{ path: ['title'], message: 'Required' }],
        details: { validationErrors: [{ path: 'ignored', message: 'x' }] },
      }),
    )
    expect(result).toEqual([{ path: 'title', message: 'Required' }])
  })

  it('returns [] for non-validation shapes', () => {
    expect(extractValidationErrors(undefined)).toEqual([])
    expect(extractValidationErrors(new Error('network down'))).toEqual([])
    expect(extractValidationErrors(axiosError('Internal Server Error'))).toEqual([])
    expect(extractValidationErrors(axiosError({ message: 'Forbidden' }))).toEqual([])
    expect(extractValidationErrors(axiosError({ errors: 'oops' }))).toEqual([])
    expect(
      extractValidationErrors(axiosError({ errors: [{ path: ['x'] }] })),
    ).toEqual([])
  })
})

describe('extractApiMessage', () => {
  it('reads the backend message off an axios-shaped error', () => {
    expect(extractApiMessage(axiosError(LIVE_400_BODY))).toBe('Validation failed')
    expect(
      extractApiMessage(axiosError({ message: 'Agreement version is stale.' })),
    ).toBe('Agreement version is stale.')
  })

  it('returns null when there is no usable message', () => {
    expect(extractApiMessage(undefined)).toBeNull()
    expect(extractApiMessage(new Error('boom'))).toBeNull()
    expect(extractApiMessage(axiosError({ message: '' }))).toBeNull()
    expect(extractApiMessage(axiosError({ message: 42 }))).toBeNull()
  })
})

/**
 * A 409 exactly as the backend GlobalExceptionFilter emits it: envelope
 * fields plus the domain `code` and payload the finance service threw.
 */
const WIRE_409_BODY = {
  statusCode: 409,
  errorCode: 'CONFLICT',
  code: 'AGREEMENT_ACTIVE',
  message: 'This agreement already priced an invoice this term.',
  agreementId: 'agr-1',
  existingInvoiceId: 'inv-1',
  coveredFeeTypes: ['tuition'],
  timestamp: '2026-09-06T00:00:00.000Z',
  requestId: 'req-1',
  path: '/finance/schools/s-1/invoices',
}

describe('extractApiErrorCode', () => {
  it('reads the domain code off the wire envelope, not errorCode', () => {
    const err = { response: { status: 409, data: WIRE_409_BODY } }
    expect(extractApiErrorCode(err)).toBe('AGREEMENT_ACTIVE')
  })

  it('is null for a 400 validation body (no domain code)', () => {
    const err = { response: { status: 400, data: LIVE_400_BODY } }
    expect(extractApiErrorCode(err)).toBeNull()
  })

  it('is null for network and non-axios errors', () => {
    expect(extractApiErrorCode(new Error('Network Error'))).toBeNull()
    expect(extractApiErrorCode(undefined)).toBeNull()
    expect(extractApiErrorCode({ response: { data: 'gateway timeout' } })).toBeNull()
  })
})

describe('extractApiErrorBody', () => {
  it('returns the full body so callers can read the payload keys', () => {
    const err = { response: { status: 409, data: WIRE_409_BODY } }
    const body = extractApiErrorBody(err)
    expect(body?.agreementId).toBe('agr-1')
    expect(body?.existingInvoiceId).toBe('inv-1')
    expect(body?.coveredFeeTypes).toEqual(['tuition'])
  })

  it('is null when there is no object body', () => {
    expect(extractApiErrorBody(new Error('boom'))).toBeNull()
    expect(extractApiErrorBody({ response: { data: 'text' } })).toBeNull()
  })
})
