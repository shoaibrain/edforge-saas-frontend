/**
 * Bikram Sambat (BS) Date Conversion Utility
 *
 * Nepal's official calendar (Vikram Samvat / Bikram Sambat).
 * Reference epoch: BS 2000/01/01 = AD 1943/04/14
 * Coverage: BS 2000–2090 (AD 1943–2034)
 *
 * Sprint C0.a.3 — this module is now a **thin wrapper** around the
 * authoritative BS converter in `@aibrains/shared-types`. The local
 * BS_MONTH_DAYS lookup table has been deleted; we delegate every
 * calendar-shape question to `gregorianToBs` / `bsToGregorian` /
 * `getBsMonthDays`. This file keeps the local API surface
 * (`adToBS` / `bsToAD` / formatters) so existing consumers don't move.
 *
 * Timezone-safety note: the shared-types converter parses ISO strings
 * with `new Date(string)`, which treats date-only inputs as UTC midnight
 * and then reads local components — off-by-one in negative-UTC-offset
 * timezones. To preserve the timezone-safe behavior the local
 * implementation used to have, we append `T12:00:00` to every ISO input,
 * placing the parsed moment safely mid-day in every real timezone
 * (±14h max). The returned ISO from `bsToGregorian` is appended with
 * `T00:00:00` on parse to preserve the local-midnight Date semantics
 * the local API has always returned.
 */

import {
  gregorianToBs,
  bsToGregorian,
  getBsMonthDays,
} from '@aibrains/shared-types'

import type { BSDate } from './types'

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Extract local-timezone Y-M-D components from a Date object and format
 * as a date-only ISO string (`YYYY-MM-DD`). Used so a Date constructed
 * from local components (e.g., `new Date(2023, 3, 14)`) round-trips
 * through the shared-types converter without crossing a UTC date line.
 */
function dateToIsoLocal(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Wrap `getBsMonthDays` with the legacy silent-fallback semantics the
 * frontend test suite asserts (`getDaysInBSMonth(9999, 1) === 30`).
 * Shared-types throws on out-of-range; the BSDateInput picker relies on
 * a numeric return so the UI can render an empty month gracefully.
 */
function safeGetBsMonthDays(year: number, month: number): number {
  try {
    return getBsMonthDays(year, month)
  } catch {
    return 30
  }
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
  const isoString =
    typeof adDate === 'string' ? adDate : dateToIsoLocal(adDate)

  // `+ 'T12:00:00'` keeps the parsed Date safely mid-day in every real
  // timezone, so shared-types' local-component read returns the intended
  // calendar day (not an off-by-one).
  try {
    return gregorianToBs(`${isoString}T12:00:00`)
  } catch {
    // Pre-epoch / invalid input: preserve the legacy clamp behavior.
    return { year: 2000, month: 1, day: 1 }
  }
}

// ============================================================================
// BS → AD CONVERSION
// ============================================================================

/**
 * Convert BS (Bikram Sambat) date to AD (Gregorian) Date.
 *
 * @param bsDate - BSDate object { year, month, day }
 * @returns JavaScript Date object (local midnight on the target day)
 */
export function bsToAD(bsDate: BSDate): Date {
  const iso = bsToGregorian(bsDate.year, bsDate.month, bsDate.day)
  // Append T00:00:00 so JS parses as local-midnight (preserves the
  // semantics of the prior local implementation that constructed the
  // Date via setDate arithmetic).
  return new Date(`${iso}T00:00:00`)
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
  const maxDay = safeGetBsMonthDays(bs.year, bs.month)
  return bs.day >= 1 && bs.day <= maxDay
}

/**
 * Get the number of days in a BS month.
 *
 * Wraps shared-types' `getBsMonthDays` with a silent fallback to 30 on
 * out-of-range input. The fallback exists so the BSDateInput picker can
 * render an empty month rather than crash on an unexpected year value.
 */
export function getDaysInBSMonth(year: number, month: number): number {
  return safeGetBsMonthDays(year, month)
}

// Month names (English transliteration) - for non-i18n contexts
const BS_MONTH_NAMES_EN = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan',
  'Bhadra', 'Ashwin', 'Kartik', 'Mangsir',
  'Poush', 'Magh', 'Falgun', 'Chaitra',
]

export { BS_MONTH_NAMES_EN }
