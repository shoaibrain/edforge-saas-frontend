/**
 * Cancel-invoice confirmation dialog (moved verbatim from the route file
 * during the detail-page redesign; behavior unchanged).
 */

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { Button } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'

export interface CancelInvoiceDialogProps {
  invoiceNumber: string
  isPending: boolean
  onConfirm: (reason: string) => void
  onClose: () => void
}

export function CancelInvoiceDialog({
  invoiceNumber,
  isPending,
  onConfirm,
  onClose,
}: CancelInvoiceDialogProps) {
  const { t } = useTranslation('payments')
  const [reason, setReason] = useState('')

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) onClose()
    },
    [isPending, onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(var(--background-overlay)/0.40)] print:hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[rgb(var(--background-primary))] rounded-xl shadow-xl w-full max-w-sm p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-invoice-title"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-full bg-[rgb(var(--state-danger-bg)/0.18)] ">
            <AlertTriangle className="w-5 h-5 text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]" />
          </div>
          <div>
            <h3 id="cancel-invoice-title" className="text-base font-semibold text-[rgb(var(--text-primary))]">
              {t('invoices.cancelTitle', { invoiceNumber })}
            </h3>
            <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
              {t('invoices.cancelDescriptionPrefix')}{' '}
              <span className="font-semibold text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]">
                {t('invoices.irreversible')}
              </span>
              . {t('invoices.cancelDescriptionSuffix')}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
            {t('invoices.cancelReason')}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('invoices.cancelReasonPlaceholder')}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] resize-none focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {t('invoices.keepInvoice')}
          </Button>
          <Button
            onClick={() => onConfirm(reason.trim())}
            disabled={isPending || !reason.trim()}
            className="bg-[rgb(var(--action-danger-bg))] hover:brightness-95 text-[rgb(var(--action-primary-fg))]"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin me-1.5" />
            ) : (
              <X className="w-4 h-4 me-1.5" />
            )}
            {t('invoices.cancelInvoice')}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
