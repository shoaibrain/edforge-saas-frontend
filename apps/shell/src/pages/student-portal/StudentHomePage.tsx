/**
 * Student Portal — Home Page (v2)
 *
 * Content pane: hero greeting → stat strip → today timeline →
 * this week assignments. Shares section components with Parent Home.
 *
 * Enabled by scope exception §1.0 (router.tsx line 631-632 change).
 * New page — no inline apiGet calls to migrate.
 */

import { useTranslation } from '@edforge/i18n'
import { WidgetErrorBoundaryV2 } from '@edforge/ui'
import { StatStrip, type StatStripItem } from '@edforge/ui'
import { useAppStore } from '../../stores/app.store'
import { useShell } from '../../lib/shell-context'
import { useStudentPortal } from './StudentPortalLayout'
import { usePortalStudentGrades } from '../../hooks/usePortalStudentGrades'
import { usePortalAttendanceSummary } from '../../hooks/usePortalStudentAttendance'
import { useStudentSections } from '../../hooks/useStudentSections'
import { usePortalBellSchedule } from '../../hooks/usePortalBellSchedule'
import { usePortalClassPeriods } from '../../hooks/usePortalClassPeriods'
import { useStudentClasswork } from '../../hooks/useStudentClasswork'
import { HeroGreeting } from '../portal-shared/HeroGreeting'
import { TodayTimeline } from '../portal-shared/TodayTimeline'
import { AssignmentList } from '../portal-shared/AssignmentList'

// ============================================================================
// COMPONENT
// ============================================================================

export default function StudentHomePage() {
  const { studentId, studentProfile } = useStudentPortal()
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const { activeSchoolYear } = useShell()

  const schoolId = activeSchoolId ?? studentProfile.schoolId

  return (
    <div className="px-7 py-8 space-y-10 max-w-5xl mx-auto" data-v2>
      <WidgetErrorBoundaryV2>
        <HeroSection
          name={studentProfile.firstName}
          studentId={studentId}
          schoolId={schoolId}
          academicYearId={activeSchoolYear?.id}
        />
      </WidgetErrorBoundaryV2>

      <WidgetErrorBoundaryV2>
        <StatStripSection
          studentId={studentId}
          schoolId={schoolId}
          academicYearId={activeSchoolYear?.id}
        />
      </WidgetErrorBoundaryV2>

      <WidgetErrorBoundaryV2>
        <TodaySection
          studentId={studentId}
          schoolId={schoolId}
          academicYearId={activeSchoolYear?.id}
        />
      </WidgetErrorBoundaryV2>

      <WidgetErrorBoundaryV2>
        <AssignmentsSection
          studentId={studentId}
          schoolId={schoolId}
        />
      </WidgetErrorBoundaryV2>
    </div>
  )
}

// ============================================================================
// SECTION COMPONENTS
// ============================================================================

function HeroSection({
  name,
  studentId,
  schoolId,
  academicYearId,
}: {
  name: string
  studentId: string
  schoolId: string
  academicYearId?: string
}) {
  const { data: grades } = usePortalStudentGrades(studentId, schoolId, { academicYearId })
  const { data: attendance } = usePortalAttendanceSummary(studentId, schoolId, { academicYearId })

  let contextLine: string | undefined
  if (grades && attendance) {
    const courseCount = grades.grades?.length ?? 0
    const rate = attendance.attendanceRate
    if (courseCount > 0 && rate != null) {
      contextLine = rate >= 90
        ? 'A steady start to the term.'
        : 'Keeping things moving.'
    }
  }

  return <HeroGreeting name={name} contextLine={contextLine} staggerIndex={0} />
}

function StatStripSection({
  studentId,
  schoolId,
  academicYearId,
}: {
  studentId: string
  schoolId: string
  academicYearId?: string
}) {
  const { t } = useTranslation('portal')
  const { data: grades, isLoading: gradesLoading, isError: gradesError, refetch: refetchGrades } =
    usePortalStudentGrades(studentId, schoolId, { academicYearId })
  const { data: attendance, isLoading: attendanceLoading, isError: attendanceError, refetch: refetchAttendance } =
    usePortalAttendanceSummary(studentId, schoolId, { academicYearId })
  const { data: sections, isLoading: sectionsLoading } =
    useStudentSections(studentId, schoolId, { academicYearId })
  const sectionIds = sections?.map((s) => s.sectionId) ?? []
  const { data: classwork, isLoading: classworkLoading } =
    useStudentClasswork(sectionIds)

  const openAssignments = classwork?.filter((item) => {
    if (!item.dueDate) return false
    return new Date(item.dueDate) >= new Date()
  }).length ?? 0

  const items: StatStripItem[] = [
    {
      label: t('stats.gpa'),
      value: grades?.gpa?.cumulativeGpa != null
        ? grades.gpa.cumulativeGpa.toFixed(2)
        : '—',
      subtitle: '/ 4.00',
      loading: gradesLoading,
      error: gradesError,
      onRetry: () => refetchGrades(),
    },
    {
      label: t('stats.attendanceRate'),
      value: attendance?.attendanceRate != null
        ? `${Math.round(attendance.attendanceRate)}%`
        : '—',
      loading: attendanceLoading,
      error: attendanceError,
      onRetry: () => refetchAttendance(),
    },
    {
      label: t('stats.activeCourses'),
      value: sections ? String(sections.length) : '—',
      loading: sectionsLoading,
    },
    {
      label: t('stats.openAssignments'),
      value: String(openAssignments),
      loading: classworkLoading || sectionsLoading,
    },
  ]

  return (
    <div className="animate-fade-in stagger-2">
      <StatStrip items={items} />
    </div>
  )
}

function TodaySection({
  studentId,
  schoolId,
  academicYearId,
}: {
  studentId: string
  schoolId: string
  academicYearId?: string
}) {
  const { t } = useTranslation('portal')
  const { data: sections, isLoading: sectionsLoading } =
    useStudentSections(studentId, schoolId, { academicYearId })
  const { data: bellSchedules, isLoading: bellLoading } =
    usePortalBellSchedule(schoolId)
  const { data: classPeriods, isLoading: periodsLoading } =
    usePortalClassPeriods(schoolId)

  return (
    <TodayTimeline
      sections={sections}
      bellSchedules={bellSchedules}
      classPeriods={classPeriods}
      loading={sectionsLoading || bellLoading || periodsLoading}
      heading={t('schedule.today')}
      staggerIndex={2}
    />
  )
}

function AssignmentsSection({
  studentId,
  schoolId,
}: {
  studentId: string
  schoolId: string
}) {
  const { data: sections } = useStudentSections(studentId, schoolId)
  const sectionIds = sections?.map((s) => s.sectionId) ?? []
  const { data: classwork, isLoading } = useStudentClasswork(sectionIds)

  return (
    <AssignmentList
      items={classwork}
      loading={isLoading}
      staggerIndex={3}
      viewAllHref="/student-portal/grades"
    />
  )
}
