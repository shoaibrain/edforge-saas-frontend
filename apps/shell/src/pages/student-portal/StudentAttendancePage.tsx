/**
 * Student Portal — My Attendance Page (v2)
 *
 * Rewritten completely to synchronize layout, grid structure, and aesthetics
 * with the updated `data-family-portal` components used in the Parent view.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from '@edforge/i18n'
import { WidgetErrorBoundaryV2 } from '@edforge/ui'
import type { HeatmapDay, HeatmapStatus } from '@edforge/ui'
import { useAppStore } from '../../stores/app.store'
import { useShell } from '../../lib/shell-context'
import { useStudentPortal } from './StudentPortalLayout'
import { usePortalAttendanceSummary, usePortalStudentAttendance } from '../../hooks/usePortalStudentAttendance'
import { usePortalCalendarDates } from '../../hooks/usePortalCalendarDates'
import { usePortalCurrentAcademicYear } from '../../hooks/usePortalCurrentAcademicYear'

import { PortalAttendanceHero } from '../portal-shared/PortalAttendanceHero'
import { PortalCalendarGrid } from '../portal-shared/PortalCalendarGrid'
import { AttendanceRecordsList } from '../portal-shared/AttendanceRecordsList'
import { AttendancePatterns } from '../parent-portal/sections/AttendancePatterns'

// ============================================================================
// COMPONENT
// ============================================================================

export default function StudentAttendancePage() {
  const { studentId, studentProfile } = useStudentPortal()
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const { activeSchoolYear } = useShell()
  const schoolId = activeSchoolId ?? studentProfile.schoolId

  return (
    <StudentAttendanceContent
      studentId={studentId}
      schoolId={schoolId}
      academicYearId={activeSchoolYear?.id}
      studentName={studentProfile.firstName}
    />
  )
}

function StudentAttendanceContent({
  studentId,
  schoolId,
  academicYearId,
  studentName
}: {
  studentId: string
  schoolId: string
  academicYearId?: string
  studentName: string
}) {
  const { t } = useTranslation('portal')

  const { data: yearData } = usePortalCurrentAcademicYear(schoolId)
  const yearId = academicYearId ?? yearData?.id ?? ''

  // Month state for heatmap
  const now = new Date()
  const [heatmapMonth, setHeatmapMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  )

  // Date range for the heatmap month
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

  // Data hooks
  const { data: summary, isLoading: summaryLoading } =
    usePortalAttendanceSummary(studentId, schoolId, { academicYearId: yearId })
  const { data: records, isLoading: recordsLoading } =
    usePortalStudentAttendance(studentId, schoolId, startDate, endDate)
  const { data: calendarData } =
    usePortalCalendarDates(schoolId, yearId, { month: heatmapMonth })

  // Build heatmap days
  const heatmapDays = useMemo(() => {
    return buildHeatmapDays(heatmapMonth, records, calendarData?.items)
  }, [heatmapMonth, records, calendarData])

  return (
    <div className="fp-content">
      {/* Editorial Page Head */}
      <h1 className="fp-page-title mb-10">
        My <em>attendance.</em>
      </h1>

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
          {/* Note: In Student context, we still render Patterns instead of abstract sparkline
              for exact feature parity with the Parent UX as requested mapping. */}
          <AttendancePatterns
             summary={summary}
             records={records}
             calendarDates={calendarData?.items}
             childName="My"
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
