/**
 * CategoryBreakdown — Fee type breakdown card
 *
 * Shows fee types with amounts and percentage bars.
 * Derives from invoice line items (grouped by fee type).
 * ABAC verified: fee-structures endpoint accessible to Parent role (§1.8a).
 */

import { useMemo } from 'react'
import { useTranslation } from '@edforge/i18n'
import { ContentSection, AnimatedProgressBar } from '@edforge/ui'
import type { Invoice } from '@edforge/types'

export interface CategoryBreakdownProps {
  invoices?: Invoice[]
  loading?: boolean
  formatCurrency: (amount: number) => string
  staggerIndex?: number
}

interface FeeCategory {
  name: string
  amount: number
  percentage: number
}

export function CategoryBreakdown({
  invoices,
  loading,
  formatCurrency,
  staggerIndex = 5,
}: CategoryBreakdownProps) {
  const { t } = useTranslation('portal')

  const categories = useMemo((): FeeCategory[] => {
    if (!invoices || invoices.length === 0) return []

    // Aggregate line items by description (fee type name)
    const map = new Map<string, number>()
    for (const inv of invoices) {
      if (!inv.lineItems) continue
      for (const item of inv.lineItems) {
        const name = item.description || 'Other'
        map.set(name, (map.get(name) ?? 0) + ((item.amount ?? 0) * (item.quantity ?? 1)))
      }
    }

    const total = Array.from(map.values()).reduce((s, v) => s + v, 0)
    if (total === 0) return []

    return Array.from(map.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: Math.round((amount / total) * 100),
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [invoices])

  if (loading || categories.length === 0) return null

  return (
    <ContentSection heading={t('fees.categoryBreakdown')} staggerIndex={staggerIndex}>
      <div
        className="rounded-xl border p-4 mt-3 space-y-3"
        style={{
          background: 'var(--v2-bg-surface)',
          borderColor: 'var(--v2-border-default)',
        }}
      >
        {categories.map((cat) => (
          <div key={cat.name}>
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-xs font-medium"
                style={{ color: 'var(--v2-text-secondary)' }}
              >
                {cat.name}
              </span>
              <span
                className="text-xs font-mono tabular-nums"
                style={{ color: 'var(--v2-text-primary)' }}
              >
                {formatCurrency(cat.amount)}
              </span>
            </div>
            <AnimatedProgressBar
              percentage={cat.percentage}
              color="var(--v2-brand-primary)"
              label={cat.name}
            />
          </div>
        ))}
      </div>
    </ContentSection>
  )
}
