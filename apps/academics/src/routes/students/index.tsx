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
} from 'lucide-react'
import { StatCard, WidgetErrorBoundaryV2, Card } from '@edforge/ui'
import { getAttendanceColor } from '@edforge/types'
import { useResourcePermissions } from '@edforge/abac'
import { StudentTable, StudentQuickProfile, StudentsFilterRow, CSVImport } from '../../components/students'
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
      <div
        className="h-5 rounded-lg v2-skeleton-pulse"
        style={{ background: 'var(--v2-bg-elevated)', width: '60%' }}
      />
    )
  }

  if (totalEnrolled === 0) return null

  const attendanceColor = attendanceRate != null
    ? attendanceRate < 60
      ? 'var(--v2-danger)'
      : attendanceRate < 80
        ? 'var(--v2-warning)'
        : 'var(--v2-text-hint)'
    : undefined

  return (
    <p className="text-[11px] leading-relaxed" style={{ color: 'var(--v2-text-hint)' }}>
      {totalEnrolled} student{totalEnrolled !== 1 ? 's' : ''} enrolled across {gradeCount} grade{gradeCount !== 1 ? 's' : ''}
      {' · '}
      {attendanceRate != null ? (
        <span style={attendanceColor ? { color: attendanceColor } : undefined}>
          {attendanceRate.toFixed(1)}% attendance today
        </span>
      ) : (
        'no attendance data'
      )}
      {' · '}
      {atRiskCount > 0 ? (
        <span style={{ color: 'var(--v2-danger)' }}>
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
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
      }}
    >
      {/* Header row */}
      <div
        className="flex items-center gap-4 px-4 py-2.5 border-b"
        style={{ borderColor: 'var(--v2-border-default)', background: 'var(--v2-bg-elevated)' }}
      >
        {[160, 60, 80, 70, 80, 30].map((w, i) => (
          <div
            key={i}
            className="h-3 rounded v2-skeleton-pulse"
            style={{ width: w, background: 'rgba(255,255,255,0.06)' }}
          />
        ))}
      </div>
      {/* 8 skeleton rows */}
      {Array.from({ length: 8 }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex items-center gap-4 px-4 py-3 border-b"
          style={{ borderColor: 'var(--v2-border-default)' }}
        >
          {/* Avatar circle */}
          <div
            className="w-9 h-9 rounded-full v2-skeleton-pulse flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          />
          {/* Name + ID */}
          <div className="flex flex-col gap-1.5" style={{ width: 140 }}>
            <div
              className="h-3 rounded v2-skeleton-pulse"
              style={{ width: 100, background: 'rgba(255,255,255,0.06)' }}
            />
            <div
              className="h-2.5 rounded v2-skeleton-pulse"
              style={{ width: 70, background: 'rgba(255,255,255,0.04)' }}
            />
          </div>
          {/* Grade */}
          <div
            className="h-3 rounded v2-skeleton-pulse"
            style={{ width: 40, background: 'rgba(255,255,255,0.06)' }}
          />
          {/* Attendance bar */}
          <div className="flex items-center gap-2" style={{ width: 100 }}>
            <div
              className="h-3 rounded v2-skeleton-pulse"
              style={{ width: 35, background: 'rgba(255,255,255,0.06)' }}
            />
            <div
              className="h-1 rounded-full v2-skeleton-pulse flex-1"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            />
          </div>
          {/* Status pill */}
          <div
            className="h-5 rounded-full v2-skeleton-pulse"
            style={{ width: 60, background: 'rgba(255,255,255,0.06)' }}
          />
          {/* Date */}
          <div
            className="h-3 rounded v2-skeleton-pulse"
            style={{ width: 80, background: 'rgba(255,255,255,0.06)' }}
          />
          {/* Action dot */}
          <div
            className="w-4 h-4 rounded v2-skeleton-pulse"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          />
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
    <div
      className="flex flex-col items-center justify-center py-16 rounded-xl border"
      style={{
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
      }}
    >
      <Users
        className="w-12 h-12 mb-3"
        style={{ color: 'var(--v2-text-hint)', opacity: 0.5 }}
      />
      <p
        className="text-[14px] font-medium mb-1"
        style={{ color: 'var(--v2-text-primary)' }}
      >
        No students found
      </p>
      <p
        className="text-[12px] mb-4"
        style={{ color: 'var(--v2-text-muted)' }}
      >
        Try adjusting your filters or search term
      </p>
      <button
        onClick={onClear}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-[7px] border transition-colors hover:opacity-80"
        style={{
          background: 'var(--v2-bg-elevated)',
          borderColor: 'var(--v2-border-default)',
          color: 'var(--v2-text-secondary)',
        }}
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
        <div className="inline-flex p-3 rounded-2xl bg-teal-500/10 mb-4">
          <School className="w-7 h-7 text-teal-600 dark:text-cyan-400" />
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
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ background: 'var(--v2-danger-bg)' }}
        >
          <AlertCircle className="w-8 h-8" style={{ color: 'var(--v2-danger)' }} />
        </div>
        <h3
          className="text-lg font-semibold mb-2"
          style={{ color: 'var(--v2-text-primary)' }}
        >
          Failed to Load Students
        </h3>
        <p
          className="text-sm mb-4"
          style={{ color: 'var(--v2-text-secondary)' }}
        >
          Something went wrong while loading the student directory.
        </p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:opacity-90"
          style={{ background: 'var(--v2-brand-primary)', color: '#fff' }}
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

  // Attendance alerts map: studentId → attendanceRate
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
    navigate({ to: '/students/enrollment' })
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
    <div data-v2 className="relative overflow-hidden min-h-full p-5 pb-10">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-5"
      >
        {/* ---- Compact Header + Insight Strip ---- */}
        <motion.div variants={fadeInUp} className="space-y-1">
          <div className="flex items-center justify-between" style={{ height: 44 }}>
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-[7px] flex items-center justify-center"
                style={{ background: 'rgba(29, 158, 117, 0.12)' }}
              >
                <Users className="w-4 h-4" style={{ color: '#1D9E75' }} />
              </div>
              <h1
                className="text-[14px] font-semibold"
                style={{ color: 'var(--v2-text-primary)' }}
              >
                Students
              </h1>
              <span className="text-[11px]" style={{ color: 'var(--v2-text-ghost)' }}>|</span>
              <span className="text-[11px]" style={{ color: 'var(--v2-text-faint)' }}>
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {/* Action buttons */}
            {studentPerms.create && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowImport(true)}
                  aria-label="Import students"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-[7px] border transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--v2-brand-primary)]/40"
                  style={{
                    background: 'var(--v2-bg-elevated)',
                    borderColor: 'var(--v2-border-default)',
                    color: 'var(--v2-text-secondary)',
                  }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import CSV
                </button>
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-[7px] border transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--v2-brand-primary)]/40"
                  style={{
                    background: 'var(--v2-bg-elevated)',
                    borderColor: 'var(--v2-border-default)',
                    color: 'var(--v2-text-secondary)',
                  }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import IEMIS
                </button>
                <button
                  onClick={handleAddStudent}
                  aria-label="Enroll student"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-[7px] transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--v2-brand-primary)]/40"
                  style={{
                    background: 'var(--v2-brand-primary)',
                    color: '#fff',
                  }}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Enroll student
                </button>
              </div>
            )}
          </div>

          {/* Contextual insight strip */}
          <StudentsInsightStrip
            totalEnrolled={overviewData.overview.totalEnrolled ?? 0}
            gradeCount={overviewData.enrollment.data.length}
            attendanceRate={attendanceRate}
            atRiskCount={overviewData.alerts.totalCount}
            isLoading={overviewData.overview.isLoading}
          />
        </motion.div>

        {/* ---- Filter Strip ---- */}
        <motion.div variants={fadeInUp}>
          <StudentsFilterRow
            isExporting={overviewData.isExporting}
            hasAcademicYear={!!overviewData.academicYear.id}
            onExport={overviewData.handleExportCSV}
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
                  accentColor="rgba(29, 158, 117, 0.12)"
                  iconColor="#1D9E75"
                  barColor="#1D9E75"
                  tag={
                    overviewData.overview.recentEnrollments && overviewData.overview.recentEnrollments > 0
                      ? { text: `+${overviewData.overview.recentEnrollments} recent`, color: '#1D9E75', bg: 'rgba(29, 158, 117, 0.10)' }
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
                  accentColor="rgba(226, 75, 74, 0.12)"
                  iconColor="#E24B4A"
                  barColor="#E24B4A"
                  tag={
                    overviewData.alerts.criticalCount > 0
                      ? { text: `${overviewData.alerts.criticalCount} critical`, color: '#E24B4A', bg: 'rgba(226, 75, 74, 0.10)' }
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
                  accentColor="rgba(239, 159, 39, 0.12)"
                  iconColor="#EF9F27"
                  barColor={attendanceColor || '#EF9F27'}
                  valueColor={attendanceColor}
                  tag={
                    overviewData.overview.todayAttendanceSummary &&
                    (overviewData.overview.todayAttendanceSummary.totalStudents - (overviewData.overview.todayAttendanceSummary.totalRecorded ?? 0)) > 0
                      ? { text: 'Partial data', color: '#EF9F27', bg: 'rgba(239, 159, 39, 0.10)' }
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
                  accentColor="rgba(55, 138, 221, 0.12)"
                  iconColor="#378ADD"
                  barColor="#378ADD"
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
                  alertsMap={alertsMap}
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
        icon={<UserMinus className="w-5 h-5 text-red-600 dark:text-red-400" />}
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
