/**
 * InvoiceDetail
 *
 * Full invoice view with line items, amounts, due date, and payment actions.
 */

import type { Invoice } from '@edforge/types'
import { useCurrency } from '@edforge/types/use-currency'
import { useTranslation } from '@edforge/i18n'
import { DateDisplay } from '@edforge/ui'
import { ArrowLeft, FileText } from 'lucide-react'
import { useSettings } from '../../lib/shell-context'
import { InvoiceStatusBadge } from './InvoiceStatusBadge'
import { PaymentSummary } from './PaymentSummary'

interface InvoiceDetailProps {
  invoice: Invoice
  onBack: () => void
  onPay: () => void
}

export function InvoiceDetail({ invoice, onBack, onPay }: InvoiceDetailProps) {
  const { t } = useTranslation('payments')
  const settings = useSettings()
  const { format } = useCurrency(settings)
  const canPay = ['issued', 'partially_paid', 'overdue'].includes(invoice.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
          aria-label={t('actions.back')}
        >
          <ArrowLeft className="w-5 h-5 text-[rgb(var(--text-secondary))]" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              {t('invoices.invoiceNumber')}{invoice.invoiceNumber}
            </h2>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-0.5">
            {invoice.studentName} &middot; {invoice.schoolName}
          </p>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[rgb(var(--bg-secondary))]">
        <div>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">{t('invoices.issuedDate')}</p>
          <p className="text-sm font-medium text-[rgb(var(--text-primary))] mt-0.5">
            <DateDisplay date={invoice.issuedDate} format="long" showDual />
          </p>
        </div>
        <div>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">{t('invoices.dueDate')}</p>
          <p className="text-sm font-medium text-[rgb(var(--text-primary))] mt-0.5">
            <DateDisplay date={invoice.dueDate} format="long" showDual />
          </p>
        </div>
      </div>

      {/* Line items table */}
      <div className="border border-[rgb(var(--border-primary))] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[rgb(var(--bg-secondary))]">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[rgb(var(--text-tertiary))]">
                {t('lineItems.description')}
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-[rgb(var(--text-tertiary))]">
                {t('lineItems.amount')}
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-[rgb(var(--text-tertiary))]">
                {t('lineItems.discount')}
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-[rgb(var(--text-tertiary))]">
                {t('lineItems.tax')}
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-[rgb(var(--text-tertiary))]">
                {t('lineItems.total')}
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item) => (
              <tr
                key={item.id}
                className="border-t border-[rgb(var(--border-primary))]"
              >
                <td className="px-4 py-3 text-[rgb(var(--text-primary))]">
                  {item.description}
                  {item.quantity > 1 && (
                    <span className="text-xs text-[rgb(var(--text-tertiary))] ml-1">
                      x{item.quantity}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-[rgb(var(--text-primary))]">
                  {format(item.amount * item.quantity)}
                </td>
                <td className="px-4 py-3 text-right text-[rgb(var(--text-tertiary))]">
                  {item.discount > 0
                    ? `-${format(item.discount)}`
                    : '-'}
                </td>
                <td className="px-4 py-3 text-right text-[rgb(var(--text-tertiary))]">
                  {item.taxAmount > 0
                    ? format(item.taxAmount)
                    : '-'}
                </td>
                <td className="px-4 py-3 text-right font-medium text-[rgb(var(--text-primary))]">
                  {format(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="p-4 rounded-xl bg-[rgb(var(--bg-secondary))]">
        <PaymentSummary invoice={invoice} />
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="p-4 rounded-xl bg-[rgb(var(--bg-secondary))]">
          <p className="text-xs text-[rgb(var(--text-tertiary))] mb-1">Notes</p>
          <p className="text-sm text-[rgb(var(--text-primary))]">{invoice.notes}</p>
        </div>
      )}

      {/* Pay button */}
      {canPay && (
        <div className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-[rgb(var(--bg-primary))]">
          <button
            type="button"
            onClick={onPay}
            className="w-full py-3 rounded-xl bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] font-semibold text-sm
              hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--border-focus))] focus-visible:ring-offset-2"
          >
            {t('actions.payNow')} — {format(invoice.amountDue)}
          </button>
        </div>
      )}
    </div>
  )
}
