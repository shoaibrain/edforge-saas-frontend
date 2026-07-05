/**
 * DateDisplay
 *
 * Presentational component that renders dates with automatic BS/AD conversion
 * based on the current locale. Drop-in replacement for raw date strings.
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { adToBS, formatBSDate, formatBSLong, formatBSShort } from '@edforge/date-utils'
import type { CalendarSystem } from '@edforge/date-utils'
import { BS_MONTH_NAMES_NE, BS_MONTH_NAMES_EN } from '@edforge/date-utils'
import { Bdi } from './Bdi'

interface DateDisplayProps {
  /** The date to display. Accepts Date object, ISO string, or null/undefined */
  date: Date | string | null | undefined
  /** Display format */
  format?: 'short' | 'medium' | 'long' | 'numeric'
  /** Show both BS and AD dates */
  showDual?: boolean
  /** Override calendar system (default: auto, follows locale) */
  calendar?: CalendarSystem
  /** Additional CSS classes */
  className?: string
}

export function DateDisplay({
  date,
  format = 'numeric',
  showDual = false,
  calendar = 'auto',
  className,
}: DateDisplayProps) {
  const { i18n } = useTranslation()

  const display = useMemo(() => {
    if (!date) return '—'

    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return '—'

    const useBS = calendar === 'bs' || (calendar === 'auto' && i18n.language === 'ne')
    const monthNames = i18n.language === 'ne' ? BS_MONTH_NAMES_NE : BS_MONTH_NAMES_EN

    if (showDual) {
      const bs = formatBSDate(adToBS(d))
      const ad = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      return useBS ? `${bs} (${ad})` : `${ad} (${bs})`
    }

    if (useBS) {
      const bs = adToBS(d)
      switch (format) {
        case 'long':
          return formatBSLong(bs, monthNames)
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
  }, [date, format, showDual, calendar, i18n.language])

  // Dates are numeric LTR islands (digits, slashes, `bs (ad)` parens). Isolate
  // them so they don't reorder inside RTL (Arabic) content. No-op in LTR.
  return (
    <span className={className}>
      <Bdi>{display}</Bdi>
    </span>
  )
}
