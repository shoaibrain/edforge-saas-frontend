/**
 * AgreementActiveDialog (FB-3.10)
 *
 * Shown when the single-generate path returns 409 `AGREEMENT_ACTIVE`: an active
 * agreement already covers the student for the requested fee types. Surfaces
 * the agreement id, a link to the existing agreement-priced invoice, and the
 * covered fee types. Operators with `billing:manage` may override and bill from
 * the fee catalog anyway; others see a permission note.
 *
 * Mirrors the CancelInvoiceDialog / BulkIssueConfirmModal idiom in
 * routes/billing/invoices/index.tsx (fixed overlay + framer-motion card + Esc
 * to close). The 409 attaches to the single-generate modal ONLY — bulk-generate
 * records per-student failures in its job result, handled by the existing bulk
 * failure UI.
 */

import { useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, ExternalLink, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@edforge/ui'
import { UuidBadge } from '@edforge/archetype'
import { useTranslation } from '@edforge/i18n'
import { usePermission } from '@edforge/abac'
import { FeeTypeChip } from '../shared'

export interface AgreementActiveDialogProps {
  schoolId: string
  agreementId: string
  existingInvoiceId: string
  coveredFeeTypes: string[]
  /** Retry the generate with `overrideAgreement: true` (only wired when the operator can manage). */
  onOverride: () => void
  isOverriding: boolean
  onClose: () => void
}

export function AgreementActiveDialog({
  schoolId,
  agreementId,
  existingInvoiceId,
  coveredFeeTypes,
  onOverride,
  isOverriding,
  onClose,
}: AgreementActiveDialogProps) {
  const { t } = useTranslation('payments')
  const canManage = usePermission('manage', 'billing', schoolId)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isOverriding) onClose()
    },
    [isOverriding, onClose],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(var(--background-overlay)/0.40)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-xl bg-[rgb(var(--background-primary))] p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agreement-active-title"
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-full bg-[rgb(var(--state-warning-bg)/0.18)] p-2">
            <ShieldCheck className="h-5 w-5 text-[rgb(var(--state-warning-fg))]" />
          </div>
          <div className="min-w-0">
            <h3
              id="agreement-active-title"
              className="text-base font-semibold text-[rgb(var(--text-primary))]"
            >
              {t('agreement.overrideTitle')}
            </h3>
            <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
              {t('agreement.overrideDescription')}
            </p>
          </div>
        </div>

        <div className="mb-4 space-y-3 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium uppercase tracking-wider text-[rgb(var(--text-tertiary))]">
              {t('agreement.title')}
            </span>
            <UuidBadge value={agreementId} />
          </div>

          {coveredFeeTypes.length > 0 && (
            <div className="space-y-1.5">
              <span className="block text-xs font-medium uppercase tracking-wider text-[rgb(var(--text-tertiary))]">
                {t('agreement.coveredFeeTypes')}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {coveredFeeTypes.map((feeType) => (
                  <FeeTypeChip key={feeType} type={feeType} />
                ))}
              </div>
            </div>
          )}

          <Link
            to="/invoices/$invoiceId"
            params={{ invoiceId: existingInvoiceId }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[rgb(var(--action-primary-bg))] hover:underline underline-offset-4"
            onClick={onClose}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t('agreement.viewExistingInvoice')}
          </Link>
        </div>

        {!canManage && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] p-3 text-xs text-[rgb(var(--text-secondary))]">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none text-[rgb(var(--text-tertiary))]" />
            <span>{t('agreement.overrideRequiresManage')}</span>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isOverriding}>
            {t('agreement.keepAgreement')}
          </Button>
          {canManage && (
            <Button
              onClick={onOverride}
              disabled={isOverriding}
              className="bg-[rgb(var(--action-danger-bg))] text-[rgb(var(--action-primary-fg))] hover:brightness-95"
            >
              {isOverriding ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : null}
              {isOverriding ? t('agreement.overrideGenerating') : t('agreement.overrideGenerate')}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
