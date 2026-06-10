/**
 * TeacherDashboard — V2
 *
 * Home page layout for teachers/educators, migrated to V2 design system.
 *
 * Sprint 3 enhancements:
 * - 3.1: V2 layout wrapper with motion container + reduced-motion check
 * - 3.3: KPI tiles (My Sections, Total Students, Today's Attendance)
 * - 3.4: Section attendance detail using AttendanceBySectionCard
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Users, ClipboardCheck } from 'lucide-react'
import { HomeStatCard } from './HomeStatCard'
import { MySectionsCard } from './MySectionsCard'
import { AttendanceBySectionCard } from './AttendanceBySectionCard'
import { SectionErrorBoundary } from './SectionErrorBoundary'
import {
  useHomeAcademicYear,
  useHomeTeacherSections,
  useSectionAttendanceItems,
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

  const { sections, isLoading } = useHomeTeacherSections(
    schoolId,
    academicYearId,
  )

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
      {/* ================================================================ */}
      {/* SECTION 1: KPI Tiles (Ticket 3.3) */}
      {/* ================================================================ */}
      <SectionErrorBoundary fallbackMessage={t('homeV2.errors.unableToLoadKpi')}>
        <motion.div
          variants={sectionVariants}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          <HomeStatCard
            label={t('homeV2.teacher.mySections')}
            value={isLoading ? '—' : sections.length.toString()}
            icon={CalendarDays}
            accentColor="rgb(var(--accent-academics) / 0.12)"
            iconColor="#378ADD"
            barColor="#378ADD"
            hint={t('homeV2.teacher.assignedClasses')}
            loading={isLoading}
          />
          <HomeStatCard
            label={t('homeV2.teacher.totalStudents')}
            value={isLoading ? '—' : totalStudents.toLocaleString()}
            icon={Users}
            accentColor="rgb(var(--accent-enrollment) / 0.12)"
            iconColor="#1D9E75"
            barColor="#1D9E75"
            hint={t('homeV2.teacher.acrossAllSections')}
            loading={isLoading}
          />
          <HomeStatCard
            label={t('homeV2.kpi.todaysAttendance')}
            value={
              todayAttendanceRate != null
                ? `${todayAttendanceRate.toFixed(1)}%`
                : '—'
            }
            icon={ClipboardCheck}
            accentColor="rgb(var(--accent-attendance) / 0.12)"
            iconColor="#EF9F27"
            barColor="#EF9F27"
            hint={t('homeV2.teacher.completionRate')}
            loading={sectionAttendance.isLoading}
          />
        </motion.div>
      </SectionErrorBoundary>

      {/* ================================================================ */}
      {/* SECTION 2: My Sections (Ticket 3.2 — card uses V2 tokens) */}
      {/* ================================================================ */}
      <SectionErrorBoundary fallbackMessage={t('homeV2.errors.unableToLoadSections')}>
        <motion.div variants={sectionVariants} transition={{ duration: 0.2 }}>
          <MySectionsCard sections={sections} isLoading={isLoading} />
        </motion.div>
      </SectionErrorBoundary>

      {/* ================================================================ */}
      {/* SECTION 3: Section Attendance Detail (Ticket 3.4) */}
      {/* ================================================================ */}
      <SectionErrorBoundary fallbackMessage={t('homeV2.errors.unableToLoadAttendance')}>
        <motion.div variants={sectionVariants} transition={{ duration: 0.2 }}>
          <AttendanceBySectionCard
            sections={sectionAttendance.sections}
            todayRate={todayAttendanceRate}
            isLoading={sectionAttendance.isLoading}
            academicYearId={academicYearId}
          />
        </motion.div>
      </SectionErrorBoundary>
    </motion.div>
  )
}
