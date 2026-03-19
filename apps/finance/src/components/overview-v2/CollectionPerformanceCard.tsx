/**
 * CollectionPerformanceCard — V2
 *
 * 3 animated progress bars (collected, outstanding, overdue)
 * plus fee type breakdown with per-type progress bars.
 */

import { AnimatedProgressBar } from '@edforge/ui'
import { formatNPRShort, formatFeeType } from '@edforge/types'

const FEE_COLORS = ['#1D9E75', '#378ADD', '#7F77DD', '#EF9F27', '#D85A30']

interface CollectionPerformanceCardProps {
  totalInvoiced: number
  totalCollected: number
  outstanding: number
  overdue: number
  collectionRate: number
  byFeeType: Array<{
    feeType: string
    invoiceCount: number
    totalAmount: number
    collectedAmount: number
  }>
  isLoading: boolean
}

function CardSkeleton() {
  return (
    <div className="space-y-4 py-2">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <div className="flex justify-between mb-1.5">
            <div className="h-3 w-16 rounded v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
            <div className="h-3 w-24 rounded v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
          </div>
          <div className="h-[3px] rounded-sm v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
        </div>
      ))}
    </div>
  )
}

export function CollectionPerformanceCard({
  totalInvoiced,
  totalCollected,
  outstanding,
  overdue,
  collectionRate,
  byFeeType,
  isLoading,
}: CollectionPerformanceCardProps) {
  const total = totalCollected + outstanding
  const collectedPct = total > 0 ? (totalCollected / total) * 100 : 0
  const nonOverdueOutstanding = outstanding - overdue
  const outstandingPct = total > 0 ? (nonOverdueOutstanding / total) * 100 : 0
  const overduePct = total > 0 ? (overdue / total) * 100 : 0

  return (
    <div
      className="rounded-xl border flex flex-col"
      style={{
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
        padding: 18,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-medium" style={{ color: 'var(--v2-text-secondary)' }}>
          Collection performance
        </h3>
        <span className="text-[11px]" style={{ color: 'var(--v2-text-faint)' }}>
          {collectionRate.toFixed(1)}% collected
        </span>
      </div>

      {/* Content */}
      {isLoading ? (
        <CardSkeleton />
      ) : (
        <div className="flex flex-col gap-[11px]">
          {/* Collected */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: 'var(--v2-text-hint)' }}>Collected</span>
              <span className="text-xs font-medium" style={{ color: 'var(--v2-brand-primary)' }}>
                {formatNPRShort(totalCollected)}
              </span>
            </div>
            <AnimatedProgressBar percentage={collectedPct} color="var(--v2-brand-primary)" label={`Collected: ${formatNPRShort(totalCollected)}`} />
          </div>

          {/* Outstanding (non-overdue) — hide when negligible */}
          {nonOverdueOutstanding >= 1000 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: 'var(--v2-text-hint)' }}>Outstanding</span>
                <span className="text-xs font-medium" style={{ color: 'var(--v2-warning)' }}>
                  {formatNPRShort(nonOverdueOutstanding)}
                </span>
              </div>
              <AnimatedProgressBar percentage={outstandingPct} color="var(--v2-warning)" label={`Outstanding: ${formatNPRShort(nonOverdueOutstanding)}`} />
            </div>
          )}

          {/* Overdue */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: 'var(--v2-text-hint)' }}>Overdue</span>
              <span className="text-xs font-medium" style={{ color: 'var(--v2-danger)' }}>
                {formatNPRShort(overdue)}
              </span>
            </div>
            <AnimatedProgressBar percentage={overduePct} color="var(--v2-danger)" label={`Overdue: ${formatNPRShort(overdue)}`} />
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--v2-border-default)', margin: '2px 0' }} />

          {/* Fee type breakdown */}
          {byFeeType.length > 0 && (
            <div className="space-y-3">
              {byFeeType.map((fee, idx) => {
                const pct = fee.totalAmount > 0 ? (fee.collectedAmount / fee.totalAmount) * 100 : 0
                const color = FEE_COLORS[idx % FEE_COLORS.length]
                return (
                  <div
                    key={fee.feeType}
                    className="rounded-lg p-2.5"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--v2-border-default)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-medium" style={{ color: 'var(--v2-text-secondary)' }}>
                        {formatFeeType(fee.feeType)}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--v2-text-faint)' }}>
                        {fee.invoiceCount} invoice{fee.invoiceCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <AnimatedProgressBar percentage={pct} color={color} label={`${formatFeeType(fee.feeType)}: ${pct.toFixed(0)}% collected`} height={4} />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px]" style={{ color }}>
                        {formatNPRShort(fee.collectedAmount)} collected
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--v2-text-faint)' }}>
                        of {formatNPRShort(fee.totalAmount)} invoiced
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Total invoiced */}
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-[11px]" style={{ color: 'var(--v2-text-faint)' }}>
              Total invoiced this year
            </span>
            <span className="text-[13px] font-semibold" style={{ color: 'var(--v2-danger)' }}>
              {formatNPRShort(totalInvoiced)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
