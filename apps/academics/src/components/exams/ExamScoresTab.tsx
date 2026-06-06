/**
 * ExamScoresTab — score entry surface (EM-3.1).
 *
 * Subject-at-a-time layout: a subject picker at top, then a roster of all
 * active enrollments for the exam's academic year with a numeric input per
 * row. Edits are local until "Save Changes" — which bulk-POSTs only the
 * changed rows with a fresh correlationId.
 *
 * Gated to exam.status ∈ {scheduled, in_progress} per the backend
 * `acceptsScoreWrites` guard (mirrored client-side via `acceptsScoreWrites`).
 */

import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Lock, Save, Loader2, AlertCircle } from 'lucide-react'
import type {
  EnrollmentResponseDto,
  ExamCourseResponseDto,
  ExamResponseDto,
  ExamScoreResponseDto,
} from '@aibrains/shared-types'
import { useEnrollments, flattenEnrollmentPages } from '../../hooks/useEnrollments'
import { useExamCourses } from '../../hooks/useExamCourses'
import {
  useExamScores,
  useBulkExamScores,
} from '../../hooks/useExamScores'
import { acceptsScoreWrites } from '../../schemas/exam-state-machine'
import { getExamStatusMeta } from '../../schemas/exam.form'

const MAX_BULK = 250 // backend EXAM_SCORE_BULK_MAX_TOTAL

interface RowEdit {
  /** The current input string (lets us distinguish empty from 0). */
  text: string
  /** The numeric value, or null if blank. */
  value: number | null
}

function parseRow(text: string): { value: number | null; valid: boolean } {
  const t = text.trim()
  if (t === '') return { value: null, valid: true }
  const n = Number(t)
  if (!Number.isFinite(n)) return { value: null, valid: false }
  return { value: n, valid: true }
}

function uuidv4(): string {
  // crypto.randomUUID is available in all evergreen browsers + jsdom 22+.
  const c =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : null
  if (c) return c
  // Fallback (RFC4122 v4 via Math.random — fine for correlationId)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0
    const v = ch === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function ExamScoresTab({
  exam,
  canManage,
}: {
  exam: ExamResponseDto
  canManage: boolean
}) {
  const writable = canManage && acceptsScoreWrites(exam.status)

  const { data: examCoursesData, isLoading: subjectsLoading } = useExamCourses(exam.examId)
  const examCourses = useMemo(() => examCoursesData?.items ?? [], [examCoursesData])

  const [selectedExamCourseId, setSelectedExamCourseId] = useState<string>('')
  useEffect(() => {
    if (!selectedExamCourseId && examCourses[0]) {
      setSelectedExamCourseId(examCourses[0].examCourseId)
    }
  }, [examCourses, selectedExamCourseId])

  const selectedCourse: ExamCourseResponseDto | undefined = useMemo(
    () => examCourses.find((c) => c.examCourseId === selectedExamCourseId),
    [examCourses, selectedExamCourseId],
  )

  // Roster: active enrollments for the exam's academic year. Score entry
  // needs the full roster, so auto-page through the infinite query.
  const {
    data: enrollmentsData,
    isLoading: rosterLoading,
    hasNextPage: enrollmentsHasNextPage,
    isFetchingNextPage: enrollmentsFetchingNext,
    fetchNextPage: enrollmentsFetchNext,
  } = useEnrollments({
    schoolId: exam.schoolId,
    yearId: exam.academicYearId,
    filters: { status: 'active' },
    limit: 100,
    enabled: !!exam.schoolId && !!exam.academicYearId,
  })
  useEffect(() => {
    if (enrollmentsHasNextPage && !enrollmentsFetchingNext) {
      void enrollmentsFetchNext()
    }
  }, [enrollmentsHasNextPage, enrollmentsFetchingNext, enrollmentsFetchNext])
  const allEnrollments: EnrollmentResponseDto[] = useMemo(
    () => flattenEnrollmentPages(enrollmentsData),
    [enrollmentsData],
  )

  // ELS.9 — scope the roster to the exam's grade levels. Mirrors the backend
  // ELS.3 result-batch Lambda filter exactly (`enrollment.gradeLevel ∈
  // exam.gradeLevels`): the operator enters marks only against students who
  // actually sit this exam, so the score sheet can't create rows for
  // off-scope students (e.g. a Grade 8 child on a Grade 9/10 Send-Up).
  // Legacy exams with empty/undefined gradeLevels keep the full AY roster —
  // the same back-compat path the Lambda takes until ELS.4 backfill lands.
  const examGradeSet = useMemo(() => new Set(exam.gradeLevels ?? []), [exam.gradeLevels])
  const enrollments: EnrollmentResponseDto[] = useMemo(
    () =>
      examGradeSet.size === 0
        ? allEnrollments
        : allEnrollments.filter((e) => examGradeSet.has(e.gradeLevel)),
    [allEnrollments, examGradeSet],
  )

  // Existing scores for the picked subject.
  const { data: scoresData, isLoading: scoresLoading } = useExamScores(
    exam.examId,
    { schoolId: exam.schoolId, examCourseId: selectedExamCourseId },
    !!selectedExamCourseId,
  )
  const scoreByEnrollmentId = useMemo(() => {
    const m = new Map<string, ExamScoreResponseDto>()
    for (const s of scoresData?.items ?? []) m.set(s.enrollmentId, s)
    return m
  }, [scoresData])

  // Local edit state, keyed by enrollmentId.
  const [edits, setEdits] = useState<Record<string, RowEdit>>({})

  // Seed edits whenever the selected subject (or its persisted scores) changes.
  useEffect(() => {
    if (!selectedExamCourseId) return
    const seed: Record<string, RowEdit> = {}
    for (const e of enrollments) {
      const persisted = scoreByEnrollmentId.get(e.enrollmentId)
      const text = persisted ? String(persisted.rawScore) : ''
      seed[e.enrollmentId] = { text, value: persisted ? persisted.rawScore : null }
    }
    setEdits(seed)
  }, [selectedExamCourseId, enrollments, scoreByEnrollmentId])

  const maxMarks = selectedCourse?.maxMarks ?? 0

  // Validate + diff against persisted scores.
  const diffs = useMemo(() => {
    if (!selectedCourse) return { changes: [], invalidCount: 0, blanksCount: 0 }
    const changes: { enrollmentId: string; rawScore: number }[] = []
    let invalidCount = 0
    let blanksCount = 0
    for (const e of enrollments) {
      const row = edits[e.enrollmentId]
      if (!row) continue
      const { value, valid } = parseRow(row.text)
      if (!valid) {
        invalidCount++
        continue
      }
      if (value === null) {
        blanksCount++
        continue
      }
      if (value < 0 || value > maxMarks) {
        invalidCount++
        continue
      }
      const existing = scoreByEnrollmentId.get(e.enrollmentId)
      if (!existing || existing.rawScore !== value) {
        changes.push({ enrollmentId: e.enrollmentId, rawScore: value })
      }
    }
    return { changes, invalidCount, blanksCount }
  }, [edits, enrollments, scoreByEnrollmentId, selectedCourse, maxMarks])

  const bulkMutation = useBulkExamScores(exam.examId, exam.schoolId)

  const handleSave = async () => {
    if (!selectedExamCourseId) return
    if (diffs.changes.length === 0) return
    if (diffs.invalidCount > 0) return
    if (diffs.changes.length > MAX_BULK) {
      // Chunk so we never blow the 250 ceiling; each batch gets its own correlationId.
      for (let i = 0; i < diffs.changes.length; i += MAX_BULK) {
        const slice = diffs.changes.slice(i, i + MAX_BULK)
        try {
          await bulkMutation.mutateAsync({
            correlationId: uuidv4(),
            scores: slice.map((c) => ({
              examCourseId: selectedExamCourseId,
              enrollmentId: c.enrollmentId,
              rawScore: c.rawScore,
            })),
          })
        } catch {
          return
        }
      }
      return
    }
    try {
      await bulkMutation.mutateAsync({
        correlationId: uuidv4(),
        scores: diffs.changes.map((c) => ({
          examCourseId: selectedExamCourseId,
          enrollmentId: c.enrollmentId,
          rawScore: c.rawScore,
        })),
      })
    } catch {
      // toast handled in hook
    }
  }

  // Loading
  if (subjectsLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-surface-secondary" />
        ))}
      </div>
    )
  }

  // No subjects → nothing to score
  if (examCourses.length === 0) {
    return (
      <div className="rounded-xl border border-border-secondary p-10 text-center">
        <BookOpen className="w-10 h-10 mx-auto text-text-tertiary mb-3" />
        <h4 className="text-base font-medium text-text-primary mb-1">No subjects yet</h4>
        <p className="text-sm text-text-secondary">
          Add subjects in the Subjects tab before entering scores.
        </p>
      </div>
    )
  }

  const lockReason = !acceptsScoreWrites(exam.status)
    ? `Score entry is locked while the exam is ${getExamStatusMeta(exam.status).label}. Scores can only be entered or edited in Scheduled or In Progress.`
    : !canManage
      ? 'You do not have permission to edit scores.'
      : null

  return (
    <div className="space-y-4">
      {/* Subject picker + counts */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs font-medium text-text-tertiary">
          Subject
          <select
            value={selectedExamCourseId}
            onChange={(e) => setSelectedExamCourseId(e.target.value)}
            className="ml-2 rounded-lg border border-border-secondary bg-surface-primary px-3 py-2 text-sm text-text-primary"
          >
            {examCourses.map((c) => (
              <option key={c.examCourseId} value={c.examCourseId}>
                {c.courseName ?? c.courseCode ?? 'Subject'} ({c.maxMarks} max)
              </option>
            ))}
          </select>
        </label>
        <div className="text-xs text-text-tertiary">
          {enrollments.length} student{enrollments.length === 1 ? '' : 's'} · max {maxMarks}
          {selectedCourse?.passingMarks != null && (
            <> · pass {selectedCourse.passingMarks}</>
          )}
        </div>
      </div>

      {/* Lock notice */}
      {lockReason && (
        <div className="flex items-start gap-2 rounded-lg border border-border-secondary bg-surface-secondary/50 px-4 py-3 text-sm text-text-secondary">
          <Lock className="w-4 h-4 text-text-tertiary mt-0.5 flex-shrink-0" />
          <span>{lockReason}</span>
        </div>
      )}

      {/* Roster */}
      {rosterLoading || scoresLoading ? (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-surface-secondary" />
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <div className="rounded-xl border border-border-secondary p-10 text-center">
          <p className="text-sm text-text-secondary">
            {examGradeSet.size > 0 && allEnrollments.length > 0
              ? `No active students enrolled at this exam's grade level${
                  (exam.gradeLevels?.length ?? 0) === 1 ? '' : 's'
                } (${(exam.gradeLevels ?? []).join(', ')}).`
              : 'No active enrollments for this academic year.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border-secondary divide-y divide-border-secondary">
          {enrollments.map((e) => {
            const row = edits[e.enrollmentId] ?? { text: '', value: null }
            const parsed = parseRow(row.text)
            const tooHigh = parsed.valid && parsed.value != null && parsed.value > maxMarks
            const tooLow = parsed.valid && parsed.value != null && parsed.value < 0
            const showError = !parsed.valid || tooHigh || tooLow
            return (
              <div
                key={e.enrollmentId}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {e.studentName ?? 'Student'}
                  </p>
                  <p className="text-xs text-text-tertiary">Grade {e.gradeLevel}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={maxMarks}
                    step="any"
                    value={row.text}
                    disabled={!writable}
                    onChange={(ev) => {
                      const text = ev.target.value
                      setEdits((prev) => ({
                        ...prev,
                        [e.enrollmentId]: { text, value: parseRow(text).value },
                      }))
                    }}
                    className={`w-24 rounded-lg border bg-surface-primary px-2 py-1 text-sm tabular-nums text-right ${
                      showError
                        ? 'border-red-500 text-red-600'
                        : 'border-border-secondary text-text-primary'
                    } disabled:opacity-50`}
                    aria-label={`Score for ${e.studentName ?? 'student'}`}
                    aria-invalid={showError || undefined}
                  />
                  <span className="text-xs text-text-tertiary tabular-nums w-12">/ {maxMarks}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Save bar */}
      {writable && enrollments.length > 0 && (
        <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-xl border border-border-secondary bg-surface-primary/95 backdrop-blur px-4 py-3 shadow-sm">
          <div className="text-sm text-text-secondary">
            {diffs.invalidCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-red-600">
                <AlertCircle className="w-4 h-4" />
                {diffs.invalidCount} row{diffs.invalidCount === 1 ? '' : 's'} invalid (0–{maxMarks})
              </span>
            ) : diffs.changes.length === 0 ? (
              <span className="text-text-tertiary">No changes</span>
            ) : (
              <span>
                {diffs.changes.length} change{diffs.changes.length === 1 ? '' : 's'} pending
                {diffs.blanksCount > 0 && (
                  <span className="text-text-tertiary"> · {diffs.blanksCount} blank</span>
                )}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={
              bulkMutation.isPending ||
              diffs.changes.length === 0 ||
              diffs.invalidCount > 0
            }
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {bulkMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Scores
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
