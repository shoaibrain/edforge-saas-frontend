/**
 * FinanceSummaryCard
 *
 * Financial summary card showing collected vs outstanding amounts.
 * Uses data from the finance dashboard summary API.
 */

import { Link } from '@tanstack/react-router'
import { TrendingUp, ArrowRight } from 'lucide-react'
import { Card } from '@edforge/ui'
import { formatNPRShort } from '@edforge/types'

interface FinanceSummaryCardProps {
  totalCollected: number
  outstanding: number
  collectionRate: number
  isLoading: boolean
  isError: boolean
}

function FinanceSkeleton() {
  return (
    <div className="space-y-4 py-4">
      <div className="h-4 w-24 bg-[rgb(var(--surface-tertiary))] rounded animate-pulse" />
      <div className="h-6 w-full bg-[rgb(var(--surface-tertiary))] rounded animate-pulse" />
      <div className="h-4 w-24 bg-[rgb(var(--surface-tertiary))] rounded animate-pulse" />
      <div className="h-6 w-full bg-[rgb(var(--surface-tertiary))] rounded animate-pulse" />
      <div className="h-4 w-32 bg-[rgb(var(--surface-tertiary))] rounded animate-pulse" />
    </div>
  )
}

export function FinanceSummaryCard({
  totalCollected,
  outstanding,
  collectionRate,
  isLoading,
  isError,
}: FinanceSummaryCardProps) {
  const total = totalCollected + outstanding
  const collectedPct = total > 0 ? Math.round((totalCollected / total) * 100) : 0
  const outstandingPct = total > 0 ? 100 - collectedPct : 0

  return (
    <Card className="p-5 border-[rgb(var(--border-primary))] flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-green-500/10">
          <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
          Financial Summary
        </h3>
        {!isLoading && !isError && (
          <span className="ml-auto text-xs text-[rgb(var(--text-tertiary))]">
            {collectionRate.toFixed(1)}% collected
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <FinanceSkeleton />
        ) : isError ? (
          <div className="h-48 flex items-center justify-center text-[rgb(var(--text-tertiary))] text-sm">
            Unable to load financial data
          </div>
        ) : (
          <div className="space-y-5">
            {/* Collected */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-[rgb(var(--text-secondary))]">Collected</span>
                <span className="font-medium text-[rgb(var(--text-primary))]">
                  {formatNPRShort(totalCollected)}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-[rgb(var(--surface-tertiary))] overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${collectedPct}%` }}
                />
              </div>
            </div>

            {/* Outstanding */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-[rgb(var(--text-secondary))]">Outstanding</span>
                <span className="font-medium text-[rgb(var(--text-primary))]">
                  {formatNPRShort(outstanding)}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-[rgb(var(--surface-tertiary))] overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${outstandingPct}%` }}
                />
              </div>
            </div>

            {/* Collection Rate */}
            <div className="pt-2 border-t border-[rgb(var(--border-primary))]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[rgb(var(--text-tertiary))]">
                  Collection Rate
                </span>
                <span
                  className={`text-sm font-semibold ${
                    collectionRate >= 80
                      ? 'text-green-600 dark:text-green-400'
                      : collectionRate >= 50
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {collectionRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-3 mt-auto border-t border-[rgb(var(--border-primary))]">
        <Link
          to="/finance/$"
          params={{ _splat: '' }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 dark:text-cyan-400 hover:text-teal-700 dark:hover:text-cyan-300 transition-colors"
        >
          View Finance
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  )
}
