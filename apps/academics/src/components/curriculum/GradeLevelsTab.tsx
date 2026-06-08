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
import { TanstackDataTable, type ColumnDef } from '@edforge/ui'
import type { CourseResponseDto } from '@aibrains/shared-types'
import { GradeLevelDrawer, type GradeLevelData } from './GradeLevelDrawer'
import { useSchoolEnabledGradeOptions } from '../../hooks/useGradeOptions'

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
  /**
   * Active school. The grade rows shown are derived from the school's
   * `enabledGradeLevels` (with `gradeRange` fallback) so this view matches
   * the rest of the Curriculum / Enrollment / Student forms.
   */
  schoolId: string | null
  /** Per-grade enrollment counts from the current academic year (canonical Space A keys). */
  enrollmentByGradeLevel?: Record<string, number> | null
  /** True while the enrollment query is in flight on first paint. */
  enrollmentLoading?: boolean
  /** False when the active school has no current academic year yet. */
  hasCurrentAY?: boolean
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
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[rgb(var(--state-info-bg)/0.18)] to-violet-500/20 flex items-center justify-center">
        <span className="text-xs font-bold text-[rgb(var(--state-info-fg))]">
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
          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-surface-tertiary text-text-secondary truncate max-w-36"
          title={name}
        >
          {name}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--action-secondary-fg))]">
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
  schoolId,
  enrollmentByGradeLevel,
  enrollmentLoading = false,
  hasCurrentAY = true,
}: GradeLevelsTabProps) {
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<GradeLevelData | null>(null)

  const { options: filteredGradeOptions } = useSchoolEnabledGradeOptions(schoolId)

  // Derive enriched grade level data with associated courses
  const gradeData: GradeLevelData[] = useMemo(() => {
    const courseMap = new Map<string, CourseResponseDto[]>()

    // Initialize only the relevant grades
    for (const opt of filteredGradeOptions) {
      courseMap.set(opt.value, [])
    }

    // Group courses by grade level
    for (const course of courses) {
      if (course.gradeLevels) {
        for (const grade of course.gradeLevels) {
          const existing = courseMap.get(grade)
          if (existing !== undefined) {
            existing.push(course)
          }
        }
      }
    }

    return filteredGradeOptions.map((opt) => {
      const gradeCourses = courseMap.get(opt.value) ?? []
      const studentCount = enrollmentByGradeLevel?.[opt.value] ?? 0
      return {
        value: opt.value,
        label: opt.label,
        courseCount: gradeCourses.length,
        courses: gradeCourses,
        studentCount,
      }
    })
  }, [courses, filteredGradeOptions, enrollmentByGradeLevel])

  // Whether to show numeric student counts vs em-dash placeholders
  const showStudentCounts = hasCurrentAY && enrollmentByGradeLevel != null
  const studentsPending = hasCurrentAY && enrollmentLoading && enrollmentByGradeLevel == null

  // Summary stats
  const stats = useMemo(() => {
    const totalGrades = filteredGradeOptions.length
    const totalAssignments = gradeData.reduce((sum, g) => sum + g.courseCount, 0)
    const avgPerGrade =
      totalGrades > 0 ? (totalAssignments / totalGrades).toFixed(1) : '0'
    const withCourses = gradeData.filter((g) => g.courseCount > 0).length
    return { totalGrades, totalAssignments, avgPerGrade, withCourses }
  }, [gradeData, filteredGradeOptions])

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

  // TanstackDataTable columns
  const columns: ColumnDef<GradeLevelData, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'value',
        header: 'Grade Level',
        size: 200,
        cell: ({ row }) => (
          <GradeBadge value={row.original.value} label={row.original.label} />
        ),
      },
      {
        accessorKey: 'courseCount',
        header: 'Course Count',
        size: 130,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary">
              {row.original.courseCount}
            </span>
            {row.original.courseCount > 0 && (
              <span className="text-xs text-text-tertiary">
                course{row.original.courseCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'courses',
        header: 'Courses',
        size: 320,
        cell: ({ row }) => <CourseChips courses={row.original.courses} />,
      },
      {
        accessorKey: 'studentCount',
        header: 'Students',
        size: 120,
        cell: ({ row }) => {
          if (!hasCurrentAY) {
            return (
              <span
                className="text-sm text-text-tertiary"
                title="No active academic year — enrollment counts will appear once an academic year is set as current."
              >
                &mdash;
              </span>
            )
          }
          if (studentsPending) {
            return <span className="text-sm text-text-tertiary">…</span>
          }
          return (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text-primary">
                {row.original.studentCount}
              </span>
              {row.original.studentCount > 0 && (
                <span className="text-xs text-text-tertiary">
                  student{row.original.studentCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )
        },
      },
    ],
    [hasCurrentAY, studentsPending]
  )

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={Layers}
          label="Total Grade Levels"
          value={stats.totalGrades}
          accent="text-[rgb(var(--state-info-fg))]"
          bg="bg-[rgb(var(--state-info-fg))]/10"
        />
        <StatCard
          icon={BookOpen}
          label="Course Assignments"
          value={stats.totalAssignments}
          accent="text-[rgb(var(--state-danger-fg))] "
          bg="bg-[rgb(var(--state-danger-fg))]/10"
        />
        <StatCard
          icon={BarChart3}
          label="Avg. Courses / Grade"
          value={stats.avgPerGrade}
          accent="text-[rgb(var(--action-secondary-fg))]"
          bg="bg-[rgb(var(--state-info-bg)/0.18)]"
        />
        <StatCard
          icon={GraduationCap}
          label="Grades with Courses"
          value={stats.withCourses}
          accent="text-[rgb(var(--state-warning-fg))]"
          bg="bg-[rgb(var(--state-warning-fg))]/10"
        />
      </div>

      {/* Grade Levels DataTable */}
      <TanstackDataTable
        columns={columns}
        data={gradeData}
        getRowId={(grade) => grade.value}
        isLoading={isLoading}
        enableSorting={true}
        pagination={{ pageSize: 20 }}
        emptyState={{
          icon: <Layers className="w-12 h-12" />,
          title: 'No grade levels found',
          description: 'Grade levels will appear once courses are configured.',
        }}
        onRowClick={handleRowClick}
        maxHeight="calc(100vh - 28rem)"
      />

      {/* Grade Level Drawer */}
      <GradeLevelDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        gradeLevel={selectedGrade}
        onViewCourse={onViewCourse ? handleViewCourseFromDrawer : undefined}
        showStudentCount={showStudentCounts}
      />
    </div>
  )
}
