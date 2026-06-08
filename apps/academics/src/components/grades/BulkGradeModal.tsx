/**
 * BulkGradeModal Component
 *
 * Modal for entering grades for an entire class on a single assignment.
 */

import { useState, useMemo, useEffect } from 'react'
import { X, Loader2, Save } from 'lucide-react'
import { useRecordBulkGrades } from '../../hooks/useGrades'
import type { AssessmentCategory } from '../../services/academics.service'
import type { StudentSectionResponseDto } from '@aibrains/shared-types'

// ============================================================================
// TYPES
// ============================================================================

export interface BulkGradeModalProps {
  open: boolean
  onClose: () => void
  students: StudentSectionResponseDto[]
  sectionId: string
  courseId: string
  courseName?: string
  schoolId: string
  termId: string
  academicYearId: string
  teacherId: string
  categories?: { id: string; label: string }[]
}

interface StudentGradeEntry {
  studentId: string
  studentName: string
  earnedPoints: string
}

const DEFAULT_CATEGORIES = [
  { id: 'tests', label: 'Tests' },
  { id: 'quizzes', label: 'Quizzes' },
  { id: 'homework', label: 'Homework' },
  { id: 'participation', label: 'Participation' },
  { id: 'projects', label: 'Projects' },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function BulkGradeModal({
  open,
  onClose,
  students,
  sectionId,
  courseId,
  courseName,
  schoolId,
  termId,
  academicYearId,
  teacherId,
  categories,
}: BulkGradeModalProps) {
  const displayCategories = categories?.length ? categories : DEFAULT_CATEGORIES
  const bulkMutation = useRecordBulkGrades()

  const [assignmentName, setAssignmentName] = useState('')
  const [categoryId, setCategoryId] = useState('homework')
  const [assessmentPurpose, setAssessmentPurpose] = useState<AssessmentCategory | ''>('')
  const [possiblePoints, setPossiblePoints] = useState('100')
  const [entries, setEntries] = useState<StudentGradeEntry[]>([])

  // Update entries when students are loaded or change
  useEffect(() => {
    if (students.length > 0) {
      setEntries((prev) => {
        // Preserve any already-entered scores
        const existingMap = new Map(prev.map((e) => [e.studentId, e.earnedPoints]))
        return students.map((s, idx) => ({
          studentId: s.studentId,
          studentName: s.studentName || s.studentNumber || `Student #${idx + 1}`,
          earnedPoints: existingMap.get(s.studentId) ?? '',
        }))
      })
    }
  }, [students])

  const validEntries = useMemo(
    () => entries.filter((e) => e.earnedPoints !== '' && !isNaN(Number(e.earnedPoints))),
    [entries]
  )

  const handlePointsChange = (studentId: string, value: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.studentId === studentId ? { ...e, earnedPoints: value } : e))
    )
  }

  const handleSubmit = async () => {
    if (!assignmentName.trim() || validEntries.length === 0) return

    await bulkMutation.mutateAsync({
      courseId,
      courseName,
      sectionId,
      schoolId,
      termId,
      academicYearId,
      teacherId,
      assignment: {
        assignmentName: assignmentName.trim(),
        assignmentType: categoryId,
        categoryId,
        assessmentCategory: assessmentPurpose || undefined,
        possiblePoints: Number(possiblePoints),
      },
      grades: validEntries.map((e) => ({
        studentId: e.studentId,
        studentName: e.studentName,
        earnedPoints: Number(e.earnedPoints),
      })),
    })
    onClose()
  }

  if (!open) return null

  const isStudentsLoading = students.length === 0 && entries.length === 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(var(--background-overlay)/0.50)]">
      <div className="bg-surface-primary rounded-xl border border-border-secondary shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-secondary">
          <h3 className="text-lg font-semibold text-text-primary">
            Record Grades
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Assignment Info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1">
                Assignment Name *
              </label>
              <input
                type="text"
                value={assignmentName}
                onChange={(e) => setAssignmentName(e.target.value)}
                placeholder="e.g., Chapter 3 Quiz"
                className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Points Possible
              </label>
              <input
                type="number"
                value={possiblePoints}
                onChange={(e) => setPossiblePoints(e.target.value)}
                min={1}
                className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
              />
            </div>
          </div>

          <div className="flex items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
              >
                {displayCategories.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Assessment Purpose
              </label>
              <select
                value={assessmentPurpose}
                onChange={(e) => setAssessmentPurpose(e.target.value as AssessmentCategory | '')}
                className="px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
              >
                <option value="">Auto-detect</option>
                <option value="formative">Formative</option>
                <option value="summative">Summative</option>
              </select>
            </div>
          </div>

          {/* Student Grade Entries */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-text-primary">Student Scores</h4>
              <span className="text-xs text-text-tertiary">
                {validEntries.length} / {entries.length} entered
              </span>
            </div>
            <div className="rounded-xl border border-border-secondary overflow-hidden divide-y divide-border-secondary">
              {isStudentsLoading ? (
                /* Loading skeleton */
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 animate-pulse">
                    <div className="h-4 w-32 bg-surface-hover rounded" />
                    <div className="h-8 w-20 bg-surface-hover rounded" />
                  </div>
                ))
              ) : entries.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-text-tertiary">
                  No students enrolled in this section.
                </div>
              ) : (
                entries.map((entry) => (
                  <div
                    key={entry.studentId}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <span className="text-sm text-text-primary">{entry.studentName}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={entry.earnedPoints}
                        onChange={(e) => handlePointsChange(entry.studentId, e.target.value)}
                        placeholder="—"
                        min={0}
                        max={Number(possiblePoints) * 1.5}
                        className="w-20 px-2 py-1.5 bg-surface-secondary border border-border-secondary rounded text-sm text-center text-text-primary focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
                      />
                      <span className="text-xs text-text-tertiary">/ {possiblePoints}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-secondary">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-surface-secondary hover:bg-surface-hover rounded-lg transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={bulkMutation.isPending || !assignmentName.trim() || validEntries.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--state-info-bg)/0.18)]0 hover:bg-[rgb(var(--action-primary-bg-hover))] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bulkMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Grades ({validEntries.length})
          </button>
        </div>
      </div>
    </div>
  )
}
