/**
 * GradeLevelsTab Component
 *
 * Enterprise-grade grade level management view with:
 * - DataTable listing all grade levels (PK–12) with course data
 * - Summary stats header (total grade levels, course assignments, avg per grade)
 * - Row click opens GradeLevelDrawer for detailed view
 * - Consistent with Courses tab design pattern
 */

import { useMemo, useState, useCallback } from 'react'
import {
  BookOpen,
  Layers,
  BarChart3,
  GraduationCap,
} from 'lucide-react'
import { DataTable, type Column } from '@edforge/ui'
import type { CourseResponseDto } from '@edforge/shared-types'
import { GRADE_LEVEL_OPTIONS } from '../../schemas/course.form'
import { GradeLevelDrawer, type GradeLevelData } from './GradeLevelDrawer'

// ============================================================================
// TYPES
// ============================================================================

interface GradeLevelsTabProps {
  /** Course data to derive grade-level course counts from */
  courses: CourseResponseDto[]
  /** Whether course data is loading */
  isLoading?: boolean
  /** Callback when a course is clicked inside the drawer */
  onViewCourse?: (course: CourseResponseDto) => void
}

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
// HELPER COMPONENTS
// ============================================================================

function GradeBadge({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
          {value}
        </span>
      </div>
      <span className="font-medium text-text-primary text-sm">{label}</span>
    </div>
  )
}

function CourseChips({ courses }: { courses: CourseResponseDto[] }) {
  if (courses.length === 0) {
    return <span className="text-text-tertiary text-sm">—</span>
  }

  const names = courses.map((c) => c.courseName)
  const maxShow = 2
  const display = names.slice(0, maxShow)
  const remaining = names.length - maxShow

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {display.map((name, i) => (
        <span
          key={i}
          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-surface-tertiary text-text-secondary truncate max-w-[140px]"
          title={name}
        >
          {name}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-teal-500/10 text-teal-600 dark:text-teal-400">
          +{remaining} more
        </span>
      )}
    </div>
  )
}

// ============================================================================
// GRADE LEVELS TAB
// ============================================================================

export function GradeLevelsTab({
  courses,
  isLoading,
  onViewCourse,
}: GradeLevelsTabProps) {
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<GradeLevelData | null>(null)

  // Derive enriched grade level data with associated courses
  const gradeData: GradeLevelData[] = useMemo(() => {
    const courseMap = new Map<string, CourseResponseDto[]>()

    // Initialize all known grades
    for (const opt of GRADE_LEVEL_OPTIONS) {
      courseMap.set(opt.value, [])
    }

    // Group courses by grade level
    for (const course of courses) {
      if (course.gradeLevels) {
        for (const grade of course.gradeLevels) {
          const existing = courseMap.get(grade) ?? []
          existing.push(course)
          courseMap.set(grade, existing)
        }
      }
    }

    return GRADE_LEVEL_OPTIONS.map((opt) => {
      const gradeCourses = courseMap.get(opt.value) ?? []
      return {
        value: opt.value,
        label: opt.label,
        courseCount: gradeCourses.length,
        courses: gradeCourses,
      }
    })
  }, [courses])

  // Summary stats
  const stats = useMemo(() => {
    const totalGrades = GRADE_LEVEL_OPTIONS.length
    const totalAssignments = gradeData.reduce((sum, g) => sum + g.courseCount, 0)
    const avgPerGrade =
      totalGrades > 0 ? (totalAssignments / totalGrades).toFixed(1) : '0'
    const withCourses = gradeData.filter((g) => g.courseCount > 0).length
    return { totalGrades, totalAssignments, avgPerGrade, withCourses }
  }, [gradeData])

  // Open grade detail drawer
  const handleRowClick = useCallback((grade: GradeLevelData) => {
    setSelectedGrade(grade)
    setDrawerOpen(true)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
    setSelectedGrade(null)
  }, [])

  // Handle clicking a course inside the drawer
  const handleViewCourseFromDrawer = useCallback(
    (course: CourseResponseDto) => {
      handleCloseDrawer()
      onViewCourse?.(course)
    },
    [handleCloseDrawer, onViewCourse]
  )

  // DataTable columns
  const columns: Column<GradeLevelData>[] = useMemo(
    () => [
      {
        key: 'value',
        header: 'Grade Level',
        sortable: true,
        width: '200px',
        render: (grade) => (
          <GradeBadge value={grade.value} label={grade.label} />
        ),
      },
      {
        key: 'courseCount',
        header: 'Course Count',
        sortable: true,
        width: '130px',
        render: (grade) => (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary">
              {grade.courseCount}
            </span>
            {grade.courseCount > 0 && (
              <span className="text-xs text-text-tertiary">
                course{grade.courseCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'courses' as any,
        header: 'Courses',
        width: '320px',
        render: (grade) => <CourseChips courses={grade.courses} />,
      },
      {
        key: 'students' as any,
        header: 'Students',
        width: '120px',
        render: () => (
          <span className="text-sm text-text-tertiary">&mdash;</span>
        ),
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={Layers}
          label="Total Grade Levels"
          value={stats.totalGrades}
          accent="text-indigo-600 dark:text-indigo-400"
          bg="bg-indigo-500/10"
        />
        <StatCard
          icon={BookOpen}
          label="Course Assignments"
          value={stats.totalAssignments}
          accent="text-rose-600 dark:text-rose-400"
          bg="bg-rose-500/10"
        />
        <StatCard
          icon={BarChart3}
          label="Avg. Courses / Grade"
          value={stats.avgPerGrade}
          accent="text-teal-600 dark:text-teal-400"
          bg="bg-teal-500/10"
        />
        <StatCard
          icon={GraduationCap}
          label="Grades with Courses"
          value={stats.withCourses}
          accent="text-amber-600 dark:text-amber-400"
          bg="bg-amber-500/10"
        />
      </div>

      {/* Grade Levels DataTable */}
      <DataTable
        columns={columns}
        data={gradeData}
        keyExtractor={(grade) => grade.value}
        isLoading={isLoading}
        skeletonRows={8}
        emptyState={{
          icon: <Layers className="w-12 h-12" />,
          title: 'No grade levels found',
          description: 'Grade levels will appear once courses are configured.',
        }}
        onRowClick={handleRowClick}
      />

      {/* Grade Level Drawer */}
      <GradeLevelDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        gradeLevel={selectedGrade}
        onViewCourse={onViewCourse ? handleViewCourseFromDrawer : undefined}
      />
    </div>
  )
}
