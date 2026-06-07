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

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { BookOpen, Lock, Save, Loader2, AlertCircle, Users } from 'lucide-react'
import type {
  EnrollmentResponseDto,
  ExamComponentDto,
  ExamCourseResponseDto,
  ExamResponseDto,
  ExamScoreResponseDto,
} from '@aibrains/shared-types'
import { TanstackDataTable, type ColumnDef } from '@edforge/ui'
import { useEnrollments, flattenEnrollmentPages } from '../../hooks/useEnrollments'
import { useExamCourses } from '../../hooks/useExamCourses'
import {
  useExamScores,
  useBulkExamScores,
} from '../../hooks/useExamScores'
import { acceptsScoreWrites } from '../../schemas/exam-state-machine'
import { getExamStatusMeta } from '../../schemas/exam.form'
import { UserAvatar } from '../common/UserAvatar'
import { evalComponents, sameComponentScores } from './exam-scoring'

const MAX_BULK = 250 // backend EXAM_SCORE_BULK_MAX_TOTAL

/**
 * Enrollment statuses that count as "currently on the roster" for score entry.
 * Mirrors the app-wide `isActive` definition in EnrollmentTable.tsx — the
 * canonical active status is `'enrolled'`, NOT the literal `'active'`. Used to
 * filter the score roster client-side (the server-side `status=active` filter
 * matches zero rows and breaks pagination — see the roster load below).
 */
const ACTIVE_ENROLLMENT_STATUSES = new Set(['enrolled', 'active', 'pending'])

interface RowEdit {
  /** The current input string (lets us distinguish empty from 0). */
  text: string
  /** The numeric value, or null if blank. */
  value: number | null
  /**
   * P1.5b — per-component input text keyed by component code, used only when the
   * selected subject is split (Theory/Practical/…). The single `text`/`value`
   * fields are unused in that mode; rawScore = Σ component values at save.
   */
  components?: Record<string, string>
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

// ============================================================================
// SCORE CELL — editable input inside the roster table
//
// The score inputs are bound to component-level `edits` state. To keep them
// editable inside the data table WITHOUT rebuilding the `columns` array on
// every keystroke (which would reset the table's pagination/search), the edit
// state flows to the cells through context: `columns` stays referentially
// stable; only the ScoreCells re-render as the operator types.
// ============================================================================

interface ScoreEntryCtxValue {
  edits: Record<string, RowEdit>
  setRow: (enrollmentId: string, text: string) => void
  setComponent: (enrollmentId: string, code: string, text: string) => void
  maxMarks: number
  writable: boolean
  /** Subject component defs; non-empty ⇒ per-component entry (Theory/Practical/…). */
  components: ExamComponentDto[]
}

const ScoreEntryContext = createContext<ScoreEntryCtxValue | null>(null)

function ScoreCell({ enrollmentId, studentName }: { enrollmentId: string; studentName: string }) {
  const ctx = useContext(ScoreEntryContext)
  if (!ctx) return null
  const { edits, setRow, setComponent, maxMarks, writable, components } = ctx
  const row = edits[enrollmentId] ?? { text: '', value: null }

  // P1.5b — per-component entry (Theory/Practical/…). rawScore is the Σ shown
  // read-only; a partially-filled split (some components blank) is flagged.
  if (components.length > 0) {
    const ev = evalComponents(components, row)
    const partial = ev.anyFilled && !ev.complete
    return (
      <div className="flex items-center justify-end gap-2 flex-wrap">
        {components.map((d) => {
          const t = row.components?.[d.code] ?? ''
          const n = Number(t)
          const err = t.trim() !== '' && (!Number.isFinite(n) || n < 0 || n > d.fullMarks)
          return (
            <div key={d.code} className="flex items-center gap-1">
              <span className="text-[11px] text-text-tertiary">{d.label ?? d.code}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={d.fullMarks}
                step="any"
                value={t}
                disabled={!writable}
                onChange={(e) => setComponent(enrollmentId, d.code, e.target.value)}
                className={`w-16 rounded-lg border bg-surface-primary px-2 py-1 text-sm tabular-nums text-right ${
                  err ? 'border-red-500 text-red-600' : 'border-border-secondary text-text-primary'
                } disabled:opacity-50`}
                aria-label={`${d.label ?? d.code} for ${studentName}`}
                aria-invalid={err || undefined}
              />
              <span className="text-[11px] text-text-tertiary">/{d.fullMarks}</span>
            </div>
          )
        })}
        <span
          className={`text-xs tabular-nums w-16 text-right ${partial ? 'text-red-600' : 'text-text-secondary'}`}
        >
          = {ev.anyFilled ? ev.sum : '—'}/{maxMarks}
        </span>
      </div>
    )
  }

  const parsed = parseRow(row.text)
  const tooHigh = parsed.valid && parsed.value != null && parsed.value > maxMarks
  const tooLow = parsed.valid && parsed.value != null && parsed.value < 0
  const showError = !parsed.valid || tooHigh || tooLow
  return (
    <div className="flex items-center justify-end gap-2">
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={maxMarks}
        step="any"
        value={row.text}
        disabled={!writable}
        onChange={(ev) => setRow(enrollmentId, ev.target.value)}
        className={`w-24 rounded-lg border bg-surface-primary px-2 py-1 text-sm tabular-nums text-right ${
          showError ? 'border-red-500 text-red-600' : 'border-border-secondary text-text-primary'
        } disabled:opacity-50`}
        aria-label={`Score for ${studentName}`}
        aria-invalid={showError || undefined}
      />
      <span className="text-xs text-text-tertiary tabular-nums w-12">/ {maxMarks}</span>
    </div>
  )
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

  // Roster: enrollments for the exam's academic year. Score entry needs the
  // full roster, so auto-page through the infinite query.
  //
  // NB: do NOT pass a server-side `status: 'active'` filter. The canonical
  // active enrollment status in this system is `'enrolled'` (not the literal
  // `'active'`) — see the app-wide `isActive` definition in
  // EnrollmentTable.tsx and the `byStatus.enrolled` summary key. A
  // `status=active` server filter is a DDB FilterExpression that matches zero
  // PABSON rows, so every page returns empty `items` with a continuation
  // cursor (`hasMore: true`) and the roster drains to []. We instead load all
  // AY enrollments and apply the active-status filter client-side, mirroring
  // the rest of the app.
  const {
    data: enrollmentsData,
    isLoading: rosterLoading,
    hasNextPage: enrollmentsHasNextPage,
    isFetchingNextPage: enrollmentsFetchingNext,
    fetchNextPage: enrollmentsFetchNext,
  } = useEnrollments({
    schoolId: exam.schoolId,
    yearId: exam.academicYearId,
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

  // ELS.9 — scope the roster to (a) currently-active enrollments and (b) the
  // exam's grade levels.
  //
  // (a) Active-status set mirrors the app-wide `isActive` definition
  // (EnrollmentTable.tsx): a student is on the roster while `enrolled`
  // (canonical), `active`, or `pending`. Withdrawn / graduated / transferred /
  // provisional enrollments are excluded — they aren't sitting the exam.
  //
  // (b) Grade filter mirrors the backend ELS.3 result-batch Lambda
  // (`enrollment.gradeLevel ∈ exam.gradeLevels`) so the operator enters marks
  // only against students who actually sit this exam, and the score sheet
  // can't create rows for off-scope students (e.g. a Grade 8 child on a
  // Grade 9/10 Send-Up). Legacy exams with empty/undefined gradeLevels keep
  // the full active roster — the back-compat path the Lambda also takes until
  // ELS.4 backfill lands.
  const examGradeSet = useMemo(() => new Set(exam.gradeLevels ?? []), [exam.gradeLevels])
  const activeEnrollments = useMemo(
    () => allEnrollments.filter((e) => ACTIVE_ENROLLMENT_STATUSES.has(e.status)),
    [allEnrollments],
  )
  const enrollments: EnrollmentResponseDto[] = useMemo(
    () =>
      examGradeSet.size === 0
        ? activeEnrollments
        : activeEnrollments.filter((e) => examGradeSet.has(e.gradeLevel)),
    [activeEnrollments, examGradeSet],
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

  // The roster auto-pages (effect above); `enrollments` grows page-by-page
  // until then. Seeding must wait for the full roster — otherwise each
  // arriving page re-fires the seed and `setEdits(seed)` wipes any marks the
  // operator already typed on a >100-student roster.
  const rosterFullyLoaded = !enrollmentsHasNextPage && !enrollmentsFetchingNext

  // Seed edits once the roster is fully loaded, and whenever the selected
  // subject (or its persisted scores) changes. A subject switch keeps the
  // roster stable (enrollments don't refetch) and only swaps
  // `scoreByEnrollmentId`, so re-seeding fully from the new subject's scores
  // is correct — the prior subject's in-progress edits should not carry over.
  useEffect(() => {
    if (!selectedExamCourseId || !rosterFullyLoaded) return
    const defs = selectedCourse?.components ?? []
    const seed: Record<string, RowEdit> = {}
    for (const e of enrollments) {
      const persisted = scoreByEnrollmentId.get(e.enrollmentId)
      if (defs.length > 0) {
        const comp: Record<string, string> = {}
        const cs = persisted?.componentScores
        for (const d of defs) comp[d.code] = cs?.[d.code] != null ? String(cs[d.code]) : ''
        seed[e.enrollmentId] = { text: '', value: null, components: comp }
      } else {
        const text = persisted ? String(persisted.rawScore) : ''
        seed[e.enrollmentId] = { text, value: persisted ? persisted.rawScore : null }
      }
    }
    setEdits(seed)
  }, [selectedExamCourseId, rosterFullyLoaded, enrollments, scoreByEnrollmentId, selectedCourse])

  const maxMarks = selectedCourse?.maxMarks ?? 0
  const components = useMemo<ExamComponentDto[]>(() => selectedCourse?.components ?? [], [selectedCourse])

  // Validate + diff against persisted scores.
  const diffs = useMemo(() => {
    if (!selectedCourse) return { changes: [], invalidCount: 0, blanksCount: 0 }
    const changes: { enrollmentId: string; rawScore: number; componentScores?: Record<string, number> }[] = []
    let invalidCount = 0
    let blanksCount = 0
    for (const e of enrollments) {
      const row = edits[e.enrollmentId]
      if (!row) continue

      // Component subject: rawScore = Σ components; a partial fill is invalid
      // (you can't pass/fail a split subject on half its marks).
      if (components.length > 0) {
        const ev = evalComponents(components, row)
        if (!ev.anyFilled) {
          blanksCount++
          continue
        }
        if (ev.invalid || !ev.complete) {
          invalidCount++
          continue
        }
        const existing = scoreByEnrollmentId.get(e.enrollmentId)
        const changed =
          !existing ||
          existing.rawScore !== ev.sum ||
          !sameComponentScores(existing.componentScores, ev.scores)
        if (changed) {
          changes.push({ enrollmentId: e.enrollmentId, rawScore: ev.sum, componentScores: ev.scores })
        }
        continue
      }

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
  }, [edits, enrollments, scoreByEnrollmentId, selectedCourse, maxMarks, components])

  const bulkMutation = useBulkExamScores(exam.examId, exam.schoolId)

  // Roster table wiring. `setRow` is stable; the context value carries the
  // live edit state to the ScoreCells. `columns` is referentially stable
  // (empty deps) so typing never resets the table's pagination/search.
  const setRow = useCallback((enrollmentId: string, text: string) => {
    setEdits((prev) => ({ ...prev, [enrollmentId]: { text, value: parseRow(text).value } }))
  }, [])
  const setComponent = useCallback((enrollmentId: string, code: string, text: string) => {
    setEdits((prev) => {
      const row = prev[enrollmentId] ?? { text: '', value: null, components: {} }
      return {
        ...prev,
        [enrollmentId]: { ...row, components: { ...(row.components ?? {}), [code]: text } },
      }
    })
  }, [])
  const scoreCtx = useMemo<ScoreEntryCtxValue>(
    () => ({ edits, setRow, setComponent, maxMarks, writable, components }),
    [edits, setRow, setComponent, maxMarks, writable, components],
  )
  const columns: ColumnDef<EnrollmentResponseDto, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'studentName',
        header: 'Student',
        size: 300,
        cell: ({ row }) => {
          const e = row.original
          const displayName = e.studentName || 'Student'
          return (
            <div className="flex items-center gap-3 min-w-0">
              <UserAvatar userId={e.studentId} userName={displayName} role="student" size="md" />
              <span className="text-sm font-medium text-text-primary truncate">{displayName}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'gradeLevel',
        header: 'Grade',
        size: 110,
        cell: ({ row }) => (
          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-surface-secondary text-text-secondary">
            {row.original.gradeLevel}
          </span>
        ),
      },
      {
        id: 'score',
        header: () => <span className="block text-right">Score</span>,
        size: 340,
        enableSorting: false,
        cell: ({ row }) => (
          <ScoreCell
            enrollmentId={row.original.enrollmentId}
            studentName={row.original.studentName ?? 'student'}
          />
        ),
      },
    ],
    [],
  )

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
              ...(c.componentScores ? { componentScores: c.componentScores } : {}),
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
          ...(c.componentScores ? { componentScores: c.componentScores } : {}),
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
          {components.length > 0 && (
            <> · {components.map((c) => c.label ?? c.code).join(' + ')}</>
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

      {/* Roster — TanstackDataTable: avatar + name, grade, editable score.
          Internal pagination + scroll (maxHeight) keep the page from
          stretching unbounded on large rosters. */}
      <ScoreEntryContext.Provider value={scoreCtx}>
        <TanstackDataTable
          columns={columns}
          data={enrollments}
          getRowId={(e) => e.enrollmentId}
          isLoading={rosterLoading || scoresLoading}
          enableSorting
          searchPlaceholder="Search students by name…"
          pagination={{ pageSize: 20 }}
          maxHeight="calc(100vh - 22rem)"
          emptyState={{
            icon: <Users className="w-10 h-10" />,
            title: 'No students to score',
            description:
              examGradeSet.size > 0 && activeEnrollments.length > 0
                ? `No active students enrolled at this exam's grade level${
                    (exam.gradeLevels?.length ?? 0) === 1 ? '' : 's'
                  } (${(exam.gradeLevels ?? []).join(', ')}).`
                : 'No active enrollments for this academic year.',
          }}
        />
      </ScoreEntryContext.Provider>

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
