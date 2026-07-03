/**
 * BulkDeleteStaffModal
 *
 * Confirms deleting N staff records, then fans out through the existing
 * single-row `staffService.deleteStaff` per row via `Promise.allSettled`
 * and surfaces one aggregate toast — the same non-atomic pattern as the
 * students bulk archive (no bulk endpoint exists yet; #303 d-3).
 *
 * Invalidation uses the broad ['staff'] prefix: the directory's query key
 * is the ad-hoc ['staff', schoolId, search, filters] (usePaginatedQuery),
 * which narrower key factories would silently miss.
 */

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import type { StaffResponseDto } from '@aibrains/shared-types'
import { Modal, ModalFooter, Button } from '../ui'
import { staffService } from '../../services/staff.service'

export interface BulkDeleteStaffModalProps {
  open: boolean
  onClose: () => void
  staff: StaffResponseDto[]
  /** Called after at least one delete succeeded (page clears its selection). */
  onComplete: () => void
}

export function BulkDeleteStaffModal({
  open,
  onClose,
  staff,
  onComplete,
}: BulkDeleteStaffModalProps) {
  const { t } = useTranslation('people')
  const queryClient = useQueryClient()
  const [isApplying, setIsApplying] = useState(false)

  const handleClose = () => {
    if (isApplying) return
    onClose()
  }

  const handleConfirm = async () => {
    if (staff.length === 0) return
    setIsApplying(true)
    try {
      const results = await Promise.allSettled(
        staff.map((s) => staffService.deleteStaff(s.staffId)),
      )
      const failed = results.filter((r) => r.status === 'rejected').length
      const ok = results.length - failed

      await queryClient.invalidateQueries({ queryKey: ['staff'] })

      if (failed === 0) {
        toast.success(t('bulkDelete.toasts.success', { count: ok }))
      } else if (ok === 0) {
        toast.error(t('bulkDelete.toasts.allFailed'))
      } else {
        toast.error(t('bulkDelete.toasts.partial', { ok, failed }))
      }

      if (ok > 0) onComplete()
      onClose()
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('bulkDelete.title', { count: staff.length })}
      description={t('bulkDelete.description')}
      size="md"
    >
      <div className="space-y-4">
        {/* Non-atomic fan-out warning */}
        <div className="flex items-start gap-2 rounded-lg border border-[rgb(var(--state-warning-border))] bg-[rgb(var(--state-warning-bg)/0.35)] px-3 py-2 text-xs text-[rgb(var(--state-warning-fg))]">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
          <span>{t('bulkDelete.fanOutNote')}</span>
        </div>

        {/* Targets */}
        <div className="max-h-40 overflow-y-auto rounded-lg border border-[rgb(var(--border-primary)/0.5)] bg-[rgb(var(--background-tertiary)/0.4)] p-2">
          <ul className="space-y-1">
            {staff.map((s) => (
              <li
                key={s.staffId}
                className="flex items-center justify-between gap-2 px-2 py-1 text-sm text-[rgb(var(--text-primary))]"
              >
                <span className="truncate">
                  {s.firstName} {s.lastSurname}
                </span>
                {s.email && (
                  <span className="flex-shrink-0 text-xs text-[rgb(var(--text-tertiary))]">
                    {s.email}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={handleClose} disabled={isApplying}>
          {t('actions.cancel')}
        </Button>
        <Button variant="danger" onClick={handleConfirm} disabled={isApplying || staff.length === 0}>
          {isApplying ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              {t('bulkDelete.deleting')}
            </>
          ) : (
            <>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t('bulkDelete.confirm', { count: staff.length })}
            </>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
