/**
 * GenerateSuccess — post-generate confirmation screen.
 *
 * Renders after the bulk-generate mutation succeeds. Operator-visible
 * affordances:
 *   - Count + grand total + skipped count
 *   - Per-invoice list with sequential numbers + per-student total
 *   - "Download all (PDF)" → Phase 1 stub (Sprint F adds the actual bulk
 *     ZIP export; Phase 1 disables the button with a tooltip)
 *   - "New batch" → resets the wizard
 *   - "Close" → returns to the invoices list
 */

import { CheckCircle, Download, RotateCcw, X } from 'lucide-react'
import { Button } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import { useCurrency } from '@edforge/types/use-currency'
import { useFinanceSettings } from '../../../layouts/FinanceLayout'

type Translate = (key: string, options?: Record<string, unknown>) => string

export interface GenerateResultInvoice {
  number: string
  studentId: string
  studentName: string
  gradeLevel: string
  total: number
}

export interface GenerateResult {
  count: number
  skipped: number
  total: number
  billingPeriod: string
  invoices: GenerateResultInvoice[]
}

export interface GenerateSuccessProps {
  result: GenerateResult
  onReset: () => void
  onClose?: () => void
}

export function GenerateSuccess({ result, onReset, onClose }: GenerateSuccessProps) {
  const { t } = useTranslation('payments')
  const settings = useFinanceSettings()
  const { format: formatCurrency } = useCurrency(settings)
  return (
    <div className="space-y-6">
      <div className="text-center space-y-3 py-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent-strong))]">
          <CheckCircle className="w-9 h-9" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-[rgb(var(--text-primary))]">
            {t('bulkGenerate.success.generatedTitle', { count: result.count })}
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
          <Stat label={t('bulkGenerate.success.invoices')} value={result.count} />
          <Stat label={t('bulkGenerate.success.totalBilled')} value={formatCurrency(result.total)} mono />
          {result.skipped > 0 && (
            <Stat label={t('bulkGenerate.success.skipped')} value={result.skipped} tone="muted" />
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Button
          variant="outline"
          disabled
          title={t('bulkGenerate.success.downloadAllTooltip')}
        >
          <Download className="w-4 h-4 me-1.5" />
          {t('bulkGenerate.success.downloadAll')}
        </Button>
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="w-4 h-4 me-1.5" /> {t('bulkGenerate.success.newBatch')}
        </Button>
        {onClose && (
          <Button onClick={onClose}>
            <X className="w-4 h-4 me-1.5" /> {t('actions.close')}
          </Button>
        )}
      </div>

      {result.invoices.length > 0 && (
        <div className={/* allow-arbitrary-spacing: fixed scroll-region height, not a type scale */ "border border-[rgb(var(--border-primary))] rounded-md bg-[rgb(var(--background-primary))] max-h-[380px] overflow-y-auto divide-y divide-[rgb(var(--border-primary))]"}>
          {result.invoices.map(iv => (
            <div
              key={iv.number}
              className="flex items-center gap-3 px-3 py-2"
            >
              <CheckCircle className="w-3.5 h-3.5 text-[rgb(var(--accent-strong))] flex-shrink-0" />
              <span className="text-xs font-mono text-[rgb(var(--text-tertiary))] whitespace-nowrap">
                {iv.number}
              </span>
              <span className="flex-1 min-w-0 text-sm text-[rgb(var(--text-primary))] truncate">
                {iv.studentName}{' '}
                <span className="text-[rgb(var(--text-tertiary))]">
                  · {gradeLabel(iv.gradeLevel, t)}
                </span>
              </span>
              <span className="text-sm font-mono font-semibold text-[rgb(var(--text-primary))] whitespace-nowrap">
                {formatCurrency(iv.total)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  mono,
  tone,
}: {
  label: string
  value: string | number
  mono?: boolean
  tone?: 'muted'
}) {
  return (
    <div className="text-center">
      <div
        className={[
          mono ? 'font-mono' : '',
          'text-2xl font-semibold',
          tone === 'muted'
            ? 'text-[rgb(var(--text-tertiary))]'
            : 'text-[rgb(var(--text-primary))]',
          'tabular-nums',
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

function gradeLabel(g: string, t: Translate): string {
  if (!g) return t('bulkGenerate.common.unknown')
  return /^\d+$/.test(g) ? t('bulkGenerate.common.gradeLabel', { grade: g }) : g
}
