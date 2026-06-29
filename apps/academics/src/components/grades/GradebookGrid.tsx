/**
 * GradebookGrid Component
 *
 * Interactive spreadsheet-like grid for viewing and editing section grades.
 * Merges section roster with grade data to show ALL enrolled students.
 * Supports inline cell editing with auto-save on blur/Tab.
 */

import { useState, useMemo, useRef, useCallback } from 'react'
import { GraduationCap, Lock, Plus, FileText } from 'lucide-react'
import { useRecordGrade } from '../../hooks/useGrades'
import { UserAvatar } from '../common/UserAvatar'
import type { GradeRecord } from '../../services/academics.service'
import type { StudentSectionResponseDto } from '@aibrains/shared-types'
import { useAcademicsI18n } from '../../lib/i18n'

// ============================================================================
// TYPES
// ============================================================================

interface GradebookGridProps {
  grades: GradeRecord[]
  roster: StudentSectionResponseDto[]
  isLoading: boolean
  sectionId?: string
  courseId?: string
  courseName?: string
  schoolId?: string
  termId?: string
  academicYearId?: string
  teacherId?: string
  disabled?: boolean
  onAddAssignment?: () => void
  onViewReportCard?: (studentId: string, studentName: string) => void
}

interface MergedStudent {
  studentId: string
  studentName: string
  grade: GradeRecord | null
}

interface EditingCell {
  studentId: string
  assignmentName: string
  value: string
}

// ============================================================================
// HELPERS
// ============================================================================

function getGradeColor(percentage: number): string {
  if (percentage >= 90) return 'text-[rgb(var(--state-success-fg))]'
  if (percentage >= 80) return 'text-[rgb(var(--state-info-fg))]'
  if (percentage >= 70) return 'text-[rgb(var(--state-warning-fg))]'
  if (percentage >= 60) return 'text-[rgb(var(--state-warning-fg))]'
  return 'text-[rgb(var(--state-danger-fg))]'
}

function getGradeBg(percentage: number): string {
  if (percentage >= 90) return 'bg-[rgb(var(--state-success-bg)/0.18)] dark:bg-[rgb(var(--state-success-bg)/0.18)]'
  if (percentage >= 80) return 'bg-[rgb(var(--state-info-bg)/0.18)] dark:bg-[rgb(var(--state-info-bg)/0.18)]'
  if (percentage >= 70) return 'bg-amber-50 dark:bg-[rgb(var(--state-warning-fg))]/10'
  if (percentage >= 60) return 'bg-[rgb(var(--state-warning-bg)/0.18)] dark:bg-[rgb(var(--state-warning-fg))]/10'
  return 'bg-[rgb(var(--state-danger-bg)/0.18)] dark:bg-[rgb(var(--state-danger-bg)/0.18)]'
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GradebookGrid({
  grades,
  roster,
  isLoading,
  sectionId,
  courseId,
  courseName,
  schoolId,
  termId,
  academicYearId,
  teacherId,
  disabled,
  onViewReportCard,
  onAddAssignment,
}: GradebookGridProps) {
  const { t, formatNumber } = useAcademicsI18n()
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelledRef = useRef(false)
  const recordGradeMutation = useRecordGrade()

  // Can we edit? Need all required context props
  const canEdit = !disabled && !!sectionId && !!courseId && !!schoolId && !!termId && !!academicYearId && !!teacherId

  // Merge roster with grade data — show ALL enrolled students
  const mergedStudents = useMemo<MergedStudent[]>(() => {
    const gradeMap = new Map(grades.map((g) => [g.studentId, g]))
    const rosterIds = new Set(roster.map((s) => s.studentId))

    // Start with roster students (in roster order)
    const result: MergedStudent[] = roster.map((s, idx) => ({
      studentId: s.studentId,
      studentName: s.studentName || s.studentNumber || `${t('gradesModule.gradebook.student')} #${formatNumber(idx + 1)}`,
      grade: gradeMap.get(s.studentId) || null,
    }))

    // Add any students with grades but not in current roster (e.g., transferred)
    grades.forEach((g) => {
      if (!rosterIds.has(g.studentId)) {
        result.push({
          studentId: g.studentId,
          studentName: g.studentName || `${t('gradesModule.gradebook.student')} (transferred)`,
          grade: g,
        })
      }
    })

    return result
  }, [roster, grades, t, formatNumber])

  // Get unique assignment names with metadata for tooltips (Ticket 3.1)
  const assignmentColumns = useMemo(() => {
    const seen = new Map<string, { name: string; categoryId?: string; possiblePoints: number; dueDate?: string }>()
    grades.forEach((grade) => {
      grade.assignments?.forEach((a) => {
        if (!seen.has(a.assignmentName)) {
          seen.set(a.assignmentName, {
            name: a.assignmentName,
            categoryId: a.categoryId,
            possiblePoints: a.possiblePoints,
            dueDate: a.gradedAt,
          })
        }
      })
    })
    return Array.from(seen.values())
  }, [grades])
  const assignmentNames = useMemo(() => assignmentColumns.map((c) => c.name), [assignmentColumns])

  const handleCellClick = useCallback(
    (studentId: string, assignmentName: string, currentValue: number | undefined, isFinal: boolean) => {
      if (!canEdit || isFinal) return
      setEditingCell({
        studentId,
        assignmentName,
        value: currentValue !== undefined ? String(currentValue) : '',
      })
      setTimeout(() => inputRef.current?.focus(), 0)
    },
    [canEdit]
  )

  const handleCellSave = useCallback(
    (student: MergedStudent, assignmentName: string, newValue: string) => {
      setEditingCell(null)
      if (!canEdit) return

      const earnedPoints = Number(newValue)
      if (newValue === '' || isNaN(earnedPoints) || earnedPoints < 0) return

      const assignment = student.grade?.assignments?.find((a) => a.assignmentName === assignmentName)

      // Skip save if value unchanged
      if (assignment && assignment.earnedPoints === earnedPoints) return

      // If the assignment exists on this student's grade, use its metadata.
      // Otherwise, find the assignment metadata from any other student's grade.
      const assignmentMeta = assignment
        || grades.flatMap((g) => g.assignments || []).find((a) => a.assignmentName === assignmentName)

      if (!assignmentMeta) return

      recordGradeMutation.mutate({
        studentId: student.studentId,
        studentName: student.studentName,
        courseId: courseId!,
        courseName,
        sectionId: sectionId!,
        schoolId: schoolId!,
        termId: termId!,
        academicYearId: academicYearId!,
        teacherId: teacherId!,
        assignment: {
          assignmentId: assignmentMeta.assignmentId,
          assignmentName: assignmentMeta.assignmentName,
          assignmentType: assignmentMeta.assignmentType,
          categoryId: assignmentMeta.categoryId,
          possiblePoints: assignmentMeta.possiblePoints,
          earnedPoints,
        },
      })
    },
    [canEdit, courseId, courseName, sectionId, schoolId, termId, academicYearId, teacherId, recordGradeMutation, grades]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, student: MergedStudent, assignmentName: string) => {
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        handleCellSave(student, assignmentName, editingCell?.value ?? '')

        // Move to next cell on Tab
        if (e.key === 'Tab') {
          const currentAssignmentIdx = assignmentNames.indexOf(assignmentName)
          const currentStudentIdx = mergedStudents.findIndex((s) => s.studentId === student.studentId)

          if (!e.shiftKey) {
            // Move right, then wrap to next row
            if (currentAssignmentIdx < assignmentNames.length - 1) {
              const nextAssignment = assignmentNames[currentAssignmentIdx + 1]
              const nextA = student.grade?.assignments?.find((a) => a.assignmentName === nextAssignment)
              handleCellClick(student.studentId, nextAssignment, nextA?.earnedPoints, student.grade?.isFinal ?? false)
            } else if (currentStudentIdx < mergedStudents.length - 1) {
              const nextStudent = mergedStudents[currentStudentIdx + 1]
              const firstA = nextStudent.grade?.assignments?.find((a) => a.assignmentName === assignmentNames[0])
              handleCellClick(nextStudent.studentId, assignmentNames[0], firstA?.earnedPoints, nextStudent.grade?.isFinal ?? false)
            }
          } else {
            // Shift+Tab: move left, then wrap to previous row
            if (currentAssignmentIdx > 0) {
              const prevAssignment = assignmentNames[currentAssignmentIdx - 1]
              const prevA = student.grade?.assignments?.find((a) => a.assignmentName === prevAssignment)
              handleCellClick(student.studentId, prevAssignment, prevA?.earnedPoints, student.grade?.isFinal ?? false)
            } else if (currentStudentIdx > 0) {
              const prevStudent = mergedStudents[currentStudentIdx - 1]
              const lastAssignment = assignmentNames[assignmentNames.length - 1]
              const lastA = prevStudent.grade?.assignments?.find((a) => a.assignmentName === lastAssignment)
              handleCellClick(prevStudent.studentId, lastAssignment, lastA?.earnedPoints, prevStudent.grade?.isFinal ?? false)
            }
          }
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        // Up/Down arrow navigation between students in the same column (Ticket 3.3)
        e.preventDefault()
        handleCellSave(student, assignmentName, editingCell?.value ?? '')

        const currentStudentIdx = mergedStudents.findIndex((s) => s.studentId === student.studentId)
        const nextIdx = e.key === 'ArrowDown'
          ? Math.min(currentStudentIdx + 1, mergedStudents.length - 1)
          : Math.max(currentStudentIdx - 1, 0)

        if (nextIdx !== currentStudentIdx) {
          const nextStudent = mergedStudents[nextIdx]
          const nextA = nextStudent.grade?.assignments?.find((a) => a.assignmentName === assignmentName)
          handleCellClick(nextStudent.studentId, assignmentName, nextA?.earnedPoints, nextStudent.grade?.isFinal ?? false)
        }
      } else if (e.key === 'Escape') {
        cancelledRef.current = true
        setEditingCell(null)
      }
    },
    [editingCell, assignmentNames, mergedStudents, handleCellSave, handleCellClick]
  )

  const handleBlur = useCallback(
    (student: MergedStudent, assignmentName: string, value: string) => {
      if (cancelledRef.current) {
        cancelledRef.current = false
        setEditingCell(null)
        return
      }
      handleCellSave(student, assignmentName, value)
    },
    [handleCellSave]
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

  if (mergedStudents.length === 0) {
    return (
      <div className="py-16 text-center">
        <GraduationCap className="w-10 h-10 mx-auto text-text-tertiary mb-3" />
        <h4 className="text-sm font-medium text-text-primary mb-1">
          {t('gradesModule.gradebook.noStudentsTitle')}
        </h4>
        <p className="text-xs text-text-tertiary max-w-sm mx-auto">
          {t('gradesModule.gradebook.noStudentsDescription')}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-auto max-h-[calc(100vh-15rem)] rounded-xl border border-border-secondary">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-secondary">
            {/* Frozen student column (sticky on both axes — top-left corner) */}
            <th className="sticky left-0 top-0 z-20 bg-surface-secondary px-4 py-3 text-left font-semibold text-text-primary border-r border-border-secondary min-w-52">
              {t('gradesModule.gradebook.student')}
            </th>
            {/* Assignment columns with tooltips (Ticket 3.1) */}
            {assignmentColumns.map((col) => (
              <th
                key={col.name}
                className="sticky top-0 z-10 bg-surface-secondary px-3 py-3 text-center font-medium text-text-secondary min-w-24 border-r border-border-secondary group relative"
                title={`${col.name}\n${col.categoryId ? `Category: ${col.categoryId}` : ''}\nPoints: ${col.possiblePoints}`}
              >
                <div className="truncate max-w-32">{col.name}</div>
                <div className="text-xs text-text-tertiary font-normal mt-0.5">
                  {t('gradesModule.gradebook.pointsShort', { points: formatNumber(col.possiblePoints) })}
                </div>
              </th>
            ))}
            {/* Add Assignment column */}
            {canEdit && onAddAssignment && (
              <th className="sticky top-0 z-10 bg-surface-secondary px-2 py-3 text-center border-r border-border-secondary min-w-16">
                <button
                  type="button"
                  onClick={onAddAssignment}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[rgb(var(--action-secondary-fg))] hover:bg-[rgb(var(--state-info-bg)/0.18)] dark:hover:bg-[rgb(var(--state-info-bg)/0.18)] rounded transition-colors"
                  title={t('gradesModule.gradebook.addAssignment')}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </th>
            )}
            {/* Overall Grade */}
            <th className="sticky top-0 z-10 px-4 py-3 text-center font-semibold text-text-primary min-w-24 bg-surface-hover">
              {t('gradesModule.gradebook.overall')}
            </th>
            <th className="sticky top-0 z-10 px-4 py-3 text-center font-semibold text-text-primary min-w-20 bg-surface-hover">
              {t('gradesModule.reportCard.letter')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-secondary">
          {mergedStudents.map((student) => {
            const grade = student.grade
            const isFinal = grade?.isFinal ?? false

            return (
              <tr key={student.studentId} className="group hover:bg-surface-secondary/50 transition-colors">
                {/* Student name */}
                <td className="sticky left-0 z-10 bg-surface-primary px-4 py-2.5 border-r border-border-secondary">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar
                      userId={student.studentId}
                      userName={student.studentName}
                      size="sm"
                    />
                    <span className="font-medium text-text-primary truncate">
                      {student.studentName}
                    </span>
                    {isFinal && (
                      <Lock className="w-3 h-3 text-text-tertiary flex-shrink-0" aria-label={t('gradesModule.gradebook.gradeFinalized')} />
                    )}
                    {onViewReportCard && (
                      <button
                        type="button"
                        onClick={() => onViewReportCard(student.studentId, student.studentName)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-text-tertiary hover:text-[rgb(var(--action-secondary-fg))] transition-all flex-shrink-0"
                        title={t('gradesModule.gradebook.viewReportCard')}
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
                {/* Assignment scores */}
                {assignmentNames.map((aName) => {
                  const assignment = grade?.assignments?.find(
                    (a) => a.assignmentName === aName
                  )
                  const isEditing =
                    editingCell?.studentId === student.studentId &&
                    editingCell?.assignmentName === aName

                  // No grade document at all, or assignment not on this student
                  if (!assignment || assignment.earnedPoints === undefined) {
                    return (
                      <td
                        key={aName}
                        className={`px-3 py-3 text-center border-r border-border-secondary ${
                          !grade
                            ? 'bg-surface-secondary/20 text-text-tertiary'
                            : 'text-text-tertiary'
                        } ${canEdit && !isFinal ? 'cursor-text hover:bg-surface-hover/50' : ''}`}
                        onClick={() => {
                          if (canEdit && !isFinal) {
                            handleCellClick(student.studentId, aName, undefined, isFinal)
                          }
                        }}
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
                            onBlur={() => handleBlur(student, aName, editingCell.value)}
                            onKeyDown={(e) => handleKeyDown(e, student, aName)}
                            className="w-16 px-1.5 py-1 bg-[rgb(var(--background-primary))] dark:bg-surface-secondary border-2 border-[rgb(var(--border-focus))] rounded text-sm text-center text-text-primary focus:outline-none"
                            min={0}
                            step="any"
                          />
                        ) : (
                          <span className="text-text-tertiary">—</span>
                        )}
                      </td>
                    )
                  }

                  const pct = assignment.possiblePoints > 0
                    ? (assignment.earnedPoints / assignment.possiblePoints) * 100
                    : 0

                  return (
                    <td
                      key={aName}
                      className={`px-1 py-1 text-center border-r border-border-secondary ${getGradeBg(pct)} ${
                        canEdit && !isFinal ? 'cursor-text' : ''
                      }`}
                      onClick={() =>
                        handleCellClick(student.studentId, aName, assignment.earnedPoints, isFinal)
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
                          onBlur={() => handleBlur(student, aName, editingCell.value)}
                          onKeyDown={(e) => handleKeyDown(e, student, aName)}
                          className="w-16 px-1.5 py-1 bg-[rgb(var(--background-primary))] dark:bg-surface-secondary border-2 border-[rgb(var(--border-focus))] rounded text-sm text-center text-text-primary focus:outline-none"
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
                {grade && grade.assignments?.some(a => a.earnedPoints !== undefined) ? (
                  <>
                    <td className="px-4 py-3 text-center bg-surface-secondary/30">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-sm font-bold ${getGradeColor(grade.numericGrade)} ${getGradeBg(grade.numericGrade)}`}
                      >
                        {grade.numericGrade.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center bg-surface-secondary/30">
                      <span className="text-sm font-bold text-text-primary">
                        {grade.letterGrade || '—'}
                      </span>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-center bg-surface-secondary/20">
                      <span className="text-sm text-text-tertiary">—</span>
                    </td>
                    <td className="px-4 py-3 text-center bg-surface-secondary/20">
                      <span className="text-sm text-text-tertiary">—</span>
                    </td>
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
