/**
 * HomeroomSetupModal
 *
 * Assisted "Set up homerooms" flow for the PABSON daily-attendance model.
 * Proposes one homeroom per enabled grade level (operator can split a grade
 * into multiple sections, e.g. Grade 1 A / B), REQUIRES a class teacher
 * (primary) per homeroom, and creates each via `designateHomeroom`.
 *
 * No bulk-create endpoint exists — rows are created one POST at a time with
 * an aggregate progress indicator (FE-S4).
 */

import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Loader2, CheckCircle, UsersRound } from 'lucide-react'
import { Modal, ModalFooter, Button, Field, Input, Select } from '@edforge/ui'
import { useSchoolEnabledGradeOptions } from '../../hooks/useGradeOptions'
import { useSchoolStaff, flattenStaffData, getStaffDisplayName } from '../../hooks/useStaff'
import { useDesignateHomeroom } from '../../hooks/useHomeroom'
import { parseApiError, type DesignateHomeroomDto } from '../../services/academics.service'

// ============================================================================
// TYPES
// ============================================================================

interface ProposedHomeroom {
  /** Local row id (grade + suffix) for React keys + edits. */
  rowId: string
  gradeLabel: string
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
  const designate = useDesignateHomeroom()

  const [rows, setRows] = useState<ProposedHomeroom[]>([])
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [failures, setFailures] = useState<Array<{ label: string; message: string }>>([])

  // Seed one proposed homeroom per enabled grade not already covered.
  useEffect(() => {
    if (!open) return
    const seeded: ProposedHomeroom[] = gradeOptions
      .filter((g) => !existingSectionNumbers.has(g.value))
      .map((g) => ({
        rowId: g.value,
        gradeLabel: g.label,
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
    // Append a lettered section under the same grade (A / B / C …).
    setRows((prev) => {
      const sameGrade = prev.filter((r) => r.gradeLabel === row.gradeLabel)
      const suffix = String.fromCharCode(65 + sameGrade.length) // next letter
      const newRow: ProposedHomeroom = {
        rowId: `${row.rowId}-${suffix}`,
        gradeLabel: row.gradeLabel,
        sectionNumber: `${row.sectionNumber.split('-')[0]}-${suffix}`,
        sectionName: `${row.gradeLabel} Homeroom ${suffix}`,
        primaryTeacherId: '',
        coTeacherId: '',
        maxEnrollment: DEFAULT_MAX,
      }
      const idx = prev.findIndex((r) => r.rowId === row.rowId)
      const next = [...prev]
      next.splice(idx + 1, 0, newRow)
      return next
    })
  }

  const allHaveTeacher = rows.length > 0 && rows.every((r) => r.primaryTeacherId)
  const isCreating = progress !== null && progress.done < progress.total

  const teacherOptions = useMemo(
    () => teachers.map((t) => ({ value: t.staffId, label: getStaffDisplayName(t) })),
    [teachers],
  )

  const handleCreate = async () => {
    setFailures([])
    const created: string[] = []
    const errs: Array<{ label: string; message: string }> = []
    setProgress({ done: 0, total: rows.length })

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const dto: DesignateHomeroomDto = {
        schoolId,
        academicYearId,
        sectionNumber: row.sectionNumber,
        sectionName: row.sectionName || undefined,
        primaryTeacherId: row.primaryTeacherId,
        coTeacherIds: row.coTeacherId ? [row.coTeacherId] : undefined,
        maxEnrollment: row.maxEnrollment,
      }
      try {
        await designate.mutateAsync(dto)
        created.push(row.rowId)
      } catch (error) {
        const parsed = parseApiError(error)
        errs.push({ label: row.sectionName || row.sectionNumber, message: parsed.message })
      }
      setProgress({ done: i + 1, total: rows.length })
    }

    // Drop successfully-created rows; keep failures visible for retry.
    setRows((prev) => prev.filter((r) => !created.includes(r.rowId)))
    setFailures(errs)
    setProgress(null)
    if (errs.length === 0) onClose()
  }

  return (
    <Modal
      open={open}
      onClose={isCreating ? () => {} : onClose}
      title="Set up homerooms"
      description="One homeroom per grade for daily roll-call. Split a grade into sections if needed. Each homeroom needs a class teacher."
      size="2xl"
      showCloseButton={!isCreating}
    >
      <div className="space-y-4">
        {gradesLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-surface-secondary rounded-lg animate-pulse" />
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
          <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
            {/* Header row (desktop) */}
            <div className="hidden sm:grid grid-cols-[1fr_1.4fr_1.4fr_5rem_2rem] gap-2 px-1 text-2xs font-medium text-text-tertiary">
              <span>Grade / Section</span>
              <span>Class Teacher *</span>
              <span>Co-Teacher</span>
              <span>Max</span>
              <span />
            </div>

            {rows.map((row) => (
              <div
                key={row.rowId}
                className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_1.4fr_5rem_2rem] gap-2 items-end rounded-lg border border-border-secondary p-2.5"
              >
                <Field label="Section #" error={undefined} className="sm:[&_label]:sr-only">
                  <Input
                    value={row.sectionNumber}
                    onChange={(e) => updateRow(row.rowId, { sectionNumber: e.target.value })}
                    aria-label={`Section number for ${row.gradeLabel}`}
                    disabled={isCreating}
                  />
                </Field>

                <Select
                  label="Class Teacher"
                  optionalText={null}
                  value={row.primaryTeacherId || ''}
                  onChange={(v) => updateRow(row.rowId, { primaryTeacherId: v ?? '' })}
                  placeholder="Required — select teacher..."
                  options={teacherOptions}
                  disabled={isCreating}
                  className="sm:[&_label]:sr-only"
                  error={!row.primaryTeacherId ? ' ' : undefined}
                />

                <Select
                  label="Co-Teacher"
                  optionalText={null}
                  clearable
                  value={row.coTeacherId || ''}
                  onChange={(v) => updateRow(row.rowId, { coTeacherId: v ?? '' })}
                  placeholder="Optional..."
                  options={teacherOptions.filter((t) => t.value !== row.primaryTeacherId)}
                  disabled={isCreating}
                  className="sm:[&_label]:sr-only"
                />

                <Field label="Max" className="sm:[&_label]:sr-only">
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    value={row.maxEnrollment}
                    onChange={(e) =>
                      updateRow(row.rowId, { maxEnrollment: Number(e.target.value) || DEFAULT_MAX })
                    }
                    aria-label={`Max enrollment for ${row.gradeLabel}`}
                    disabled={isCreating}
                  />
                </Field>

                <div className="flex items-center gap-1 pb-1.5">
                  <button
                    type="button"
                    onClick={() => splitGrade(row)}
                    disabled={isCreating}
                    title="Split grade into another section"
                    aria-label={`Split ${row.gradeLabel} into another section`}
                    className="p-1.5 rounded-md text-text-tertiary hover:text-[rgb(var(--accent-academics-text))] hover:bg-[rgb(var(--accent-academics)/0.1)] transition-colors disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRow(row.rowId)}
                    disabled={isCreating}
                    title="Remove"
                    aria-label={`Remove ${row.gradeLabel} homeroom`}
                    className="p-1.5 rounded-md text-text-tertiary hover:text-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--state-danger-bg)/0.18)] transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Progress */}
        {progress && (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating homerooms… {progress.done} / {progress.total}
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

        {!allHaveTeacher && rows.length > 0 && (
          <p className="text-xs text-[rgb(var(--state-warning-fg))]">
            Assign a class teacher to every homeroom before creating.
          </p>
        )}
      </div>

      <ModalFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isCreating}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleCreate}
          disabled={isCreating || rows.length === 0 || !allHaveTeacher}
          className="min-w-40"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating…
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
