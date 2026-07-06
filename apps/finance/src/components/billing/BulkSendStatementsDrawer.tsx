/**
 * BulkSendStatementsDrawer — D3 of the finance async-job framework.
 *
 * Backs the `Send statement` bulk action on the Student Accounts table
 * (closes #231). Posts to
 * /finance/schools/:schoolId/student-accounts/bulk-send-statement which
 * returns 202 + jobId; the drawer polls until terminal.
 *
 * Eligibility: every selected account can receive a statement (no
 * filter). Channel is email-only by design — SMS would carry a link
 * but the actual PDF needs an inbox to land in.
 */

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FileText, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@edforge/i18n'
import {
  useAsyncBulkJob,
  useBulkSendStatements,
} from '@edforge/finance-services'
import type { StudentAccount } from '@edforge/types'
import { useCurrency } from '@edforge/types/use-currency'
import { useFinanceSettings } from '../../layouts/FinanceLayout'
import { AsyncJobProgress } from './AsyncJobProgress'
import { formatAsyncJobToast, formatKnownSkipReason } from './async-job-i18n'

export interface BulkSendStatementsDrawerProps {
  open: boolean
  onClose: () => void
  accounts: StudentAccount[]
  schoolId: string
  onComplete: () => void
}

/**
 * Pure eligibility helper — exported for unit testing.
 * Every selected account is eligible for a statement; this returns a
 * symmetric shape with the other D1–D4 helpers so the drawers read the
 * same.
 */
export function splitEligibleStatements(
  accounts: StudentAccount[],
): {
  eligible: StudentAccount[]
  skipped: Array<{ account: StudentAccount; reason: string }>
} {
  return { eligible: [...accounts], skipped: [] }
}

export function BulkSendStatementsDrawer({
  open,
  onClose,
  accounts,
  schoolId,
  onComplete,
}: BulkSendStatementsDrawerProps) {
  const { t } = useTranslation('payments')
  const settings = useFinanceSettings()
  const { format } = useCurrency(settings)
  const [jobId, setJobId] = useState<string | null>(null)

  const start = useBulkSendStatements(schoolId)
  const job = useAsyncBulkJob(schoolId, 'student-accounts', jobId)

  const { eligible, skipped } = useMemo(() => splitEligibleStatements(accounts), [accounts])

  const isWorking = start.isPending || (!!jobId && job.data?.status !== 'succeeded' && job.data?.status !== 'failed')

  useEffect(() => {
    if (!job.data) return
    if (job.data.status === 'succeeded') {
      const result = formatAsyncJobToast(
        t,
        'statements',
        job.data.succeeded,
        job.data.skipped,
        job.data.failed,
      )
      toast[result.tone](result.message)
      onComplete()
    } else if (job.data.status === 'failed') {
      toast.error(job.data.error ?? t('asyncJobs.statements.jobFailed'))
    }
  }, [job.data, onComplete, t])

  const handleClose = () => {
    if (isWorking) return
    setJobId(null)
    start.reset()
    onClose()
  }

  const handleApply = async () => {
    if (eligible.length === 0) return
    try {
      const ack = await start.mutateAsync({
        accountIds: eligible.map((a) => a.id),
        channel: 'email',
      })
      setJobId(ack.jobId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('asyncJobs.statements.failedToStart'))
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
          aria-labelledby="bulk-send-statements-title"
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
                    <div className="p-2 rounded-lg bg-[rgb(var(--state-info-bg)/0.18)] flex-shrink-0">
                      <FileText className="w-5 h-5 text-[rgb(var(--state-info-fg))]" />
                    </div>
                    <div className="min-w-0">
                      <h2
                        id="bulk-send-statements-title"
                        className="text-lg font-semibold text-[rgb(var(--text-primary))] truncate"
                      >
                        {t('asyncJobs.statements.title')}
                      </h2>
                      <p className="text-xs text-[rgb(var(--text-tertiary))] tabular-nums">
                        {t('asyncJobs.common.selected.accounts', { count: accounts.length })}
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
                    <AsyncJobProgress job={job.data} verbingNoun={t('asyncJobs.statements.progress')} />
                  ) : (
                    <div className="rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary)/0.4)] px-3 py-2.5 text-sm text-[rgb(var(--text-secondary))]">
                      {t('asyncJobs.statements.description')}
                    </div>
                  )}

                  <section>
                    <h3 className="text-sm font-medium text-[rgb(var(--text-primary))] mb-2">
                      {t('asyncJobs.common.recipients', { count: eligible.length })}
                    </h3>
                    <ul className="space-y-1 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-tertiary)/0.4)] p-2 max-h-60 overflow-y-auto">
                      {eligible.map((a) => (
                        <li
                          key={a.id}
                          className="flex items-center justify-between gap-2 px-2 py-1 text-sm"
                        >
                          <span className="text-[rgb(var(--text-primary))] truncate">
                            {a.studentName ?? t('asyncJobs.common.unknownStudent')}
                          </span>
                          <span className="text-xs text-[rgb(var(--text-tertiary))] tabular-nums flex-shrink-0">
                            {t('asyncJobs.common.balance', { amount: format(a.balance ?? 0) })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  {skipped.length > 0 && (
                    <section>
                      <h3 className="text-sm font-medium text-[rgb(var(--text-tertiary))] mb-2">
                        {t('asyncJobs.common.willSkip', { count: skipped.length })}
                      </h3>
                      <ul className="space-y-1 rounded-lg border border-dashed border-[rgb(var(--border-primary))] bg-[rgb(var(--background-tertiary)/0.2)] p-2 max-h-40 overflow-y-auto">
                        {skipped.map(({ account, reason }) => (
                          <li
                            key={account.id}
                            className="flex items-center justify-between gap-2 px-2 py-1 text-sm"
                          >
                            <span className="text-[rgb(var(--text-secondary))] truncate">
                              {account.studentName ?? t('asyncJobs.common.unknownStudent')}
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
                          <FileText className="w-4 h-4" />
                          {t('asyncJobs.statements.send', { count: eligible.length })}
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
