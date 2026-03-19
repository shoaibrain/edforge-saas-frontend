/**
 * useDateFormatter
 *
 * React hook that formats dates based on the current i18n locale.
 * When locale is 'ne', dates display in Bikram Sambat.
 * When locale is 'en', dates display in Gregorian (AD).
 *
 * Also respects an explicit calendar system preference if set.
 */

import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { adToBS, formatBSDate, formatDate } from '../converter'
import { BS_MONTH_NAMES_NE, BS_MONTH_NAMES_EN } from '../constants'
import type { CalendarSystem } from '../types'

interface UseDateFormatterOptions {
  /** Override calendar system. Default: 'auto' (follows locale) */
  calendar?: CalendarSystem
}

export function useDateFormatter(options: UseDateFormatterOptions = {}) {
  const { i18n } = useTranslation()
  const locale = i18n.language

  const calendarSystem = useMemo((): 'ad' | 'bs' => {
    if (options.calendar === 'bs') return 'bs'
    if (options.calendar === 'ad') return 'ad'
    // Auto: follow locale
    return locale === 'ne' ? 'bs' : 'ad'
  }, [options.calendar, locale])

  const monthNames = useMemo(
    () => (calendarSystem === 'bs' ? BS_MONTH_NAMES_NE : BS_MONTH_NAMES_EN),
    [calendarSystem]
  )

  const fmtDate = useCallback(
    (date: Date | string | null | undefined, format: 'short' | 'medium' | 'long' | 'numeric' = 'numeric'): string => {
      return formatDate(date, { calendar: calendarSystem, format })
    },
    [calendarSystem]
  )

  const fmtDateRange = useCallback(
    (start: Date | string | null | undefined, end: Date | string | null | undefined): string => {
      const s = fmtDate(start)
      const e = fmtDate(end)
      if (s === '—' && e === '—') return '—'
      return `${s} – ${e}`
    },
    [fmtDate]
  )

  const fmtDual = useCallback(
    (date: Date | string | null | undefined): string => {
      if (!date) return '—'
      const d = typeof date === 'string' ? new Date(date) : date
      if (isNaN(d.getTime())) return '—'

      const bs = formatBSDate(adToBS(d))
      const ad = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

      if (calendarSystem === 'bs') {
        return `${bs} (${ad})`
      }
      return `${ad} (${bs})`
    },
    [calendarSystem]
  )

  return {
    formatDate: fmtDate,
    formatDateRange: fmtDateRange,
    formatDual: fmtDual,
    calendarSystem,
    monthNames,
  }
}
