/**
 * In-flight body of the bulk-export drawer.
 *
 * Progress honesty: the worker flushes counters to the job row in batches
 * of 25 (COUNTER_BATCH_SIZE), so a small export polls `succeeded: 0` until
 * the job goes terminal. Until the first real counter lands this renders an
 * INDETERMINATE bar + stage text (never a frozen "0%"); once processed > 0
 * the display switches to a real percentage and document counts.
 */

import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Info, Minus, XCircle } from 'lucide-react'
import { cn } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import type { FinanceJobRow } from '@edforge/finance-services'
import type { ExportRowSummary } from './export-manifest'

export interface ExportRunningProps {
  job: FinanceJobRow | undefined
  /** react-query dataUpdatedAt for the "synced Ns ago" line. */
  dataUpdatedAt: number
  rows: ExportRowSummary[]
}

function CounterRow({
  icon,
  label,
  value,
  danger,
}: {
  icon: React.ReactNode
  label: string
  value: number
  danger?: boolean
}) {
  return (
    <div className="flex items-center gap-3 border-b border-[rgb(var(--border-primary)/0.35)] px-3.5 py-2.5 last:border-b-0">
      <span className="grid h-7 w-7 flex-none place-items-center rounded-md bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]">
        {icon}
      </span>
      <span className="flex-1 text-sm text-[rgb(var(--text-tertiary))]">{label}</span>
      <span
        className={cn(
          'font-mono text-sm tabular-nums',
          danger ? 'text-[rgb(var(--state-danger-fg))]' : 'text-[rgb(var(--text-primary))]'
        )}
      >
        {value}
      </span>
    </div>
  )
}

export function ExportRunning({ job, dataUpdatedAt, rows }: ExportRunningProps) {
  const { t } = useTranslation('payments')

  // 1s ticker for the "synced Ns ago" label while running.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const counters = job?.counters
  const requested = counters?.requested ?? rows.length
  const processed = counters
    ? counters.succeeded + counters.failed + counters.skipped
    : 0
  const hasRealProgress = processed > 0
  const pct = requested > 0 ? Math.min(100, Math.round((processed / requested) * 100)) : 0
  const sincePoll = dataUpdatedAt ? Math.max(0, Math.round((now - dataUpdatedAt) / 1000)) : 0
  const stageLabel =
    !job || job.status === 'queued'
      ? t('asyncJobs.pdfExportShared.preparingExport')
      : t('asyncJobs.pdfExportShared.generatingPdfs')

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          {hasRealProgress ? (
            <span className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-[rgb(var(--text-primary))]">
              {pct}
              <em className="not-italic text-base text-[rgb(var(--text-tertiary))]">%</em>
            </span>
          ) : (
            <span className="text-base font-medium text-[rgb(var(--text-primary))]">
              {stageLabel}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-tertiary))]">
            <span
              className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--state-success-border))] motion-safe:animate-pulse"
              aria-hidden="true"
            />
            {t('asyncJobs.pdfExportShared.synced', { seconds: sincePoll })}
          </span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-[rgb(var(--background-tertiary))]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          {...(hasRealProgress
            ? { 'aria-valuenow': pct }
            : { 'aria-valuetext': stageLabel })}
        >
          {hasRealProgress ? (
            <div
              className="h-full rounded-full bg-[rgb(var(--state-success-border))] transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          ) : (
            <div className="v2-indeterminate-sweep h-full rounded-full bg-[rgb(var(--state-success-border))]" />
          )}
        </div>
        {(hasRealProgress || requested > 0) && (
          <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
            {hasRealProgress
              ? t('asyncJobs.pdfExportShared.prepared', {
                  current: processed,
                  total: requested,
                })
              : t('asyncJobs.pdfExportShared.docTotal', { count: requested })}
          </p>
        )}
      </div>

      {hasRealProgress && counters && (
        <div className="overflow-hidden rounded-xl border border-[rgb(var(--border-primary)/0.5)] bg-[rgb(var(--background-primary))]">
          <CounterRow
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            label={t('asyncJobs.pdfExportShared.generated')}
            value={counters.succeeded}
          />
          {counters.skipped > 0 && (
            <CounterRow
              icon={<Minus className="h-3.5 w-3.5" />}
              label={t('asyncJobs.pdfExportShared.skipped')}
              value={counters.skipped}
            />
          )}
          <CounterRow
            icon={
              counters.failed > 0 ? (
                <XCircle className="h-3.5 w-3.5" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )
            }
            label={t('asyncJobs.pdfExportShared.failed')}
            value={counters.failed}
            danger={counters.failed > 0}
          />
        </div>
      )}

      <div className="flex items-start gap-2.5 rounded-lg border border-[rgb(var(--state-info-border)/0.35)] bg-[rgb(var(--state-info-bg)/0.55)] px-3.5 py-3 text-sm leading-relaxed text-[rgb(var(--text-secondary))]">
        <Info className="mt-0.5 h-4 w-4 flex-none text-[rgb(var(--state-info-fg))]" />
        <span>{t('asyncJobs.pdfExportShared.safeToClose')}</span>
      </div>
    </div>
  )
}
