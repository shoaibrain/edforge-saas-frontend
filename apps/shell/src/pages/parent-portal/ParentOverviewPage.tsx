/**
 * Parent Portal — Home / Overview Page (v2)
 *
 * Editorial home page with intelligent, humanized data presentation.
 *
 * Architecture:
 *   - All hooks called at the top before any conditional return (React rules)
 *   - Derived insights via portal-shared/insights.ts produce humanized
 *     greetings, stat subtitles, and contextual empty states
 *   - Each section gets its own WidgetErrorBoundaryV2 so one failing section
 *     doesn't break the whole page
 *   - Icons and colored chips on stat cards match the editorial palette
 *
 * Data flow:
 *   useParentChildren → activeChild → studentId
 *   usePortalStudentGrades, usePortalAttendanceSummary, useStudentSections,
 *   useStudentClasswork, useInvoices → all in parallel via TanStack Query
 *
 * Inline apiGet migration: removes the inline apiGet calls from v1.
 */

import { GraduationCap, CalendarCheck2, FileText, Wallet } from 'lucide-react'
import { WidgetErrorBoundaryV2 } from '@edforge/ui'
import { StatStrip, type StatStripItem } from '@edforge/ui'
import { useAppStore } from '../../stores/app.store'
import { useAuthStore } from '../../stores/auth.store'
import { useShell } from '../../lib/shell-context'
import { useParentPortal } from './ParentPortalLayout'
import { usePortalStudentGrades } from '../../hooks/usePortalStudentGrades'
import { usePortalAttendanceSummary } from '../../hooks/usePortalStudentAttendance'
import { useStudentSections } from '../../hooks/useStudentSections'
import { usePortalBellSchedule } from '../../hooks/usePortalBellSchedule'
import { usePortalClassPeriods } from '../../hooks/usePortalClassPeriods'
import { useStudentClasswork } from '../../hooks/useStudentClasswork'
import { useInvoices } from '../../hooks/usePayments'
import { NoActiveChild } from '../portal-shared/NoActiveChild'
import { HeroGreeting } from '../portal-shared/HeroGreeting'
import { TodayTimeline } from '../portal-shared/TodayTimeline'
import { AssignmentList } from '../portal-shared/AssignmentList'
import { BillingCallout } from './sections/BillingCallout'
import {
  timeOfDayGreeting,
  isWeekend,
  deriveGpaInsight,
  deriveAttendanceInsight,
  deriveAssignmentsInsight,
  deriveBalanceInsight,
  deriveHeroNarrative,
  todayEmptyMessage,
  assignmentsEmptyMessage,
} from '../portal-shared/insights'

// ============================================================================
// COMPONENT
// ============================================================================

export default function ParentOverviewPage() {
  const { activeChild } = useParentPortal()
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const { activeSchoolYear } = useShell()
  const user = useAuthStore((s) => s.user)
  const parentFirstName = user?.displayName?.split(' ')[0]
    ?? (user as { firstName?: string } | null)?.firstName
    ?? 'there'

  // Derive params with optional chaining — hooks below have enabled guards
  const studentId = activeChild?.studentId ?? ''
  const schoolId = activeSchoolId ?? activeChild?.schoolId ?? ''
  const academicYearId = activeSchoolYear?.id

  // ---- ALL hooks called BEFORE any conditional return (React hooks rules) ----
  const { data: grades, isLoading: gradesLoading, isError: gradesError, refetch: refetchGrades } =
    usePortalStudentGrades(studentId, schoolId, { academicYearId })
  const { data: attendance, isLoading: attendanceLoading, isError: attendanceError, refetch: refetchAttendance } =
    usePortalAttendanceSummary(studentId, schoolId, { academicYearId })
  const { data: sections, isLoading: sectionsLoading } =
    useStudentSections(studentId, schoolId, { academicYearId })
  const { data: bellSchedules, isLoading: bellLoading } =
    usePortalBellSchedule(schoolId)
  const { data: classPeriods, isLoading: periodsLoading } =
    usePortalClassPeriods(schoolId)
  const sectionIds = sections?.map((s) => s.sectionId) ?? []
  const { data: classwork, isLoading: classworkLoading } =
    useStudentClasswork(sectionIds)
  const { data: invoices, isLoading: invoicesLoading } =
    useInvoices(schoolId, { studentId })

  // Guard: no child selected (parent has multiple children but none active)
  if (!activeChild) return <NoActiveChild />

  // ---- Derive humanized insights from raw data ----
  const childName = activeChild.firstName
  const courseCount = sections?.length ?? 0
  const gradedCount = grades?.grades?.filter((g) => g.letterGrade != null).length ?? 0
  const allInvoices = invoices?.items ?? []
  const isWeekendDay = isWeekend()

  const gpaInsight = deriveGpaInsight(
    grades?.gpa?.cumulativeGpa,
    gradedCount,
    courseCount
  )
  const attendanceInsight = deriveAttendanceInsight(
    attendance?.attendanceRate,
    attendance?.absentDays,
    attendance?.totalDays
  )
  const assignmentsInsight = deriveAssignmentsInsight(classwork)
  const balanceInsight = deriveBalanceInsight(allInvoices)

  const heroNarrative = deriveHeroNarrative({
    childName,
    attendanceRate: attendance?.attendanceRate,
    absentDays: attendance?.absentDays,
    courseCount,
    hasAssignmentsDue: assignmentsInsight.display !== '0',
    isWeekendDay,
  })

  // ---- Build stat strip items with icons, colored chips, contextual subtitles ----
  const statItems: StatStripItem[] = [
    {
      label: 'GPA · Term 1',
      value: gpaInsight.display,
      subtitle: gpaInsight.subtitle,
      icon: <GraduationCap size={18} />,
      iconBgColor: 'rgb(var(--state-info-bg))',  // soft indigo
      iconColor: 'rgb(var(--state-info-fg))',
      loading: gradesLoading,
      error: gradesError,
      onRetry: () => refetchGrades(),
    },
    {
      label: 'Attendance',
      value: attendanceInsight.display,
      subtitle: attendanceInsight.subtitle,
      icon: <CalendarCheck2 size={18} />,
      iconBgColor: 'rgb(var(--state-success-bg))',  // soft sage
      iconColor: 'rgb(var(--state-success-fg))',
      loading: attendanceLoading,
      error: attendanceError,
      onRetry: () => refetchAttendance(),
    },
    {
      label: 'Assignments due',
      value: assignmentsInsight.display,
      subtitle: assignmentsInsight.subtitle,
      icon: <FileText size={18} />,
      iconBgColor: 'rgb(var(--state-warning-bg))',     // soft butter
      iconColor: 'rgb(var(--state-warning-fg))',
      loading: classworkLoading || sectionsLoading,
    },
    {
      label: 'Balance due',
      value: balanceInsight.display,
      subtitle: balanceInsight.subtitle,
      icon: <Wallet size={18} />,
      iconBgColor: 'rgb(var(--state-danger-bg))',   // soft terracotta
      iconColor: 'rgb(var(--state-danger-fg))',
      loading: invoicesLoading,
    },
  ]

  const todayLoading = sectionsLoading || bellLoading || periodsLoading

  return (
    <div className="px-7 py-8 space-y-10 max-w-5xl mx-auto">
      {/* Hero — eyebrow + serif greeting + italic narrative.
           Greeting addresses the parent, narrative is about the child. */}
      <WidgetErrorBoundaryV2>
        <HeroGreeting
          name={parentFirstName}
          eyebrow={timeOfDayGreeting()}
          contextLineEmphasis={heroNarrative}
          contextLine={
            courseCount > 0
              ? `${courseCount} ${courseCount === 1 ? 'course' : 'courses'} this term${
                  attendance?.attendanceRate != null
                    ? ` · ${Math.round(attendance.attendanceRate)}% attendance`
                    : ''
                }.`
              : undefined
          }
          loading={gradesLoading && attendanceLoading && sectionsLoading}
          staggerIndex={0}
        />
      </WidgetErrorBoundaryV2>

      {/* Stat strip — 4 tiles with icons, values, and contextual subtitles */}
      <WidgetErrorBoundaryV2>
        <div className="animate-fade-in stagger-2">
          <StatStrip items={statItems} />
        </div>
      </WidgetErrorBoundaryV2>

      {/* Today timeline — schedule for today with humanized empty state */}
      <WidgetErrorBoundaryV2>
        <TodayTimeline
          sections={sections}
          bellSchedules={bellSchedules}
          classPeriods={classPeriods}
          loading={todayLoading}
          heading={`Today for ${childName}`}
          emptyMessage={todayEmptyMessage(childName)}
          staggerIndex={2}
        />
      </WidgetErrorBoundaryV2>

      {/* This week's assignments — list of due items, humanized empty state */}
      <WidgetErrorBoundaryV2>
        <AssignmentList
          items={classwork}
          loading={classworkLoading}
          emptyMessage={assignmentsEmptyMessage()}
          staggerIndex={3}
          viewAllHref="/parent-portal/grades"
        />
      </WidgetErrorBoundaryV2>

      {/* Billing callout — sage gradient when current, terracotta when overdue */}
      <WidgetErrorBoundaryV2>
        <BillingCallout
          invoices={allInvoices}
          loading={invoicesLoading}
          staggerIndex={4}
        />
      </WidgetErrorBoundaryV2>
    </div>
  )
}
