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
import {
  Users,
  UserPlus,
  Upload,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  UserMinus,
  ClipboardCheck,
  GraduationCap,
  School,
  FileSpreadsheet,
  Download,
  Loader2,
} from 'lucide-react'
import { StatCard, WidgetErrorBoundaryV2, Card, Button, ContextBar, ContextBarSep, ContextBarYear } from '@edforge/ui'
import { getAttendanceColor } from '@edforge/types'
import { useResourcePermissions } from '@edforge/abac'
import { StudentTable, StudentQuickProfile, StudentsFilterRow, CSVImport, type StudentAttendanceSignal } from '../../components/students'
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
      {totalEnrolled} student{totalEnrolled !== 1 ? 's' : ''} enrolled across {gradeCount} grade{gradeCount !== 1 ? 's' : ''}
      {' · '}
      {attendanceRate != null ? (
        // allow-presentation-style: attendance-rate severity color
        <span style={attendanceColor ? { color: attendanceColor } : undefined}>
          {attendanceRate.toFixed(1)}% attendance today
        </span>
      ) : (
        'no attendance data'
      )}
      {' · '}
      {atRiskCount > 0 ? (
        <span className="text-[rgb(var(--state-danger-fg))]">
          {atRiskCount} at-risk student{atRiskCount !== 1 ? 's' : ''}
        </span>
      ) : (
        'no at-risk students'
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
  return (
    <div className="flex flex-col items-center justify-center py-16 rounded-xl border bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)]">
      <Users className="w-12 h-12 mb-3 opacity-50 text-[rgb(var(--text-tertiary))]" />
      <p className="text-sm font-medium mb-1 text-[rgb(var(--text-primary))]">
        No students found
      </p>
      <p className="text-xs mb-4 text-[rgb(var(--text-tertiary))]">
        Try adjusting your filters or search term
      </p>
      <button
        onClick={onClear}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[7px] border transition-colors hover:opacity-80 bg-[rgb(var(--background-tertiary))] border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))]"
      >
        Clear filters
      </button>
    </div>
  )
}

// ============================================================================
// GUARDS
// ============================================================================

function NoSchoolGuard() {
  return (
    <div className="max-w-6xl mx-auto pt-16 pb-12">
      <Card className="p-8 border-border-secondary max-w-lg mx-auto text-center">
        <div className="inline-flex p-3 rounded-2xl bg-[rgb(var(--state-info-bg)/0.18)] mb-4">
          <School className="w-7 h-7 text-[rgb(var(--action-secondary-fg))] " />
        </div>
        <h2 className="text-lg font-bold text-text-primary">Select a school</h2>
        <p className="text-sm text-text-secondary mt-1.5">
          Choose a school from the sidebar to view the student directory.
        </p>
      </Card>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-96 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-[rgb(var(--state-danger-bg))]">
          <AlertCircle className="w-8 h-8 text-[rgb(var(--state-danger-fg))]" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-[rgb(var(--text-primary))]">
          Failed to Load Students
        </h3>
        <p className="text-sm mb-4 text-[rgb(var(--text-secondary))]">
          Something went wrong while loading the student directory.
        </p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:opacity-90 bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))]"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
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
                  {new Date().toLocaleDateString('en-US', {
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
                    aria-label="Import from IEMIS"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-[9px] border transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-enrollment)/0.4)] bg-transparent border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))]"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Import IEMIS
                  </button>
                  {/*
                    IEMIS export counterpart to "Import IEMIS". Routes to the
                    Government Reports surface (Flash I/II generation + download).
                    Eligibility (school + emisSchoolCode) is gated on the target
                    page, mirroring the import button's always-visible rationale.
                  */}
                  <button
                    onClick={() => navigate({ to: '/reports/government' })}
                    aria-label="Government reports"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-[9px] border transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-enrollment)/0.4)] bg-transparent border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))]"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Govt. Reports
                  </button>
                  <button
                    onClick={handleAddStudent}
                    aria-label="Enroll student"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-[9px] transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-enrollment)/0.4)] bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))]"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Enroll student
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
              <WidgetErrorBoundaryV2 fallbackMessage="Unable to load enrollment data">
                <StatCard
                  label="Total Enrolled"
                  value={overviewData.overview.totalEnrolled != null ? overviewData.overview.totalEnrolled.toLocaleString() : '—'}
                  icon={Users}
                  accentColor="rgb(var(--accent-enrollment)/0.12)"
                  iconColor="rgb(var(--accent-enrollment))"
                  barColor="rgb(var(--accent-enrollment))"
                  tag={
                    overviewData.overview.recentEnrollments && overviewData.overview.recentEnrollments > 0
                      ? { text: `+${overviewData.overview.recentEnrollments} recent`, color: 'rgb(var(--accent-enrollment))', bg: 'rgb(var(--accent-enrollment)/0.1)' }
                      : undefined
                  }
                  hint={overviewData.enrollment.data.length > 0 ? `across ${overviewData.enrollment.data.length} grades` : 'this academic year'}
                  loading={overviewData.overview.isLoading}
                  error={overviewData.overview.errors.length > 0}
                  onRetry={() => refetch()}
                />
              </WidgetErrorBoundaryV2>

              <WidgetErrorBoundaryV2 fallbackMessage="Unable to load at-risk data">
                <StatCard
                  label="At-Risk Students"
                  value={overviewData.alerts.totalCount.toString()}
                  icon={AlertTriangle}
                  accentColor="rgb(var(--accent-finance)/0.12)"
                  iconColor="rgb(var(--accent-finance))"
                  barColor="rgb(var(--accent-finance))"
                  tag={
                    overviewData.alerts.criticalCount > 0
                      ? { text: `${overviewData.alerts.criticalCount} critical`, color: 'rgb(var(--accent-finance))', bg: 'rgb(var(--accent-finance)/0.1)' }
                      : undefined
                  }
                  hint={
                    overviewData.alerts.criticalCount > 0 || overviewData.alerts.warningCount > 0
                      ? `${overviewData.alerts.criticalCount} critical · ${overviewData.alerts.warningCount} warning`
                      : 'below 90% threshold'
                  }
                  loading={overviewData.alerts.isLoading}
                />
              </WidgetErrorBoundaryV2>

              <WidgetErrorBoundaryV2 fallbackMessage="Unable to load attendance data">
                <StatCard
                  label="Today's Attendance"
                  value={attendanceRate != null ? `${attendanceRate.toFixed(1)}%` : '—'}
                  icon={ClipboardCheck}
                  accentColor="rgb(var(--accent-attendance)/0.12)"
                  iconColor="rgb(var(--accent-attendance))"
                  barColor={attendanceColor || 'rgb(var(--accent-attendance))'}
                  valueColor={attendanceColor}
                  tag={
                    overviewData.overview.todayAttendanceSummary &&
                    (overviewData.overview.todayAttendanceSummary.totalStudents - (overviewData.overview.todayAttendanceSummary.totalRecorded ?? 0)) > 0
                      ? { text: 'Partial data', color: 'rgb(var(--accent-attendance))', bg: 'rgb(var(--accent-attendance)/0.1)' }
                      : undefined
                  }
                  hint={
                    overviewData.overview.todayAttendanceSummary
                      ? `${overviewData.overview.todayAttendanceSummary.present} present · ${overviewData.overview.todayAttendanceSummary.absent} absent · ${overviewData.overview.todayAttendanceSummary.late} late`
                      : 'today'
                  }
                  loading={overviewData.overview.isLoading}
                  error={overviewData.overview.errors.length > 0}
                  onRetry={() => refetch()}
                />
              </WidgetErrorBoundaryV2>

              <WidgetErrorBoundaryV2 fallbackMessage="Unable to load grade data">
                <StatCard
                  label="Grade Levels"
                  value={overviewData.enrollment.data.length.toString()}
                  icon={GraduationCap}
                  accentColor="rgb(var(--accent-academics)/0.12)"
                  iconColor="rgb(var(--accent-academics))"
                  barColor="rgb(var(--accent-academics))"
                  hint="covered this year"
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
                  toolbarStart={<StudentsFilterRow schoolId={schoolId} />}
                  toolbarExtra={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={overviewData.handleExportCSV}
                      disabled={overviewData.isExporting || !overviewData.academicYear.id}
                      aria-label="Export students as CSV"
                    >
                      {overviewData.isExporting ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                      ) : (
                        <Download className="w-3 h-3 mr-1.5" />
                      )}
                      Export CSV
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
        title="Withdraw Student"
        description={
          withdrawStudent
            ? `Are you sure you want to withdraw ${withdrawStudent.fullName}? This action can be reversed by a school administrator.`
            : ''
        }
        confirmText="Withdraw"
        cancelText="Cancel"
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
    </div>
  )
}

export default StudentsModule
