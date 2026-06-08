/**
 * PaymentSummary
 *
 * NPR breakdown showing subtotal, tax, discount, and grand total.
 * Uses Nepal-style number formatting with lakh/crore grouping.
 */

import type { Invoice } from '@edforge/types'
import { useCurrency } from '@edforge/types/use-currency'
import { useTranslation } from '@edforge/i18n'
import { useSettings } from '../../lib/shell-context'

interface PaymentSummaryProps {
  invoice: Invoice
  compact?: boolean
}

export function PaymentSummary({ invoice, compact = false }: PaymentSummaryProps) {
  const { t } = useTranslation('payments')
  const settings = useSettings()
  const { format } = useCurrency(settings)
  const fmt = (amount: number) => format(amount)

  if (compact) {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-[rgb(var(--text-secondary))]">
          {t('summary.amountDue')}
        </span>
        <span className="text-lg font-bold text-[rgb(var(--text-primary))]">
          {fmt(invoice.amountDue)}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2 text-sm">
      <SummaryRow label={t('summary.subtotal')} value={fmt(invoice.subtotal)} />
      {invoice.discountTotal > 0 && (
        <SummaryRow
          label={t('summary.discountTotal')}
          value={`-${fmt(invoice.discountTotal)}`}
          className="text-[rgb(var(--state-success-fg))] "
        />
      )}
      {invoice.taxTotal > 0 && (
        <SummaryRow label={t('summary.taxTotal')} value={fmt(invoice.taxTotal)} />
      )}
      <div className="border-t border-[rgb(var(--border-primary))] pt-2 mt-2">
        <SummaryRow
          label={t('summary.grandTotal')}
          value={fmt(invoice.grandTotal)}
          bold
        />
      </div>
      {invoice.amountPaid > 0 && (
        <SummaryRow
          label={t('summary.amountPaid')}
          value={`-${fmt(invoice.amountPaid)}`}
          className="text-[rgb(var(--state-success-fg))] "
        />
      )}
      {invoice.amountDue > 0 && invoice.amountDue !== invoice.grandTotal && (
        <div className="border-t border-[rgb(var(--border-primary))] pt-2">
          <SummaryRow
            label={t('summary.balanceDue')}
            value={fmt(invoice.amountDue)}
            bold
            className="text-[rgb(var(--state-danger-fg))] "
          />
        </div>
      )}
    </div>
  )
}

function SummaryRow({
  label,
  value,
  bold,
  className,
}: {
  label: string
  value: string
  bold?: boolean
  className?: string
}) {
  return (
    <div className={`flex justify-between ${className ?? ''}`}>
      <span
        className={`${bold ? 'font-semibold' : ''} text-[rgb(var(--text-secondary))]`}
      >
        {label}
      </span>
      <span
        className={`${bold ? 'font-bold text-[rgb(var(--text-primary))]' : 'text-[rgb(var(--text-primary))]'}`}
      >
        {value}
      </span>
    </div>
  )
}
