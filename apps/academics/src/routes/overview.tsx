/**
 * Academics Overview Page — V2
 *
 * Complete redesign with V2 design tokens, animated KPI tiles,
 * attendance alerts, charts, and bottom detail row.
 */

import { useMemo, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import {
  GraduationCap,
  Users,
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
import { EnrollmentSnapshotCard } from '../components/overview-v2/EnrollmentSnapshotCard'

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
  return (
    <div className="max-w-6xl mx-auto pt-16 pb-12">
      <Card className="p-8 border-border-secondary max-w-lg mx-auto text-center">
        <div className="inline-flex p-3 rounded-2xl bg-teal-500/10 mb-4">
          <School className="w-7 h-7 text-teal-600 dark:text-cyan-400" />
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
          <CalendarClock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
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
  const queryClient = useQueryClient()
  const data = useAcademicsOverviewV2(schoolId)
  const { staggerContainer, fadeInUp } = useMotionVariants()

  // Guards
  if (!data.academicYear.isLoading && !data.academicYear.id && !data.academicYear.isError) {
    return <NoAcademicYearGuard />
  }

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

  return (
    <div data-v2 className="p-5 pb-10">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {/* ---- Compact Header ---- */}
        <motion.div variants={fadeInUp} className="flex items-center justify-between" style={{ height: 44 }}>
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: 'rgba(29, 158, 117, 0.12)',
              }}
            >
              <GraduationCap className="w-4 h-4" style={{ color: '#1D9E75' }} />
            </div>
            <h1
              className="text-[14px] font-semibold"
              style={{ color: 'var(--v2-text-primary)' }}
            >
              Academics
            </h1>
            <span className="text-[11px]" style={{ color: 'var(--v2-text-ghost)' }}>|</span>
            <span className="text-[11px]" style={{ color: 'var(--v2-text-faint)' }}>
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          {data.academicYear.name && (
            <span
              className="text-[11px] px-2.5 py-1 rounded-md"
              style={{
                background: 'var(--v2-bg-elevated)',
                color: 'var(--v2-text-hint)',
              }}
            >
              {data.academicYear.name}
            </span>
          )}
        </motion.div>

        {/* ---- KPI Grid (4 tiles) ---- */}
        <motion.div
          variants={fadeInUp}
          className="grid gap-[10px] grid-cols-2 lg:grid-cols-4"
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
              hint="this academic year"
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
            hint="active classes"
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
            hint={data.overview.todayAttendanceSummary ? `${data.overview.todayAttendanceSummary.totalRecorded} of ${data.overview.todayAttendanceSummary.totalStudents} recorded` : 'today'}
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
            hint="below 90% threshold"
            loading={data.alerts.isLoading}
          />
        </motion.div>

        {/* ---- Attendance Alerts ---- */}
        <motion.div variants={fadeInUp}>
          <WidgetErrorBoundaryV2 fallbackMessage="Unable to load alerts">
            <AttendanceAlertsCard
              alerts={data.alerts.items}
              totalCount={data.alerts.totalCount}
              unrecordedCount={unrecordedCount}
              isLoading={data.alerts.isLoading}
            />
          </WidgetErrorBoundaryV2>
        </motion.div>

        {/* ---- Charts Row (2 columns) ---- */}
        <motion.div
          variants={fadeInUp}
          className="grid gap-3 grid-cols-1 md:grid-cols-2"
        >
          <WidgetErrorBoundaryV2 fallbackMessage="Unable to load attendance trend">
            <AttendanceTrendChart
              chartData={data.trend.chartData}
              summary={data.trend.summary}
              isLoading={data.trend.isLoading}
            />
          </WidgetErrorBoundaryV2>

          {data.canViewEnrollment && (
            <WidgetErrorBoundaryV2 fallbackMessage="Unable to load enrollment chart">
              <EnrollmentByGradeChart
                data={data.enrollment.data}
                total={data.enrollment.total}
                isLoading={data.overview.isLoading}
              />
            </WidgetErrorBoundaryV2>
          )}
        </motion.div>

        {/* ---- Bottom Row (3 columns) ---- */}
        <motion.div
          variants={fadeInUp}
          className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_0.8fr]"
        >
          <WidgetErrorBoundaryV2 fallbackMessage="Unable to load at-risk students">
            <AtRiskStudentsCard
              students={data.alerts.students}
              totalAtRisk={data.alerts.totalCount}
              isLoading={data.alerts.isLoading}
            />
          </WidgetErrorBoundaryV2>

          <WidgetErrorBoundaryV2 fallbackMessage="Unable to load staff roster">
            <StaffRosterCard
              staff={data.staff.items}
              activeCount={data.staff.activeCount}
              isLoading={data.staff.isLoading}
              isError={data.staff.isError}
            />
          </WidgetErrorBoundaryV2>

          <WidgetErrorBoundaryV2 fallbackMessage="Unable to load enrollment snapshot">
            <EnrollmentSnapshotCard
              totalEnrolled={data.overview.totalEnrolled}
              activeSections={data.overview.activeSections}
              gradeLevelCount={data.enrollment.data.length}
              academicYear={data.academicYear.name ? {
                name: data.academicYear.name,
                startDate: data.academicYear.startDate!,
                endDate: data.academicYear.endDate!,
              } : null}
              isLoading={data.overview.isLoading}
            />
          </WidgetErrorBoundaryV2>
        </motion.div>
      </motion.div>
    </div>
  )
}
