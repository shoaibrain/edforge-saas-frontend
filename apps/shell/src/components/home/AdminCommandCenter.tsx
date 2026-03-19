/**
 * AdminCommandCenter
 *
 * Home page layout for school administrators (Principal, VicePrincipal, Accountant, Staff).
 * Surfaces real-time school data: alerts, KPIs, attendance trends, and financial summary.
 */

import { useMemo } from 'react'
import {
  Users,
  LayoutGrid,
  ClipboardCheck,
  Receipt,

  Bell,
} from 'lucide-react'
import { formatNPRShort } from '@edforge/types'
import { WidgetSection } from '../dynamic-page/WidgetSection'
import { QuickActionsWidget } from '../dynamic-page/widgets/QuickActionsWidget'
import { HomeStatCard } from './HomeStatCard'
import { AlertsRow } from './AlertsRow'
import { AttendanceTrendCard } from './AttendanceTrendCard'
import { FinanceSummaryCard } from './FinanceSummaryCard'
import {
  useHomeAcademicYear,
  useAcademicsSnapshot,
  useHomeAlerts,
  useHomeAttendanceTrend,
  useFinanceSummary,
} from '../../hooks/useHomeData'
import type { QuickAction } from '../dynamic-page/widgets/QuickActionsWidget'

// ============================================================================
// EXPANDED ADMIN QUICK ACTIONS (6 items)
// ============================================================================

const ADMIN_HOME_ACTIONS: QuickAction[] = [
  {
    id: 'add-student',
    label: 'Add Student',
    description: 'Enroll new student',
    icon: Users,
    href: '/academics/students',
    color: {
      bg: 'bg-teal-50 dark:bg-teal-900/10',
      text: 'text-teal-600 dark:text-teal-400',
      border: 'border-teal-200 dark:border-teal-800/30',
    },
  },
  {
    id: 'record-attendance',
    label: 'Attendance',
    description: 'Mark daily attendance',
    icon: ClipboardCheck,
    href: '/academics/classrooms?tab=attendance',
    color: {
      bg: 'bg-orange-50 dark:bg-orange-900/10',
      text: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-800/30',
    },
  },
  {
    id: 'generate-invoice',
    label: 'Generate Invoice',
    description: 'Bill students',
    icon: Receipt,
    href: '/finance/billing/invoices',
    color: {
      bg: 'bg-amber-50 dark:bg-amber-900/10',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800/30',
    },
  },
  {
    id: 'view-academics',
    label: 'Academics',
    description: 'View overview',
    icon: LayoutGrid,
    href: '/academics',
    color: {
      bg: 'bg-blue-50 dark:bg-blue-900/10',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800/30',
    },
  },
  {
    id: 'manage-staff',
    label: 'Manage Staff',
    description: 'People & HR',
    icon: Users,
    href: '/people/staff',
    color: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/10',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-800/30',
    },
  },
  {
    id: 'school-settings',
    label: 'Settings',
    description: 'School configuration',
    icon: LayoutGrid,
    href: '/settings',
    color: {
      bg: 'bg-gray-50 dark:bg-gray-900/10',
      text: 'text-gray-600 dark:text-gray-400',
      border: 'border-gray-200 dark:border-gray-800/30',
    },
  },
]

// ============================================================================
// COMPONENT
// ============================================================================

interface AdminCommandCenterProps {
  schoolId: string | null
}

export function AdminCommandCenter({ schoolId }: AdminCommandCenterProps) {
  // Fetch academic year first (needed by other queries)
  const { data: academicYear } = useHomeAcademicYear(schoolId)
  const academicYearId = academicYear?.yearId

  // Core KPI data
  const snapshot = useAcademicsSnapshot(schoolId, academicYearId)

  // Finance summary
  const { data: financeSummary, isLoading: financeLoading, isError: financeError } =
    useFinanceSummary(schoolId)

  // Alerts (deferred until snapshot loads)
  const coreLoaded = !snapshot.isLoading
  const { alerts, isLoading: alertsLoading } = useHomeAlerts(
    schoolId,
    academicYearId,
    financeSummary?.overdue,
    coreLoaded,
  )

  // Attendance trend (parallel with snapshot)
  const trend = useHomeAttendanceTrend(schoolId, !!schoolId)

  // Attendance color coding
  const attendanceColor = useMemo(() => {
    const rate = snapshot.todayAttendanceRate
    if (rate == null) return undefined
    if (rate >= 90) return 'text-green-600 dark:text-green-400'
    if (rate >= 75) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }, [snapshot.todayAttendanceRate])

  if (!schoolId) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-[rgb(var(--text-tertiary))]">
          Select a school from the sidebar to view the dashboard.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* ================================================================ */}
      {/* SECTION 1: Critical Alerts (conditional) */}
      {/* ================================================================ */}
      {(alertsLoading || alerts.length > 0) && (
        <WidgetSection
          widgetId="home-alerts"
          label="Alerts"
          icon={Bell}
        >
          <AlertsRow alerts={alerts} loading={alertsLoading} />
        </WidgetSection>
      )}

      {/* ================================================================ */}
      {/* SECTION 2: School Snapshot — 4 Stat Tiles */}
      {/* ================================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <HomeStatCard
          label="Total Enrolled"
          value={
            snapshot.totalEnrolled != null
              ? snapshot.totalEnrolled.toLocaleString()
              : '—'
          }
          subtitle="this academic year"
          icon={Users}
          iconBg="bg-teal-500/15 dark:bg-cyan-500/20"
          iconColor="text-teal-600 dark:text-cyan-400"
          loading={snapshot.isLoading}
          error={snapshot.isError}
          onRetry={() => snapshot.refetch()}
        />
        <HomeStatCard
          label="Active Sections"
          value={
            snapshot.activeSections != null
              ? snapshot.activeSections.toString()
              : '—'
          }
          subtitle="active classes"
          icon={LayoutGrid}
          iconBg="bg-blue-400/20"
          iconColor="text-blue-700 dark:text-blue-400"
          loading={snapshot.isLoading}
          error={snapshot.isError}
          onRetry={() => snapshot.refetch()}
        />
        <HomeStatCard
          label="Today's Attendance"
          value={
            snapshot.todayAttendanceRate != null
              ? `${snapshot.todayAttendanceRate.toFixed(1)}%`
              : '—'
          }
          subtitle="today"
          icon={ClipboardCheck}
          iconBg="bg-amber-400/20"
          iconColor="text-amber-600 dark:text-amber-400"
          loading={snapshot.isLoading}
          error={snapshot.isError}
          onRetry={() => snapshot.refetch()}
          valueColor={attendanceColor}
        />
        <HomeStatCard
          label="Outstanding Fees"
          value={
            financeSummary
              ? formatNPRShort(financeSummary.outstanding)
              : '—'
          }
          subtitle={
            financeSummary && financeSummary.overdue > 0
              ? `${formatNPRShort(financeSummary.overdue)} overdue`
              : undefined
          }
          icon={Receipt}
          iconBg="bg-rose-400/20"
          iconColor="text-rose-600 dark:text-rose-400"
          loading={financeLoading}
          error={financeError}
        />
      </div>

      {/* ================================================================ */}
      {/* SECTION 3: Insights — 2-column grid */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceTrendCard
          chartData={trend.chartData}
          summary={trend.summary}
          isLoading={trend.isLoading}
        />
        <FinanceSummaryCard
          totalCollected={financeSummary?.totalCollected ?? 0}
          outstanding={financeSummary?.outstanding ?? 0}
          collectionRate={financeSummary?.collectionRate ?? 0}
          isLoading={financeLoading}
          isError={financeError}
        />
      </div>

      {/* ================================================================ */}
      {/* SECTION 4: Quick Actions — 6 items */}
      {/* ================================================================ */}
      <QuickActionsWidget actions={ADMIN_HOME_ACTIONS} columns={4} />
    </div>
  )
}
