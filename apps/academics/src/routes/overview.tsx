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
  Users,
  UserPlus,
  LayoutGrid,
  ClipboardCheck,
  AlertTriangle,
  CalendarClock,
  School,
} from 'lucide-react'
import { StatCard, WidgetErrorBoundaryV2, ContextBar, ContextBarSep, ContextBarYear } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
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
  const { t, i18n } = useTranslation('academics')

  if (isLoading) {
    return (
      <div className="h-5 w-3/5 rounded-lg v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
    )
  }

  if (totalEnrolled === 0) return null

  const numberFormatter = new Intl.NumberFormat(i18n.language === 'ne' ? 'ne-NP' : 'en-US')
  const parts: string[] = [
    t('moduleOverview.insight.enrolledAcrossGrades', {
      count: totalEnrolled,
      students: numberFormatter.format(totalEnrolled),
      grades: numberFormatter.format(gradeCount),
    }),
  ]

  if (attendanceRate != null) {
    parts.push(t('moduleOverview.insight.attendanceToday', { value: attendanceRate.toFixed(1) }))
  } else {
    parts.push(t('moduleOverview.insight.noAttendanceData'))
  }

  if (atRiskCount > 0) {
    parts.push(t('moduleOverview.insight.atRiskStudents', {
      count: atRiskCount,
      value: numberFormatter.format(atRiskCount),
    }))
  } else {
    parts.push(t('moduleOverview.insight.noAtRiskStudents'))
  }

  return (
    <p className="text-xs leading-relaxed text-[rgb(var(--text-tertiary))]">
      {parts.join(' · ')}
    </p>
  )
}

// ============================================================================
// GUARDS
// ============================================================================

function NoSchoolGuard() {
  const { t } = useTranslation('academics')

  return (
    <div className="max-w-6xl mx-auto pt-16 pb-12">
      <Card className="p-8 border-border-secondary max-w-lg mx-auto text-center">
        <div className="inline-flex p-3 rounded-2xl bg-[rgb(var(--state-info-bg)/0.18)] mb-4">
          <School className="w-7 h-7 text-[rgb(var(--action-secondary-fg))] " />
        </div>
        <h2 className="text-lg font-bold text-text-primary">{t('moduleOverview.guards.selectSchoolTitle')}</h2>
        <p className="text-sm text-text-secondary mt-1.5">
          {t('moduleOverview.guards.selectSchoolDescription')}
        </p>
      </Card>
    </div>
  )
}

function NoAcademicYearGuard() {
  const { t } = useTranslation('academics')

  return (
    <div className="max-w-6xl mx-auto pt-16 pb-12">
      <Card className="p-8 border-border-secondary max-w-lg mx-auto text-center">
        <div className="inline-flex p-3 rounded-2xl bg-amber-400/15 mb-4">
          <CalendarClock className="w-7 h-7 text-[rgb(var(--state-warning-fg))]" />
        </div>
        <h2 className="text-lg font-bold text-text-primary">{t('moduleOverview.guards.noAcademicYearTitle')}</h2>
        <p className="text-sm text-text-secondary mt-1.5 max-w-sm mx-auto">
          {t('moduleOverview.guards.noAcademicYearDescription')}
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
  const { t, i18n } = useTranslation('academics')
  const data = useAcademicsOverviewV2(schoolId)
  const { staggerContainer, fadeInUp } = useMotionVariants()
  const locale = i18n.language === 'ne' ? 'ne-NP' : 'en-US'
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale])

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
    <div className="p-5 pb-10">
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
                {data.academicYear.name ? (
                  <ContextBarYear>{data.academicYear.name}</ContextBarYear>
                ) : null}
                {data.academicYear.name ? <ContextBarSep /> : null}
                <span>
                  {new Date().toLocaleDateString(locale, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </>
            }
            description={
              <AcademicsInsightStrip
                totalEnrolled={data.overview.totalEnrolled ?? 0}
                gradeCount={data.enrollment.data.length}
                attendanceRate={data.overview.todayAttendanceRate}
                atRiskCount={data.alerts.totalCount}
                isLoading={data.overview.isLoading}
              />
            }
            actions={
              <>
                <button
                  onClick={() => navigate({ to: '/students/enrollment', search: { tab: 'registration' } })}
                  aria-label={t('moduleOverview.actions.enrollStudentAria')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-[9px] border transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-enrollment)/0.4)] bg-transparent border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))]"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {t('moduleOverview.actions.enrollStudent')}
                </button>
                <button
                  onClick={() => navigate({ to: '/classrooms', search: { tab: 'attendance' } })}
                  aria-label={t('moduleOverview.actions.takeAttendanceAria')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-[9px] transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-enrollment)/0.4)] bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))]"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  {t('moduleOverview.actions.takeAttendance')}
                </button>
              </>
            }
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

        {/* ---- KPI Grid (4 tiles) — lead with the confident numbers ---- */}
        <motion.div
          variants={fadeInUp}
          className="grid gap-3 grid-cols-2 lg:grid-cols-4"
        >
          {/* Tile 1: Total Enrolled */}
          {data.canViewEnrollment && (
            <StatCard
              label={t('moduleOverview.kpis.totalEnrolled')}
              value={data.overview.totalEnrolled != null ? numberFormatter.format(data.overview.totalEnrolled) : '—'}
              icon={Users}
              accentColor="rgb(var(--accent-enrollment)/0.12)"
              iconColor="rgb(var(--accent-enrollment))"
              barColor="rgb(var(--accent-enrollment))"
              tag={data.overview.recentEnrollments && data.overview.recentEnrollments > 0 ? { text: t('moduleOverview.kpis.recent', { count: numberFormatter.format(data.overview.recentEnrollments) }), color: 'rgb(var(--accent-enrollment))', bg: 'rgb(var(--accent-enrollment)/0.1)' } : data.enrollment.total > 0 ? { text: t('moduleOverview.kpis.grades', { count: numberFormatter.format(data.enrollment.data.length) }), color: 'rgb(var(--accent-enrollment))', bg: 'rgb(var(--accent-enrollment)/0.1)' } : undefined}
              hint={data.enrollment.data.length > 0 ? t('moduleOverview.kpis.acrossGrades', { count: numberFormatter.format(data.enrollment.data.length) }) : t('moduleOverview.kpis.thisAcademicYear')}
              loading={data.overview.isLoading}
              error={data.overview.errors.length > 0}
              onRetry={handleRefresh}
            />
          )}

          {/* Tile 2: Active Sections */}
          <StatCard
            label={t('moduleOverview.kpis.activeSections')}
            value={data.overview.activeSections != null ? numberFormatter.format(data.overview.activeSections) : '—'}
            icon={LayoutGrid}
            accentColor="rgb(var(--accent-academics)/0.12)"
            iconColor="rgb(var(--accent-academics))"
            barColor="rgb(var(--accent-academics))"
            tag={data.teachers.teacherCount != null ? { text: t('moduleOverview.kpis.teachers', { count: numberFormatter.format(data.teachers.teacherCount) }), color: 'rgb(var(--accent-academics))', bg: 'rgb(var(--accent-academics)/0.1)' } : undefined}
            hint={data.overview.activeSections != null && data.overview.totalEnrolled != null && data.overview.activeSections > 0
              ? t('moduleOverview.kpis.studentSectionRatio', { value: numberFormatter.format(Math.round(data.overview.totalEnrolled / data.overview.activeSections)) })
              : t('moduleOverview.kpis.activeClasses')}
            loading={data.overview.isLoading}
            error={data.overview.errors.length > 0}
            onRetry={handleRefresh}
          />

          {/* Tile 3: Today's Attendance */}
          <StatCard
            label={t('moduleOverview.kpis.todayAttendance')}
            value={attendanceRate != null ? `${attendanceRate.toFixed(1)}%` : '—'}
            icon={ClipboardCheck}
            accentColor="rgb(var(--accent-attendance)/0.12)"
            iconColor="rgb(var(--accent-attendance))"
            barColor={attendanceColor || 'rgb(var(--accent-attendance))'}
            valueColor={attendanceColor}
            tag={unrecordedCount ? { text: t('moduleOverview.kpis.partialData'), color: 'rgb(var(--accent-attendance))', bg: 'rgb(var(--accent-attendance)/0.1)' } : undefined}
            hint={data.overview.todayAttendanceSummary
              ? t('moduleOverview.kpis.attendanceBreakdown', {
                  present: numberFormatter.format(data.overview.todayAttendanceSummary.present),
                  absent: numberFormatter.format(data.overview.todayAttendanceSummary.absent),
                  late: numberFormatter.format(data.overview.todayAttendanceSummary.late),
                })
              : t('moduleOverview.kpis.today')}
            loading={data.overview.isLoading}
            error={data.overview.errors.length > 0}
            onRetry={handleRefresh}
          />

          {/* Tile 4: At-Risk Students */}
          <StatCard
            label={t('moduleOverview.kpis.atRiskStudents')}
            value={numberFormatter.format(data.alerts.totalCount)}
            icon={AlertTriangle}
            accentColor="rgb(var(--accent-finance)/0.12)"
            iconColor="rgb(var(--accent-finance))"
            barColor="rgb(var(--accent-finance))"
            tag={data.alerts.criticalCount > 0 ? { text: t('moduleOverview.kpis.below80', { count: numberFormatter.format(data.alerts.criticalCount) }), color: 'rgb(var(--accent-finance))', bg: 'rgb(var(--accent-finance)/0.1)' } : undefined}
            hint={data.alerts.criticalCount > 0 || data.alerts.warningCount > 0
              ? t('moduleOverview.kpis.riskBreakdown', {
                  critical: numberFormatter.format(data.alerts.criticalCount),
                  warning: numberFormatter.format(data.alerts.warningCount),
                })
              : t('moduleOverview.kpis.below90Threshold')}
            loading={data.alerts.isLoading}
          />
        </motion.div>

        {/* ---- Needs Attention (attendance alerts, reframed below the KPIs) ---- */}
        {(data.alerts.isLoading || data.alerts.items.length > 0 || (unrecordedCount ?? 0) > 0) && (
          <motion.div variants={fadeInUp} className="space-y-2">
            <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
              {t('moduleOverview.needsAttention.title')}
            </h2>
            <AttendanceAlertsCard
              alerts={data.alerts.items}
              totalCount={data.alerts.totalCount}
              unrecordedCount={unrecordedCount}
              isLoading={data.alerts.isLoading}
            />
          </motion.div>
        )}

        {/* ---- Attendance Trend (full width) ---- */}
        <motion.div variants={fadeInUp}>
          <WidgetErrorBoundaryV2 fallbackMessage={t('moduleOverview.errors.attendanceTrend')}>
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
            <WidgetErrorBoundaryV2 fallbackMessage={t('moduleOverview.errors.enrollmentChart')}>
              <EnrollmentByGradeChart
                data={data.enrollment.data}
                total={data.enrollment.total}
                isLoading={data.overview.isLoading}
              />
            </WidgetErrorBoundaryV2>
          )}

          <WidgetErrorBoundaryV2 fallbackMessage={t('moduleOverview.errors.atRiskStudents')}>
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
          <WidgetErrorBoundaryV2 fallbackMessage={t('moduleOverview.errors.staffRoster')}>
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
