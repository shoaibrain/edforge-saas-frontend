/**
 * FinanceSummaryCard — V2
 *
 * Financial overview with 3 animated progress bars (collected, outstanding, overdue),
 * fee type breakdown, total invoiced footer, and V2 token-based styling.
 */

import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { formatNPRShort, formatFeeType } from '@edforge/types'

interface FinanceSummaryCardProps {
  totalInvoiced: number
  totalCollected: number
  outstanding: number
  overdue: number
  collectionRate: number
  byFeeType?: Record<string, { totalAmount: number; collectedAmount: number; invoiceCount: number }>
  isLoading: boolean
  isError: boolean
  onRetry?: () => void
}

function FinanceSkeleton() {
  return (
    <div className="space-y-4 py-2">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <div className="flex justify-between mb-1.5">
            <div
              className="h-3 w-16 rounded v2-skeleton-pulse"
              style={{ background: 'var(--v2-bg-elevated)' }}
            />
            <div
              className="h-3 w-24 rounded v2-skeleton-pulse"
              style={{ background: 'var(--v2-bg-elevated)' }}
            />
          </div>
          <div
            className="h-[3px] rounded-sm v2-skeleton-pulse"
            style={{ background: 'var(--v2-bg-elevated)' }}
          />
        </div>
      ))}
    </div>
  )
}

function AnimatedBar({
  percentage,
  color,
  label,
}: {
  percentage: number
  color: string
  label: string
}) {
  const [width, setWidth] = useState(0)
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (prefersReducedMotion) {
      setWidth(percentage)
      return
    }
    const timer = setTimeout(() => setWidth(percentage), 50)
    return () => clearTimeout(timer)
  }, [percentage, prefersReducedMotion])

  return (
    <div
      className="h-[3px] rounded-sm overflow-hidden"
      style={{ background: 'var(--v2-border-default)' }}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className="h-full rounded-sm"
        style={{
          width: `${width}%`,
          background: color,
          transition: prefersReducedMotion ? 'none' : 'width 600ms ease-out',
        }}
      />
    </div>
  )
}

// formatFeeTypeName removed — using shared formatFeeType from @edforge/types

export function FinanceSummaryCard({
  totalInvoiced,
  totalCollected,
  outstanding,
  overdue,
  collectionRate,
  byFeeType,
  isLoading,
  isError,
  onRetry,
}: FinanceSummaryCardProps) {
  const total = totalCollected + outstanding
  const collectedPct = total > 0 ? (totalCollected / total) * 100 : 0
  const outstandingPct = total > 0 ? (outstanding / total) * 100 : 0
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
        <h3
          className="text-[13px] font-medium"
          style={{ color: 'var(--v2-text-secondary)' }}
        >
          Financial overview
        </h3>
        {!isLoading && !isError && (
          <span className="text-[11px]" style={{ color: 'var(--v2-text-faint)' }}>
            {collectionRate.toFixed(1)}% collected
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <FinanceSkeleton />
        ) : isError ? (
          <div
            className="flex flex-col items-center justify-center gap-2 py-8"
            style={{ color: 'var(--v2-text-hint)' }}
          >
            <p className="text-sm">Unable to load financial data</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-xs font-medium px-3 py-1 rounded-md"
                style={{
                  background: 'var(--v2-warning-bg)',
                  color: 'var(--v2-warning)',
                  border: '1px solid var(--v2-warning-border)',
                }}
              >
                Retry
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-[11px]">
            {/* Collected bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: 'var(--v2-text-hint)' }}>
                  Collected
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--v2-brand-primary)' }}
                >
                  {formatNPRShort(totalCollected)}
                </span>
              </div>
              <AnimatedBar
                percentage={collectedPct}
                color="var(--v2-brand-primary)"
                label={`Collected: ${formatNPRShort(totalCollected)}`}
              />
            </div>

            {/* Outstanding bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: 'var(--v2-text-hint)' }}>
                  Outstanding
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--v2-warning)' }}
                >
                  {formatNPRShort(outstanding)}
                </span>
              </div>
              <AnimatedBar
                percentage={outstandingPct}
                color="var(--v2-warning)"
                label={`Outstanding: ${formatNPRShort(outstanding)}`}
              />
            </div>

            {/* Overdue bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: 'var(--v2-text-hint)' }}>
                  Overdue
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--v2-danger)' }}
                >
                  {formatNPRShort(overdue)}
                </span>
              </div>
              <AnimatedBar
                percentage={overduePct}
                color="var(--v2-danger)"
                label={`Overdue: ${formatNPRShort(overdue)}`}
              />
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--v2-border-default)', margin: '2px 0' }} />

            {/* Fee type breakdown */}
            {byFeeType && Object.keys(byFeeType).length > 0 && (
              <>
                {Object.entries(byFeeType).map(([type, breakdown]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-[11px]" style={{ color: 'var(--v2-text-faint)' }}>
                      {formatFeeType(type)}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--v2-text-hint)' }}>
                      {formatNPRShort(breakdown.totalAmount)} invoiced
                    </span>
                  </div>
                ))}
                <div
                  style={{ height: 1, background: 'var(--v2-border-default)', margin: '2px 0' }}
                />
              </>
            )}

            {/* Total invoiced */}
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-[11px]" style={{ color: 'var(--v2-text-faint)' }}>
                Total invoiced this year
              </span>
              <span
                className="text-[13px] font-semibold"
                style={{ color: 'var(--v2-danger)' }}
              >
                {formatNPRShort(totalInvoiced)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer link */}
      <div
        className="pt-3 mt-3"
        style={{ borderTop: '1px solid var(--v2-border-default)' }}
      >
        <Link
          to="/finance/$"
          params={{ _splat: '' }}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium transition-opacity hover:opacity-80"
          style={{ color: 'var(--v2-brand-primary)' }}
        >
          View Finance
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
