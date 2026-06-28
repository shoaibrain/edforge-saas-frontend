/**
 * BulkChangeUserRoleModal — multi-user global role change.
 *
 * Backs the `Change role` bulk action on the People (Users) table. No
 * backend bulk endpoint exists yet, so this modal fans the existing
 * single-row `changeGlobalRole` service per row via `Promise.allSettled`
 * and surfaces one aggregate toast — the same cheap-path pattern PR
 * #239's BulkExamStatusDrawer established.
 *
 * Hard-filters the current user so an operator can't change their own
 * role (mirrors the per-row `UserActionsDropdown` self-disable guard in
 * `apps/shell/src/pages/settings/people.tsx`).
 */

import { Fragment, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Shield, ShieldCheck } from 'lucide-react'
import { Button, Select } from '@edforge/ui'
import type { GlobalRole } from '@edforge/types'
import { changeGlobalRole } from '@/services/users.service'
import { userKeys } from '@/hooks/useUsers'
import type { UserResponseDto } from '@/services/users.service'

const ROLE_OPTIONS: { value: GlobalRole; label: string }[] = [
  { value: 'TenantAdmin', label: 'Tenant Admin' },
  { value: 'StandardUser', label: 'Standard User' },
]

export interface BulkChangeUserRoleModalProps {
  open: boolean
  onClose: () => void
  /** The selection snapshot at modal-open time. */
  users: UserResponseDto[]
  /** Current user id — excluded from eligibility (self-demote guard). */
  currentUserId: string
  /** Called after a successful apply so the page can clear table selection. */
  onComplete: () => void
}

/**
 * Pure eligibility helper — exported for unit testing.
 * Skips: current user, users already in the target role.
 */
export function eligibleForRoleChange(
  users: UserResponseDto[],
  currentUserId: string,
  target: GlobalRole,
): { eligible: UserResponseDto[]; skipped: Array<{ user: UserResponseDto; reason: string }> } {
  const eligible: UserResponseDto[] = []
  const skipped: Array<{ user: UserResponseDto; reason: string }> = []
  for (const u of users) {
    if (u.userId === currentUserId) {
      skipped.push({ user: u, reason: 'cannot change your own role' })
    } else if (u.globalRole === target) {
      skipped.push({ user: u, reason: `already ${target === 'TenantAdmin' ? 'Tenant Admin' : 'Standard User'}` })
    } else {
      eligible.push(u)
    }
  }
  return { eligible, skipped }
}

export function BulkChangeUserRoleModal({
  open,
  onClose,
  users,
  currentUserId,
  onComplete,
}: BulkChangeUserRoleModalProps) {
  const queryClient = useQueryClient()
  const [target, setTarget] = useState<GlobalRole>('StandardUser')
  const [isApplying, setIsApplying] = useState(false)

  const { eligible, skipped } = useMemo(
    () => eligibleForRoleChange(users, currentUserId, target),
    [users, currentUserId, target],
  )

  const targetLabel = target === 'TenantAdmin' ? 'Tenant Admin' : 'Standard User'

  const handleClose = () => {
    if (isApplying) return
    onClose()
  }

  const handleConfirm = async () => {
    if (eligible.length === 0) return
    setIsApplying(true)
    try {
      const results = await Promise.allSettled(
        eligible.map((u) => changeGlobalRole(u.userId, target)),
      )
      const failures = results.filter((r) => r.status === 'rejected').length
      const ok = results.length - failures

      queryClient.invalidateQueries({ queryKey: userKeys.all })

      const parts: string[] = [`Set ${ok} user${ok === 1 ? '' : 's'} to ${targetLabel}`]
      if (skipped.length > 0) parts.push(`${skipped.length} skipped`)
      if (failures > 0) parts.push(`${failures} failed`)

      if (failures === 0 && skipped.length === 0) {
        toast.success(parts[0])
      } else if (ok === 0) {
        toast.error(`No users updated — ${failures} failed; ${skipped.length} skipped`)
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
        aria-labelledby="bulk-change-user-role-title"
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
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-[rgb(var(--state-info-bg)/0.18)] dark:bg-[rgb(var(--state-info-fg)/0.2)]">
                    <Shield className="w-5 h-5 text-[rgb(var(--state-info-fg))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Dialog.Title
                      id="bulk-change-user-role-title"
                      as="h3"
                      className="text-lg font-semibold text-[rgb(var(--text-primary))]"
                    >
                      Change role for {eligible.length} user{eligible.length === 1 ? '' : 's'}
                    </Dialog.Title>
                    <Dialog.Description className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                      Assigns the same global role to every eligible selected user.
                    </Dialog.Description>
                  </div>
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="bulk-role-target"
                    className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-1.5"
                  >
                    Target role
                  </label>
                  <Select
                    aria-label="Target role"
                    className="w-full"
                    value={target}
                    onChange={(v) => {
                      if (v === 'TenantAdmin' || v === 'StandardUser') {
                        setTarget(v)
                      }
                    }}
                    options={ROLE_OPTIONS}
                  />
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
                          <span className="text-xs text-[rgb(var(--text-tertiary))] flex-shrink-0">
                            {u.globalRole === 'TenantAdmin' ? 'Admin' : 'User'} → {targetLabel}
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
                    variant="primary"
                    onClick={handleConfirm}
                    disabled={isApplying || eligible.length === 0}
                    isLoading={isApplying}
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                        Updating…
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 mr-1.5" />
                        Apply to {eligible.length}
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
