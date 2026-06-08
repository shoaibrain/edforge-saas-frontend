/**
 * Academics Overview Page — V2
 *
 * Complete redesign with V2 design tokens, animated KPI tiles,
 * attendance alerts, charts, and bottom detail row.
 */

import { useMemo, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import {
  GraduationCap,
  Users,
  UserPlus,
  LayoutGrid,
  ClipboardCheck,
  AlertTriangle,
  CalendarClock,
  School,
} from 'lucide-react'
import { StatCard, WidgetErrorBoundaryV2 } from '@edforge/ui'
import { getAttendanceColor } from '@edforge/types'
import { useActiveSchoolId } from '../stores/app.store'
import { useAcademicsOverviewV2 } from '../hooks/useAcademicsOverviewV2'
import { overviewKeys } from '../hooks/useAcademicsOverview'
import { Card } from '@edforge/ui'

// V2 components
import { AttendanceAlertsCard } from '../components/overview-v2/AttendanceAlertsCard'
import { AttendanceTrendChart } from '../components/overview-v2/AttendanceTrendChart'
import { EnrollmentByGradeChart } from '../components/overview-v2/EnrollmentByGradeChart'
import { AtRiskStudentsCard } from '../components/overview-v2/AtRiskStudentsCard'
import { StaffRosterCard } from '../components/overview-v2/StaffRosterCard'
import { AcademicsFilterRow } from '../components/overview-v2/AcademicsFilterRow'

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

function AcademicsInsightStrip({
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

  const parts: string[] = [
    `${totalEnrolled} student${totalEnrolled !== 1 ? 's' : ''} enrolled across ${gradeCount} grade${gradeCount !== 1 ? 's' : ''}`,
  ]

  if (attendanceRate != null) {
    parts.push(`${attendanceRate.toFixed(1)}% attendance today`)
  } else {
    parts.push('no attendance data')
  }

  if (atRiskCount > 0) {
    parts.push(`${atRiskCount} at-risk student${atRiskCount !== 1 ? 's' : ''}`)
  } else {
    parts.push('no at-risk students')
  }

  return (
    <p className="text-xs leading-relaxed" style={{ color: 'var(--v2-text-hint)' }}>
      {parts.join(' · ')}
    </p>
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
          <School className="w-7 h-7 text-[rgb(var(--action-secondary-fg))] dark:text-cyan-400" />
        </div>
        <h2 className="text-lg font-bold text-text-primary">Select a school</h2>
        <p className="text-sm text-text-secondary mt-1.5">
          Choose a school from the sidebar to view the academics overview.
        </p>
      </Card>
    </div>
  )
}

function NoAcademicYearGuard() {
  return (
    <div className="max-w-6xl mx-auto pt-16 pb-12">
      <Card className="p-8 border-border-secondary max-w-lg mx-auto text-center">
        <div className="inline-flex p-3 rounded-2xl bg-amber-400/15 mb-4">
          <CalendarClock className="w-7 h-7 text-[rgb(var(--state-warning-fg))]" />
        </div>
        <h2 className="text-lg font-bold text-text-primary">No active academic year</h2>
        <p className="text-sm text-text-secondary mt-1.5 max-w-sm mx-auto">
          Set up and activate an academic year in your school calendar to see overview data.
        </p>
      </Card>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Overview() {
  const schoolId = useActiveSchoolId()
  if (!schoolId) return <NoSchoolGuard />
  return <OverviewContent schoolId={schoolId} />
}

function OverviewContent({ schoolId }: { schoolId: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const data = useAcademicsOverviewV2(schoolId)
  const { staggerContainer, fadeInUp } = useMotionVariants()

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: overviewKeys.all })
  }, [queryClient])

  // Compute unrecorded attendance count
  const unrecordedCount = useMemo(() => {
    const summary = data.overview.todayAttendanceSummary
    if (!summary) return undefined
    const unrecorded = summary.totalStudents - (summary.totalRecorded ?? 0)
    return unrecorded > 0 ? unrecorded : undefined
  }, [data.overview.todayAttendanceSummary])

  // Attendance rate color
  const attendanceRate = data.overview.todayAttendanceRate
  const attendanceColor = attendanceRate != null ? getAttendanceColor(attendanceRate) : undefined

  // Guards
  if (!data.academicYear.isLoading && !data.academicYear.id && !data.academicYear.isError) {
    return <NoAcademicYearGuard />
  }

  return (
    <div data-v2 className="p-5 pb-10">
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
                <GraduationCap className="w-4 h-4" style={{ color: '#1D9E75' }} />
              </div>
              <h1
                className="text-[14px] font-semibold"
                style={{ color: 'var(--v2-text-primary)' }}
              >
                Academics
              </h1>
              <span className="text-xs" style={{ color: 'var(--v2-text-ghost)' }}>|</span>
              <span className="text-xs" style={{ color: 'var(--v2-text-faint)' }}>
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              {data.academicYear.name && (
                <>
                  <span className="text-xs" style={{ color: 'var(--v2-text-ghost)' }}>|</span>
                  <span
                    className="text-xs px-2.5 py-1 rounded-md"
                    style={{
                      background: 'var(--v2-bg-elevated)',
                      color: 'var(--v2-text-hint)',
                    }}
                  >
                    {data.academicYear.name}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate({ to: '/students/enrollment' })}
                aria-label="Enroll a student"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[7px] border transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--v2-brand-primary)]/40"
                style={{
                  background: 'var(--v2-bg-elevated)',
                  borderColor: 'var(--v2-border-default)',
                  color: 'var(--v2-text-secondary)',
                }}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Enroll Student
              </button>
              <button
                onClick={() => navigate({ to: '/classrooms', search: { tab: 'attendance' } })}
                aria-label="Take attendance"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[7px] transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--v2-brand-primary)]/40"
                style={{
                  background: 'var(--v2-brand-primary)',
                  color: '#fff',
                }}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                Take Attendance
              </button>
            </div>
          </div>

          {/* Contextual insight strip */}
          <AcademicsInsightStrip
            totalEnrolled={data.overview.totalEnrolled ?? 0}
            gradeCount={data.enrollment.data.length}
            attendanceRate={data.overview.todayAttendanceRate}
            atRiskCount={data.alerts.totalCount}
            isLoading={data.overview.isLoading}
          />
        </motion.div>

        {/* ---- Filters & Export ---- */}
        <AcademicsFilterRow
          fromDate={data.filters.from}
          toDate={data.filters.to}
          gradeLevelFilter={data.filters.gradeLevel}
          gradeLevels={data.gradeLevels}
          hasActiveFilters={data.hasActiveFilters}
          isExporting={data.isExporting}
          hasAcademicYear={!!data.academicYear.id}
          onFromChange={data.setFromDate}
          onToChange={data.setToDate}
          onGradeLevelChange={data.setGradeLevelFilter}
          onClear={data.clearFilters}
          onExport={data.handleExportCSV}
        />

        {/* ---- Attendance Alerts (compact inline strip) ---- */}
        <motion.div variants={fadeInUp}>
          <AttendanceAlertsCard
            alerts={data.alerts.items}
            totalCount={data.alerts.totalCount}
            unrecordedCount={unrecordedCount}
            isLoading={data.alerts.isLoading}
          />
        </motion.div>

        {/* ---- KPI Grid (4 tiles) ---- */}
        <motion.div
          variants={fadeInUp}
          className="grid gap-3 grid-cols-2 lg:grid-cols-4"
        >
          {/* Tile 1: Total Enrolled */}
          {data.canViewEnrollment && (
            <StatCard
              label="Total Enrolled"
              value={data.overview.totalEnrolled != null ? data.overview.totalEnrolled.toLocaleString() : '—'}
              icon={Users}
              accentColor="rgba(29, 158, 117, 0.12)"
              iconColor="#1D9E75"
              barColor="#1D9E75"
              tag={data.overview.recentEnrollments && data.overview.recentEnrollments > 0 ? { text: `+${data.overview.recentEnrollments} recent`, color: '#1D9E75', bg: 'rgba(29, 158, 117, 0.10)' } : data.enrollment.total > 0 ? { text: `${data.enrollment.data.length} grades`, color: '#1D9E75', bg: 'rgba(29, 158, 117, 0.10)' } : undefined}
              hint={data.enrollment.data.length > 0 ? `across ${data.enrollment.data.length} grades` : 'this academic year'}
              loading={data.overview.isLoading}
              error={data.overview.errors.length > 0}
              onRetry={handleRefresh}
            />
          )}

          {/* Tile 2: Active Sections */}
          <StatCard
            label="Active Sections"
            value={data.overview.activeSections != null ? data.overview.activeSections.toString() : '—'}
            icon={LayoutGrid}
            accentColor="rgba(55, 138, 221, 0.12)"
            iconColor="#378ADD"
            barColor="#378ADD"
            tag={data.teachers.teacherCount != null ? { text: `${data.teachers.teacherCount} teachers`, color: '#378ADD', bg: 'rgba(55, 138, 221, 0.10)' } : undefined}
            hint={data.overview.activeSections != null && data.overview.totalEnrolled != null && data.overview.activeSections > 0
              ? `${Math.round(data.overview.totalEnrolled / data.overview.activeSections)}:1 student-section ratio`
              : 'active classes'}
            loading={data.overview.isLoading}
            error={data.overview.errors.length > 0}
            onRetry={handleRefresh}
          />

          {/* Tile 3: Today's Attendance */}
          <StatCard
            label="Today's Attendance"
            value={attendanceRate != null ? `${attendanceRate.toFixed(1)}%` : '—'}
            icon={ClipboardCheck}
            accentColor="rgba(239, 159, 39, 0.12)"
            iconColor="#EF9F27"
            barColor={attendanceColor || '#EF9F27'}
            valueColor={attendanceColor}
            tag={unrecordedCount ? { text: 'Partial data', color: '#EF9F27', bg: 'rgba(239, 159, 39, 0.10)' } : undefined}
            hint={data.overview.todayAttendanceSummary
              ? `${data.overview.todayAttendanceSummary.present} present · ${data.overview.todayAttendanceSummary.absent} absent · ${data.overview.todayAttendanceSummary.late} late`
              : 'today'}
            loading={data.overview.isLoading}
            error={data.overview.errors.length > 0}
            onRetry={handleRefresh}
          />

          {/* Tile 4: At-Risk Students */}
          <StatCard
            label="At-Risk Students"
            value={data.alerts.totalCount.toString()}
            icon={AlertTriangle}
            accentColor="rgba(226, 75, 74, 0.12)"
            iconColor="#E24B4A"
            barColor="#E24B4A"
            tag={data.alerts.criticalCount > 0 ? { text: `${data.alerts.criticalCount} below 80%`, color: '#E24B4A', bg: 'rgba(226, 75, 74, 0.10)' } : undefined}
            hint={data.alerts.criticalCount > 0 || data.alerts.warningCount > 0
              ? `${data.alerts.criticalCount} critical · ${data.alerts.warningCount} warning`
              : 'below 90% threshold'}
            loading={data.alerts.isLoading}
          />
        </motion.div>

        {/* ---- Attendance Trend (full width) ---- */}
        <motion.div variants={fadeInUp}>
          <WidgetErrorBoundaryV2 fallbackMessage="Unable to load attendance trend">
            <AttendanceTrendChart
              chartData={data.trend.chartData}
              summary={data.trend.summary}
              isLoading={data.trend.isLoading}
            />
          </WidgetErrorBoundaryV2>
        </motion.div>

        {/* ---- 2-col: Enrollment by Grade | At-Risk Students ---- */}
        <motion.div
          variants={fadeInUp}
          className="grid gap-4 grid-cols-1 md:grid-cols-2"
        >
          {data.canViewEnrollment && (
            <WidgetErrorBoundaryV2 fallbackMessage="Unable to load enrollment chart">
              <EnrollmentByGradeChart
                data={data.enrollment.data}
                total={data.enrollment.total}
                isLoading={data.overview.isLoading}
              />
            </WidgetErrorBoundaryV2>
          )}

          <WidgetErrorBoundaryV2 fallbackMessage="Unable to load at-risk students">
            <AtRiskStudentsCard
              students={data.alerts.students}
              totalAtRisk={data.alerts.totalCount}
              isLoading={data.alerts.isLoading}
            />
          </WidgetErrorBoundaryV2>
        </motion.div>

        {/* ---- Staff Roster (full width) ---- */}
        <motion.div
          variants={fadeInUp}
          className="grid gap-4 grid-cols-1 md:grid-cols-2"
        >
          <WidgetErrorBoundaryV2 fallbackMessage="Unable to load staff roster">
            <StaffRosterCard
              staff={data.staff.items}
              activeCount={data.staff.activeCount}
              isLoading={data.staff.isLoading}
              isError={data.staff.isError}
            />
          </WidgetErrorBoundaryV2>
        </motion.div>
      </motion.div>
    </div>
  )
}
