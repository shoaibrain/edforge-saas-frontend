/**
 * Joined 4-segment summary strip (Grand Total / Amount Paid / Amount Due /
 * Due Date) — the detail-page counterpart of the invoices-list KPI band,
 * on the shared StatBand.
 */

import { StatBand, type StatMetric } from '@edforge/ui'
import { Calendar, CreditCard, FileText, Wallet } from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import type { Invoice, Payment } from '@edforge/types'
import type { ResolvedSettings } from '@edforge/config/resolved-settings'
import { formatDate } from '../../../utils/format-date'
import { bsSubOf, overdueDaysOf } from './invoice-detail-utils'
import { formatPaymentGateway } from './gateway-label'

export interface InvoiceSummaryBandProps {
  invoice: Invoice
  payments: Payment[]
  settings: ResolvedSettings
  format: (amount: number) => string
}

export function InvoiceSummaryBand({
  invoice,
  payments,
  settings,
  format,
}: InvoiceSummaryBandProps) {
  const { t } = useTranslation('payments')
  const overdueDays = overdueDaysOf(invoice)
  const late = overdueDays > 0
  const cancelled = invoice.status === 'cancelled'
  const amountPaid = invoice.amountPaid ?? 0
  const amountDue = invoice.amountDue ?? 0
  const lastGateway = payments[0]?.gateway

  const dueBs = bsSubOf(invoice.dueDate, settings)

  const metrics: StatMetric[] = [
    {
      label: t('summary.grandTotal'),
      value: format(invoice.grandTotal),
      icon: <CreditCard className="h-4 w-4" />,
      sub: t('invoiceDetail.band.lineItemCount', { count: invoice.lineItems?.length ?? 0 }),
    },
    {
      label: t('summary.amountPaid'),
      value: format(amountPaid),
      icon: <Wallet className="h-4 w-4" />,
      state: amountPaid > 0 ? 'good' : 'normal',
      emphasizeValue: true,
      sub:
        amountPaid > 0 && lastGateway
          ? t('invoiceDetail.paymentHistory.via', {
              gateway: formatPaymentGateway(lastGateway, t),
            })
          : t('invoiceDetail.band.noPaymentsYet'),
    },
    {
      label: t('summary.amountDue'),
      value: cancelled ? '—' : format(amountDue),
      icon: <FileText className="h-4 w-4" />,
      state: cancelled ? 'muted' : late ? 'critical' : amountDue > 0 ? 'warn' : 'normal',
      sub: cancelled
        ? t('invoiceDetail.band.invoiceCancelled')
        : amountDue === 0
          ? t('invoiceDetail.band.settledInFull')
          : t('invoiceDetail.band.outstandingBalance'),
    },
    late
      ? {
          label: t('invoiceDetail.band.dueDate'),
          value: invoice.dueDate ? formatDate(invoice.dueDate, settings) : '—',
          icon: <Calendar className="h-4 w-4" />,
          state: 'critical',
          sub: dueBs ? `BS ${dueBs}` : undefined,
          pill: { tone: 'critical', text: t('invoiceDetail.band.daysLate', { days: overdueDays }) },
        }
      : {
          label: t('invoiceDetail.band.dueDate'),
          value: invoice.dueDate ? formatDate(invoice.dueDate, settings) : '—',
          icon: <Calendar className="h-4 w-4" />,
          state: 'normal',
          sub: dueBs ? `BS ${dueBs}` : undefined,
        },
  ]

  return <StatBand metrics={metrics} ariaLabel={t('invoiceDetail.band.region')} />
}
