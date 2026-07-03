/**
 * Draft / cancelled full-width state banner. The cancelled banner is
 * enriched from the statusHistory cancel entry (date, actor, reason)
 * when the backend provides it.
 */

import { Info, XCircle } from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import type { Invoice } from '@edforge/types'
import type { ResolvedSettings } from '@edforge/config/resolved-settings'
import { formatDate } from '../../../utils/format-date'

export interface InvoiceStateBannerProps {
  invoice: Invoice
  settings: ResolvedSettings
}

export function InvoiceStateBanner({ invoice, settings }: InvoiceStateBannerProps) {
  const { t } = useTranslation('payments')

  if (invoice.status === 'draft') {
    return (
      <div className="flex items-start gap-2.5 rounded-lg border border-[rgb(var(--state-info-border)/0.35)] bg-[rgb(var(--state-info-bg)/0.55)] px-3.5 py-3 text-sm leading-relaxed text-[rgb(var(--text-secondary))] print:hidden">
        <Info className="mt-0.5 h-4 w-4 flex-none text-[rgb(var(--state-info-fg))]" />
        <span>
          <b className="font-semibold text-[rgb(var(--text-primary))]">
            {t('invoiceDetail.banner.draftTitle')}
          </b>{' '}
          {t('invoiceDetail.banner.draftBody')}
        </span>
      </div>
    )
  }

  if (invoice.status === 'cancelled') {
    const cancelEntry = invoice.statusHistory?.find((e) => e.to === 'cancelled')
    const detailParts = [
      cancelEntry?.changedAt
        ? t('invoiceDetail.banner.cancelledOn', {
            date: formatDate(cancelEntry.changedAt, settings),
          })
        : null,
      cancelEntry?.changedBy
        ? t('invoiceDetail.banner.cancelledBy', { name: cancelEntry.changedBy })
        : null,
      cancelEntry?.reason ? `"${cancelEntry.reason}"` : null,
    ].filter(Boolean)

    return (
      <div className="flex items-start gap-2.5 rounded-lg border border-[rgb(var(--state-danger-border)/0.3)] bg-[rgb(var(--state-danger-bg)/0.45)] px-3.5 py-3 text-sm leading-relaxed text-[rgb(var(--text-secondary))] print:hidden">
        <XCircle className="mt-0.5 h-4 w-4 flex-none text-[rgb(var(--state-danger-fg))]" />
        <span>
          <b className="font-semibold text-[rgb(var(--text-primary))]">
            {t('invoiceDetail.banner.cancelledTitle')}
          </b>
          {detailParts.length > 0 && <> {detailParts.join(' · ')} —</>}{' '}
          {t('invoiceDetail.banner.cancelledBody')}
        </span>
      </div>
    )
  }

  return null
}
