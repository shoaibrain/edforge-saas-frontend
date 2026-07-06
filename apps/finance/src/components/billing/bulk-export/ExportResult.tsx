/**
 * Terminal-success body of the bulk-export drawer (including partial =
 * succeeded with failures): result banner with count chips, the bundle
 * file object with a live expiry countdown, the failed-rows box with
 * retry, a collapsible file list, and job metadata with a copyable id.
 */

import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  FileArchive,
  FileText,
  List,
  RefreshCw,
  Timer,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button, cn } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import type { FinanceJobRow } from '@edforge/finance-services'
import { ExpiryRing } from './ExpiryRing'
import { formatMmSs, useExpiryCountdown } from './useExpiryCountdown'
import {
  bundleNameFor,
  failedIdsOf,
  fileNameFor,
  willBeSkipped,
  type ExportDocType,
  type ExportRowSummary,
} from './export-manifest'

export interface ExportResultProps {
  job: FinanceJobRow
  rows: ExportRowSummary[]
  docType: ExportDocType
  onRetryFailed: (failedIds: string[]) => void
  retryPending: boolean
}

export function ExportResult({
  job,
  rows,
  docType,
  onRetryFailed,
  retryPending,
}: ExportResultProps) {
  const { t } = useTranslation('payments')
  const [listOpen, setListOpen] = useState(false)

  const counters = job.counters
  const partial = counters.failed > 0
  const failedIds = new Set(failedIdsOf(job))
  const failedRows = rows.filter((r) => failedIds.has(r.id))
  const okRows = rows.filter((r) => !failedIds.has(r.id) && !willBeSkipped(r, docType))
  const format = job.outputFormat ?? 'zip'
  const bundleName = bundleNameFor(docType, format)
  const { remainingMs, expired, fraction } = useExpiryCountdown(
    job.output?.urlExpiresAt,
    job.completedAt
  )
  const tookSec =
    job.startedAt && job.completedAt
      ? Math.max(1, Math.round((Date.parse(job.completedAt) - Date.parse(job.startedAt)) / 1000))
      : null
  const completedAtLabel = job.completedAt
    ? new Date(job.completedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null

  const copyJobId = () => {
    void navigator.clipboard?.writeText(job.jobId)
    toast.success(t('asyncJobs.pdfExportShared.jobIdCopied'))
  }

  return (
    <div className="space-y-4">
      {/* Result banner */}
      <div
        className={cn(
          'flex items-start gap-3 rounded-xl border px-3.5 py-3',
          partial
            ? 'border-[rgb(var(--state-warning-border)/0.3)] bg-[rgb(var(--state-warning-bg)/0.45)]'
            : 'border-[rgb(var(--state-success-border)/0.4)] bg-[rgb(var(--state-success-bg)/0.6)]'
        )}
      >
        <span
          className={cn(
            'mt-0.5 flex-none',
            partial
              ? 'text-[rgb(var(--state-warning-fg))]'
              : 'text-[rgb(var(--state-success-fg))]'
          )}
        >
          {partial ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            {partial
              ? t('asyncJobs.pdfExportShared.partialTitle', {
                  succeeded: counters.succeeded,
                  requested: counters.requested,
                })
              : t('asyncJobs.pdfExportShared.readyTitle')}
          </p>
          <p className="mt-1 flex flex-wrap gap-1.5">
            <ResultChip tone="success">
              {t('asyncJobs.pdfExportShared.succeededChip', { count: counters.succeeded })}
            </ResultChip>
            {counters.skipped > 0 && (
              <ResultChip>
                {t('asyncJobs.pdfExportShared.skippedChip', { count: counters.skipped })}
              </ResultChip>
            )}
            <ResultChip tone={counters.failed > 0 ? 'danger' : undefined}>
              {t('asyncJobs.pdfExportShared.failedChip', { count: counters.failed })}
            </ResultChip>
          </p>
        </div>
      </div>

      {/* Bundle file object */}
      <div
        className={cn(
          'rounded-xl border bg-[rgb(var(--background-primary))]',
          expired
            ? 'border-dashed border-[rgb(var(--border-secondary)/0.5)]'
            : 'border-[rgb(var(--border-primary)/0.5)]'
        )}
      >
        <div className="flex items-center gap-3 px-3.5 py-3">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-lg bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-secondary))]">
            {format === 'merged_pdf' ? (
              <FileText className="h-5 w-5" />
            ) : (
              <FileArchive className="h-5 w-5" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                'truncate font-mono text-sm font-medium text-[rgb(var(--text-primary))]',
                expired && 'line-through opacity-60'
              )}
            >
              {bundleName}
            </p>
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              {t('asyncJobs.pdfExportShared.bundleMeta', { count: counters.succeeded })}
            </p>
          </div>
        </div>
        {job.output?.urlExpiresAt && (
          <div className="border-t border-[rgb(var(--border-primary)/0.35)] px-3.5 py-2.5 text-xs">
            {expired ? (
              <span className="flex items-center gap-1.5 text-[rgb(var(--text-tertiary))]">
                <Timer className="h-3.5 w-3.5" />
                {t('asyncJobs.pdfExportShared.linkExpired')}
              </span>
            ) : (
              <span
                className={cn(
                  'flex items-center gap-1.5',
                  fraction < 0.15
                    ? 'text-[rgb(var(--state-warning-fg))]'
                    : 'text-[rgb(var(--text-tertiary))]'
                )}
              >
                <ExpiryRing fraction={fraction} />
                {t('asyncJobs.pdfExportShared.expiresIn')}{' '}
                <b className="font-mono tabular-nums">{formatMmSs(remainingMs)}</b>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Failed rows + retry */}
      {partial && failedRows.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[rgb(var(--state-danger-border)/0.3)] bg-[rgb(var(--background-primary))]">
          <div className="flex items-center justify-between gap-2 border-b border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--state-danger-bg)/0.35)] px-3.5 py-2.5">
            <span className="flex items-center gap-1.5 text-sm font-medium text-[rgb(var(--state-danger-fg))]">
              <XCircle className="h-4 w-4" />
              {t('asyncJobs.pdfExportShared.failedBoxTitle', { count: failedRows.length })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRetryFailed(failedRows.map((r) => r.id))}
              disabled={retryPending}
            >
              <RefreshCw className={cn('h-3.5 w-3.5', retryPending && 'animate-spin')} />
              {t('asyncJobs.pdfExportShared.retryFailed', { count: failedRows.length })}
            </Button>
          </div>
          <div className="max-h-40 overflow-y-auto">
            {failedRows.map((row) => (
              <div
                key={row.id}
                className="flex items-center gap-2.5 border-b border-[rgb(var(--border-primary)/0.35)] px-3.5 py-2 text-sm last:border-b-0"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-xs text-[rgb(var(--text-primary))]">
                    {row.number}
                  </span>
                  {row.studentName && (
                    <span className="block truncate text-xs text-[rgb(var(--text-tertiary))]">
                      {row.studentName}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
          <p className="border-t border-[rgb(var(--border-primary)/0.35)] px-3.5 py-2 text-xs text-[rgb(var(--text-tertiary))]">
            {t('asyncJobs.pdfExportShared.failedBoxFoot', { count: counters.succeeded })}
          </p>
        </div>
      )}

      {/* Collapsible file list */}
      {okRows.length > 0 && format === 'zip' && (
        <div className="overflow-hidden rounded-xl border border-[rgb(var(--border-primary)/0.5)] bg-[rgb(var(--background-primary))]">
          <button
            type="button"
            onClick={() => setListOpen((o) => !o)}
            aria-expanded={listOpen}
            className="flex w-full items-center gap-2 px-3.5 py-2.5 text-sm text-[rgb(var(--text-secondary))] transition-colors hover:bg-[rgb(var(--background-tertiary))]"
          >
            <List className="h-4 w-4" />
            {t('asyncJobs.pdfExportShared.whatsInside', { count: okRows.length })}
            {listOpen ? (
              <ChevronUp className="ms-auto h-4 w-4" />
            ) : (
              <ChevronDown className="ms-auto h-4 w-4" />
            )}
          </button>
          {listOpen && (
            <div className="max-h-48 overflow-y-auto border-t border-[rgb(var(--border-primary)/0.35)]">
              {okRows.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center gap-2.5 px-3.5 py-1.5 text-xs"
                >
                  <FileText className="h-3.5 w-3.5 flex-none text-[rgb(var(--text-disabled))]" />
                  <span className="font-mono text-[rgb(var(--text-secondary))]">
                    {fileNameFor(row)}
                  </span>
                  {row.studentName && (
                    <span className="ms-auto truncate text-[rgb(var(--text-tertiary))]">
                      {row.studentName}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center justify-between text-xs text-[rgb(var(--text-tertiary))]">
        <span>
          {completedAtLabel &&
            t('asyncJobs.pdfExportShared.completedAt', { time: completedAtLabel })}
          {tookSec != null && <> · {t('asyncJobs.pdfExportShared.took', { seconds: tookSec })}</>}
        </span>
        <button
          type="button"
          onClick={copyJobId}
          title={t('asyncJobs.pdfExportShared.copyJobId')}
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono transition-colors hover:bg-[rgb(var(--background-tertiary))] hover:text-[rgb(var(--text-primary))]"
        >
          {/* eslint-disable-next-line edforge/no-id-slice-in-jsx -- deliberate short job-id for support copy, full id lands on the clipboard */}
          {t('asyncJobs.pdfExportShared.jobShort', { id: job.jobId.slice(0, 8) })}
          <Copy className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

function ResultChip({
  tone,
  children,
}: {
  tone?: 'success' | 'danger'
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'rounded-full border px-2 py-px text-2xs',
        tone === 'success' &&
          'border-[rgb(var(--state-success-border)/0.4)] bg-[rgb(var(--state-success-bg))] text-[rgb(var(--state-success-fg))]',
        tone === 'danger' &&
          'border-[rgb(var(--state-danger-border)/0.4)] bg-[rgb(var(--state-danger-bg))] text-[rgb(var(--state-danger-fg))]',
        !tone &&
          'border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]'
      )}
    >
      {children}
    </span>
  )
}
