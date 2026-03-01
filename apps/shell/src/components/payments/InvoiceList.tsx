/**
 * InvoiceList
 *
 * Table of invoices with status badges, amounts, and due dates.
 * Supports filtering by status (outstanding, paid, overdue, all).
 */

import { useState, useMemo } from 'react'
import type { Invoice, InvoiceStatus } from '@edforge/types'
import { formatNPR } from '@edforge/types'
import { useTranslation } from '@edforge/i18n'
import { DateDisplay } from '@edforge/ui'
import { FileText, Receipt } from 'lucide-react'
import { InvoiceStatusBadge } from './InvoiceStatusBadge'

type StatusFilter = 'outstanding' | 'paid' | 'overdue' | 'all'

const OUTSTANDING_STATUSES: InvoiceStatus[] = ['issued', 'partially_paid']
const OVERDUE_STATUSES: InvoiceStatus[] = ['overdue']
const PAID_STATUSES: InvoiceStatus[] = ['paid']

interface InvoiceListProps {
  invoices: Invoice[]
  isLoading?: boolean
  onSelectInvoice: (invoice: Invoice) => void
  onPayInvoice: (invoice: Invoice) => void
}

export function InvoiceList({
  invoices,
  isLoading,
  onSelectInvoice,
  onPayInvoice,
}: InvoiceListProps) {
  const { t, i18n } = useTranslation('payments')
  const locale = (i18n.language === 'ne' ? 'ne' : 'en') as 'en' | 'ne'
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('outstanding')

  const safeInvoices = Array.isArray(invoices) ? invoices : []

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return safeInvoices
    const targetStatuses =
      statusFilter === 'outstanding'
        ? OUTSTANDING_STATUSES
        : statusFilter === 'overdue'
          ? OVERDUE_STATUSES
          : PAID_STATUSES
    return safeInvoices.filter((inv) => targetStatuses.includes(inv.status))
  }, [safeInvoices, statusFilter])

  const tabs: { key: StatusFilter; label: string; count: number }[] = [
    {
      key: 'outstanding',
      label: t('invoices.outstanding'),
      count: safeInvoices.filter((i) => OUTSTANDING_STATUSES.includes(i.status)).length,
    },
    {
      key: 'overdue',
      label: t('invoices.overdue'),
      count: safeInvoices.filter((i) => OVERDUE_STATUSES.includes(i.status)).length,
    },
    {
      key: 'paid',
      label: t('invoices.paid'),
      count: safeInvoices.filter((i) => PAID_STATUSES.includes(i.status)).length,
    },
    { key: 'all', label: t('invoices.all'), count: safeInvoices.length },
  ]

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-[rgb(var(--bg-tertiary))] animate-pulse"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Status filter tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-[rgb(var(--bg-tertiary))]" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={statusFilter === tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all
              ${
                statusFilter === tab.key
                  ? 'bg-white dark:bg-[rgb(var(--bg-primary))] text-[rgb(var(--text-primary))] shadow-sm'
                  : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]'
              }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 text-[10px] opacity-60">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Invoice cards */}
      {filtered.length === 0 ? (
        <EmptyState filter={statusFilter} t={t} />
      ) : (
        <div className="space-y-3">
          {filtered.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              locale={locale}
              t={t}
              onView={() => onSelectInvoice(invoice)}
              onPay={() => onPayInvoice(invoice)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function InvoiceCard({
  invoice,
  locale,
  t,
  onView,
  onPay,
}: {
  invoice: Invoice
  locale: 'en' | 'ne'
  t: (key: string, opts?: Record<string, unknown>) => string
  onView: () => void
  onPay: () => void
}) {
  const canPay = ['issued', 'partially_paid', 'overdue'].includes(invoice.status)

  return (
    <div className="p-4 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))] hover:border-[rgb(var(--border-secondary))] transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
            <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
              {t('invoices.invoiceNumber')}{invoice.invoiceNumber}
            </span>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">
            {invoice.studentName}
            {invoice.billingPeriod && ` \u2022 ${invoice.billingPeriod}`}
          </p>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
            {t('invoices.dueDate')}: <DateDisplay date={invoice.dueDate} format="short" />
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-[rgb(var(--text-primary))]">
            {formatNPR(invoice.amountDue, { locale })}
          </p>
          {invoice.amountPaid > 0 && invoice.amountDue > 0 && (
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              of {formatNPR(invoice.grandTotal, { locale })}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[rgb(var(--border-primary))]">
        <button
          type="button"
          onClick={onView}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
            text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
        >
          <Receipt className="w-3.5 h-3.5" />
          {t('actions.viewInvoice')}
        </button>
        {canPay && (
          <button
            type="button"
            onClick={onPay}
            className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium
              bg-teal-600 text-white hover:bg-teal-700 transition-colors"
          >
            {t('actions.payNow')}
          </button>
        )}
      </div>
    </div>
  )
}

function EmptyState({
  filter,
  t,
}: {
  filter: StatusFilter
  t: (key: string) => string
}) {
  const isOutstanding = filter === 'outstanding'
  return (
    <div className="text-center py-12">
      <FileText className="w-10 h-10 mx-auto mb-3 text-[rgb(var(--text-tertiary))] opacity-40" />
      <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">
        {isOutstanding ? t('invoices.noOutstanding') : t('invoices.noInvoices')}
      </p>
      <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
        {isOutstanding
          ? t('invoices.noOutstandingDescription')
          : t('invoices.noInvoicesDescription')}
      </p>
    </div>
  )
}
