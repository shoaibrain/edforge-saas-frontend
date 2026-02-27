/**
 * Date Utility Types
 */

export interface BSDate {
  year: number
  month: number // 1-12
  day: number   // 1-32
}

export type CalendarSystem = 'ad' | 'bs' | 'auto'

export interface DateDisplayOptions {
  /** Override calendar system (default: auto, follows locale) */
  calendar?: CalendarSystem
  /** Show both BS and AD dates */
  showDual?: boolean
  /** Date format pattern */
  format?: 'short' | 'medium' | 'long' | 'numeric'
}
