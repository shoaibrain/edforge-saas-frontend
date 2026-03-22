/**
 * Settings-aware date formatting utilities.
 *
 * Uses resolved settings to determine date format, calendar system,
 * and whether to show dual AD+BS dates.
 */

import { toBSString } from '@edforge/date-utils'
import type { ResolvedSettings } from '@edforge/config/resolved-settings'

type SettingsSlice = Pick<ResolvedSettings, 'dateFormat' | 'calendarSystem' | 'enableDualDateDisplay'>

interface FormatDateOptions {
  /** Override: force show/hide BS date */
  showBS?: boolean
}

/**
 * Format an ISO date string according to resolved settings.
 *
 * - Respects `dateFormat` setting for AD date ordering
 * - Shows dual AD+BS when `enableDualDateDisplay` is true and `calendarSystem` is bikram_sambat
 *
 * Examples:
 *   formatDate("2026-04-15", { dateFormat: "DD/MM/YYYY", calendarSystem: "bikram_sambat", enableDualDateDisplay: true })
 *   → "15/04/2026 (BS: 2083/01/02)"
 *
 *   formatDate("2026-04-15", { dateFormat: "MM/DD/YYYY", calendarSystem: "gregorian", enableDualDateDisplay: false })
 *   → "04/15/2026"
 */
export function formatDateWithSettings(
  dateStr: string | null | undefined,
  settings: SettingsSlice,
  options?: FormatDateOptions,
): string {
  if (!dateStr) return '\u2014'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '\u2014'

  // Format the AD date according to settings
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')

  let adStr: string
  switch (settings.dateFormat) {
    case 'DD/MM/YYYY':
      adStr = `${d}/${m}/${y}`
      break
    case 'YYYY-MM-DD':
      adStr = `${y}-${m}-${d}`
      break
    case 'MM/DD/YYYY':
    default:
      adStr = `${m}/${d}/${y}`
      break
  }

  // Determine if we should show BS
  const showBS = options?.showBS ??
    (settings.enableDualDateDisplay && settings.calendarSystem === 'bikram_sambat')

  if (!showBS) return adStr

  try {
    const bsStr = toBSString(dateStr)
    return `${adStr} (BS: ${bsStr})`
  } catch {
    return adStr
  }
}
