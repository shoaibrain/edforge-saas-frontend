/**
 * GradebookGrid Component
 *
 * Interactive spreadsheet-like grid for viewing and editing section grades.
 * Shows students as rows, assignments as columns, with category and overall averages.
 * Supports inline cell editing with auto-save on blur/Tab.
 */

import { useState, useMemo, useRef, useCallback } from 'react'
import { GraduationCap, Lock, Plus } from 'lucide-react'
import { useRecordGrade } from '../../hooks/useGrades'
import type { GradeRecord } from '../../services/academics.service'

// ============================================================================
// TYPES
// ============================================================================

interface GradebookGridProps {
  grades: GradeRecord[]
  isLoading: boolean
  sectionId?: string
  courseId?: string
  schoolId?: string
  termId?: string
  academicYearId?: string
  teacherId?: string
  disabled?: boolean
  onAddAssignment?: () => void
}

interface EditingCell {
  gradeId: string
  assignmentName: string
  value: string
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

export function GradebookGrid({
  grades,
  isLoading,
  sectionId,
  courseId,
  schoolId,
  termId,
  academicYearId,
  teacherId,
  disabled,
  onAddAssignment,
}: GradebookGridProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recordGradeMutation = useRecordGrade()

  // Can we edit? Need all required context props
  const canEdit = !disabled && !!sectionId && !!courseId && !!schoolId && !!termId && !!academicYearId && !!teacherId

  // Get unique assignment names across all students
  const assignmentNames = useMemo(() => {
    const names = new Set<string>()
    grades.forEach((grade) => {
      grade.assignments?.forEach((a) => names.add(a.assignmentName))
    })
    return Array.from(names)
  }, [grades])

  const handleCellClick = useCallback(
    (gradeId: string, assignmentName: string, currentValue: number | undefined, isFinal: boolean) => {
      if (!canEdit || isFinal) return
      setEditingCell({
        gradeId,
        assignmentName,
        value: currentValue !== undefined ? String(currentValue) : '',
      })
      // Focus input on next tick
      setTimeout(() => inputRef.current?.focus(), 0)
    },
    [canEdit]
  )

  const handleCellSave = useCallback(
    (grade: GradeRecord, assignmentName: string, newValue: string) => {
      setEditingCell(null)
      if (!canEdit) return

      const assignment = grade.assignments?.find((a) => a.assignmentName === assignmentName)
      if (!assignment) return

      const earnedPoints = Number(newValue)
      if (isNaN(earnedPoints) || earnedPoints < 0) return
      // Skip save if value unchanged
      if (assignment.earnedPoints === earnedPoints) return

      recordGradeMutation.mutate({
        studentId: grade.studentId,
        courseId: courseId!,
        sectionId: sectionId!,
        schoolId: schoolId!,
        termId: termId!,
        academicYearId: academicYearId!,
        teacherId: teacherId!,
        assignment: {
          assignmentName: assignment.assignmentName,
          assignmentType: assignment.assignmentType,
          categoryId: assignment.categoryId,
          possiblePoints: assignment.possiblePoints,
        },
        earnedPoints,
      })
    },
    [canEdit, courseId, sectionId, schoolId, termId, academicYearId, teacherId, recordGradeMutation]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, grade: GradeRecord, assignmentName: string) => {
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        handleCellSave(grade, assignmentName, editingCell?.value ?? '')

        // Move to next cell on Tab
        if (e.key === 'Tab') {
          const currentAssignmentIdx = assignmentNames.indexOf(assignmentName)
          const currentGradeIdx = grades.indexOf(grade)

          if (!e.shiftKey) {
            // Move right, then wrap to next row
            if (currentAssignmentIdx < assignmentNames.length - 1) {
              const nextAssignment = assignmentNames[currentAssignmentIdx + 1]
              const nextA = grade.assignments?.find((a) => a.assignmentName === nextAssignment)
              handleCellClick(grade.gradeId, nextAssignment, nextA?.earnedPoints, grade.isFinal)
            } else if (currentGradeIdx < grades.length - 1) {
              const nextGrade = grades[currentGradeIdx + 1]
              const firstA = nextGrade.assignments?.find((a) => a.assignmentName === assignmentNames[0])
              handleCellClick(nextGrade.gradeId, assignmentNames[0], firstA?.earnedPoints, nextGrade.isFinal)
            }
          }
        }
      } else if (e.key === 'Escape') {
        setEditingCell(null)
      }
    },
    [editingCell, assignmentNames, grades, handleCellSave, handleCellClick]
  )

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
                className="px-3 py-3 text-center font-medium text-text-secondary min-w-[100px] border-r border-border-secondary"
              >
                <div className="truncate max-w-[120px]" title={name}>
                  {name}
                </div>
              </th>
            ))}
            {/* Add Assignment column */}
            {canEdit && onAddAssignment && (
              <th className="px-2 py-3 text-center border-r border-border-secondary min-w-[60px]">
                <button
                  type="button"
                  onClick={onAddAssignment}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-500/10 rounded transition-colors"
                  title="Add assignment"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </th>
            )}
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
                const isEditing =
                  editingCell?.gradeId === grade.gradeId &&
                  editingCell?.assignmentName === aName

                if (!assignment) {
                  return (
                    <td
                      key={aName}
                      className="px-3 py-3 text-center text-text-tertiary border-r border-border-secondary"
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
                    className={`px-1 py-1 text-center border-r border-border-secondary ${
                      canEdit && !grade.isFinal ? 'cursor-text' : ''
                    }`}
                    onClick={() =>
                      handleCellClick(grade.gradeId, aName, assignment.earnedPoints, grade.isFinal)
                    }
                  >
                    {isEditing ? (
                      <input
                        ref={inputRef}
                        type="number"
                        value={editingCell.value}
                        onChange={(e) =>
                          setEditingCell((prev) =>
                            prev ? { ...prev, value: e.target.value } : null
                          )
                        }
                        onBlur={() => handleCellSave(grade, aName, editingCell.value)}
                        onKeyDown={(e) => handleKeyDown(e, grade, aName)}
                        className="w-16 px-1.5 py-1 bg-white dark:bg-surface-secondary border-2 border-teal-500 rounded text-sm text-center text-text-primary focus:outline-none"
                        min={0}
                        step="any"
                      />
                    ) : (
                      <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${getGradeColor(pct)}`}>
                        {assignment.earnedPoints}/{assignment.possiblePoints}
                      </span>
                    )}
                  </td>
                )
              })}
              {/* Add Assignment spacer */}
              {canEdit && onAddAssignment && (
                <td className="border-r border-border-secondary" />
              )}
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
