/**
 * Pre-kickoff body of the bulk-export drawer: manifest card, output-format
 * picker (ZIP vs merged PDF, per-format caps), filename preview, skip
 * warning, and the runs-in-background note.
 */

import type { ReactNode } from 'react'
import { AlertTriangle, FileArchive, FileText, Info, Users, Wallet } from 'lucide-react'
import { cn } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import { BULK_PDF_EXPORT_LIMITS, type BulkPdfExportFormat } from '@edforge/finance-services'
import {
  bundleNameFor,
  estimateBundle,
  fileNameFor,
  formatBytes,
  type ExportDocType,
  type ExportManifest,
} from './export-manifest'

export interface ExportPreflightProps {
  manifest: ExportManifest
  docType: ExportDocType
  i18nRoot: string
  format: BulkPdfExportFormat
  onFormatChange: (format: BulkPdfExportFormat) => void
  /** Currency formatter from useCurrency(settings). */
  formatMoney: (amount: number) => string
}

function ManifestRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center gap-3 border-b border-[rgb(var(--border-primary)/0.35)] px-3.5 py-3 last:border-b-0">
      <span className="grid h-8 w-8 flex-none place-items-center rounded-md bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]">
        {icon}
      </span>
      <span className="w-24 flex-none text-sm text-[rgb(var(--text-tertiary))]">{label}</span>
      <span className="min-w-0 flex-1 text-end text-sm font-medium text-[rgb(var(--text-primary))]">
        {children}
      </span>
    </div>
  )
}

export function ExportPreflight({
  manifest,
  docType,
  i18nRoot,
  format,
  onFormatChange,
  formatMoney,
}: ExportPreflightProps) {
  const { t } = useTranslation('payments')
  const count = manifest.rows.length
  const est = estimateBundle(count)
  const previewRows = manifest.rows.slice(0, 3)

  const formatTile = (value: BulkPdfExportFormat) => {
    const limit = BULK_PDF_EXPORT_LIMITS[value]
    const overCap = count > limit
    const on = format === value
    return (
      <button
        key={value}
        type="button"
        role="radio"
        aria-checked={on}
        disabled={overCap}
        onClick={() => onFormatChange(value)}
        className={cn(
          'flex flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-start transition-colors',
          on
            ? 'border-[rgb(var(--state-success-border))] bg-[rgb(var(--state-success-bg))]'
            : 'border-[rgb(var(--border-secondary)/0.5)] bg-[rgb(var(--background-primary))] hover:border-[rgb(var(--border-strong)/0.7)]',
          overCap && 'cursor-not-allowed opacity-50'
        )}
      >
        <span
          className={cn(
            'text-sm font-medium',
            on ? 'text-[rgb(var(--state-success-fg))]' : 'text-[rgb(var(--text-primary))]'
          )}
        >
          {t(`${i18nRoot}.format.${value === 'zip' ? 'zip' : 'merged'}`)}
        </span>
        <span className="text-xs text-[rgb(var(--text-tertiary))]">
          {overCap
            ? t('asyncJobs.pdfExportShared.format.overCap', { limit })
            : t(`${i18nRoot}.format.${value === 'zip' ? 'zipSub' : 'mergedSub'}`)}
        </span>
      </button>
    )
  }

  return (
    <div className="space-y-4">
      {/* Manifest card */}
      <div className="overflow-hidden rounded-xl border border-[rgb(var(--border-primary)/0.5)] bg-[rgb(var(--background-primary))]">
        <ManifestRow
          icon={<FileText className="h-4 w-4" />}
          label={t('asyncJobs.pdfExportShared.documents')}
        >
          <span className="tabular-nums">{count}</span>
          {manifest.byStatus.length > 0 && (
            <span className="mt-1 flex flex-wrap justify-end gap-1">
              {manifest.byStatus.map(({ status, count: n }) => (
                <span
                  key={status}
                  className="rounded-full border border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-tertiary))] px-2 py-px text-2xs font-normal capitalize text-[rgb(var(--text-tertiary))]"
                >
                  {n} {t(`status.${status}`, { defaultValue: status.replace(/_/g, ' ') })}
                </span>
              ))}
            </span>
          )}
        </ManifestRow>
        {manifest.studentCount > 0 && (
          <ManifestRow
            icon={<Users className="h-4 w-4" />}
            label={t('asyncJobs.pdfExportShared.students')}
          >
            <span className="tabular-nums">
              {t('asyncJobs.pdfExportShared.studentCount', { count: manifest.studentCount })}
            </span>
            {manifest.grades.length > 0 && (
              <span className="block text-xs font-normal text-[rgb(var(--text-tertiary))]">
                {t('asyncJobs.pdfExportShared.grades', { grades: manifest.grades.join(', ') })}
              </span>
            )}
          </ManifestRow>
        )}
        <ManifestRow
          icon={<Wallet className="h-4 w-4" />}
          label={t(`${i18nRoot}.totalValueLabel`)}
        >
          <span className="font-mono text-xs tabular-nums">
            {formatMoney(manifest.totalValue)}
          </span>
        </ManifestRow>
        <ManifestRow
          icon={<FileArchive className="h-4 w-4" />}
          label={t('asyncJobs.pdfExportShared.bundle')}
        >
          {t(`${i18nRoot}.format.${format === 'zip' ? 'zipSub' : 'mergedSub'}`)}
          <span className="block text-xs font-normal text-[rgb(var(--text-tertiary))]">
            ≈ {formatBytes(est.bytes)} ·{' '}
            {t('asyncJobs.pdfExportShared.estimateSeconds', { seconds: est.seconds })}
          </span>
        </ManifestRow>
      </div>

      {/* Output format picker (#305 / Sprint H.4) */}
      <div>
        <p className="mb-1.5 text-sm font-medium text-[rgb(var(--text-secondary))]">
          {t('asyncJobs.pdfExportShared.format.label')}
        </p>
        <div
          className="grid grid-cols-2 gap-2"
          role="radiogroup"
          aria-label={t('asyncJobs.pdfExportShared.format.label')}
        >
          {(['zip', 'merged_pdf'] as const).map(formatTile)}
        </div>
      </div>

      {/* Filename preview */}
      <div className="rounded-lg border border-dashed border-[rgb(var(--border-secondary)/0.5)] bg-[rgb(var(--background-primary))] px-3.5 py-2.5 font-mono text-xs text-[rgb(var(--text-tertiary))]">
        <p className="mb-1.5 flex items-center gap-2 text-xs font-medium text-[rgb(var(--text-primary))]">
          <FileArchive className="h-3.5 w-3.5" />
          {bundleNameFor(docType, format)}
        </p>
        {format === 'zip' && (
          <>
            {previewRows.map((row) => (
              <p key={row.id} className="py-0.5 ps-5">
                └ {fileNameFor(row)}
              </p>
            ))}
            {count > previewRows.length && (
              <p className="ps-5 pt-0.5 text-[rgb(var(--text-disabled))]">
                {t('asyncJobs.pdfExportShared.morePdfs', { count: count - previewRows.length })}
              </p>
            )}
          </>
        )}
      </div>

      {/* Skip warning */}
      {manifest.skippedCount > 0 && (
        <div className="flex items-start gap-2.5 rounded-lg border border-[rgb(var(--state-warning-border)/0.3)] bg-[rgb(var(--state-warning-bg)/0.45)] px-3.5 py-3 text-sm leading-relaxed text-[rgb(var(--text-secondary))]">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-[rgb(var(--state-warning-fg))]" />
          <span>{t(`${i18nRoot}.skippedNote`, { count: manifest.skippedCount })}</span>
        </div>
      )}

      {/* Background note */}
      <div className="flex items-start gap-2.5 rounded-lg border border-[rgb(var(--state-info-border)/0.35)] bg-[rgb(var(--state-info-bg)/0.55)] px-3.5 py-3 text-sm leading-relaxed text-[rgb(var(--text-secondary))]">
        <Info className="mt-0.5 h-4 w-4 flex-none text-[rgb(var(--state-info-fg))]" />
        <span>{t('asyncJobs.pdfExportShared.backgroundNote')}</span>
      </div>
    </div>
  )
}
