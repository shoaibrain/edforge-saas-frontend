/**
 * DeleteConfirmDialog Component
 * 
 * Confirmation dialog for deleting a staff member.
 * Uses type-to-confirm pattern for safety - user must type the email to confirm.
 */

import { useState, useEffect } from 'react'
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import type { StaffResponseDto } from '@aibrains/shared-types'
import { Modal, ModalFooter, Button } from '../ui'

export interface DeleteConfirmDialogProps {
  open: boolean
  onClose: () => void
  staff: StaffResponseDto | null
  onConfirm: () => Promise<void>
  isDeleting?: boolean
}

export function DeleteConfirmDialog({
  open,
  onClose,
  staff,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmDialogProps) {
  const { t } = useTranslation('people')
  const [confirmText, setConfirmText] = useState('')

  // Reset confirm text when modal opens/closes
  useEffect(() => {
    if (!open) {
      setConfirmText('')
    }
  }, [open])

  // Check if email matches for confirmation
  const canDelete = confirmText === staff?.email

  const handleConfirm = async () => {
    if (!canDelete) return
    await onConfirm()
  }

  if (!staff) return null

  const fullName = `${staff.firstName ?? ''} ${staff.lastSurname ?? ''}`

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('delete.title')}
      size="sm"
      showCloseButton={!isDeleting}
    >
      <div className="space-y-4">
        {/* Warning icon and message */}
        <div className="flex items-start gap-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
              {t('delete.warning')}
            </h4>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {t('delete.confirmation', { name: fullName })}
            </p>
          </div>
        </div>

        {/* Staff info */}
        <div className="p-4 rounded-lg bg-surface-secondary border border-border-secondary">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-medium">
              {staff.firstName?.[0] ?? '?'}{staff.lastSurname?.[0] ?? '?'}
            </div>
            <div>
              <p className="font-medium text-text-primary">{fullName}</p>
              <p className="text-sm text-text-secondary">{staff.email}</p>
            </div>
          </div>
        </div>

        {/* Type to confirm */}
        <div>
          <label
            htmlFor="confirmEmail"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            {t('delete.typeToConfirm', { email: '' })}
            <span className="font-mono text-red-600 dark:text-red-400">{staff.email}</span>
          </label>
          <input
            id="confirmEmail"
            type="email"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className={`
              w-full px-3 py-2 rounded-lg border
              bg-surface-secondary text-text-primary
              placeholder:text-text-tertiary
              focus:outline-none focus:ring-2 focus:ring-red-500/20
              transition-colors
              ${confirmText && !canDelete ? 'border-red-500' : 'border-border-secondary'}
            `}
            placeholder={t('delete.emailPlaceholder')}
            disabled={isDeleting}
            autoComplete="off"
          />
          {confirmText && !canDelete && (
            <p className="mt-1 text-sm text-red-500">
              {t('delete.emailMismatch')}
            </p>
          )}
        </div>
      </div>

      {/* Footer with actions */}
      <ModalFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isDeleting}
        >
          {t('actions.cancel')}
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleConfirm}
          disabled={!canDelete || isDeleting}
          className="min-w-[100px]"
        >
          {isDeleting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('delete.deleting')}
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              {t('delete.title')}
            </>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
