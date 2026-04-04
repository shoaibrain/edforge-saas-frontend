/**
 * Date formatting utilities for the Finance module.
 *
 * All functions accept an optional `settings` parameter (ResolvedSettings).
 * When provided, formatting uses the tenant's configured locale, dateFormat,
 * timezone, and calendarSystem. When absent, falls back to the original
 * en-GB / DD/MM/YYYY behavior for backward compatibility.
 */

import { toBSString } from '@edforge/date-utils'
import type { ResolvedSettings } from '@edforge/config/resolved-settings'

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/** Map our dateFormat tokens to Intl.DateTimeFormat options */
function dateFormatToIntlOptions(
  dateFormat: string,
): Intl.DateTimeFormatOptions {
  switch (dateFormat) {
    case 'YYYY-MM-DD':
      return { year: 'numeric', month: '2-digit', day: '2-digit' }
    case 'DD/MM/YYYY':
      return { day: '2-digit', month: '2-digit', year: 'numeric' }
    case 'MM/DD/YYYY':
    default:
      return { month: '2-digit', day: '2-digit', year: 'numeric' }
  }
}

/** Parse a date string, treating date-only strings as local (not UTC) */
function parseDate(dateStr: string): Date {
  // Date-only string (YYYY-MM-DD) — append T00:00:00 to parse as local
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00')
  }
  return new Date(dateStr)
}

/** Check if a date string is date-only (no time component) */
function isDateOnly(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Format an ISO date string for display.
 *
 * With settings: uses locale + dateFormat from resolved settings.
 * Without settings: DD/MM/YYYY via en-GB (backward compat).
 */
export function formatDate(
  dateStr: string | null | undefined,
  settings: ResolvedSettings,
): string {
  if (!dateStr) return '\u2014'
  const date = parseDate(dateStr)
  if (isNaN(date.getTime())) return '\u2014'

  const options: Intl.DateTimeFormatOptions = {
    ...dateFormatToIntlOptions(settings.dateFormat),
    // For date-only strings, force UTC to prevent day shifting
    ...(isDateOnly(dateStr) ? { timeZone: 'UTC' } : {}),
  }
  return new Intl.DateTimeFormat(settings.locale, options).format(
    isDateOnly(dateStr) ? new Date(dateStr + 'T00:00:00Z') : date,
  )
}

/**
 * Format an ISO datetime string with date + time.
 *
 * With settings: uses locale, dateFormat, and timezone.
 * Without settings: DD/MM/YYYY HH:mm via en-GB (backward compat).
 */
export function formatDateTime(
  dateStr: string | null | undefined,
  settings: ResolvedSettings,
): string {
  if (!dateStr) return '\u2014'
  const date = parseDate(dateStr)
  if (isNaN(date.getTime())) return '\u2014'

  const dateOptions = dateFormatToIntlOptions(settings.dateFormat)
  const options: Intl.DateTimeFormatOptions = {
    ...dateOptions,
    hour: '2-digit',
    minute: '2-digit',
    hour12: settings.timeFormat === '12h',
    timeZone: settings.timezone,
  }
  return new Intl.DateTimeFormat(settings.locale, options).format(date)
}

/**
 * Format an AD date string with optional dual AD + BS display.
 *
 * With settings: only appends BS when calendarSystem === 'bikram_sambat'
 * AND enableDualDateDisplay === true.
 * Without settings: always appends BS (backward compat).
 */
export function formatDateDual(
  dateStr: string | null | undefined,
  settings: ResolvedSettings,
): string {
  if (!dateStr) return '\u2014'
  const date = parseDate(dateStr)
  if (isNaN(date.getTime())) return '\u2014'

  const adStr = formatDate(dateStr, settings)

  // Only show dual format when BS calendar with dual display enabled
  const showDual = settings.calendarSystem === 'bikram_sambat' && settings.enableDualDateDisplay
  if (!showDual) return adStr

  try {
    const bsStr = toBSString(dateStr)
    return `${adStr} (BS: ${bsStr})`
  } catch {
    return adStr
  }
}
