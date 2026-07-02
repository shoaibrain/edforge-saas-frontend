/**
 * BulkPdfExportDrawer — Sprint F.5 (drawer refactor per PR #266 review).
 *
 * Operator-facing progress drawer for the F.3 bulk-invoice-PDF-export
 * worker. Follows the same chrome + interaction pattern as the sibling
 * bulk-action drawers (BulkSendReceiptsDrawer, BulkSendStatementsDrawer,
 * BulkSendInvoiceReminderDrawer, BulkVoidPaymentsDrawer,
 * BulkAdjustBalanceDrawer) so operators trained on one flow recognize
 * the shape of the other.
 *
 * Flow:
 *   1. Drawer opens with pre-kickoff summary: "Export N invoices as ZIP"
 *      + a Start-export button. Operator can review the count + close
 *      without triggering anything.
 *   2. Start-export → POST /finance/schools/:schoolId/invoices/bulk-pdf-export
 *      via `useBulkInvoicePdfExport`. Backend returns 202 + {jobId, message}.
 *   3. Drawer switches to the shared `AsyncJobProgress` component fed
 *      via `financeJobToAsyncBulkJob` adapter (the two backend job
 *      shapes are legitimately different — FinanceJob has
 *      `counters.{...}` + `output.zipUrl`; AsyncBulkJob has flat
 *      counters — but the visual progress UI is identical).
 *   4. Terminal `succeeded` → show the download-ZIP link BELOW the
 *      progress block (bulk-PDF-export-specific chrome; the sibling
 *      send-drawers don't need this because they have no artifact).
 *   5. Terminal `failed` → progress component surfaces the error.
 *   6. Idempotency-Key on kickoff; MVP.5 409 conflict pivots polling
 *      to the existing runningJobId; 413 PayloadTooLarge surfaces
 *      the operator copy from the backend body.
 *
 * Sibling-drawer conformance (per PR #266 review):
 *   - Right-side drawer (fixed inset-y-0 right-0, w-screen max-w-xl)
 *     with spring animation (damping:30, stiffness:300)
 *   - Icon-in-tinted-box + title + `count selected` subtitle header
 *   - Shared `AsyncJobProgress` for the 4 lifecycle states — via adapter
 *   - Fully theme-driven color tokens (state-success/danger/info) — no
 *     hardcoded green-50/red-200; dark-mode-safe
 *   - Close semantics: X button + overlay-click close. When a job is
 *     in flight, closing is disabled (matches sibling `isWorking` gate)
 *     to prevent the operator abandoning a job mid-kickoff by accident;
 *     once the job is dispatched (jobId set) the drawer can be closed
 *     freely and the worker keeps running.
 *
 * Sibling-drawer intentional divergences:
 *   - No channel picker / eligibility split (bulk-PDF-export takes a
 *     flat invoiceIds[]; there's no per-row eligibility branch)
 *   - Download-artifact affordance under the progress block (send-
 *     drawers have no artifact to expose)
 *   - Query invalidation on terminal-succeeded is handled here in a
 *     `useEffect` (NOT inside `useFinanceJob`; see hook JSDoc for the
 *     bug class that pattern trips)
 *
 * Backend contract:
 *   - `useBulkInvoicePdfExport` wraps POST bulk-pdf-export (F.4)
 *   - `useFinanceJob` polls GET /finance/jobs/:jobId (Sprint D.3) at 2s
 *   - MVP.5 sentinel row blocks concurrent same-school exports; the
 *     409 body carries `runningJobId` so the drawer pivots to poll the
 *     in-flight job instead of showing a bare error
 */

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, FileArchive, X } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@edforge/i18n'
import {
  useBulkInvoicePdfExport,
  useFinanceJob,
  type FinanceJobRow,
} from '@edforge/finance-services'
import { AsyncJobProgress } from './AsyncJobProgress'
import { financeJobToAsyncBulkJob } from './finance-job-adapter'

export interface BulkPdfExportDrawerProps {
  open: boolean
  onClose: () => void
  invoiceIds: string[]
  schoolId: string
  /** Called after the drawer's onClose fires; used to clear parent row selection. */
  onComplete?: () => void
}

/** ACTIVE_EXPORT_ALREADY_RUNNING response shape from F.4 backend (MVP.5). */
interface ActiveExportConflictBody {
  code: 'ACTIVE_EXPORT_ALREADY_RUNNING'
  runningJobId: string
  schoolId: string
  jobType: string
}

/** PAYLOAD_TOO_LARGE response shape from F.4 backend (MVP.4). */
interface PayloadTooLargeBody {
  code: 'PAYLOAD_TOO_LARGE'
  limit: number
  requested: number
}

function getErrorBody<T>(err: unknown): T | null {
  const body = (err as { response?: { data?: T } })?.response?.data
  return (body as T) ?? null
}

function getErrorStatus(err: unknown): number | null {
  return (err as { response?: { status?: number } })?.response?.status ?? null
}

export function BulkPdfExportDrawer({
  open,
  onClose,
  invoiceIds,
  schoolId,
  onComplete,
}: BulkPdfExportDrawerProps) {
  const { t } = useTranslation('payments')
  const queryClient = useQueryClient()
  const [jobId, setJobId] = useState<string | null>(null)
  const [terminalLogged, setTerminalLogged] = useState(false)

  const startExport = useBulkInvoicePdfExport(schoolId)
  const job = useFinanceJob(jobId)

  const isKickingOff = startExport.isPending
  const showProgress = !!jobId

  // Reset drawer state when it closes.
  useEffect(() => {
    if (!open) {
      setJobId(null)
      setTerminalLogged(false)
      startExport.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Toast on terminal — once. Also invalidate the invoices list on
  // succeeded so the operator sees fresh row state after closing the
  // drawer (see useFinanceJob JSDoc for why this lives here rather than
  // inside the hook's select).
  useEffect(() => {
    if (!job.data || terminalLogged) return
    if (job.data.status === 'succeeded') {
      toast.success(
        t('asyncJobs.pdfExport.toastSucceeded', {
          succeeded: job.data.counters.succeeded,
          failed: job.data.counters.failed,
        }),
      )
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setTerminalLogged(true)
    } else if (job.data.status === 'failed') {
      toast.error(t('asyncJobs.pdfExport.toastFailed'))
      setTerminalLogged(true)
    }
  }, [job.data, t, queryClient, terminalLogged])

  const handleStart = async () => {
    if (invoiceIds.length === 0) return
    try {
      const ack = await startExport.mutateAsync({ invoiceIds, format: 'zip' })
      setJobId(ack.jobId)
    } catch (err) {
      // MVP.5 sentinel conflict: pivot to poll the existing in-flight job.
      if (getErrorStatus(err) === 409) {
        const body = getErrorBody<ActiveExportConflictBody>(err)
        if (body?.runningJobId) {
          setJobId(body.runningJobId)
          toast.info(t('asyncJobs.pdfExport.alreadyRunning'))
          return
        }
      }
      // 413 PAYLOAD_TOO_LARGE — surface operator copy + auto-close (retry
      // isn't the answer; operator needs to reduce selection).
      if (getErrorStatus(err) === 413) {
        const body = getErrorBody<PayloadTooLargeBody>(err)
        toast.error(
          t('asyncJobs.pdfExport.payloadTooLarge', {
            limit: body?.limit ?? 2000,
            requested: body?.requested ?? invoiceIds.length,
          }),
        )
        onClose()
        return
      }
      toast.error(err instanceof Error ? err.message : t('asyncJobs.pdfExport.toastFailed'))
    }
  }

  const handleClose = () => {
    // Once a job is in flight (jobId set), closing is safe — worker
    // keeps running on the backend. Only block close during the brief
    // kickoff-in-flight window so the operator can't fire off multiple
    // duplicate mutations by ctrl-clicking. Post-kickoff, the drawer is
    // just a viewer.
    if (isKickingOff) return
    onClose()
    onComplete?.()
  }

  // Adapter — normalizes the FinanceJob shape (nested counters, output
  // sub-object) into the shared AsyncJobProgress shape (flat counters,
  // error string). Kept as a stable memoized reference so
  // AsyncJobProgress doesn't churn.
  const adaptedJob = useMemo(
    () => (job.data ? financeJobToAsyncBulkJob(job.data) : undefined),
    [job.data],
  )

  const status = job.data?.status ?? (isKickingOff ? 'queued' : null)
  const canDownload =
    job.data?.status === 'succeeded' && !!job.data.output?.zipUrl

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-pdf-export-title"
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
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border-primary))]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-[rgb(var(--state-info-bg)/0.18)] flex-shrink-0">
                      <FileArchive className="w-5 h-5 text-[rgb(var(--state-info-fg))]" />
                    </div>
                    <div className="min-w-0">
                      <h2
                        id="bulk-pdf-export-title"
                        className="text-lg font-semibold text-[rgb(var(--text-primary))] truncate"
                      >
                        {t('asyncJobs.pdfExport.title')}
                      </h2>
                      <p className="text-xs text-[rgb(var(--text-tertiary))] tabular-nums">
                        {t('asyncJobs.common.selected.invoices', {
                          count: invoiceIds.length,
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isKickingOff}
                    className="p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--background-secondary))] transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label={t('asyncJobs.common.closeDrawer')}
                    data-testid="bulk-pdf-export-close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                  {showProgress ? (
                    <>
                      <AsyncJobProgress
                        job={adaptedJob}
                        verbingNoun={t('asyncJobs.pdfExport.progress')}
                      />
                      {canDownload && (
                        <a
                          href={job.data!.output!.zipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={/* allow-hardcoded-color: contrast text on --action-primary-bg button */ "inline-flex items-center gap-2 rounded-md bg-[rgb(var(--action-primary-bg))] px-3 py-2 text-sm font-medium text-white hover:bg-[rgb(var(--action-primary-bg-hover))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"}
                          data-testid="bulk-pdf-export-download-link"
                        >
                          <Download className="w-4 h-4" />
                          {t('asyncJobs.pdfExport.downloadZip')}
                        </a>
                      )}
                    </>
                  ) : (
                    <section>
                      <h3 className="text-sm font-medium text-[rgb(var(--text-primary))] mb-2">
                        {t('asyncJobs.pdfExport.readyTitle', {
                          count: invoiceIds.length,
                        })}
                      </h3>
                      <p className="text-sm text-[rgb(var(--text-secondary))]">
                        {t('asyncJobs.pdfExport.readyBody')}
                      </p>
                    </section>
                  )}
                </div>

                {/* Footer */}
                <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary)/0.5)]">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isKickingOff}
                    className="rounded-md border border-[rgb(var(--border-primary))] px-3 py-1.5 text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-secondary))] disabled:opacity-40 disabled:cursor-not-allowed"
                    data-testid="bulk-pdf-export-cancel"
                  >
                    {status === 'succeeded' || status === 'failed'
                      ? t('asyncJobs.common.close')
                      : t('asyncJobs.common.cancel')}
                  </button>
                  {!showProgress && (
                    <button
                      type="button"
                      onClick={handleStart}
                      disabled={isKickingOff || invoiceIds.length === 0}
                      className={/* allow-hardcoded-color: contrast text on --action-primary-bg button */ "rounded-md bg-[rgb(var(--action-primary-bg))] px-3 py-1.5 text-sm font-medium text-white hover:bg-[rgb(var(--action-primary-bg-hover))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] disabled:opacity-40 disabled:cursor-not-allowed"}
                      data-testid="bulk-pdf-export-start"
                    >
                      {isKickingOff
                        ? t('asyncJobs.pdfExport.starting')
                        : t('asyncJobs.pdfExport.startExport')}
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

export type { FinanceJobRow }
