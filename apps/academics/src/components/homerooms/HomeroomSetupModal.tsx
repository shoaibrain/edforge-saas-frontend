/**
 * HomeroomSetupModal
 *
 * Assisted "Set up homerooms" flow for the PABSON daily-attendance model.
 * Renders one **grade card** per enabled grade level (vertical stack, no
 * horizontal scroll). Each card REQUIRES a class teacher, offers an optional
 * co-teacher + max, can be split into lettered sections (A/B…), and is created
 * via `designateHomeroom`.
 *
 * Auto-roster (FE-S4): when a homeroom is created for a grade, that grade's
 * currently-enrolled students are automatically assigned into it. Per-grade
 * student counts + the studentIds to enroll come from grouping the enrollment
 * list (status:'enrolled') by the stored LOCAL grade label
 * (`enrollment.gradeLevel`, e.g. "3", "NUR") — not a canonical descriptor.
 *
 * No bulk-create endpoint exists — homerooms are created one POST at a time,
 * and each grade's students are assigned via the looping
 * `useAssignStudentsToHomeroom` hook, with aggregate progress.
 */

import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Loader2, CheckCircle, UsersRound, UserCog } from 'lucide-react'
import { Modal, ModalFooter, Button, Field, Input, Select, StatusBadge } from '@edforge/ui'
import { useSchoolEnabledGradeOptions } from '../../hooks/useGradeOptions'
import { useSchoolStaff, flattenStaffData, getStaffDisplayName } from '../../hooks/useStaff'
import { useEnrollments, flattenEnrollmentPages } from '../../hooks/useEnrollments'
import { useDesignateHomeroom, useAssignStudentsToHomeroom, homeroomKeys } from '../../hooks/useHomeroom'
import { parseApiError, type DesignateHomeroomDto } from '../../services/academics.service'
import { toast } from 'sonner'

// ============================================================================
// TYPES
// ============================================================================

interface ProposedHomeroom {
  /** Local row id (grade + suffix) for React keys + edits. */
  rowId: string
  gradeLabel: string
  /** Local grade code used to look up enrolled students for auto-roster. */
  gradeValue: string
  /** sectionNumber sent to the API (e.g. "1", "1-A"). */
  sectionNumber: string
  sectionName: string
  primaryTeacherId: string
  coTeacherId: string
  maxEnrollment: number
}

export interface HomeroomSetupModalProps {
  open: boolean
  onClose: () => void
  schoolId: string
  academicYearId: string
  /** sectionNumbers that already exist — skip proposing duplicates. */
  existingSectionNumbers: Set<string>
}

const DEFAULT_MAX = 40

// ============================================================================
// COMPONENT
// ============================================================================

export function HomeroomSetupModal({
  open,
  onClose,
  schoolId,
  academicYearId,
  existingSectionNumbers,
}: HomeroomSetupModalProps) {
  const { options: gradeOptions, isLoading: gradesLoading } = useSchoolEnabledGradeOptions(
    schoolId || null,
  )
  const { data: staffData } = useSchoolStaff(schoolId)
  const teachers = useMemo(() => flattenStaffData(staffData), [staffData])

  // Currently-enrolled students for auto-roster. status MUST be 'enrolled'
  // (rows are stored that way; 'active' would return nothing). Load the FULL
  // cohort (all grades) — the default 50-row page misses grades past page 1
  // (enrollments are GSI-ordered by gradeLevel), which would silently create
  // homerooms with 0 students. limit 1000 = the enrollment-list ceiling; the
  // Create button is gated below until the load completes.
  const {
    data: enrollmentData,
    isLoading: enrollmentsLoading,
    hasNextPage: hasMoreEnrollments,
    isFetchingNextPage: fetchingMoreEnrollments,
    fetchNextPage: fetchMoreEnrollments,
  } = useEnrollments({
    schoolId,
    yearId: academicYearId,
    filters: { status: 'enrolled' },
    limit: 1000,
    enabled: open && !!schoolId && !!academicYearId,
  })
  // Auto-drain remaining pages so studentsByGrade covers EVERY grade before
  // auto-roster runs. limit:1000 covers most schools in one page; this loop
  // handles larger ones (without it, the Create gate would deadlock forever).
  useEffect(() => {
    if (hasMoreEnrollments && !fetchingMoreEnrollments) fetchMoreEnrollments()
  }, [hasMoreEnrollments, fetchingMoreEnrollments, fetchMoreEnrollments])
  const enrollments = useMemo(() => flattenEnrollmentPages(enrollmentData), [enrollmentData])
  const enrollmentsIncomplete = enrollmentsLoading || hasMoreEnrollments

  // Map<localGradeLabel, studentId[]> — grouped by the STORED grade label.
  const studentsByGrade = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const e of enrollments) {
      const grade = e.gradeLevel
      if (!grade) continue
      const list = map.get(grade)
      if (list) list.push(e.studentId)
      else map.set(grade, [e.studentId])
    }
    return map
  }, [enrollments])

  const designate = useDesignateHomeroom()
  const assignStudents = useAssignStudentsToHomeroom()
  const queryClient = useQueryClient()

  const [rows, setRows] = useState<ProposedHomeroom[]>([])
  const [progress, setProgress] = useState<{
    phase: 'creating' | 'assigning'
    label: string
    done: number
    total: number
  } | null>(null)
  const [failures, setFailures] = useState<Array<{ label: string; message: string }>>([])

  // Seed one proposed homeroom per enabled grade not already covered.
  useEffect(() => {
    if (!open) return
    const seeded: ProposedHomeroom[] = gradeOptions
      .filter((g) => !existingSectionNumbers.has(g.value))
      .map((g) => ({
        rowId: g.value,
        gradeLabel: g.label,
        gradeValue: g.value,
        sectionNumber: g.value,
        sectionName: `${g.label} Homeroom`,
        primaryTeacherId: '',
        coTeacherId: '',
        maxEnrollment: DEFAULT_MAX,
      }))
    setRows(seeded)
    setProgress(null)
    setFailures([])
  }, [open, gradeOptions, existingSectionNumbers])

  const updateRow = (rowId: string, patch: Partial<ProposedHomeroom>) => {
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)))
  }

  const removeRow = (rowId: string) => {
    setRows((prev) => prev.filter((r) => r.rowId !== rowId))
  }

  const splitGrade = (row: ProposedHomeroom) => {
    // Split a grade into lettered sections A / B / C…. The FIRST split relabels
    // the bare grade row ("6") to "6-A" so the set reads A/B (not 6 / 6-B); the
    // grade's whole-cohort auto-roster is then suppressed (see handleCreate) so
    // students aren't dumped into the first split — operators assign each
    // section's students manually via the Assign drawer.
    setRows((prev) => {
      const sameGrade = prev.filter((r) => r.gradeValue === row.gradeValue)
      const firstSplit = sameGrade.length === 1 && !sameGrade[0].sectionNumber.includes('-')
      const working = firstSplit
        ? prev.map((r) =>
            r.gradeValue === row.gradeValue
              ? {
                  ...r,
                  rowId: `${r.gradeValue}-A`,
                  sectionNumber: `${r.gradeValue}-A`,
                  sectionName: `${r.gradeLabel} Homeroom A`,
                }
              : r,
          )
        : prev
      const count = working.filter((r) => r.gradeValue === row.gradeValue).length
      const suffix = String.fromCharCode(65 + count) // A is index 0 → next free letter
      const newRow: ProposedHomeroom = {
        rowId: `${row.gradeValue}-${suffix}`,
        gradeLabel: row.gradeLabel,
        gradeValue: row.gradeValue,
        sectionNumber: `${row.gradeValue}-${suffix}`,
        sectionName: `${row.gradeLabel} Homeroom ${suffix}`,
        primaryTeacherId: '',
        coTeacherId: '',
        maxEnrollment: DEFAULT_MAX,
      }
      const lastIdx = working.map((r) => r.gradeValue).lastIndexOf(row.gradeValue)
      const next = [...working]
      next.splice(lastIdx + 1, 0, newRow)
      return next
    })
  }

  const teacherOptions = useMemo(
    () => teachers.map((t) => ({ value: t.staffId, label: getStaffDisplayName(t) })),
    [teachers],
  )

  const needsTeacherCount = rows.filter((r) => !r.primaryTeacherId).length
  const allHaveTeacher = rows.length > 0 && needsTeacherCount === 0
  const isBusy = progress !== null

  const handleCreate = async () => {
    setFailures([])
    const created: string[] = []
    const errs: Array<{ label: string; message: string }> = []

    // Grades split into A/B/C must NOT auto-roster — the whole cohort would land
    // in the first split and the rest would skip everyone (already-assigned).
    // Split grades are created empty; the operator assigns each section's
    // students via the Assign drawer.
    const gradeRowCounts = rows.reduce<Record<string, number>>((m, r) => {
      m[r.gradeValue] = (m[r.gradeValue] || 0) + 1
      return m
    }, {})

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const cardLabel = row.sectionName || `${row.gradeLabel} (#${row.sectionNumber})`
      const dto: DesignateHomeroomDto = {
        schoolId,
        academicYearId,
        // First-class grade (the school's local code) — lets the roster be
        // grade-scoped from authoritative data instead of parsing sectionNumber.
        gradeLevel: row.gradeValue,
        sectionNumber: row.sectionNumber,
        sectionName: row.sectionName || undefined,
        primaryTeacherId: row.primaryTeacherId,
        coTeacherIds: row.coTeacherId ? [row.coTeacherId] : undefined,
        maxEnrollment: row.maxEnrollment,
      }

      setProgress({ phase: 'creating', label: cardLabel, done: i, total: rows.length })

      let sectionId: string
      let sectionSchoolId: string
      try {
        const section = await designate.mutateAsync(dto)
        sectionId = section.sectionId
        // Use the created section's own school for the roster assign, not the
        // ambient active-school context.
        sectionSchoolId = section.schoolId
        created.push(row.rowId)
      } catch (error) {
        const parsed = parseApiError(error)
        errs.push({ label: cardLabel, message: parsed.message })
        continue
      }

      // Auto-roster the grade's enrolled students — but only when the grade is
      // NOT split (one homeroom per grade). Split grades are created empty.
      const isSplitGrade = (gradeRowCounts[row.gradeValue] || 0) > 1
      const studentIds = isSplitGrade ? [] : (studentsByGrade.get(row.gradeValue) ?? [])
      if (studentIds.length > 0) {
        const result = await assignStudents.mutateAsync({
          sectionId,
          schoolId: sectionSchoolId,
          studentIds,
          onProgress: ({ done, total }) =>
            setProgress({ phase: 'assigning', label: cardLabel, done, total }),
        })
        const assignedMsg =
          result.skipped.length > 0
            ? `${cardLabel} created — ${result.assigned} students assigned, ${result.skipped.length} skipped`
            : `${cardLabel} created — ${result.assigned} student${result.assigned === 1 ? '' : 's'} assigned`
        toast.success(assignedMsg)
      } else if (isSplitGrade) {
        toast.success(`${cardLabel} created — assign its students via "Assign" (grade is split into sections)`)
      } else {
        toast.success(`${cardLabel} created — no enrolled students to assign yet`)
      }
    }

    // Final fresh read AFTER the create/roster loop — by now enough time has
    // elapsed for the new homeroom rows to propagate to the GSI, so the
    // Homerooms list shows them (the immediate per-create invalidation can race
    // GSI eventual-consistency).
    await queryClient.refetchQueries({ queryKey: homeroomKeys.all })

    // Drop successfully-created rows; keep failures visible for retry.
    setRows((prev) => prev.filter((r) => !created.includes(r.rowId)))
    setFailures(errs)
    setProgress(null)
    if (errs.length === 0) onClose()
  }

  return (
    <Modal
      open={open}
      onClose={isBusy ? () => {} : onClose}
      title="Set up homerooms"
      description="One homeroom per grade for daily roll-call. Each grade's currently-enrolled students are assigned automatically. Split a grade into sections if needed."
      size="2xl"
      showCloseButton={!isBusy}
    >
      <div className="space-y-4">
        {/* Summary header */}
        {!gradesLoading && rows.length > 0 && (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-text-secondary">
              <span className="font-medium text-text-primary">{rows.length}</span> grade
              {rows.length === 1 ? '' : 's'}
              {needsTeacherCount > 0 ? (
                <>
                  {' · '}
                  <span className="font-medium text-[rgb(var(--state-warning-fg))]">
                    {needsTeacherCount}
                  </span>{' '}
                  still need a teacher
                </>
              ) : (
                <span className="text-[rgb(var(--state-success-fg))]"> · all ready</span>
              )}
            </p>
          </div>
        )}

        {gradesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-surface-secondary rounded-xl animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center">
            <CheckCircle className="w-10 h-10 mx-auto text-[rgb(var(--state-success-fg))] mb-3" />
            <p className="text-sm font-medium text-text-primary">
              Every enabled grade already has a homeroom.
            </p>
            <p className="text-xs text-text-tertiary mt-1">
              Use the Overview list to manage existing homerooms.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto overflow-x-hidden pr-1">
            {rows.map((row) => {
              const studentCount = (studentsByGrade.get(row.gradeValue) ?? []).length
              const ready = !!row.primaryTeacherId
              return (
                <div
                  key={row.rowId}
                  className="rounded-xl border border-border-secondary bg-surface-primary p-4 space-y-3"
                >
                  {/* Card header: grade + count + status + remove */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-text-primary truncate">
                          {row.gradeLabel}
                        </h4>
                        <span className="text-2xs font-medium text-text-tertiary tabular-nums">
                          #{row.sectionNumber}
                        </span>
                      </div>
                      <p className="text-xs text-text-tertiary mt-0.5 flex items-center gap-1">
                        <UsersRound className="w-3.5 h-3.5 shrink-0" />
                        {studentCount} enrolled student{studentCount === 1 ? '' : 's'} will be
                        assigned
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {ready ? (
                        <StatusBadge tone="success" dot>
                          Ready
                        </StatusBadge>
                      ) : (
                        <StatusBadge tone="warning" dot>
                          Needs a teacher
                        </StatusBadge>
                      )}
                      <button
                        type="button"
                        onClick={() => removeRow(row.rowId)}
                        disabled={isBusy}
                        title="Remove"
                        aria-label={`Remove ${row.gradeLabel} homeroom`}
                        className="p-1.5 rounded-md text-text-tertiary hover:text-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--state-danger-bg)/0.18)] transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Fields: stack on narrow, responsive row on wider. min-w-0 prevents overflow. */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_6rem] gap-3">
                    <div className="min-w-0">
                      <Select
                        label="Class teacher"
                        required
                        optionalText={null}
                        value={row.primaryTeacherId || ''}
                        onChange={(v) => updateRow(row.rowId, { primaryTeacherId: v ?? '' })}
                        placeholder="Select teacher…"
                        options={teacherOptions}
                        disabled={isBusy}
                        error={!row.primaryTeacherId ? 'Required' : undefined}
                      />
                    </div>

                    <div className="min-w-0">
                      <Select
                        label="Co-teacher"
                        clearable
                        value={row.coTeacherId || ''}
                        onChange={(v) => updateRow(row.rowId, { coTeacherId: v ?? '' })}
                        placeholder="Optional…"
                        options={teacherOptions.filter((t) => t.value !== row.primaryTeacherId)}
                        disabled={isBusy}
                      />
                    </div>

                    <div className="min-w-0">
                      <Field label="Max">
                        <Input
                          type="number"
                          min={1}
                          max={200}
                          value={row.maxEnrollment}
                          onChange={(e) =>
                            updateRow(row.rowId, {
                              maxEnrollment: Number(e.target.value) || DEFAULT_MAX,
                            })
                          }
                          aria-label={`Max enrollment for ${row.gradeLabel}`}
                          disabled={isBusy}
                        />
                      </Field>
                    </div>
                  </div>

                  {/* Secondary action: split into sections */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => splitGrade(row)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[rgb(var(--accent-academics-text))] hover:opacity-80 transition-opacity disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Split into sections (A/B…)
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Progress */}
        {progress && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm text-text-secondary">
              <span className="flex items-center gap-2 min-w-0">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span className="truncate">
                  {progress.phase === 'creating'
                    ? `Creating ${progress.label}…`
                    : `Assigning students to ${progress.label}…`}
                </span>
              </span>
              <span className="tabular-nums shrink-0">
                {progress.done} / {progress.total}
              </span>
            </div>
            <div className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-[rgb(var(--accent-academics))] rounded-full transition-all duration-200"
                style={{
                  width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Failures */}
        {failures.length > 0 && (
          <div className="rounded-lg border border-[rgb(var(--state-danger-border)/0.3)] bg-[rgb(var(--state-danger-bg)/0.12)] p-3 space-y-1">
            <p className="text-xs font-medium text-[rgb(var(--state-danger-fg))]">
              {failures.length} homeroom{failures.length === 1 ? '' : 's'} could not be created:
            </p>
            {failures.map((f, i) => (
              <p key={i} className="text-2xs text-text-secondary">
                <span className="font-medium">{f.label}</span> — {f.message}
              </p>
            ))}
          </div>
        )}

        {!allHaveTeacher && rows.length > 0 && !isBusy && (
          <p className="text-xs text-[rgb(var(--state-warning-fg))] flex items-center gap-1.5">
            <UserCog className="w-3.5 h-3.5 shrink-0" />
            Assign a class teacher to every homeroom before creating.
          </p>
        )}

        {enrollmentsIncomplete && rows.length > 0 && !isBusy && (
          <p className="text-xs text-text-tertiary flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
            Loading enrolled students for auto-roster…
          </p>
        )}
      </div>

      <ModalFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isBusy}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleCreate}
          disabled={isBusy || rows.length === 0 || !allHaveTeacher || enrollmentsIncomplete}
          className="min-w-44"
        >
          {isBusy ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Working…
            </>
          ) : (
            <>
              <UsersRound className="w-4 h-4 mr-2" />
              Create {rows.length} homeroom{rows.length === 1 ? '' : 's'}
            </>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
