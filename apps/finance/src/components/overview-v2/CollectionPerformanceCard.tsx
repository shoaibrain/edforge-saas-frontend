/**
 * CollectionPerformanceCard — V2
 *
 * Collected/outstanding/overdue progress bars at the top,
 * compact fee type breakdown rows below.
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { AnimatedProgressBar } from '@edforge/ui'
import { formatFeeType } from '@edforge/types'
import { useCurrency } from '@edforge/types/use-currency'
import { useFinanceSettings } from '../../layouts/FinanceLayout'

const FEE_COLORS = ['#1D9E75', '#378ADD', '#7F77DD', '#EF9F27', '#D85A30']
const MAX_VISIBLE_FEE_TYPES = 5

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
            <div className="h-3 w-16 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
            <div className="h-3 w-24 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
          </div>
          <div className="h-1 rounded-sm v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
        </div>
      ))}
      {/* Fee type skeleton rows */}
      <div className="h-px bg-[rgb(var(--background-tertiary))]" />
      {[1, 2, 3].map((i) => (
        <div key={`ft-${i}`} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
          <div className="h-3 w-14 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
          <div className="flex-1 h-1 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
          <div className="h-3 w-20 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
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
  const settings = useFinanceSettings()
  const { formatShort } = useCurrency(settings)
  const [showAll, setShowAll] = useState(false)

  // Use totalInvoiced as denominator for accurate percentages
  const denom = totalInvoiced > 0 ? totalInvoiced : 1
  const collectedPct = Math.min((totalCollected / denom) * 100, 100)
  const nonOverdueOutstanding = outstanding - overdue
  const outstandingPct = Math.min((nonOverdueOutstanding / denom) * 100, 100)
  const overduePct = Math.min((overdue / denom) * 100, 100)

  // Fee type display — cap at MAX_VISIBLE_FEE_TYPES unless expanded
  const hasOverflow = byFeeType.length > MAX_VISIBLE_FEE_TYPES
  const visibleFeeTypes = showAll ? byFeeType : byFeeType.slice(0, MAX_VISIBLE_FEE_TYPES)

  return (
    <div
      // allow-presentation-style: card padding (18px) is off the 4px scale
      className="rounded-xl border flex flex-col bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)]"
      style={{ padding: 18 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[rgb(var(--text-secondary))]">
          Collection performance
        </h3>
        <span className="text-xs text-[rgb(var(--text-disabled))]">
          {collectionRate.toFixed(1)}% collected
        </span>
      </div>

      {/* Content */}
      {isLoading ? (
        <CardSkeleton />
      ) : (
        <div className="flex flex-col gap-3">
          {/* Collected */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[rgb(var(--text-tertiary))]">Collected</span>
              <span className="text-xs font-medium text-[#1D9E75]">
                {formatShort(totalCollected)}
              </span>
            </div>
            <AnimatedProgressBar percentage={collectedPct} color="#1D9E75" label={`Collected: ${formatShort(totalCollected)}`} />
          </div>

          {/* Outstanding (non-overdue) — hide when negligible */}
          {nonOverdueOutstanding >= 1000 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[rgb(var(--text-tertiary))]">Outstanding</span>
                <span className="text-xs font-medium text-[rgb(var(--state-warning-fg))]">
                  {formatShort(nonOverdueOutstanding)}
                </span>
              </div>
              <AnimatedProgressBar percentage={outstandingPct} color="rgb(var(--state-warning-fg))" label={`Outstanding: ${formatShort(nonOverdueOutstanding)}`} />
            </div>
          )}

          {/* Overdue — hide when 0 */}
          {overdue > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[rgb(var(--text-tertiary))]">Overdue</span>
                <span className="text-xs font-medium text-[rgb(var(--state-danger-fg))]">
                  {formatShort(overdue)}
                </span>
              </div>
              <AnimatedProgressBar percentage={overduePct} color="rgb(var(--state-danger-fg))" label={`Overdue: ${formatShort(overdue)}`} />
            </div>
          )}

          {/* Divider + Fee type section */}
          {byFeeType.length > 0 && (
            <>
              <div className="h-px bg-[rgb(var(--border-primary)/0.35)] my-0.5" />

              {/* Section header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[rgb(var(--text-secondary))]">
                  By fee type
                </span>
                <span className="text-xs tabular-nums text-[rgb(var(--text-disabled))]">
                  {byFeeType.length} type{byFeeType.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Compact fee type rows */}
              <div className="space-y-2.5">
                {visibleFeeTypes.map((fee, idx) => {
                  const pct = fee.totalAmount > 0 ? Math.min((fee.collectedAmount / fee.totalAmount) * 100, 100) : 0
                  const color = FEE_COLORS[idx % FEE_COLORS.length]
                  return (
                    <div key={fee.feeType}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div
                            // allow-presentation-style: per-fee-type legend dot color
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: color }}
                          />
                          <span className="text-xs font-medium truncate text-[rgb(var(--text-secondary))]" style={{ maxWidth: 120 }}>
                            {formatFeeType(fee.feeType)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            // allow-presentation-style: per-fee-type collected amount color
                            className="text-xs tabular-nums"
                            style={{ color }}
                          >
                            {formatShort(fee.collectedAmount)}
                          </span>
                          <span className="text-xs text-[rgb(var(--text-disabled))]">/</span>
                          <span className="text-xs tabular-nums text-[rgb(var(--text-disabled))]">
                            {formatShort(fee.totalAmount)}
                          </span>
                          <span className="text-xs tabular-nums text-[rgb(var(--text-disabled))]">
                            ({fee.invoiceCount})
                          </span>
                        </div>
                      </div>
                      <AnimatedProgressBar percentage={pct} color={color} label={`${formatFeeType(fee.feeType)}: ${pct.toFixed(0)}% collected`} height={4} />
                    </div>
                  )
                })}
              </div>

              {/* Show all / Show less toggle */}
              {hasOverflow && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="inline-flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80 self-start text-[#1D9E75]"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Show all ({byFeeType.length})
                    </>
                  )}
                </button>
              )}
            </>
          )}

          {/* Total invoiced */}
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-xs text-[rgb(var(--text-disabled))]">
              Total invoiced this year
            </span>
            <span className="text-sm font-semibold text-[rgb(var(--text-primary))]">
              {formatShort(totalInvoiced)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
