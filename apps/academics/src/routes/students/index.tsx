/**
 * Students Module — V2
 *
 * Comprehensive student roster and management for the Academics domain.
 * V2 redesign: V2 header, KPI tiles, filter strip, attendance column,
 * skeleton/empty states, and motion animations.
 */

import { useMemo, useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { toast } from 'sonner'
import type { RowSelectionState } from '@tanstack/react-table'
import {
  Users,
  UserPlus,
  Upload,
  AlertCircle,
  AlertTriangle,
  Archive,
  ArrowRightLeft,
  MessageSquare,
  RefreshCw,
  UserMinus,
  ClipboardCheck,
  GraduationCap,
  School,
  FileSpreadsheet,
  Download,
  Loader2,
} from 'lucide-react'
import type { BulkAction } from '@edforge/ui'
import { StatCard, WidgetErrorBoundaryV2, Card, Button, ContextBar, ContextBarSep, ContextBarYear } from '@edforge/ui'
import { getAttendanceColor } from '@edforge/types'
import { useResourcePermissions } from '@edforge/abac'
import { StudentTable, StudentQuickProfile, StudentsFilterRow, CSVImport, type StudentAttendanceSignal } from '../../components/students'
import { BulkArchiveStudentsModal } from '../../components/students/BulkArchiveStudentsModal'
import { ConfirmationDialog } from '../../components/common'
import {
  useStudents,
  flattenStudentPages,
  getTotalFromPages,
  useDeleteStudent,
} from '../../hooks'
import { useActiveSchoolId } from '../../stores'
import { useStudentFilters, useStudentFilterActions } from '../../stores/students.store'
import { useAcademicsOverviewV2 } from '../../hooks/useAcademicsOverviewV2'
import { useAttendanceStudentTrends } from '../../hooks/useAttendance'
import { filterStudentsByMode } from '../../utils/student-filters'
import { useAcademicsI18n } from '../../lib/i18n'
import type { StudentResponseDto } from '@aibrains/shared-types'

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

function useMotionVariants() {
  const prefersReduced = useReducedMotion()
  if (prefersReduced) {
    return { staggerContainer: { hidden: {}, visible: {} }, fadeInUp: { hidden: {}, visible: {} } }
  }
  return {
    staggerContainer: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
    },
    fadeInUp: {
      hidden: { opacity: 0, y: 8 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    },
  }
}

// ============================================================================
// INSIGHT STRIP
// ============================================================================

function StudentsInsightStrip({
  totalEnrolled,
  gradeCount,
  attendanceRate,
  atRiskCount,
  isLoading,
}: {
  totalEnrolled: number
  gradeCount: number
  attendanceRate: number | null | undefined
  atRiskCount: number
  isLoading: boolean
}) {
  const { t, formatNumber } = useAcademicsI18n()
  if (isLoading) {
    return (
      <div className="h-5 w-3/5 rounded-lg v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
    )
  }

  if (totalEnrolled === 0) return null

  const attendanceColor = attendanceRate != null
    ? attendanceRate < 60
      ? 'rgb(var(--state-danger-fg))'
      : attendanceRate < 80
        ? 'rgb(var(--state-warning-fg))'
        : 'rgb(var(--text-tertiary))'
    : undefined

  return (
    <p className="text-xs leading-relaxed text-[rgb(var(--text-tertiary))]">
      {t('studentsModule.insight.enrolledAcrossGrades', {
        students: formatNumber(totalEnrolled),
        grades: formatNumber(gradeCount),
      })}
      {' · '}
      {attendanceRate != null ? (
        // allow-presentation-style: attendance-rate severity color
        <span style={attendanceColor ? { color: attendanceColor } : undefined}>
          {t('studentsModule.insight.attendanceToday', {
            rate: formatNumber(Number(attendanceRate.toFixed(1))),
          })}
        </span>
      ) : (
        t('studentsModule.insight.noAttendanceData')
      )}
      {' · '}
      {atRiskCount > 0 ? (
        <span className="text-[rgb(var(--state-danger-fg))]">
          {t('studentsModule.insight.atRiskStudents', {
            count: atRiskCount,
            value: formatNumber(atRiskCount),
          })}
        </span>
      ) : (
        t('studentsModule.insight.noAtRiskStudents')
      )}
    </p>
  )
}

// ============================================================================
// TABLE SKELETON
// ============================================================================

function TableSkeleton() {
  // Block fills via semantic tokens (read correctly in light + dark) — the
  // skeleton mirrors the 8-column roster so there's no load → render jump.
  const block = 'bg-[rgb(var(--text-tertiary)/0.18)]'
  const blockFaint = 'bg-[rgb(var(--text-tertiary)/0.10)]'
  return (
    <div className="rounded-xl border overflow-hidden bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)]">
      {/* Header row */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-tertiary))]">
        {[150, 48, 90, 120, 90, 60, 70, 24].map((w, i) => (
          <div key={i} className={`h-3 rounded v2-skeleton-pulse ${block}`} style={{ width: w }} />
        ))}
      </div>
      {/* 8 skeleton rows */}
      {Array.from({ length: 8 }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex items-center gap-4 px-4 py-3 border-b border-[rgb(var(--border-primary)/0.35)]"
        >
          {/* Student: avatar + name/id */}
          <div className={`w-9 h-9 rounded-full v2-skeleton-pulse flex-shrink-0 ${block}`} />
          <div className="flex flex-col gap-1.5" style={{ width: 130 }}>
            <div className={`h-3 rounded v2-skeleton-pulse ${block}`} style={{ width: 100 }} />
            <div className={`h-2.5 rounded v2-skeleton-pulse ${blockFaint}`} style={{ width: 70 }} />
          </div>
          {/* Grade chip */}
          <div className={`h-5 rounded-[7px] v2-skeleton-pulse ${block}`} style={{ width: 30 }} />
          {/* Attendance: spark + % */}
          <div className="flex items-center gap-2" style={{ width: 100 }}>
            <div className={`h-4 rounded v2-skeleton-pulse flex-1 ${blockFaint}`} />
            <div className={`h-3 rounded v2-skeleton-pulse ${block}`} style={{ width: 26 }} />
          </div>
          {/* Guardian: stacked circles + name */}
          <div className="flex items-center gap-2" style={{ width: 150 }}>
            <div className="flex -space-x-2 flex-shrink-0">
              <div className={`w-6 h-6 rounded-full v2-skeleton-pulse ${block}`} />
              <div className={`w-6 h-6 rounded-full v2-skeleton-pulse ${blockFaint}`} />
            </div>
            <div className={`h-3 rounded v2-skeleton-pulse ${block}`} style={{ width: 64 }} />
          </div>
          {/* Location: two lines */}
          <div className="flex flex-col gap-1.5" style={{ width: 100 }}>
            <div className={`h-3 rounded v2-skeleton-pulse ${block}`} style={{ width: 80 }} />
            <div className={`h-2.5 rounded v2-skeleton-pulse ${blockFaint}`} style={{ width: 56 }} />
          </div>
          {/* Status pill */}
          <div className={`h-5 rounded-full v2-skeleton-pulse ${block}`} style={{ width: 56 }} />
          {/* Date */}
          <div className={`h-3 rounded v2-skeleton-pulse ${block}`} style={{ width: 64 }} />
          {/* Action dot */}
          <div className={`w-4 h-4 rounded v2-skeleton-pulse flex-shrink-0 ${blockFaint}`} />
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// EMPTY FILTER STATE
// ============================================================================

function EmptyFilterState({ onClear }: { onClear: () => void }) {
  const { t } = useAcademicsI18n()

  return (
    <div className="flex flex-col items-center justify-center py-16 rounded-xl border bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)]">
      <Users className="w-12 h-12 mb-3 opacity-50 text-[rgb(var(--text-tertiary))]" />
      <p className="text-sm font-medium mb-1 text-[rgb(var(--text-primary))]">
        {t('studentsModule.empty.noStudentsFound')}
      </p>
      <p className="text-xs mb-4 text-[rgb(var(--text-tertiary))]">
        {t('studentsModule.empty.adjustFilters')}
      </p>
      <button
        onClick={onClear}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[7px] border transition-colors hover:opacity-80 bg-[rgb(var(--background-tertiary))] border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))]"
      >
        {t('dataTable.clearFilters')}
      </button>
    </div>
  )
}

// ============================================================================
// GUARDS
// ============================================================================

function NoSchoolGuard() {
  const { t } = useAcademicsI18n()

  return (
    <div className="max-w-6xl mx-auto pt-16 pb-12">
      <Card className="p-8 border-border-secondary max-w-lg mx-auto text-center">
        <div className="inline-flex p-3 rounded-2xl bg-[rgb(var(--state-info-bg)/0.18)] mb-4">
          <School className="w-7 h-7 text-[rgb(var(--action-secondary-fg))] " />
        </div>
        <h2 className="text-lg font-bold text-text-primary">{t('studentsModule.noSchool.title')}</h2>
        <p className="text-sm text-text-secondary mt-1.5">
          {t('studentsModule.noSchool.description')}
        </p>
      </Card>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useAcademicsI18n()

  return (
    <div className="min-h-96 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-[rgb(var(--state-danger-bg))]">
          <AlertCircle className="w-8 h-8 text-[rgb(var(--state-danger-fg))]" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-[rgb(var(--text-primary))]">
          {t('studentsModule.error.title')}
        </h3>
        <p className="text-sm mb-4 text-[rgb(var(--text-secondary))]">
          {t('studentsModule.error.description')}
        </p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:opacity-90 bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))]"
        >
          <RefreshCw className="w-4 h-4" />
          {t('error.retry')}
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StudentsModule() {
  const activeSchoolId = useActiveSchoolId()
  if (!activeSchoolId) return <NoSchoolGuard />
  return <StudentsContent schoolId={activeSchoolId} />
}

function StudentsContent({ schoolId }: { schoolId: string }) {
  const { t, formatNumber, formatDate } = useAcademicsI18n()
  const navigate = useNavigate()
  const { staggerContainer, fadeInUp } = useMotionVariants()

  // ABAC permissions
  const studentPerms = useResourcePermissions('students')
  const guardianPerms = useResourcePermissions('guardians')

  // Student filters from store
  const filters = useStudentFilters()

  // Fetch students with filters
  const {
    data,
    isLoading: studentsLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useStudents({
    schoolId,
    filters: {
      searchTerm: filters.searchTerm || undefined,
      gradeLevel: filters.gradeLevel || undefined,
      status: filters.status || undefined,
    },
    enabled: true,
  })

  // Flatten paginated data
  const students = useMemo(() => flattenStudentPages(data), [data])
  const studentsTotalHint = getTotalFromPages(data)
  // V2 overview data (KPIs + alerts)
  const overviewData = useAcademicsOverviewV2(schoolId)

  // Attendance alerts map: studentId → attendanceRate (rate-only; drives the
  // at-risk chip filter + the drawer).
  const alertsMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const alert of overviewData.alerts.students) {
      map.set(alert.studentId, alert.attendanceRate)
    }
    return map
  }, [overviewData.alerts.students])

  // Apply filterMode chip to the server-filtered student list.
  // Server-side filters (search/grade/status) have already narrowed `students`
  // upstream via useStudents({ filters }); the chip filter intersects with
  // that result. See utils/student-filters.ts for canonical predicates.
  const filteredStudents = useMemo(
    () => filterStudentsByMode(students, filters.filterMode, alertsMap),
    [students, filters.filterMode, alertsMap],
  )

  // ── Attendance trend (Sprint 2) ──────────────────────────────────
  // Real 30-day daily series for the visible page (≤50) drives the inline
  // sparkline. Batched in one request keyed to the displayed studentIds.
  const trendWindow = useMemo(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 29)
    const fmt = (d: Date) => d.toISOString().slice(0, 10)
    return { startDate: fmt(start), endDate: fmt(end) }
  }, [])

  const visibleStudentIds = useMemo(
    () => filteredStudents.slice(0, 50).map((s) => s.studentId),
    [filteredStudents],
  )

  const { data: studentTrends } = useAttendanceStudentTrends({
    schoolId,
    studentIds: visibleStudentIds,
    startDate: trendWindow.startDate,
    endDate: trendWindow.endDate,
  })

  // Richer per-student signal for the AttendanceTrend cell: at-risk alerts
  // (rate + trend) as the base, overlaid with the real daily series for the
  // visible page. Students with neither render "—".
  const attendanceByStudent = useMemo(() => {
    const map = new Map<string, StudentAttendanceSignal>()
    for (const alert of overviewData.alerts.students) {
      map.set(alert.studentId, { rate: alert.attendanceRate, trend: alert.trend })
    }
    if (studentTrends) {
      for (const [studentId, t] of Object.entries(studentTrends)) {
        map.set(studentId, { rate: t.rate, trend: t.trend, series: t.series })
      }
    }
    return map
  }, [overviewData.alerts.students, studentTrends])

  // Derive KPI values
  const attendanceRate = overviewData.overview.todayAttendanceRate
  const attendanceColor = attendanceRate != null ? getAttendanceColor(attendanceRate) : undefined

  // Student drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentResponseDto | null>(null)

  // CSV Import state
  const [showImport, setShowImport] = useState(false)

  // Withdrawal state
  const [withdrawStudent, setWithdrawStudent] = useState<StudentResponseDto | null>(null)
  const deleteStudentMutation = useDeleteStudent()

  // Bulk archive — lift selection so the modal can clear it after success.
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [bulkArchiveTarget, setBulkArchiveTarget] = useState<StudentResponseDto[] | null>(null)

  const handleAddStudent = () => {
    navigate({ to: '/students/enrollment', search: { tab: 'registration' } })
  }

  const handleViewStudent = useCallback((student: StudentResponseDto) => {
    setSelectedStudent(student)
    setDrawerOpen(true)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
    setSelectedStudent(null)
  }, [])

  const handleWithdrawFromDrawer = useCallback((student: StudentResponseDto) => {
    setDrawerOpen(false)
    setSelectedStudent(null)
    setWithdrawStudent(student)
  }, [])

  const handleWithdrawConfirm = async () => {
    if (!withdrawStudent) return
    try {
      await deleteStudentMutation.mutateAsync(withdrawStudent.studentId)
      setWithdrawStudent(null)
    } catch {
      // Error handling is done in the mutation hook
    }
  }

  const { resetFilters } = useStudentFilterActions()

  const handleClearFilters = useCallback(() => {
    resetFilters()
  }, [resetFilters])

  // Bulk actions surfaced on the floating bulk bar. Archive now opens a
  // real drawer (closes #223); Message + Move stay as toasts pending their
  // own backend slices (#221 + #222).
  const bulkActions = useMemo<BulkAction<StudentResponseDto>[]>(
    () => [
      {
        id: 'message',
        label: t('studentsModule.bulk.message'),
        icon: <MessageSquare className="w-4 h-4" />,
        onRun: (rows) =>
          toast.info(t('common.comingSoon', {
            action: t('studentsModule.bulk.message'),
            countLabel: t('common.students', { count: rows.length }),
          })),
      },
      {
        id: 'move',
        label: t('studentsModule.bulk.moveSection'),
        icon: <ArrowRightLeft className="w-4 h-4" />,
        onRun: (rows) =>
          toast.info(t('common.comingSoon', {
            action: t('studentsModule.bulk.moveSection'),
            countLabel: t('common.students', { count: rows.length }),
          })),
      },
      {
        id: 'archive',
        label: t('studentsModule.bulk.archive'),
        icon: <Archive className="w-4 h-4" />,
        tone: 'critical',
        onRun: (rows) => setBulkArchiveTarget(rows),
      },
    ],
    [t],
  )

  const showEmptyFilterState = !studentsLoading && filteredStudents.length === 0 && students.length > 0

  return (
    <div className="relative overflow-hidden min-h-full p-5 pb-10">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-5"
      >
        {/* ---- Context Bar (operating context, not a page title) + Insight Strip ---- */}
        <motion.div variants={fadeInUp}>
          <ContextBar
            meta={
              <>
                {overviewData.academicYear.name ? (
                  <ContextBarYear>{overviewData.academicYear.name}</ContextBarYear>
                ) : null}
                {overviewData.academicYear.name ? <ContextBarSep /> : null}
                <span>
                  {formatDate(new Date(), {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </>
            }
            description={
              <StudentsInsightStrip
                totalEnrolled={overviewData.overview.totalEnrolled ?? 0}
                gradeCount={overviewData.enrollment.data.length}
                attendanceRate={attendanceRate}
                atRiskCount={overviewData.alerts.totalCount}
                isLoading={overviewData.overview.isLoading}
              />
            }
            actions={
              studentPerms.create ? (
                <>
                  {/*
                    TODO(students-csv-import): "Import CSV" is hidden from the view
                    until the CSV importer populates the student IEMIS field that
                    the PABSON archetype requires (currently missing from the
                    importer's column mapping). Not a priority to fix — re-enable
                    this button once the importer maps IEMIS. "Import IEMIS" and
                    "Govt. Reports" below remain the supported import/export paths.

                  <button
                    onClick={() => setShowImport(true)}
                    aria-label="Import students"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-[9px] border transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-enrollment)/0.4)] bg-transparent border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))]"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Import CSV
                  </button>
                  */}
                  {/*
                    Phase 3.1 — IEMIS button is always visible. The eligibility
                    gate (active school must have emisSchoolCode) is enforced
                    on the target page itself, not here, because hiding the
                    button creates a "where'd it go?" mystery for PABSON
                    admins who swap between an IEMIS-ready school and a
                    non-IEMIS school mid-session.
                  */}
                  <button
                    onClick={() => navigate({ to: '/students/import/iemis' })}
                    aria-label={t('studentsModule.actions.importIemisAria')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-[9px] border transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-enrollment)/0.4)] bg-transparent border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))]"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {t('studentsModule.actions.importIemis')}
                  </button>
                  {/*
                    IEMIS export counterpart to "Import IEMIS". Routes to the
                    Government Reports surface (Flash I/II generation + download).
                    Eligibility (school + emisSchoolCode) is gated on the target
                    page, mirroring the import button's always-visible rationale.
                  */}
                  <button
                    onClick={() => navigate({ to: '/reports/government' })}
                    aria-label={t('studentsModule.actions.governmentReportsAria')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-[9px] border transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-enrollment)/0.4)] bg-transparent border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))]"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    {t('studentsModule.actions.governmentReports')}
                  </button>
                  <button
                    onClick={handleAddStudent}
                    aria-label={t('studentsModule.actions.enrollStudentAria')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-[9px] transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-enrollment)/0.4)] bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))]"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {t('studentsModule.actions.enrollStudent')}
                  </button>
                </>
              ) : undefined
            }
          />
        </motion.div>

        {/* ---- Error State ---- */}
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <>
            {/* ---- KPI Grid (4 tiles) ---- */}
            <motion.div
              variants={fadeInUp}
              className="grid gap-3 grid-cols-2 lg:grid-cols-4"
            >
              <WidgetErrorBoundaryV2 fallbackMessage={t('studentsModule.widgets.enrollmentLoadFailed')}>
                <StatCard
                  label={t('studentsModule.stats.totalEnrolled')}
                  value={overviewData.overview.totalEnrolled != null ? formatNumber(overviewData.overview.totalEnrolled) : '—'}
                  icon={Users}
                  accentColor="rgb(var(--accent-enrollment)/0.12)"
                  iconColor="rgb(var(--accent-enrollment))"
                  barColor="rgb(var(--accent-enrollment))"
                  tag={
                    overviewData.overview.recentEnrollments && overviewData.overview.recentEnrollments > 0
                      ? { text: t('studentsModule.stats.recentEnrollments', { count: overviewData.overview.recentEnrollments, value: formatNumber(overviewData.overview.recentEnrollments) }), color: 'rgb(var(--accent-enrollment))', bg: 'rgb(var(--accent-enrollment)/0.1)' }
                      : undefined
                  }
                  hint={overviewData.enrollment.data.length > 0 ? t('studentsModule.stats.acrossGrades', { count: overviewData.enrollment.data.length, value: formatNumber(overviewData.enrollment.data.length) }) : t('studentsModule.stats.thisAcademicYear')}
                  loading={overviewData.overview.isLoading}
                  error={overviewData.overview.errors.length > 0}
                  onRetry={() => refetch()}
                />
              </WidgetErrorBoundaryV2>

              <WidgetErrorBoundaryV2 fallbackMessage={t('studentsModule.widgets.atRiskLoadFailed')}>
                <StatCard
                  label={t('studentsModule.stats.atRiskStudents')}
                  value={formatNumber(overviewData.alerts.totalCount)}
                  icon={AlertTriangle}
                  accentColor="rgb(var(--accent-finance)/0.12)"
                  iconColor="rgb(var(--accent-finance))"
                  barColor="rgb(var(--accent-finance))"
                  tag={
                    overviewData.alerts.criticalCount > 0
                      ? { text: t('studentsModule.stats.criticalCount', { count: overviewData.alerts.criticalCount, value: formatNumber(overviewData.alerts.criticalCount) }), color: 'rgb(var(--accent-finance))', bg: 'rgb(var(--accent-finance)/0.1)' }
                      : undefined
                  }
                  hint={
                    overviewData.alerts.criticalCount > 0 || overviewData.alerts.warningCount > 0
                      ? t('studentsModule.stats.riskBreakdown', {
                          critical: formatNumber(overviewData.alerts.criticalCount),
                          warning: formatNumber(overviewData.alerts.warningCount),
                        })
                      : t('studentsModule.stats.belowThreshold')
                  }
                  loading={overviewData.alerts.isLoading}
                />
              </WidgetErrorBoundaryV2>

              <WidgetErrorBoundaryV2 fallbackMessage={t('studentsModule.widgets.attendanceLoadFailed')}>
                <StatCard
                  label={t('studentsModule.stats.todayAttendance')}
                  value={attendanceRate != null ? `${formatNumber(Number(attendanceRate.toFixed(1)))}%` : '—'}
                  icon={ClipboardCheck}
                  accentColor="rgb(var(--accent-attendance)/0.12)"
                  iconColor="rgb(var(--accent-attendance))"
                  barColor={attendanceColor || 'rgb(var(--accent-attendance))'}
                  valueColor={attendanceColor}
                  tag={
                    overviewData.overview.todayAttendanceSummary &&
                    (overviewData.overview.todayAttendanceSummary.totalStudents - (overviewData.overview.todayAttendanceSummary.totalRecorded ?? 0)) > 0
                      ? { text: t('studentsModule.stats.partialData'), color: 'rgb(var(--accent-attendance))', bg: 'rgb(var(--accent-attendance)/0.1)' }
                      : undefined
                  }
                  hint={
                    overviewData.overview.todayAttendanceSummary
                      ? t('studentsModule.stats.attendanceBreakdown', {
                          present: formatNumber(overviewData.overview.todayAttendanceSummary.present),
                          absent: formatNumber(overviewData.overview.todayAttendanceSummary.absent),
                          late: formatNumber(overviewData.overview.todayAttendanceSummary.late),
                        })
                      : t('studentsModule.stats.today')
                  }
                  loading={overviewData.overview.isLoading}
                  error={overviewData.overview.errors.length > 0}
                  onRetry={() => refetch()}
                />
              </WidgetErrorBoundaryV2>

              <WidgetErrorBoundaryV2 fallbackMessage={t('studentsModule.widgets.gradeLoadFailed')}>
                <StatCard
                  label={t('studentsModule.stats.gradeLevels')}
                  value={formatNumber(overviewData.enrollment.data.length)}
                  icon={GraduationCap}
                  accentColor="rgb(var(--accent-academics)/0.12)"
                  iconColor="rgb(var(--accent-academics))"
                  barColor="rgb(var(--accent-academics))"
                  hint={t('studentsModule.stats.coveredThisYear')}
                  loading={overviewData.overview.isLoading}
                />
              </WidgetErrorBoundaryV2>
            </motion.div>

            {/* ---- Student Table ---- */}
            <motion.div variants={fadeInUp}>
              {studentsLoading ? (
                <TableSkeleton />
              ) : showEmptyFilterState ? (
                <EmptyFilterState onClear={handleClearFilters} />
              ) : (
                <StudentTable
                  students={filteredStudents}
                  attendanceByStudent={attendanceByStudent}
                  canViewGuardians={guardianPerms.view}
                  canViewLocation={studentPerms.view}
                  bulkActions={bulkActions}
                  rowSelection={rowSelection}
                  onRowSelectionChange={setRowSelection}
                  toolbarStart={<StudentsFilterRow schoolId={schoolId} />}
                  toolbarExtra={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={overviewData.handleExportCSV}
                      disabled={overviewData.isExporting || !overviewData.academicYear.id}
                      aria-label={t('studentsModule.actions.exportCsvAria')}
                    >
                      {overviewData.isExporting ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                      ) : (
                        <Download className="w-3 h-3 mr-1.5" />
                      )}
                      {t('curriculumModule.filters.exportCsv')}
                    </Button>
                  }
                  isLoading={studentsLoading}
                  onAddStudent={handleAddStudent}
                  onViewStudent={handleViewStudent}
                  onWithdraw={studentPerms.delete ? handleWithdrawFromDrawer : undefined}
                  hasMore={hasNextPage}
                  isFetchingMore={isFetchingNextPage}
                  onLoadMore={() => { void fetchNextPage() }}
                  serverTotalHint={studentsTotalHint}
                />
              )}
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Student Quick-Info Drawer — V3 (content-pane-scoped, privacy-conscious) */}
      <StudentQuickProfile
        open={drawerOpen}
        onClose={handleCloseDrawer}
        student={selectedStudent}
        attendanceRate={selectedStudent ? alertsMap.get(selectedStudent.studentId) : undefined}
        academicYearName={overviewData.academicYear.name}
        onWithdraw={studentPerms.delete ? handleWithdrawFromDrawer : undefined}
      />

      {/* Withdrawal Confirmation Dialog */}
      <ConfirmationDialog
        open={!!withdrawStudent}
        onClose={() => setWithdrawStudent(null)}
        onConfirm={handleWithdrawConfirm}
        title={t('studentsModule.withdraw.title')}
        description={
          withdrawStudent
            ? t('studentsModule.withdraw.description', { student: withdrawStudent.fullName })
            : ''
        }
        confirmText={t('studentsModule.withdraw.confirm')}
        cancelText={t('actions.cancel')}
        variant="destructive"
        isLoading={deleteStudentMutation.isPending}
        icon={<UserMinus className="w-5 h-5 text-[rgb(var(--state-danger-fg))]" />}
      />

      {/* CSV Import Modal */}
      {showImport && (
        <CSVImport
          onClose={() => setShowImport(false)}
          onSuccess={() => refetch()}
        />
      )}

      {/* Bulk Archive Modal (#223) */}
      <BulkArchiveStudentsModal
        open={!!bulkArchiveTarget}
        students={bulkArchiveTarget ?? []}
        onClose={() => setBulkArchiveTarget(null)}
        onComplete={() => setRowSelection({})}
      />
    </div>
  )
}

export default StudentsModule
