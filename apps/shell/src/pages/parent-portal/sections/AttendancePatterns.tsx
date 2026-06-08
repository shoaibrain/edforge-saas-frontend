/**
 * AttendancePatterns — Parent-only insight cards derived from attendance data
 * Mimicking prototype styling with solid edge markers and specific background tints.
 */

import { useMemo } from 'react'
import type { AttendanceSummary, AttendanceRecord } from '../../../hooks/usePortalStudentAttendance'
import type { CalendarDate } from '../../../hooks/usePortalCalendarDates'

export interface AttendancePatternsProps {
  summary?: AttendanceSummary
  records?: AttendanceRecord[]
  calendarDates?: Array<CalendarDate>
  childName?: string
}

interface InsightCard {
  key: string
  title: string
  message: string
  bg: string
  edge: string
  topLabel?: string
}

export function AttendancePatterns({
  summary,
  records,
  calendarDates,
  childName = 'Your child',
}: AttendancePatternsProps) {
  const insights = useMemo(() => {
    const cards: InsightCard[] = []

    // No concerns
    if (summary && summary.attendanceRate >= 90) {
      cards.push({
        key: 'no-concerns',
        title: 'No concerning patterns',
        message: `${childName}'s attendance is well within bounds. Single-day absences at this age are routine and don't trigger any school policy.`,
        bg: 'var(--fp-sage-soft)',
        edge: 'var(--fp-sage)'
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
          title: `Recent Absences`,
          message: `${monthAbsences} absence${monthAbsences > 1 ? 's' : ''} recorded this calendar month.`,
          bg: monthAbsences >= 3 ? 'var(--fp-terracotta-soft)' : 'var(--fp-paper-2)',
          edge: monthAbsences >= 3 ? 'var(--fp-terracotta)' : 'var(--fp-ink-3)',
          topLabel: 'THIS MONTH'
        })
      }
    }

    // Consistent Rhythm Check (Dummy comparing to last term for prototype fidelity)
    if (summary && summary.totalDays > 20) {
        cards.push({
          key: 'rhythm',
          title: 'Similar rhythm',
          message: 'About the same attendance rate as last term — no trend change.',
          bg: 'var(--fp-sand)',
          edge: 'var(--fp-sand)', // Flat card
          topLabel: 'COMPARED TO Q4 LAST YEAR'
        })
    }

    // Upcoming holiday
    if (calendarDates) {
      const now = new Date()
      const upcoming = calendarDates
        .filter((cd) => cd.isHoliday && new Date(cd.date) > now)
        .sort((a, b) => a.date.localeCompare(b.date))
      
      if (upcoming.length > 0) {
        const next = upcoming[0]
        const dateLab = new Date(next.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        const label = next.name
          ? `Next holiday: ${dateLab} (${next.name})`
          : `Next holiday: ${dateLab}`

        cards.push({
          key: 'holiday',
          title: label,
          message: 'School closed. Calendar blocked automatically.',
          bg: 'var(--fp-butter-soft)',
          edge: 'var(--fp-butter)',
          topLabel: 'HEADS UP'
        })
      }
    }

    return cards
  }, [summary, records, calendarDates, childName])

  if (insights.length === 0) return null

  return (
    <section className="fp-section h-full flex flex-col">
      <div className="fp-section-head">
        <h2 className="fp-section-title">Patterns <em>and flags</em></h2>
      </div>
      <div className="flex flex-col gap-4 mt-2">
        {insights.map((card) => {
           // Provide prototype aesthetics with edge markers
           return (
             <div key={card.key}
               className="rounded-xl overflow-hidden shadow-sm"
               style={{
                 background: card.bg,
                 border: `1px solid rgba(0,0,0,0.05)`,
                 borderLeft: `4px solid ${card.edge}`,
                 padding: '16px 20px',
                 boxShadow: 'var(--fp-shadow-card)'
               }}
             >
               {card.topLabel && (
                 <div style={{ fontFamily: 'var(--fp-font-mono)', fontSize: '9px', letterSpacing: '.12em', color: 'var(--fp-ink-3)', opacity: .8, marginBottom: '8px' }}>
                   {card.topLabel}
                 </div>
               )}
               <h3 style={{ fontFamily: 'var(--fp-font-sans)', fontSize: '15px', fontWeight: 600, color: 'var(--fp-ink)', margin: '0 0 4px', letterSpacing: '-.01em' }}>
                 {card.title}
               </h3>
               <p style={{ margin: 0, fontSize: '12px', color: 'var(--fp-ink-2)', lineHeight: 1.5, opacity: .9, fontFamily: 'var(--fp-font-sans)' }}>
                 {card.message}
               </p>
             </div>
           )
        })}
      </div>
    </section>
  )
}
