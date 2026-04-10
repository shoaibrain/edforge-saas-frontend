/**
 * Student Portal — My Attendance Page (v2)
 *
 * Content pane: rate hero → heatmap → split (trend sparkline + records list).
 *
 * Inline apiGet migration: removes apiGet('/academics/students/${studentId}/attendance/summary')
 * (previously line ~55) and apiGet('/academics/students/${studentId}/attendance') (previously
 * line ~70). Also removes inline SummaryCard, AttendanceBadge, RecordRow sub-components.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from '@edforge/i18n'
import { WidgetErrorBoundaryV2, ContentSection, AttendanceHeatmap, type HeatmapDay, type HeatmapStatus } from '@edforge/ui'
import { useAppStore } from '../../stores/app.store'
import { useShell } from '../../lib/shell-context'
import { useStudentPortal } from './StudentPortalLayout'
import { usePortalAttendanceSummary, usePortalStudentAttendance } from '../../hooks/usePortalStudentAttendance'
import { usePortalCalendarDates } from '../../hooks/usePortalCalendarDates'
import { usePortalCurrentAcademicYear } from '../../hooks/usePortalCurrentAcademicYear'
import { AttendanceRateHero } from '../portal-shared/AttendanceRateHero'
import { AttendanceRecordsList } from '../portal-shared/AttendanceRecordsList'
import { AttendanceTrendSparkline } from './sections/AttendanceTrendSparkline'

// ============================================================================
// COMPONENT
// ============================================================================

export default function StudentAttendancePage() {
  const { t } = useTranslation('portal')
  const { studentId, studentProfile } = useStudentPortal()
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const { activeSchoolYear } = useShell()
  const schoolId = activeSchoolId ?? studentProfile.schoolId

  const { data: yearData } = usePortalCurrentAcademicYear(schoolId)
  const yearId = activeSchoolYear?.id ?? yearData?.id ?? ''

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

  // Build full-year records for sparkline (wider date range)
  const yearStart = activeSchoolYear?.startDate ?? yearData?.startDate ?? `${now.getFullYear()}-01-01`
  const { data: yearRecords } = usePortalStudentAttendance(
    studentId, schoolId, yearStart, now.toISOString().slice(0, 10)
  )

  // Build heatmap days
  const heatmapDays = useMemo(() => {
    return buildHeatmapDays(heatmapMonth, records, calendarData?.items)
  }, [heatmapMonth, records, calendarData])

  return (
    <div className="p-6 space-y-6" data-v2>
      <ContentSection heading={t('pages.myAttendance')} staggerIndex={0} />

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
          <AttendanceTrendSparkline
            records={yearRecords}
            loading={recordsLoading}
            staggerIndex={3}
          />
        </WidgetErrorBoundaryV2>

        <WidgetErrorBoundaryV2>
          <AttendanceRecordsList
            records={records}
            loading={recordsLoading}
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
    for (const r of records) {
      recordMap.set(r.date, r.status)
    }
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
    if (isFuture) {
      status = 'future'
    } else if (holidaySet.has(dateStr)) {
      status = 'holiday'
    } else if (isWeekend) {
      status = 'weekend'
    } else if (recordMap.has(dateStr)) {
      status = recordMap.get(dateStr) as HeatmapStatus
    }

    days.push({
      date: dateStr,
      dayNumber: d,
      status,
      isToday: dateStr === today,
    })
  }

  return days
}
