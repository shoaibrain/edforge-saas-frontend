/**
 * Bikram Sambat (BS) Date Conversion Utility
 *
 * Nepal's official calendar (Vikram Samvat / Bikram Sambat).
 * Migrated from apps/academics/src/lib/bikram-sambat.ts and extended with
 * reverse conversion (BS → AD) and additional formatting options.
 *
 * Reference epoch: BS 2000/01/01 = AD 1943/04/14
 * Coverage: BS 2000–2090 (AD 1943–2034)
 *
 * Each BS year has 12 months with variable day counts (28–32 days).
 * The lookup table is the authoritative source for month lengths.
 */

import type { BSDate } from './types'
import { BS_MONTH_DAYS, BS_EPOCH_YEAR } from './constants'

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function getTotalDaysInBSYear(year: number): number {
  const months = BS_MONTH_DAYS[year]
  if (!months) return 365
  return months.reduce((sum, d) => sum + d, 0)
}

function getDaysInBSMonth(year: number, month: number): number {
  const months = BS_MONTH_DAYS[year]
  if (!months || month < 1 || month > 12) return 30
  return months[month - 1]
}

// ============================================================================
// AD → BS CONVERSION
// ============================================================================

/**
 * Convert AD (Gregorian) date to BS (Bikram Sambat) date.
 *
 * @param adDate - JavaScript Date object or ISO date string (YYYY-MM-DD)
 * @returns BSDate object { year, month, day }
 */
export function adToBS(adDate: Date | string): BSDate {
  const date = typeof adDate === 'string' ? new Date(adDate + 'T00:00:00') : adDate

  // Use UTC to compute day difference (avoids DST off-by-one)
  const dateUTC = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const epochUTC = Date.UTC(1943, 3, 14)
  let totalDays = Math.floor((dateUTC - epochUTC) / (1000 * 60 * 60 * 24))

  if (totalDays < 0) {
    return { year: 2000, month: 1, day: 1 }
  }

  let bsYear = BS_EPOCH_YEAR
  let bsMonth = 1
  let bsDay = 1

  // Subtract full years
  while (totalDays > 0) {
    const yearDays = getTotalDaysInBSYear(bsYear)
    if (totalDays >= yearDays) {
      totalDays -= yearDays
      bsYear++
    } else {
      break
    }
  }

  // Subtract full months
  const months = BS_MONTH_DAYS[bsYear]
  if (months) {
    for (let i = 0; i < 12 && totalDays > 0; i++) {
      if (totalDays >= months[i]) {
        totalDays -= months[i]
        bsMonth++
      } else {
        break
      }
    }
  }

  bsDay += totalDays

  return { year: bsYear, month: bsMonth, day: bsDay }
}

// ============================================================================
// BS → AD CONVERSION
// ============================================================================

/**
 * Convert BS (Bikram Sambat) date to AD (Gregorian) Date.
 *
 * @param bsDate - BSDate object { year, month, day }
 * @returns JavaScript Date object (midnight UTC-equivalent local)
 */
export function bsToAD(bsDate: BSDate): Date {
  let totalDays = 0

  // Add full years from epoch to target year
  for (let y = BS_EPOCH_YEAR; y < bsDate.year; y++) {
    totalDays += getTotalDaysInBSYear(y)
  }

  // Add full months in the target year
  const months = BS_MONTH_DAYS[bsDate.year]
  if (months) {
    for (let m = 0; m < bsDate.month - 1; m++) {
      totalDays += months[m]
    }
  }

  // Add remaining days
  totalDays += bsDate.day - 1

  // Convert to AD using setDate (DST-safe, unlike ms arithmetic)
  const result = new Date(1943, 3, 14)
  result.setDate(result.getDate() + totalDays)
  return result
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Format BS date as "YYYY/MM/DD" (standard Nepal format)
 */
export function formatBSDate(bs: BSDate): string {
  return `${bs.year}/${String(bs.month).padStart(2, '0')}/${String(bs.day).padStart(2, '0')}`
}

/**
 * Format BS date in short form: "MM/DD" (for chart axes)
 */
export function formatBSShort(bs: BSDate): string {
  return `${bs.month}/${bs.day}`
}

/**
 * Format BS date with month name: "DD Magh 2082"
 */
export function formatBSLong(bs: BSDate, monthNames?: string[]): string {
  const names = monthNames || BS_MONTH_NAMES_EN
  const monthName = names[bs.month - 1] || `Month ${bs.month}`
  return `${bs.day} ${monthName} ${bs.year}`
}

/**
 * Format an AD date for display, respecting the given calendar system.
 */
export function formatDate(
  date: Date | string | null | undefined,
  options: { calendar?: 'ad' | 'bs'; format?: 'short' | 'medium' | 'long' | 'numeric' } = {}
): string {
  if (!date) return '—'

  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
  if (isNaN(d.getTime())) return '—'

  const { calendar = 'ad', format = 'numeric' } = options

  if (calendar === 'bs') {
    const bs = adToBS(d)
    switch (format) {
      case 'long':
        return formatBSLong(bs)
      case 'short':
        return formatBSShort(bs)
      case 'medium':
      case 'numeric':
      default:
        return formatBSDate(bs)
    }
  }

  // AD formatting
  switch (format) {
    case 'long':
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    case 'medium':
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    case 'short':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    case 'numeric':
    default:
      return d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS (backward compat with original bikram-sambat.ts)
// ============================================================================

/**
 * Convert ISO date string to formatted BS string.
 */
export function toBSString(isoDate: string): string {
  return formatBSDate(adToBS(isoDate))
}

/**
 * Convert ISO date string to short BS format for chart axes.
 */
export function toBSShort(isoDate: string): string {
  return formatBSShort(adToBS(isoDate))
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Check if a BS date is valid (within lookup table range and day count).
 */
export function isValidBSDate(bs: BSDate): boolean {
  if (bs.year < 2000 || bs.year > 2090) return false
  if (bs.month < 1 || bs.month > 12) return false
  const maxDay = getDaysInBSMonth(bs.year, bs.month)
  return bs.day >= 1 && bs.day <= maxDay
}

/**
 * Get the number of days in a BS month.
 */
export { getDaysInBSMonth }

// Month names (English transliteration) - for non-i18n contexts
const BS_MONTH_NAMES_EN = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan',
  'Bhadra', 'Ashwin', 'Kartik', 'Mangsir',
  'Poush', 'Magh', 'Falgun', 'Chaitra',
]

export { BS_MONTH_NAMES_EN }
