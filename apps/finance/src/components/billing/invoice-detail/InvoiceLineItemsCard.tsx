/**
 * Line-items card: 5-column table (description / amount / tax / discount /
 * total, zeros dimmed to an em dash) + right-aligned totals stack with the
 * highlighted amount-due row (warning when owing, danger when late,
 * neutral when settled; hidden for cancelled invoices).
 */

import { List } from 'lucide-react'
import { cn } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import type { Invoice } from '@edforge/types'
import { overdueDaysOf } from './invoice-detail-utils'

export interface InvoiceLineItemsCardProps {
  invoice: Invoice
  format: (amount: number) => string
}

export function InvoiceLineItemsCard({ invoice, format }: InvoiceLineItemsCardProps) {
  const { t } = useTranslation('payments')
  const lineItems = invoice.lineItems ?? []
  const late = overdueDaysOf(invoice) > 0
  const amountDue = invoice.amountDue ?? 0
  const amountPaid = invoice.amountPaid ?? 0

  const dim = (n: number) =>
    n ? (
      <span className="font-mono text-xs tabular-nums">{format(n)}</span>
    ) : (
      <span className="text-[rgb(var(--text-disabled))]">—</span>
    )

  const headerCell =
    'px-4 py-2.5 text-start text-2xs font-medium uppercase tracking-wider text-[rgb(var(--text-tertiary))] bg-[rgb(var(--background-secondary))] border-b border-[rgb(var(--border-primary))] whitespace-nowrap'

  return (
    <section className="overflow-hidden rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))]">
      <div className="flex items-center gap-2 border-b border-[rgb(var(--border-primary))] px-4 py-3">
        <List className="h-4 w-4 text-[rgb(var(--text-tertiary))]" />
        <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
          {t('invoiceDetail.sections.lineItems')}
        </h2>
        <span className="ms-auto font-mono text-xs text-[rgb(var(--text-tertiary))]">
          {lineItems.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className={headerCell}>{t('lineItems.description')}</th>
              <th className={cn(headerCell, 'text-end')}>{t('lineItems.amount')}</th>
              <th className={cn(headerCell, 'text-end')}>{t('lineItems.tax')}</th>
              <th className={cn(headerCell, 'text-end')}>{t('lineItems.discount')}</th>
              <th className={cn(headerCell, 'text-end')}>{t('lineItems.total')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--border-primary))]">
            {lineItems.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-[rgb(var(--text-tertiary))]"
                >
                  {t('invoiceDetail.empty.noLineItems')}
                </td>
              </tr>
            ) : (
              lineItems.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="px-4 py-3 text-sm">
                    <span className="block font-medium text-[rgb(var(--text-primary))]">
                      {item.description}
                    </span>
                    {item.quantity > 1 && (
                      <span className="mt-0.5 block text-xs text-[rgb(var(--text-tertiary))]">
                        {t('invoiceDetail.lineItems.qtyAt', {
                          quantity: item.quantity,
                          amount: format(item.amount),
                        })}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-end text-sm text-[rgb(var(--text-secondary))]">
                    <span className="font-mono text-xs tabular-nums">
                      {format(item.amount * item.quantity)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end text-sm text-[rgb(var(--text-secondary))]">
                    {dim(item.taxAmount || 0)}
                  </td>
                  <td className="px-4 py-3 text-end text-sm text-[rgb(var(--text-secondary))]">
                    {dim(item.discount || 0)}
                  </td>
                  <td className="px-4 py-3 text-end text-sm font-semibold text-[rgb(var(--text-primary))]">
                    <span className="font-mono text-xs tabular-nums">{format(item.total)}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Totals stack */}
      <div className="flex justify-end px-4 pb-4 pt-3.5">
        <div className="w-80 max-w-full space-y-1">
          <TotalRow label={t('summary.subtotal')} value={format(invoice.subtotal ?? 0)} />
          {(invoice.discountTotal ?? 0) > 0 && (
            <TotalRow
              label={t('summary.discountTotal')}
              value={`− ${format(invoice.discountTotal)}`}
            />
          )}
          {(invoice.taxTotal ?? 0) > 0 && (
            <TotalRow label={t('summary.taxTotal')} value={format(invoice.taxTotal)} />
          )}
          <div className="flex items-baseline justify-between border-t border-[rgb(var(--border-secondary))] pt-2 text-sm font-semibold text-[rgb(var(--text-primary))]">
            <span>{t('summary.grandTotal')}</span>
            <span className="font-mono tabular-nums">{format(invoice.grandTotal)}</span>
          </div>
          {amountPaid > 0 && (
            <div className="flex items-baseline justify-between text-sm text-[rgb(var(--text-secondary))]">
              <span>{t('summary.amountPaid')}</span>
              <span className="font-mono text-xs tabular-nums text-[rgb(var(--state-success-fg))]">
                − {format(amountPaid)}
              </span>
            </div>
          )}
          {invoice.status !== 'cancelled' && (
            <div
              className={cn(
                'mt-1.5 flex items-baseline justify-between rounded-lg border px-3 py-2 text-sm font-semibold',
                amountDue > 0
                  ? late
                    ? 'border-[rgb(var(--state-danger-border)/0.3)] bg-[rgb(var(--state-danger-bg)/0.45)] text-[rgb(var(--text-primary))]'
                    : 'border-[rgb(var(--state-warning-border)/0.3)] bg-[rgb(var(--state-warning-bg)/0.45)] text-[rgb(var(--text-primary))]'
                  : 'border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-primary))]'
              )}
            >
              <span>{t('summary.amountDue')}</span>
              <span
                className={cn(
                  'font-mono text-base tabular-nums',
                  amountDue > 0 &&
                    (late
                      ? 'text-[rgb(var(--state-danger-fg))]'
                      : 'text-[rgb(var(--state-warning-fg))]')
                )}
              >
                {format(amountDue)}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-sm text-[rgb(var(--text-secondary))]">
      <span>{label}</span>
      <span className="font-mono text-xs tabular-nums text-[rgb(var(--text-primary))]">
        {value}
      </span>
    </div>
  )
}
