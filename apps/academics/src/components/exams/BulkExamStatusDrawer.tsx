/**
 * BulkExamStatusDrawer — multi-row exam status transition.
 *
 * Backs the "Change status" bulk action on the Examinations table.
 * Strategy is the "cheap path" pattern from PR #220's per-list adoption
 * commit body: there is no backend bulk-transition endpoint, so this
 * drawer fans the existing single-row mutation out via
 * `Promise.allSettled` and surfaces one aggregate toast at the end —
 * mirroring `BulkDeleteConfirmModal` in
 * `apps/shell/src/pages/settings/school-departments.tsx`.
 *
 * Visual chrome mirrors the sibling `ExamDrawer` (custom AnimatePresence
 * shell, not the shared `@edforge/ui` Drawer) so the two drawers read
 * as a coherent family inside the exams folder.
 */

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Flag, Loader2, X, AlertTriangle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ExamResponseDto, ExamStatus } from '@aibrains/shared-types'
import { examKeys } from '../../hooks/useExams'
import { transitionExamStatus, parseApiError } from '../../services/academics.service'
import { getExamStatusMeta } from '../../schemas/exam.form'
import {
  EXAM_STATUS_PIPELINE,
  getExamTransitionActions,
  type ExamTransitionAction,
} from '../../schemas/exam-state-machine'
import { useAcademicsI18n } from '../../lib/i18n'

// ============================================================================
// PUBLIC API
// ============================================================================

export interface BulkExamStatusDrawerProps {
  open: boolean
  onClose: () => void
  /** The selection snapshot at drawer-open time. */
  exams: ExamResponseDto[]
  /** Called after a successful apply so the page can clear table selection. */
  onComplete: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BulkExamStatusDrawer({
  open,
  onClose,
  exams,
  onComplete,
}: BulkExamStatusDrawerProps) {
  const queryClient = useQueryClient()
  const { t, formatNumber, formatCount } = useAcademicsI18n()

  // Intersection of allowed next statuses across the selection — exposed to
  // the operator as the dropdown options. Any picked target outside this set
  // would 409 on at least one row, so we constrain the picker eagerly.
  const intersection = useMemo(
    () => computeTargetIntersection(exams),
    [exams],
  )

  const [target, setTarget] = useState<ExamStatus | null>(null)
  const [notes, setNotes] = useState('')
  const [isApplying, setIsApplying] = useState(false)

  // Seed the target with the first intersection member whenever the drawer
  // re-opens with a new selection (preserves user choice within a session
  // but resets between opens).
  useEffect(() => {
    if (!open) return
    setTarget(intersection.actions[0]?.to ?? null)
    setNotes('')
  }, [open, intersection.actions])

  const targetAction = useMemo<ExamTransitionAction | null>(
    () => intersection.actions.find((a) => a.to === target) ?? null,
    [intersection.actions, target],
  )

  // The eligible-rows set — defensive: should equal `exams` whenever
  // `target` is from the intersection, but recomputed so a manual override
  // (e.g. dev-tools mutating state) still degrades gracefully.
  const eligibleRows = useMemo(() => {
    if (!target) return [] as ExamResponseDto[]
    return exams.filter((e) =>
      getExamTransitionActions(e.status).some((a) => a.to === target),
    )
  }, [exams, target])

  const skippedRows = useMemo(
    () => exams.filter((e) => !eligibleRows.includes(e)),
    [exams, eligibleRows],
  )

  const grouped = useMemo(() => groupByStatus(exams), [exams])

  const handleClose = () => {
    if (isApplying) return
    onClose()
  }

  const handleApply = async () => {
    if (!target || eligibleRows.length === 0) return
    setIsApplying(true)
    try {
      const results = await Promise.allSettled(
        eligibleRows.map((e) =>
          transitionExamStatus(
            e.examId,
            e.schoolId,
            target,
            notes.trim() || undefined,
          ),
        ),
      )
      const failures = results.filter((r) => r.status === 'rejected')
      const ok = results.length - failures.length
      const skippedCount = skippedRows.length
      const targetLabel = t(`examModule.status.${target}`, {
        defaultValue: getExamStatusMeta(target).label,
      })

      // Invalidate once after the fan-out — the per-row hook would have
      // invalidated detail keys, but no exam detail page is open during
      // bulk use; list invalidation is enough to refresh the table.
      queryClient.invalidateQueries({ queryKey: examKeys.lists() })

      if (failures.length === 0 && skippedCount === 0) {
        toast.success(t('examModule.bulkDrawer.toast.movedAll', {
          count: ok,
          value: formatNumber(ok),
          target: targetLabel,
        }))
      } else if (failures.length > 0 && ok === 0) {
        const firstError = parseApiError(
          (failures[0] as PromiseRejectedResult).reason as Error,
        ).message
        toast.error(t('examModule.bulkDrawer.toast.noneMoved', { error: firstError }))
      } else {
        const parts: string[] = [
          t('examModule.bulkDrawer.toast.movedPartial', {
            count: ok,
            value: formatNumber(ok),
            target: targetLabel,
          }),
        ]
        if (skippedCount > 0) {
          parts.push(t('examModule.bulkDrawer.toast.skipped', {
            count: skippedCount,
            value: formatNumber(skippedCount),
          }))
        }
        if (failures.length > 0) {
          parts.push(t('examModule.bulkDrawer.toast.failed', {
            count: failures.length,
            value: formatNumber(failures.length),
          }))
        }
        toast.error(parts.join(t('examModule.bulkDrawer.toast.separator')))
      }

      if (ok > 0) {
        onComplete()
      }
      onClose()
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-exam-status-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[rgb(var(--background-overlay)/0.30)] backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) handleClose()
            }}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-screen max-w-xl h-full"
            >
              <div className="flex h-full flex-col bg-surface-primary shadow-xl border-l border-border-secondary">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-secondary">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[rgb(var(--state-info-bg)/0.18)] to-[rgb(var(--state-info-bg)/0.10)] flex-shrink-0">
                      <Flag className="w-5 h-5 text-[rgb(var(--state-info-fg))]" />
                    </div>
                    <div className="min-w-0">
                      <h2
                        id="bulk-exam-status-title"
                        className="text-lg font-semibold text-text-primary truncate"
                      >
                        {t('examModule.bulkDrawer.title')}
                      </h2>
                      <p className="text-xs text-text-tertiary tabular-nums">
                        {formatCount('examModule.bulkDrawer.selectedCount', exams.length)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors flex-shrink-0"
                    aria-label={t('examModule.detail.closeDrawer')}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                  {/* Target picker */}
                  <section>
                    <h3 className="text-sm font-medium text-text-primary mb-2">
                      {t('examModule.bulkDrawer.moveTo')}
                    </h3>
                    {intersection.actions.length === 0 ? (
                      <div
                        className="rounded-lg border border-dashed border-[rgb(var(--border-primary))] bg-[rgb(var(--background-tertiary)/0.4)] px-3 py-3 text-sm text-text-secondary"
                        role="status"
                      >
                        {t('examModule.bulkDrawer.noSharedTarget')}
                      </div>
                    ) : (
                      <div
                        className="flex flex-wrap gap-2"
                        role="radiogroup"
                        aria-label={t('examModule.bulkDrawer.targetStatusAria')}
                      >
                        {intersection.actions.map((action) => {
                          const isActive = action.to === target
                          const actionLabel = t(`examModule.transitions.${action.to}`, {
                            defaultValue: action.label,
                          })
                          const statusLabel = t(`examModule.status.${action.to}`, {
                            defaultValue: getExamStatusMeta(action.to).label,
                          })
                          return (
                            <button
                              key={action.to}
                              type="button"
                              role="radio"
                              aria-checked={isActive}
                              onClick={() => setTarget(action.to)}
                              className={[
                                'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border transition-colors',
                                'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]',
                                isActive
                                  ? 'bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] border-[rgb(var(--border-focus))]'
                                  : 'bg-surface-primary text-text-secondary border-border-primary hover:border-[rgb(var(--border-focus))] hover:text-text-primary',
                              ].join(' ')}
                            >
                              {actionLabel}
                              <span className="text-xs opacity-80">
                                ({statusLabel})
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </section>

                  {/* Confirm copy for warning-tone targets */}
                  {targetAction?.confirm && (
                    <div
                      className="flex items-start gap-2 rounded-lg border border-[rgb(var(--state-warning-border)/0.4)] bg-[rgb(var(--state-warning-bg)/0.18)] px-3 py-2.5 text-sm text-[rgb(var(--state-warning-fg))]"
                      role="alert"
                    >
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>
                        {t(`examModule.transitionConfirm.${targetAction.to}`, {
                          defaultValue: targetAction.confirm,
                        })}
                      </span>
                    </div>
                  )}

                  {/* Optional notes */}
                  <section>
                    <label
                      htmlFor="bulk-exam-status-notes"
                      className="block text-sm font-medium text-text-primary mb-2"
                    >
                      {t('examModule.bulkDrawer.notes')}{' '}
                      <span className="text-text-tertiary font-normal">
                        {t('examModule.bulkDrawer.optional')}
                      </span>
                    </label>
                    <textarea
                      id="bulk-exam-status-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder={t('examModule.bulkDrawer.notesPlaceholder')}
                      className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] resize-none focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
                    />
                  </section>

                  {/* Per-row preview, grouped by current status */}
                  <section>
                    <h3 className="text-sm font-medium text-text-primary mb-2">
                      {t('examModule.bulkDrawer.selection', { count: formatNumber(exams.length) })}
                    </h3>
                    <div className="space-y-3">
                      {EXAM_STATUS_PIPELINE.flatMap((status) => {
                        const rows = grouped[status]
                        if (!rows || rows.length === 0) return []
                        const statusMeta = getExamStatusMeta(status)
                        return [
                          <div key={status}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusMeta.className}`}
                              >
                                <span
                                  aria-hidden
                                  className="inline-block w-1.5 h-1.5 rounded-full bg-current"
                                />
                                {t(`examModule.status.${status}`, {
                                  defaultValue: statusMeta.label,
                                })}
                              </span>
                              <span className="text-xs text-text-tertiary tabular-nums">
                                {formatCount('examModule.bulkDrawer.statusCount', rows.length)}
                              </span>
                            </div>
                            <ul className="space-y-1">
                              {rows.map((exam) => {
                                const eligible =
                                  target != null &&
                                  getExamTransitionActions(exam.status).some(
                                    (a) => a.to === target,
                                  )
                                return (
                                  <li
                                    key={exam.examId}
                                    className="flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-md bg-[rgb(var(--background-tertiary)/0.4)] text-sm"
                                  >
                                    <span className="text-text-primary truncate">
                                      {exam.examName}
                                    </span>
                                    {target == null ? (
                                      <span className="text-xs text-text-tertiary">
                                        {t('examModule.bulkDrawer.pickTarget')}
                                      </span>
                                    ) : eligible ? (
                                      <span className="inline-flex items-center gap-1 text-xs text-[rgb(var(--state-success-fg))]">
                                        {t('examModule.bulkDrawer.targetPreview', {
                                          target: t(`examModule.status.${target}`, {
                                            defaultValue: getExamStatusMeta(target).label,
                                          }),
                                        })}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
                                        {t('examModule.bulkDrawer.skippedPreview', {
                                          target: t(`examModule.status.${target}`, {
                                            defaultValue: getExamStatusMeta(target).label,
                                          }),
                                        })}
                                      </span>
                                    )}
                                  </li>
                                )
                              })}
                            </ul>
                          </div>,
                        ]
                      })}
                    </div>
                  </section>
                </div>

                {/* Footer */}
                <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-border-secondary bg-surface-secondary/50">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isApplying}
                    className="px-4 py-2 text-sm font-medium text-[rgb(var(--text-secondary))] bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary))] rounded-lg hover:bg-[rgb(var(--background-secondary))] transition-colors disabled:opacity-50"
                  >
                    {t('actions.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={
                      isApplying || target == null || eligibleRows.length === 0
                    }
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--action-primary-bg))] rounded-lg hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('examModule.bulkDrawer.applying')}
                      </>
                    ) : (
                      <>{t('examModule.bulkDrawer.applyTo', { count: formatNumber(eligibleRows.length) })}</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// HELPERS (exported for unit testing where useful)
// ============================================================================

interface TargetIntersection {
  /** Actions reachable from every selected row, in pipeline order. */
  actions: ExamTransitionAction[]
}

/**
 * Compute the set of transition actions that every selected exam can take.
 * Returns canonical pipeline ordering (draft → scheduled → in_progress →
 * closed → published), preserving the first non-null action's label per
 * target — labels are consistent across the matrix today (e.g. every row
 * with a `scheduled` outgoing action calls it "Schedule").
 */
export function computeTargetIntersection(
  exams: ExamResponseDto[],
): TargetIntersection {
  if (exams.length === 0) return { actions: [] }

  const perRow = exams.map((e) => getExamTransitionActions(e.status))
  const first = perRow[0]
  const intersected = first.filter((action) =>
    perRow.every((row) => row.some((a) => a.to === action.to)),
  )
  // Order by the canonical pipeline so the picker reads draft → published.
  intersected.sort(
    (a, b) =>
      EXAM_STATUS_PIPELINE.indexOf(a.to) - EXAM_STATUS_PIPELINE.indexOf(b.to),
  )
  return { actions: intersected }
}

function groupByStatus(
  exams: ExamResponseDto[],
): Partial<Record<ExamStatus, ExamResponseDto[]>> {
  const out: Partial<Record<ExamStatus, ExamResponseDto[]>> = {}
  for (const exam of exams) {
    const bucket = out[exam.status] ?? []
    bucket.push(exam)
    out[exam.status] = bucket
  }
  return out
}
