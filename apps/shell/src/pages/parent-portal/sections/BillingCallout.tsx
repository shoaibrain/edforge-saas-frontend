/**
 * BillingCallout — Parent Home billing summary card
 *
 * Three states: all current (sage), balance due (neutral), overdue (terracotta).
 * Links to /parent-portal/fees.
 */

import { useMemo } from 'react'
import { useTranslation } from '@edforge/i18n'
import { ContentSection } from '@edforge/ui'

export interface BillingCalloutProps {
  invoices?: Array<{
    status: string
    totalAmount?: number
    amountDue?: number
    dueDate?: string
  }>
  loading?: boolean
  staggerIndex?: number
  /** Currency formatting function from useCurrency */
  formatCurrency?: (amount: number) => string
}

type BillingState = 'current' | 'due' | 'overdue'

const STATE_STYLES: Record<BillingState, { bg: string; border: string; text: string }> = {
  current: {
    bg: 'var(--v2-success-bg)',
    border: 'var(--v2-success-border)',
    text: 'var(--v2-brand-primary)',
  },
  due: {
    bg: 'var(--v2-bg-surface)',
    border: 'var(--v2-border-default)',
    text: 'var(--v2-text-primary)',
  },
  overdue: {
    bg: 'var(--v2-danger-bg)',
    border: 'var(--v2-danger-border)',
    text: 'var(--v2-danger)',
  },
}

export function BillingCallout({
  invoices,
  loading,
  staggerIndex = 4,
  formatCurrency = (n) => `$${n.toFixed(2)}`,
}: BillingCalloutProps) {
  const { t } = useTranslation('portal')

  const { state, totalDue } = useMemo(() => {
    if (!invoices || invoices.length === 0) {
      return { state: 'current' as BillingState, totalDue: 0 }
    }

    const now = new Date()
    let due = 0
    let hasOverdue = false

    for (const inv of invoices) {
      if (inv.status === 'issued' || inv.status === 'partially_paid') {
        const amount = inv.amountDue ?? inv.totalAmount ?? 0
        due += amount
        if (inv.dueDate && new Date(inv.dueDate) < now) {
          hasOverdue = true
        }
      }
    }

    if (due === 0) return { state: 'current' as BillingState, totalDue: 0 }
    if (hasOverdue) return { state: 'overdue' as BillingState, totalDue: due }
    return { state: 'due' as BillingState, totalDue: due }
  }, [invoices])

  if (loading) return null

  const styles = STATE_STYLES[state]

  return (
    <ContentSection staggerIndex={staggerIndex}>
      <a
        href="/parent-portal/fees"
        className="block rounded-xl border p-4 transition-all hover:shadow-sm"
        style={{
          background: styles.bg,
          borderColor: styles.border,
        }}
      >
        <p
          className="text-sm font-medium"
          style={{ color: styles.text }}
        >
          {state === 'current' && t('fees.allFeesCurrent')}
          {state === 'due' && `${t('stats.balanceDue')}: ${formatCurrency(totalDue)}`}
          {state === 'overdue' && `${t('status.overdue')}: ${formatCurrency(totalDue)}`}
        </p>
        <p
          className="text-[11px] mt-0.5"
          style={{ color: 'var(--v2-text-muted)' }}
        >
          {t('fees.invoices')} →
        </p>
      </a>
    </ContentSection>
  )
}
