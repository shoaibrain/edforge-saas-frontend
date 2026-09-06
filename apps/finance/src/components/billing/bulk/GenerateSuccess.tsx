/**
 * GenerateSuccess — post-generate confirmation screen (sync path).
 *
 * Renders ONLY what the bulk-generate response actually returned:
 * generated / skipped / failed counters + the backend's per-student
 * errors[]. Invoice numbers are assigned server-side and are NOT echoed
 * back on the sync response, so no per-invoice list (or total) is
 * projected client-side — the previous fabricated-numbers list lied when
 * the server skipped or failed rows.
 *
 * Other affordances:
 *   - "Download all (PDF)" → Phase 1 stub (Sprint F adds the actual bulk
 *     ZIP export; Phase 1 disables the button with a tooltip)
 *   - "New batch" → resets the wizard
 *   - "Close" → returns to the invoices list
 */

import { AlertTriangle, CheckCircle, Download, RotateCcw, X } from 'lucide-react'
import { Button } from '@edforge/ui'
import { UuidBadge } from '@edforge/archetype'
import { useTranslation } from '@edforge/i18n'

export interface GenerateResultError {
  /** Empty string when the backend returned a bare message with no id. */
  studentId: string
  reason: string
}

export interface GenerateResult {
  generated: number
  skipped: number
  errors: GenerateResultError[]
  billingPeriod: string
}

export interface GenerateSuccessProps {
  result: GenerateResult
  onReset: () => void
  onClose?: () => void
}

export function GenerateSuccess({ result, onReset, onClose }: GenerateSuccessProps) {
  const { t } = useTranslation('payments')
  const failed = result.errors.length
  return (
    <div className="space-y-6">
      <div className="text-center space-y-3 py-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent-strong))]">
          <CheckCircle className="w-9 h-9" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-[rgb(var(--text-primary))]">
            {t('bulkGenerate.success.generatedTitle', { count: result.generated })}
          </h2>
          <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
            {result.billingPeriod
              ? t('bulkGenerate.success.periodNotice', {
                  billingPeriod: result.billingPeriod,
                })
              : t('bulkGenerate.success.notice')}
          </p>
        </div>
        <div className="flex items-center justify-center gap-8 text-sm">
          <Stat label={t('bulkGenerate.success.invoices')} value={result.generated} />
          {result.skipped > 0 && (
            <Stat label={t('bulkGenerate.success.skipped')} value={result.skipped} tone="muted" />
          )}
          {failed > 0 && (
            <Stat label={t('bulkGenerate.success.failed')} value={failed} tone="danger" />
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Button
          variant="outline"
          disabled
          title={t('bulkGenerate.success.downloadAllTooltip')}
        >
          <Download className="w-4 h-4 mr-1.5" />
          {t('bulkGenerate.success.downloadAll')}
        </Button>
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="w-4 h-4 mr-1.5" /> {t('bulkGenerate.success.newBatch')}
        </Button>
        {onClose && (
          <Button onClick={onClose}>
            <X className="w-4 h-4 mr-1.5" /> {t('actions.close')}
          </Button>
        )}
      </div>

      {failed > 0 && (
        <div className="border border-[rgb(var(--state-danger-border)/0.4)] rounded-md bg-[rgb(var(--state-danger-bg)/0.10)] p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[rgb(var(--state-danger-fg))] mb-2">
            <AlertTriangle className="w-4 h-4" />
            {t('bulkGenerate.success.failuresTitle', { count: failed })}
          </div>
          <ul className="divide-y divide-[rgb(var(--border-primary))] max-h-60 overflow-y-auto">
            {result.errors.map((error, i) => (
              <li
                key={`${error.studentId}-${i}`}
                className="flex items-center gap-3 px-2 py-1.5 text-sm"
              >
                {error.studentId && (
                  <span className="text-xs text-[rgb(var(--text-tertiary))] whitespace-nowrap">
                    <UuidBadge value={error.studentId} />
                  </span>
                )}
                <span className="flex-1 min-w-0 truncate text-[rgb(var(--text-secondary))]">
                  {error.reason}
                </span>
              </li>
            ))}
          </ul>
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
      <div className={/* allow-arbitrary-spacing: dense bulk-wizard label; pre-token-sweep */ "text-[11px] uppercase tracking-wider text-[rgb(var(--text-tertiary))] mt-0.5"}>
        {label}
      </div>
    </div>
  )
}
