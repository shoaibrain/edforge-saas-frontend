/**
 * BulkSendInvoiceReminderDrawer — D2 of the finance async-job framework.
 *
 * Backs the `Send reminder` bulk action on the Invoices table (closes
 * #236). Posts to /finance/schools/:schoolId/invoices/bulk-send-reminder
 * which returns 202 + jobId; the drawer polls until terminal.
 *
 * Eligibility: only invoices that still owe money — issued,
 * partially_paid, or overdue — qualify. Drafts, paid, cancelled, and
 * written-off rows surface as skipped. Backend additionally rate-limits
 * to avoid reminder-spamming the same guardian; rate-limited rows come
 * back as `skipped` in the job result with reason copy from the BE.
 */

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@edforge/i18n'
import { UuidBadge } from '@edforge/archetype'
import {
  useAsyncBulkJob,
  useBulkSendInvoiceReminders,
  type BulkSendReminderDto,
} from '@edforge/finance-services'
import type { Invoice, InvoiceStatus } from '@edforge/types'
import { AsyncJobProgress } from './AsyncJobProgress'
import {
  formatAsyncJobToast,
  formatChannelLabel,
  formatKnownSkipReason,
} from './async-job-i18n'

export interface BulkSendInvoiceReminderDrawerProps {
  open: boolean
  onClose: () => void
  invoices: Invoice[]
  schoolId: string
  onComplete: () => void
}

const ELIGIBLE_STATUSES: ReadonlyArray<InvoiceStatus> = [
  'issued',
  'partially_paid',
  'overdue',
]

/** Pure eligibility helper — exported for unit testing. */
export function splitEligibleReminders(
  invoices: Invoice[],
): { eligible: Invoice[]; skipped: Array<{ invoice: Invoice; reason: string }> } {
  const eligible: Invoice[] = []
  const skipped: Array<{ invoice: Invoice; reason: string }> = []
  for (const inv of invoices) {
    if (ELIGIBLE_STATUSES.includes(inv.status)) {
      eligible.push(inv)
    } else {
      skipped.push({ invoice: inv, reason: `not outstanding (${inv.status})` })
    }
  }
  return { eligible, skipped }
}

const MAX_NOTE_LEN = 240

export function BulkSendInvoiceReminderDrawer({
  open,
  onClose,
  invoices,
  schoolId,
  onComplete,
}: BulkSendInvoiceReminderDrawerProps) {
  const { t } = useTranslation('payments')
  const [channel, setChannel] = useState<BulkSendReminderDto['channel']>('email')
  const [note, setNote] = useState('')
  const [jobId, setJobId] = useState<string | null>(null)

  const start = useBulkSendInvoiceReminders(schoolId)
  const job = useAsyncBulkJob(schoolId, 'invoices', jobId)

  const { eligible, skipped } = useMemo(() => splitEligibleReminders(invoices), [invoices])

  const isWorking = start.isPending || (!!jobId && job.data?.status !== 'succeeded' && job.data?.status !== 'failed')

  useEffect(() => {
    if (!job.data) return
    if (job.data.status === 'succeeded') {
      const result = formatAsyncJobToast(
        t,
        'reminders',
        job.data.succeeded,
        job.data.skipped,
        job.data.failed,
      )
      toast[result.tone](result.message)
      onComplete()
    } else if (job.data.status === 'failed') {
      toast.error(job.data.error ?? t('asyncJobs.reminders.jobFailed'))
    }
  }, [job.data, onComplete, t])

  const handleClose = () => {
    if (isWorking) return
    setJobId(null)
    setNote('')
    setChannel('email')
    start.reset()
    onClose()
  }

  const handleApply = async () => {
    if (eligible.length === 0) return
    try {
      const trimmed = note.trim()
      const ack = await start.mutateAsync({
        invoiceIds: eligible.map((i) => i.id),
        channel,
        ...(trimmed.length > 0 && { customNote: trimmed }),
      })
      setJobId(ack.jobId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('asyncJobs.reminders.failedToStart'))
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
          aria-labelledby="bulk-send-reminder-title"
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
                <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border-primary))]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-[rgb(var(--state-warning-bg)/0.18)] flex-shrink-0">
                      <Bell className="w-5 h-5 text-[rgb(var(--state-warning-fg))]" />
                    </div>
                    <div className="min-w-0">
                      <h2
                        id="bulk-send-reminder-title"
                        className="text-lg font-semibold text-[rgb(var(--text-primary))] truncate"
                      >
                        {t('asyncJobs.reminders.title')}
                      </h2>
                      <p className="text-xs text-[rgb(var(--text-tertiary))] tabular-nums">
                        {t('asyncJobs.common.selected.invoices', { count: invoices.length })}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isWorking}
                    className="p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--background-secondary))] transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label={t('asyncJobs.common.closeDrawer')}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                  {showProgress ? (
                    <AsyncJobProgress job={job.data} verbingNoun={t('asyncJobs.reminders.progress')} />
                  ) : (
                    <>
                      <section>
                        <label className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-2">
                          {t('asyncJobs.common.channel')}
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
                              {formatChannelLabel(t, c)}
                            </button>
                          ))}
                        </div>
                      </section>

                      <section>
                        <label
                          htmlFor="bulk-reminder-note"
                          className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-2"
                        >
                          {t('asyncJobs.reminders.customNote')}{' '}
                          <span className="text-[rgb(var(--text-tertiary))] font-normal">
                            {t('asyncJobs.common.optional')}
                          </span>
                        </label>
                        <textarea
                          id="bulk-reminder-note"
                          value={note}
                          onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE_LEN))}
                          rows={3}
                          placeholder={t('asyncJobs.reminders.customNotePlaceholder')}
                          className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] resize-none focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
                        />
                        <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))] tabular-nums">
                          {note.length} / {MAX_NOTE_LEN}
                        </p>
                      </section>
                    </>
                  )}

                  <section>
                    <h3 className="text-sm font-medium text-[rgb(var(--text-primary))] mb-2">
                      {t('asyncJobs.reminders.willRemind', { count: eligible.length })}
                    </h3>
                    {eligible.length === 0 ? (
                      <p className="text-sm text-[rgb(var(--text-tertiary))]">
                        {t('asyncJobs.reminders.noneEligible')}
                      </p>
                    ) : (
                      <ul className="space-y-1 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-tertiary)/0.4)] p-2 max-h-40 overflow-y-auto">
                        {eligible.map((inv) => (
                          <li
                            key={inv.id}
                            className="flex items-center justify-between gap-2 px-2 py-1 text-sm"
                          >
                            <span className="text-[rgb(var(--text-primary))] truncate">
                              {inv.invoiceNumber ?? <UuidBadge value={inv.id} />}
                            </span>
                            <span className="text-xs text-[rgb(var(--text-tertiary))] flex-shrink-0">
                              {t(`status.${inv.status}`, { defaultValue: inv.status })}
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
                        {skipped.map(({ invoice, reason }) => (
                          <li
                            key={invoice.id}
                            className="flex items-center justify-between gap-2 px-2 py-1 text-sm"
                          >
                            <span className="text-[rgb(var(--text-secondary))] truncate">
                              {invoice.invoiceNumber ?? <UuidBadge value={invoice.id} />}
                            </span>
                            <span className="text-xs text-[rgb(var(--text-tertiary))] flex-shrink-0">
                              {formatKnownSkipReason(t, reason)}
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
                    {jobId && (job.data?.status === 'succeeded' || job.data?.status === 'failed') ? t('actions.close') : t('actions.cancel')}
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
                          {t('asyncJobs.common.starting')}
                        </>
                      ) : (
                        <>
                          <Bell className="w-4 h-4" />
                          {t('asyncJobs.reminders.send', { count: eligible.length })}
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
