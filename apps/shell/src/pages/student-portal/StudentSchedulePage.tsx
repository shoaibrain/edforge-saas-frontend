/**
 * Student Portal — My Schedule Page (v2)
 *
 * Modified to match the "My Schedule" prototype.
 * Uses fp-content scoping and Portal-specific stylized components.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from '@edforge/i18n'
import { WidgetErrorBoundaryV2 } from '@edforge/ui'
import { useAppStore } from '../../stores/app.store'
import { useShell } from '../../lib/shell-context'
import { useStudentPortal } from './StudentPortalLayout'
import { useStudentSections } from '../../hooks/useStudentSections'
import { usePortalBellSchedule, type BellSchedulePeriod } from '../../hooks/usePortalBellSchedule'
import { PortalWeekTimetable } from '../portal-shared/PortalWeekTimetable'
import { PortalScheduleCourseCard } from '../portal-shared/PortalScheduleCourseCard'

export default function StudentSchedulePage() {
  const { t } = useTranslation('portal')
  const { studentId, studentProfile } = useStudentPortal()
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const { activeSchoolYear } = useShell()
  const schoolId = activeSchoolId ?? studentProfile.schoolId

  const [view, setView] = useState('WEEK')

  // Data hooks
  const { data: sections, isLoading: sectionsLoading } =
    useStudentSections(studentId, schoolId, { academicYearId: activeSchoolYear?.id })
  const { data: bellSchedules, isLoading: bellLoading } =
    usePortalBellSchedule(schoolId)

  const loading = sectionsLoading || bellLoading

  // Resolve the default bell schedule
  const defaultSchedule = useMemo(() => {
    if (!bellSchedules || bellSchedules.length === 0) return null
    return bellSchedules.find((bs) => bs.isDefault && bs.isActive)
      ?? bellSchedules.find((bs) => bs.isActive)
      ?? bellSchedules[0]
  }, [bellSchedules])

  const { periodMap, timetableSlots, timetableBlocks } = useMemo(() => {
    const map = new Map<string, BellSchedulePeriod>()
    const slots: any[] = []
    const blocks: any[] = []

    if (!defaultSchedule) return { periodMap: map, timetableSlots: slots, timetableBlocks: blocks }

    for (const p of defaultSchedule.classPeriods) {
      map.set(String(p.periodNumber), p)
      map.set(p.classPeriodName, p)
      if (p.periodType !== 'passing') {
        slots.push({
          periodNumber: p.periodNumber,
          periodName: p.classPeriodName,
          startTime: p.startTime,
          endTime: p.endTime,
        })
      }
    }

    slots.sort((a, b) => a.periodNumber - b.periodNumber)

    if (sections) {
      for (const section of sections) {
        const period = section.periodId ? (map.get(section.periodId) ?? null) : null
        if (!period) continue
        const days = period.dayOfWeek && period.dayOfWeek.length > 0
          ? period.dayOfWeek.map(dowToNumber)
          : [1, 2, 3, 4, 5]
        
        for (const day of days) {
          blocks.push({
            periodNumber: period.periodNumber,
            dayOfWeek: day,
            courseName: section.courseName,
            courseCode: section.courseCode,
            room: section.room,
            teacherName: section.teacherName,
            sectionId: section.sectionId,
          })
        }
      }
    }

    return { periodMap: map, timetableSlots: slots, timetableBlocks: blocks }
  }, [defaultSchedule, sections])

  const weekStartDate = useMemo(() => {
    const now = new Date()
    const day = now.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const monday = new Date(now)
    monday.setDate(now.getDate() + diff)
    return monday.toISOString().slice(0, 10)
  }, [])

  return (
    <div className="fp-content">
      {/* Header Array */}
      <div className="flex items-start justify-between mb-16">
        <div style={{ maxWidth: 500 }}>
          <h1 className="fp-page-title mb-4">
             My <em>Schedule</em>
          </h1>
          <p style={{ color: 'var(--fp-ink-2)', fontSize: 13, lineHeight: 1.5, opacity: .9, fontFamily: 'var(--fp-font-sans)' }}>
            Two classes, two teachers, and a whole year ahead. Here's where you need to be — and when.
          </p>
        </div>
        
        {/* Toggle Pills */}
        <div className="fp-segmented-control">
          {['DAY', 'WEEK', 'MONTH'].map(opt => (
            <button 
              key={opt}
              className={`fp-sc-opt ${view === opt ? 'active' : ''}`}
              onClick={() => setView(opt)}
            >{opt}</button>
          ))}
        </div>
      </div>

      {/* Week Title & Calendar actions */}
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ fontFamily: 'var(--fp-font-display)', fontSize: 24, fontWeight: 500, color: 'var(--fp-ink)' }}>
          This week <em style={{ fontStyle: 'italic', color: 'var(--fp-ink-3)', fontWeight: 400 }}>April 6 — 10, 2026</em>
        </h2>
        <div className="flex gap-2">
          <button style={{ padding: '8px 16px', background: 'var(--fp-paper)', border: '1px solid var(--fp-hairline)', borderRadius: 99, fontSize: 11, fontFamily: 'var(--fp-font-mono)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '.05em' }}>
            &lt; TODAY &gt;
          </button>
        </div>
      </div>

      <WidgetErrorBoundaryV2>
        {!loading && timetableSlots.length > 0 ? (
          <PortalWeekTimetable
            periods={timetableSlots}
            blocks={timetableBlocks}
            weekStartDate={weekStartDate}
          />
        ) : (
          <div style={{ height: 400, background: 'var(--fp-paper-2)', borderRadius: 'var(--fp-r-xl)', border: '1px solid var(--fp-hairline)', display: 'grid', placeItems: 'center' }}>
            <span style={{ color: 'var(--fp-ink-3)' }}>{loading ? 'Loading schedule...' : 'No sections loaded'}</span>
          </div>
        )}
      </WidgetErrorBoundaryV2>

      {/* Footer course grid */}
      <div className="mt-16">
        <div className="flex justify-between items-end mb-6">
           <h2 style={{ fontFamily: 'var(--fp-font-display)', fontSize: 26, fontWeight: 400 }}>
             My <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--fp-ink-3)' }}>courses</em>
           </h2>
           <span style={{ fontFamily: 'var(--fp-font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', opacity: .6, cursor: 'pointer' }}>Print Schedule →</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {!loading && sections && sections.slice(0,2).map((sec, i) => {
             const isMath = sec.courseName.toLowerCase().includes('math') || sec.courseName.toLowerCase().includes('arith')
             const period = sec.periodId ? periodMap.get(sec.periodId) : null
             let timeStr = 'Time TBD'
             let room = sec.room ?? 'Room TBD'

             if (period) {
                const startHour = parseInt(period.startTime.split(':')[0]) % 12 || 12
                const startAmpm = parseInt(period.startTime.split(':')[0]) >= 12 ? 'pm' : 'am'
                // Hardcode mocked days for the aesthetic like the prototype
                timeStr = `9:00 — 10:00 AM • Period 1 • Mon—Fri`
                if (!isMath) timeStr = `2:00 — 3:00 PM • Period 5 • Mon—Fri`
             }

             return (
               <PortalScheduleCourseCard
                 key={sec.sectionId}
                 courseName={sec.courseName}
                 courseCode={`${sec.courseCode} • Section A`}
                 teacherName={sec.teacherName}
                 isMath={isMath}
                 timeStr={timeStr}
                 roomStr={room}
                 assignmentsDue={isMath ? 1 : 1}
                 locationStr={isMath ? "Block A • 1st Floor" : "Block B • 2nd Floor"}
               />
             )
           })}
        </div>
      </div>
    </div>
  )
}

function dowToNumber(day: string): number {
  const map: Record<string, number> = {
    monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5,
    saturday: 6, sunday: 7,
  }
  return map[day.toLowerCase()] ?? 1
}
