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

import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
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
import { downloadCoursesCsv } from '../../components/curriculum/course-csv-export'
import { getAllCourses, parseApiError } from '../../services/academics.service'
import { useAcademicsI18n } from '../../lib/i18n'
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
  const { t, formatNumber, formatCount } = useAcademicsI18n()
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
    if (filters.gradeLevel) f.gradeLevel = filters.gradeLevel
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

  // Grade-level filter is applied client-side over the loaded set: the list
  // endpoint accepts the `gradeLevel` param (sent above) but does not yet honor
  // it server-side (tracked in a backend issue). Until then this keeps the
  // control functional for the loaded page; it becomes a pass-through once the
  // server filters across all pages.
  const visibleCourses = filters.gradeLevel
    ? courses.filter((c) => c.gradeLevels?.includes(filters.gradeLevel as string))
    : courses

  // Computed stats. `total` is the server truth when unfiltered; with a
  // client-side grade filter it reflects the filtered loaded set. The
  // subject/elective/specialized breakdowns are derived from loaded rows, so
  // `allLoaded` gates whether they cover the whole catalog (see header copy).
  const stats = useMemo(() => {
    const base = visibleCourses
    const gradeFiltered = !!filters.gradeLevel
    const total = gradeFiltered ? base.length : totalCount ?? courses.length
    const active = base.filter((c) => c.isActive).length
    const elective = base.filter((c) => c.courseType === 'elective').length
    const subjects = new Set(base.map((c) => c.subjectArea)).size
    const specializedTypes = new Set(
      base
        .filter((c) =>
          ['honors', 'ap', 'dual_enrollment'].includes(c.courseType)
        )
        .map((c) => c.courseType)
    ).size
    const electiveName =
      elective === 1
        ? base.find((c) => c.courseType === 'elective')?.courseName
        : undefined
    const allLoaded =
      !gradeFiltered && totalCount != null && courses.length >= totalCount
    return {
      total,
      active,
      elective,
      subjects,
      specializedTypes,
      electiveName,
      allLoaded,
      gradeFiltered,
    }
  }, [visibleCourses, courses, totalCount, filters.gradeLevel])

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

  // Export the current (filtered) catalog. Fetches all pages so the CSV covers
  // the whole catalog, then applies the client-side grade filter (mirrors the
  // on-screen view) until the backend honors `gradeLevel`.
  const handleExportCsv = useCallback(async () => {
    if (!schoolId) return
    try {
      const rows = await getAllCourses({ schoolId, ...queryFilters })
      const filtered = filters.gradeLevel
        ? rows.filter((c) => c.gradeLevels?.includes(filters.gradeLevel as string))
        : rows
      downloadCoursesCsv(filtered, `courses-${schoolId}.csv`)
    } catch (e) {
      toast.error(parseApiError(e).message)
    }
  }, [schoolId, queryFilters, filters.gradeLevel])

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
            {t('curriculumModule.summary.coursesAcross')}{' '}
            <span className="font-medium text-[rgb(var(--accent-academics-text))]">
              {formatNumber(stats.subjects)}
            </span>{' '}
            {t('curriculumModule.summary.subjectAreasSuffix')} ·{' '}
            {formatCount('curriculumModule.summary.elective', stats.elective)} ·{' '}
            <span className="font-medium text-[rgb(var(--accent-academics-text))]">
              {formatNumber(stats.specializedTypes)}
            </span>{' '}
            {t('curriculumModule.summary.specializedTypesSuffix')}
            {!stats.allLoaded && (
              <span className="text-[rgb(var(--text-disabled))]">
                {' '}
                · {t('curriculumModule.summary.basedOnLoaded')}
              </span>
            )}
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
              {t('curriculumModule.actions.addCourse')}
            </button>
          ) : undefined
        }
      />

      {/* ---- KPI Tiles ---- */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-3.5">
        <StatCard
          label={t('curriculumModule.stats.totalCourses')}
          value={formatNumber(stats.total)}
          icon={BookOpen}
          signature="curriculum"
          accentColor="rgb(var(--accent-reports)/0.1)"
          iconColor="rgb(var(--accent-reports))"
          barColor="rgb(var(--accent-reports))"
          tag={{
            text: formatCount('curriculumModule.stats.activeTag', stats.active),
            color: 'rgb(var(--accent-enrollment))',
            bg: 'rgb(var(--accent-enrollment)/0.1)',
          }}
          loading={isLoading}
        />
        <StatCard
          label={t('curriculumModule.stats.subjectAreas')}
          value={formatNumber(stats.subjects)}
          icon={Layers}
          accentColor="rgb(var(--accent-academics)/0.1)"
          iconColor="rgb(var(--accent-academics))"
          barColor="rgb(var(--accent-academics))"
          hint={stats.allLoaded ? t('curriculumModule.stats.subjectHint') : t('curriculumModule.summary.basedOnLoaded')}
          loading={isLoading}
        />
        <StatCard
          label={t('curriculumModule.stats.electives')}
          value={formatNumber(stats.elective)}
          icon={BookOpen}
          signature="curriculum"
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
          label={t('curriculumModule.stats.specializedTypes')}
          value={formatNumber(stats.specializedTypes)}
          icon={BookOpen}
          signature="curriculum"
          accentColor="rgb(var(--accent-attendance)/0.1)"
          iconColor="rgb(var(--accent-attendance))"
          barColor="rgb(var(--accent-attendance))"
          tag={{
            text: t('curriculumModule.stats.specializedTag'),
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
              <CourseFilters
                totalCount={totalCount}
                schoolId={schoolId}
                onExport={handleExportCsv}
              />

              {/* Course Table */}
              <div className="mt-3">
                <CourseTable
                  courses={visibleCourses}
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
        existingCourseCodes={courses.map((c) => c.courseCode)}
      />
    </div>
  )
}

export default CurriculumModule
