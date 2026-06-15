/**
 * Curriculum Management Module — V2
 *
 * Unified curriculum interface for the Academics domain.
 * - Courses tab: Live data from API with V2 chips, filters, table, and drawer
 * - Grade Levels tab: Collapsible grade sections with enrollment bars
 * - Standards tab: Purposeful empty state with import CTA
 *
 * V2 redesign — matches Academics Overview header pattern.
 */

import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useResourcePermissions } from '@edforge/abac'
import { StatCard, ContextBar, ContextBarSep, ContextBarYear } from '@edforge/ui'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Layers,
  Plus,
  ShieldCheck,
} from 'lucide-react'
import { useActiveSchoolId } from '../../stores/app.store'
import { useCurrentAcademicYear } from '../../hooks/useSchool'
import { useAcademicsOverview } from '../../hooks/useAcademicsOverview'
import { useCourseFilters } from '../../stores/courses.store'
import {
  useCourses,
  flattenCoursePages,
  getCourseTotalFromPages,
  useUpdateCourse,
} from '../../hooks/useCourses'
import { CourseTable } from '../../components/curriculum/CourseTable'
import { CourseFilters } from '../../components/curriculum/CourseFilters'
import { CourseDrawer, type DrawerMode } from '../../components/curriculum/CourseDrawer'
import { GradeLevelsTab } from '../../components/curriculum/GradeLevelsTab'
import type { CourseResponseDto } from '@aibrains/shared-types'

// ============================================================================
// TYPES
// ============================================================================

type CurriculumTab = 'courses' | 'grade-levels' | 'standards'

// ============================================================================
// TAB SVG ICONS (inline to match prototype exactly)
// ============================================================================

function CoursesIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M2 2h12v12H2z"
        stroke={active ? 'rgb(var(--accent-reports))' : 'currentColor'}
        strokeWidth="1.4"
        fill="none"
      />
      <path
        d="M5 6h6M5 9h4"
        stroke={active ? 'rgb(var(--accent-reports))' : 'currentColor'}
        strokeWidth="1.4"
      />
    </svg>
  )
}

function GradeLevelsIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M2 4h4v4H2zM10 4h4v4h-4zM6 8h4v4H6zM2 12h4M10 12h4"
        stroke={active ? 'rgb(var(--accent-reports))' : 'currentColor'}
        strokeWidth="1.3"
        fill="none"
      />
    </svg>
  )
}

function StandardsIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle
        cx="8"
        cy="8"
        r="6.5"
        stroke={active ? 'rgb(var(--accent-reports))' : 'currentColor'}
        strokeWidth="1.4"
        fill="none"
      />
      <path
        d="M5 8l2 2 4-3"
        stroke={active ? 'rgb(var(--accent-reports))' : 'currentColor'}
        strokeWidth="1.4"
        fill="none"
      />
    </svg>
  )
}

// ============================================================================
// STANDARDS EMPTY STATE (V2)
// ============================================================================

function StandardsContent() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 340,
        textAlign: 'center',
      }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center rounded-xl mb-3 bg-[rgb(var(--accent-reports)/0.15)]"
        style={{ width: 48, height: 48 }}
      >
        <ShieldCheck className="w-6 h-6 text-[rgb(var(--accent-reports-text))]" />
      </div>

      {/* Heading */}
      <h3 className="text-sm font-medium text-[rgb(var(--text-primary))] mb-1.5">
        Standards alignment
      </h3>

      {/* Body */}
      <p className="text-xs text-[rgb(var(--text-disabled))] max-w-80 leading-normal mb-4">
        Map courses to academic standards to track curriculum coverage and EdFi
        compliance. Standards can be configured per course.
      </p>
    </div>
  )
}

// ============================================================================
// CURRICULUM MODULE
// ============================================================================

export function CurriculumModule() {
  const [activeTab, setActiveTab] = useState<CurriculumTab>('courses')
  const navigate = useNavigate()
  const schoolId = useActiveSchoolId()

  // Current academic year + per-grade enrollment counts (reuses unified dashboard
  // query — cached & deduped with the Overview / Students pages).
  const { data: currentYear, isLoading: yearLoading } = useCurrentAcademicYear(
    schoolId ?? ''
  )
  const overview = useAcademicsOverview(schoolId, currentYear?.yearId)

  // ABAC: check course/curriculum permissions
  const coursePerms = useResourcePermissions('courses')
  const filters = useCourseFilters()

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('create')
  const [selectedCourse, setSelectedCourse] = useState<CourseResponseDto | null>(null)

  // Update course mutation (for toggle active)
  const updateMutation = useUpdateCourse()

  // Build the filters object for the API query
  const queryFilters = useMemo(() => {
    const f: Record<string, unknown> = {}
    if (filters.subjectArea) f.subjectArea = filters.subjectArea
    if (filters.courseType) f.courseType = filters.courseType
    if (filters.creditType) f.creditType = filters.creditType
    if (filters.isActive !== null) f.isActive = filters.isActive
    if (filters.searchTerm) f.searchTerm = filters.searchTerm
    return f
  }, [filters])

  // Fetch courses
  const { data: coursesData, isLoading } = useCourses({
    schoolId: schoolId || '',
    filters: queryFilters,
    enabled: !!schoolId,
  })

  const courses = flattenCoursePages(coursesData)
  const totalCount = getCourseTotalFromPages(coursesData)

  // Computed stats
  const stats = useMemo(() => {
    const total = totalCount ?? courses.length
    const active = courses.filter((c) => c.isActive).length
    const elective = courses.filter((c) => c.courseType === 'elective').length
    const subjects = new Set(courses.map((c) => c.subjectArea)).size
    const specializedTypes = new Set(
      courses
        .filter((c) =>
          ['honors', 'ap', 'dual_enrollment'].includes(c.courseType)
        )
        .map((c) => c.courseType)
    ).size
    const electiveName =
      elective === 1
        ? courses.find((c) => c.courseType === 'elective')?.courseName
        : undefined
    return { total, active, elective, subjects, specializedTypes, electiveName }
  }, [courses, totalCount])

  // Drawer handlers
  const openCreateDrawer = () => {
    setSelectedCourse(null)
    setDrawerMode('create')
    setDrawerOpen(true)
  }

  const openViewDrawer = (course: CourseResponseDto) => {
    setSelectedCourse(course)
    setDrawerMode('view')
    setDrawerOpen(true)
  }

  const openEditDrawer = (course: CourseResponseDto) => {
    setSelectedCourse(course)
    setDrawerMode('edit')
    setDrawerOpen(true)
  }

  const handleToggleActive = async (course: CourseResponseDto) => {
    try {
      await updateMutation.mutateAsync({
        courseId: course.courseId,
        schoolId: schoolId || course.schoolId,
        data: { isActive: !course.isActive } as any,
      })
    } catch {
      // Error toast handled in mutation hook
    }
  }

  const navigateToCourse = (course: CourseResponseDto) => {
    navigate({ to: `/curriculum/${course.courseId}` })
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setSelectedCourse(null)
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="min-h-full px-5 py-4">
      {/* ---- Context Bar (operating context, not a page title) ---- */}
      <ContextBar
        className="mb-4"
        meta={
          <>
            {currentYear?.name ? (
              <ContextBarYear>{currentYear.name}</ContextBarYear>
            ) : null}
            {currentYear?.name ? <ContextBarSep /> : null}
            <span>{today}</span>
          </>
        }
        description={
          <p className="text-xs text-[rgb(var(--text-tertiary))] leading-relaxed">
            <span className="font-medium text-[rgb(var(--accent-academics-text))]">
              {stats.total}
            </span>{' '}
            courses across{' '}
            <span className="font-medium text-[rgb(var(--accent-academics-text))]">
              {stats.subjects}
            </span>{' '}
            subject areas · {stats.elective} elective ·{' '}
            <span className="font-medium text-[rgb(var(--accent-academics-text))]">
              {stats.specializedTypes}
            </span>{' '}
            specialized course types (Honors, AP, Dual Enrollment)
          </p>
        }
        actions={
          coursePerms.create ? (
            <button
              type="button"
              onClick={openCreateDrawer}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-[9px] transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-enrollment)/0.4)] cursor-pointer bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))]"
            >
              <Plus className="w-3.5 h-3.5" />
              Add course
            </button>
          ) : undefined
        }
      />

      {/* ---- KPI Tiles ---- */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-3.5">
        <StatCard
          label="Total Courses"
          value={String(stats.total)}
          icon={BookOpen}
          accentColor="rgb(var(--accent-reports)/0.1)"
          iconColor="rgb(var(--accent-reports))"
          barColor="rgb(var(--accent-reports))"
          tag={{
            text: `${stats.active} active`,
            color: 'rgb(var(--accent-enrollment))',
            bg: 'rgb(var(--accent-enrollment)/0.1)',
          }}
          loading={isLoading}
        />
        <StatCard
          label="Subject Areas"
          value={String(stats.subjects)}
          icon={Layers}
          accentColor="rgb(var(--accent-academics)/0.1)"
          iconColor="rgb(var(--accent-academics))"
          barColor="rgb(var(--accent-academics))"
          hint="Math · Science · ELA · SS · Arts · Voc."
          loading={isLoading}
        />
        <StatCard
          label="Electives"
          value={String(stats.elective)}
          icon={BookOpen}
          accentColor="rgb(var(--accent-coral)/0.1)"
          iconColor="rgb(var(--accent-coral))"
          barColor="rgb(var(--accent-coral))"
          tag={
            stats.electiveName
              ? {
                  text: stats.electiveName,
                  color: 'rgb(var(--accent-reports))',
                  bg: 'rgb(var(--accent-reports)/0.1)',
                }
              : undefined
          }
          loading={isLoading}
        />
        <StatCard
          label="Specialized Types"
          value={String(stats.specializedTypes)}
          icon={BookOpen}
          accentColor="rgb(var(--accent-attendance)/0.1)"
          iconColor="rgb(var(--accent-attendance))"
          barColor="rgb(var(--accent-attendance))"
          tag={{
            text: 'Honors · AP · Dual Enroll.',
            color: 'rgb(var(--accent-attendance))',
            bg: 'rgb(var(--accent-attendance)/0.1)',
          }}
          loading={isLoading}
        />
      </div>

      {/* ---- Tab Bar ---- */}
      <div className="flex items-center gap-0 mb-3.5 border-b border-[rgb(var(--border-primary)/0.35)]">
        {/* Courses tab */}
        <button
          type="button"
          onClick={() => setActiveTab('courses')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm cursor-pointer bg-transparent border-b-2 -mb-px ${
            activeTab === 'courses'
              ? 'font-semibold text-[rgb(var(--accent-reports-text))] border-[rgb(var(--accent-reports))]'
              : 'font-medium text-[rgb(var(--text-tertiary))] border-transparent hover:text-[rgb(var(--text-secondary))]'
          }`}
        >
          <CoursesIcon active={activeTab === 'courses'} />
          Courses
          <span
            className={`text-2xs font-semibold py-0.5 px-1.5 rounded-md ${
              activeTab === 'courses'
                ? 'bg-[rgb(var(--accent-reports)/0.12)] text-[rgb(var(--accent-reports-text))]'
                : 'bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]'
            }`}
          >
            {stats.total}
          </span>
        </button>

        {/* Grade Levels tab */}
        <button
          type="button"
          onClick={() => setActiveTab('grade-levels')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm cursor-pointer bg-transparent border-b-2 -mb-px ${
            activeTab === 'grade-levels'
              ? 'font-semibold text-[rgb(var(--accent-reports-text))] border-[rgb(var(--accent-reports))]'
              : 'font-medium text-[rgb(var(--text-tertiary))] border-transparent hover:text-[rgb(var(--text-secondary))]'
          }`}
        >
          <GradeLevelsIcon active={activeTab === 'grade-levels'} />
          Grade levels
        </button>

        {/* Standards tab */}
        <button
          type="button"
          onClick={() => setActiveTab('standards')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm cursor-pointer bg-transparent border-b-2 -mb-px ${
            activeTab === 'standards'
              ? 'font-semibold text-[rgb(var(--accent-reports-text))] border-[rgb(var(--accent-reports))]'
              : 'font-medium text-[rgb(var(--text-tertiary))] border-transparent hover:text-[rgb(var(--text-secondary))]'
          }`}
        >
          <StandardsIcon active={activeTab === 'standards'} />
          Standards
        </button>
      </div>

      {/* ---- Tab Content ---- */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {activeTab === 'courses' && (
            <div>
              {/* Filter strip */}
              <CourseFilters totalCount={totalCount} />

              {/* Course Table */}
              <div className="mt-3">
                <CourseTable
                
                  courses={courses}
                  isLoading={isLoading}
                  onAddCourse={coursePerms.create ? openCreateDrawer : undefined}
                  onViewCourse={openViewDrawer}
                  onEditCourse={coursePerms.edit ? openEditDrawer : undefined}
                  onToggleActive={coursePerms.edit ? handleToggleActive : undefined}
                  onNavigateToCourse={navigateToCourse}
                />
              </div>
            </div>
          )}

          {activeTab === 'grade-levels' && (
            <GradeLevelsTab
              courses={courses}
              isLoading={isLoading}
              onViewCourse={openViewDrawer}
              schoolId={schoolId}
              enrollmentByGradeLevel={overview.enrollmentByGradeLevel}
              enrollmentLoading={yearLoading || overview.isLoading}
              hasCurrentAY={!!currentYear?.yearId}
            />
          )}

          {activeTab === 'standards' && <StandardsContent />}
        </motion.div>
      </AnimatePresence>

      {/* Course Drawer */}
      <CourseDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        mode={drawerMode}
        course={selectedCourse}
        onModeChange={setDrawerMode}
      />
    </div>
  )
}

export default CurriculumModule
