/**
 * Bikram Sambat Date Converter Tests
 *
 * Validates AD↔BS conversion accuracy with known date pairs,
 * edge cases, and round-trip consistency.
 */

import { describe, it, expect } from 'vitest'
import {
  adToBS,
  bsToAD,
  formatBSDate,
  formatBSShort,
  formatBSLong,
  formatDate,
  toBSString,
  toBSShort,
  isValidBSDate,
  getDaysInBSMonth,
} from './converter'

// Known AD → BS conversion pairs verified against official Nepal calendar
const KNOWN_PAIRS: Array<{ ad: string; bs: { year: number; month: number; day: number } }> = [
  // Epoch
  { ad: '1943-04-14', bs: { year: 2000, month: 1, day: 1 } },
  // Nepal Republic Day: Jestha 15, 2065
  { ad: '2008-05-28', bs: { year: 2065, month: 2, day: 15 } },
  // Nepal Constitution Day: Ashwin 3, 2072
  { ad: '2015-09-20', bs: { year: 2072, month: 6, day: 3 } },
  // New Year 2080
  { ad: '2023-04-14', bs: { year: 2080, month: 1, day: 1 } },
  // New Year 2081
  { ad: '2024-04-13', bs: { year: 2081, month: 1, day: 1 } },
  // Mid-year date
  { ad: '2024-01-15', bs: { year: 2080, month: 10, day: 1 } },
  // End of year (Chaitra)
  { ad: '2024-04-12', bs: { year: 2080, month: 12, day: 30 } },
  // Dashain 2081 (approx Ashwin/Kartik boundary)
  { ad: '2024-10-12', bs: { year: 2081, month: 6, day: 26 } },
  // Recent date — 2025-02-27 (Falgun 2081)
  { ad: '2025-02-27', bs: { year: 2081, month: 11, day: 15 } },
]

describe('adToBS', () => {
  it.each(KNOWN_PAIRS)(
    'converts AD $ad → BS $bs.year/$bs.month/$bs.day',
    ({ ad, bs }) => {
      const result = adToBS(ad)
      expect(result.year).toBe(bs.year)
      expect(result.month).toBe(bs.month)
      expect(result.day).toBe(bs.day)
    }
  )

  it('handles Date objects', () => {
    const result = adToBS(new Date(2023, 3, 14)) // April 14, 2023
    expect(result.year).toBe(2080)
    expect(result.month).toBe(1)
    expect(result.day).toBe(1)
  })

  it('clamps dates before epoch to 2000/1/1', () => {
    const result = adToBS('1940-01-01')
    expect(result).toEqual({ year: 2000, month: 1, day: 1 })
  })
})

describe('bsToAD', () => {
  it.each(KNOWN_PAIRS)(
    'converts BS $bs.year/$bs.month/$bs.day → AD $ad',
    ({ ad, bs }) => {
      const result = bsToAD(bs)
      const expected = new Date(ad + 'T00:00:00')
      // Compare year, month, day (ignore time zone differences)
      expect(result.getFullYear()).toBe(expected.getFullYear())
      expect(result.getMonth()).toBe(expected.getMonth())
      expect(result.getDate()).toBe(expected.getDate())
    }
  )
})

describe('round-trip AD → BS → AD', () => {
  const testDates = [
    '2000-01-01', '2010-06-15', '2015-12-31',
    '2020-02-29', '2023-04-14', '2024-07-20', '2025-01-01',
  ]

  it.each(testDates)('round-trips %s correctly', (adStr) => {
    const bs = adToBS(adStr)
    const adBack = bsToAD(bs)
    const original = new Date(adStr + 'T00:00:00')
    expect(adBack.getFullYear()).toBe(original.getFullYear())
    expect(adBack.getMonth()).toBe(original.getMonth())
    expect(adBack.getDate()).toBe(original.getDate())
  })
})

describe('formatBSDate', () => {
  it('pads month and day to 2 digits', () => {
    expect(formatBSDate({ year: 2080, month: 1, day: 5 })).toBe('2080/01/05')
    expect(formatBSDate({ year: 2081, month: 12, day: 30 })).toBe('2081/12/30')
  })
})

describe('formatBSShort', () => {
  it('returns MM/DD without padding', () => {
    expect(formatBSShort({ year: 2080, month: 3, day: 7 })).toBe('3/7')
  })
})

describe('formatBSLong', () => {
  it('uses default English month names', () => {
    expect(formatBSLong({ year: 2080, month: 10, day: 15 })).toBe('15 Magh 2080')
  })

  it('accepts custom month names', () => {
    const neNames = ['बैशाख', 'जेठ', 'असार', 'श्रावण', 'भदौ', 'आश्विन', 'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फाल्गुण', 'चैत']
    expect(formatBSLong({ year: 2080, month: 1, day: 1 }, neNames)).toBe('1 बैशाख 2080')
  })
})

describe('formatDate', () => {
  it('returns "—" for null/undefined', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
  })

  it('returns "—" for invalid dates', () => {
    expect(formatDate('not-a-date')).toBe('—')
  })

  it('formats AD dates by default', () => {
    const result = formatDate('2024-01-15', { calendar: 'ad', format: 'medium' })
    expect(result).toContain('Jan')
    expect(result).toContain('2024')
  })

  it('formats BS dates when calendar=bs', () => {
    const result = formatDate('2023-04-14', { calendar: 'bs', format: 'numeric' })
    expect(result).toBe('2080/01/01')
  })
})

describe('toBSString / toBSShort', () => {
  it('toBSString converts ISO to formatted BS', () => {
    expect(toBSString('2023-04-14')).toBe('2080/01/01')
  })

  it('toBSShort converts ISO to short BS', () => {
    expect(toBSShort('2023-04-14')).toBe('1/1')
  })
})

describe('isValidBSDate', () => {
  it('validates dates within lookup range', () => {
    expect(isValidBSDate({ year: 2080, month: 1, day: 1 })).toBe(true)
    expect(isValidBSDate({ year: 2080, month: 12, day: 30 })).toBe(true)
  })

  it('rejects years outside range', () => {
    expect(isValidBSDate({ year: 1999, month: 1, day: 1 })).toBe(false)
    expect(isValidBSDate({ year: 2091, month: 1, day: 1 })).toBe(false)
  })

  it('rejects invalid months', () => {
    expect(isValidBSDate({ year: 2080, month: 0, day: 1 })).toBe(false)
    expect(isValidBSDate({ year: 2080, month: 13, day: 1 })).toBe(false)
  })

  it('rejects days exceeding month length', () => {
    // Baisakh 2080 has 31 days
    expect(isValidBSDate({ year: 2080, month: 1, day: 31 })).toBe(true)
    expect(isValidBSDate({ year: 2080, month: 1, day: 32 })).toBe(false)
  })
})

describe('getDaysInBSMonth', () => {
  it('returns correct day counts for known months', () => {
    // Baisakh 2080 = 31 days
    expect(getDaysInBSMonth(2080, 1)).toBe(31)
  })

  it('returns 30 for out-of-range queries', () => {
    expect(getDaysInBSMonth(9999, 1)).toBe(30)
  })
})

/**
 * Issue #349 — a full timestamp was passed through unchanged and then had
 * `T12:00:00` appended, producing `2026-09-06T13:05:05.566ZT12:00:00`.
 * `gregorianToBs` threw and the catch clamped to BS 2000/01/01, so an
 * invoice created today rendered a Bikram Sambat date 83 years out beside a
 * correct AD date. Seen in production on the invoice Activity panel and the
 * agreement status-history timeline.
 */
describe('adToBS — timestamps resolve to their calendar day (#349)', () => {
  it('converts an ISO timestamp to the same day as the date-only form', () => {
    const fromDay = adToBS('2026-09-06')
    const fromTimestamp = adToBS('2026-09-06T13:05:05.566Z')
    expect(fromTimestamp).toEqual(fromDay)
  })

  it('no longer clamps a valid timestamp to the BS floor', () => {
    const bs = adToBS('2026-09-06T13:05:05.566Z')
    expect(bs).not.toEqual({ year: 2000, month: 1, day: 1 })
    expect(bs.year).toBeGreaterThan(2080)
  })

  it('handles a timestamp with no milliseconds and no zone', () => {
    expect(adToBS('2026-09-06T13:05:05')).toEqual(adToBS('2026-09-06'))
  })

  it('leaves date-only strings exactly as they were', () => {
    expect(adToBS('2026-03-18')).toEqual(adToBS('2026-03-18'))
    expect(adToBS('2026-03-18').year).toBeGreaterThan(2080)
  })

  it('still accepts a Date and agrees with its string form', () => {
    const d = new Date(2026, 8, 6, 13, 5)
    expect(adToBS(d)).toEqual(adToBS('2026-09-06'))
  })

  it('keeps the legacy clamp for genuinely unparseable input', () => {
    expect(adToBS('not-a-date')).toEqual({ year: 2000, month: 1, day: 1 })
  })
})
