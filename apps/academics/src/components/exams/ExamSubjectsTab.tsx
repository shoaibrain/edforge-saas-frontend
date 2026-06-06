/**
 * ExamSubjectsTab — manage the courses (subjects) attached to an exam (EM-2.4).
 *
 * Add / edit marks / remove subjects, each with maxMarks + passingMarks
 * (CDC default 32) + optional creditHours. Mutations are only offered while the
 * exam is draft/scheduled (`acceptsExamCourseMutations`); afterwards the tab is
 * read-only and explains why.
 */

import { useMemo, useState } from 'react'
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

const DEFAULT_PASSING = 32

interface AddFormState {
  courseId: string
  maxMarks: string
  passingMarks: string
  creditHours: string
}

const EMPTY_ADD: AddFormState = { courseId: '', maxMarks: '100', passingMarks: String(DEFAULT_PASSING), creditHours: '' }

export function ExamSubjectsTab({
  examId,
  schoolId,
  status,
  canManage,
}: {
  examId: string
  schoolId: string
  status: ExamStatus
  canManage: boolean
}) {
  const mutable = canManage && acceptsExamCourseMutations(status)

  const { data, isLoading } = useExamCourses(examId)
  const examCourses = useMemo(() => data?.items ?? [], [data])

  const { data: coursesData } = useCourses({ schoolId, limit: 100, enabled: mutable && !!schoolId })
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
  const availableCourses = useMemo(
    () => courses.filter((c) => !takenCourseIds.has(c.courseId)),
    [courses, takenCourseIds],
  )

  const handleAdd = async () => {
    if (!form.courseId) return
    const maxMarks = Number(form.maxMarks)
    const passingMarks = Number(form.passingMarks)
    if (!Number.isFinite(maxMarks) || maxMarks < 1) return
    if (!Number.isFinite(passingMarks) || passingMarks < 0 || passingMarks > maxMarks) return
    const creditHours = form.creditHours === '' ? undefined : Number(form.creditHours)
    if (creditHours != null && (!Number.isFinite(creditHours) || creditHours < 0)) return
    try {
      await createMut.mutateAsync({
        schoolId,
        courseId: form.courseId,
        maxMarks,
        passingMarks,
        ...(creditHours != null ? { creditHours } : {}),
      })
      setForm(EMPTY_ADD)
      setAdding(false)
    } catch {
      // onError toast is handled in the mutation hook
    }
  }

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
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
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
              disabled={!form.courseId || createMut.isPending}
              className="px-3 py-1.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
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
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-surface-secondary disabled:opacity-50"
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
                          className="p-1.5 rounded-lg text-text-tertiary hover:text-red-600 hover:bg-surface-secondary transition-colors"
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
