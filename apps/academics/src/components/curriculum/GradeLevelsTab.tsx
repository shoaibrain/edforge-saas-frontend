/**
 * GradeLevelsTab Component
 *
 * Read-only summary of grade levels (K-12) with:
 * - Grid of grade cards showing student and course counts
 * - Derived from course data (gradeLevels field) and student data
 * - Click a grade card to navigate to Student Directory filtered by grade
 */

import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  BookOpen,
  ArrowRight,
  Layers,
} from 'lucide-react'
import type { CourseResponseDto } from '@edforge/shared-types'
import { GRADE_LEVEL_OPTIONS } from '../../schemas/course.form'

// ============================================================================
// TYPES
// ============================================================================

interface GradeLevelsTabProps {
  /** Course data to derive grade-level course counts from */
  courses: CourseResponseDto[]
  /** Whether course data is loading */
  isLoading?: boolean
}

interface GradeCardData {
  value: string
  label: string
  courseCount: number
}

// ============================================================================
// GRADE CARD
// ============================================================================

function GradeCard({
  grade,
  onNavigate,
}: {
  grade: GradeCardData
  onNavigate: () => void
}) {
  return (
    <button
      type="button"
      onClick={onNavigate}
      className="group flex flex-col bg-surface-primary rounded-xl border border-border-primary p-5 hover:border-teal-400 hover:shadow-md transition-all text-left"
    >
      {/* Grade number */}
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center">
          <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
            {grade.value}
          </span>
        </div>
        <ArrowRight className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Grade name */}
      <h4 className="text-sm font-semibold text-text-primary mb-3">
        {grade.label}
      </h4>

      {/* Stats */}
      <div className="space-y-1.5 mt-auto">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <BookOpen className="w-3.5 h-3.5 text-text-tertiary" />
          <span>
            {grade.courseCount} course{grade.courseCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </button>
  )
}

// ============================================================================
// SKELETON
// ============================================================================

function GradeLevelsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 14 }).map((_, i) => (
        <div
          key={i}
          className="bg-surface-secondary rounded-xl border border-border-secondary p-5 animate-pulse"
        >
          <div className="w-10 h-10 rounded-lg bg-surface-tertiary mb-3" />
          <div className="h-4 w-24 bg-surface-tertiary rounded mb-3" />
          <div className="h-3 w-16 bg-surface-tertiary rounded" />
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// GRADE LEVELS TAB
// ============================================================================

export function GradeLevelsTab({ courses, isLoading }: GradeLevelsTabProps) {
  const navigate = useNavigate()

  // Derive course counts per grade level from the courses data
  const gradeData: GradeCardData[] = useMemo(() => {
    const countMap = new Map<string, number>()

    // Initialize all known grades with 0
    for (const opt of GRADE_LEVEL_OPTIONS) {
      countMap.set(opt.value, 0)
    }

    // Count courses per grade
    for (const course of courses) {
      if (course.gradeLevels) {
        for (const grade of course.gradeLevels) {
          countMap.set(grade, (countMap.get(grade) ?? 0) + 1)
        }
      }
    }

    return GRADE_LEVEL_OPTIONS.map((opt) => ({
      value: opt.value,
      label: opt.label,
      courseCount: countMap.get(opt.value) ?? 0,
    }))
  }, [courses])

  const totalCourseAssignments = gradeData.reduce(
    (sum, g) => sum + g.courseCount,
    0
  )

  if (isLoading) return <GradeLevelsSkeleton />

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-indigo-500/10">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-text-primary mb-1">
              Grade Level Overview
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Academic progression from Pre-K through Grade 12. Click a grade
              level to view the students enrolled at that level.
            </p>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {GRADE_LEVEL_OPTIONS.length}
              </p>
              <p className="text-xs text-text-tertiary">Grade Levels</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {totalCourseAssignments}
              </p>
              <p className="text-xs text-text-tertiary">Course Assignments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grade cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {gradeData.map((grade) => (
          <GradeCard
            key={grade.value}
            grade={grade}
            onNavigate={() =>
              navigate({ to: '/students', search: { gradeLevel: grade.value } })
            }
          />
        ))}
      </div>
    </div>
  )
}
