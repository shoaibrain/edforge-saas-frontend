/**
 * Attendance Module
 *
 * Real-time attendance tracking for the Academics domain.
 * Two-tab layout: Daily Entry (bulk grid) and Dashboard (analytics).
 * Includes calendar-aware validation and offline resilience.
 *
 * Sprint 5 — Rostering & Attendance
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePermission } from '@edforge/abac'
import { Select } from '@edforge/ui'
import {
  ClipboardCheck,
  Loader2,
  BarChart3,
  AlertTriangle,
  Wifi,
  WifiOff,
  Check,
  CloudOff,
  Info,
  FileSpreadsheet,
} from 'lucide-react'
import { useActiveSchoolId } from '../../stores/app.store'
import {
  useAttendanceStore,
  useAttendanceDateActions,
} from '../../stores/attendance.store'
import {
  useAttendanceSummary,
  useCalendarDate,
  useAttendanceOverview,
  useAttendancePolicy,
  usePresenceLocks,
} from '../../hooks/useAttendance'
import {
  useSectionAttendanceRecords,
  useRecordBulkSectionAttendance,
  useUpdateSectionAttendance,
} from '../../hooks/useSectionAttendance'
import { useSections, flattenSectionPages, useSectionRoster } from '../../hooks'
import { useCurrentAcademicYear } from '../../hooks'
import { useOfflineAttendance } from '../../hooks/useOfflineAttendance'
import { DateSelector } from '../../components/attendance/DateSelector'
import { AttendanceGrid } from '../../components/attendance/AttendanceGrid'
import { DailySummary } from '../../components/attendance/DailySummary'
import { IemisExportPanel } from '../../components/attendance/IemisExportPanel'
import { AttendanceDashboard } from './dashboard'
import { NoCurrentAcademicYearEmptyState } from '../../components/common'
import type { AttendanceStatus } from '../../services/academics.service'

type TabId = 'overview' | 'daily-entry' | 'iemis-export'

const TABS: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'daily-entry', label: 'Daily Entry', icon: ClipboardCheck },
  { id: 'iemis-export', label: 'IEMiS Export', icon: FileSpreadsheet },
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
      className: 'text-[rgb(var(--state-success-fg))]',
    },
    saving: {
      icon: Loader2,
      text: 'Saving...',
      className: 'text-[rgb(var(--state-warning-fg))]',
    },
    offline: {
      icon: WifiOff,
      text: 'Offline — changes saved locally',
      className: 'text-[rgb(var(--state-danger-fg))]',
    },
    error: {
      icon: CloudOff,
      text: 'Save failed — will retry',
      className: 'text-[rgb(var(--state-danger-fg))]',
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
  tabs,
}: {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  tabs: { id: TabId; label: string; icon: typeof BarChart3 }[]
}) {
  return (
    <nav className="flex gap-1" aria-label="Attendance tabs">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-2xs font-medium cursor-pointer transition-all border ${
              isActive
                ? 'text-[#378ADD] border-[rgb(var(--accent-academics)/0.2)] bg-[rgb(var(--accent-academics)/0.1)]'
                : 'text-[rgb(var(--text-disabled))] border-transparent bg-transparent'
            }`}
          >
            <tab.icon style={{ width: 11, height: 11 }} />
            {tab.label}
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
    <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-[rgb(var(--state-warning-fg))]/10 border border-amber-200 dark:border-amber-500/20">
      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
      <div>
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
          Non-Instructional Day
        </p>
        <p className="text-xs text-[rgb(var(--state-warning-fg))] mt-0.5">
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
  // Auto-select first section when sections load and nothing is selected
  useEffect(() => {
    if (!selectedId && sections.length > 0 && sections.length <= 5) {
      onSelect(sections[0].sectionId)
    }
  }, [sections, selectedId, onSelect])

  if (!isLoading && sections.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-text-tertiary bg-surface-secondary border border-border-secondary rounded-lg max-w-xs">
        No sections assigned. Contact your administrator.
      </div>
    )
  }

  return (
    <Select
      className="w-full max-w-xs"
      value={selectedId ?? ''}
      onChange={(v) => onSelect(v || null)}
      disabled={isLoading}
      loading={isLoading}
      placeholder="Select a section..."
      options={sections.map((s) => ({
        value: s.sectionId,
        label: `${completedSectionIds?.has(s.sectionId) ? '\u2713 ' : ''}${s.courseName || s.courseCode || 'Section'} - ${s.sectionNumber}`,
      }))}
    />
  )
}

// ============================================================================
// ATTENDANCE MODULE
// ============================================================================

/**
 * Thin gate component. Splits the entry-level current-AY check from the
 * content component so the rules-of-hooks ordering in `AttendanceModuleContent`
 * stays simple — the inner component never has to deal with an undefined
 * `currentYear`. Falls back to the shared empty state when no AY is current.
 *
 * Sprint 1 / Ticket 1.3a (academic-year-current-flag-bug).
 */
export function AttendanceModule() {
  const schoolId = useActiveSchoolId() || ''
  const { data: currentYear, isLoading: yearLoading } = useCurrentAcademicYear(schoolId)

  if (yearLoading) {
    return (
      <div className="space-y-3 px-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-surface-secondary rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (!currentYear?.yearId) {
    return (
      <div className="p-6">
        <NoCurrentAcademicYearEmptyState
          secondaryMessage="Set up an academic year in school settings before recording attendance."
        />
      </div>
    )
  }

  return <AttendanceModuleContent schoolId={schoolId} currentYearId={currentYear.yearId} currentYearName={currentYear.name} />
}

interface AttendanceModuleContentProps {
  schoolId: string
  currentYearId: string
  currentYearName: string
}

function AttendanceModuleContent({ schoolId, currentYearId, currentYearName }: AttendanceModuleContentProps) {
  const selectedDate = useAttendanceStore((s) => s.selectedDate)
  const selectedSectionId = useAttendanceStore((s) => s.selectedSectionId)
  const setSelectedSectionId = useAttendanceStore((s) => s.setSelectedSectionId)
  const dateActions = useAttendanceDateActions()
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  // ABAC: check if user can create/edit attendance
  const canCreateAttendance = usePermission('create', 'attendance')
  // ABAC: IEMiS export is gated on attendance:export (Principal/VP/admin); hide
  // the tab for view-only roles (matches the export-gated backend route).
  const canExportAttendance = usePermission('export', 'attendance')
  const visibleTabs = useMemo(
    () => (canExportAttendance ? TABS : TABS.filter((t) => t.id !== 'iemis-export')),
    [canExportAttendance],
  )

  // currentYearId / currentYearName are guaranteed non-empty by the gate in
  // `AttendanceModule` above (Sprint 1 / Ticket 1.3a). Defensive `?.` falsy
  // defaults on `currentYear` were removed in Ticket 1.3b.

  // Fetch all active sections
  const {
    data: sectionsData,
    isLoading: sectionsLoading,
  } = useSections({
    schoolId,
    filters: {
      isActive: true,
      academicYearId: currentYearId,
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
    academicYearId: currentYearId,
    enabled: !!schoolId,
  })

  // Fetch section-specific attendance records (no client-side filtering needed)
  const { data: sectionRecords } = useSectionAttendanceRecords({
    sectionId: selectedSectionId || '',
    schoolId,
    date: selectedDate,
    enabled: !!schoolId && !!selectedSectionId && activeTab === 'daily-entry',
  })

  const existingRecords = useMemo(() => {
    if (!sectionRecords) return []
    return sectionRecords.map((r) => ({
      studentId: r.studentId,
      status: r.status as AttendanceStatus,
      notes: r.notes,
    }))
  }, [sectionRecords])

  // Calendar date check (Sprint 5)
  const { data: calendarDate } = useCalendarDate({
    schoolId,
    date: selectedDate,
    enabled: !!schoolId && activeTab === 'daily-entry',
  })

  const isNonInstructional = calendarDate != null &&
    !calendarDate.isInstructionalDay

  // Section-level mutations
  const bulkMutation = useRecordBulkSectionAttendance()
  const updateMutation = useUpdateSectionAttendance()

  // Task 4.1: Fetch overview for section completion indicators
  const { data: overviewData } = useAttendanceOverview({
    schoolId,
    academicYearId: currentYearId,
    date: selectedDate,
    enabled: !!schoolId && activeTab === 'daily-entry',
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

  // Attendance realignment: resolve the effective policy (daily_presence |
  // per_section_granular). Mode drives the presence-lock overlay below.
  const { data: policy } = useAttendancePolicy(schoolId)
  const isDailyPresence = policy?.effectiveMode === 'daily_presence'

  // Under daily_presence, a student's day-presence is locked by their FIRST
  // section. Fetch the cross-section locks (only in this mode) and mark students
  // already locked by ANOTHER section as read-only in the current section's grid.
  const { data: presenceLockData } = usePresenceLocks(
    isDailyPresence && activeTab === 'daily-entry' ? schoolId : undefined,
    isDailyPresence && activeTab === 'daily-entry' ? selectedDate : undefined,
  )
  const lockedStudents = useMemo(() => {
    const map = new Map<string, string>()
    if (!isDailyPresence || !presenceLockData?.locks || !selectedSectionId) return map
    for (const lock of presenceLockData.locks) {
      if (lock.lockedBySectionId !== selectedSectionId) {
        const where = lock.lockedBySectionName ? ` in ${lock.lockedBySectionName}` : ''
        map.set(lock.studentId, `Already ${lock.status}${where}`)
      }
    }
    return map
  }, [isDailyPresence, presenceLockData, selectedSectionId])

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
    (records: Array<{ studentId: string; status: AttendanceStatus; notes?: string; excuseReason?: string }>) => {
      if (!schoolId || !selectedSectionId) return
      // Persist locally for offline resilience. F2.T6 — carry excuseReason through
      // the offline round-trip; the route previously stripped it before
      // persistLocally, so absence reasons never reached the server on save.
      offlineState.persistLocally(
        records.map(r => ({ studentId: r.studentId, status: r.status, notes: r.notes ?? '', excuseReason: r.excuseReason }))
      )
      // Then save to server
      offlineState.save()
    },
    [schoolId, selectedSectionId, offlineState]
  )

  const handleCorrection = useCallback(
    (record: { studentId: string; status: AttendanceStatus; notes?: string; excuseType?: string }) => {
      if (!schoolId || !selectedSectionId) return
      // Check if this student already has a record for this date
      const hasExisting = sectionRecords?.some((r) => r.studentId === record.studentId)
      if (hasExisting) {
        // PATCH existing record
        updateMutation.mutate({
          date: selectedDate,
          sectionId: selectedSectionId,
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
          sectionId: selectedSectionId,
          records: [{ studentId: record.studentId, status: record.status, notes: record.notes }],
        })
      }
    },
    [schoolId, selectedSectionId, selectedDate, sectionRecords, updateMutation, bulkMutation]
  )

  return (
    <div style={{ minHeight: '100%' }}>
      {/* V2 Attendance Sub-Header + Sub-Tabs */}
      <div className="px-6">
        {/* Sub-Header Row */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-lg bg-[rgb(var(--accent-attendance)/0.1)]" style={{ width: 32, height: 32 }}>
              <ClipboardCheck className="w-4 h-4 text-[rgb(var(--accent-attendance-text))]" />
            </div>
            <div>
              <div className="text-base font-semibold tracking-[-0.2px] text-[rgb(var(--text-primary))]">Attendance</div>
              <div className="text-3xs text-[rgb(var(--text-disabled))]">
                Record and review attendance by class section · {currentYearName || 'Academic Year'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-3xs text-[rgb(var(--text-disabled))]">
              Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Sub-Tabs */}
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} tabs={visibleTabs} />

        {/* Controls Row (only for daily entry) */}
        {activeTab === 'daily-entry' && (
          <div className="flex items-center gap-6 flex-wrap mt-3 mb-1">
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
      </div>

      {/* Tab Content */}
      <div className="pt-4 px-6 pb-6">
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
                academicYearId={currentYearId}
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

                {/* Attendance policy banner (realignment) */}
                {policy && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[rgb(var(--state-info-bg)/0.12)] border border-[rgb(var(--state-info-fg)/0.2)] text-xs text-text-secondary">
                    <Info className="w-3.5 h-3.5 mt-0.5 text-[rgb(var(--state-info-fg))] shrink-0" />
                    <span>
                      Attendance mode:{' '}
                      <strong>{isDailyPresence ? 'Daily presence' : 'Per-section'}</strong>
                      {isDailyPresence
                        ? ' — a student present in any section counts present for the day; later sections show them locked.'
                        : ' — each section is recorded independently.'}
                    </span>
                  </div>
                )}

                {/* Missing-data-on-an-instructional-day affordance. A valid school
                    day with no saved records is "not taken yet" — make that explicit
                    and explain the absentee-first default, rather than letting the
                    pre-filled grid read as if attendance were already recorded. */}
                {selectedSectionId && !isNonInstructional && existingRecords.length === 0 &&
                  (roster?.students?.length ?? 0) > 0 && (
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[rgb(var(--state-warning-bg)/0.12)] border border-[rgb(var(--state-warning-fg)/0.2)] text-xs text-text-secondary">
                      <Info className="w-3.5 h-3.5 mt-0.5 text-[rgb(var(--state-warning-fg))] shrink-0" />
                      <span>
                        Attendance has not been recorded for this day yet. Students default to{' '}
                        <strong>Present</strong> — mark the exceptions, then Save.
                      </span>
                    </div>
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
                    disabled={isNonInstructional || !canCreateAttendance}
                    saveStatus={offlineState.saveStatus}
                    onCorrection={handleCorrection}
                    lockedStudents={lockedStudents}
                    // Absentee-first only on instructional days. On a weekend/holiday
                    // we must NOT pre-fill everyone present (there is no school day to
                    // record); leave the roster unmarked behind the disabled overlay.
                    defaultStatus={isNonInstructional ? null : 'present'}
                  />
                )}
              </div>
            )}

            {activeTab === 'iemis-export' && canExportAttendance && (
              <IemisExportPanel schoolId={schoolId} academicYearId={currentYearId} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AttendanceModule
