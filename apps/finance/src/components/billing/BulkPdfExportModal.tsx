/**
 * BulkPdfExportModal — Sprint F.5.
 *
 * Operator-facing progress modal for the F.3 bulk-invoice-PDF-export
 * worker. Wraps the F.4 kickoff endpoint + F.6 `useFinanceJob` polling
 * into a single drawer-style modal that:
 *
 *   1. On mount with `invoiceIds` set → POSTs to F.4 endpoint via
 *      `useBulkInvoicePdfExport`. Backend returns 202 + `{jobId, message}`.
 *   2. Modal switches to "polling mode" using `useFinanceJob(jobId)` at
 *      2s cadence until the job hits a terminal state.
 *   3. Renders state-appropriate UI:
 *        - kickoff pending / queued / running  → progress bar + counters
 *        - succeeded  → download link to `output.zipUrl` + close button
 *        - failed     → error message + retry button
 *
 *   4. The dismiss button surfaces TWO modes:
 *        - "Run in background" — closes the modal but the worker keeps
 *           running on the backend. Operator can come back via the
 *           invoice list (no UI for this yet; toast on success).
 *        - "Cancel" (terminal only) — closes the modal entirely.
 *
 * Error envelopes from F.4:
 *   - 409 ACTIVE_EXPORT_ALREADY_RUNNING → switch to polling the
 *     `runningJobId` from the response body (operator already has a
 *     job in flight; show its progress instead of starting a duplicate).
 *   - 413 PAYLOAD_TOO_LARGE → toast.error with the operator copy
 *     interpolated from `body.{limit, requested}`.
 *
 * Per `feedback_react_query_no_polling_for_event_driven_data` — the
 * polling on `useFinanceJob` is correct because FinanceJob progress is
 * clock-driven (the worker writes counter increments over wall time).
 * Don't cargo-cult to "invoice list refresh" elsewhere.
 */

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Download, Loader2, X, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@edforge/i18n'
import {
  useBulkInvoicePdfExport,
  useFinanceJob,
  type FinanceJobRow,
} from '@edforge/finance-services'

export interface BulkPdfExportModalProps {
  open: boolean
  onClose: () => void
  invoiceIds: string[]
  schoolId: string
}

/** ACTIVE_EXPORT_ALREADY_RUNNING response shape from F.4 backend. */
interface ActiveExportConflictBody {
  code: 'ACTIVE_EXPORT_ALREADY_RUNNING'
  runningJobId: string
  schoolId: string
  jobType: string
}

/** PAYLOAD_TOO_LARGE response shape from F.4 backend. */
interface PayloadTooLargeBody {
  code: 'PAYLOAD_TOO_LARGE'
  limit: number
  requested: number
}

/** Extract the JSON body from an Axios-style HTTP error. */
function getErrorBody<T>(err: unknown): T | null {
  const body = (err as { response?: { data?: T } })?.response?.data
  return (body as T) ?? null
}

function getErrorStatus(err: unknown): number | null {
  return (err as { response?: { status?: number } })?.response?.status ?? null
}

export function BulkPdfExportModal({
  open,
  onClose,
  invoiceIds,
  schoolId,
}: BulkPdfExportModalProps) {
  const { t } = useTranslation('payments')
  const [jobId, setJobId] = useState<string | null>(null)
  const [terminalLogged, setTerminalLogged] = useState(false)

  const exportMutation = useBulkInvoicePdfExport(schoolId)
  const job = useFinanceJob(jobId)

  // Kickoff on first open with a non-empty selection. Track that we've
  // kicked off (via jobId being set OR mutation pending) so the modal
  // doesn't re-trigger on re-render.
  useEffect(() => {
    if (!open) {
      setJobId(null)
      setTerminalLogged(false)
      exportMutation.reset()
      return
    }
    if (jobId || exportMutation.isPending || exportMutation.isError) return
    if (invoiceIds.length === 0) return
    exportMutation.mutate(
      { invoiceIds, format: 'zip' },
      {
        onSuccess: (ack) => setJobId(ack.jobId),
        onError: (err) => {
          // MVP.5 sentinel conflict: there's an in-flight job for this
          // school; switch to polling THAT job's progress.
          if (getErrorStatus(err) === 409) {
            const body = getErrorBody<ActiveExportConflictBody>(err)
            if (body?.runningJobId) {
              setJobId(body.runningJobId)
              toast.info(t('bulkPdfExport.alreadyRunning'))
              return
            }
          }
          // 413: payload too large — surface the operator copy.
          if (getErrorStatus(err) === 413) {
            const body = getErrorBody<PayloadTooLargeBody>(err)
            toast.error(
              t('bulkPdfExport.payloadTooLarge', {
                limit: body?.limit ?? 2000,
                requested: body?.requested ?? invoiceIds.length,
              }),
            )
            onClose()
            return
          }
          // Other errors — generic toast; modal stays open so the operator
          // can see the error state (rendered below).
          toast.error(t('bulkPdfExport.kickoffFailed'))
        },
      },
    )
    // exportMutation is a stable object; this effect runs on mount/open only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoiceIds.length])

  // Toast on terminal — once.
  useEffect(() => {
    if (!job.data || terminalLogged) return
    if (job.data.status === 'succeeded') {
      toast.success(
        t('bulkPdfExport.succeeded', {
          succeeded: job.data.counters.succeeded,
          failed: job.data.counters.failed,
        }),
      )
      setTerminalLogged(true)
    } else if (job.data.status === 'failed') {
      toast.error(t('bulkPdfExport.failed'))
      setTerminalLogged(true)
    }
  }, [job.data, t, terminalLogged])

  const status = job.data?.status ?? (exportMutation.isPending ? 'queued' : null)
  const isTerminal = status === 'succeeded' || status === 'failed'
  const message = exportMutation.data?.message ?? t('bulkPdfExport.backgroundDefault')

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={isTerminal ? onClose : undefined}
            data-testid="bulk-pdf-export-modal-overlay"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-pdf-export-title"
            data-testid="bulk-pdf-export-modal"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2
                id="bulk-pdf-export-title"
                className="text-base font-semibold text-[rgb(var(--text-primary))]"
              >
                {t('bulkPdfExport.title', { count: invoiceIds.length })}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('bulkPdfExport.close')}
                className="rounded p-1 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <BulkPdfExportProgress
              job={job.data}
              fallbackMessage={message}
              status={status}
              kickoffError={exportMutation.error}
            />

            <div className="mt-6 flex items-center justify-end gap-2">
              {!isTerminal && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-[rgb(var(--border-primary))] px-3 py-1.5 text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-secondary))]"
                  data-testid="bulk-pdf-export-background"
                >
                  {t('bulkPdfExport.runInBackground')}
                </button>
              )}
              {isTerminal && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md bg-[rgb(var(--action-primary-bg))] px-3 py-1.5 text-sm text-white hover:bg-[rgb(var(--action-primary-bg-hover))]"
                  data-testid="bulk-pdf-export-close"
                >
                  {t('bulkPdfExport.done')}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

interface ProgressProps {
  job: FinanceJobRow | undefined
  status: FinanceJobRow['status'] | null
  fallbackMessage: string
  kickoffError: Error | null
}

function BulkPdfExportProgress({ job, status, fallbackMessage, kickoffError }: ProgressProps) {
  const { t } = useTranslation('payments')

  if (kickoffError && !job) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
        <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-medium text-red-900">
            {t('bulkPdfExport.kickoffFailed')}
          </div>
          <div className="text-xs text-red-700 mt-0.5">{kickoffError.message}</div>
        </div>
      </div>
    )
  }

  if (!job || status === 'queued') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary)/0.5)] px-4 py-3">
        <Loader2 className="w-4 h-4 text-[rgb(var(--text-tertiary))] animate-spin flex-shrink-0" />
        <div className="text-sm text-[rgb(var(--text-secondary))]">{fallbackMessage}</div>
      </div>
    )
  }

  if (status === 'running') {
    const done = job.counters.succeeded + job.counters.failed + job.counters.skipped
    const pct = job.counters.requested > 0 ? (done / job.counters.requested) * 100 : 0
    return (
      <div className="rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary)/0.5)] px-4 py-3">
        <div className="flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-[rgb(var(--action-primary-bg))] animate-spin flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[rgb(var(--text-primary))]">
              {t('bulkPdfExport.runningTitle')}
            </div>
            <div className="text-xs text-[rgb(var(--text-tertiary))] tabular-nums">
              {t('bulkPdfExport.runningProgress', { done, total: job.counters.requested })}
            </div>
          </div>
        </div>
        <div
          className="mt-2 h-1.5 rounded-full bg-[rgb(var(--background-tertiary))] overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-[rgb(var(--action-primary-bg))] transition-[width] duration-300"
            style={{ width: `${pct}%` }}
            data-testid="bulk-pdf-export-progress-bar"
          />
        </div>
      </div>
    )
  }

  if (status === 'succeeded') {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-medium text-green-900">
              {t('bulkPdfExport.succeededTitle', {
                succeeded: job.counters.succeeded,
                failed: job.counters.failed,
              })}
            </div>
            {job.counters.failed > 0 && (
              <div className="text-xs text-green-800 mt-0.5">
                {t('bulkPdfExport.partialFailed', { count: job.counters.failed })}
              </div>
            )}
          </div>
        </div>
        {job.output?.zipUrl ? (
          <a
            href={job.output.zipUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-[rgb(var(--action-primary-bg))] px-3 py-1.5 text-sm text-white hover:bg-[rgb(var(--action-primary-bg-hover))]"
            data-testid="bulk-pdf-export-download-link"
          >
            <Download className="w-4 h-4" />
            {t('bulkPdfExport.downloadZip')}
          </a>
        ) : (
          <div className="text-xs text-[rgb(var(--text-tertiary))]">
            {t('bulkPdfExport.urlPending')}
          </div>
        )}
      </div>
    )
  }

  // status === 'failed'
  const firstErr = job.errors?.[0]?.message ?? t('bulkPdfExport.failedGeneric')
  return (
    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
      <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
      <div>
        <div className="text-sm font-medium text-red-900">{t('bulkPdfExport.failedTitle')}</div>
        <div className="text-xs text-red-700 mt-0.5">{firstErr}</div>
      </div>
    </div>
  )
}
