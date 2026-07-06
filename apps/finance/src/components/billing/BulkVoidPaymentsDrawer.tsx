/**
 * BulkVoidPaymentsDrawer — multi-row payment void.
 *
 * Backs the critical-tone `Void selected` bulk action on the Payments
 * table. No backend bulk endpoint exists yet, so this drawer fans the
 * existing single-row `voidPayment` service per row via
 * `Promise.allSettled` and surfaces one aggregate toast — the same
 * cheap-path pattern PR #239's BulkExamStatusDrawer established.
 *
 * Visual chrome mirrors BulkExamStatusDrawer (custom AnimatePresence
 * shell) so multi-row bulk drawers read as a coherent family across
 * the app.
 */

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Ban, Loader2, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from '@edforge/i18n'
import { paymentKeys, voidPayment } from '@edforge/finance-services'
import type { Payment } from '@edforge/types'
import { formatAsyncJobToast, formatKnownSkipReason } from './async-job-i18n'

export interface BulkVoidPaymentsDrawerProps {
  open: boolean
  onClose: () => void
  /** The selection snapshot at drawer-open time. */
  payments: Payment[]
  /** Active school id, forwarded to the void service. */
  schoolId: string
  /** Called after a successful apply so the page can clear table selection. */
  onComplete: () => void
}

/**
 * Pure eligibility helper — exported for unit testing.
 * Mirrors the per-row `VoidPaymentDialog` rule that prevents the backend
 * 400 "Receipt is only available for completed payments": only
 * `status === 'completed' && receiptNumber` rows qualify.
 */
export function splitEligibleVoid(
  payments: Payment[],
): { eligible: Payment[]; skipped: Array<{ payment: Payment; reason: string }> } {
  const eligible: Payment[] = []
  const skipped: Array<{ payment: Payment; reason: string }> = []
  for (const p of payments) {
    if (p.status !== 'completed') {
      skipped.push({ payment: p, reason: `not completed (${p.status})` })
    } else if (!p.receiptNumber) {
      skipped.push({ payment: p, reason: 'no receipt number' })
    } else {
      eligible.push(p)
    }
  }
  return { eligible, skipped }
}

export function BulkVoidPaymentsDrawer({
  open,
  onClose,
  payments,
  schoolId,
  onComplete,
}: BulkVoidPaymentsDrawerProps) {
  const { t } = useTranslation('payments')
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')
  const [isApplying, setIsApplying] = useState(false)

  const { eligible, skipped } = useMemo(
    () => splitEligibleVoid(payments),
    [payments],
  )

  const handleClose = () => {
    if (isApplying) return
    setReason('')
    onClose()
  }

  const handleApply = async () => {
    const trimmed = reason.trim()
    if (eligible.length === 0 || !trimmed) return
    setIsApplying(true)
    try {
      const results = await Promise.allSettled(
        eligible.map((p) =>
          voidPayment(schoolId, p.id, { reason: trimmed }),
        ),
      )
      const failures = results.filter((r) => r.status === 'rejected').length
      const ok = results.length - failures

      // paymentKeys doesn't expose a generic "list" helper; invalidating
      // the namespace root forces refetches on every school payments view
      // and the student-accounts views the void touches.
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })

      const result = formatAsyncJobToast(t, 'voidPayments', ok, skipped.length, failures)
      toast[result.tone](result.message)

      if (ok > 0) onComplete()
      setReason('')
      onClose()
    } finally {
      setIsApplying(false)
    }
  }

  const canApply = !isApplying && eligible.length > 0 && reason.trim().length > 0

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-void-payments-title"
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
          <div className="fixed inset-y-0 right-0 flex max-w-full ps-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-screen max-w-xl h-full"
            >
              <div className="flex h-full flex-col bg-[rgb(var(--background-primary))] shadow-xl border-s border-[rgb(var(--border-primary))]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border-primary))]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-[rgb(var(--state-danger-bg)/0.18)] flex-shrink-0">
                      <Ban className="w-5 h-5 text-[rgb(var(--state-danger-fg))]" />
                    </div>
                    <div className="min-w-0">
                      <h2
                        id="bulk-void-payments-title"
                        className="text-lg font-semibold text-[rgb(var(--text-primary))] truncate"
                      >
                        {t('asyncJobs.voidPayments.title')}
                      </h2>
                      <p className="text-xs text-[rgb(var(--text-tertiary))] tabular-nums">
                        {t('asyncJobs.common.selected.payments', { count: payments.length })}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--background-secondary))] transition-colors flex-shrink-0"
                    aria-label={t('asyncJobs.common.closeDrawer')}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                  <div
                    className="flex items-start gap-2 rounded-lg border border-[rgb(var(--state-danger-border)/0.4)] bg-[rgb(var(--state-danger-bg)/0.18)] px-3 py-2.5 text-sm text-[rgb(var(--state-danger-fg))]"
                    role="alert"
                  >
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{t('asyncJobs.voidPayments.warning')}</span>
                  </div>

                  <section>
                    <label
                      htmlFor="bulk-void-reason"
                      className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-2"
                    >
                      {t('asyncJobs.voidPayments.reason')} <span className="text-[rgb(var(--state-danger-fg))]">*</span>
                    </label>
                    <textarea
                      id="bulk-void-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      placeholder={t('asyncJobs.voidPayments.reasonPlaceholder')}
                      className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] resize-none focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
                    />
                    <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))]">
                      {t('asyncJobs.voidPayments.reasonHelp')}
                    </p>
                  </section>

                  <section>
                    <h3 className="text-sm font-medium text-[rgb(var(--text-primary))] mb-2">
                      {t('asyncJobs.voidPayments.willVoid', { count: eligible.length })}
                    </h3>
                    {eligible.length === 0 ? (
                      <p className="text-sm text-[rgb(var(--text-tertiary))]">
                        {t('asyncJobs.voidPayments.noneEligible')}
                      </p>
                    ) : (
                      <ul className="space-y-1 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-tertiary)/0.4)] p-2 max-h-40 overflow-y-auto">
                        {eligible.map((p) => (
                          <li
                            key={p.id}
                            className="flex items-center justify-between gap-2 px-2 py-1 text-sm"
                          >
                            <span className="text-[rgb(var(--text-primary))] truncate">
                              {p.studentName ?? t('asyncJobs.common.unknownStudent')}
                            </span>
                            <span className="text-xs text-[rgb(var(--text-tertiary))] font-mono flex-shrink-0">
                              {p.receiptNumber}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  {skipped.length > 0 && (
                    <section>
                      <h3 className="text-sm font-medium text-[rgb(var(--text-tertiary))] mb-2">
                        {t('asyncJobs.common.willSkip', { count: skipped.length })}
                      </h3>
                      <ul className="space-y-1 rounded-lg border border-dashed border-[rgb(var(--border-primary))] bg-[rgb(var(--background-tertiary)/0.2)] p-2 max-h-40 overflow-y-auto">
                        {skipped.map(({ payment, reason: skipReason }) => (
                          <li
                            key={payment.id}
                            className="flex items-center justify-between gap-2 px-2 py-1 text-sm"
                          >
                            <span className="text-[rgb(var(--text-secondary))] truncate">
                              {payment.studentName ?? t('asyncJobs.common.unknownStudent')}
                            </span>
                            <span className="text-xs text-[rgb(var(--text-tertiary))] flex-shrink-0">
                              {formatKnownSkipReason(t, skipReason)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>

                {/* Footer */}
                <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary)/0.5)]">
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
                    disabled={!canApply}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--action-danger-bg))] rounded-lg hover:brightness-95 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('asyncJobs.voidPayments.voiding')}
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4" />
                        {t('asyncJobs.voidPayments.apply', { count: eligible.length })}
                      </>
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
