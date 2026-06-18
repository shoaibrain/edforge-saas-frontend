/**
 * DailyHomeroomEntry
 *
 * School-level daily roll-call for `daily`/`both` attendance mode (PABSON).
 * Picks a homeroom, shows its roster with everyone defaulted to PRESENT, and
 * lets the operator quickly flag absentees/late/excused. Save posts only the
 * marked exceptions to `recordDailyAttendance` — unmarked roster students
 * default to present server-side (absentees-only fast path, FE-S5).
 *
 * Distinct from the per-section `daily-entry` path, which stays unchanged for
 * `period`-mode schools (regression guard).
 */

import { useEffect, useMemo } from 'react'
import { Home, ClipboardCheck } from 'lucide-react'
import { usePermission } from '@edforge/abac'
import { Select } from '@edforge/ui'
import {
  useAttendanceStore,
  useAttendanceDateActions,
} from '../../stores/attendance.store'
import { useCalendarDate } from '../../hooks/useAttendance'
import { useSectionRoster } from '../../hooks/useSections'
import {
  useHomerooms,
  useRecordDailyAttendance,
} from '../../hooks/useHomeroom'
import { useSectionAttendanceRecords } from '../../hooks/useSectionAttendance'
import { DateSelector } from './DateSelector'
import { AttendanceGrid } from './AttendanceGrid'
import { DailySummary } from './DailySummary'
import type { AttendanceStatus } from '../../services/academics.service'
import type { RecordDailyAttendanceDto } from '@aibrains/shared-types'

interface DailyHomeroomEntryProps {
  schoolId: string
  academicYearId: string
}

export function DailyHomeroomEntry({ schoolId, academicYearId }: DailyHomeroomEntryProps) {
  const selectedDate = useAttendanceStore((s) => s.selectedDate)
  const dateActions = useAttendanceDateActions()
  const canCreateAttendance = usePermission('create', 'attendance')

  // The homeroom picker reuses the section store's `selectedSectionId` slot.
  const selectedHomeroomId = useAttendanceStore((s) => s.selectedSectionId)
  const setSelectedHomeroomId = useAttendanceStore((s) => s.setSelectedSectionId)

  const { data: homerooms = [], isLoading: homeroomsLoading } = useHomerooms(
    schoolId,
    academicYearId,
    !!schoolId && !!academicYearId,
  )

  // Default to the only / first homeroom.
  useEffect(() => {
    if (!selectedHomeroomId && homerooms.length > 0) {
      setSelectedHomeroomId(homerooms[0].sectionId)
    }
  }, [homerooms, selectedHomeroomId, setSelectedHomeroomId])

  // Keep selection valid if homerooms change.
  useEffect(() => {
    if (
      selectedHomeroomId &&
      homerooms.length > 0 &&
      !homerooms.some((h) => h.sectionId === selectedHomeroomId)
    ) {
      setSelectedHomeroomId(homerooms[0].sectionId)
    }
  }, [homerooms, selectedHomeroomId, setSelectedHomeroomId])

  const { data: roster, isLoading: rosterLoading } = useSectionRoster({
    sectionId: selectedHomeroomId || '',
    schoolId,
    enabled: !!selectedHomeroomId && !!schoolId,
  })

  // Existing same-day marks (so a reopened day shows what was already recorded).
  const { data: dayRecords } = useSectionAttendanceRecords({
    sectionId: selectedHomeroomId || '',
    schoolId,
    date: selectedDate,
    enabled: !!schoolId && !!selectedHomeroomId,
  })

  const existingRecords = useMemo(() => {
    if (!dayRecords) return []
    return dayRecords.map((r) => ({
      studentId: r.studentId,
      status: r.status as AttendanceStatus,
      notes: r.notes,
      excuseReason: r.excuseReason,
    }))
  }, [dayRecords])

  const { data: calendarDate } = useCalendarDate({
    schoolId,
    date: selectedDate,
    enabled: !!schoolId,
  })
  const isNonInstructional = calendarDate != null && !calendarDate.isInstructionalDay

  const recordDaily = useRecordDailyAttendance()

  // Roll-call summary computed from roster + marks; unmarked students are
  // present by the absentees-only default, so the present count fills the rest.
  const summary = useMemo(() => {
    const total = roster?.students?.length ?? 0
    if (total === 0) return undefined
    const absent = dayRecords?.filter((r) => r.status === 'absent').length ?? 0
    const late = dayRecords?.filter((r) => r.status === 'late').length ?? 0
    const excused = dayRecords?.filter((r) => r.status === 'excused').length ?? 0
    const halfDay = dayRecords?.filter((r) => r.status === 'half_day').length ?? 0
    const remote = dayRecords?.filter((r) => r.status === 'remote').length ?? 0
    const explicitlyMarked = dayRecords?.length ?? 0
    const present = Math.max(0, total - absent - late - excused - halfDay - remote)
    const rate = total > 0 ? ((present + late + remote) / total) * 100 : 0
    return {
      date: selectedDate,
      schoolId,
      totalStudents: total,
      totalRecorded: explicitlyMarked,
      present,
      absent,
      late,
      excused,
      halfDay,
      remote,
      attendanceRate: rate,
    }
  }, [roster, dayRecords, selectedDate, schoolId])

  const handleSave = (
    records: Array<{ studentId: string; status: AttendanceStatus; notes?: string }>,
  ) => {
    if (!selectedHomeroomId) return
    // Send only marked exceptions — present defaults are applied server-side.
    const marks: RecordDailyAttendanceDto['marks'] = records.map((r) => ({
      studentId: r.studentId,
      status: r.status,
      notes: r.notes || undefined,
    }))
    recordDaily.mutate({
      schoolId,
      homeroomSectionId: selectedHomeroomId,
      academicYearId,
      date: selectedDate,
      marks,
    })
  }

  const homeroomOptions = useMemo(
    () =>
      homerooms.map((h) => ({
        value: h.sectionId,
        label: h.sectionName || `Homeroom ${h.sectionNumber}`,
      })),
    [homerooms],
  )

  // No homerooms configured yet — point the operator at the Homerooms tab.
  if (!homeroomsLoading && homerooms.length === 0) {
    return (
      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-12 text-center">
        <Home className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
        <h4 className="text-lg font-medium text-text-primary mb-2">No homerooms set up</h4>
        <p className="text-text-secondary max-w-md mx-auto">
          This school takes a daily homeroom roll-call. Create homerooms from the
          Homerooms tab, then assign students before recording attendance.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-6 flex-wrap">
        <Select
          className="w-full max-w-xs"
          value={selectedHomeroomId ?? ''}
          onChange={(v) => setSelectedHomeroomId(v || null)}
          disabled={homeroomsLoading}
          loading={homeroomsLoading}
          placeholder="Select a homeroom..."
          options={homeroomOptions}
          leadingIcon={<Home className="w-4 h-4" />}
        />
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={dateActions.setSelectedDate}
          onPrevious={dateActions.goToPreviousDay}
          onNext={dateActions.goToNextDay}
          onToday={dateActions.goToToday}
        />
      </div>

      {/* Non-instructional banner */}
      {isNonInstructional && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-[rgb(var(--state-warning-fg))]/10 border border-amber-200 dark:border-amber-500/20">
          <ClipboardCheck className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-xs text-[rgb(var(--state-warning-fg))]">
            {calendarDate?.calendarEvents?.[0]?.description || 'Non-instructional day.'} Attendance
            cannot be submitted for this date.
          </p>
        </div>
      )}

      {/* Roll-call summary */}
      <DailySummary summary={summary} isLoading={rosterLoading} />

      {/* Roster grid (everyone defaults to present; mark absentees) */}
      {!selectedHomeroomId ? (
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-12 text-center">
          <Home className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h4 className="text-lg font-medium text-text-primary mb-2">Select a Homeroom</h4>
          <p className="text-text-secondary max-w-md mx-auto">
            Choose a homeroom to take today's roll-call. Everyone is present by default — just flag
            absentees, then Save.
          </p>
        </div>
      ) : rosterLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-surface-secondary rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !roster?.students?.length ? (
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-12 text-center">
          <Home className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h4 className="text-lg font-medium text-text-primary mb-2">No students assigned</h4>
          <p className="text-text-secondary max-w-md mx-auto">
            Assign students to this homeroom from the Homerooms tab before recording attendance.
          </p>
        </div>
      ) : (
        <AttendanceGrid
          key={`${selectedHomeroomId}-${selectedDate}`}
          students={roster.students}
          date={selectedDate}
          existingRecords={existingRecords}
          onSave={handleSave}
          isSaving={recordDaily.isPending}
          disabled={isNonInstructional || !canCreateAttendance}
        />
      )}
    </div>
  )
}
