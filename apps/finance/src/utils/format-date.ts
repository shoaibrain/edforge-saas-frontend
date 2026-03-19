/**
 * Date formatting utilities for the Finance module.
 *
 * Standardizes all date display to DD/MM/YYYY (Nepal standard, en-GB locale)
 * so that dates render consistently regardless of the user's browser locale.
 *
 * Also provides dual-format display (AD + BS) for dates like dueDate and issuedDate.
 */

import { toBSString } from '@edforge/date-utils'

/**
 * Format an ISO date string to DD/MM/YYYY (Nepal standard).
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '\u2014'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '\u2014'
  return date.toLocaleDateString('en-GB') // DD/MM/YYYY
}

/**
 * Format an ISO datetime to DD/MM/YYYY HH:mm
 */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '\u2014'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '\u2014'
  return `${date.toLocaleDateString('en-GB')} ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

/**
 * Format an AD date string with dual AD + BS display.
 * Example: "2026-04-15" → "15/04/2026 (BS: 2083/01/02)"
 */
export function formatDateDual(dateStr: string | null | undefined): string {
  if (!dateStr) return '\u2014'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '\u2014'
  const adStr = date.toLocaleDateString('en-GB')
  try {
    const bsStr = toBSString(dateStr)
    return `${adStr} (BS: ${bsStr})`
  } catch {
    return adStr
  }
}
