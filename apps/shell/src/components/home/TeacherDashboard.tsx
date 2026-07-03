/**
 * TeacherDashboard — dashboard recipe
 *
 * Teacher/educator Home on the canonical surfaces: StatBand (KPIs) → WidgetCard
 * grid (My sections + section attendance). No teacher-scoped signal source yet,
 * so the ⑧ AttentionCorner is omitted. Greeting lives in the shell topbar. All
 * live hooks + section error boundaries + reduced-motion stagger are preserved.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  StatBand,
  type StatMetric,
  type StatBandState,
  WidgetGrid,
  WidgetCard,
} from '@edforge/ui'
import { MySectionsCard } from './MySectionsCard'
import { AttendanceBySectionCard } from './AttendanceBySectionCard'
import { SectionErrorBoundary } from './SectionErrorBoundary'
import {
  useHomeAcademicYear,
  useHomeTeacherSections,
  useSectionAttendanceItems,
  ATTENDANCE_THRESHOLD,
} from '../../hooks/useHomeData'
import { useTranslation } from '@edforge/i18n'

// ============================================================================
// ANIMATION VARIANTS — same pattern as AdminCommandCenter
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

interface TeacherDashboardProps {
  schoolId: string | null
}

export function TeacherDashboard({ schoolId }: TeacherDashboardProps) {
  const { data: academicYear } = useHomeAcademicYear(schoolId)
  const { t } = useTranslation('dashboard')
  const academicYearId = academicYear?.yearId

  const { sections, isLoading } = useHomeTeacherSections(schoolId, academicYearId)

  // Ticket 3.4: section attendance data for teacher's sections
  const sectionAttendance = useSectionAttendanceItems(schoolId, academicYearId)

  // Ticket 3.3: compute KPI values
  const totalStudents = useMemo(
    () => sections.reduce((sum, s) => sum + s.currentEnrollment, 0),
    [sections],
  )

  // Compute today's attendance rate for teacher's sections from section attendance data
  const todayAttendanceRate = useMemo(() => {
    const items = sectionAttendance.sections
    if (items.length === 0) return null
    const totalStudentCount = items.reduce((s, i) => s + (i.studentCount ?? 0), 0)
    const totalRecorded = items.reduce((s, i) => s + (i.recordedCount ?? 0), 0)
    if (totalStudentCount === 0) return null
    return (totalRecorded / totalStudentCount) * 100
  }, [sectionAttendance.sections])

  const attendanceState: StatBandState =
    todayAttendanceRate == null
      ? 'normal'
      : todayAttendanceRate >= 90
        ? 'good'
        : todayAttendanceRate >= 75
          ? 'warn'
          : 'critical'

  const metrics: StatMetric[] = [
    {
      label: t('homeV2.teacher.mySections'),
      value: isLoading ? '—' : String(sections.length),
      iconSignature: 'sections',
      state: 'normal',
      primary: true,
      sub: t('homeV2.teacher.assignedClasses'),
    },
    {
      label: t('homeV2.teacher.totalStudents'),
      value: isLoading ? '—' : totalStudents.toLocaleString(),
      iconSignature: 'students',
      state: 'normal',
      sub: t('homeV2.teacher.acrossAllSections'),
    },
    todayAttendanceRate != null
      ? {
          label: t('homeV2.kpi.todaysAttendance'),
          value: `${todayAttendanceRate.toFixed(1)}%`,
          iconSignature: 'metric_attendance',
          state: attendanceState,
          meter: { pct: todayAttendanceRate, target: ATTENDANCE_THRESHOLD },
          sub: t('homeV2.teacher.completionRate'),
        }
      : {
          label: t('homeV2.kpi.todaysAttendance'),
          value: '—',
          iconSignature: 'metric_attendance',
          state: 'normal',
          sub: t('homeV2.teacher.completionRate'),
        },
  ]

  if (!schoolId) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-[rgb(var(--text-tertiary))]">
          {t('homeV2.selectSchoolTeacher')}
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
      {/* SECTION 1: StatBand — teacher KPIs */}
      <SectionErrorBoundary fallbackMessage={t('homeV2.errors.unableToLoadKpi')}>
        <motion.div variants={sectionVariants} transition={{ duration: 0.2 }}>
          <StatBand metrics={metrics} ariaLabel={t('homeV2.kpi.region')} />
        </motion.div>
      </SectionErrorBoundary>

      {/* SECTION 2: ⑤ WidgetCard grid — my sections + section attendance */}
      <SectionErrorBoundary fallbackMessage={t('homeV2.errors.unableToLoadSections')}>
        <motion.div variants={sectionVariants} transition={{ duration: 0.2 }}>
          <WidgetGrid>
            <WidgetCard
              title={t('homeV2.teacher.mySections')}
              iconSignature="sections"
              subtitle={t('homeV2.teacher.assignedClasses')}
              span={6}
              link={{ label: t('homeV2.teacher.viewAll'), href: '/academics/classrooms' }}
            >
              <MySectionsCard sections={sections} isLoading={isLoading} bare />
            </WidgetCard>

            <WidgetCard
              title={t('homeV2.attendance.classroomAttendance')}
              iconSignature="metric_attendance"
              span={6}
              metric={
                todayAttendanceRate != null ? `${todayAttendanceRate.toFixed(1)}% today` : undefined
              }
            >
              <AttendanceBySectionCard
                sections={sectionAttendance.sections}
                todayRate={todayAttendanceRate}
                isLoading={sectionAttendance.isLoading}
                academicYearId={academicYearId}
                bare
              />
            </WidgetCard>
          </WidgetGrid>
        </motion.div>
      </SectionErrorBoundary>
    </motion.div>
  )
}
