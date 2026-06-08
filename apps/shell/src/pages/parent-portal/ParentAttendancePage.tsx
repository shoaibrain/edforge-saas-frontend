/**
 * Parent Portal — Child's Attendance Page (v2)
 *
 * Scoped to activeChild and styled exclusively for Family Portal prototypes.
 */

import { useState, useMemo } from 'react'
import { WidgetErrorBoundaryV2 } from '@edforge/ui'
import type { HeatmapDay, HeatmapStatus } from '@edforge/ui'
import { AlertCircle } from 'lucide-react'
import { useAppStore } from '../../stores/app.store'
import { useShell } from '../../lib/shell-context'
import { useParentPortal } from './ParentPortalLayout'
import { usePortalAttendanceSummary, usePortalStudentAttendance } from '../../hooks/usePortalStudentAttendance'
import { usePortalCalendarDates } from '../../hooks/usePortalCalendarDates'
import { usePortalCurrentAcademicYear } from '../../hooks/usePortalCurrentAcademicYear'
import { NoActiveChild } from '../portal-shared/NoActiveChild'
import { PortalAttendanceHero } from '../portal-shared/PortalAttendanceHero'
import { PortalCalendarGrid } from '../portal-shared/PortalCalendarGrid'
import { AttendanceRecordsList } from '../portal-shared/AttendanceRecordsList'
import { AttendancePatterns } from './sections/AttendancePatterns'

// ============================================================================
// COMPONENT
// ============================================================================

export default function ParentAttendancePage() {
  const { activeChild } = useParentPortal()
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const { activeSchoolYear } = useShell()

  if (!activeChild) return <NoActiveChild />

  const studentId = activeChild.studentId
  const schoolId = activeSchoolId ?? activeChild.schoolId

  return (
    <ParentAttendanceContent
      studentId={studentId}
      schoolId={schoolId}
      childName={activeChild.firstName}
      academicYearId={activeSchoolYear?.id}
    />
  )
}

function ParentAttendanceContent({
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
  const { data: yearData } = usePortalCurrentAcademicYear(schoolId)
  const yearId = academicYearId ?? yearData?.id ?? ''

  const now = new Date()
  const [heatmapMonth, setHeatmapMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  )

  const { startDate, endDate, monthLabel } = useMemo(() => {
    const [y, m] = heatmapMonth.split('-').map(Number)
    const start = new Date(y, m - 1, 1)
    const end = new Date(y, m, 0)
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      monthLabel: start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    }
  }, [heatmapMonth])

  const { data: summary, isLoading: summaryLoading } =
    usePortalAttendanceSummary(studentId, schoolId, { academicYearId: yearId })
  const { data: records, isLoading: recordsLoading } =
    usePortalStudentAttendance(studentId, schoolId, startDate, endDate)
  const { data: calendarData } =
    usePortalCalendarDates(schoolId, yearId, { month: heatmapMonth })

  const heatmapDays = useMemo(() => {
    return buildHeatmapDays(heatmapMonth, records, calendarData?.items)
  }, [heatmapMonth, records, calendarData])

  // Look for any absences missing notes to trigger the unexplained action banner
  const unexplainedRecord = useMemo(() => {
    if (!records) return null;
    return records.find(r => r.status === 'absent' && !r.notes);
  }, [records]);

  function getDayName(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'long' });
  }

  return (
    <div className="fp-content">
      {/* Editorial Page Head */}
      <h1 className="fp-page-title mb-10">
        {childName}'s <em>attendance.</em>
      </h1>
      
      {/* Action Banner (Dynamic parsing of unexplained absences) */}
      {unexplainedRecord && (
        <div className="fp-action-banner">
          <div className="fp-icon"><AlertCircle strokeWidth={2} /></div>
          <div style={{ flex: 1 }}>
            <h3>{getDayName(unexplainedRecord.date)}'s absence is <em>unexplained.</em></h3>
            <p>The front office marked {childName} absent on {new Date(unexplainedRecord.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} but no reason is on file. A quick note closes the loop and keeps the record clean.</p>
          </div>
          <div>
            <button className="fp-t-btn primary" style={{ background: 'var(--fp-ink)', color: 'var(--fp-paper)', padding: '12px 24px', fontSize: '13px' }} disabled>
              Add a reason
            </button>
          </div>
        </div>
      )}

      {/* Hero Metrics */}
      <WidgetErrorBoundaryV2>
        <PortalAttendanceHero
          summary={summary}
          loading={summaryLoading}
        />
      </WidgetErrorBoundaryV2>

      {/* Monthly Calendar View */}
      <WidgetErrorBoundaryV2>
        <PortalCalendarGrid
          yearMonth={heatmapMonth}
          days={heatmapDays}
          onMonthChange={setHeatmapMonth}
          monthLabel={monthLabel}
        />
      </WidgetErrorBoundaryV2>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <WidgetErrorBoundaryV2>
          <AttendanceRecordsList
            records={records}
            loading={recordsLoading}
          />
        </WidgetErrorBoundaryV2>

        <WidgetErrorBoundaryV2>
          <AttendancePatterns
            summary={summary}
            records={records}
            calendarDates={calendarData?.items}
            childName={childName}
          />
        </WidgetErrorBoundaryV2>
      </div>
    </div>
  )
}

// ============================================================================
// HEATMAP BUILDER
// ============================================================================

function buildHeatmapDays(
  yearMonth: string,
  records?: Array<{ date: string; status: string }>,
  holidays?: Array<{ date: string; isHoliday: boolean }>
): HeatmapDay[] {
  const [y, m] = yearMonth.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const today = new Date().toISOString().slice(0, 10)
  const todayDate = new Date()

  const recordMap = new Map<string, string>()
  if (records) {
    for (const r of records) recordMap.set(r.date, r.status)
  }

  const holidaySet = new Set<string>()
  if (holidays) {
    for (const h of holidays) {
      if (h.isHoliday) holidaySet.add(h.date)
    }
  }

  const days: HeatmapDay[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(y, m - 1, d)
    const dateStr = dateObj.toISOString().slice(0, 10)
    const dow = dateObj.getDay()
    const isWeekend = dow === 0 || dow === 6
    const isFuture = dateObj > todayDate

    let status: HeatmapStatus = 'none'
    if (isFuture) status = 'future'
    else if (holidaySet.has(dateStr)) status = 'holiday'
    else if (isWeekend) status = 'weekend'
    else if (recordMap.has(dateStr)) status = recordMap.get(dateStr) as HeatmapStatus

    days.push({ date: dateStr, dayNumber: d, status, isToday: dateStr === today })
  }

  return days
}
