/**
 * BulkExportDrawerBase — shared state machine behind BulkPdfExportDrawer
 * (invoices) and BulkReceiptPdfExportDrawer (receipts), redesigned per the
 * Bulk PDF Export prototype on the accessible FinanceDrawerShell.
 *
 * Phases: preflight (manifest + format picker) → kickoff → queued/running
 * (polled via useFinanceJob) → result (succeeded, incl. the derived
 * partial = succeeded && failed>0) | failed. There is deliberately NO
 * cancel-export control — the backend exposes no cancel endpoint; a
 * running export can only be left to finish ("Run in background").
 *
 * Preserved contracts from the pre-redesign drawers:
 *  - Idempotency-Key kickoff; 409 ACTIVE_EXPORT_ALREADY_RUNNING pivots
 *    polling to the body's runningJobId instead of erroring.
 *  - 413 PAYLOAD_TOO_LARGE surfaces the operator copy (now format-aware
 *    via BULK_PDF_EXPORT_LIMITS) and closes — retry isn't the answer.
 *  - Terminal handling fires once; succeeded also invalidates the list
 *    query (owner: this component, NOT useFinanceJob — see hook JSDoc).
 *    The toast only fires when the drawer is CLOSED (backgrounded run) —
 *    while open, the result view IS the completion feedback, and a toast
 *    would compete with the footer's download action.
 *  - Close blocked only during the brief kickoff window; once a jobId
 *    exists the drawer is a viewer and the worker keeps running. Closing
 *    does NOT drop the job: polling continues while the component stays
 *    mounted (callers must render it unconditionally), which is what makes
 *    the "runs in background — we'll let you know" note true. State resets
 *    on the open TRANSITION instead, and only when the tracked job is
 *    already terminal.
 *
 * "Get a fresh link": presigned URLs are re-minted by the backend on
 * poll when within 60s of expiry, so a single manual refetch after
 * expiry returns a fresh `output.urlExpiresAt`.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Download, FileArchive, RefreshCw, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import {
  BULK_PDF_EXPORT_LIMITS,
  useFinanceJob,
  type BulkPdfExportFormat,
} from '@edforge/finance-services'
import { FinanceDrawerShell } from '../../shared'
import { useCurrency } from '@edforge/types/use-currency'
import { useFinanceSettings } from '../../../layouts/FinanceLayout'
import { ExportPreflight } from './ExportPreflight'
import { ExportRunning } from './ExportRunning'
import { ExportResult } from './ExportResult'
import { ExportFailed } from './ExportFailed'
import {
  buildExportManifest,
  bundleNameFor,
  hasArtifact,
  outputUrlFor,
  type ExportDocType,
  type ExportRowSummary,
} from './export-manifest'

export interface BulkExportDrawerBaseProps {
  open: boolean
  onClose: () => void
  /** Called after close; parents clear row selection here. */
  onComplete?: () => void
  rows: ExportRowSummary[]
  docType: ExportDocType
  /** i18n subtree for docType-specific copy (title, ready copy, toasts). */
  i18nRoot: 'asyncJobs.pdfExport' | 'asyncJobs.receiptPdfExport'
  /** Kick off the export; wrapper binds the right service + schoolId. */
  kickoff: (ids: string[], format: BulkPdfExportFormat) => Promise<{ jobId: string }>
  kickoffPending: boolean
  resetKickoff: () => void
  /** List query key to invalidate on terminal success. */
  invalidateKey: string[]
}

/** ACTIVE_EXPORT_ALREADY_RUNNING response shape from the backend (MVP.5). */
interface ActiveExportConflictBody {
  code: 'ACTIVE_EXPORT_ALREADY_RUNNING'
  runningJobId: string
}

/** PAYLOAD_TOO_LARGE response shape from the backend (MVP.4). */
interface PayloadTooLargeBody {
  code: 'PAYLOAD_TOO_LARGE'
  limit: number
  requested: number
}

function getErrorBody<T>(err: unknown): T | null {
  return ((err as { response?: { data?: T } })?.response?.data as T) ?? null
}

function getErrorStatus(err: unknown): number | null {
  return (err as { response?: { status?: number } })?.response?.status ?? null
}

export function BulkExportDrawerBase({
  open,
  onClose,
  onComplete,
  rows,
  docType,
  i18nRoot,
  kickoff,
  kickoffPending,
  resetKickoff,
  invalidateKey,
}: BulkExportDrawerBaseProps) {
  const { t } = useTranslation('payments')
  const queryClient = useQueryClient()
  const settings = useFinanceSettings()
  const { format: formatMoney } = useCurrency(settings)

  const [jobId, setJobId] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState<BulkPdfExportFormat>('zip')
  const [terminalLogged, setTerminalLogged] = useState(false)
  const [refreshingLink, setRefreshingLink] = useState(false)
  const [retryPending, setRetryPending] = useState(false)

  const job = useFinanceJob(jobId)
  const manifest = useMemo(() => buildExportManifest(rows, docType), [rows, docType])
  const reduceMotion = useReducedMotion()

  // Reset on the open TRANSITION, not on close — closing must keep a
  // running job's poll alive (background run). A still-running job stays
  // attached across reopen (mirrors the backend's one-active-export rule);
  // a terminal one is cleared so the new selection gets a fresh preflight.
  const wasOpen = useRef(open)
  const jobStatus = job.data?.status
  useEffect(() => {
    const justOpened = open && !wasOpen.current
    wasOpen.current = open
    if (!justOpened) return
    if (jobId && jobStatus !== 'succeeded' && jobStatus !== 'failed') return
    setJobId(null)
    setExportFormat('zip')
    setTerminalLogged(false)
    setRefreshingLink(false)
    setRetryPending(false)
    resetKickoff()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, jobId, jobStatus])

  // Terminal handling — once per job. Invalidate the list on succeeded
  // (owner: drawer, not useFinanceJob — see hook JSDoc for the bug class).
  // The toast fires only when the drawer is closed: while open, the result
  // view already announces completion next to the download action.
  useEffect(() => {
    if (!job.data || terminalLogged) return
    const status = job.data.status
    if (status !== 'succeeded' && status !== 'failed') return
    setTerminalLogged(true)
    if (status === 'succeeded') {
      queryClient.invalidateQueries({ queryKey: invalidateKey })
    }
    if (open) return
    if (status === 'succeeded') {
      const url = hasArtifact(job.data) ? outputUrlFor(job.data) : undefined
      toast.success(
        t(`${i18nRoot}.toastSucceeded`, {
          succeeded: job.data.counters.succeeded,
          failed: job.data.counters.failed,
        }),
        url
          ? {
              action: {
                label: t('asyncJobs.pdfExportShared.toastDownload'),
                onClick: () => window.open(url, '_blank', 'noopener,noreferrer'),
              },
            }
          : undefined
      )
    } else {
      toast.error(t(`${i18nRoot}.toastFailed`))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.data, terminalLogged, open])

  const startExport = async (ids: string[]) => {
    if (ids.length === 0) return
    try {
      const ack = await kickoff(ids, exportFormat)
      setTerminalLogged(false)
      setJobId(ack.jobId)
    } catch (err) {
      // MVP.5 sentinel conflict: pivot to poll the existing in-flight job.
      if (getErrorStatus(err) === 409) {
        const body = getErrorBody<ActiveExportConflictBody>(err)
        if (body?.runningJobId) {
          setTerminalLogged(false)
          setJobId(body.runningJobId)
          toast.info(t(`${i18nRoot}.alreadyRunning`))
          return
        }
      }
      // 413 PAYLOAD_TOO_LARGE — operator must narrow the selection.
      if (getErrorStatus(err) === 413) {
        const body = getErrorBody<PayloadTooLargeBody>(err)
        toast.error(
          t(`${i18nRoot}.payloadTooLarge`, {
            limit: body?.limit ?? BULK_PDF_EXPORT_LIMITS[exportFormat],
            requested: body?.requested ?? ids.length,
          })
        )
        onClose()
        return
      }
      toast.error(err instanceof Error ? err.message : t(`${i18nRoot}.toastFailed`))
    }
  }

  const handleRetryFailed = async (failedIds: string[]) => {
    setRetryPending(true)
    try {
      await startExport(failedIds)
    } finally {
      setRetryPending(false)
    }
  }

  const handleFreshLink = async () => {
    setRefreshingLink(true)
    try {
      await job.refetch()
    } finally {
      setRefreshingLink(false)
    }
  }

  const handleClose = () => {
    if (kickoffPending) return
    onClose()
    onComplete?.()
  }

  const backToPreflight = () => {
    setJobId(null)
    setTerminalLogged(false)
    resetKickoff()
  }

  const status = job.data?.status ?? (jobId ? 'queued' : null)
  const running = status === 'queued' || status === 'running'
  const succeeded = status === 'succeeded'
  const failed = status === 'failed'
  const phase = !jobId ? 'preflight' : running ? 'running' : succeeded ? 'result' : 'failed'
  const downloadUrl = job.data ? outputUrlFor(job.data) : undefined
  const linkExpired =
    succeeded &&
    !!job.data?.output?.urlExpiresAt &&
    Date.parse(job.data.output.urlExpiresAt) <= Date.now()

  const subtitle = !jobId
    ? t(`asyncJobs.common.selected.${docType === 'invoice' ? 'invoices' : 'payments'}`, {
        count: rows.length,
      })
    : running
      ? t('asyncJobs.pdfExportShared.inProgress')
      : succeeded
        ? job.data && job.data.counters.failed > 0
          ? t('asyncJobs.pdfExportShared.completeWithFailures')
          : t('asyncJobs.pdfExportShared.complete')
        : t('asyncJobs.pdfExportShared.wentWrong')

  const footer = !jobId ? (
    <>
      <Button variant="ghost" onClick={handleClose} disabled={kickoffPending} data-testid="bulk-pdf-export-cancel">
        {t('asyncJobs.common.cancel')}
      </Button>
      <Button
        onClick={() => void startExport(rows.map((r) => r.id))}
        disabled={kickoffPending || rows.length === 0}
        data-testid="bulk-pdf-export-start"
      >
        <Download className="me-1.5 h-4 w-4" />
        {kickoffPending ? t(`${i18nRoot}.starting`) : t(`${i18nRoot}.startExport`)}
      </Button>
    </>
  ) : running ? (
    <Button variant="outline" onClick={handleClose} data-testid="bulk-pdf-export-cancel">
      {t('asyncJobs.pdfExportShared.runInBackground')}
    </Button>
  ) : succeeded ? (
    <>
      <Button variant="ghost" onClick={backToPreflight}>
        <Undo2 className="me-1.5 h-4 w-4" />
        {t('asyncJobs.pdfExportShared.exportAgain')}
      </Button>
      {/* H.3 P2: an all-skipped merged job completes with NO artifact —
          neither a download nor a fresh-link refetch can help there. */}
      {job.data && !hasArtifact(job.data) ? (
        <Button variant="outline" onClick={handleClose}>
          {t('asyncJobs.common.close')}
        </Button>
      ) : linkExpired || !downloadUrl ? (
        <Button onClick={() => void handleFreshLink()} disabled={refreshingLink}>
          <RefreshCw className={refreshingLink ? 'me-1.5 h-4 w-4 animate-spin' : 'me-1.5 h-4 w-4'} />
          {refreshingLink
            ? t('asyncJobs.pdfExportShared.gettingFreshLink')
            : t('asyncJobs.pdfExportShared.freshLink')}
        </Button>
      ) : (
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={/* allow-hardcoded-color: contrast text on --action-primary-bg button */ 'inline-flex items-center gap-2 rounded-lg bg-[rgb(var(--action-primary-bg))] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[rgb(var(--action-primary-bg-hover))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]'}
          data-testid="bulk-pdf-export-download-link"
        >
          <Download className="h-4 w-4" />
          {t('asyncJobs.pdfExportShared.download', {
            bundle: bundleNameFor(docType, job.data?.outputFormat ?? 'zip'),
          })}
        </a>
      )}
    </>
  ) : (
    <>
      <Button variant="ghost" onClick={handleClose}>
        {t('asyncJobs.common.close')}
      </Button>
      <Button onClick={backToPreflight}>
        <RefreshCw className="me-1.5 h-4 w-4" />
        {t('asyncJobs.pdfExportShared.tryAgain')}
      </Button>
    </>
  )

  return (
    <FinanceDrawerShell
      open={open}
      onClose={handleClose}
      title={t(`${i18nRoot}.title`)}
      subtitle={subtitle}
      icon={<FileArchive className="h-5 w-5" />}
      iconBusy={running}
      footer={footer}
      closeDisabled={kickoffPending}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
          transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
        >
          {!jobId ? (
            <ExportPreflight
              manifest={manifest}
              docType={docType}
              i18nRoot={i18nRoot}
              format={exportFormat}
              onFormatChange={setExportFormat}
              formatMoney={formatMoney}
            />
          ) : running ? (
            <ExportRunning job={job.data} dataUpdatedAt={job.dataUpdatedAt} rows={rows} />
          ) : succeeded && job.data ? (
            <ExportResult
              job={job.data}
              rows={rows}
              docType={docType}
              onRetryFailed={(ids) => void handleRetryFailed(ids)}
              retryPending={retryPending}
            />
          ) : failed && job.data ? (
            <ExportFailed job={job.data} />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </FinanceDrawerShell>
  )
}
