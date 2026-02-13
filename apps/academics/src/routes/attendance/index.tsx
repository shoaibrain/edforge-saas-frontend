/**
 * Attendance Module
 *
 * Real-time attendance tracking for the Academics domain.
 * Optimized for speed: section selector, date picker, bulk entry grid,
 * and daily summary dashboard.
 */

import { useMemo, useCallback } from 'react'
import { ClipboardCheck, Loader2 } from 'lucide-react'
import { useActiveSchoolId } from '../../stores/app.store'
import {
  useAttendanceStore,
  useAttendanceDateActions,
} from '../../stores/attendance.store'
import {
  useAttendanceSummary,
  useRecordBulkAttendance,
} from '../../hooks/useAttendance'
import { useSections, flattenSectionPages, useSectionRoster } from '../../hooks'
import { useCurrentAcademicYear } from '../../hooks'
import { DateSelector } from '../../components/attendance/DateSelector'
import { AttendanceGrid } from '../../components/attendance/AttendanceGrid'
import { DailySummary } from '../../components/attendance/DailySummary'
import type { AttendanceStatus } from '../../services/academics.service'

// ============================================================================
// SECTION SELECTOR
// ============================================================================

function SectionSelector({
  sections,
  selectedId,
  onSelect,
  isLoading,
}: {
  sections: Array<{ sectionId: string; sectionNumber: string; courseName?: string; courseCode?: string }>
  selectedId: string | null
  onSelect: (id: string | null) => void
  isLoading: boolean
}) {
  return (
    <div className="relative">
      <select
        value={selectedId ?? ''}
        onChange={(e) => onSelect(e.target.value || null)}
        disabled={isLoading}
        className="w-full max-w-xs px-3 py-2.5 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-50"
      >
        <option value="">Select a section...</option>
        {sections.map((s) => (
          <option key={s.sectionId} value={s.sectionId}>
            {s.courseName || s.courseCode || 'Section'} - {s.sectionNumber}
          </option>
        ))}
      </select>
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="w-4 h-4 animate-spin text-text-tertiary" />
        </div>
      )}
    </div>
  )
}

// ============================================================================
// ATTENDANCE MODULE
// ============================================================================

export function AttendanceModule() {
  const schoolId = useActiveSchoolId() || ''
  const selectedDate = useAttendanceStore((s) => s.selectedDate)
  const selectedSectionId = useAttendanceStore((s) => s.selectedSectionId)
  const setSelectedSectionId = useAttendanceStore((s) => s.setSelectedSectionId)
  const dateActions = useAttendanceDateActions()

  // Fetch current academic year for sections query
  const { data: currentYear } = useCurrentAcademicYear(schoolId)

  // Fetch all active sections
  const {
    data: sectionsData,
    isLoading: sectionsLoading,
  } = useSections({
    schoolId,
    filters: {
      isActive: true,
      academicYearId: currentYear?.yearId,
    },
    enabled: !!schoolId,
  })

  const sections = useMemo(() => flattenSectionPages(sectionsData), [sectionsData])

  // Fetch section roster when section selected
  const { data: roster, isLoading: rosterLoading } = useSectionRoster({
    sectionId: selectedSectionId || '',
    schoolId,
    enabled: !!selectedSectionId && !!schoolId,
  })

  // Fetch daily summary
  const { data: summary, isLoading: summaryLoading } = useAttendanceSummary({
    schoolId,
    date: selectedDate,
    enabled: !!schoolId,
  })

  // Bulk attendance mutation
  const bulkMutation = useRecordBulkAttendance()

  const handleSave = useCallback(
    (records: Array<{ studentId: string; status: AttendanceStatus; notes?: string }>) => {
      if (!schoolId || !selectedSectionId) return
      bulkMutation.mutate({
        date: selectedDate,
        schoolId,
        sectionId: selectedSectionId,
        records,
      })
    },
    [schoolId, selectedSectionId, selectedDate, bulkMutation]
  )

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <ClipboardCheck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Daily Attendance</h1>
                <p className="text-text-secondary mt-0.5">
                  Record and review attendance by class section
                </p>
              </div>
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center gap-6 flex-wrap">
            <SectionSelector
              sections={sections}
              selectedId={selectedSectionId}
              onSelect={setSelectedSectionId}
              isLoading={sectionsLoading}
            />
            <DateSelector
              selectedDate={selectedDate}
              onDateChange={dateActions.setSelectedDate}
              onPrevious={dateActions.goToPreviousDay}
              onNext={dateActions.goToNextDay}
              onToday={dateActions.goToToday}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Daily Summary */}
        <DailySummary summary={summary} isLoading={summaryLoading} />

        {/* Attendance Grid */}
        {!selectedSectionId ? (
          <div className="bg-surface-secondary rounded-xl border border-border-secondary p-12 text-center">
            <ClipboardCheck className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
            <h4 className="text-lg font-medium text-text-primary mb-2">
              Select a Class Section
            </h4>
            <p className="text-text-secondary max-w-md mx-auto">
              Choose a section from the dropdown above to record today's attendance.
              Use quick actions to mark all present, then adjust individual students.
            </p>
          </div>
        ) : rosterLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-14 bg-surface-secondary rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          <AttendanceGrid
            students={roster?.students ?? []}
            date={selectedDate}
            onSave={handleSave}
            isSaving={bulkMutation.isPending}
          />
        )}
      </div>
    </div>
  )
}

export default AttendanceModule
