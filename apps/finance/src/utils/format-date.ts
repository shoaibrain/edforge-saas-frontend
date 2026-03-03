/**
 * Date formatting utilities for the Finance module.
 *
 * Standardizes all date display to DD/MM/YYYY (Nepal standard, en-GB locale)
 * so that dates render consistently regardless of the user's browser locale.
 */

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
