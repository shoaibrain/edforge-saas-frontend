/**
 * FeeStatStrip — Stat tiles for the fees page
 *
 * Tiles: Invoices paid, Next due, Year progress, Discounts (if available).
 */

import { useMemo } from 'react'
import { useTranslation } from '@edforge/i18n'
import { StatStrip, type StatStripItem } from '@edforge/ui'
import type { Invoice } from '@edforge/types'

export interface FeeStatStripProps {
  invoices?: Invoice[]
  loading?: boolean
  formatCurrency: (amount: number) => string
}

export function FeeStatStrip({ invoices, loading, formatCurrency }: FeeStatStripProps) {
  const { t } = useTranslation('portal')

  const items = useMemo((): StatStripItem[] => {
    if (!invoices) {
      return [
        { label: t('stats.invoicesPaid'), value: '—', loading: true },
        { label: t('stats.nextDue'), value: '—', loading: true },
        { label: t('stats.yearProgress'), value: '—', loading: true },
      ]
    }

    const total = invoices.length
    const paid = invoices.filter((i) => i.status === 'paid').length
    const outstanding = invoices.filter((i) =>
      i.status === 'issued' || i.status === 'partially_paid'
    )

    // Next due: days until nearest unpaid invoice
    let nextDue = '—'
    if (outstanding.length > 0) {
      const now = new Date()
      const nearest = outstanding
        .filter((i) => i.dueDate)
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0]
      if (nearest?.dueDate) {
        const diff = Math.ceil(
          (new Date(nearest.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        nextDue = diff >= 0 ? t('fees.daysUntilDue', { count: diff }) : t('status.overdue')
      }
    }

    // Year progress: paid amount / total amount
    const totalAmount = invoices.reduce((s, i) => s + (i.grandTotal ?? 0), 0)
    const paidAmount = invoices.reduce((s, i) => s + (i.amountPaid ?? 0), 0)
    const progress = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0

    // Discounts applied
    const discounts = invoices.reduce((s, i) => s + (i.discountTotal ?? 0), 0)

    const result: StatStripItem[] = [
      {
        label: t('stats.invoicesPaid'),
        value: `${paid} / ${total}`,
        loading: false,
      },
      {
        label: t('stats.nextDue'),
        value: nextDue,
        loading: false,
      },
      {
        label: t('stats.yearProgress'),
        value: `${progress}%`,
        loading: false,
      },
    ]

    // Only show discounts tile if there are any
    if (discounts > 0) {
      result.push({
        label: 'Discounts',
        value: formatCurrency(discounts),
        loading: false,
      })
    }

    return result
  }, [invoices, t, formatCurrency])

  return (
    <div className="animate-fade-in stagger-1">
      <StatStrip items={loading ? items.map((i) => ({ ...i, loading: true })) : items} />
    </div>
  )
}
