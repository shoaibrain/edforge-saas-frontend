/**
 * AssignmentEditor Component
 *
 * Slide-over panel for creating assignments and optionally entering grades.
 * Score entry mirrors the exams Scores-tab pattern (avatar rows, `/ max`
 * inputs, name search). Supports bulk paste from spreadsheets (TSV).
 */

import { useState, useMemo } from 'react'
import { X, Loader2, Save, Plus, ClipboardPaste, BarChart2, Search } from 'lucide-react'
import { Button, Field, Input, Select, Textarea } from '@edforge/ui'
import { useRecordBulkGrades } from '../../hooks/useGrades'
import { useAcademicsI18n } from '../../lib/i18n'
import { ScoreEntryRow } from './ScoreEntryRow'
import type { AssessmentCategory } from '../../services/academics.service'
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
  { value: 'tests', labelKey: 'gradesModule.management.categories.tests' },
  { value: 'quizzes', labelKey: 'gradesModule.management.categories.quizzes' },
  { value: 'homework', labelKey: 'gradesModule.management.categories.homework' },
  { value: 'participation', labelKey: 'gradesModule.management.categories.participation' },
  { value: 'projects', labelKey: 'gradesModule.management.categories.projects' },
  { value: 'final', labelKey: 'gradesModule.management.categories.finalExam' },
  { value: 'other', labelKey: 'gradesModule.management.categories.other' },
]

const PURPOSE_OPTIONS = [
  { value: '', labelKey: 'gradesModule.management.purposes.autoDetect' },
  { value: 'formative', labelKey: 'gradesModule.management.purposes.formative' },
  { value: 'summative', labelKey: 'gradesModule.management.purposes.summative' },
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
  const { t, formatNumber, formatCount } = useAcademicsI18n()
  const displayCategories = categories?.length
    ? categories.map((c) => ({ value: c.id, label: c.label }))
    : DEFAULT_CATEGORY_OPTIONS.map((category) => ({
        value: category.value,
        label: t(category.labelKey),
      }))
  const purposeOptions = PURPOSE_OPTIONS.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }))
  const [assignmentName, setAssignmentName] = useState('')
  const [possiblePoints, setPossiblePoints] = useState('100')
  const [categoryId, setCategoryId] = useState('homework')
  const [assessmentPurpose, setAssessmentPurpose] = useState<AssessmentCategory | ''>('')
  const [dueDate, setDueDate] = useState('')
  const [showBulkPaste, setShowBulkPaste] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [search, setSearch] = useState('')

  // Per-student scores
  const [scores, setScores] = useState<Record<string, string>>({})

  const bulkGradeMutation = useRecordBulkGrades()

  const possiblePts = Number(possiblePoints) || 0

  // Count filled scores
  const filledCount = useMemo(() => {
    return Object.values(scores).filter((v) => v !== '' && !isNaN(Number(v))).length
  }, [scores])

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return students
    return students.filter((s) => (s.studentName || '').toLowerCase().includes(q))
  }, [students, search])

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
          s.studentName?.toLowerCase() === nameOrId.toLowerCase()
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
          assessmentCategory: assessmentPurpose || undefined,
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
          assessmentCategory: assessmentPurpose || undefined,
          possiblePoints: possiblePts,
        },
        grades,
      })
    }

    onClose()
  }

  const isSaving = bulkGradeMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgb(var(--background-overlay)/0.50)]">
      <div className="bg-surface-primary w-full max-w-lg h-full shadow-xl flex flex-col overflow-hidden border-s border-border-secondary">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-secondary">
          <h3 className="text-lg font-semibold text-text-primary">
            {t('gradesModule.management.newAssignment')}
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
            <Field label={t('gradesModule.management.assignmentName')} required>
              <Input
                value={assignmentName}
                onChange={(e) => setAssignmentName(e.target.value)}
                placeholder={t('gradesModule.management.assignmentPlaceholderAlt')}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label={t('gradesModule.management.category')}
                optionalText={null}
                value={categoryId}
                onChange={(v) => setCategoryId(v ?? 'homework')}
                options={displayCategories}
              />
              <Field label={t('gradesModule.management.pointsPossible')} optionalText={null}>
                <Input
                  type="number"
                  value={possiblePoints}
                  onChange={(e) => setPossiblePoints(e.target.value)}
                  min={1}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label={t('gradesModule.management.assessmentPurpose')}
                optionalText={null}
                value={assessmentPurpose}
                onChange={(v) => setAssessmentPurpose((v ?? '') as AssessmentCategory | '')}
                options={purposeOptions}
              />
              <Field label={t('gradesModule.management.dueDate')} optionalText={null}>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </Field>
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="bg-surface-secondary rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <BarChart2 className="w-3.5 h-3.5 text-[rgb(var(--action-secondary-fg))]" />
                <span className="text-xs font-semibold text-text-primary">
                  {formatCount('gradesModule.management.scoreStatistics', stats.count)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-text-tertiary">{t('gradesModule.management.stats.mean')}</span>
                  <p className="font-semibold text-text-primary">{stats.mean}</p>
                </div>
                <div>
                  <span className="text-text-tertiary">{t('gradesModule.management.stats.median')}</span>
                  <p className="font-semibold text-text-primary">{stats.median}</p>
                </div>
                <div>
                  <span className="text-text-tertiary">{t('gradesModule.management.stats.stdDev')}</span>
                  <p className="font-semibold text-text-primary">{stats.stdDev}</p>
                </div>
                <div>
                  <span className="text-text-tertiary">{t('gradesModule.management.stats.min')}</span>
                  <p className="font-semibold text-text-primary">{stats.min}</p>
                </div>
                <div>
                  <span className="text-text-tertiary">{t('gradesModule.management.stats.max')}</span>
                  <p className="font-semibold text-text-primary">{stats.max}</p>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Paste */}
          {showBulkPaste ? (
            <div className="space-y-2">
              <Field label={t('gradesModule.management.pasteScores')} optionalText={null}>
                <Textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={t('gradesModule.management.pasteScoresPlaceholder')}
                  rows={6}
                  className="font-mono"
                />
              </Field>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={handleBulkPaste}>
                  {t('gradesModule.management.apply')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowBulkPaste(false)
                    setPasteText('')
                  }}
                >
                  {t('actions.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowBulkPaste(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              {t('gradesModule.management.pasteFromSpreadsheet')}
            </button>
          )}

          {/* Student Scores */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary">
                {t('gradesModule.management.studentScores')}
              </span>
              <span className="text-xs text-text-tertiary tabular-nums">
                {t('gradesModule.management.enteredCount', {
                  entered: formatNumber(filledCount),
                  total: formatNumber(students.length),
                })}
              </span>
            </div>

            {students.length > 8 && (
              <div className="mb-2">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('gradesModule.management.searchStudents')}
                  prefix={<Search className="w-4 h-4" />}
                />
              </div>
            )}

            {students.length === 0 ? (
              <div className="border border-border-secondary rounded-lg divide-y divide-border-secondary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5 animate-pulse">
                    <div className="h-7 w-32 bg-surface-hover rounded" />
                    <div className="h-8 w-20 bg-surface-hover rounded" />
                  </div>
                ))}
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="border border-border-secondary rounded-lg px-4 py-8 text-center text-sm text-text-tertiary">
                {t('gradesModule.management.noStudentMatches', { search })}
              </div>
            ) : (
              <div className="border border-border-secondary rounded-lg divide-y divide-border-secondary max-h-72 overflow-y-auto">
                {filteredStudents.map((student) => (
                  <ScoreEntryRow
                    key={student.studentId}
                    studentId={student.studentId}
                    studentName={
                      student.studentName ||
                      student.studentNumber ||
                      t('gradesModule.management.studentFallback')
                    }
                    value={scores[student.studentId] ?? ''}
                    onChange={(v) => handleScoreChange(student.studentId, v)}
                    maxPoints={possiblePts}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border-secondary">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={isSaving || !assignmentName.trim() || possiblePts <= 0 || students.length === 0}
          >
            {isSaving ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Plus className="w-4 h-4 me-2" />}
            {t('gradesModule.management.createAssignment')}
          </Button>
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('actions.cancel')}
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSaving || !assignmentName.trim() || possiblePts <= 0 || filledCount === 0}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 me-2" />
              )}
              {formatCount('gradesModule.management.saveWithScores', filledCount)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
