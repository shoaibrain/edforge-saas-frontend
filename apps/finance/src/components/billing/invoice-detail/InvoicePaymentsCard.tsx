/**
 * Payment-history card: one row per recorded payment with a receipt link
 * (carrying the invoice id so the receipt page can link back), gateway +
 * dual-date sub-line, optional note, and the mint amount. Empty state
 * offers recording the first payment when the invoice is payable.
 */

import { Link } from '@tanstack/react-router'
import { ArrowRight, Plus, ReceiptText, Wallet } from 'lucide-react'
import { Button, cn } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import type { Invoice, Payment } from '@edforge/types'
import type { ResolvedSettings } from '@edforge/config/resolved-settings'
import { formatDate } from '../../../utils/format-date'
import { bsSubOf, isPayable } from './invoice-detail-utils'
import { formatPaymentGateway } from './gateway-label'

export interface InvoicePaymentsCardProps {
  invoice: Invoice
  payments: Payment[]
  onRecordPayment: () => void
  settings: ResolvedSettings
  format: (amount: number) => string
}

export function InvoicePaymentsCard({
  invoice,
  payments,
  onRecordPayment,
  settings,
  format,
}: InvoicePaymentsCardProps) {
  const { t } = useTranslation('payments')
  const canRecord = isPayable(invoice.status)

  return (
    <section className="overflow-hidden rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))]">
      <div className="flex items-center gap-2 border-b border-[rgb(var(--border-primary))] px-4 py-3">
        <Wallet className="h-4 w-4 text-[rgb(var(--text-tertiary))]" />
        <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
          {t('invoiceDetail.sections.paymentHistory')}
        </h2>
        {payments.length > 0 && canRecord && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRecordPayment}
            className="ms-auto print:hidden"
          >
            <Plus className="me-1 h-3.5 w-3.5" />
            {t('recordPayment.title')}
          </Button>
        )}
      </div>

      {payments.length === 0 ? (
        <div className="px-4 py-7 text-center text-sm text-[rgb(var(--text-tertiary))]">
          <p>{t('invoiceDetail.paymentHistory.empty')}</p>
          {canRecord && (
            <Button variant="outline" size="sm" onClick={onRecordPayment} className="mt-3 print:hidden">
              <Wallet className="me-1.5 h-3.5 w-3.5" />
              {t('invoiceDetail.paymentHistory.recordFirst')}
            </Button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-[rgb(var(--border-primary))]">
          {payments.map((payment) => {
            const paidDate = payment.paidAt ?? payment.createdAt
            const bs = bsSubOf(paidDate, settings)
            const note =
              typeof payment.metadata?.notes === 'string' ? payment.metadata.notes : undefined
            return (
              <div key={payment.id} className="flex items-center gap-3 px-4 py-3">
                <span className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-[rgb(var(--state-success-border)/0.4)] bg-[rgb(var(--state-success-bg))] text-[rgb(var(--state-success-fg))]">
                  <ReceiptText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  {payment.receiptNumber ? (
                    <Link
                      to="/payments/$paymentId/receipt"
                      params={{ paymentId: payment.id }}
                      search={{ invoiceId: invoice.id }}
                      className="font-mono text-sm font-semibold text-[rgb(var(--text-primary))] hover:text-[rgb(var(--state-success-fg))] hover:underline underline-offset-4"
                    >
                      {payment.receiptNumber}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                      {formatPaymentGateway(payment.gateway, t)}
                    </span>
                  )}
                  <p className="mt-0.5 text-xs text-[rgb(var(--text-tertiary))]">
                    {t('invoiceDetail.paymentHistory.via', {
                      gateway: formatPaymentGateway(payment.gateway, t),
                    })}
                    {paidDate && <> · {formatDate(paidDate, settings)}</>}
                    {bs && <> (BS {bs})</>}
                  </p>
                  {note && (
                    <p className="mt-0.5 text-xs italic text-[rgb(var(--text-secondary))]">
                      "{note}"
                    </p>
                  )}
                </div>
                <span className="whitespace-nowrap font-mono text-sm font-semibold tabular-nums text-[rgb(var(--state-success-fg))]">
                  + {format(payment.amount)}
                </span>
                {payment.receiptNumber && (
                  <Link
                    to="/payments/$paymentId/receipt"
                    params={{ paymentId: payment.id }}
                    search={{ invoiceId: invoice.id }}
                    aria-label={t('actions.viewReceipt')}
                    className={cn(
                      'grid h-8 w-8 flex-none place-items-center rounded-lg text-[rgb(var(--text-tertiary))] transition-colors',
                      'hover:bg-[rgb(var(--background-tertiary))] hover:text-[rgb(var(--text-primary))] print:hidden'
                    )}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
