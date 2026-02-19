/**
 * AssignmentEditor Component
 *
 * Slide-over panel for creating assignments and optionally entering grades.
 * Supports bulk paste from spreadsheets (tab-separated values).
 */

import { useState, useMemo } from 'react'
import { X, Loader2, Save, Plus, ClipboardPaste, BarChart2 } from 'lucide-react'
import { useRecordBulkGrades } from '../../hooks/useGrades'
import type { StudentSectionResponseDto } from '@aibrains/shared-types'

// ============================================================================
// TYPES
// ============================================================================

interface AssignmentEditorProps {
  onClose: () => void
  sectionId: string
  courseId: string
  schoolId: string
  termId: string
  academicYearId: string
  teacherId: string
  students: StudentSectionResponseDto[]
  categories?: { id: string; label: string }[]
}

const DEFAULT_CATEGORY_OPTIONS = [
  { value: 'tests', label: 'Tests' },
  { value: 'quizzes', label: 'Quizzes' },
  { value: 'homework', label: 'Homework' },
  { value: 'participation', label: 'Participation' },
  { value: 'projects', label: 'Projects' },
  { value: 'final', label: 'Final Exam' },
  { value: 'other', label: 'Other' },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function AssignmentEditor({
  onClose,
  sectionId,
  courseId,
  schoolId,
  termId,
  academicYearId,
  teacherId,
  students,
  categories,
}: AssignmentEditorProps) {
  const displayCategories = categories?.length
    ? categories.map((c) => ({ value: c.id, label: c.label }))
    : DEFAULT_CATEGORY_OPTIONS
  const [assignmentName, setAssignmentName] = useState('')
  const [possiblePoints, setPossiblePoints] = useState('100')
  const [categoryId, setCategoryId] = useState('homework')
  const [dueDate, setDueDate] = useState('')
  const [showBulkPaste, setShowBulkPaste] = useState(false)
  const [pasteText, setPasteText] = useState('')

  // Per-student scores
  const [scores, setScores] = useState<Record<string, string>>({})

  const bulkGradeMutation = useRecordBulkGrades()

  const possiblePts = Number(possiblePoints) || 0

  // Count filled scores
  const filledCount = useMemo(() => {
    return Object.values(scores).filter(
      (v) => v !== '' && !isNaN(Number(v))
    ).length
  }, [scores])

  // Statistics from entered scores
  const stats = useMemo(() => {
    const values = Object.values(scores)
      .map(Number)
      .filter((v) => !isNaN(v) && v >= 0)
    if (values.length === 0) return null

    const sorted = [...values].sort((a, b) => a - b)
    const sum = values.reduce((a, b) => a + b, 0)
    const mean = sum / values.length
    const median =
      values.length % 2 === 0
        ? (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2
        : sorted[Math.floor(values.length / 2)]
    const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length
    const stdDev = Math.sqrt(variance)

    return {
      count: values.length,
      mean: mean.toFixed(1),
      median: median.toFixed(1),
      min: sorted[0].toFixed(1),
      max: sorted[sorted.length - 1].toFixed(1),
      stdDev: stdDev.toFixed(1),
    }
  }, [scores])

  const handleScoreChange = (studentId: string, value: string) => {
    setScores((prev) => ({ ...prev, [studentId]: value }))
  }

  const handleBulkPaste = () => {
    if (!pasteText.trim()) return

    const lines = pasteText.trim().split('\n')
    const newScores: Record<string, string> = { ...scores }

    for (const line of lines) {
      const parts = line.split('\t')
      if (parts.length < 2) continue

      const nameOrId = parts[0].trim()
      const score = parts[1].trim()

      // Try matching by student name or ID
      const student = students.find(
        (s) =>
          s.studentId === nameOrId ||
          (s.studentName?.toLowerCase() === nameOrId.toLowerCase())
      )
      if (student && !isNaN(Number(score))) {
        newScores[student.studentId] = score
      }
    }

    setScores(newScores)
    setShowBulkPaste(false)
    setPasteText('')
  }

  const handleSubmit = async (saveAssignmentOnly = false) => {
    if (!assignmentName.trim() || possiblePts <= 0) return

    if (saveAssignmentOnly) {
      // Create assignment column for all rostered students without scores
      if (students.length === 0) return

      await bulkGradeMutation.mutateAsync({
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
          possiblePoints: possiblePts,
        },
        grades: students.map((s) => ({
          studentId: s.studentId,
          studentName: s.studentName,
          earnedPoints: undefined,
        })),
      })
    } else {
      // Save with entered scores
      const grades = Object.entries(scores)
        .filter(([, v]) => v !== '' && !isNaN(Number(v)))
        .map(([studentId, earned]) => {
          const student = students.find((s) => s.studentId === studentId)
          return {
            studentId,
            studentName: student?.studentName,
            earnedPoints: Number(earned),
          }
        })

      if (grades.length === 0) return

      await bulkGradeMutation.mutateAsync({
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
          possiblePoints: possiblePts,
        },
        grades,
      })
    }

    onClose()
  }

  const isSaving = bulkGradeMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <div className="bg-surface-primary w-full max-w-md h-full shadow-xl flex flex-col overflow-hidden border-l border-border-secondary">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-secondary">
          <h3 className="text-lg font-semibold text-text-primary">
            New Assignment
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Assignment Details */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Assignment Name *
              </label>
              <input
                type="text"
                value={assignmentName}
                onChange={(e) => setAssignmentName(e.target.value)}
                placeholder="e.g., Chapter 5 Quiz"
                className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  {displayCategories.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Points Possible
                </label>
                <input
                  type="number"
                  value={possiblePoints}
                  onChange={(e) => setPossiblePoints(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  min={1}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="bg-surface-secondary rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <BarChart2 className="w-3.5 h-3.5 text-teal-500" />
                <span className="text-xs font-semibold text-text-primary">
                  Score Statistics ({stats.count} entered)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-text-tertiary">Mean</span>
                  <p className="font-semibold text-text-primary">{stats.mean}</p>
                </div>
                <div>
                  <span className="text-text-tertiary">Median</span>
                  <p className="font-semibold text-text-primary">{stats.median}</p>
                </div>
                <div>
                  <span className="text-text-tertiary">Std Dev</span>
                  <p className="font-semibold text-text-primary">{stats.stdDev}</p>
                </div>
                <div>
                  <span className="text-text-tertiary">Min</span>
                  <p className="font-semibold text-text-primary">{stats.min}</p>
                </div>
                <div>
                  <span className="text-text-tertiary">Max</span>
                  <p className="font-semibold text-text-primary">{stats.max}</p>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Paste */}
          {showBulkPaste ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">
                Paste Scores (Name{'\t'}Score per line)
              </label>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={"John Smith\t95\nJane Doe\t88"}
                rows={6}
                className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleBulkPaste}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkPaste(false)
                    setPasteText('')
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-text-secondary bg-surface-secondary hover:bg-surface-hover rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowBulkPaste(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              Paste scores from spreadsheet
            </button>
          )}

          {/* Student Scores */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary">
                Student Scores
              </span>
              <span className="text-xs text-text-tertiary">
                {filledCount} / {students.length} entered
              </span>
            </div>

            {students.length === 0 ? (
              <div className="border border-border-secondary rounded-lg divide-y divide-border-secondary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5 animate-pulse">
                    <div className="h-4 w-28 bg-surface-hover rounded" />
                    <div className="h-7 w-20 bg-surface-hover rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-border-secondary rounded-lg divide-y divide-border-secondary max-h-[300px] overflow-y-auto">
                {students.map((student) => (
                  <div
                    key={student.studentId}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <span className="text-sm text-text-primary truncate mr-2">
                      {student.studentName || student.studentNumber || `Student`}
                    </span>
                    <input
                      type="number"
                      value={scores[student.studentId] ?? ''}
                      onChange={(e) =>
                        handleScoreChange(student.studentId, e.target.value)
                      }
                      placeholder="—"
                      className="w-20 px-2 py-1 bg-surface-secondary border border-border-secondary rounded text-sm text-text-primary text-right focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      min={0}
                      max={possiblePts * 1.5}
                      step="any"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border-secondary">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isSaving || !assignmentName.trim() || possiblePts <= 0 || students.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 dark:text-teal-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Assignment
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-surface-secondary hover:bg-surface-hover rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSaving || !assignmentName.trim() || possiblePts <= 0 || filledCount === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save with Scores ({filledCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
