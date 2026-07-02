/**
 * AdminCommandCenter — dashboard recipe
 *
 * Home page for school administrators, on the canonical dashboard surfaces:
 * ⑧ AttentionCorner → StatBand (KPIs) → WidgetCard grid (⑤). The greeting lives
 * in the shell topbar (HomeTopbarCenter). All live data hooks + operational chrome
 * (offline banner, getting-started, day-change, per-widget loading/error/retry,
 * section error boundaries, reduced-motion stagger) are preserved.
 */

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { WifiOff } from 'lucide-react'
import {
  StatBand,
  type StatMetric,
  type StatBandState,
  AttentionCorner,
  AttentionCornerPill,
  AttentionCornerShade,
  useSignalAcks,
  type Signal,
  WidgetGrid,
  WidgetCard,
} from '@edforge/ui'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from '@edforge/i18n'
import { useCurrency } from '@edforge/types/use-currency'
import { useSettings, useShell } from '../../lib/shell-context'
import { useGettingStarted } from '../../hooks/useGettingStarted'
import { GettingStartedGuide } from './GettingStartedGuide'
import { AttendanceTrendCard, AttendanceTrendFooter } from './AttendanceTrendCard'
import { FinanceSummaryCard, FinanceSummaryFooter } from './FinanceSummaryCard'
import { AttendanceBySectionCard } from './AttendanceBySectionCard'
import { RecentActivityFeed } from './RecentActivityFeed'
import { SectionErrorBoundary } from './SectionErrorBoundary'
import {
  useHomeAcademicYear,
  useAcademicsSnapshot,
  useHomeAlerts,
  useHomeAttendanceTrend,
  useFinanceSummary,
  useSectionAttendanceItems,
  useRecentActivityItems,
  useHomeCacheInvalidation,
  useOnlineStatus,
  useDayChangeDetection,
  ATTENDANCE_THRESHOLD,
  type HomeAlert,
} from '../../hooks/useHomeData'
import { useHomeStore } from '../../stores/home.store'

// ============================================================================
// ANIMATION VARIANTS (Ticket 4.7: prefers-reduced-motion support)
// ============================================================================

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const sectionVariants = prefersReducedMotion
  ? undefined
  : { hidden: { opacity: 0 }, visible: { opacity: 1 } }

const staggerContainer = prefersReducedMotion
  ? undefined
  : { visible: { transition: { staggerChildren: 0.06 } } }

// ============================================================================
// COMPONENT
// ============================================================================

interface AdminCommandCenterProps {
  schoolId: string | null
}

export function AdminCommandCenter({ schoolId }: AdminCommandCenterProps) {
  const { t } = useTranslation('dashboard')
  const navigate = useNavigate()
  const settings = useSettings()
  const { availableSchools } = useShell()
  const { formatShort } = useCurrency(settings)
  const setActiveAcademicYear = useHomeStore((s) => s.setActiveAcademicYear)
  const gettingStarted = useGettingStarted()

  // ── Ticket 4.2: Online status ─────────────────────────────────────────
  const isOnline = useOnlineStatus()

  // ── Ticket 4.4: Day-change detection ───────────────────────────────────
  useDayChangeDetection()

  // ── Cache invalidation on school switch (Ticket 1.5) ──────────────────
  useHomeCacheInvalidation(schoolId)

  // ── Data fetching (parallel) ────────────────────────────────────────────
  const { data: academicYear } = useHomeAcademicYear(schoolId)
  const academicYearId = academicYear?.yearId

  const snapshot = useAcademicsSnapshot(schoolId, academicYearId)
  const { data: financeSummary, isLoading: financeLoading, isError: financeError, refetch: financeRefetch } =
    useFinanceSummary(schoolId)
  const trend = useHomeAttendanceTrend(schoolId, !!schoolId)

  // Alerts (deferred until snapshot + finance load)
  const coreLoaded = !snapshot.isLoading
  const { alerts, isLoading: alertsLoading } = useHomeAlerts(
    schoolId,
    academicYearId,
    financeSummary
      ? { overdue: financeSummary.overdue, collectionRate: financeSummary.collectionRate }
      : undefined,
    snapshot.todayAttendanceRate,
    trend.summary?.avg ?? null,
    coreLoaded,
  )

  // Bottom row data
  const sectionAttendance = useSectionAttendanceItems(schoolId, academicYearId)
  const activityFeed = useRecentActivityItems(financeSummary, financeLoading)

  // ── Sync to store for Header ────────────────────────────────────────────
  useEffect(() => {
    setActiveAcademicYear(academicYear ?? null)
  }, [academicYear, setActiveAcademicYear])

  // ── KPI band (calm by default; attention only via state) ────────────────
  const rate = snapshot.todayAttendanceRate
  const attendanceState: StatBandState =
    rate == null ? 'normal' : rate >= 90 ? 'good' : rate >= 75 ? 'warn' : 'critical'

  const metrics: StatMetric[] = [
    {
      label: t('homeV2.kpi.studentsEnrolled'),
      value: snapshot.totalEnrolled != null ? snapshot.totalEnrolled.toLocaleString() : '—',
      iconSignature: 'students',
      state: 'normal',
      primary: true,
      sub: t('homeV2.kpi.thisAcademicYear'),
    },
    {
      label: t('homeV2.kpi.activeSections'),
      value: snapshot.activeSections != null ? String(snapshot.activeSections) : '—',
      iconSignature: 'sections',
      state: 'normal',
      sub: t('homeV2.kpi.activeClasses'),
    },
    rate != null
      ? {
          label: t('homeV2.kpi.todaysAttendance'),
          value: `${rate.toFixed(1)}%`,
          iconSignature: 'metric_attendance',
          state: attendanceState,
          meter: { pct: rate, target: ATTENDANCE_THRESHOLD },
          sub: trend.summary ? t('homeV2.kpi.dayAvg', { avg: trend.summary.avg.toFixed(0) }) : undefined,
        }
      : {
          label: t('homeV2.kpi.todaysAttendance'),
          value: '—',
          iconSignature: 'metric_attendance',
          state: 'normal',
        },
    financeSummary && financeSummary.overdue > 0
      ? {
          label: t('homeV2.kpi.outstandingFees'),
          value: formatShort(financeSummary.outstanding),
          iconSignature: 'fees',
          state: 'warn',
          pill: { tone: 'warn', text: t('homeV2.kpi.overdue', { amount: formatShort(financeSummary.overdue) }) },
          sub: t('homeV2.kpi.collected', { rate: financeSummary.collectionRate.toFixed(1) }),
        }
      : {
          label: t('homeV2.kpi.outstandingFees'),
          value: financeSummary ? formatShort(financeSummary.outstanding) : '—',
          iconSignature: 'fees',
          state: 'normal',
          sub: financeSummary
            ? t('homeV2.kpi.collected', { rate: financeSummary.collectionRate.toFixed(1) })
            : undefined,
        },
  ]

  // ── ⑧ Attention Corner signals (replaces the AlertLane stack). Home has no
  // page header row (the greeting lives in the shell topbar), so the corner
  // mounts as its own slim row: pill left, shade in flow below. Signals map
  // straight from useHomeAlerts and auto-resolve when the data heals.
  const { acked, ack, unack } = useSignalAcks()
  const signals: Signal[] = alerts.map((a: HomeAlert) => ({
    id: a.id,
    severity: a.severity === 'critical' ? 'critical' : 'warn',
    domain:
      a.module === 'finance'
        ? t('homeV2.headerZone.domains.finance')
        : t('homeV2.headerZone.domains.attendance'),
    title: a.title,
    description: a.description,
    fix: {
      label: a.module === 'finance' ? t('homeV2.alerts.reviewBilling') : t('homeV2.alerts.viewStudents'),
      onAction: () => navigate({ to: a.href as never }),
    },
  }))

  // ── Guard ───────────────────────────────────────────────────────────────
  if (!schoolId) {
    // Fresh tenant with no schools — show the getting-started guide
    if (availableSchools.length === 0 && gettingStarted.show) {
      return (
        <motion.div
          className="flex flex-col gap-4 px-7 py-5 min-h-full bg-[rgb(var(--background-primary))]"
          variants={staggerContainer}
          initial={prefersReducedMotion ? undefined : 'hidden'}
          animate="visible"
        >
          <motion.div variants={sectionVariants} transition={{ duration: 0.2 }}>
            <GettingStartedGuide
              items={gettingStarted.items}
              completedCount={gettingStarted.completedCount}
              totalCount={gettingStarted.totalCount}
              onDismiss={gettingStarted.dismiss}
            />
          </motion.div>
        </motion.div>
      )
    }
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-[rgb(var(--text-tertiary))]">
          {t('homeV2.selectSchool')}
        </p>
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col gap-4 px-7 py-5 min-h-full bg-[rgb(var(--background-primary))]"
      variants={staggerContainer}
      initial={prefersReducedMotion ? undefined : 'hidden'}
      animate="visible"
    >
      {/* Ticket 4.2: Offline banner */}
      {!isOnline && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-[rgb(var(--state-warning-bg))] border border-[rgb(var(--state-warning-border))] text-[rgb(var(--state-warning-fg))]"
          role="status"
          aria-live="polite"
        >
          <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{t('homeV2.offline')}</span>
        </div>
      )}

      {/* SECTION 0: Getting Started Guide (for new tenants) */}
      {gettingStarted.show && (
        <motion.div variants={sectionVariants} transition={{ duration: 0.2 }}>
          <GettingStartedGuide
            items={gettingStarted.items}
            completedCount={gettingStarted.completedCount}
            totalCount={gettingStarted.totalCount}
            onDismiss={gettingStarted.dismiss}
          />
        </motion.div>
      )}

      {/* SECTION 1: ⑧ Attention Corner (severity-segmented pill → in-flow shade) */}
      <SectionErrorBoundary fallbackMessage={t('homeV2.alerts.unableToLoad')}>
        {!alertsLoading && (
          <motion.div variants={sectionVariants} transition={{ duration: 0.2 }}>
            <AttentionCorner
              signals={signals}
              acked={acked}
              onAck={ack}
              onUnack={unack}
              labels={{
                needAttention: t('homeV2.headerZone.needAttention'),
                allClear: t('homeV2.headerZone.allClear'),
                region: t('homeV2.alerts.region'),
                minimize: t('homeV2.headerZone.minimize'),
                acknowledge: t('homeV2.headerZone.acknowledge'),
                acknowledged: t('homeV2.headerZone.acknowledged'),
                acknowledgedHint: t('homeV2.headerZone.acknowledgedHint'),
                dismiss: t('homeV2.headerZone.dismiss'),
                emptyTitle: t('homeV2.headerZone.emptyTitle'),
              }}
            >
              <div className="flex items-center">
                <AttentionCornerPill data-testid="attention-pill" />
              </div>
              <AttentionCornerShade className="pt-3" />
            </AttentionCorner>
          </motion.div>
        )}
      </SectionErrorBoundary>

      {/* SECTION 2: StatBand — school snapshot KPIs */}
      <SectionErrorBoundary fallbackMessage={t('homeV2.errors.unableToLoadKpi')}>
        <motion.div variants={sectionVariants} transition={{ duration: 0.2 }}>
          <StatBand metrics={metrics} ariaLabel={t('homeV2.kpi.region')} />
        </motion.div>
      </SectionErrorBoundary>

      {/* SECTION 3: ⑤ WidgetCard grid — insights + details */}
      <SectionErrorBoundary fallbackMessage={t('homeV2.errors.unableToLoadInsights')}>
        <motion.div variants={sectionVariants} transition={{ duration: 0.2 }}>
          <WidgetGrid>
            <WidgetCard
              title={t('homeV2.trend.attendanceTrend')}
              iconSignature="attendance"
              subtitle={t('homeV2.trend.rollingAverage')}
              span={8}
              footer={<AttendanceTrendFooter />}
            >
              <AttendanceTrendCard
                chartData={trend.chartData}
                summary={trend.summary}
                isLoading={trend.isLoading}
                bare
              />
            </WidgetCard>

            <WidgetCard
              title={t('homeV2.finance.financialOverview')}
              iconSignature="fees"
              span={4}
              metric={
                financeSummary && !financeLoading && !financeError
                  ? t('homeV2.kpi.collected', { rate: financeSummary.collectionRate.toFixed(1) })
                  : undefined
              }
              footer={<FinanceSummaryFooter />}
            >
              <FinanceSummaryCard
                totalInvoiced={financeSummary?.totalInvoiced ?? 0}
                totalCollected={financeSummary?.totalCollected ?? 0}
                outstanding={financeSummary?.outstanding ?? 0}
                overdue={financeSummary?.overdue ?? 0}
                collectionRate={financeSummary?.collectionRate ?? 0}
                byFeeType={financeSummary?.byFeeType}
                isLoading={financeLoading}
                isError={financeError}
                onRetry={() => financeRefetch()}
                bare
              />
            </WidgetCard>

            <WidgetCard
              title={t('homeV2.attendance.classroomAttendance')}
              iconSignature="sections"
              span={8}
              metric={
                snapshot.todayAttendanceRate != null
                  ? `${snapshot.todayAttendanceRate.toFixed(1)}% today`
                  : undefined
              }
            >
              <AttendanceBySectionCard
                sections={sectionAttendance.sections}
                todayRate={snapshot.todayAttendanceRate}
                isLoading={sectionAttendance.isLoading}
                academicYearId={academicYearId}
                bare
              />
            </WidgetCard>

            <WidgetCard
              title={t('homeV2.activity.recentActivity')}
              iconSignature="overview"
              span={4}
              link={{ label: t('homeV2.activity.viewAll'), href: '/finance/billing' }}
            >
              <RecentActivityFeed items={activityFeed.items} isLoading={activityFeed.isLoading} bare />
            </WidgetCard>
          </WidgetGrid>
        </motion.div>
      </SectionErrorBoundary>
    </motion.div>
  )
}
