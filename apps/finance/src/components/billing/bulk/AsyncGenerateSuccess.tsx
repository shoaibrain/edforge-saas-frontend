/**
 * AsyncGenerateSuccess — terminal success screen for the async bulk-generate
 * path (Sprint E.5).
 *
 * Visual sibling of `GenerateSuccess`, but driven by the worker job's
 * counters rather than the sync mutation's response. Two operator-locked
 * shape differences vs the sync screen:
 *
 *   1. Invoices are created as DRAFTS (BE decision, Sprint E) — copy
 *      makes this explicit so the operator knows nothing has been
 *      dispatched to families yet. The follow-up Issue action lives on
 *      the invoice list.
 *
 *   2. The per-invoice list isn't available — the worker doesn't
 *      stream back per-row results, only aggregate counters + a
 *      capped (≤ 50) failures sample. We surface the failures sample
 *      with reasons; the count carries the truth.
 *
 * On `failed > 0` we offer a Retry-failed-only button which submits a
 * new bulk-generate restricted to `failures[].recordId`. The button
 * is gated when failures.length === 0 (e.g. the BE returned only the
 * top-level error and no per-record list) — the operator cannot retry
 * a set we don't know.
 */

import { AlertTriangle, CheckCircle, RotateCcw, X } from 'lucide-react'
import { Button } from '@edforge/ui'
import type { AsyncBulkJobResult } from '@edforge/finance-services'

export interface AsyncGenerateSuccessProps {
  job: AsyncBulkJobResult
  billingPeriod: string
  onReset: () => void
  onClose?: () => void
  onRetryFailed?: (failedStudentIds: string[]) => void
  /** True while the retry-failed mutation is in flight. */
  retryPending?: boolean
}

export function AsyncGenerateSuccess({
  job,
  billingPeriod,
  onReset,
  onClose,
  onRetryFailed,
  retryPending,
}: AsyncGenerateSuccessProps) {
  const failedIds = (job.failures ?? []).map((f) => f.recordId)
  const hasFailures = job.failed > 0
  const canRetryFailed = hasFailures && failedIds.length > 0 && !!onRetryFailed

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3 py-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent-strong))]">
          <CheckCircle className="w-9 h-9" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-[rgb(var(--text-primary))]">
            {job.succeeded} invoice{job.succeeded === 1 ? '' : 's'} created as drafts
          </h2>
          <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
            For{billingPeriod ? ` ${billingPeriod}` : ''}. Click Issue on each
            invoice (or use bulk-issue) to send them to families.
          </p>
        </div>
        <div className="flex items-center justify-center gap-8 text-sm">
          <Stat label="Created" value={job.succeeded} />
          {job.skipped > 0 && (
            <Stat label="Skipped" value={job.skipped} tone="muted" />
          )}
          {hasFailures && (
            <Stat label="Failed" value={job.failed} tone="danger" />
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 flex-wrap">
        {canRetryFailed && (
          <Button
            variant="outline"
            onClick={() => onRetryFailed!(failedIds)}
            disabled={retryPending}
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Retry failed ({failedIds.length})
          </Button>
        )}
        <Button variant="outline" onClick={onReset} disabled={retryPending}>
          <RotateCcw className="w-4 h-4 mr-1.5" /> New batch
        </Button>
        {onClose && (
          <Button onClick={onClose} disabled={retryPending}>
            <X className="w-4 h-4 mr-1.5" /> Close
          </Button>
        )}
      </div>

      {hasFailures && (
        <div className="border border-[rgb(var(--state-danger-border)/0.4)] rounded-md bg-[rgb(var(--state-danger-bg)/0.10)] p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[rgb(var(--state-danger-fg))] mb-2">
            <AlertTriangle className="w-4 h-4" />
            {job.failed} failure{job.failed === 1 ? '' : 's'}
            {job.failures && job.failures.length < job.failed && (
              <span className="text-xs font-normal text-[rgb(var(--text-tertiary))]">
                (showing first {job.failures.length})
              </span>
            )}
          </div>
          {(job.failures ?? []).length > 0 ? (
            <ul className="divide-y divide-[rgb(var(--border-primary))] max-h-[240px] overflow-y-auto">
              {(job.failures ?? []).map((f) => (
                <li
                  key={f.recordId}
                  className="flex items-center gap-3 px-2 py-1.5 text-sm"
                >
                  <span className="text-xs font-mono text-[rgb(var(--text-tertiary))] whitespace-nowrap">
                    {f.recordId.slice(0, 8)}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-[rgb(var(--text-secondary))]">
                    {f.reason}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              No per-record reasons were returned by the worker.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone?: 'muted' | 'danger'
}) {
  return (
    <div className="text-center">
      <div
        className={[
          'text-2xl font-semibold tabular-nums',
          tone === 'muted'
            ? 'text-[rgb(var(--text-tertiary))]'
            : tone === 'danger'
              ? 'text-[rgb(var(--state-danger-fg))]'
              : 'text-[rgb(var(--text-primary))]',
        ].join(' ')}
      >
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wider text-[rgb(var(--text-tertiary))] mt-0.5">
        {label}
      </div>
    </div>
  )
}
