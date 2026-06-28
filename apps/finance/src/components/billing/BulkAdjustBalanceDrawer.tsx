/**
 * BulkAdjustBalanceDrawer — D4 of the finance async-job framework.
 *
 * Backs the `Adjust balance` bulk action on the Student Accounts table
 * (closes #232). Posts to
 * /finance/schools/:schoolId/student-accounts/bulk-adjust which returns
 * 202 + jobId; the drawer polls until terminal.
 *
 * Ledger writes are fast — the job typically terminates in <2s — but
 * the framework path keeps the UX consistent with the slower D1–D3
 * dispatch jobs.
 *
 * Sign-threshold guard: the BE refuses adjustments that would cross a
 * sign boundary (e.g. crediting an already-surplus account) unless the
 * `overrideSignThreshold` toggle is set. Guarded rows surface as
 * `skipped` in the job result with reason copy from the BE; the UI
 * doesn't try to predict them client-side because the threshold
 * resolution lives BE-side.
 */

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Loader2, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  useAsyncBulkJob,
  useBulkAdjustBalances,
  type BulkAdjustBalanceDto,
} from '@edforge/finance-services'
import type { StudentAccount } from '@edforge/types'
import { AsyncJobProgress } from './AsyncJobProgress'

export interface BulkAdjustBalanceDrawerProps {
  open: boolean
  onClose: () => void
  accounts: StudentAccount[]
  schoolId: string
  onComplete: () => void
}

interface FormState {
  type: BulkAdjustBalanceDto['type']
  amount: string
  reason: string
  effectiveDate: string
  override: boolean
}

/**
 * Pure form-validation helper — exported for unit testing. The drawer's
 * Apply button is enabled iff this returns null. Mirrors the BE's
 * required-fields contract so failures are caught before the network
 * call.
 */
export function validateAdjustForm(form: {
  amount: string
  reason: string
  effectiveDate: string
}): string | null {
  const amount = Number(form.amount)
  if (!Number.isFinite(amount) || amount <= 0) return 'amount must be a positive number'
  if (!form.reason.trim()) return 'reason is required'
  if (!form.effectiveDate) return 'effective date is required'
  return null
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

const INITIAL_FORM: FormState = {
  type: 'debit',
  amount: '',
  reason: '',
  effectiveDate: todayIso(),
  override: false,
}

export function BulkAdjustBalanceDrawer({
  open,
  onClose,
  accounts,
  schoolId,
  onComplete,
}: BulkAdjustBalanceDrawerProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [jobId, setJobId] = useState<string | null>(null)

  const start = useBulkAdjustBalances(schoolId)
  const job = useAsyncBulkJob(schoolId, 'student-accounts', jobId)

  const amountNum = useMemo(() => {
    const n = Number(form.amount)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [form.amount])

  const isWorking = start.isPending || (!!jobId && job.data?.status !== 'succeeded' && job.data?.status !== 'failed')

  useEffect(() => {
    if (!job.data) return
    if (job.data.status === 'succeeded') {
      const parts: string[] = [`Adjusted ${job.data.succeeded} account${job.data.succeeded === 1 ? '' : 's'}`]
      if (job.data.skipped > 0) parts.push(`${job.data.skipped} skipped`)
      if (job.data.failed > 0) parts.push(`${job.data.failed} failed`)
      if (job.data.failed === 0 && job.data.skipped === 0) toast.success(parts[0])
      else if (job.data.succeeded === 0)
        toast.error(`No adjustments applied — ${job.data.failed} failed; ${job.data.skipped} skipped`)
      else toast.error(parts.join(' · '))
      onComplete()
    } else if (job.data.status === 'failed') {
      toast.error(job.data.error ?? 'Adjust-balance job failed.')
    }
  }, [job.data, onComplete])

  const handleClose = () => {
    if (isWorking) return
    setForm(INITIAL_FORM)
    setJobId(null)
    start.reset()
    onClose()
  }

  const handleApply = async () => {
    if (amountNum === null) return
    if (!form.reason.trim()) return
    if (accounts.length === 0) return
    try {
      const ack = await start.mutateAsync({
        accountIds: accounts.map((a) => a.id),
        type: form.type,
        amount: amountNum,
        reason: form.reason.trim(),
        effectiveDate: form.effectiveDate,
        ...(form.override && { overrideSignThreshold: true }),
      })
      setJobId(ack.jobId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start adjust-balance job.')
    }
  }

  const canApply =
    !isWorking &&
    !jobId &&
    accounts.length > 0 &&
    amountNum !== null &&
    form.reason.trim().length > 0 &&
    !!form.effectiveDate

  const showProgress = !!jobId

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-adjust-balance-title"
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
                    <div className="p-2 rounded-lg bg-[rgb(var(--state-warning-bg)/0.18)] flex-shrink-0">
                      <Pencil className="w-5 h-5 text-[rgb(var(--state-warning-fg))]" />
                    </div>
                    <div className="min-w-0">
                      <h2
                        id="bulk-adjust-balance-title"
                        className="text-lg font-semibold text-[rgb(var(--text-primary))] truncate"
                      >
                        Adjust balance
                      </h2>
                      <p className="text-xs text-[rgb(var(--text-tertiary))] tabular-nums">
                        {accounts.length} account{accounts.length === 1 ? '' : 's'} selected
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
                    <AsyncJobProgress job={job.data} verbingNoun="Posting ledger entries" />
                  ) : (
                    <>
                      <div
                        className="flex items-start gap-2 rounded-lg border border-[rgb(var(--state-warning-border)/0.4)] bg-[rgb(var(--state-warning-bg)/0.18)] px-3 py-2.5 text-sm text-[rgb(var(--state-warning-fg))]"
                        role="alert"
                      >
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                          The same adjustment is written against every selected account's
                          ledger. Use the override toggle to skip the sign-threshold guard
                          (e.g. crediting an already-surplus account).
                        </span>
                      </div>

                      <section>
                        <label className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-2">
                          Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['debit', 'credit'] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setForm((f) => ({ ...f, type: t }))}
                              className={`px-3 py-2 text-sm font-medium border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] ${
                                form.type === t
                                  ? 'bg-[rgb(var(--action-primary-bg)/0.12)] border-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-bg))]'
                                  : 'bg-[rgb(var(--background-primary))] border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-secondary))]'
                              }`}
                            >
                              {t === 'debit' ? 'Debit (increase owed)' : 'Credit (reduce owed)'}
                            </button>
                          ))}
                        </div>
                      </section>

                      <section>
                        <label
                          htmlFor="bulk-adjust-amount"
                          className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-2"
                        >
                          Amount <span className="text-[rgb(var(--state-danger-fg))]">*</span>
                        </label>
                        <input
                          id="bulk-adjust-amount"
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          value={form.amount}
                          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                          placeholder="0.00"
                          className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
                        />
                      </section>

                      <section>
                        <label
                          htmlFor="bulk-adjust-effective-date"
                          className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-2"
                        >
                          Effective date <span className="text-[rgb(var(--state-danger-fg))]">*</span>
                        </label>
                        <input
                          id="bulk-adjust-effective-date"
                          type="date"
                          value={form.effectiveDate}
                          onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
                        />
                      </section>

                      <section>
                        <label
                          htmlFor="bulk-adjust-reason"
                          className="block text-sm font-medium text-[rgb(var(--text-primary))] mb-2"
                        >
                          Reason <span className="text-[rgb(var(--state-danger-fg))]">*</span>
                        </label>
                        <textarea
                          id="bulk-adjust-reason"
                          value={form.reason}
                          onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                          rows={3}
                          placeholder="e.g. Scholarship credit applied at start of term"
                          className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] resize-none focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
                        />
                      </section>

                      <section>
                        <label className="flex items-start gap-2 text-sm text-[rgb(var(--text-secondary))]">
                          <input
                            type="checkbox"
                            checked={form.override}
                            onChange={(e) => setForm((f) => ({ ...f, override: e.target.checked }))}
                            className="mt-0.5 rounded border-[rgb(var(--border-primary))] focus:ring-[rgb(var(--border-focus)/0.35)]"
                          />
                          <span>
                            Override sign-threshold guard — apply even for accounts where the
                            adjustment crosses a balance sign boundary.
                          </span>
                        </label>
                      </section>
                    </>
                  )}

                  <section>
                    <h3 className="text-sm font-medium text-[rgb(var(--text-primary))] mb-2">
                      Recipients ({accounts.length})
                    </h3>
                    <ul className="space-y-1 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-tertiary)/0.4)] p-2 max-h-40 overflow-y-auto">
                      {accounts.map((a) => (
                        <li
                          key={a.id}
                          className="flex items-center justify-between gap-2 px-2 py-1 text-sm"
                        >
                          <span className="text-[rgb(var(--text-primary))] truncate">
                            {a.studentName ?? 'Unknown student'}
                          </span>
                          <span className="text-xs text-[rgb(var(--text-tertiary))] tabular-nums flex-shrink-0">
                            balance {a.balance ?? 0}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
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
                          <Pencil className="w-4 h-4" />
                          Apply to {accounts.length}
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
