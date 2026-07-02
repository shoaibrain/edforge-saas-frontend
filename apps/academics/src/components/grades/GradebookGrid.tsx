/**
 * GradebookGrid Component
 *
 * Interactive spreadsheet-like grid for viewing and editing section grades.
 * Merges section roster with grade data to show ALL enrolled students.
 * Assignment columns are grouped by the grading policy's weighted categories,
 * each with a Σ category subtotal; Student is frozen left, Overall % + Letter
 * frozen right. Supports inline cell editing with auto-save on blur/Tab —
 * the record flow (`useRecordGrade`) is unchanged.
 */

import { useState, useMemo, useRef, useCallback } from 'react'
import { GraduationCap, Lock, Plus, FileText, Inbox } from 'lucide-react'
import { StatusPill } from '@edforge/ui'
import { useRecordGrade } from '../../hooks/useGrades'
import { UserAvatar } from '../common/UserAvatar'
import type { GradeRecord } from '../../services/academics.service'
import type { StudentSectionResponseDto } from '@aibrains/shared-types'
import { useAcademicsI18n } from '../../lib/i18n'

// ============================================================================
// TYPES
// ============================================================================

interface CategoryWeight {
  categoryId: string
  categoryName: string
  weight: number
}

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
  /** Weighted categories from the section's grading policy — drives column grouping. */
  categoryWeights?: CategoryWeight[]
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

interface AssignmentColumn {
  name: string
  categoryId?: string
  possiblePoints: number
  dueDate?: string
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

/** Letter-pill tone from an overall percentage. */
function letterVariant(percentage: number): 'success' | 'info' | 'warning' | 'danger' {
  if (percentage >= 80) return 'success'
  if (percentage >= 70) return 'info'
  if (percentage >= 60) return 'warning'
  return 'danger'
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
  categoryWeights,
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

  // Unique assignment columns (de-duped by name), each carrying category metadata.
  const assignmentColumns = useMemo<AssignmentColumn[]>(() => {
    const seen = new Map<string, AssignmentColumn>()
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

  // Group assignment columns by the policy's weighted categories (ordered by the
  // policy). Columns whose category isn't in the policy fall into "Uncategorized".
  const categoryGroups = useMemo(() => {
    const catMeta = new Map(
      (categoryWeights ?? []).map((c, i) => [c.categoryId, { label: c.categoryName, weight: c.weight, order: i }]),
    )
    const groups = new Map<
      string,
      { key: string; label: string; weight: number | null; order: number; columns: AssignmentColumn[] }
    >()
    assignmentColumns.forEach((col) => {
      const key = col.categoryId ?? '__uncat__'
      if (!groups.has(key)) {
        const meta = col.categoryId ? catMeta.get(col.categoryId) : undefined
        groups.set(key, {
          key,
          label: meta?.label ?? t('gradesModule.gradebook.uncategorized'),
          weight: meta?.weight ?? null,
          order: meta?.order ?? 999,
          columns: [],
        })
      }
      groups.get(key)!.columns.push(col)
    })
    return Array.from(groups.values()).sort((a, b) => a.order - b.order)
  }, [assignmentColumns, categoryWeights, t])

  // Flat assignment-name order (grouped order) — drives keyboard navigation.
  const assignmentNames = useMemo(
    () => categoryGroups.flatMap((g) => g.columns.map((c) => c.name)),
    [categoryGroups],
  )

  // Per-student category subtotal % (null when the category has no scored work).
  const categorySubtotal = useCallback((grade: GradeRecord | null, columns: AssignmentColumn[]): number | null => {
    let got = 0
    let max = 0
    columns.forEach((col) => {
      const a = grade?.assignments?.find((x) => x.assignmentName === col.name)
      if (a && a.earnedPoints !== undefined) {
        got += a.earnedPoints
        max += a.possiblePoints
      }
    })
    return max > 0 ? Math.round((got / max) * 100) : null
  }, [])

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

  // One score cell (inline-editable) — used inside each category group.
  const renderScoreCell = useCallback(
    (student: MergedStudent, aName: string) => {
      const grade = student.grade
      const isFinal = grade?.isFinal ?? false
      const assignment = grade?.assignments?.find((a) => a.assignmentName === aName)
      const isEditing =
        editingCell?.studentId === student.studentId && editingCell?.assignmentName === aName

      const editInput = (
        <input
          ref={inputRef}
          type="number"
          value={editingCell?.value ?? ''}
          onChange={(e) => setEditingCell((prev) => (prev ? { ...prev, value: e.target.value } : null))}
          onBlur={() => handleBlur(student, aName, editingCell?.value ?? '')}
          onKeyDown={(e) => handleKeyDown(e, student, aName)}
          className="w-16 px-1.5 py-1 bg-[rgb(var(--background-primary))] dark:bg-surface-secondary border-2 border-[rgb(var(--border-focus))] rounded text-sm text-center text-text-primary focus:outline-none"
          min={0}
          step="any"
        />
      )

      // No grade document at all, or assignment not on this student → em-dash + warning dot.
      if (!assignment || assignment.earnedPoints === undefined) {
        return (
          <td
            key={aName}
            className={`px-3 py-3 text-center border-r border-border-secondary ${
              !grade ? 'bg-surface-secondary/20 text-text-tertiary' : 'text-text-tertiary'
            } ${canEdit && !isFinal ? 'cursor-text hover:bg-surface-hover/50' : ''}`}
            onClick={() => {
              if (canEdit && !isFinal) handleCellClick(student.studentId, aName, undefined, isFinal)
            }}
          >
            {isEditing ? (
              editInput
            ) : (
              <span className="inline-flex items-center gap-1 text-text-tertiary">
                <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--state-warning-fg))]" aria-hidden="true" />
                —
              </span>
            )}
          </td>
        )
      }

      const pct = assignment.possiblePoints > 0 ? (assignment.earnedPoints / assignment.possiblePoints) * 100 : 0

      return (
        <td
          key={aName}
          className={`px-1 py-1 text-center border-r border-border-secondary ${getGradeBg(pct)} ${
            canEdit && !isFinal ? 'cursor-text' : ''
          }`}
          onClick={() => handleCellClick(student.studentId, aName, assignment.earnedPoints, isFinal)}
        >
          {isEditing ? (
            editInput
          ) : (
            <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${getGradeColor(pct)}`}>
              {assignment.earnedPoints}/{assignment.possiblePoints}
            </span>
          )}
        </td>
      )
    },
    [editingCell, canEdit, handleBlur, handleKeyDown, handleCellClick]
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

  // No-assignment empty state — students exist but the section has no gradebook yet.
  if (assignmentColumns.length === 0) {
    return (
      <div className="rounded-xl border border-border-secondary py-16 px-6 text-center">
        <GraduationCap className="w-11 h-11 mx-auto text-text-tertiary mb-4" />
        <h4 className="text-base font-semibold text-text-primary mb-1.5">
          {t('gradesModule.gradebook.noGradebookTitle')}
        </h4>
        <p className="text-sm text-text-secondary max-w-md mx-auto mb-5">
          {t('gradesModule.gradebook.noGradebookDescription')}
        </p>
        {canEdit && onAddAssignment && (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={onAddAssignment}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('gradesModule.gradebook.addAssignment')}
            </button>
            <button
              type="button"
              onClick={onAddAssignment}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(var(--border-primary)/0.35)] px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
            >
              <Inbox className="w-4 h-4" />
              {t('gradesModule.gradebook.importFromTemplate')}
            </button>
          </div>
        )}
      </div>
    )
  }

  const subtotalHeadClass =
    'sticky top-0 z-10 bg-surface-secondary px-2 py-3 text-center font-semibold text-text-tertiary border-r border-border-secondary'

  return (
    <div className="overflow-auto max-h-[calc(100vh-15rem)] rounded-xl border border-border-secondary">
      <table className="w-full text-sm">
        <thead>
          {/* Row 1 — category band */}
          <tr className="bg-surface-secondary">
            <th
              rowSpan={2}
              className="sticky left-0 top-0 z-30 bg-surface-secondary px-4 py-3 text-left font-semibold text-text-primary border-r border-border-secondary min-w-52"
            >
              {t('gradesModule.gradebook.student')}
            </th>
            {categoryGroups.map((g) => (
              <th
                key={g.key}
                colSpan={g.columns.length + 1}
                className="sticky top-0 z-10 bg-surface-secondary px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-text-secondary border-r border-b border-border-secondary"
              >
                {g.label}
                {g.weight != null ? ` · ${formatNumber(g.weight)}%` : ''}
              </th>
            ))}
            {canEdit && onAddAssignment && (
              <th
                rowSpan={2}
                className="sticky top-0 z-10 bg-surface-secondary px-2 py-3 text-center border-r border-border-secondary min-w-16"
              >
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
            <th
              rowSpan={2}
              className="sticky right-24 top-0 z-20 px-4 py-3 text-center font-semibold text-text-primary w-24 bg-surface-hover border-l border-border-secondary"
            >
              {t('gradesModule.gradebook.overall')}
            </th>
            <th
              rowSpan={2}
              className="sticky right-0 top-0 z-20 px-4 py-3 text-center font-semibold text-text-primary w-24 bg-surface-hover"
            >
              {t('gradesModule.reportCard.letter')}
            </th>
          </tr>
          {/* Row 2 — assignment columns + Σ subtotal per category */}
          <tr className="bg-surface-secondary">
            {categoryGroups.map((g) => (
              <ColumnHeaders key={g.key} columns={g.columns} pointsLabel={(pts) => t('gradesModule.gradebook.pointsShort', { points: formatNumber(pts) })} subtotalClass={subtotalHeadClass} />
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-secondary">
          {mergedStudents.map((student) => {
            const grade = student.grade
            const isFinal = grade?.isFinal ?? false
            const hasScored = !!grade && grade.assignments?.some((a) => a.earnedPoints !== undefined)

            return (
              <tr key={student.studentId} className="group hover:bg-surface-secondary/50 transition-colors">
                {/* Student name (frozen left) */}
                <td className="sticky left-0 z-10 bg-surface-primary px-4 py-2.5 border-r border-border-secondary">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar userId={student.studentId} userName={student.studentName} size="sm" />
                    <span className="font-medium text-text-primary truncate">{student.studentName}</span>
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
                {/* Score cells grouped by category, each followed by a Σ subtotal */}
                {categoryGroups.map((g) => {
                  const sub = categorySubtotal(grade, g.columns)
                  return (
                    <GroupCells
                      key={g.key}
                      columns={g.columns}
                      renderScoreCell={(name) => renderScoreCell(student, name)}
                      subtotal={sub}
                    />
                  )
                })}
                {/* Add-assignment spacer */}
                {canEdit && onAddAssignment && <td className="border-r border-border-secondary" />}
                {/* Overall % + Letter (frozen right) */}
                {hasScored && grade ? (
                  <>
                    <td className="sticky right-24 z-10 w-24 px-3 py-3 text-center bg-surface-secondary/95 border-l border-border-secondary">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-sm font-bold ${getGradeColor(grade.numericGrade)} ${getGradeBg(grade.numericGrade)}`}
                      >
                        {grade.numericGrade.toFixed(1)}%
                      </span>
                    </td>
                    <td className="sticky right-0 z-10 w-24 px-3 py-3 text-center bg-surface-secondary/95">
                      {grade.letterGrade ? (
                        <StatusPill variant={letterVariant(grade.numericGrade)} label={grade.letterGrade} />
                      ) : (
                        <span className="text-sm text-text-tertiary">—</span>
                      )}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="sticky right-24 z-10 w-24 px-3 py-3 text-center bg-surface-secondary/95 border-l border-border-secondary">
                      <span className="text-sm text-text-tertiary">—</span>
                    </td>
                    <td className="sticky right-0 z-10 w-24 px-3 py-3 text-center bg-surface-secondary/95">
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

// ============================================================================
// SUB-RENDERERS
// ============================================================================

/** Row-2 header cells for one category: each assignment column + a Σ header. */
function ColumnHeaders({
  columns,
  pointsLabel,
  subtotalClass,
}: {
  columns: AssignmentColumn[]
  pointsLabel: (points: number) => string
  subtotalClass: string
}) {
  return (
    <>
      {columns.map((col) => (
        <th
          key={col.name}
          className="sticky top-0 z-10 bg-surface-secondary px-3 py-3 text-center font-medium text-text-secondary min-w-24 border-r border-border-secondary"
          title={`${col.name} · ${col.possiblePoints}`}
        >
          <div className="truncate max-w-32">{col.name}</div>
          <div className="text-xs text-text-tertiary font-normal mt-0.5">{pointsLabel(col.possiblePoints)}</div>
        </th>
      ))}
      <th className={subtotalClass} title="Category subtotal">
        Σ
      </th>
    </>
  )
}

/** Body cells for one category: each score cell + the Σ subtotal cell. */
function GroupCells({
  columns,
  renderScoreCell,
  subtotal,
}: {
  columns: AssignmentColumn[]
  renderScoreCell: (assignmentName: string) => React.ReactNode
  subtotal: number | null
}) {
  return (
    <>
      {columns.map((col) => renderScoreCell(col.name))}
      <td className="px-2 py-3 text-center border-r border-border-secondary bg-surface-secondary/40">
        <span className="text-sm font-semibold text-text-secondary tabular-nums">
          {subtotal != null ? `${subtotal}%` : '—'}
        </span>
      </td>
    </>
  )
}
