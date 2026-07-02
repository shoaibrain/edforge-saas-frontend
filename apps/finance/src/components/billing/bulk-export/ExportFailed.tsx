/**
 * Terminal-failure body: danger banner + support note with the short job id.
 */

import { Info, XCircle } from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import type { FinanceJobRow } from '@edforge/finance-services'

export interface ExportFailedProps {
  job: FinanceJobRow
}

export function ExportFailed({ job }: ExportFailedProps) {
  const { t } = useTranslation('payments')
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-[rgb(var(--state-danger-border)/0.3)] bg-[rgb(var(--state-danger-bg)/0.45)] px-3.5 py-3">
        <XCircle className="mt-0.5 h-5 w-5 flex-none text-[rgb(var(--state-danger-fg))]" />
        <div>
          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            {t('asyncJobs.pdfExportShared.failedTitle')}
          </p>
          <p className="mt-0.5 text-sm text-[rgb(var(--text-secondary))]">
            {t('asyncJobs.pdfExportShared.failedBody', { count: job.counters.requested })}
          </p>
        </div>
      </div>
      <div className="flex items-start gap-2.5 rounded-lg border border-[rgb(var(--state-info-border)/0.35)] bg-[rgb(var(--state-info-bg)/0.55)] px-3.5 py-3 text-sm leading-relaxed text-[rgb(var(--text-secondary))]">
        <Info className="mt-0.5 h-4 w-4 flex-none text-[rgb(var(--state-info-fg))]" />
        <span>
          {t('asyncJobs.pdfExportShared.supportNote')}{' '}
          {/* eslint-disable-next-line edforge/no-id-slice-in-jsx -- deliberate short job-id for support reference */}
          <b className="font-mono text-[rgb(var(--text-primary))]">{job.jobId.slice(0, 8)}</b>
        </span>
      </div>
    </div>
  )
}
