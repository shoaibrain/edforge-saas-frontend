/**
 * BulkSendReceiptsDrawer — D1 of the finance async-job framework.
 *
 * Backs the `Send receipt` bulk action on the Payments table (closes
 * #230). Posts to /finance/schools/:schoolId/payments/bulk-send-receipt
 * which returns 202 + jobId; the drawer then polls until the job ends.
 *
 * Eligibility: receipts can only be sent for completed payments that
 * actually have a receipt number — refunded/cancelled/failed/no-receipt
 * rows surface as skipped with a one-line reason. The split is the same
 * filter the per-row receipt download applies.
 */

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Mail, Receipt, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  useAsyncBulkJob,
  useBulkSendReceipts,
  type BulkSendReceiptDto,
} from '@edforge/finance-services'
import type { Payment } from '@edforge/types'
import { AsyncJobProgress } from './AsyncJobProgress'

export interface BulkSendReceiptsDrawerProps {
  open: boolean
  onClose: () => void
  payments: Payment[]
  schoolId: string
  onComplete: () => void
}

/**
 * Pure eligibility helper — exported for unit testing.
 * Mirrors the per-row receipt download guard: only completed payments
 * with a receipt number have a PDF to dispatch.
 */
export function splitEligibleReceipts(
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

export function BulkSendReceiptsDrawer({
  open,
  onClose,
  payments,
  schoolId,
  onComplete,
}: BulkSendReceiptsDrawerProps) {
  const [channel, setChannel] = useState<BulkSendReceiptDto['channel']>('email')
  const [jobId, setJobId] = useState<string | null>(null)

  const start = useBulkSendReceipts(schoolId)
  const job = useAsyncBulkJob(schoolId, 'payments', jobId)

  const { eligible, skipped } = useMemo(() => splitEligibleReceipts(payments), [payments])

  const isWorking = start.isPending || (!!jobId && job.data?.status !== 'succeeded' && job.data?.status !== 'failed')

  useEffect(() => {
    if (!job.data) return
    if (job.data.status === 'succeeded') {
      const parts: string[] = [`Sent ${job.data.succeeded} receipt${job.data.succeeded === 1 ? '' : 's'}`]
      if (job.data.skipped > 0) parts.push(`${job.data.skipped} skipped`)
      if (job.data.failed > 0) parts.push(`${job.data.failed} failed`)
      if (job.data.failed === 0 && job.data.skipped === 0) toast.success(parts[0])
      else if (job.data.succeeded === 0)
        toast.error(`No receipts sent — ${job.data.failed} failed; ${job.data.skipped} skipped`)
      else toast.error(parts.join(' · '))
      onComplete()
    } else if (job.data.status === 'failed') {
      toast.error(job.data.error ?? 'Send-receipts job failed.')
    }
  }, [job.data, onComplete])

  const handleClose = () => {
    if (isWorking) return
    setJobId(null)
    setChannel('email')
    start.reset()
    onClose()
  }

  const handleApply = async () => {
    if (eligible.length === 0) return
    try {
      const ack = await start.mutateAsync({
        paymentIds: eligible.map((p) => p.id),
        channel,
      })
      setJobId(ack.jobId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start send-receipts job.')
    }
  }

  const canApply = !isWorking && eligible.length > 0 && !jobId
  const showProgress = !!jobId

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-send-receipts-title"
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
              <div className="flex h-full flex-col bg-[rgb(var(--background-primary))] shadow-xl border-l border-[rgb(var(--border-primary))]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border-primary))]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-[rgb(var(--state-info-bg)/0.18)] flex-shrink-0">
                      <Receipt className="w-5 h-5 text-[rgb(var(--state-info-fg))]" />
                    </div>
                    <div className="min-w-0">
                      <h2
                        id="bulk-send-receipts-title"
                        className="text-lg font-semibold text-[rgb(var(--text-primary))] truncate"
                      >
                        Send receipts
                      </h2>
                      <p className="text-xs text-[rgb(var(--text-tertiary))] tabular-nums">
                        {payments.length} payment{payments.length === 1 ? '' : 's'} selected
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isWorking}
                    className="p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--background-secondary))] transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Close drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                  {showProgress ? (
                    <AsyncJobProgress job={job.data} verbingNoun="Sending receipts" />
                  ) : (
                    <section>
                      <label className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-2">
                        Channel
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['email', 'sms', 'both'] as const).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setChannel(c)}
                            className={`px-3 py-2 text-sm font-medium border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] ${
                              channel === c
                                ? 'bg-[rgb(var(--action-primary-bg)/0.12)] border-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-bg))]'
                                : 'bg-[rgb(var(--background-primary))] border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-secondary))]'
                            }`}
                          >
                            {c === 'email' ? 'Email' : c === 'sms' ? 'SMS' : 'Both'}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  <section>
                    <h3 className="text-sm font-medium text-[rgb(var(--text-primary))] mb-2">
                      Will send ({eligible.length})
                    </h3>
                    {eligible.length === 0 ? (
                      <p className="text-sm text-[rgb(var(--text-tertiary))]">
                        None of the selected payments are eligible — receipts require a completed
                        payment with a receipt number.
                      </p>
                    ) : (
                      <ul className="space-y-1 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-tertiary)/0.4)] p-2 max-h-40 overflow-y-auto">
                        {eligible.map((p) => (
                          <li
                            key={p.id}
                            className="flex items-center justify-between gap-2 px-2 py-1 text-sm"
                          >
                            <span className="text-[rgb(var(--text-primary))] truncate">
                              {p.studentName ?? 'Unknown student'}
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
                        Will skip ({skipped.length})
                      </h3>
                      <ul className="space-y-1 rounded-lg border border-dashed border-[rgb(var(--border-primary))] bg-[rgb(var(--background-tertiary)/0.2)] p-2 max-h-40 overflow-y-auto">
                        {skipped.map(({ payment, reason }) => (
                          <li
                            key={payment.id}
                            className="flex items-center justify-between gap-2 px-2 py-1 text-sm"
                          >
                            <span className="text-[rgb(var(--text-secondary))] truncate">
                              {payment.studentName ?? 'Unknown student'}
                            </span>
                            <span className="text-xs text-[rgb(var(--text-tertiary))] flex-shrink-0">
                              {reason}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>

                <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary)/0.5)]">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isWorking}
                    className="px-4 py-2 text-sm font-medium text-[rgb(var(--text-secondary))] bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary))] rounded-lg hover:bg-[rgb(var(--background-secondary))] transition-colors disabled:opacity-50"
                  >
                    {jobId && (job.data?.status === 'succeeded' || job.data?.status === 'failed') ? 'Close' : 'Cancel'}
                  </button>
                  {!jobId && (
                    <button
                      type="button"
                      onClick={handleApply}
                      disabled={!canApply}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--action-primary-bg))] rounded-lg hover:brightness-95 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
                    >
                      {start.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Starting…
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Send {eligible.length}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
