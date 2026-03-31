/**
 * AdminCommandCenter — V2
 *
 * Home page layout for school administrators.
 * Surfaces real-time school data: alerts, KPIs, attendance trend,
 * financial overview, quick actions, section attendance, and activity feed.
 *
 * Layout: alerts → KPI grid (4-col) → mid row (1.6fr 1fr) → bottom row (1fr 1fr 1.3fr)
 */

import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  LayoutGrid,
  ClipboardCheck,
  Receipt,
} from 'lucide-react'
import { useCurrency } from '@edforge/types/use-currency'
import { useSettings, useShell } from '../../lib/shell-context'
import { useGettingStarted } from '../../hooks/useGettingStarted'
import { GettingStartedGuide } from './GettingStartedGuide'
import { HomeStatCard } from './HomeStatCard'
import { AlertsRow } from './AlertsRow'
import { AttendanceTrendCard } from './AttendanceTrendCard'
import { FinanceSummaryCard } from './FinanceSummaryCard'
import { QuickActionsGridV2 } from './QuickActionsGridV2'
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
  ATTENDANCE_THRESHOLD,
} from '../../hooks/useHomeData'
import { useHomeStore } from '../../stores/home.store'

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const sectionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const staggerContainer = {
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
}

// ============================================================================
// COMPONENT
// ============================================================================

interface AdminCommandCenterProps {
  schoolId: string | null
}

export function AdminCommandCenter({ schoolId }: AdminCommandCenterProps) {
  const settings = useSettings()
  const { availableSchools } = useShell()
  const { formatShort } = useCurrency(settings)
  const setAlertCount = useHomeStore((s) => s.setAlertCount)
  const setActiveAcademicYear = useHomeStore((s) => s.setActiveAcademicYear)
  const gettingStarted = useGettingStarted()

  // ── Data fetching (parallel) ────────────────────────────────────────────
  const { data: academicYear } = useHomeAcademicYear(schoolId)
  const academicYearId = academicYear?.yearId

  const snapshot = useAcademicsSnapshot(schoolId, academicYearId)
  const { data: financeSummary, isLoading: financeLoading, isError: financeError, refetch: financeRefetch } =
    useFinanceSummary(schoolId)
  const trend = useHomeAttendanceTrend(schoolId, !!schoolId)

  // Alerts (deferred until snapshot + finance load)
  const coreLoaded = !snapshot.isLoading
  const { alerts, alertCount, isLoading: alertsLoading } = useHomeAlerts(
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
    setAlertCount(alertCount)
  }, [alertCount, setAlertCount])

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
        text: `+${(rate - ATTENDANCE_THRESHOLD).toFixed(0)}% above target`,
        color: '#1D9E75',
        bg: 'var(--v2-accent-enrollment)',
      }
    }
    if (rate >= 70) {
      return {
        text: 'Below threshold',
        color: '#EF9F27',
        bg: 'var(--v2-accent-attendance)',
      }
    }
    return {
      text: 'Critical',
      color: '#E24B4A',
      bg: 'var(--v2-accent-finance)',
    }
  }, [snapshot.todayAttendanceRate])

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
          initial="hidden"
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
          Select a school from the sidebar to view the dashboard.
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
      initial="hidden"
      animate="visible"
    >
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
      <SectionErrorBoundary fallbackMessage="Unable to load alerts">
        {(alertsLoading || alerts.length > 0) && (
          <motion.div variants={sectionVariants} transition={{ duration: 0.2 }}>
            <AlertsRow alerts={alerts} loading={alertsLoading} />
          </motion.div>
        )}
      </SectionErrorBoundary>

      {/* ================================================================ */}
      {/* SECTION 2: School Snapshot — 4 KPI Tiles */}
      {/* ================================================================ */}
      <SectionErrorBoundary fallbackMessage="Unable to load KPI data">
        <motion.div
          variants={sectionVariants}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4"
          style={{ gap: 'var(--v2-grid-gap, 12px)' }}
        >
          <HomeStatCard
            label="Students enrolled"
            value={
              snapshot.totalEnrolled != null
                ? snapshot.totalEnrolled.toLocaleString()
                : '—'
            }
            icon={Users}
            accentColor="var(--v2-accent-enrollment)"
            iconColor="#1D9E75"
            barColor="#1D9E75"
            hint="this academic year"
            loading={snapshot.isLoading}
            error={snapshot.isError}
            onRetry={() => snapshot.refetch()}
          />
          <HomeStatCard
            label="Active sections"
            value={
              snapshot.activeSections != null
                ? snapshot.activeSections.toString()
                : '—'
            }
            icon={LayoutGrid}
            accentColor="var(--v2-accent-academics)"
            iconColor="#378ADD"
            barColor="#378ADD"
            hint="active classes"
            loading={snapshot.isLoading}
            error={snapshot.isError}
            onRetry={() => snapshot.refetch()}
          />
          <HomeStatCard
            label="Today's attendance"
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
            hint={trend.summary ? `30-day avg ${trend.summary.avg.toFixed(0)}%` : undefined}
            loading={snapshot.isLoading}
            error={snapshot.isError}
            onRetry={() => snapshot.refetch()}
            valueColor={attendanceValueColor}
          />
          <HomeStatCard
            label="Outstanding fees"
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
                    text: `${formatShort(financeSummary.overdue)} overdue`,
                    color: '#E24B4A',
                    bg: 'var(--v2-accent-finance)',
                  }
                : undefined
            }
            hint={
              financeSummary
                ? `${financeSummary.collectionRate.toFixed(1)}% collected`
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
      <SectionErrorBoundary fallbackMessage="Unable to load insights">
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
      {/* SECTION 4: Bottom Row (1fr 1fr 1.3fr) */}
      {/* ================================================================ */}
      <SectionErrorBoundary fallbackMessage="Unable to load details">
        <motion.div
          variants={sectionVariants}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1.3fr]"
          style={{ gap: 'var(--v2-grid-gap, 12px)' }}
        >
          <QuickActionsGridV2 />
          <AttendanceBySectionCard
            sections={sectionAttendance.sections}
            todayRate={snapshot.todayAttendanceRate}
            isLoading={sectionAttendance.isLoading}
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
