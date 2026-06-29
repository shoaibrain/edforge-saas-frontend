/**
 * BulkGradeModal Component
 *
 * Modal for entering grades for an entire class on a single assignment.
 * Score entry mirrors the exams Scores-tab pattern: avatar rows, `/ max`
 * inputs, a name search, and a live entered-count.
 */

import { useState, useMemo, useEffect } from 'react'
import { Loader2, Save, Search } from 'lucide-react'
import { Modal, ModalFooter, Button, Field, Input, Select } from '@edforge/ui'
import { useRecordBulkGrades } from '../../hooks/useGrades'
import { useAcademicsI18n } from '../../lib/i18n'
import { ScoreEntryRow } from './ScoreEntryRow'
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
  { id: 'tests', labelKey: 'gradesModule.management.categories.tests' },
  { id: 'quizzes', labelKey: 'gradesModule.management.categories.quizzes' },
  { id: 'homework', labelKey: 'gradesModule.management.categories.homework' },
  { id: 'participation', labelKey: 'gradesModule.management.categories.participation' },
  { id: 'projects', labelKey: 'gradesModule.management.categories.projects' },
]

const PURPOSE_OPTIONS = [
  { value: '', labelKey: 'gradesModule.management.purposes.autoDetect' },
  { value: 'formative', labelKey: 'gradesModule.management.purposes.formative' },
  { value: 'summative', labelKey: 'gradesModule.management.purposes.summative' },
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
  const { t, formatNumber } = useAcademicsI18n()
  const displayCategories = categories?.length
    ? categories
    : DEFAULT_CATEGORIES.map((category) => ({
        id: category.id,
        label: t(category.labelKey),
      }))
  const purposeOptions = PURPOSE_OPTIONS.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }))
  const bulkMutation = useRecordBulkGrades()

  const [assignmentName, setAssignmentName] = useState('')
  const [categoryId, setCategoryId] = useState('homework')
  const [assessmentPurpose, setAssessmentPurpose] = useState<AssessmentCategory | ''>('')
  const [possiblePoints, setPossiblePoints] = useState('100')
  const [entries, setEntries] = useState<StudentGradeEntry[]>([])
  const [search, setSearch] = useState('')

  // Update entries when students are loaded or change
  useEffect(() => {
    if (students.length > 0) {
      setEntries((prev) => {
        // Preserve any already-entered scores
        const existingMap = new Map(prev.map((e) => [e.studentId, e.earnedPoints]))
        return students.map((s, idx) => ({
          studentId: s.studentId,
          studentName:
            s.studentName ||
            s.studentNumber ||
            t('gradesModule.management.studentFallbackNumbered', {
              number: formatNumber(idx + 1),
            }),
          earnedPoints: existingMap.get(s.studentId) ?? '',
        }))
      })
    }
  }, [students, t, formatNumber])

  const validEntries = useMemo(
    () => entries.filter((e) => e.earnedPoints !== '' && !isNaN(Number(e.earnedPoints))),
    [entries]
  )

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) => e.studentName.toLowerCase().includes(q))
  }, [entries, search])

  const maxPoints = Number(possiblePoints) || 0

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

  const isStudentsLoading = students.length === 0 && entries.length === 0

  return (
    <Modal open={open} onClose={onClose} title={t('gradesModule.management.recordGrades')} size="2xl">
      <div className="space-y-5">
        {/* Assignment Info */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Field label={t('gradesModule.management.assignmentName')} required>
              <Input
                value={assignmentName}
                onChange={(e) => setAssignmentName(e.target.value)}
                placeholder={t('gradesModule.management.assignmentPlaceholder')}
              />
            </Field>
          </div>
          <Field label={t('gradesModule.management.pointsPossible')} optionalText={null}>
            <Input
              type="number"
              value={possiblePoints}
              onChange={(e) => setPossiblePoints(e.target.value)}
              min={1}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label={t('gradesModule.management.category')}
            optionalText={null}
            value={categoryId}
            onChange={(v) => setCategoryId(v ?? 'homework')}
            options={displayCategories.map((c) => ({ value: c.id, label: c.label }))}
          />
          <Select
            label={t('gradesModule.management.assessmentPurpose')}
            optionalText={null}
            value={assessmentPurpose}
            onChange={(v) => setAssessmentPurpose((v ?? '') as AssessmentCategory | '')}
            options={purposeOptions}
          />
        </div>

        {/* Student Grade Entries */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-text-primary">
              {t('gradesModule.management.studentScores')}
            </h4>
            <span className="text-xs text-text-tertiary tabular-nums">
              {t('gradesModule.management.enteredCount', {
                entered: formatNumber(validEntries.length),
                total: formatNumber(entries.length),
              })}
            </span>
          </div>

          {!isStudentsLoading && entries.length > 8 && (
            <div className="mb-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('gradesModule.management.searchStudents')}
                prefix={<Search className="w-4 h-4" />}
              />
            </div>
          )}

          <div className="rounded-xl border border-border-secondary overflow-hidden divide-y divide-border-secondary max-h-[40vh] overflow-y-auto">
            {isStudentsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 animate-pulse">
                  <div className="h-7 w-40 bg-surface-hover rounded" />
                  <div className="h-8 w-20 bg-surface-hover rounded" />
                </div>
              ))
            ) : entries.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-text-tertiary">
                {t('gradesModule.management.noStudents')}
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-text-tertiary">
                {t('gradesModule.management.noStudentMatches', { search })}
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <ScoreEntryRow
                  key={entry.studentId}
                  studentId={entry.studentId}
                  studentName={entry.studentName}
                  value={entry.earnedPoints}
                  onChange={(v) => handlePointsChange(entry.studentId, v)}
                  maxPoints={maxPoints}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {t('actions.cancel')}
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={bulkMutation.isPending || !assignmentName.trim() || validEntries.length === 0}
        >
          {bulkMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {t('gradesModule.management.saveGrades', {
            count: formatNumber(validEntries.length),
          })}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
