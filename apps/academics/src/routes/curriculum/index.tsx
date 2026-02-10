/**
 * Curriculum Management Module
 *
 * Unified curriculum interface for the Academics domain.
 * - Courses tab: Live data from API with filters, table, and drawer
 * - Grade Levels tab: Grade cards with course counts
 * - Standards tab: Placeholder for future sprint
 *
 * Sprint 4 — Course Catalog & Curriculum Management
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Layers,
  Target,
  CheckCircle,
  Plus,
  MoreHorizontal,
  Download,
} from 'lucide-react'
import { useActiveSchoolId } from '../../stores/app.store'
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

const TABS = [
  {
    id: 'courses' as const,
    label: 'Courses',
    icon: BookOpen,
  },
  {
    id: 'grade-levels' as const,
    label: 'Grade Levels',
    icon: Layers,
  },
  {
    id: 'standards' as const,
    label: 'Standards',
    icon: Target,
  },
]

// ============================================================================
// STAT CARD
// ============================================================================

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  bg,
}: {
  icon: typeof BookOpen
  label: string
  value: string | number
  accent: string
  bg: string
}) {
  return (
    <div className="bg-surface-primary rounded-xl border border-border-primary p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`w-4 h-4 ${accent}`} />
        </div>
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="text-xl font-semibold text-text-primary">{value}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// STANDARDS PLACEHOLDER
// ============================================================================

function StandardsContent() {
  return (
    <div className="space-y-6">
      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-purple-500/10">
            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Learning Standards
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Align instructional content with state and district frameworks. Import
              Common Core, Next Generation Science Standards, or state-specific standards.
              Link standards to courses and assessments for competency-based reporting.
            </p>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• Import from CASE-compliant standards repositories</li>
              <li>• Hierarchical organization (domains, clusters, standards)</li>
              <li>• Cross-walk between different frameworks</li>
              <li>• Standards mastery tracking by student</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-text-primary">Common Core State Standards</h4>
              <p className="text-xs text-text-secondary">ELA & Mathematics</p>
            </div>
          </div>
          <div className="text-sm text-text-tertiary">Coming in a future release</div>
        </div>

        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h4 className="font-medium text-text-primary">Next Generation Science Standards</h4>
              <p className="text-xs text-text-secondary">Science & Engineering</p>
            </div>
          </div>
          <div className="text-sm text-text-tertiary">Coming in a future release</div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// PAGE ACTIONS DROPDOWN
// ============================================================================

function PageActionsDropdown({ onAddCourse }: { onAddCourse: () => void }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
        aria-label="Actions"
        aria-expanded={isOpen}
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg bg-surface-primary border border-border-primary shadow-lg py-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onAddCourse()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Course
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Catalog
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// CURRICULUM MODULE
// ============================================================================

export function CurriculumModule() {
  const [activeTab, setActiveTab] = useState<CurriculumTab>('courses')
  const schoolId = useActiveSchoolId()
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
  const {
    data: coursesData,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useCourses({
    schoolId: schoolId || '',
    filters: queryFilters,
    enabled: !!schoolId,
  })

  const courses = flattenCoursePages(coursesData)
  const totalCount = getCourseTotalFromPages(coursesData)

  // Computed stats
  const stats = useMemo(() => {
    const active = courses.filter((c) => c.isActive).length
    const elective = courses.filter((c) => c.courseType === 'elective').length
    const subjects = new Set(courses.map((c) => c.subjectArea)).size
    return { total: courses.length, active, elective, subjects }
  }, [courses])

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

  const closeDrawer = () => {
    setDrawerOpen(false)
    setSelectedCourse(null)
  }

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20">
                <BookOpen className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">
                  Curriculum Management
                </h1>
                <p className="text-text-secondary mt-0.5 text-sm">
                  Define courses, map learning standards, and organize curriculum
                  by grade level
                </p>
              </div>
            </div>

            {activeTab === 'courses' && (
              <PageActionsDropdown onAddCourse={openCreateDrawer} />
            )}
          </div>
        </div>

        {/* Tab Navigation — Framer Motion animated, consistent with Student Profile */}
        <div className="px-6">
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap outline-none
                    ${
                      isActive
                        ? 'text-text-primary'
                        : 'text-text-tertiary hover:text-text-secondary'
                    }
                  `}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-teal-500' : 'opacity-70'
                      }`}
                    />
                    {tab.label}
                  </span>

                  {isActive && (
                    <motion.div
                      layoutId="curriculumTab"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-teal-500 rounded-t-full"
                      initial={false}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content with AnimatePresence */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {activeTab === 'courses' && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatCard
                    icon={BookOpen}
                    label="Total Courses"
                    value={totalCount ?? stats.total}
                    accent="text-rose-600 dark:text-rose-400"
                    bg="bg-rose-500/10"
                  />
                  <StatCard
                    icon={CheckCircle}
                    label="Active Courses"
                    value={stats.active}
                    accent="text-emerald-600 dark:text-emerald-400"
                    bg="bg-emerald-500/10"
                  />
                  <StatCard
                    icon={BookOpen}
                    label="Electives"
                    value={stats.elective}
                    accent="text-blue-600 dark:text-blue-400"
                    bg="bg-blue-500/10"
                  />
                  <StatCard
                    icon={Layers}
                    label="Subject Areas"
                    value={stats.subjects}
                    accent="text-amber-600 dark:text-amber-400"
                    bg="bg-amber-500/10"
                  />
                </div>

                {/* Filters */}
                <CourseFilters totalCount={totalCount} />

                {/* Course Table */}
                <CourseTable
                  courses={courses}
                  isLoading={isLoading}
                  hasMore={!!hasNextPage}
                  isFetchingMore={isFetchingNextPage}
                  onLoadMore={() => fetchNextPage()}
                  onAddCourse={openCreateDrawer}
                  onViewCourse={openViewDrawer}
                  onEditCourse={openEditDrawer}
                  onToggleActive={handleToggleActive}
                />
              </div>
            )}

            {activeTab === 'grade-levels' && (
              <GradeLevelsTab
                courses={courses}
                isLoading={isLoading}
                onViewCourse={openViewDrawer}
              />
            )}

            {activeTab === 'standards' && <StandardsContent />}
          </motion.div>
        </AnimatePresence>
      </div>

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
