/**
 * BulkGradeModal Component
 *
 * Modal for entering grades for an entire class on a single assignment.
 */

import { useState, useMemo } from 'react'
import { X, Loader2, Save } from 'lucide-react'
import { useRecordBulkGrades } from '../../hooks/useGrades'
import type { StudentSectionResponseDto } from '@edforge/shared-types'

// ============================================================================
// TYPES
// ============================================================================

interface BulkGradeModalProps {
  open: boolean
  onClose: () => void
  students: StudentSectionResponseDto[]
  sectionId: string
  courseId: string
  schoolId: string
  termId: string
  academicYearId: string
  teacherId: string
}

interface StudentGradeEntry {
  studentId: string
  studentName: string
  earnedPoints: string
}

const categoryOptions = [
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
  schoolId,
  termId,
  academicYearId,
  teacherId,
}: BulkGradeModalProps) {
  const bulkMutation = useRecordBulkGrades()

  const [assignmentName, setAssignmentName] = useState('')
  const [categoryId, setCategoryId] = useState('homework')
  const [possiblePoints, setPossiblePoints] = useState('100')
  const [entries, setEntries] = useState<StudentGradeEntry[]>(
    students.map((s) => ({
      studentId: s.studentId,
      studentName: s.studentName || s.studentId,
      earnedPoints: '',
    }))
  )

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
      sectionId,
      schoolId,
      termId,
      academicYearId,
      teacherId,
      assignment: {
        assignmentName: assignmentName.trim(),
        assignmentType: categoryId,
        categoryId,
        possiblePoints: Number(possiblePoints),
      },
      grades: validEntries.map((e) => ({
        studentId: e.studentId,
        earnedPoints: Number(e.earnedPoints),
      })),
    })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
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
                className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
                className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              {categoryOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
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
              {entries.map((entry) => (
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
                      className="w-20 px-2 py-1.5 bg-surface-secondary border border-border-secondary rounded text-sm text-center text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                    <span className="text-xs text-text-tertiary">/ {possiblePoints}</span>
                  </div>
                </div>
              ))}
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
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bulkMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Grades ({validEntries.length})
          </button>
        </div>
      </div>
    </div>
  )
}
