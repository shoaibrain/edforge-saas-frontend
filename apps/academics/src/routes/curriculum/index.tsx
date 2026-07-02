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
import { useNavigate, useSearch } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useResourcePermissions } from '@edforge/abac'
import { PageHeader, StatBand, type StatMetric } from '@edforge/ui'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Award,
  BarChart3,
  BookOpen,
  GraduationCap,
  Layers,
  Plus,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useActiveSchoolId } from '../../stores/app.store'
import { useSchoolEnabledGradeOptions } from '../../hooks/useGradeOptions'
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
import { useCourseToolbar } from '../../components/curriculum/CourseFilters'
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
  const { t } = useAcademicsI18n()
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
        {t('curriculumModule.standards.title')}
      </h3>

      {/* Body */}
      <p className="text-xs text-[rgb(var(--text-disabled))] max-w-80 leading-normal mb-4">
        {t('curriculumModule.standards.description')}
      </p>
    </div>
  )
}

// ============================================================================
// CURRICULUM MODULE
// ============================================================================

export function CurriculumModule() {
  const { t, formatNumber, formatCount } = useAcademicsI18n()
  const navigate = useNavigate()
  const schoolId = useActiveSchoolId()

  // Active tab is sourced from the URL (?tab=…) so it survives reload / deep
  // links / back-forward. `validateSearch` on the route (router.tsx) coerces
  // unknown values, so a bare read here is safe.
  const search = useSearch({ strict: false }) as { tab?: CurriculumTab }
  const activeTab: CurriculumTab = search?.tab ?? 'courses'
  const setActiveTab = useCallback(
    (tab: CurriculumTab) => {
      navigate({ search: { tab } as never, replace: true })
    },
    [navigate]
  )

  // Current academic year + per-grade enrollment counts (reuses unified dashboard
  // query — cached & deduped with the Overview / Students pages).
  const { data: currentYear, isLoading: yearLoading } = useCurrentAcademicYear(
    schoolId ?? ''
  )
  const overview = useAcademicsOverview(schoolId, currentYear?.yearId)

  // School-enabled grade levels — powers the Grade Levels tab's KPI band so the
  // top-level stats stay in sync with the tab's table.
  const { options: gradeOptions } = useSchoolEnabledGradeOptions(schoolId)

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
      downloadCoursesCsv(filtered, `courses-${schoolId}.csv`, {
        headers: {
          code: t('curriculumModule.export.headers.code'),
          courseName: t('curriculumModule.export.headers.courseName'),
          subject: t('curriculumModule.export.headers.subject'),
          grades: t('curriculumModule.export.headers.grades'),
          credits: t('curriculumModule.export.headers.credits'),
          type: t('curriculumModule.export.headers.type'),
          duration: t('curriculumModule.export.headers.duration'),
          status: t('curriculumModule.export.headers.status'),
        },
        status: {
          active: t('common.active'),
          inactive: t('common.inactive'),
        },
      })
    } catch (e) {
      toast.error(parseApiError(e).message)
    }
  }, [schoolId, queryFilters, filters.gradeLevel, t])


  // Calm-by-default KPI band. Nothing here is in a warning/critical state, so
  // the band stays neutral — Specialized Types reads 'muted' when zero.
  const curriculumMetrics: StatMetric[] = [
    {
      label: t('curriculumModule.stats.totalCourses'),
      value: formatNumber(stats.total),
      icon: <BookOpen className="h-4 w-4" />,
      iconSignature: 'curriculum',
      state: 'normal',
      primary: true,
      meter: { pct: stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0, target: 100 },
      sub: formatCount('curriculumModule.stats.activeTag', stats.active),
    },
    {
      label: t('curriculumModule.stats.subjectAreas'),
      value: formatNumber(stats.subjects),
      icon: <Layers className="h-4 w-4" />,
      iconSignature: 'sections',
      state: 'normal',
      sub: stats.allLoaded ? t('curriculumModule.stats.subjectHint') : t('curriculumModule.summary.basedOnLoaded'),
    },
    {
      label: t('curriculumModule.stats.electives'),
      value: formatNumber(stats.elective),
      icon: <Sparkles className="h-4 w-4" />,
      iconSignature: 'gpa',
      state: 'normal',
      sub: stats.electiveName ?? undefined,
    },
    {
      label: t('curriculumModule.stats.specializedTypes'),
      value: formatNumber(stats.specializedTypes),
      icon: <Award className="h-4 w-4" />,
      iconSignature: 'academics',
      state: stats.specializedTypes === 0 ? 'muted' : 'normal',
      sub: t('curriculumModule.stats.specializedTag'),
    },
  ]

  // Grade-level KPIs — computed on the page so the top band reflects the active
  // tab (the Grade Levels tab's table no longer renders its own KPI cards).
  // `courseCount` per grade = number of courses that include that grade; the sum
  // is the total course→grade assignment count.
  const gradeLevelStats = useMemo(() => {
    const totalGrades = gradeOptions.length
    const counts = new Map<string, number>()
    for (const opt of gradeOptions) counts.set(opt.value, 0)
    for (const c of courses) {
      for (const g of c.gradeLevels ?? []) {
        if (counts.has(g)) counts.set(g, (counts.get(g) ?? 0) + 1)
      }
    }
    let totalAssignments = 0
    let withCourses = 0
    for (const n of counts.values()) {
      totalAssignments += n
      if (n > 0) withCourses += 1
    }
    const avgPerGrade = totalGrades > 0 ? (totalAssignments / totalGrades).toFixed(1) : '0'
    return { totalGrades, totalAssignments, avgPerGrade, withCourses }
  }, [gradeOptions, courses])

  const gradeLevelMetrics: StatMetric[] = [
    {
      label: t('tables.gradeLevels.stats.totalGradeLevels'),
      value: formatNumber(gradeLevelStats.totalGrades),
      icon: <Layers className="h-4 w-4" />,
      iconSignature: 'gradelevels',
      state: 'normal',
      primary: true,
    },
    {
      label: t('tables.gradeLevels.stats.courseAssignments'),
      value: formatNumber(gradeLevelStats.totalAssignments),
      icon: <BookOpen className="h-4 w-4" />,
      iconSignature: 'sections',
      state: 'normal',
    },
    {
      label: t('tables.gradeLevels.stats.avgCoursesPerGrade'),
      value: gradeLevelStats.avgPerGrade,
      icon: <BarChart3 className="h-4 w-4" />,
      iconSignature: 'overview',
      state: 'normal',
    },
    {
      label: t('tables.gradeLevels.stats.gradesWithCourses'),
      value: formatNumber(gradeLevelStats.withCourses),
      icon: <GraduationCap className="h-4 w-4" />,
      iconSignature: 'students',
      state: gradeLevelStats.withCourses === 0 ? 'muted' : 'normal',
    },
  ]

  // The band summarizes whichever tab is active. Standards has no data yet, so it
  // reuses the catalog band as a neutral overview.
  const bandMetrics = activeTab === 'grade-levels' ? gradeLevelMetrics : curriculumMetrics
  const bandAriaLabel =
    activeTab === 'grade-levels'
      ? t('curriculumModule.tabs.gradeLevels')
      : t('curriculumModule.stats.totalCourses')

  // Unified table toolbar (search + Active presets + Subject facet + More filters + Export).
  const courseToolbar = useCourseToolbar(schoolId, {
    counts: { all: stats.total, active: stats.active, inactive: Math.max(0, stats.total - stats.active) },
    onExport: handleExportCsv,
  })

  return (
    <div className="min-h-full px-5 py-4">
      {/* ---- Page header (pagebar) — breadcrumb names the page, band summarizes ---- */}
      <PageHeader
        className="mb-4"
        mode="pagebar"
        actions={
          coursePerms.create
            ? [
                {
                  label: t('curriculumModule.actions.addCourse'),
                  icon: <Plus className="h-3.5 w-3.5" />,
                  primary: true,
                  onClick: openCreateDrawer,
                },
              ]
            : undefined
        }
      />

      {/* ---- Unified KPI stat band (dynamic per active tab) ---- */}
      <div className="mb-3.5">
        <StatBand metrics={bandMetrics} ariaLabel={bandAriaLabel} />
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
          {t('curriculumModule.tabs.courses')}
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
          {t('curriculumModule.tabs.gradeLevels')}
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
          {t('curriculumModule.tabs.standards')}
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
            <CourseTable
              courses={visibleCourses}
              isLoading={isLoading}
              onAddCourse={coursePerms.create ? openCreateDrawer : undefined}
              onViewCourse={openViewDrawer}
              onEditCourse={coursePerms.edit ? openEditDrawer : undefined}
              onToggleActive={coursePerms.edit ? handleToggleActive : undefined}
              onNavigateToCourse={navigateToCourse}
              {...courseToolbar}
            />
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
