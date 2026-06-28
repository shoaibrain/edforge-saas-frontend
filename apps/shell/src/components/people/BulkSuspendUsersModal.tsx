/**
 * BulkSuspendUsersModal — multi-user suspend.
 *
 * Backs the critical-tone `Suspend` bulk action on the People (Users)
 * table. No backend bulk endpoint exists yet, so this modal fans the
 * existing single-row `updateUser({ status: 'suspended' })` service per
 * row via `Promise.allSettled` and surfaces one aggregate toast — the
 * same cheap-path pattern PR #239's BulkExamStatusDrawer established.
 *
 * Hard-filters the current user (mirrors the per-row dropdown's
 * self-disable guard) and rows already suspended.
 */

import { Fragment, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangle, Loader2, ShieldAlert } from 'lucide-react'
import { Button } from '@edforge/ui'
import { updateUser } from '@/services/users.service'
import { userKeys } from '@/hooks/useUsers'
import type { UserResponseDto } from '@/services/users.service'

export interface BulkSuspendUsersModalProps {
  open: boolean
  onClose: () => void
  /** The selection snapshot at modal-open time. */
  users: UserResponseDto[]
  /** Current user id — excluded from eligibility. */
  currentUserId: string
  /** Called after a successful apply so the page can clear table selection. */
  onComplete: () => void
}

/**
 * Pure eligibility helper — exported for unit testing.
 * Skips: current user (self-disable guard); rows already suspended.
 */
export function eligibleForSuspend(
  users: UserResponseDto[],
  currentUserId: string,
): { eligible: UserResponseDto[]; skipped: Array<{ user: UserResponseDto; reason: string }> } {
  const eligible: UserResponseDto[] = []
  const skipped: Array<{ user: UserResponseDto; reason: string }> = []
  for (const u of users) {
    if (u.userId === currentUserId) {
      skipped.push({ user: u, reason: 'cannot suspend yourself' })
    } else if (u.status === 'suspended') {
      skipped.push({ user: u, reason: 'already suspended' })
    } else {
      eligible.push(u)
    }
  }
  return { eligible, skipped }
}

export function BulkSuspendUsersModal({
  open,
  onClose,
  users,
  currentUserId,
  onComplete,
}: BulkSuspendUsersModalProps) {
  const queryClient = useQueryClient()
  const [isApplying, setIsApplying] = useState(false)

  const { eligible, skipped } = useMemo(
    () => eligibleForSuspend(users, currentUserId),
    [users, currentUserId],
  )

  const handleClose = () => {
    if (isApplying) return
    onClose()
  }

  const handleConfirm = async () => {
    if (eligible.length === 0) return
    setIsApplying(true)
    try {
      const results = await Promise.allSettled(
        eligible.map((u) => updateUser(u.userId, { status: 'suspended' })),
      )
      const failures = results.filter((r) => r.status === 'rejected').length
      const ok = results.length - failures

      queryClient.invalidateQueries({ queryKey: userKeys.all })

      const parts: string[] = [`Suspended ${ok} user${ok === 1 ? '' : 's'}`]
      if (skipped.length > 0) parts.push(`${skipped.length} skipped`)
      if (failures > 0) parts.push(`${failures} failed`)

      if (failures === 0 && skipped.length === 0) {
        toast.success(parts[0])
      } else if (ok === 0) {
        toast.error(`No users suspended — ${failures} failed; ${skipped.length} skipped`)
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
        aria-labelledby="bulk-suspend-users-title"
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary))] p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-[rgb(var(--state-danger-bg)/0.18)] dark:bg-[rgb(var(--state-danger-fg)/0.2)]">
                    <ShieldAlert className="w-5 h-5 text-[rgb(var(--state-danger-fg))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Dialog.Title
                      id="bulk-suspend-users-title"
                      as="h3"
                      className="text-lg font-semibold text-[rgb(var(--text-primary))]"
                    >
                      Suspend {eligible.length} user{eligible.length === 1 ? '' : 's'}?
                    </Dialog.Title>
                    <Dialog.Description className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                      Immediately revokes access and any active sessions. The users
                      can be re-activated later from the row action menu.
                    </Dialog.Description>
                  </div>
                </div>

                {eligible.length > 0 && (
                  <div className="mt-4 rounded-lg border border-[rgb(var(--border-secondary))] bg-[rgb(var(--background-tertiary)/0.4)] p-2 max-h-40 overflow-y-auto">
                    <ul className="space-y-1">
                      {eligible.map((u) => (
                        <li
                          key={u.userId}
                          className="flex items-center justify-between gap-2 px-2 py-1 text-sm"
                        >
                          <span className="text-[rgb(var(--text-primary))] truncate">
                            {u.firstName} {u.lastName}
                          </span>
                          <span className="text-xs text-[rgb(var(--text-tertiary))] truncate flex-shrink-0">
                            {u.email}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {skipped.length > 0 && (
                  <div className="mt-2 text-xs text-[rgb(var(--text-tertiary))]">
                    {skipped.length} skipped: {skipped.map((s) => `${s.user.firstName} ${s.user.lastName} (${s.reason})`).join(', ')}
                  </div>
                )}

                <div className="mt-4 flex items-start gap-2 rounded-lg border border-[rgb(var(--state-warning-border)/0.4)] bg-[rgb(var(--state-warning-bg)/0.18)] px-3 py-2 text-xs text-[rgb(var(--state-warning-fg))]">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    Each row is a separate request. A failure on one user doesn't roll
                    back the others.
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
                    disabled={isApplying || eligible.length === 0}
                    isLoading={isApplying}
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                        Suspending…
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4 mr-1.5" />
                        Suspend {eligible.length}
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
