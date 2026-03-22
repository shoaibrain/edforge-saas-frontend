/**
 * Settings-aware datetime formatting with timezone support.
 *
 * Uses `Intl.DateTimeFormat` with the timezone from resolved settings
 * to display timestamps in the correct local time.
 */

import type { ResolvedSettings } from '@edforge/config/resolved-settings'

type SettingsSlice = Pick<ResolvedSettings, 'timezone' | 'timeFormat' | 'dateFormat'>

/**
 * Format an ISO timestamp according to resolved settings with timezone awareness.
 *
 * Examples:
 *   formatDateTimeWithSettings("2026-03-18T13:15:00Z", { timezone: "Asia/Kathmandu", timeFormat: "12h", dateFormat: "DD/MM/YYYY" })
 *   → "18/03/2026 6:00 PM"
 *
 *   formatDateTimeWithSettings("2026-03-18T13:15:00Z", { timezone: "America/Chicago", timeFormat: "24h", dateFormat: "MM/DD/YYYY" })
 *   → "03/18/2026 08:15"
 */
export function formatDateTimeWithSettings(
  timestamp: string | Date | null | undefined,
  settings: SettingsSlice,
): string {
  if (!timestamp) return '\u2014'
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  if (isNaN(date.getTime())) return '\u2014'

  const tz = settings.timezone || 'UTC'

  // Format date part
  const dateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const y = dateParts.find(p => p.type === 'year')!.value
  const m = dateParts.find(p => p.type === 'month')!.value
  const d = dateParts.find(p => p.type === 'day')!.value

  let dateStr: string
  switch (settings.dateFormat) {
    case 'DD/MM/YYYY':
      dateStr = `${d}/${m}/${y}`
      break
    case 'YYYY-MM-DD':
      dateStr = `${y}-${m}-${d}`
      break
    case 'MM/DD/YYYY':
    default:
      dateStr = `${m}/${d}/${y}`
      break
  }

  // Format time part
  const is12h = settings.timeFormat === '12h'
  const timeStr = date.toLocaleTimeString('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: is12h,
  })

  return `${dateStr} ${timeStr}`
}

/**
 * Format a timestamp as relative date with timezone awareness.
 * E.g., "Today · 2:00 PM", "Yesterday · 10:00 AM", "3 days ago · 9:30 AM"
 */
export function formatRelativeDateWithSettings(
  timestamp: string | Date | null | undefined,
  settings: SettingsSlice,
): string {
  if (!timestamp) return '\u2014'
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  if (isNaN(date.getTime())) return '\u2014'

  const tz = settings.timezone || 'UTC'

  // Get current date in the target timezone
  const nowInTz = new Date(new Date().toLocaleString('en-US', { timeZone: tz }))
  const dateInTz = new Date(date.toLocaleString('en-US', { timeZone: tz }))

  const today = new Date(nowInTz.getFullYear(), nowInTz.getMonth(), nowInTz.getDate())
  const target = new Date(dateInTz.getFullYear(), dateInTz.getMonth(), dateInTz.getDate())
  const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))

  const is12h = settings.timeFormat === '12h'
  const timeStr = date.toLocaleTimeString('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: is12h,
  })

  if (diffDays === 0) return `Today · ${timeStr}`
  if (diffDays === 1) return `Yesterday · ${timeStr}`
  if (diffDays < 7) return `${diffDays} days ago · ${timeStr}`

  // Older than a week: show "Mar 15 · 9:30 AM"
  const monthDay = date.toLocaleDateString('en-US', {
    timeZone: tz,
    month: 'short',
    day: 'numeric',
  })
  return `${monthDay} · ${timeStr}`
}
