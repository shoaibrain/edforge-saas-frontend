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

/**
 * State styles matching prototype billing-card (parent-home.html):
 *   - Current: sage gradient background, sage left border accent
 *   - Due: neutral card, default border
 *   - Overdue: terracotta gradient, terracotta left border
 */
const STATE_STYLES: Record<BillingState, {
  bg: string; border: string; borderLeft: string; text: string; eyebrowColor: string
}> = {
  current: {
    bg: 'linear-gradient(135deg, rgb(var(--state-success-bg)) 0%, color-mix(in srgb, #1D9E75 4%, rgb(var(--background-secondary))) 100%)',
    border: '#1D9E75',
    borderLeft: '6px solid #1D9E75',
    text: '#1D9E75',
    eyebrowColor: '#1D9E75',
  },
  due: {
    bg: 'rgb(var(--background-secondary))',
    border: 'rgb(var(--border-primary) / 0.35)',
    borderLeft: '6px solid rgb(var(--state-warning-fg))',
    text: 'rgb(var(--text-primary))',
    eyebrowColor: 'rgb(var(--state-warning-fg))',
  },
  overdue: {
    bg: 'linear-gradient(135deg, rgb(var(--state-danger-bg)) 0%, color-mix(in srgb, rgb(var(--state-danger-fg)) 4%, rgb(var(--background-secondary))) 100%)',
    border: 'rgb(var(--state-danger-fg))',
    borderLeft: '6px solid rgb(var(--state-danger-fg))',
    text: 'rgb(var(--state-danger-fg))',
    eyebrowColor: 'rgb(var(--state-danger-fg))',
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
        className="block border transition-all duration-200 motion-safe:hover:-translate-y-0.5"
        style={{
          background: styles.bg,
          borderColor: styles.border,
          borderLeft: styles.borderLeft,
          borderRadius: 22,
          padding: '26px 30px',
          boxShadow: 'var(--elevation-raised)',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
          gap: 24,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'var(--elevation-overlay)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'var(--elevation-raised)'
        }}
      >
        <div>
          <p
            className="font-mono uppercase"
            style={{ fontSize: 10, letterSpacing: '0.12em', color: styles.eyebrowColor, marginBottom: 6 }}
          >
            Billing
          </p>
          <p
            className="font-display"
            style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.01em', color: styles.text }}
          >
            {state === 'current' && t('fees.allFeesCurrent')}
            {state === 'due' && `${t('stats.balanceDue')}: ${formatCurrency(totalDue)}`}
            {state === 'overdue' && `${t('status.overdue')}: ${formatCurrency(totalDue)}`}
          </p>
        </div>
        <span
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: '0.1em',
            color: 'rgb(var(--text-tertiary))',
          }}
        >
          {t('fees.invoices')} →
        </span>
      </a>
    </ContentSection>
  )
}
