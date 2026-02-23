/**
 * Attendance Module
 *
 * Real-time attendance tracking for the Academics domain.
 * Two-tab layout: Daily Entry (bulk grid) and Dashboard (analytics).
 * Includes calendar-aware validation and offline resilience.
 *
 * Sprint 5 — Rostering & Attendance
 */

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardCheck,
  Loader2,
  BarChart3,
  AlertTriangle,
  Wifi,
  WifiOff,
  Check,
  CloudOff,
  Calendar,
  RefreshCw,
} from 'lucide-react'
import { useActiveSchoolId } from '../../stores/app.store'
import {
  useAttendanceStore,
  useAttendanceDateActions,
} from '../../stores/attendance.store'
import {
  useAttendanceSummary,
  useAttendanceRecords,
  useRecordBulkAttendance,
  useUpdateAttendance,
  useCalendarDate,
  useAttendanceOverview,
} from '../../hooks/useAttendance'
import { useSections, flattenSectionPages, useSectionRoster } from '../../hooks'
import { useCurrentAcademicYear } from '../../hooks'
import { useOfflineAttendance } from '../../hooks/useOfflineAttendance'
import { DateSelector } from '../../components/attendance/DateSelector'
import { AttendanceGrid } from '../../components/attendance/AttendanceGrid'
import { DailySummary } from '../../components/attendance/DailySummary'
import { AttendanceDashboard } from './dashboard'
import type { AttendanceStatus } from '../../services/academics.service'

type TabId = 'overview' | 'daily-entry'

const TABS: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'daily-entry', label: 'Daily Entry', icon: ClipboardCheck },
]

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
    saved: {
      icon: Check,
      text: 'Saved',
      className: 'text-emerald-600 dark:text-emerald-400',
    },
    saving: {
      icon: Loader2,
      text: 'Saving...',
      className: 'text-amber-600 dark:text-amber-400',
    },
    offline: {
      icon: WifiOff,
      text: 'Offline — changes saved locally',
      className: 'text-red-600 dark:text-red-400',
    },
    error: {
      icon: CloudOff,
      text: 'Save failed — will retry',
      className: 'text-red-600 dark:text-red-400',
    },
    idle: {
      icon: Wifi,
      text: '',
      className: 'text-text-tertiary',
    },
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
// TAB BAR (framer-motion animated underline — consistent with other modules)
// ============================================================================

function TabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}) {
  return (
    <nav className="flex gap-1" aria-label="Attendance tabs">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? 'text-text-primary'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${isActive ? 'text-teal-500' : ''}`} />
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="attendanceTab"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-teal-500 rounded-t-full"
                initial={false}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 30,
                }}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}

// ============================================================================
// CALENDAR INDICATOR
// ============================================================================

function CalendarBanner({
  description,
  eventType,
}: {
  description: string
  eventType: string
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
      <div>
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
          Non-Instructional Day
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
          {description || `This is a ${eventType} day.`} Attendance cannot be submitted for this date.
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// SECTION SELECTOR
// ============================================================================

function SectionSelector({
  sections,
  selectedId,
  onSelect,
  isLoading,
  completedSectionIds,
}: {
  sections: Array<{ sectionId: string; sectionNumber: string; courseName?: string; courseCode?: string }>
  selectedId: string | null
  onSelect: (id: string | null) => void
  isLoading: boolean
  /** Task 4.1: Section IDs that have completed attendance today */
  completedSectionIds?: Set<string>
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
            {completedSectionIds?.has(s.sectionId) ? '\u2713 ' : ''}
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
  const [activeTab, setActiveTab] = useState<TabId>('overview')

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

  // Fetch daily summary (with academicYearId for enrollment-based totalStudents)
  const { data: summary, isLoading: summaryLoading } = useAttendanceSummary({
    schoolId,
    date: selectedDate,
    academicYearId: currentYear?.yearId,
    enabled: !!schoolId,
  })

  // Fetch existing attendance records for the selected date
  const { data: attendanceRecords } = useAttendanceRecords({
    schoolId,
    date: selectedDate,
    enabled: !!schoolId && !!selectedSectionId && activeTab === 'daily-entry',
  })

  // Filter records to only students in the selected section's roster
  const existingRecords = useMemo(() => {
    if (!attendanceRecords || !roster?.students) return []
    const rosterStudentIds = new Set(roster.students.map((s) => s.studentId))
    return attendanceRecords
      .filter((r) => rosterStudentIds.has(r.studentId))
      .map((r) => ({
        studentId: r.studentId,
        status: r.status,
        notes: r.notes,
      }))
  }, [attendanceRecords, roster?.students])

  // Calendar date check (Sprint 5)
  const { data: calendarDate } = useCalendarDate({
    schoolId,
    date: selectedDate,
    enabled: !!schoolId && activeTab === 'daily-entry',
  })

  const isNonInstructional = calendarDate != null &&
    !calendarDate.isInstructionalDay

  // Bulk attendance mutation
  const bulkMutation = useRecordBulkAttendance()

  // Task 4.6: Update attendance mutation for corrections
  const updateMutation = useUpdateAttendance()

  // Task 4.1: Fetch overview for section completion indicators
  const { data: overviewData } = useAttendanceOverview({
    schoolId,
    academicYearId: currentYear?.yearId || '',
    date: selectedDate,
    enabled: !!schoolId && !!currentYear?.yearId && activeTab === 'daily-entry',
  })

  // Task 4.1: Build completed section IDs set
  const completedSectionIds = useMemo(() => {
    const ids = new Set<string>()
    if (overviewData?.sectionCompletion?.sections) {
      for (const s of overviewData.sectionCompletion.sections) {
        if (s.isComplete) ids.add(s.sectionId)
      }
    }
    return ids
  }, [overviewData])

  // Task 4.8: Compute previous day's date
  const previousDate = useMemo(() => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    return d.toISOString().split('T')[0]
  }, [selectedDate])

  // Task 4.8: Fetch previous day's attendance records (lazy — delay 2s)
  const { data: previousDayAttendanceRecords } = useAttendanceRecords({
    schoolId,
    date: previousDate,
    enabled: !!schoolId && !!selectedSectionId && activeTab === 'daily-entry',
  })

  // Task 4.8: Filter previous day records to section roster
  const previousDayRecords = useMemo(() => {
    if (!previousDayAttendanceRecords || !roster?.students) return undefined
    const rosterStudentIds = new Set(roster.students.map((s) => s.studentId))
    return previousDayAttendanceRecords
      .filter((r) => rosterStudentIds.has(r.studentId))
      .map((r) => ({ studentId: r.studentId, status: r.status as AttendanceStatus }))
  }, [previousDayAttendanceRecords, roster?.students])

  // Offline resilience (Sprint 5)
  const offlineState = useOfflineAttendance({
    schoolId,
    sectionId: selectedSectionId || '',
    date: selectedDate,
    onSave: async (records) => {
      if (!schoolId || !selectedSectionId) return
      await bulkMutation.mutateAsync({
        date: selectedDate,
        schoolId,
        sectionId: selectedSectionId,
        records,
      })
    },
  })

  const handleSave = useCallback(
    (records: Array<{ studentId: string; status: AttendanceStatus; notes?: string }>) => {
      if (!schoolId || !selectedSectionId) return
      // Persist locally for offline resilience
      offlineState.persistLocally(
        records.map(r => ({ studentId: r.studentId, status: r.status, notes: r.notes ?? '' }))
      )
      // Then save to server
      offlineState.save()
    },
    [schoolId, selectedSectionId, offlineState]
  )

  // Task 4.6: Correction handler for past-date individual updates
  const handleCorrection = useCallback(
    (record: { studentId: string; status: AttendanceStatus; notes?: string; excuseType?: string }) => {
      if (!schoolId) return
      updateMutation.mutate({
        date: selectedDate,
        studentId: record.studentId,
        status: record.status,
        notes: record.notes,
        excuseType: record.excuseType,
        schoolId,
      })
    },
    [schoolId, selectedDate, updateMutation]
  )

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <ClipboardCheck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Attendance</h1>
                <p className="text-text-secondary mt-0.5">
                  Record and review attendance by class section
                </p>
              </div>
            </div>
            {/* Task 2.1: Academic Year Context Bar */}
            {currentYear && (
              <div className="flex items-center gap-4 text-xs text-text-tertiary">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{currentYear.name || 'Academic Year'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            )}
          </div>

          {/* Controls Row (only for daily entry) */}
          {activeTab === 'daily-entry' && (
            <div className="flex items-center gap-6 flex-wrap mb-4">
              <SectionSelector
                sections={sections}
                selectedId={selectedSectionId}
                onSelect={setSelectedSectionId}
                isLoading={sectionsLoading}
                completedSectionIds={completedSectionIds}
              />
              <DateSelector
                selectedDate={selectedDate}
                onDateChange={dateActions.setSelectedDate}
                onPrevious={dateActions.goToPreviousDay}
                onNext={dateActions.goToNextDay}
                onToday={dateActions.goToToday}
              />
              <SaveStatusIndicator
                status={offlineState.saveStatus}
                isOnline={offlineState.isOnline}
              />
            </div>
          )}

          {/* Tab Navigation */}
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'overview' && (
              <AttendanceDashboard
                schoolId={schoolId}
                academicYearId={currentYear?.yearId || ''}
                currentDate={selectedDate}
              />
            )}

            {activeTab === 'daily-entry' && (
              <div className="space-y-6">
                {/* Calendar Non-Instructional Banner */}
                {isNonInstructional && (
                  <CalendarBanner
                    description={calendarDate?.calendarEvents?.[0]?.description || ''}
                    eventType={calendarDate?.calendarEvents?.[0]?.eventType || 'non-instructional'}
                  />
                )}

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
                    key={`${selectedSectionId}-${selectedDate}`}
                    students={roster?.students ?? []}
                    date={selectedDate}
                    existingRecords={existingRecords}
                    onSave={handleSave}
                    isSaving={bulkMutation.isPending || offlineState.saveStatus === 'saving'}
                    disabled={isNonInstructional}
                    saveStatus={offlineState.saveStatus}
                    onCorrection={handleCorrection}
                    previousDayRecords={previousDayRecords}
                  />
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AttendanceModule
