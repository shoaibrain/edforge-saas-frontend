/**
 * InvoiceStatusBadge
 *
 * Color-coded badge for invoice and payment statuses.
 */

import type { InvoiceStatus, PaymentStatus } from '@edforge/types'
import { useTranslation } from '@edforge/i18n'

type StatusType = InvoiceStatus | PaymentStatus

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'bg-[rgb(var(--surface-tertiary))] ', text: 'text-[rgb(var(--text-secondary))] ' },
  issued: { bg: 'bg-[rgb(var(--state-info-bg)/0.18)] dark:bg-[rgb(var(--state-info-bg)/0.18)]0/20', text: 'text-[rgb(var(--state-info-fg))] ' },
  partially_paid: { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400' },
  paid: { bg: 'bg-[rgb(var(--state-success-bg)/0.18)] ', text: 'text-[rgb(var(--state-success-fg))] ' },
  completed: { bg: 'bg-[rgb(var(--state-success-bg)/0.18)] ', text: 'text-[rgb(var(--state-success-fg))] ' },
  overdue: { bg: 'bg-[rgb(var(--state-danger-bg)/0.18)] dark:bg-[rgb(var(--state-danger-bg)/0.18)]0/20', text: 'text-[rgb(var(--state-danger-fg))] ' },
  failed: { bg: 'bg-[rgb(var(--state-danger-bg)/0.18)] dark:bg-[rgb(var(--state-danger-bg)/0.18)]0/20', text: 'text-[rgb(var(--state-danger-fg))] ' },
  cancelled: { bg: 'bg-[rgb(var(--surface-tertiary))] ', text: 'text-[rgb(var(--text-secondary))] ' },
  written_off: { bg: 'bg-[rgb(var(--surface-tertiary))] ', text: 'text-[rgb(var(--text-secondary))] ' },
  pending: { bg: 'bg-[rgb(var(--state-warning-bg)/0.18)] ', text: 'text-[rgb(var(--state-warning-fg))] ' },
  processing: { bg: 'bg-[rgb(var(--state-info-bg)/0.18)] dark:bg-[rgb(var(--state-info-bg)/0.18)]0/20', text: 'text-[rgb(var(--state-info-fg))] ' },
  refunded: { bg: 'bg-[rgb(var(--state-info-bg)/0.18)] ', text: 'text-[rgb(var(--state-info-fg))] ' },
  partially_refunded: { bg: 'bg-[rgb(var(--state-info-bg)/0.18)] ', text: 'text-[rgb(var(--state-info-fg))] ' },
}

const DEFAULT_STYLE = { bg: 'bg-[rgb(var(--surface-tertiary))] ', text: 'text-[rgb(var(--text-secondary))] ' }

export function InvoiceStatusBadge({ status }: { status: StatusType }) {
  const { t } = useTranslation('payments')
  const style = STATUS_STYLES[status] ?? DEFAULT_STYLE

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
    >
      {t(`status.${status}`, { defaultValue: status })}
    </span>
  )
}
