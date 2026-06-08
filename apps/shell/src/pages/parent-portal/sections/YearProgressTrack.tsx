/**
 * YearProgressTrack — Installment node visualization
 *
 * Horizontal progress track: one node per invoice, chronologically ordered.
 * Paid = checkmark (sage). Upcoming = number (muted). Overdue = exclamation (terracotta).
 * Pure CSS, no chart library.
 */

import { useMemo } from 'react'
import { useTranslation } from '@edforge/i18n'
import { ContentSection } from '@edforge/ui'
import { Check, AlertTriangle } from 'lucide-react'
import type { Invoice } from '@edforge/types'

export interface YearProgressTrackProps {
  invoices?: Invoice[]
  loading?: boolean
  formatCurrency: (amount: number) => string
  staggerIndex?: number
}

type NodeStatus = 'paid' | 'upcoming' | 'overdue'

interface ProgressNode {
  id: string
  label: string
  amount: number
  status: NodeStatus
  dueDate?: string
}

const NODE_STYLES: Record<NodeStatus, { bg: string; border: string; text: string; icon: string }> = {
  paid: {
    bg: 'var(--v2-success-bg)',
    border: 'var(--v2-brand-primary)',
    text: 'var(--v2-brand-primary)',
    icon: 'var(--v2-brand-primary)',
  },
  upcoming: {
    bg: 'var(--v2-bg-surface)',
    border: 'var(--v2-border-strong)',
    text: 'var(--v2-text-muted)',
    icon: 'var(--v2-text-muted)',
  },
  overdue: {
    bg: 'var(--v2-danger-bg)',
    border: 'var(--v2-danger)',
    text: 'var(--v2-danger)',
    icon: 'var(--v2-danger)',
  },
}

export function YearProgressTrack({
  invoices,
  loading,
  formatCurrency,
  staggerIndex = 2,
}: YearProgressTrackProps) {
  const { t } = useTranslation('portal')

  const { nodes, totalAmount } = useMemo(() => {
    if (!invoices || invoices.length === 0) return { nodes: [], totalAmount: 0 }

    const now = new Date()
    const sorted = [...invoices].sort((a, b) =>
      (a.dueDate ?? '').localeCompare(b.dueDate ?? '')
    )

    const total = sorted.reduce((s, i) => s + (i.grandTotal ?? 0), 0)

    const result: ProgressNode[] = sorted.map((inv, i) => {
      let status: NodeStatus = 'upcoming'
      if (inv.status === 'paid') {
        status = 'paid'
      } else if (inv.dueDate && new Date(inv.dueDate) < now) {
        status = 'overdue'
      }

      return {
        id: inv.id,
        label: inv.billingPeriod ?? `#${i + 1}`,
        amount: inv.grandTotal ?? 0,
        status,
        dueDate: inv.dueDate,
      }
    })

    return { nodes: result, totalAmount: total }
  }, [invoices])

  if (loading || nodes.length === 0) return null

  return (
    <ContentSection
      eyebrow={t('fees.yearOnOneLine')}
      staggerIndex={staggerIndex}
    >
      <p
        className="text-sm font-medium mb-4"
        style={{ color: 'var(--v2-text-secondary)' }}
      >
        {formatCurrency(totalAmount)} total
      </p>

      {/* Progress track */}
      <div className="flex items-center gap-0 overflow-x-auto pb-2">
        {nodes.map((node, i) => {
          const styles = NODE_STYLES[node.status]
          return (
            <div key={node.id} className="flex items-center shrink-0">
              {/* Connecting line (before node, except first) */}
              {i > 0 && (
                <div
                  className="w-8 sm:w-12 h-0.5"
                  style={{
                    background: node.status === 'paid' || nodes[i - 1].status === 'paid'
                      ? 'var(--v2-brand-primary)'
                      : 'var(--v2-border-default)',
                  }}
                />
              )}

              {/* Node */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
                  style={{
                    background: styles.bg,
                    borderColor: styles.border,
                  }}
                >
                  {node.status === 'paid' ? (
                    <Check className="w-3.5 h-3.5" style={{ color: styles.icon }} />
                  ) : node.status === 'overdue' ? (
                    <AlertTriangle className="w-3 h-3" style={{ color: styles.icon }} />
                  ) : (
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{ color: styles.text }}
                    >
                      {i + 1}
                    </span>
                  )}
                </div>
                <span
                  className="text-xs font-mono tabular-nums text-center max-w-16 truncate"
                  style={{ color: styles.text }}
                >
                  {node.label}
                </span>
                <span
                  className="text-xs font-mono tabular-nums"
                  style={{ color: 'var(--v2-text-hint)' }}
                >
                  {formatCurrency(node.amount)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </ContentSection>
  )
}
