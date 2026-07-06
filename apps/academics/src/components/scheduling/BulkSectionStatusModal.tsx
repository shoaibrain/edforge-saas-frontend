/**
 * BulkSectionStatusModal — bulk activate / deactivate sections.
 *
 * Parametrised by `targetActive: boolean`. The two Activate / Deactivate
 * bulk actions on the Sections table both open this modal with the
 * corresponding target. Fans `updateSection` per row via
 * `Promise.allSettled`; surfaces one aggregate toast — the same
 * cheap-path pattern PR #239's BulkExamStatusDrawer established.
 */

import { Fragment, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangle, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@edforge/ui'
import type { SectionResponseDto } from '@aibrains/shared-types'
import { updateSection } from '../../services/academics.service'
import { sectionKeys } from '../../hooks/useSections'

export interface BulkSectionStatusModalProps {
  open: boolean
  onClose: () => void
  /** The selection snapshot at modal-open time. */
  sections: SectionResponseDto[]
  /** Target state — true = activate; false = deactivate. */
  targetActive: boolean
  /** Active school id, forwarded to the section service. */
  schoolId: string
  /** Called after a successful apply so the page can clear table selection. */
  onComplete: () => void
}

/**
 * Pure eligibility helper — exported for unit testing.
 * Rows already in the target state are dropped to `skipped`; everything
 * else is `eligible`.
 */
export function splitEligibleSections(
  sections: SectionResponseDto[],
  targetActive: boolean,
): { eligible: SectionResponseDto[]; skipped: SectionResponseDto[] } {
  const eligible: SectionResponseDto[] = []
  const skipped: SectionResponseDto[] = []
  for (const s of sections) {
    if (s.isActive === targetActive) skipped.push(s)
    else eligible.push(s)
  }
  return { eligible, skipped }
}

export function BulkSectionStatusModal({
  open,
  onClose,
  sections,
  targetActive,
  schoolId,
  onComplete,
}: BulkSectionStatusModalProps) {
  const queryClient = useQueryClient()
  const [isApplying, setIsApplying] = useState(false)

  const { eligible, skipped } = useMemo(
    () => splitEligibleSections(sections, targetActive),
    [sections, targetActive],
  )

  // Deactivation warning surfaces non-zero enrollments — operators don't
  // necessarily realise that flipping off a section doesn't move the
  // students out of it.
  const enrolledCount = useMemo(
    () =>
      targetActive
        ? 0
        : eligible.reduce((sum, s) => sum + (s.currentEnrollment ?? 0), 0),
    [eligible, targetActive],
  )

  const verb = targetActive ? 'Activate' : 'Deactivate'
  const verbed = targetActive ? 'Activated' : 'Deactivated'
  const Icon = targetActive ? ToggleRight : ToggleLeft

  const handleClose = () => {
    if (isApplying) return
    onClose()
  }

  const handleConfirm = async () => {
    if (eligible.length === 0) return
    setIsApplying(true)
    try {
      const results = await Promise.allSettled(
        eligible.map((s) =>
          // `isActive` isn't on the public `UpdateSectionDto` shape yet but
          // the backend accepts it — mirrors `routes/classrooms/index.tsx`
          // `handleToggleActive`'s `as any` cast.
          updateSection(s.sectionId, schoolId, { isActive: targetActive } as Parameters<typeof updateSection>[2]),
        ),
      )
      const failures = results.filter((r) => r.status === 'rejected').length
      const ok = results.length - failures

      queryClient.invalidateQueries({ queryKey: sectionKeys.lists() })

      const parts: string[] = [`${verbed} ${ok} section${ok === 1 ? '' : 's'}`]
      if (skipped.length > 0) parts.push(`${skipped.length} skipped`)
      if (failures > 0) parts.push(`${failures} failed`)

      if (failures === 0 && skipped.length === 0) {
        toast.success(parts[0])
      } else if (ok === 0) {
        toast.error(`No sections ${verbed.toLowerCase()} — ${failures} failed; ${skipped.length} skipped`)
      } else {
        toast.error(parts.join(' · '))
      }

      if (ok > 0) onComplete()
      onClose()
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={handleClose}
        aria-labelledby="bulk-section-status-title"
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[rgb(var(--background-overlay)/0.40)] backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-surface-primary border border-border-primary p-6 text-start align-middle shadow-xl transition-all">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      targetActive
                        ? 'bg-[rgb(var(--state-success-bg)/0.18)] dark:bg-[rgb(var(--state-success-fg)/0.2)]'
                        : 'bg-[rgb(var(--state-warning-bg)/0.18)] dark:bg-[rgb(var(--state-warning-fg)/0.2)]'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        targetActive
                          ? 'text-[rgb(var(--state-success-fg))]'
                          : 'text-[rgb(var(--state-warning-fg))]'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Dialog.Title
                      id="bulk-section-status-title"
                      as="h3"
                      className="text-lg font-semibold text-text-primary"
                    >
                      {verb} {eligible.length} section{eligible.length === 1 ? '' : 's'}?
                    </Dialog.Title>
                    <Dialog.Description className="mt-2 text-sm text-text-secondary">
                      {skipped.length > 0 ? (
                        <>
                          {sections.length - skipped.length} of {sections.length}{' '}
                          selected — {skipped.length} already{' '}
                          {targetActive ? 'active' : 'inactive'}.
                        </>
                      ) : (
                        <>
                          Flips the active flag on each selected section. Students
                          and rosters are not modified.
                        </>
                      )}
                    </Dialog.Description>
                  </div>
                </div>

                {!targetActive && enrolledCount > 0 && (
                  <div
                    className="mt-4 flex items-start gap-2 rounded-lg border border-[rgb(var(--state-warning-border)/0.4)] bg-[rgb(var(--state-warning-bg)/0.18)] px-3 py-2.5 text-sm text-[rgb(var(--state-warning-fg))]"
                    role="alert"
                  >
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      {enrolledCount} student{enrolledCount === 1 ? '' : 's'} currently
                      enrolled across these sections — deactivating doesn't unenroll
                      them.
                    </span>
                  </div>
                )}

                {eligible.length > 0 && (
                  <div className="mt-4 rounded-lg border border-border-secondary bg-[rgb(var(--background-tertiary)/0.4)] p-2 max-h-40 overflow-y-auto">
                    <ul className="space-y-1">
                      {eligible.map((s) => (
                        <li
                          key={s.sectionId}
                          className="flex items-center justify-between gap-2 px-2 py-1 text-sm text-text-primary"
                        >
                          <span className="truncate">
                            {s.sectionName || `Section ${s.sectionNumber}`}
                          </span>
                          <span className="text-xs text-text-tertiary tabular-nums flex-shrink-0">
                            {s.currentEnrollment}/{s.maxEnrollment}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {skipped.length > 0 && (
                  <div className="mt-2 text-xs text-text-tertiary">
                    Skipped: {skipped.map((s) => s.sectionName || `Section ${s.sectionNumber}`).join(', ')}
                  </div>
                )}

                <div className="mt-6 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isApplying}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant={targetActive ? 'primary' : 'danger'}
                    onClick={handleConfirm}
                    disabled={isApplying || eligible.length === 0}
                    isLoading={isApplying}
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin me-1.5" />
                        Applying…
                      </>
                    ) : (
                      <>
                        <Icon className="w-4 h-4 me-1.5" />
                        {verb} {eligible.length}
                      </>
                    )}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
