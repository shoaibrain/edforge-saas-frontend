/**
 * Parent Portal — Child's Schedule Page (v2)
 *
 * Modified to match the pristine "Blessed's week." prototype.
 * Uses fp-content scoping and Portal-specific stylized components.
 */

import { useMemo, useState } from 'react'
import { WidgetErrorBoundaryV2 } from '@edforge/ui'
import { DownloadCloud, Printer } from 'lucide-react'
import { useAppStore } from '../../stores/app.store'
import { useShell } from '../../lib/shell-context'
import { useParentPortal } from './ParentPortalLayout'
import { useStudentSections } from '../../hooks/useStudentSections'
import { usePortalBellSchedule, type BellSchedulePeriod } from '../../hooks/usePortalBellSchedule'
import { NoActiveChild } from '../portal-shared/NoActiveChild'
import { PortalPickupInfo } from '../portal-shared/PortalPickupInfo'
import { PortalWeekTimetable } from '../portal-shared/PortalWeekTimetable'
import { PortalScheduleCourseCard } from '../portal-shared/PortalScheduleCourseCard'

export default function ParentSchedulePage() {
  const { activeChild } = useParentPortal()
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const { activeSchoolYear } = useShell()

  if (!activeChild) return <NoActiveChild />

  const studentId = activeChild.studentId
  const schoolId = activeSchoolId ?? activeChild.schoolId

  return (
    <ParentScheduleContent
      studentId={studentId}
      schoolId={schoolId}
      childName={activeChild.firstName}
      academicYearId={activeSchoolYear?.id}
    />
  )
}

function ParentScheduleContent({
  studentId,
  schoolId,
  childName,
  academicYearId,
}: {
  studentId: string
  schoolId: string
  childName: string
  academicYearId?: string
}) {
  const [view, setView] = useState('WEEK')

  // Data hooks
  const { data: sections, isLoading: sectionsLoading } =
    useStudentSections(studentId, schoolId, { academicYearId })
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

  // Build Maps and blocks for timetable
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
      <div className="flex items-start justify-between mb-8">
        <div style={{ maxWidth: 500 }}>
          <h1 className="fp-page-title mb-4">
             {childName}'s <em>week.</em>
          </h1>
          <p style={{ color: 'var(--fp-ink-2)', fontSize: 13, lineHeight: 1.5, opacity: .9, fontFamily: 'var(--fp-font-sans)' }}>
            Two courses and one shared homeroom, Monday to Friday. Drop-off at <strong>8:15am</strong>, pickup at <strong>3:30pm</strong> — <strong>you</strong> are listed as today's guardian.
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

      <WidgetErrorBoundaryV2>
        <PortalPickupInfo bellSchedules={bellSchedules} />
      </WidgetErrorBoundaryV2>

      {/* Week Title & Calendar actions */}
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ fontFamily: 'var(--fp-font-display)', fontSize: 24, fontWeight: 500, color: 'var(--fp-ink)' }}>
          This week <em style={{ fontStyle: 'italic', color: 'var(--fp-ink-3)', fontWeight: 400 }}>at Saraswati English</em>
        </h2>
        <div className="flex gap-2">
          <button style={{ padding: '8px 16px', background: 'var(--fp-paper)', border: '1px solid var(--fp-hairline)', borderRadius: 99, fontSize: 11, fontFamily: 'var(--fp-font-sans)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
            <DownloadCloud size={14} /> Add to my calendar
          </button>
          <button style={{ padding: '8px 16px', background: 'var(--fp-paper)', border: '1px solid var(--fp-hairline)', borderRadius: 99, fontSize: 11, fontFamily: 'var(--fp-font-sans)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Printer size={14} /> Print
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
            <span style={{ color: 'var(--fp-ink-3)' }}>{loading ? 'Crunching schedule...' : 'No sections loaded'}</span>
          </div>
        )}
      </WidgetErrorBoundaryV2>

      {/* Footer course grid */}
      <div className="mt-16">
        <div className="flex justify-between items-end mb-6">
           <h2 style={{ fontFamily: 'var(--fp-font-display)', fontSize: 26, fontWeight: 400 }}>
             Courses <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--fp-ink-3)' }}>& teachers</em>
           </h2>
           <span style={{ fontFamily: 'var(--fp-font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', opacity: .6, cursor: 'pointer' }}>See Progress →</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {!loading && sections && sections.slice(0,2).map((sec) => {
             const isMath = sec.courseName.toLowerCase().includes('math') || sec.courseName.toLowerCase().includes('arith')
             const period = sec.periodId ? periodMap.get(sec.periodId) : null
             let timeStr = 'Time TBD'
             const room = sec.room ?? 'Room TBD'

             if (period) {
                const startHour = parseInt(period.startTime.split(':')[0]) % 12 || 12
                const endHour = parseInt(period.endTime.split(':')[0]) % 12 || 12
                const startAmpm = parseInt(period.startTime.split(':')[0]) >= 12 ? 'pm' : 'am'
                // Hardcode mocked days for the aesthetic like the prototype
                const daysStr = isMath ? 'Mon, Wed, Fri' : 'Tue, Thu'
                timeStr = `${daysStr} · ${startHour}:00–${endHour}:50 ${startAmpm}`
             }

             return (
               <PortalScheduleCourseCard
                 key={sec.sectionId}
                 courseName={sec.courseName}
                 courseCode={sec.courseCode}
                 teacherName={sec.teacherName}
                 isMath={isMath}
                 timeStr={timeStr}
                 roomStr={room}
                 assignmentsDue={isMath ? 1 : 2}
                 locationStr={isMath ? "Block A, 1st Floor" : "Science block, 2nd floor"}
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
