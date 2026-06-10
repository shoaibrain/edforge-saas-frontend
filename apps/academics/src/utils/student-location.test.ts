import { describe, it, expect } from 'vitest'
import { formatStudentLocation, isNepalAddress } from './student-location'

describe('formatStudentLocation', () => {
  it('prefers Nepal extension fields (municipality/district) over legacy city/state', () => {
    const loc = formatStudentLocation({
      municipality: 'Kshireshwarnath',
      district: 'Dhanusha',
      city: 'legacy-city',
      state: 'legacy-state',
      country: 'NPL',
    })
    expect(loc).toEqual({ primary: 'Kshireshwarnath', secondary: 'Dhanusha' })
  })

  it('falls back to legacy city/state when Nepal fields are absent', () => {
    expect(formatStudentLocation({ city: 'Bhaktapur', state: 'Bagmati', country: 'NPL' })).toEqual({
      primary: 'Bhaktapur',
      secondary: 'Bagmati',
    })
  })

  it('returns null for empty or undefined addresses', () => {
    expect(formatStudentLocation(undefined)).toBeNull()
    expect(formatStudentLocation({})).toBeNull()
    expect(formatStudentLocation(null)).toBeNull()
  })

  it('anchors on the available line when only a region is present', () => {
    expect(formatStudentLocation({ state: 'Bagmati' })).toEqual({ primary: 'Bagmati', secondary: '' })
  })
})

describe('isNepalAddress', () => {
  it('detects Nepal by country code', () => {
    expect(isNepalAddress({ country: 'NPL' })).toBe(true)
    expect(isNepalAddress({ country: 'Nepal' })).toBe(true)
  })
  it('detects Nepal by extension field presence even without country', () => {
    expect(isNepalAddress({ district: 'Dhanusha' })).toBe(true)
  })
  it('is false for non-Nepal / empty', () => {
    expect(isNepalAddress({ country: 'USA', city: 'Austin' })).toBe(false)
    expect(isNepalAddress(undefined)).toBe(false)
  })
})
