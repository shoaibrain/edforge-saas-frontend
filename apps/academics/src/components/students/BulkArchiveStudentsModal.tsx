/**
 * BulkArchiveStudentsModal — multi-row student withdrawal.
 *
 * Backs the critical-tone `Archive` bulk action on the Students table.
 * No backend bulk endpoint exists yet, so this modal fans the existing
 * single-row `deleteStudent` service (a soft withdraw) via
 * `Promise.allSettled` and surfaces one aggregate toast — the same
 * cheap-path pattern PR #239's BulkExamStatusDrawer established.
 */

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangle, Loader2, UserMinus } from 'lucide-react'
import { Button } from '@edforge/ui'
import type { StudentResponseDto } from '@aibrains/shared-types'
import { deleteStudent } from '../../services/academics.service'
import { studentKeys } from '../../hooks/useStudents'

export interface BulkArchiveStudentsModalProps {
  open: boolean
  onClose: () => void
  /** The selection snapshot at modal-open time. */
  students: StudentResponseDto[]
  /** Called after a successful apply so the page can clear table selection. */
  onComplete: () => void
}

export function BulkArchiveStudentsModal({
  open,
  onClose,
  students,
  onComplete,
}: BulkArchiveStudentsModalProps) {
  const queryClient = useQueryClient()
  const [isApplying, setIsApplying] = useState(false)

  const handleClose = () => {
    if (isApplying) return
    onClose()
  }

  const handleConfirm = async () => {
    if (students.length === 0) return
    setIsApplying(true)
    try {
      const results = await Promise.allSettled(
        students.map((s) => deleteStudent(s.studentId)),
      )
      const failures = results.filter((r) => r.status === 'rejected').length
      const ok = results.length - failures

      queryClient.invalidateQueries({ queryKey: studentKeys.lists() })

      if (failures === 0) {
        toast.success(
          `Withdrew ${ok} student${ok === 1 ? '' : 's'} (reversible by a school administrator)`,
        )
      } else if (ok === 0) {
        toast.error(`No students withdrawn — every request failed`)
      } else {
        toast.error(`Withdrew ${ok}; ${failures} failed`)
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
        aria-labelledby="bulk-archive-students-title"
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
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-[rgb(var(--state-danger-bg)/0.18)] dark:bg-[rgb(var(--state-danger-fg)/0.2)]">
                    <UserMinus className="w-5 h-5 text-[rgb(var(--state-danger-fg))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Dialog.Title
                      id="bulk-archive-students-title"
                      as="h3"
                      className="text-lg font-semibold text-text-primary"
                    >
                      Withdraw {students.length} student{students.length === 1 ? '' : 's'}?
                    </Dialog.Title>
                    <Dialog.Description className="mt-2 text-sm text-text-secondary">
                      Withdrawn students stop appearing on default rosters. A school
                      administrator can reverse this later.
                    </Dialog.Description>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-border-secondary bg-[rgb(var(--background-tertiary)/0.4)] p-2 max-h-40 overflow-y-auto">
                  <ul className="space-y-1">
                    {students.map((s) => (
                      <li
                        key={s.studentId}
                        className="flex items-center justify-between gap-2 px-2 py-1 text-sm text-text-primary"
                      >
                        <span className="truncate">{s.fullName}</span>
                        {s.studentNumber && (
                          <span className="text-xs font-mono text-text-tertiary flex-shrink-0">
                            #{s.studentNumber}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-lg border border-[rgb(var(--state-warning-border)/0.4)] bg-[rgb(var(--state-warning-bg)/0.18)] px-3 py-2 text-xs text-[rgb(var(--state-warning-fg))]">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    Each row is a separate request. A failure on one student doesn't
                    roll back the others.
                  </span>
                </div>

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
                    variant="danger"
                    onClick={handleConfirm}
                    disabled={isApplying || students.length === 0}
                    isLoading={isApplying}
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin me-1.5" />
                        Withdrawing…
                      </>
                    ) : (
                      <>
                        <UserMinus className="w-4 h-4 me-1.5" />
                        Withdraw {students.length}
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
