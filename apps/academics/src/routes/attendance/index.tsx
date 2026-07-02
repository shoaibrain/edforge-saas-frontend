/**
 * Attendance Module — one adaptive dashboard.
 *
 * Monitoring IS the page; recording opens in a focused drawer; IEMiS export is a
 * dialog. This replaces the old Overview / Daily-Entry / IEMiS child-tabs (and
 * their sub-router), which were three jobs at three cadences stacked as siblings.
 * The redesign leads with the coverage-vs-rate reframe, then a weighted-coverage
 * "Sections to record" widget, an at-risk insight strip + list, patterns, and a
 * 30-day trend. The recording flow (marking, locks, save, IEMiS export) is
 * re-housed, not rewritten. Scope is derived from the signed-in user's role (the
 * aggregate is server-scoped); no manual lens toggle.
 *
 * Sprint 5 — Rostering & Attendance · Classrooms redesign (Attendance tab).
 */

import { useMemo, useState } from 'react'
import { usePermission } from '@edforge/abac'
import { useActiveSchoolId } from '../../stores/app.store'
import {
  useAttendanceStore,
  useAttendanceDateActions,
} from '../../stores/attendance.store'
import {
  useAttendanceOverview,
  useAttendancePolicy,
  useAttendanceStudentTrends,
} from '../../hooks/useAttendance'
import { useSections, flattenSectionPages, useCurrentAcademicYear } from '../../hooks'
import { NoCurrentAcademicYearEmptyState } from '../../components/common'
import {
  AttendanceCommandBar,
  CoverageReframeBanner,
  SectionsToRecord,
  AttendanceInsightStrip,
  AtRiskPanel,
  PatternsRail,
  TrendPanel,
  RecordingDrawer,
  IemisExportDialog,
  toSectionCoverage,
  computeCoverageSummary,
  rankAtRisk,
  toGradeRates,
  sortActionableFirst,
} from '../../components/attendance/dashboard'
import { useAcademicsI18n } from '../../lib/i18n'

// ============================================================================
// ATTENDANCE MODULE — entry-level current-AY gate (unchanged from Ticket 1.3a)
// ============================================================================

/**
 * Thin gate: keeps the current-AY check out of the content component so its
 * rules-of-hooks ordering stays simple. Falls back to the shared empty state
 * when no academic year is current.
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

  return <AttendanceModuleContent schoolId={schoolId} currentYearId={currentYear.yearId} />
}

interface AttendanceModuleContentProps {
  schoolId: string
  currentYearId: string
}

/** 30-day window ending on `date` (YYYY-MM-DD), for the at-risk sparkline trends. */
function thirtyDayWindow(date: string): { startDate: string; endDate: string } {
  const end = new Date(`${date}T00:00:00`)
  const start = new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000)
  return { startDate: start.toISOString().split('T')[0], endDate: date }
}

export function AttendanceModuleContent({ schoolId, currentYearId }: AttendanceModuleContentProps) {
  const { t, formatDate } = useAcademicsI18n()
  const selectedDate = useAttendanceStore((s) => s.selectedDate)
  const dateActions = useAttendanceDateActions()

  // ABAC — recording, IEMiS export, and the derived scope lens (school-wide vs
  // my-sections). The aggregate is scoped server-side by the caller's role; the
  // lens is a read-only indicator, not a data toggle.
  const canCreate = usePermission('create', 'attendance')
  const canExport = usePermission('export', 'attendance')
  const isSchoolWide = usePermission('manage', 'attendance')

  const [drawerSectionId, setDrawerSectionId] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  const {
    data: overview,
    isLoading,
    error,
  } = useAttendanceOverview({
    schoolId,
    academicYearId: currentYearId,
    date: selectedDate,
    enabled: !!schoolId && !!currentYearId,
  })

  const { data: policy } = useAttendancePolicy(schoolId)
  const isDailyPresence = policy?.effectiveMode === 'daily_presence'
  const atRiskThreshold = policy?.countingPolicy?.atRiskThresholdPct ?? 90

  // Full section objects enrich the sections-to-record list with subject + teacher
  // (the aggregate's per-section completion has neither).
  const { data: sectionsData } = useSections({
    schoolId,
    filters: { isActive: true, academicYearId: currentYearId },
    enabled: !!schoolId,
  })
  const sectionsById = useMemo(() => {
    const list = flattenSectionPages(sectionsData)
    return new Map(list.map((s) => [s.sectionId, s]))
  }, [sectionsData])

  // Derive the two honest signals + the at-risk cohort from the single aggregate.
  const coverage = useMemo(
    () => toSectionCoverage(overview?.sectionCompletion?.sections ?? []),
    [overview],
  )
  const summary = useMemo(() => computeCoverageSummary(overview, coverage), [overview, coverage])
  const rankedAlerts = useMemo(
    () => rankAtRisk(overview?.atRiskStudents ?? [], atRiskThreshold),
    [overview, atRiskThreshold],
  )
  const gradeRates = useMemo(() => toGradeRates(overview?.todaySummary?.byGradeLevel), [overview])

  // Real 30-day sparkline series for the visible at-risk students (batched).
  const atRiskIds = useMemo(() => rankedAlerts.slice(0, 50).map((a) => a.studentId), [rankedAlerts])
  const { startDate, endDate } = useMemo(() => thirtyDayWindow(selectedDate), [selectedDate])
  const { data: trends } = useAttendanceStudentTrends({
    schoolId,
    studentIds: atRiskIds,
    startDate,
    endDate,
    enabled: !!schoolId && atRiskIds.length > 0,
  })

  const dateLabel = formatDate(`${selectedDate}T00:00:00`, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const openFirstUnrecorded = () => {
    const first = sortActionableFirst(coverage).find((c) => c.status !== 'recorded')
    if (first) setDrawerSectionId(first.sectionId)
  }
  const canRecord = coverage.some((c) => c.status !== 'recorded')

  const drawerCoverage = drawerSectionId
    ? coverage.find((c) => c.sectionId === drawerSectionId)
    : undefined
  const drawerSection = drawerSectionId ? sectionsById.get(drawerSectionId) : undefined

  // Reframe numbers: the deflated blended average vs the recorded rate.
  const artifactPct = overview?.periodAverages?.academicYear ?? 0
  const recordedRate =
    (overview?.todaySummary?.totalRecorded ?? 0) > 0
      ? (overview?.todaySummary?.attendanceRate ?? 0)
      : (overview?.periodAverages?.last7Days ?? 0)

  return (
    <div className="flex flex-col gap-4 px-6 pb-8 pt-3">
      <AttendanceCommandBar
        selectedDate={selectedDate}
        onDateChange={dateActions.setSelectedDate}
        onPreviousDay={dateActions.goToPreviousDay}
        onNextDay={dateActions.goToNextDay}
        onToday={dateActions.goToToday}
        policy={policy}
        isSchoolWide={isSchoolWide}
        canExport={canExport}
        onExport={() => setExportOpen(true)}
      />

      {error ? (
        <div className="rounded-xl border border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-secondary))] p-6 text-center">
          <p className="text-sm font-medium text-[rgb(var(--state-danger-fg))]">
            {t('attendance.dashboard.loadFailed')}
          </p>
          <p className="mt-1 text-2xs text-[rgb(var(--text-tertiary))]">
            {t('attendance.dashboard.loadFailedDescription')}
          </p>
        </div>
      ) : (
        <>
          {overview && (
            <CoverageReframeBanner
              artifactPct={artifactPct}
              recordedRate={recordedRate}
              onRecordFirst={openFirstUnrecorded}
              canRecord={canRecord}
            />
          )}

          <SectionsToRecord
            coverage={coverage}
            summary={summary}
            sectionsById={sectionsById}
            dateLabel={dateLabel}
            onRecord={setDrawerSectionId}
            loading={isLoading}
          />

          {!isLoading && overview && (
            <>
              <AttendanceInsightStrip rankedAlerts={rankedAlerts} gradeRates={gradeRates} />

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <AtRiskPanel alerts={rankedAlerts} trends={trends ?? {}} schoolId={schoolId} />
                </div>
                <div className="lg:col-span-5">
                  <PatternsRail dayOfWeekPattern={overview.dayOfWeekPattern} gradeRates={gradeRates} />
                </div>
              </div>

              <TrendPanel trend={overview.trend ?? []} periodAverages={overview.periodAverages} />
            </>
          )}
        </>
      )}

      <RecordingDrawer
        open={!!drawerSectionId}
        sectionId={drawerSectionId}
        courseName={drawerCoverage?.courseName ?? drawerSection?.courseName}
        sectionNumber={drawerCoverage?.sectionNumber ?? drawerSection?.sectionNumber}
        recordStatus={drawerCoverage?.status}
        recordedCount={drawerCoverage?.recordedCount ?? 0}
        enrolledCount={drawerCoverage?.studentCount ?? drawerSection?.currentEnrollment ?? 0}
        schoolId={schoolId}
        date={selectedDate}
        canCreate={canCreate}
        isDailyPresence={isDailyPresence}
        onClose={() => setDrawerSectionId(null)}
      />

      {canExport && (
        <IemisExportDialog
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          schoolId={schoolId}
          academicYearId={currentYearId}
        />
      )}
    </div>
  )
}

export default AttendanceModule
