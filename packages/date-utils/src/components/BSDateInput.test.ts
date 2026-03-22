/**
 * BSDateInput unit tests
 *
 * Tests validation logic via the underlying converter functions
 * (BSDateInput is a thin UI wrapper around isValidBSDate, getDaysInBSMonth, bsToAD).
 */

import { describe, it, expect } from 'vitest'
import { bsToAD, isValidBSDate, getDaysInBSMonth } from '../converter'
import type { BSDate } from '../types'

describe('BSDateInput validation logic', () => {
  it('BS 2082/01/01 converts to AD 2025-04-14', () => {
    const bs: BSDate = { year: 2082, month: 1, day: 1 }
    const ad = bsToAD(bs)
    expect(ad.getFullYear()).toBe(2025)
    expect(ad.getMonth()).toBe(3) // April = 3 (0-indexed)
    expect(ad.getDate()).toBe(14)
  })

  it('BS month 13 is invalid', () => {
    expect(isValidBSDate({ year: 2082, month: 13, day: 1 })).toBe(false)
  })

  it('BS day exceeding month max is invalid', () => {
    const maxDay = getDaysInBSMonth(2082, 1)
    expect(isValidBSDate({ year: 2082, month: 1, day: maxDay + 1 })).toBe(false)
  })

  it('BS year outside 2000-2090 is invalid', () => {
    expect(isValidBSDate({ year: 1999, month: 1, day: 1 })).toBe(false)
    expect(isValidBSDate({ year: 2091, month: 1, day: 1 })).toBe(false)
  })

  it('valid BS date within range returns true', () => {
    expect(isValidBSDate({ year: 2082, month: 6, day: 15 })).toBe(true)
  })

  it('getDaysInBSMonth returns correct days for known month', () => {
    // BS 2082 Baisakh (month 1) should have a known day count from the table
    const days = getDaysInBSMonth(2082, 1)
    expect(days).toBeGreaterThanOrEqual(28)
    expect(days).toBeLessThanOrEqual(32)
  })
})
