/**
 * AttendancePatterns — Parent-only insight cards derived from attendance data
 *
 * Renders 1-3 small cards based on conditions. Cards omitted when condition not met.
 */

import { useMemo } from 'react'
import { useTranslation } from '@edforge/i18n'
import { ContentSection } from '@edforge/ui'
import type { AttendanceSummary, AttendanceRecord } from '../../../hooks/usePortalStudentAttendance'
import type { CalendarDate } from '../../../hooks/usePortalCalendarDates'

export interface AttendancePatternsProps {
  summary?: AttendanceSummary
  records?: AttendanceRecord[]
  calendarDates?: Array<CalendarDate>
  staggerIndex?: number
}

interface InsightCard {
  key: string
  message: string
  bg: string
  text: string
}

export function AttendancePatterns({
  summary,
  records,
  calendarDates,
  staggerIndex = 4,
}: AttendancePatternsProps) {
  const { t } = useTranslation('portal')

  const insights = useMemo(() => {
    const cards: InsightCard[] = []

    // No concerns
    if (summary && summary.attendanceRate >= 90) {
      cards.push({
        key: 'no-concerns',
        message: t('attendance.noConcerns'),
        bg: 'var(--v2-success-bg)',
        text: 'var(--v2-brand-primary)',
      })
    }

    // Absences this month
    if (records) {
      const now = new Date()
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const monthAbsences = records.filter(
        (r) => r.status === 'absent' && r.date.startsWith(thisMonth)
      ).length
      if (monthAbsences > 0) {
        cards.push({
          key: 'month-absences',
          message: `${monthAbsences} absence${monthAbsences > 1 ? 's' : ''} this month`,
          bg: monthAbsences >= 3 ? 'var(--v2-warning-bg)' : 'var(--v2-surface-inset)',
          text: monthAbsences >= 3 ? 'var(--v2-warning)' : 'var(--v2-text-secondary)',
        })
      }
    }

    // Upcoming holiday
    if (calendarDates) {
      const now = new Date()
      const upcoming = calendarDates
        .filter((cd) => cd.isHoliday && new Date(cd.date) > now)
        .sort((a, b) => a.date.localeCompare(b.date))
      if (upcoming.length > 0) {
        const next = upcoming[0]
        const label = next.name
          ? `${next.name} on ${new Date(next.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
          : t('attendance.holidayUpcoming', {
              date: new Date(next.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            })
        cards.push({
          key: 'holiday',
          message: label,
          bg: 'var(--v2-info-bg)',
          text: 'var(--v2-info)',
        })
      }
    }

    return cards
  }, [summary, records, calendarDates, t])

  if (insights.length === 0) return null

  return (
    <ContentSection heading={t('attendance.patterns')} staggerIndex={staggerIndex}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
        {insights.map((card) => (
          <div
            key={card.key}
            className="rounded-xl border px-4 py-3"
            style={{
              background: card.bg,
              borderColor: 'var(--v2-border-default)',
            }}
          >
            <p className="text-[13px] font-medium" style={{ color: card.text }}>
              {card.message}
            </p>
          </div>
        ))}
      </div>
    </ContentSection>
  )
}
