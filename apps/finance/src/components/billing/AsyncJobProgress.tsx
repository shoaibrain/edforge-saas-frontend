/**
 * Shared progress block for D1–D4 async-job drawers.
 *
 * Renders the four lifecycle states the drawer body can be in once the
 * kickoff mutation has fired:
 *
 *   - queued  — server has accepted the job; worker hasn't picked it up
 *   - running — worker is processing; show throughput counter (X/Y)
 *   - succeeded — terminal; counters become final
 *   - failed   — terminal; surface job-level error message
 *
 * Kept in this app (not @edforge/ui) because all four consumers live in
 * the finance MFE and the visual style is finance-specific.
 */

import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import type { AsyncBulkJobResult } from '@edforge/finance-services'

interface AsyncJobProgressProps {
  job: AsyncBulkJobResult | undefined
  /** Verb noun for the running label, e.g. "Sending receipts". */
  verbingNoun: string
}

export function AsyncJobProgress({ job, verbingNoun }: AsyncJobProgressProps) {
  const { t } = useTranslation('payments')

  if (!job || job.status === 'queued') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary)/0.5)] px-4 py-3">
        <Loader2 className="w-4 h-4 text-[rgb(var(--text-tertiary))] animate-spin flex-shrink-0" />
        <div className="text-sm text-[rgb(var(--text-secondary))]">
          {t('asyncJobs.progress.queued')}
        </div>
      </div>
    )
  }

  if (job.status === 'running') {
    const done = job.succeeded + job.failed + job.skipped
    return (
      <div className="rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary)/0.5)] px-4 py-3">
        <div className="flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-[rgb(var(--action-primary-bg))] animate-spin flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[rgb(var(--text-primary))]">
              {verbingNoun}…
            </div>
            <div className="text-xs text-[rgb(var(--text-tertiary))] tabular-nums">
              {t('asyncJobs.progress.processed', { done, total: job.totalRecords })}
            </div>
          </div>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-[rgb(var(--background-tertiary))] overflow-hidden">
          <div
            className="h-full bg-[rgb(var(--action-primary-bg))] transition-[width] duration-300"
            style={{ width: `${job.totalRecords > 0 ? (done / job.totalRecords) * 100 : 0}%` }}
          />
        </div>
      </div>
    )
  }

  if (job.status === 'succeeded') {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-[rgb(var(--state-success-border)/0.4)] bg-[rgb(var(--state-success-bg)/0.18)] px-4 py-3">
        <CheckCircle2 className="w-4 h-4 text-[rgb(var(--state-success-fg))] mt-0.5 flex-shrink-0" />
        <div className="text-sm text-[rgb(var(--state-success-fg))]">
          <div className="font-medium">{t('asyncJobs.progress.done')}</div>
          <div className="text-xs mt-0.5 tabular-nums">
            {t('asyncJobs.progress.summary', {
              succeeded: job.succeeded,
              skipped: job.skipped,
              failed: job.failed,
            })}
          </div>
        </div>
      </div>
    )
  }

  // failed
  return (
    <div className="flex items-start gap-3 rounded-lg border border-[rgb(var(--state-danger-border)/0.4)] bg-[rgb(var(--state-danger-bg)/0.18)] px-4 py-3">
      <XCircle className="w-4 h-4 text-[rgb(var(--state-danger-fg))] mt-0.5 flex-shrink-0" />
      <div className="text-sm text-[rgb(var(--state-danger-fg))]">
        <div className="font-medium">{t('asyncJobs.progress.failed')}</div>
        <div className="text-xs mt-0.5">{job.error ?? t('asyncJobs.progress.failureFallback')}</div>
      </div>
    </div>
  )
}
