import { describe, expect, it } from 'vitest'
import {
  extractValidationErrors,
  extractApiMessage,
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
