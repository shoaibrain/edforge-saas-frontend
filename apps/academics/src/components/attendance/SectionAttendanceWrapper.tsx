/**
 * SectionAttendanceWrapper
 *
 * Section-scoped attendance component for the classroom detail page.
 * Uses section-level attendance APIs (SEC_ATTEND#) to ensure records
 * are properly isolated per section — no cross-section data leaks.
 */

import { useMemo, useCallback } from 'react'
import { usePermission } from '@edforge/abac'
import {
  ClipboardCheck,
  Loader2,
  AlertTriangle,
  Check,
  WifiOff,
  CloudOff,
  Wifi,
} from 'lucide-react'
import { useActiveSchoolId } from '../../stores/app.store'
import {
  useAttendanceStore,
  useAttendanceDateActions,
} from '../../stores/attendance.store'
import {
  useCalendarDate,
} from '../../hooks/useAttendance'
import {
  useSectionAttendanceRecords,
  useRecordBulkSectionAttendance,
  useUpdateSectionAttendance,
} from '../../hooks/useSectionAttendance'
import { useSectionRoster } from '../../hooks/useSections'
import { useOfflineAttendance } from '../../hooks/useOfflineAttendance'
import { DateSelector } from './DateSelector'
import { AttendanceGrid } from './AttendanceGrid'
import { DailySummary } from './DailySummary'
import type { AttendanceStatus } from '../../services/academics.service'

// ============================================================================
// SAVE STATUS INDICATOR
// ============================================================================

function SaveStatusIndicator({
  status,
  isOnline,
}: {
  status: 'idle' | 'saved' | 'saving' | 'offline' | 'error'
  isOnline: boolean
}) {
  if (status === 'idle' && isOnline) return null

  const config = {
    saved: { icon: Check, text: 'Saved', className: 'text-emerald-600 dark:text-emerald-400' },
    saving: { icon: Loader2, text: 'Saving...', className: 'text-amber-600 dark:text-amber-400' },
    offline: { icon: WifiOff, text: 'Offline — changes saved locally', className: 'text-red-600 dark:text-red-400' },
    error: { icon: CloudOff, text: 'Save failed — will retry', className: 'text-red-600 dark:text-red-400' },
    idle: { icon: Wifi, text: '', className: 'text-text-tertiary' },
  }

  const { icon: Icon, text, className } = config[status]
  if (!text) return null

  return (
    <div className={`flex items-center gap-1.5 text-xs ${className}`}>
      <Icon className={`w-3.5 h-3.5 ${status === 'saving' ? 'animate-spin' : ''}`} />
      <span>{text}</span>
    </div>
  )
}

// ============================================================================
// CALENDAR BANNER
// ============================================================================

function CalendarBanner({ description, eventType }: { description: string; eventType: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
      <div>
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Non-Instructional Day</p>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
          {description || `This is a ${eventType} day.`} Attendance cannot be submitted for this date.
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// SECTION ATTENDANCE WRAPPER
// ============================================================================

interface SectionAttendanceWrapperProps {
  sectionId: string
}

export function SectionAttendanceWrapper({ sectionId }: SectionAttendanceWrapperProps) {
  const schoolId = useActiveSchoolId() || ''
  const selectedDate = useAttendanceStore((s) => s.selectedDate)
  const dateActions = useAttendanceDateActions()
  const canCreateAttendance = usePermission('create', 'attendance')

  // Fetch section roster
  const { data: roster, isLoading: rosterLoading } = useSectionRoster({
    sectionId,
    schoolId,
    enabled: !!sectionId && !!schoolId,
  })

  // Fetch section-specific attendance records (no client-side filtering needed)
  const { data: sectionRecords } = useSectionAttendanceRecords({
    sectionId,
    schoolId,
    date: selectedDate,
    enabled: !!schoolId && !!sectionId,
  })

  // Map section records to the format AttendanceGrid expects
  const existingRecords = useMemo(() => {
    if (!sectionRecords) return []
    return sectionRecords.map((r) => ({
      studentId: r.studentId,
      status: r.status as AttendanceStatus,
      notes: r.notes,
    }))
  }, [sectionRecords])

  // Calendar date check
  const { data: calendarDate } = useCalendarDate({
    schoolId,
    date: selectedDate,
    enabled: !!schoolId,
  })

  const isNonInstructional = calendarDate != null && !calendarDate.isInstructionalDay

  // Mutations — section-level
  const bulkMutation = useRecordBulkSectionAttendance()
  const updateMutation = useUpdateSectionAttendance()

  // Section-level summary computed from roster + records (no extra API call)
  const sectionSummary = useMemo(() => {
    if (!roster?.students?.length) return undefined
    const total = roster.students.length
    const present = sectionRecords?.filter((r) => r.status === 'present').length ?? 0
    const absent = sectionRecords?.filter((r) => r.status === 'absent').length ?? 0
    const late = sectionRecords?.filter((r) => r.status === 'late').length ?? 0
    const excused = sectionRecords?.filter((r) => r.status === 'excused').length ?? 0
    const halfDay = sectionRecords?.filter((r) => r.status === 'half_day').length ?? 0
    const remote = sectionRecords?.filter((r) => r.status === 'remote').length ?? 0
    const rate = total > 0 ? ((present + late + remote) / total) * 100 : 0
    return {
      date: selectedDate,
      schoolId,
      totalStudents: total,
      present,
      absent,
      late,
      excused,
      halfDay,
      remote,
      attendanceRate: rate,
    }
  }, [roster, sectionRecords, selectedDate, schoolId])

  // Offline resilience
  const offlineState = useOfflineAttendance({
    schoolId,
    sectionId,
    date: selectedDate,
    onSave: async (records) => {
      if (!schoolId || !sectionId) return
      await bulkMutation.mutateAsync({
        date: selectedDate,
        schoolId,
        sectionId,
        records,
      })
    },
  })

  const handleSave = useCallback(
    (records: Array<{ studentId: string; status: AttendanceStatus; notes?: string }>) => {
      if (!schoolId || !sectionId) return
      offlineState.persistLocally(
        records.map((r) => ({ studentId: r.studentId, status: r.status, notes: r.notes ?? '' }))
      )
      offlineState.save()
    },
    [schoolId, sectionId, offlineState]
  )

  const handleCorrection = useCallback(
    (record: { studentId: string; status: AttendanceStatus; notes?: string; excuseType?: string }) => {
      if (!schoolId || !sectionId) return
      // Check if this student already has a record for this date
      const hasExisting = sectionRecords?.some((r) => r.studentId === record.studentId)
      if (hasExisting) {
        // PATCH existing record
        updateMutation.mutate({
          date: selectedDate,
          sectionId,
          studentId: record.studentId,
          status: record.status,
          notes: record.notes,
          excuseReason: record.excuseType,
          schoolId,
        })
      } else {
        // POST new record via bulk endpoint (single-record array)
        bulkMutation.mutate({
          date: selectedDate,
          schoolId,
          sectionId,
          records: [{ studentId: record.studentId, status: record.status, notes: record.notes }],
        })
      }
    },
    [schoolId, sectionId, selectedDate, sectionRecords, updateMutation, bulkMutation]
  )

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-6 flex-wrap">
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={dateActions.setSelectedDate}
          onPrevious={dateActions.goToPreviousDay}
          onNext={dateActions.goToNextDay}
          onToday={dateActions.goToToday}
        />
        <SaveStatusIndicator status={offlineState.saveStatus} isOnline={offlineState.isOnline} />
      </div>

      {/* Calendar Non-Instructional Banner */}
      {isNonInstructional && (
        <CalendarBanner
          description={calendarDate?.calendarEvents?.[0]?.description || ''}
          eventType={calendarDate?.calendarEvents?.[0]?.eventType || 'non-instructional'}
        />
      )}

      {/* Daily Summary */}
      <DailySummary summary={sectionSummary} isLoading={rosterLoading} />

      {/* Attendance Grid */}
      {rosterLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-surface-secondary rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !roster?.students?.length ? (
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-12 text-center">
          <ClipboardCheck className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h4 className="text-lg font-medium text-text-primary mb-2">No Students Enrolled</h4>
          <p className="text-text-secondary max-w-md mx-auto">
            This section has no students enrolled yet. Add students from the People tab.
          </p>
        </div>
      ) : (
        <AttendanceGrid
          key={`${sectionId}-${selectedDate}`}
          students={roster.students}
          date={selectedDate}
          existingRecords={existingRecords}
          onSave={handleSave}
          isSaving={bulkMutation.isPending || offlineState.saveStatus === 'saving'}
          disabled={isNonInstructional || !canCreateAttendance}
          saveStatus={offlineState.saveStatus}
          onCorrection={handleCorrection}
        />
      )}
    </div>
  )
}
