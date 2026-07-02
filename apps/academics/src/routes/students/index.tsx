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
import { StatBand, type StatMetric, PageHeader, EmptyState, ErrorState, Card, Button } from '@edforge/ui'
import { useResourcePermissions } from '@edforge/abac'
import { StudentTable, StudentQuickProfile, useStudentsToolbar, type StudentAttendanceSignal } from '../../components/students'
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StudentsModule() {
  const activeSchoolId = useActiveSchoolId()
  if (!activeSchoolId) return <NoSchoolGuard />
  return <StudentsContent schoolId={activeSchoolId} />
}

function StudentsContent({ schoolId }: { schoolId: string }) {
  const { t, formatNumber, formatCount } = useAcademicsI18n()
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

  // Student drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentResponseDto | null>(null)

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

  // Unified table toolbar (controlled search + presets + Grade facet + More filters).
  const studentsToolbar = useStudentsToolbar(schoolId, {
    all: studentsTotalHint ?? overviewData.overview.totalEnrolled ?? undefined,
    atRisk: overviewData.alerts.totalCount,
  })

  // Page actions for the pagebar header (permission-gated).
  const headerActions = studentPerms.create
    ? [
        {
          label: t('studentsModule.actions.importIemis'),
          icon: <Upload className="h-3.5 w-3.5" />,
          ariaLabel: t('studentsModule.actions.importIemisAria'),
          onClick: () => navigate({ to: '/students/import/iemis' }),
        },
        {
          label: t('studentsModule.actions.governmentReports'),
          icon: <FileSpreadsheet className="h-3.5 w-3.5" />,
          ariaLabel: t('studentsModule.actions.governmentReportsAria'),
          onClick: () => navigate({ to: '/reports/government' }),
        },
        {
          label: t('studentsModule.actions.enrollStudent'),
          icon: <UserPlus className="h-3.5 w-3.5" />,
          ariaLabel: t('studentsModule.actions.enrollStudentAria'),
          primary: true,
          onClick: handleAddStudent,
        },
      ]
    : undefined

  // ── Unified KPI stat band (calm by default; state drives the only color) ──
  const enrolled = overviewData.overview.totalEnrolled
  const recent = overviewData.overview.recentEnrollments ?? 0
  const critical = overviewData.alerts.criticalCount
  const warning = overviewData.alerts.warningCount
  const atRiskTotal = overviewData.alerts.totalCount
  const attSummary = overviewData.overview.todayAttendanceSummary

  const enrolledSub =
    overviewData.enrollment.data.length > 0
      ? formatCount('studentsModule.stats.acrossGrades', overviewData.enrollment.data.length)
      : t('studentsModule.stats.thisAcademicYear')
  const enrolledMetric: StatMetric =
    recent > 0
      ? {
          label: t('studentsModule.stats.totalEnrolled'),
          value: enrolled != null ? formatNumber(enrolled) : '—',
          icon: <Users className="h-4 w-4" />,
          iconSignature: 'students',
          state: 'normal',
          primary: true,
          delta: { dir: 'up', val: `+${formatNumber(recent)}` },
          sub: enrolledSub,
        }
      : {
          label: t('studentsModule.stats.totalEnrolled'),
          value: enrolled != null ? formatNumber(enrolled) : '—',
          icon: <Users className="h-4 w-4" />,
          iconSignature: 'students',
          state: 'normal',
          primary: true,
          sub: enrolledSub,
        }

  const atRiskMetric: StatMetric =
    critical > 0
      ? {
          label: t('studentsModule.stats.atRiskStudents'),
          value: formatNumber(atRiskTotal),
          icon: <AlertTriangle className="h-4 w-4" />,
          iconSignature: 'atrisk',
          state: 'critical',
          pill: { tone: 'critical', text: formatCount('studentsModule.stats.criticalCount', critical) },
          sub: t('studentsModule.stats.riskBreakdown', { critical: formatNumber(critical), warning: formatNumber(warning) }),
        }
      : {
          label: t('studentsModule.stats.atRiskStudents'),
          value: formatNumber(atRiskTotal),
          icon: <AlertTriangle className="h-4 w-4" />,
          iconSignature: 'atrisk',
          state: atRiskTotal > 0 ? 'warn' : 'good',
          sub: t('studentsModule.stats.belowThreshold'),
        }

  const attendanceMetric: StatMetric =
    attendanceRate != null
      ? {
          label: t('studentsModule.stats.todayAttendance'),
          value: `${formatNumber(Number(attendanceRate.toFixed(1)))}%`,
          icon: <ClipboardCheck className="h-4 w-4" />,
          iconSignature: 'metric_attendance',
          state: attendanceRate < 80 ? 'critical' : attendanceRate < 90 ? 'warn' : 'good',
          meter: { pct: attendanceRate, target: 90 },
          sub: attSummary
            ? t('studentsModule.stats.attendanceBreakdown', {
                present: formatNumber(attSummary.present),
                absent: formatNumber(attSummary.absent),
                late: formatNumber(attSummary.late),
              })
            : t('studentsModule.stats.today'),
        }
      : {
          label: t('studentsModule.stats.todayAttendance'),
          value: '—',
          icon: <ClipboardCheck className="h-4 w-4" />,
          iconSignature: 'metric_attendance',
          state: 'muted',
          sub: t('studentsModule.stats.today'),
        }

  const statBandMetrics: StatMetric[] = [
    enrolledMetric,
    atRiskMetric,
    attendanceMetric,
    {
      label: t('studentsModule.stats.gradeLevels'),
      value: formatNumber(overviewData.enrollment.data.length),
      icon: <GraduationCap className="h-4 w-4" />,
      iconSignature: 'gradelevels',
      state: 'normal',
      sub: t('studentsModule.stats.coveredThisYear'),
    },
  ]

  return (
    <div className="relative overflow-hidden min-h-full p-5 pb-10">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-5"
      >
        {/* ---- Page header (pagebar) — breadcrumb names the page, band summarizes ---- */}
        <motion.div variants={fadeInUp}>
          <PageHeader mode="pagebar" actions={headerActions} />
        </motion.div>

        {/* ---- Error State ---- */}
        {isError ? (
          <ErrorState
            size="page"
            title={t('studentsModule.error.title')}
            description={t('studentsModule.error.description')}
            action={
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-1.5" />
                {t('error.retry')}
              </Button>
            }
          />
        ) : (
          <>
            {/* ---- Unified KPI stat band ---- */}
            <motion.div variants={fadeInUp}>
              <StatBand metrics={statBandMetrics} ariaLabel={t('studentsModule.stats.totalEnrolled')} />
            </motion.div>

            {/* ---- Student Table ---- */}
            <motion.div variants={fadeInUp}>
              {showEmptyFilterState ? (
                <EmptyState
                  icon={<Users className="h-6 w-6" />}
                  title={t('studentsModule.empty.noStudentsFound')}
                  description={t('studentsModule.empty.adjustFilters')}
                  action={
                    <Button variant="outline" size="sm" onClick={handleClearFilters}>
                      {t('dataTable.clearFilters')}
                    </Button>
                  }
                />
              ) : (
                <StudentTable
                  students={filteredStudents}
                  attendanceByStudent={attendanceByStudent}
                  canViewGuardians={guardianPerms.view}
                  canViewLocation={studentPerms.view}
                  bulkActions={bulkActions}
                  rowSelection={rowSelection}
                  onRowSelectionChange={setRowSelection}
                  {...studentsToolbar}
                  toolbarExtra={
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[rgb(var(--border-primary)/0.35)]"
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
