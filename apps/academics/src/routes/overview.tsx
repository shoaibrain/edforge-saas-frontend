/**
 * Academics Overview Page
 *
 * Data-driven command center for the Academics module.
 * Fetches live KPIs, enrollment distribution, attendance trend,
 * academic alerts, and calendar context from existing APIs.
 */

import { useMemo, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  GraduationCap,
  Users,
  ClipboardCheck,
  ContactRound,
  School,
  CalendarClock,
  LayoutGrid,
} from 'lucide-react'
import { Card } from '@edforge/ui'
import {
  ModuleOverviewPage,
  type ModuleStat,
} from '../components/ModuleOverviewPage'
import { useActiveSchoolId } from '../stores/app.store'
import { useCurrentAcademicYear } from '../hooks/useSchool'
import {
  useAcademicsOverview,
  useActiveTeacherCount,
  useEnrollmentDistribution,
  useCombinedAlerts,
  useAcademicCalendarContext,
  overviewKeys,
} from '../hooks/useAcademicsOverview'
import { useWidgetVisible } from '../stores/overview-widgets.store'

// Widgets
import { WidgetErrorBoundary } from '../components/overview/WidgetErrorBoundary'
import { EmptyOverviewState } from '../components/overview/EmptyOverviewState'
import { EnrollmentDistributionChart } from '../components/overview/EnrollmentDistributionChart'
import { AttendanceTrendWidget } from '../components/overview/AttendanceTrendWidget'
import { ActivityFeedWidget } from '../components/overview/ActivityFeedWidget'
import { AcademicYearLabel } from '../components/overview/AcademicCalendarBar'

// ============================================================================
// GUARD: No School Selected
// ============================================================================

function NoSchoolGuard() {
  return (
    <div className="max-w-6xl mx-auto pt-16 pb-12">
      <Card className="p-8 border-border-secondary max-w-lg mx-auto text-center">
        <div className="inline-flex p-3 rounded-2xl bg-teal-500/10 mb-4">
          <School className="w-7 h-7 text-teal-600 dark:text-cyan-400" />
        </div>
        <h2 className="text-lg font-bold text-text-primary">
          Select a school
        </h2>
        <p className="text-sm text-text-secondary mt-1.5">
          Choose a school from the sidebar to view the academics overview.
        </p>
      </Card>
    </div>
  )
}

// ============================================================================
// GUARD: No Academic Year
// ============================================================================

function NoAcademicYearGuard() {
  return (
    <div className="max-w-6xl mx-auto pt-16 pb-12">
      <Card className="p-8 border-border-secondary max-w-lg mx-auto text-center">
        <div className="inline-flex p-3 rounded-2xl bg-amber-400/15 mb-4">
          <CalendarClock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-lg font-bold text-text-primary">
          No active academic year
        </h2>
        <p className="text-sm text-text-secondary mt-1.5 max-w-sm mx-auto">
          Set up and activate an academic year in your school calendar to see
          overview data.
        </p>
      </Card>
    </div>
  )
}

// ============================================================================
// MAIN OVERVIEW COMPONENT
// ============================================================================

export function Overview() {
  const schoolId = useActiveSchoolId()

  // Guard: No school selected
  if (!schoolId) return <NoSchoolGuard />

  return <OverviewContent schoolId={schoolId} />
}

function OverviewContent({ schoolId }: { schoolId: string }) {
  const queryClient = useQueryClient()

  // Academic year context
  const {
    data: currentYear,
    isLoading: yearLoading,
    isError: yearError,
  } = useCurrentAcademicYear(schoolId)

  const academicYearId = currentYear?.yearId

  // Guard: No academic year (after loading completes)
  if (!yearLoading && !currentYear && !yearError) {
    return <NoAcademicYearGuard />
  }

  // ---- Core KPI data ----
  const overviewData = useAcademicsOverview(schoolId, academicYearId)
  const teacherData = useActiveTeacherCount(schoolId)

  // ---- Enrollment chart data ----
  const enrollmentDistribution = useEnrollmentDistribution(
    overviewData.enrollmentByGradeLevel
  )

  // ---- Alerts ----
  const alertsData = useCombinedAlerts(schoolId, academicYearId)

  // ---- Calendar context ----
  const calendarContext = useAcademicCalendarContext(schoolId, academicYearId)

  // ---- Widget visibility ----
  const showActivityAlerts = useWidgetVisible('activity-alerts')

  // ---- Last updated ----
  const lastUpdated = useMemo(() => {
    if (overviewData.isLoading) return null
    return new Date()
  }, [overviewData.isLoading])

  // ---- Refresh handler ----
  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: overviewKeys.all })
  }, [queryClient])

  // ---- Empty state check ----
  const isEmpty =
    !overviewData.isLoading &&
    !teacherData.isLoading &&
    (overviewData.totalEnrolled ?? 0) === 0 &&
    (overviewData.activeSections ?? 0) === 0 &&
    (teacherData.teacherCount ?? 0) === 0

  // ---- Build stats array ----
  const stats: ModuleStat[] = [
    {
      label: 'Total Enrolled',
      value:
        overviewData.totalEnrolled != null
          ? overviewData.totalEnrolled.toLocaleString()
          : '—',
      change: 'this academic year',
      changeType: 'neutral',
      icon: Users,
      iconBg: 'bg-teal-500/15 dark:bg-cyan-500/20',
      iconColor: 'text-teal-600 dark:text-cyan-400',
      loading: overviewData.isLoading,
    },
    {
      label: 'Active Sections',
      value:
        overviewData.activeSections != null
          ? overviewData.activeSections.toString()
          : '—',
      change: 'active classes',
      changeType: 'neutral',
      icon: LayoutGrid,
      iconBg: 'bg-aqua-400/20',
      iconColor: 'text-aqua-700 dark:text-aqua-400',
      loading: overviewData.isLoading,
    },
    {
      label: 'Active Teachers',
      value:
        teacherData.teacherCount != null
          ? teacherData.teacherCount.toString()
          : '—',
      change:
        teacherData.onLeaveCount && teacherData.onLeaveCount > 0
          ? `${teacherData.onLeaveCount} on leave`
          : undefined,
      changeType: teacherData.onLeaveCount && teacherData.onLeaveCount > 0 ? 'negative' : 'neutral',
      icon: ContactRound,
      iconBg: 'bg-blue-400/20',
      iconColor: 'text-blue-700 dark:text-blue-400',
      loading: teacherData.isLoading,
    },
    {
      label: "Today's Attendance",
      value:
        overviewData.todayAttendanceRate != null
          ? `${overviewData.todayAttendanceRate.toFixed(1)}%`
          : '—',
      change: 'today',
      changeType: 'neutral',
      icon: ClipboardCheck,
      iconBg: 'bg-amber-400/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      loading: overviewData.isLoading,
    },
  ]

  // ---- Show empty onboarding if no data ----
  if (isEmpty) {
    return (
      <ModuleOverviewPage
        moduleId="academics"
        title="Academics"
        description="Manage students, classes, curriculum, and grades"
        icon={GraduationCap}
        stats={[]}
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
      >
        <EmptyOverviewState />
      </ModuleOverviewPage>
    )
  }

  return (
    <ModuleOverviewPage
      moduleId="academics"
      title="Academics"
      description="Manage students, classes, curriculum, and grades"
      icon={GraduationCap}
      stats={stats}
      lastUpdated={lastUpdated}
      onRefresh={handleRefresh}
      calendarLabel={<AcademicYearLabel context={calendarContext} />}
    >
      {/* Charts grid — left: enrollment, right: attendance + alerts stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WidgetErrorBoundary name="Enrollment Chart">
          <EnrollmentDistributionChart
            data={enrollmentDistribution.data}
            total={enrollmentDistribution.total}
            loading={overviewData.isLoading}
          />
        </WidgetErrorBoundary>

        <div className="flex flex-col gap-6">
          <WidgetErrorBoundary name="Attendance Trend">
            <AttendanceTrendWidget
              schoolId={schoolId}
              enabled={!!schoolId}
            />
          </WidgetErrorBoundary>
          {showActivityAlerts && (
            <WidgetErrorBoundary name="Activity Feed">
              <ActivityFeedWidget
                alerts={alertsData.alerts}
                totalCount={alertsData.totalCount}
                loading={alertsData.isLoading}
              />
            </WidgetErrorBoundary>
          )}
        </div>
      </div>
    </ModuleOverviewPage>
  )
}
