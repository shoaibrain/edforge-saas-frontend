/**
 * Academics Overview Page — dashboard recipe
 *
 * PageHeader (pagebar, with the ⑧ AttentionCorner pill in its left slot) →
 * AttentionCorner shade → StatBand → WidgetCard grid (⑤), the header-zone
 * structure. Signals are derived from live `useAcademicsOverviewV2` data
 * (page-scoped; they auto-resolve when the data heals), tagged with the SABER
 * domain they serve. Reuses the existing overview-v2 chart cards in `bare`
 * mode; preserves the filters/export row, guards, per-widget error boundaries,
 * and reduced-motion stagger.
 */

import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'framer-motion'
import { UserPlus, ClipboardCheck, CalendarClock, School, AlertTriangle, Flag, Gauge } from 'lucide-react'
import {
  Card,
  PageHeader,
  StatBand,
  type StatMetric,
  type StatBandState,
  AttentionCorner,
  AttentionCornerPill,
  AttentionCornerShade,
  type Signal,
  WidgetGrid,
  WidgetCard,
  WidgetErrorBoundaryV2,
} from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import { useActiveSchoolId } from '../stores/app.store'
import { useAcademicsOverviewV2 } from '../hooks/useAcademicsOverviewV2'
import { useSignalAcks } from '../hooks/useSignalAcks'

// V2 chart cards (framed by WidgetCard in `bare` mode)
import { AttendanceTrendChart, AttendanceTrendChartFooter } from '../components/overview-v2/AttendanceTrendChart'
import { EnrollmentByGradeChart, EnrollmentByGradeChartFooter } from '../components/overview-v2/EnrollmentByGradeChart'
import { AtRiskStudentsCard, AtRiskStudentsCardFooter } from '../components/overview-v2/AtRiskStudentsCard'
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
  const { t, i18n } = useTranslation('academics')
  const data = useAcademicsOverviewV2(schoolId)
  const { acked, ack, unack } = useSignalAcks()
  const { staggerContainer, fadeInUp } = useMotionVariants()
  const locale = i18n.language === 'ne' ? 'ne-NP' : 'en-US'
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale])

  // Compute unrecorded attendance count
  const unrecordedCount = useMemo(() => {
    const summary = data.overview.todayAttendanceSummary
    if (!summary) return undefined
    const unrecorded = summary.totalStudents - (summary.totalRecorded ?? 0)
    return unrecorded > 0 ? unrecorded : undefined
  }, [data.overview.todayAttendanceSummary])

  const attendanceRate = data.overview.todayAttendanceRate
  const attendanceState: StatBandState =
    attendanceRate == null ? 'normal' : attendanceRate >= 90 ? 'good' : attendanceRate >= 75 ? 'warn' : 'critical'

  // Guards
  if (!data.academicYear.isLoading && !data.academicYear.id && !data.academicYear.isError) {
    return <NoAcademicYearGuard />
  }

  // ── StatBand metrics (calm; attention only via state) ────────────────────
  const enrolled = data.overview.totalEnrolled
  const gradeCount = data.enrollment.data.length
  const enrolledHint =
    gradeCount > 0
      ? t('moduleOverview.kpis.acrossGrades', { count: numberFormatter.format(gradeCount) })
      : t('moduleOverview.kpis.thisAcademicYear')
  const sectionsHint =
    data.overview.activeSections != null && enrolled != null && data.overview.activeSections > 0
      ? t('moduleOverview.kpis.studentSectionRatio', {
          value: numberFormatter.format(Math.round(enrolled / data.overview.activeSections)),
        })
      : t('moduleOverview.kpis.activeClasses')
  const attendanceSub = data.overview.todayAttendanceSummary
    ? t('moduleOverview.kpis.attendanceBreakdown', {
        present: numberFormatter.format(data.overview.todayAttendanceSummary.present),
        absent: numberFormatter.format(data.overview.todayAttendanceSummary.absent),
        late: numberFormatter.format(data.overview.todayAttendanceSummary.late),
      })
    : t('moduleOverview.kpis.today')
  const atRiskSub =
    data.alerts.criticalCount > 0 || data.alerts.warningCount > 0
      ? t('moduleOverview.kpis.riskBreakdown', {
          critical: numberFormatter.format(data.alerts.criticalCount),
          warning: numberFormatter.format(data.alerts.warningCount),
        })
      : t('moduleOverview.kpis.below90Threshold')

  const metrics: StatMetric[] = []
  if (data.canViewEnrollment) {
    const hasRecent = data.overview.recentEnrollments != null && data.overview.recentEnrollments > 0
    metrics.push(
      hasRecent
        ? {
            label: t('moduleOverview.kpis.totalEnrolled'),
            value: enrolled != null ? numberFormatter.format(enrolled) : '—',
            iconSignature: 'students',
            state: 'normal',
            primary: true,
            delta: { dir: 'up', val: `+${numberFormatter.format(data.overview.recentEnrollments as number)}` },
            sub: enrolledHint,
          }
        : {
            label: t('moduleOverview.kpis.totalEnrolled'),
            value: enrolled != null ? numberFormatter.format(enrolled) : '—',
            iconSignature: 'students',
            state: 'normal',
            primary: true,
            sub: enrolledHint,
          },
    )
  }
  metrics.push({
    label: t('moduleOverview.kpis.activeSections'),
    value: data.overview.activeSections != null ? numberFormatter.format(data.overview.activeSections) : '—',
    iconSignature: 'sections',
    state: 'normal',
    sub: sectionsHint,
  })
  metrics.push(
    unrecordedCount
      ? {
          label: t('moduleOverview.kpis.todayAttendance'),
          value: attendanceRate != null ? `${attendanceRate.toFixed(1)}%` : '—',
          iconSignature: 'metric_attendance',
          state: attendanceState,
          pill: { tone: 'neutral', text: t('moduleOverview.kpis.partialData') },
          sub: attendanceSub,
        }
      : attendanceRate != null
        ? {
            label: t('moduleOverview.kpis.todayAttendance'),
            value: `${attendanceRate.toFixed(1)}%`,
            iconSignature: 'metric_attendance',
            state: attendanceState,
            meter: { pct: attendanceRate, target: 80 },
            sub: attendanceSub,
          }
        : {
            label: t('moduleOverview.kpis.todayAttendance'),
            value: '—',
            iconSignature: 'metric_attendance',
            state: 'normal',
            sub: attendanceSub,
          },
  )
  metrics.push(
    data.alerts.criticalCount > 0
      ? {
          label: t('moduleOverview.kpis.atRiskStudents'),
          value: numberFormatter.format(data.alerts.totalCount),
          iconSignature: 'atrisk',
          state: 'critical',
          pill: { tone: 'critical', text: t('moduleOverview.kpis.below80', { count: numberFormatter.format(data.alerts.criticalCount) }) },
          sub: atRiskSub,
        }
      : {
          label: t('moduleOverview.kpis.atRiskStudents'),
          value: numberFormatter.format(data.alerts.totalCount),
          iconSignature: 'atrisk',
          state: data.alerts.warningCount > 0 ? 'warn' : 'normal',
          sub: atRiskSub,
        },
  )

  // ── ⑧ Attention Corner signals (replaces the AlertLane stack) ────────────
  // Derived from live query data — recording attendance / risk improving makes
  // a signal stop being emitted, which auto-resolves it in the pill. Page-
  // scoped (Academics Overview) and tagged with the SABER domain served.
  const signals: Signal[] = []
  if (data.alerts.criticalCount > 0) {
    signals.push({
      id: 'academics.at-risk-critical',
      severity: 'critical',
      domain: t('moduleOverview.signals.domains.attendance'),
      icon: <AlertTriangle className="h-4 w-4" aria-hidden="true" />,
      title: t('moduleOverview.alerts.criticalTitle', { count: data.alerts.criticalCount }),
      description: t('moduleOverview.alerts.criticalSubtitle', { total: data.alerts.totalCount }),
      fix: { label: t('moduleOverview.alerts.viewDetails'), onAction: () => navigate({ to: '/students' }) },
    })
  }
  if (data.alerts.warningCount > 0) {
    signals.push({
      id: 'academics.at-risk-warning',
      severity: 'warn',
      domain: t('moduleOverview.signals.domains.attendance'),
      icon: <Flag className="h-4 w-4" aria-hidden="true" />,
      title: t('moduleOverview.alerts.warningTitle', { count: data.alerts.warningCount }),
      description: t('moduleOverview.alerts.warningSubtitle'),
      fix: { label: t('moduleOverview.alerts.review'), onAction: () => navigate({ to: '/students' }) },
    })
  }
  if (unrecordedCount != null && unrecordedCount > 0) {
    signals.push({
      id: 'academics.attendance-unrecorded',
      severity: 'info',
      domain: t('moduleOverview.signals.domains.dataQuality'),
      icon: <Gauge className="h-4 w-4" aria-hidden="true" />,
      title: t('moduleOverview.alerts.unrecordedTitle', { count: unrecordedCount }),
      description: t('moduleOverview.alerts.unrecordedSubtitle'),
      fix: {
        label: t('moduleOverview.actions.takeAttendance'),
        onAction: () => navigate({ to: '/classrooms', search: { tab: 'attendance' } }),
      },
    })
  }

  return (
    <div className="p-5 pb-10">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-5">
        {/* ---- ⑧ Header zone — attention pill balances the primary actions;
                the shade expands in flow, pushing content ---- */}
        <AttentionCorner
          signals={data.alerts.isLoading ? [] : signals}
          acked={acked}
          onAck={ack}
          onUnack={unack}
          labels={{
            needAttention: t('moduleOverview.signals.needAttention'),
            allClear: t('moduleOverview.signals.allClear'),
            region: t('moduleOverview.needsAttention.title'),
            minimize: t('moduleOverview.signals.minimize'),
            acknowledge: t('moduleOverview.signals.acknowledge'),
            acknowledged: t('moduleOverview.signals.acknowledged'),
            acknowledgedHint: t('moduleOverview.signals.acknowledgedHint'),
            dismiss: t('moduleOverview.signals.dismiss'),
            emptyTitle: t('moduleOverview.signals.emptyTitle'),
          }}
        >
          <motion.div variants={fadeInUp}>
            <PageHeader
              mode="pagebar"
              attention={<AttentionCornerPill />}
              actions={[
                {
                  label: t('moduleOverview.actions.enrollStudent'),
                  icon: <UserPlus className="h-3.5 w-3.5" />,
                  ariaLabel: t('moduleOverview.actions.enrollStudentAria'),
                  onClick: () => navigate({ to: '/students/enrollment', search: { tab: 'registration' } }),
                },
                {
                  label: t('moduleOverview.actions.takeAttendance'),
                  icon: <ClipboardCheck className="h-3.5 w-3.5" />,
                  primary: true,
                  ariaLabel: t('moduleOverview.actions.takeAttendanceAria'),
                  onClick: () => navigate({ to: '/classrooms', search: { tab: 'attendance' } }),
                },
              ]}
            />
          </motion.div>
          <AttentionCornerShade />
        </AttentionCorner>

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

        {/* ---- StatBand — KPI summary ---- */}
        <motion.div variants={fadeInUp}>
          <StatBand metrics={metrics} ariaLabel={t('moduleOverview.kpis.region')} />
        </motion.div>

        {/* ---- ⑤ WidgetCard grid ---- */}
        <motion.div variants={fadeInUp}>
          <WidgetGrid>
            <WidgetCard
              title={t('moduleOverview.attendanceTrend.title')}
              iconSignature="metric_attendance"
              subtitle={t('moduleOverview.attendanceTrend.subtitle')}
              span={12}
              footer={<AttendanceTrendChartFooter />}
            >
              <WidgetErrorBoundaryV2 fallbackMessage={t('moduleOverview.errors.attendanceTrend')}>
                <AttendanceTrendChart
                  chartData={data.trend.chartData}
                  summary={data.trend.summary}
                  isLoading={data.trend.isLoading}
                  bare
                />
              </WidgetErrorBoundaryV2>
            </WidgetCard>

            {data.canViewEnrollment && (
              <WidgetCard
                title={t('moduleOverview.enrollmentChart.title')}
                iconSignature="students"
                span={6}
                metric={t('moduleOverview.enrollmentChart.total', { total: data.enrollment.total })}
                footer={<EnrollmentByGradeChartFooter />}
              >
                <WidgetErrorBoundaryV2 fallbackMessage={t('moduleOverview.errors.enrollmentChart')}>
                  <EnrollmentByGradeChart
                    data={data.enrollment.data}
                    total={data.enrollment.total}
                    isLoading={data.overview.isLoading}
                    bare
                  />
                </WidgetErrorBoundaryV2>
              </WidgetCard>
            )}

            <WidgetCard
              title={t('moduleOverview.atRisk.title')}
              iconSignature="atrisk"
              span={6}
              metric={t('moduleOverview.atRisk.total', { count: data.alerts.totalCount })}
              footer={<AtRiskStudentsCardFooter totalAtRisk={data.alerts.totalCount} />}
            >
              <WidgetErrorBoundaryV2 fallbackMessage={t('moduleOverview.errors.atRiskStudents')}>
                <AtRiskStudentsCard
                  students={data.alerts.students}
                  totalAtRisk={data.alerts.totalCount}
                  isLoading={data.alerts.isLoading}
                  bare
                />
              </WidgetErrorBoundaryV2>
            </WidgetCard>

            <WidgetCard
              title={t('moduleOverview.staffRoster.title')}
              iconSignature="staff"
              span={12}
              metric={t('moduleOverview.staffRoster.active', { count: data.staff.activeCount })}
            >
              <WidgetErrorBoundaryV2 fallbackMessage={t('moduleOverview.errors.staffRoster')}>
                <StaffRosterCard
                  staff={data.staff.items}
                  activeCount={data.staff.activeCount}
                  isLoading={data.staff.isLoading}
                  isError={data.staff.isError}
                  bare
                />
              </WidgetErrorBoundaryV2>
            </WidgetCard>
          </WidgetGrid>
        </motion.div>
      </motion.div>
    </div>
  )
}
