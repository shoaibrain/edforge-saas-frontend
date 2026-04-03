/**
 * AdminCommandCenter — V2
 *
 * Home page layout for school administrators.
 * Surfaces real-time school data: alerts, KPIs, attendance trend,
 * financial overview, quick actions, section attendance, and activity feed.
 *
 * Layout: alerts → KPI grid (4-col) → mid row (1.6fr 1fr) → bottom row (1.6fr 1fr)
 *
 * Sprint 4 enhancements:
 * - 4.2: Offline banner + Refresh All action
 * - 4.4: Day-change detection for stale date queries
 * - 4.7: prefers-reduced-motion support
 */

import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  LayoutGrid,
  ClipboardCheck,
  Receipt,
  WifiOff,
} from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import { useCurrency } from '@edforge/types/use-currency'
import { useSettings, useShell } from '../../lib/shell-context'
import { useGettingStarted } from '../../hooks/useGettingStarted'
import { GettingStartedGuide } from './GettingStartedGuide'
import { HomeStatCard } from './HomeStatCard'
import { AlertsRow } from './AlertsRow'
import { AttendanceTrendCard } from './AttendanceTrendCard'
import { FinanceSummaryCard } from './FinanceSummaryCard'
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

  // ── KPI derived values ──────────────────────────────────────────────────
  const attendanceValueColor = useMemo(() => {
    const rate = snapshot.todayAttendanceRate
    if (rate == null) return undefined
    if (rate >= 90) return '#1D9E75'
    if (rate >= 75) return '#EF9F27'
    return '#E24B4A'
  }, [snapshot.todayAttendanceRate])

  const attendanceTag = useMemo(() => {
    const rate = snapshot.todayAttendanceRate
    if (rate == null) return undefined
    if (rate >= ATTENDANCE_THRESHOLD) {
      return {
        text: t('homeV2.kpi.aboveTarget', { diff: (rate - ATTENDANCE_THRESHOLD).toFixed(0) }),
        color: '#1D9E75',
        bg: 'var(--v2-accent-enrollment)',
      }
    }
    if (rate >= 70) {
      return {
        text: t('homeV2.kpi.belowThreshold'),
        color: '#EF9F27',
        bg: 'var(--v2-accent-attendance)',
      }
    }
    return {
      text: t('homeV2.kpi.critical'),
      color: '#E24B4A',
      bg: 'var(--v2-accent-finance)',
    }
  }, [snapshot.todayAttendanceRate, t])

  // ── Guard ───────────────────────────────────────────────────────────────
  if (!schoolId) {
    // Fresh tenant with no schools — show the getting-started guide
    if (availableSchools.length === 0 && gettingStarted.show) {
      return (
        <motion.div
          data-page="home-v2"
          className="flex flex-col"
          style={{
            gap: 'var(--v2-section-gap, 16px)',
            padding: 'var(--v2-content-padding-y, 20px) var(--v2-content-padding-x, 28px)',
            background: 'var(--v2-bg-app)',
            minHeight: '100%',
          }}
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
        <p className="text-sm" style={{ color: 'var(--v2-text-hint)' }}>
          {t('homeV2.selectSchool')}
        </p>
      </div>
    )
  }

  return (
    <motion.div
      data-page="home-v2"
      className="flex flex-col"
      style={{
        gap: 'var(--v2-section-gap, 16px)',
        padding: 'var(--v2-content-padding-y, 20px) var(--v2-content-padding-x, 28px)',
        background: 'var(--v2-bg-app)',
        minHeight: '100%',
      }}
      variants={staggerContainer}
      initial={prefersReducedMotion ? undefined : 'hidden'}
      animate="visible"
    >
      {/* ================================================================ */}
      {/* Ticket 4.2: Offline banner + Refresh All action */}
      {/* ================================================================ */}
      {!isOnline && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          role="status"
          aria-live="polite"
          style={{
            background: 'var(--v2-warning-bg)',
            border: '1px solid var(--v2-warning-border)',
            color: 'var(--v2-warning)',
          }}
        >
          <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{t('homeV2.offline')}</span>
        </div>
      )}

      {/* ================================================================ */}
      {/* SECTION 0: Getting Started Guide (for new tenants) */}
      {/* ================================================================ */}
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

      {/* ================================================================ */}
      {/* SECTION 1: Critical Alerts (conditional) */}
      {/* ================================================================ */}
      <SectionErrorBoundary fallbackMessage={t('homeV2.alerts.unableToLoad')}>
        {(alertsLoading || alerts.length > 0) && (
          <motion.div variants={sectionVariants} transition={{ duration: 0.2 }}>
            <AlertsRow alerts={alerts} loading={alertsLoading} />
          </motion.div>
        )}
      </SectionErrorBoundary>

      {/* ================================================================ */}
      {/* SECTION 2: School Snapshot — 4 KPI Tiles */}
      {/* ================================================================ */}
      <SectionErrorBoundary fallbackMessage={t('homeV2.errors.unableToLoadKpi')}>
        <motion.div
          variants={sectionVariants}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4"
          style={{ gap: 'var(--v2-grid-gap, 12px)' }}
        >
          <HomeStatCard
            label={t('homeV2.kpi.studentsEnrolled')}
            value={
              snapshot.totalEnrolled != null
                ? snapshot.totalEnrolled.toLocaleString()
                : '—'
            }
            icon={Users}
            accentColor="var(--v2-accent-enrollment)"
            iconColor="#1D9E75"
            barColor="#1D9E75"
            hint={t('homeV2.kpi.thisAcademicYear')}
            loading={snapshot.isLoading}
            error={snapshot.isError}
            onRetry={() => snapshot.refetch()}
          />
          <HomeStatCard
            label={t('homeV2.kpi.activeSections')}
            value={
              snapshot.activeSections != null
                ? snapshot.activeSections.toString()
                : '—'
            }
            icon={LayoutGrid}
            accentColor="var(--v2-accent-academics)"
            iconColor="#378ADD"
            barColor="#378ADD"
            hint={t('homeV2.kpi.activeClasses')}
            loading={snapshot.isLoading}
            error={snapshot.isError}
            onRetry={() => snapshot.refetch()}
          />
          <HomeStatCard
            label={t('homeV2.kpi.todaysAttendance')}
            value={
              snapshot.todayAttendanceRate != null
                ? `${snapshot.todayAttendanceRate.toFixed(1)}%`
                : '—'
            }
            icon={ClipboardCheck}
            accentColor="var(--v2-accent-attendance)"
            iconColor="#EF9F27"
            barColor="#EF9F27"
            tag={attendanceTag}
            hint={trend.summary ? t('homeV2.kpi.dayAvg', { avg: trend.summary.avg.toFixed(0) }) : undefined}
            loading={snapshot.isLoading}
            error={snapshot.isError}
            onRetry={() => snapshot.refetch()}
            valueColor={attendanceValueColor}
          />
          <HomeStatCard
            label={t('homeV2.kpi.outstandingFees')}
            value={
              financeSummary
                ? formatShort(financeSummary.outstanding)
                : '—'
            }
            icon={Receipt}
            accentColor="var(--v2-accent-finance)"
            iconColor="#E24B4A"
            barColor="#E24B4A"
            tag={
              financeSummary && financeSummary.overdue > 0
                ? {
                    text: t('homeV2.kpi.overdue', { amount: formatShort(financeSummary.overdue) }),
                    color: '#E24B4A',
                    bg: 'var(--v2-accent-finance)',
                  }
                : undefined
            }
            hint={
              financeSummary
                ? t('homeV2.kpi.collected', { rate: financeSummary.collectionRate.toFixed(1) })
                : undefined
            }
            loading={financeLoading}
            error={financeError}
            onRetry={() => financeRefetch()}
          />
        </motion.div>
      </SectionErrorBoundary>

      {/* ================================================================ */}
      {/* SECTION 3: Insights — Mid Row (1.6fr 1fr) */}
      {/* ================================================================ */}
      <SectionErrorBoundary fallbackMessage={t('homeV2.errors.unableToLoadInsights')}>
        <motion.div
          variants={sectionVariants}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr]"
          style={{ gap: 'var(--v2-grid-gap, 12px)' }}
        >
          <AttendanceTrendCard
            chartData={trend.chartData}
            summary={trend.summary}
            isLoading={trend.isLoading}
          />
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
          />
        </motion.div>
      </SectionErrorBoundary>

      {/* ================================================================ */}
      {/* SECTION 4: Bottom Row (1.6fr 1fr) — Classroom attendance + Activity */}
      {/* ================================================================ */}
      <SectionErrorBoundary fallbackMessage={t('homeV2.errors.unableToLoadDetails')}>
        <motion.div
          variants={sectionVariants}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr]"
          style={{ gap: 'var(--v2-grid-gap, 12px)' }}
        >
          <AttendanceBySectionCard
            sections={sectionAttendance.sections}
            todayRate={snapshot.todayAttendanceRate}
            isLoading={sectionAttendance.isLoading}
            academicYearId={academicYearId}
          />
          <RecentActivityFeed
            items={activityFeed.items}
            isLoading={activityFeed.isLoading}
          />
        </motion.div>
      </SectionErrorBoundary>
    </motion.div>
  )
}
