/**
 * GradebookGrid Component
 *
 * Spreadsheet-like grid for viewing section grades.
 * Shows students as rows, assignments as columns, with category and overall averages.
 */

import { useMemo } from 'react'
import { GraduationCap, Lock } from 'lucide-react'
import type { GradeRecord } from '../../services/academics.service'

// ============================================================================
// TYPES
// ============================================================================

interface GradebookGridProps {
  grades: GradeRecord[]
  isLoading: boolean
}

// ============================================================================
// HELPERS
// ============================================================================

function getGradeColor(percentage: number): string {
  if (percentage >= 90) return 'text-emerald-600 dark:text-emerald-400'
  if (percentage >= 80) return 'text-blue-600 dark:text-blue-400'
  if (percentage >= 70) return 'text-amber-600 dark:text-amber-400'
  if (percentage >= 60) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

function getGradeBg(percentage: number): string {
  if (percentage >= 90) return 'bg-emerald-50 dark:bg-emerald-500/10'
  if (percentage >= 80) return 'bg-blue-50 dark:bg-blue-500/10'
  if (percentage >= 70) return 'bg-amber-50 dark:bg-amber-500/10'
  if (percentage >= 60) return 'bg-orange-50 dark:bg-orange-500/10'
  return 'bg-red-50 dark:bg-red-500/10'
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GradebookGrid({ grades, isLoading }: GradebookGridProps) {
  // Get unique assignment names across all students
  const assignmentNames = useMemo(() => {
    const names = new Set<string>()
    grades.forEach((grade) => {
      grade.assignments?.forEach((a) => names.add(a.assignmentName))
    })
    return Array.from(names)
  }, [grades])

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-10 bg-surface-secondary rounded-lg animate-pulse" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-surface-secondary rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (grades.length === 0) {
    return (
      <div className="py-16 text-center">
        <GraduationCap className="w-10 h-10 mx-auto text-text-tertiary mb-3" />
        <h4 className="text-sm font-medium text-text-primary mb-1">
          No grades recorded yet
        </h4>
        <p className="text-xs text-text-tertiary max-w-sm mx-auto">
          Record assignment grades to see the gradebook populate.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-secondary">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-secondary">
            {/* Frozen student column */}
            <th className="sticky left-0 z-10 bg-surface-secondary px-4 py-3 text-left font-semibold text-text-primary border-r border-border-secondary min-w-[200px]">
              Student
            </th>
            {/* Assignment columns */}
            {assignmentNames.map((name) => (
              <th
                key={name}
                className="px-3 py-3 text-center font-medium text-text-secondary min-w-[100px] border-r border-border-secondary last:border-r-0"
              >
                <div className="truncate max-w-[120px]" title={name}>
                  {name}
                </div>
              </th>
            ))}
            {/* Overall Grade */}
            <th className="px-4 py-3 text-center font-semibold text-text-primary min-w-[100px] bg-surface-hover">
              Overall
            </th>
            <th className="px-4 py-3 text-center font-semibold text-text-primary min-w-[80px] bg-surface-hover">
              Letter
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-secondary">
          {grades.map((grade) => (
            <tr key={grade.gradeId} className="hover:bg-surface-secondary/50 transition-colors">
              {/* Student name */}
              <td className="sticky left-0 z-10 bg-surface-primary px-4 py-3 border-r border-border-secondary">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary">
                    {grade.studentName || grade.studentId.slice(0, 8)}
                  </span>
                  {grade.isFinal && (
                    <Lock className="w-3 h-3 text-text-tertiary" aria-label="Grade finalized" />
                  )}
                </div>
              </td>
              {/* Assignment scores */}
              {assignmentNames.map((aName) => {
                const assignment = grade.assignments?.find(
                  (a) => a.assignmentName === aName
                )
                if (!assignment) {
                  return (
                    <td
                      key={aName}
                      className="px-3 py-3 text-center text-text-tertiary border-r border-border-secondary last:border-r-0"
                    >
                      —
                    </td>
                  )
                }
                const pct = assignment.possiblePoints > 0
                  ? (assignment.earnedPoints / assignment.possiblePoints) * 100
                  : 0
                return (
                  <td
                    key={aName}
                    className="px-3 py-3 text-center border-r border-border-secondary last:border-r-0"
                  >
                    <span className={`text-sm font-medium ${getGradeColor(pct)}`}>
                      {assignment.earnedPoints}/{assignment.possiblePoints}
                    </span>
                  </td>
                )
              })}
              {/* Overall grade */}
              <td className="px-4 py-3 text-center bg-surface-secondary/30">
                <span
                  className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-sm font-bold ${getGradeColor(grade.numericGrade)} ${getGradeBg(grade.numericGrade)}`}
                >
                  {grade.numericGrade.toFixed(1)}%
                </span>
              </td>
              <td className="px-4 py-3 text-center bg-surface-secondary/30">
                <span className="text-sm font-bold text-text-primary">
                  {grade.letterGrade}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
