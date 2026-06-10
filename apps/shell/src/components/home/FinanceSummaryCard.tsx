/**
 * FinanceSummaryCard — V2
 *
 * Financial overview with 3 animated progress bars (collected, outstanding, overdue),
 * fee type breakdown, total invoiced footer, and V2 token-based styling.
 */

import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { formatFeeType } from '@edforge/types'
import { useCurrency } from '@edforge/types/use-currency'
import { useSettings } from '../../lib/shell-context'
import { useTranslation } from '@edforge/i18n'

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
            <div className="h-3 w-16 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
            <div className="h-3 w-24 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
          </div>
          <div className="h-1 rounded-sm v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
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
      className="h-1 rounded-sm overflow-hidden bg-[rgb(var(--border-primary)/0.35)]"
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        // allow-presentation-style: animated bar width + per-series color
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
  const { t } = useTranslation('dashboard')
  const settings = useSettings()
  const { formatShort } = useCurrency(settings)
  const total = totalCollected + outstanding
  const collectedPct = total > 0 ? (totalCollected / total) * 100 : 0
  const outstandingPct = total > 0 ? (outstanding / total) * 100 : 0
  const overduePct = total > 0 ? (overdue / total) * 100 : 0

  return (
    <div
      // allow-presentation-style: card padding (18px) is off the 4px scale
      className="rounded-xl border flex flex-col bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)]"
      style={{ padding: 18 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[rgb(var(--text-secondary))]">
          {t('homeV2.finance.financialOverview')}
        </h3>
        {!isLoading && !isError && (
          <span className="text-xs text-[rgb(var(--text-disabled))]">
            {collectionRate.toFixed(1)}% collected
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <FinanceSkeleton />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-[rgb(var(--text-tertiary))]">
            <p className="text-sm">{t('homeV2.finance.unableToLoad')}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-xs font-medium px-3 py-1 rounded-md bg-[rgb(var(--state-warning-bg))] text-[rgb(var(--state-warning-fg))] border border-[rgb(var(--state-warning-border))]"
              >
                {t('homeV2.finance.retry')}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Collected bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[rgb(var(--text-tertiary))]">
                  {t('homeV2.finance.collected')}
                </span>
                <span className="text-xs font-medium text-[#1D9E75]">
                  {formatShort(totalCollected)}
                </span>
              </div>
              <AnimatedBar
                percentage={collectedPct}
                color="#1D9E75"
                label={`Collected: ${formatShort(totalCollected)}`}
              />
            </div>

            {/* Outstanding bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[rgb(var(--text-tertiary))]">
                  {t('homeV2.finance.outstanding')}
                </span>
                <span className="text-xs font-medium text-[rgb(var(--state-warning-fg))]">
                  {formatShort(outstanding)}
                </span>
              </div>
              <AnimatedBar
                percentage={outstandingPct}
                color="rgb(var(--state-warning-fg))"
                label={`Outstanding: ${formatShort(outstanding)}`}
              />
            </div>

            {/* Overdue bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[rgb(var(--text-tertiary))]">
                  {t('homeV2.finance.overdue')}
                </span>
                <span className="text-xs font-medium text-[rgb(var(--state-danger-fg))]">
                  {formatShort(overdue)}
                </span>
              </div>
              <AnimatedBar
                percentage={overduePct}
                color="rgb(var(--state-danger-fg))"
                label={`Overdue: ${formatShort(overdue)}`}
              />
            </div>

            {/* Divider */}
            <div className="h-px bg-[rgb(var(--border-primary)/0.35)] my-0.5" />

            {/* Fee type breakdown */}
            {byFeeType && Object.keys(byFeeType).length > 0 && (
              <>
                {Object.entries(byFeeType).map(([type, breakdown]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-xs text-[rgb(var(--text-disabled))]">
                      {formatFeeType(type)}
                    </span>
                    <span className="text-xs text-[rgb(var(--text-tertiary))]">
                      {formatShort(breakdown.totalAmount)} invoiced
                    </span>
                  </div>
                ))}
                <div className="h-px bg-[rgb(var(--border-primary)/0.35)] my-0.5" />
              </>
            )}

            {/* Total invoiced */}
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xs text-[rgb(var(--text-disabled))]">
                {t('homeV2.finance.totalInvoiced')}
              </span>
              <span className="text-sm font-semibold text-[rgb(var(--state-danger-fg))]">
                {formatShort(totalInvoiced)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer link */}
      <div className="pt-3 mt-3 border-t border-[rgb(var(--border-primary)/0.35)]">
        <Link
          to="/finance/$"
          params={{ _splat: '' }}
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-80 text-[#1D9E75]"
        >
          {t('homeV2.finance.viewFinance')}
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
