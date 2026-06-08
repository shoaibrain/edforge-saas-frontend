/**
 * InvoiceLedger — Invoice list with filter tabs
 *
 * Tabs: Outstanding, Overdue, Paid, All. Each row shows invoice details
 * with status pill and action buttons (view detail, receipt).
 *
 * This component renders in the list view of the FeePaymentPage.
 * Clicking a row triggers the parent's handleSelectInvoice callback,
 * which navigates to the detail view via the existing PageView state machine.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from '@edforge/i18n'
import { ContentSection, FilterTabs, StatusPill, DashedDivider, type FilterTab, type StatusPillVariant } from '@edforge/ui'
import type { Invoice } from '@edforge/types'

export interface InvoiceLedgerProps {
  invoices: Invoice[]
  loading?: boolean
  formatCurrency: (amount: number) => string
  onSelectInvoice: (invoice: Invoice) => void
  onPayInvoice: (invoice: Invoice) => void
  staggerIndex?: number
}

type TabKey = 'outstanding' | 'overdue' | 'paid' | 'all'

function invoiceStatusVariant(inv: Invoice): StatusPillVariant {
  const s = inv.status as string
  if (s === 'paid') return 'paid'
  if (s === 'overdue' || (inv.dueDate && new Date(inv.dueDate) < new Date() && s !== 'paid')) return 'overdue'
  if (s === 'partially_paid') return 'upcoming'
  return 'pending'
}

function invoiceStatusLabel(inv: Invoice): string {
  const s = inv.status as string
  if (s === 'paid') return 'Paid'
  if (s === 'overdue' || (inv.dueDate && new Date(inv.dueDate) < new Date() && s !== 'paid')) return 'Overdue'
  if (s === 'partially_paid') return 'Partial'
  return 'Outstanding'
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function InvoiceLedger({
  invoices,
  loading,
  formatCurrency,
  onSelectInvoice,
  onPayInvoice,
  staggerIndex = 3,
}: InvoiceLedgerProps) {
  const { t } = useTranslation('portal')
  const [activeTab, setActiveTab] = useState<TabKey>('all')

  const now = new Date()

  const counts = useMemo(() => {
    const outstanding = invoices.filter((i) => i.status === 'issued' || i.status === 'partially_paid').length
    const overdue = invoices.filter((i) =>
      (i.status === 'issued' || i.status === 'partially_paid') &&
      i.dueDate && new Date(i.dueDate) < now
    ).length
    const paid = invoices.filter((i) => i.status === 'paid').length
    return { outstanding, overdue, paid, all: invoices.length }
  }, [invoices])

  const tabs: FilterTab[] = [
    { key: 'outstanding', label: t('status.outstanding'), count: counts.outstanding },
    { key: 'overdue', label: t('status.overdue'), count: counts.overdue },
    { key: 'paid', label: t('status.paid'), count: counts.paid },
    { key: 'all', label: t('status.all'), count: counts.all },
  ]

  const filtered = useMemo(() => {
    switch (activeTab) {
      case 'outstanding':
        return invoices.filter((i) => i.status === 'issued' || i.status === 'partially_paid')
      case 'overdue':
        return invoices.filter((i) =>
          (i.status === 'issued' || i.status === 'partially_paid') &&
          i.dueDate && new Date(i.dueDate) < now
        )
      case 'paid':
        return invoices.filter((i) => i.status === 'paid')
      default:
        return invoices
    }
  }, [invoices, activeTab])

  if (loading) {
    return (
      <ContentSection heading={t('fees.invoices')} staggerIndex={staggerIndex}>
        <div className="space-y-2 mt-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
          ))}
        </div>
      </ContentSection>
    )
  }

  return (
    <ContentSection heading={t('fees.invoices')} staggerIndex={staggerIndex}>
      <div className="mt-3 mb-4">
        <FilterTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(key) => setActiveTab(key as TabKey)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm py-6" style={{ color: 'var(--v2-text-muted)' }}>
          {t('empty.noData')}
        </p>
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            background: 'var(--v2-bg-surface)',
            borderColor: 'var(--v2-border-default)',
          }}
        >
          {filtered.map((inv, i) => (
            <div key={inv.id}>
              {i > 0 && <DashedDivider className="mx-4 my-0" />}
              <button
                onClick={() => onSelectInvoice(inv)}
                className="w-full text-left flex items-center gap-3 px-4 py-3 transition-colors"
                style={{ background: 'transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--v2-surface-interactive-hover)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                {/* Invoice info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--v2-text-primary)' }}
                  >
                    {inv.invoiceNumber}
                    {inv.billingPeriod && (
                      <span style={{ color: 'var(--v2-text-hint)' }}> — {inv.billingPeriod}</span>
                    )}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--v2-text-hint)' }}
                  >
                    {formatDate(inv.dueDate)}
                  </p>
                </div>

                {/* Amount */}
                <span
                  className="text-sm font-semibold font-mono tabular-nums shrink-0"
                  style={{ color: 'var(--v2-text-primary)' }}
                >
                  {formatCurrency(inv.grandTotal ?? 0)}
                </span>

                {/* Status pill */}
                <StatusPill
                  variant={invoiceStatusVariant(inv)}
                  label={invoiceStatusLabel(inv)}
                />

                {/* Pay button (only for unpaid invoices) */}
                {inv.status !== 'paid' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onPayInvoice(inv)
                    }}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg shrink-0 transition-colors"
                    style={{
                      background: 'var(--v2-brand-primary)',
                      color: '#fff',
                    }}
                  >
                    Pay
                  </button>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </ContentSection>
  )
}
