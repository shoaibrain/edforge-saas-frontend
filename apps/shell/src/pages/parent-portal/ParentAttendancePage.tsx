/**
 * Parent Portal — Child's Attendance Page (v2)
 *
 * Same structure as Student Attendance but scoped to activeChild.
 * Replaces trend sparkline with AttendancePatterns section.
 *
 * Inline apiGet migration: removes apiGet('/academics/students/${studentId}/attendance/summary')
 * (previously line ~43) and apiGet('/academics/students/${studentId}/attendance') (previously
 * line ~54).
 */

import { useState, useMemo } from 'react'
import { useTranslation } from '@edforge/i18n'
import { WidgetErrorBoundaryV2, ContentSection, AttendanceHeatmap, type HeatmapDay, type HeatmapStatus } from '@edforge/ui'
import { useAppStore } from '../../stores/app.store'
import { useShell } from '../../lib/shell-context'
import { useParentPortal } from './ParentPortalLayout'
import { usePortalAttendanceSummary, usePortalStudentAttendance } from '../../hooks/usePortalStudentAttendance'
import { usePortalCalendarDates } from '../../hooks/usePortalCalendarDates'
import { usePortalCurrentAcademicYear } from '../../hooks/usePortalCurrentAcademicYear'
import { NoActiveChild } from '../portal-shared/NoActiveChild'
import { AttendanceRateHero } from '../portal-shared/AttendanceRateHero'
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
  const { t } = useTranslation('portal')

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

  return (
    <div className="p-6 space-y-6" data-v2>
      <ContentSection
        heading={t('pages.childAttendance', { name: childName })}
        staggerIndex={0}
      />

      <WidgetErrorBoundaryV2>
        <AttendanceRateHero
          attendanceRate={summary?.attendanceRate}
          totalDays={summary?.totalDays}
          present={summary?.presentDays}
          absent={summary?.absentDays}
          late={summary?.lateDays}
          excused={summary?.excusedDays}
          loading={summaryLoading}
          staggerIndex={1}
        />
      </WidgetErrorBoundaryV2>

      <WidgetErrorBoundaryV2>
        <ContentSection staggerIndex={2}>
          <AttendanceHeatmap
            yearMonth={heatmapMonth}
            days={heatmapDays}
            onMonthChange={setHeatmapMonth}
            monthLabel={monthLabel}
            className="mt-2"
          />
        </ContentSection>
      </WidgetErrorBoundaryV2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WidgetErrorBoundaryV2>
          <AttendanceRecordsList
            records={records}
            loading={recordsLoading}
            staggerIndex={3}
          />
        </WidgetErrorBoundaryV2>

        <WidgetErrorBoundaryV2>
          <AttendancePatterns
            summary={summary}
            records={records}
            calendarDates={calendarData?.items}
            staggerIndex={4}
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
