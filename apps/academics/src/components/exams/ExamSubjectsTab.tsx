/**
 * ExamSubjectsTab — manage the courses (subjects) attached to an exam (EM-2.4).
 *
 * Add / edit marks / remove subjects, each with maxMarks + passingMarks
 * (CDC default 32) + optional creditHours. Mutations are only offered while the
 * exam is draft/scheduled (`acceptsExamCourseMutations`); afterwards the tab is
 * read-only and explains why.
 */

import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Plus, Trash2, Pencil, Lock, X, Check } from 'lucide-react'
import type { ExamCourseResponseDto, ExamStatus } from '@aibrains/shared-types'
import { useCourses } from '../../hooks/useCourses'
import {
  useExamCourses,
  useCreateExamCourse,
  useUpdateExamCourse,
  useDeleteExamCourse,
} from '../../hooks/useExamCourses'
import { acceptsExamCourseMutations } from '../../schemas/exam-state-machine'
import { getExamStatusMeta } from '../../schemas/exam.form'
import { buildComponents, type ComponentDraft } from './exam-scoring'

const DEFAULT_PASSING = 32

interface AddFormState {
  courseId: string
  maxMarks: string
  passingMarks: string
  creditHours: string
  components: ComponentDraft[]
}

const EMPTY_ADD: AddFormState = {
  courseId: '',
  maxMarks: '100',
  passingMarks: String(DEFAULT_PASSING),
  creditHours: '',
  components: [],
}

export function ExamSubjectsTab({
  examId,
  schoolId,
  status,
  canManage,
  examGradeLevels,
}: {
  examId: string
  schoolId: string
  status: ExamStatus
  canManage: boolean
  /**
   * ELS.8 — the exam's grade-level scope. Filters the course picker to courses
   * whose `gradeLevels` overlap. Empty (legacy pre-ELS.1 exam) → no filter.
   */
  examGradeLevels: string[]
}) {
  const mutable = canManage && acceptsExamCourseMutations(status)

  const { data, isLoading } = useExamCourses(examId)
  const examCourses = useMemo(() => data?.items ?? [], [data])

  const {
    data: coursesData,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useCourses({ schoolId, limit: 100, enabled: mutable && !!schoolId })
  const courses = useMemo(
    () => (coursesData?.pages ?? []).flatMap((p) => p.items ?? []),
    [coursesData],
  )

  const createMut = useCreateExamCourse(examId)
  const updateMut = useUpdateExamCourse(examId)
  const deleteMut = useDeleteExamCourse(examId)

  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<AddFormState>(EMPTY_ADD)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ maxMarks: string; passingMarks: string; creditHours: string }>({
    maxMarks: '',
    passingMarks: '',
    creditHours: '',
  })

  const takenCourseIds = useMemo(() => new Set(examCourses.map((ec) => ec.courseId)), [examCourses])

  // ELS.8 — grade-level overlap filter. Mirrors the backend ELS.2 guard
  // (EXAM_COURSE_GRADE_MISMATCH) exactly: a course is shown only when it could
  // be added. Skip the filter — show the course — when EITHER side is
  // empty/missing (the exam is a legacy pre-ELS.1 row with no scope, or the
  // course has no curated gradeLevels); the backend allows the add in those
  // cases, so the picker must not hide it. Hide only when both sides are
  // populated and there is no overlap.
  const examGradeSet = useMemo(() => new Set(examGradeLevels), [examGradeLevels])
  const gradeMatchedCourses = useMemo(() => {
    if (examGradeSet.size === 0) return courses
    return courses.filter((c) => {
      const cg = c.gradeLevels
      if (!Array.isArray(cg) || cg.length === 0) return true
      return cg.some((g) => examGradeSet.has(g))
    })
  }, [courses, examGradeSet])

  const availableCourses = useMemo(
    () => gradeMatchedCourses.filter((c) => !takenCourseIds.has(c.courseId)),
    [gradeMatchedCourses, takenCourseIds],
  )

  // Distinguish "no courses match this exam's grades" (scoped exam, real
  // curriculum, zero overlap) from "no courses exist / all already added" so
  // the empty-state can explain the grade-scope reason specifically.
  // Gated on pagination being complete (`!hasNextPage && !isFetchingNextPage`):
  // a later page may hold the only grade-matching course, so firing the
  // empty-state mid-load would flash a false "no match" while pages are still
  // arriving (the auto-page effect below drives the fetch to completion).
  const noGradeMatch =
    examGradeLevels.length > 0 &&
    courses.length > 0 &&
    gradeMatchedCourses.length === 0 &&
    !hasNextPage &&
    !isFetchingNextPage

  // The picker needs every course, not just the first page — auto-page through
  // the infinite query whenever the tab is mutable. ELS.8: the grade-match
  // empty-state can only be trusted once all pages are loaded (a later page
  // might hold the only grade-matching course), and the "Add Subject" button
  // is gated on a non-empty filtered set — so paging can't wait for the form
  // to open. Gated on `mutable` so read-only exams don't fetch the catalog.
  useEffect(() => {
    if (mutable && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  }, [mutable, hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleAdd = async () => {
    if (!form.courseId) return
    const maxMarks = Number(form.maxMarks)
    const passingMarks = Number(form.passingMarks)
    if (!Number.isFinite(maxMarks) || maxMarks < 1) return
    if (!Number.isFinite(passingMarks) || passingMarks < 0 || passingMarks > maxMarks) return
    const creditHours = form.creditHours === '' ? undefined : Number(form.creditHours)
    if (creditHours != null && (!Number.isFinite(creditHours) || creditHours < 0)) return
    const built = buildComponents(form.components, maxMarks)
    if (!built.ok) return
    try {
      await createMut.mutateAsync({
        schoolId,
        courseId: form.courseId,
        maxMarks,
        passingMarks,
        ...(creditHours != null ? { creditHours } : {}),
        ...(built.components.length > 0 ? { components: built.components } : {}),
      })
      setForm(EMPTY_ADD)
      setAdding(false)
    } catch {
      // onError toast is handled in the mutation hook
    }
  }

  // Live component-split state for the add form (mirrors the server refine so
  // the operator sees the Σ-must-equal-maxMarks rule before submitting).
  const addMax = Number(form.maxMarks)
  const componentsSum = form.components.reduce((s, c) => s + (Number(c.fullMarks) || 0), 0)
  const componentsValid = buildComponents(form.components, addMax).ok

  const setComponent = (idx: number, patch: Partial<ComponentDraft>) =>
    setForm((f) => ({
      ...f,
      components: f.components.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    }))
  const addComponentRow = (label = '') =>
    setForm((f) => ({ ...f, components: [...f.components, { label, fullMarks: '', passMarks: '' }] }))
  const removeComponentRow = (idx: number) =>
    setForm((f) => ({ ...f, components: f.components.filter((_, i) => i !== idx) }))
  const seedTheoryPractical = () =>
    setForm((f) => ({
      ...f,
      components: [
        { label: 'Theory', fullMarks: '', passMarks: '' },
        { label: 'Practical', fullMarks: '', passMarks: '' },
      ],
    }))

  const startEdit = (ec: ExamCourseResponseDto) => {
    setEditingId(ec.examCourseId)
    setEditForm({
      maxMarks: String(ec.maxMarks),
      passingMarks: String(ec.passingMarks),
      creditHours: ec.creditHours != null ? String(ec.creditHours) : '',
    })
  }

  const handleSaveEdit = async (examCourseId: string) => {
    const maxMarks = Number(editForm.maxMarks)
    const passingMarks = Number(editForm.passingMarks)
    if (!Number.isFinite(maxMarks) || maxMarks < 1) return
    if (!Number.isFinite(passingMarks) || passingMarks < 0 || passingMarks > maxMarks) return
    const creditHours = editForm.creditHours === '' ? undefined : Number(editForm.creditHours)
    if (creditHours != null && (!Number.isFinite(creditHours) || creditHours < 0)) return
    try {
      await updateMut.mutateAsync({
        examCourseId,
        data: {
          maxMarks,
          passingMarks,
          ...(creditHours != null ? { creditHours } : {}),
        },
      })
      setEditingId(null)
    } catch {
      // onError toast is handled in the mutation hook
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-surface-secondary" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {examCourses.length} subject{examCourses.length !== 1 ? 's' : ''}
        </p>
        {mutable && !adding && availableCourses.length > 0 && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--action-primary-bg))] rounded-lg hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Subject
          </button>
        )}
      </div>

      {!acceptsExamCourseMutations(status) && (
        <div className="flex items-center gap-2 rounded-lg border border-border-secondary bg-surface-secondary/50 px-4 py-3 text-sm text-text-secondary">
          <Lock className="w-4 h-4 text-text-tertiary" />
          Subjects are locked while the exam is {getExamStatusMeta(status).label}. They can only be changed in
          Draft or Scheduled.
        </div>
      )}

      {/* ELS.8 — grade-scope empty state: the exam is scoped to grade(s) for
          which the curriculum has no matching courses. */}
      {mutable && !adding && noGradeMatch && (
        <div className="flex items-start gap-2 rounded-lg border border-border-secondary bg-surface-secondary/50 px-4 py-3 text-sm text-text-secondary">
          <BookOpen className="w-4 h-4 text-text-tertiary mt-0.5 flex-shrink-0" />
          <span>
            No courses match this exam&apos;s grade level{examGradeLevels.length !== 1 ? 's' : ''} (
            {examGradeLevels.join(', ')}). Add courses tagged for{' '}
            {examGradeLevels.length !== 1 ? 'those grades' : 'that grade'} in Curriculum first.
          </span>
        </div>
      )}

      {/* Add form */}
      {mutable && adding && (
        <div className="rounded-xl border border-border-secondary p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <label className="sm:col-span-2 text-xs font-medium text-text-tertiary">
              Course
              <select
                value={form.courseId}
                onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border-secondary bg-surface-primary px-3 py-2 text-sm text-text-primary"
              >
                <option value="">Select a course…</option>
                {availableCourses.map((c) => (
                  <option key={c.courseId} value={c.courseId}>
                    {c.courseName}
                    {c.courseCode ? ` (${c.courseCode})` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-text-tertiary">
              Max Marks
              <input
                type="number"
                min={1}
                value={form.maxMarks}
                onChange={(e) => setForm((f) => ({ ...f, maxMarks: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border-secondary bg-surface-primary px-3 py-2 text-sm text-text-primary"
              />
            </label>
            <label className="text-xs font-medium text-text-tertiary">
              Pass Marks
              <input
                type="number"
                min={0}
                value={form.passingMarks}
                onChange={(e) => setForm((f) => ({ ...f, passingMarks: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border-secondary bg-surface-primary px-3 py-2 text-sm text-text-primary"
              />
            </label>
          </div>

          {/* P1.5b — optional Theory/Practical (or custom) split. The component
              full marks must sum to Max Marks (mirrors the server refine). */}
          <div className="rounded-lg border border-border-secondary/70 bg-surface-secondary/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-tertiary">
                Components <span className="text-text-tertiary/70">(optional — e.g. Theory + Practical)</span>
              </span>
              {form.components.length === 0 ? (
                <button
                  type="button"
                  onClick={seedTheoryPractical}
                  className="text-xs font-medium text-[rgb(var(--state-info-fg))] hover:text-[rgb(var(--text-primary))]"
                >
                  + Split into components
                </button>
              ) : (
                <span className={`text-xs tabular-nums ${componentsValid ? 'text-text-tertiary' : 'text-[rgb(var(--state-danger-fg))]'}`}>
                  Σ {componentsSum} / {Number.isFinite(addMax) ? addMax : '—'} full
                </span>
              )}
            </div>

            {form.components.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={c.label}
                  placeholder="Label (e.g. Theory)"
                  onChange={(e) => setComponent(i, { label: e.target.value })}
                  className="flex-1 rounded-lg border border-border-secondary bg-surface-primary px-2 py-1 text-sm text-text-primary"
                  aria-label={`Component ${i + 1} label`}
                />
                <input
                  type="number"
                  min={1}
                  value={c.fullMarks}
                  placeholder="Full"
                  onChange={(e) => setComponent(i, { fullMarks: e.target.value })}
                  className="w-20 rounded-lg border border-border-secondary bg-surface-primary px-2 py-1 text-sm text-text-primary text-right"
                  aria-label={`Component ${i + 1} full marks`}
                />
                <span className="text-text-tertiary text-xs">/ pass</span>
                <input
                  type="number"
                  min={0}
                  value={c.passMarks}
                  placeholder="Pass"
                  onChange={(e) => setComponent(i, { passMarks: e.target.value })}
                  className="w-20 rounded-lg border border-border-secondary bg-surface-primary px-2 py-1 text-sm text-text-primary text-right"
                  aria-label={`Component ${i + 1} pass marks`}
                />
                <button
                  type="button"
                  onClick={() => removeComponentRow(i)}
                  className="p-1 rounded-lg text-text-tertiary hover:text-[rgb(var(--state-danger-fg))] hover:bg-surface-secondary"
                  aria-label="Remove component"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {form.components.length > 0 && (
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => addComponentRow()}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[rgb(var(--state-info-fg))] hover:text-[rgb(var(--text-primary))]"
                >
                  <Plus className="w-3.5 h-3.5" /> Add component
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, components: [] }))}
                  className="text-xs text-text-tertiary hover:text-text-secondary"
                >
                  Clear (single subject)
                </button>
              </div>
            )}
            {form.components.length > 0 && !componentsValid && (
              <p className="text-xs text-[rgb(var(--state-danger-fg))]">
                Each component needs a label, full ≥ 1, 0 ≤ pass ≤ full, and the full marks must sum to Max
                Marks ({Number.isFinite(addMax) ? addMax : '—'}).
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setAdding(false)
                setForm(EMPTY_ADD)
              }}
              className="px-3 py-1.5 text-sm font-medium text-text-secondary border border-border-secondary rounded-lg hover:bg-surface-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!form.courseId || createMut.isPending || !componentsValid}
              className="px-3 py-1.5 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--action-primary-bg))] rounded-lg hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {examCourses.length === 0 ? (
        <div className="rounded-xl border border-border-secondary p-10 text-center">
          <BookOpen className="w-10 h-10 mx-auto text-text-tertiary mb-3" />
          <p className="text-sm text-text-secondary">
            No subjects yet.{mutable ? ' Add the courses this exam will cover.' : ''}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border-secondary divide-y divide-border-secondary">
          {examCourses.map((ec) => {
            const editing = editingId === ec.examCourseId
            return (
              <div key={ec.examCourseId} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {ec.courseName ?? 'Course'}
                    {ec.courseCode ? <span className="text-text-tertiary font-normal"> ({ec.courseCode})</span> : null}
                  </p>
                  {ec.academicSubject && (
                    <p className="text-xs text-text-tertiary">{ec.academicSubject}</p>
                  )}
                  {ec.components && ec.components.length > 0 && (
                    <p className="text-xs text-text-tertiary">
                      {ec.components
                        .map((c) => `${c.label ?? c.code} ${c.fullMarks}/${c.passMarks}`)
                        .join(' · ')}
                    </p>
                  )}
                </div>

                {editing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={editForm.maxMarks}
                      onChange={(e) => setEditForm((f) => ({ ...f, maxMarks: e.target.value }))}
                      className="w-20 rounded-lg border border-border-secondary bg-surface-primary px-2 py-1 text-sm text-text-primary"
                      aria-label="Max marks"
                    />
                    <span className="text-text-tertiary text-xs">/ pass</span>
                    <input
                      type="number"
                      min={0}
                      value={editForm.passingMarks}
                      onChange={(e) => setEditForm((f) => ({ ...f, passingMarks: e.target.value }))}
                      className="w-20 rounded-lg border border-border-secondary bg-surface-primary px-2 py-1 text-sm text-text-primary"
                      aria-label="Passing marks"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(ec.examCourseId)}
                      disabled={updateMut.isPending}
                      className="p-1.5 rounded-lg text-[rgb(var(--state-success-fg))] hover:bg-surface-secondary disabled:opacity-50"
                      aria-label="Save"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1.5 rounded-lg text-text-tertiary hover:bg-surface-secondary"
                      aria-label="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-text-secondary tabular-nums">
                      {ec.maxMarks} <span className="text-text-tertiary">max</span>
                      <span className="text-text-tertiary"> · </span>
                      {ec.passingMarks} <span className="text-text-tertiary">pass</span>
                    </span>
                    {mutable && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(ec)}
                          className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                          aria-label="Edit marks"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Remove ${ec.courseName ?? 'this subject'} from the exam?`)) {
                              deleteMut.mutate(ec.examCourseId)
                            }
                          }}
                          className="p-1.5 rounded-lg text-text-tertiary hover:text-[rgb(var(--state-danger-fg))] hover:bg-surface-secondary transition-colors"
                          aria-label="Remove subject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
