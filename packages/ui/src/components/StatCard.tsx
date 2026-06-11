/**
 * StatCard — V2 KPI Tile
 *
 * Reusable stat tile with accent bar, tag pill, count-up animation,
 * and V2 token-based styling. Extracted from shell's HomeStatCard.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  useCountUp,
  parseFormattedValue,
  formatAnimatedValue,
} from '../hooks/useCountUp'

export interface StatCardProps {
  label: string
  value: string
  subtitle?: string
  icon: LucideIcon
  /** Hex color for the icon background (module accent) */
  accentColor: string
  /** Hex color for the icon fill */
  iconColor: string
  /** Accent bar color at bottom of card */
  barColor: string
  /** Optional tag pill */
  tag?: { text: string; color: string; bg: string }
  /** Hint text below value */
  hint?: string
  loading?: boolean
  error?: boolean
  onRetry?: () => void
  /** Override value text color */
  valueColor?: string
}

function KpiSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl border p-4 bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)]">
      <div className="flex items-center justify-between mb-2.5">
        <div className="h-3 w-24 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
        <div className="w-7 h-7 rounded-[7px] v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
      </div>
      <div className="h-7 w-16 rounded v2-skeleton-pulse mb-1.5 bg-[rgb(var(--background-tertiary))]" />
      <div className="flex items-center gap-1.5">
        <div className="h-4 w-20 rounded-full v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
        <div className="h-3 w-16 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgb(var(--background-tertiary))]" />
    </div>
  )
}

export function StatCard({
  label,
  value,
  icon: Icon,
  accentColor,
  iconColor,
  barColor,
  tag,
  hint,
  loading,
  error,
  onRetry,
  valueColor,
}: StatCardProps) {
  // Parse value for count-up animation
  const parsed = useMemo(() => parseFormattedValue(value), [value])
  const animatedNum = useCountUp(parsed.number, 800, { enabled: !loading && !error })
  const displayValue = useMemo(
    () =>
      parsed.number > 0
        ? formatAnimatedValue(animatedNum, parsed.number, parsed.prefix, parsed.suffix)
        : value,
    [animatedNum, parsed, value],
  )

  if (loading) return <KpiSkeleton />

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-xl border cursor-pointer pt-4 px-4 pb-3 bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)] hover:border-[rgb(var(--border-primary)/0.5)]"
      style={{ transition: 'border-color 150ms ease' }}
      role="status"
      aria-label={`${label}: ${value}`}
    >
      {/* Top row: label + icon */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-medium uppercase tracking-[0.5px] text-[rgb(var(--text-disabled))]">
          {label}
        </span>
        <div
          // allow-presentation-style: icon chip background is the module accent (prop)
          className="flex items-center justify-center w-7 h-7 rounded-[7px]"
          style={{ background: accentColor }}
        >
          <Icon
            // allow-presentation-style: icon fill is the module accent (prop)
            className="w-3.5 h-3.5"
            style={{ color: iconColor }}
          />
        </div>
      </div>

      {/* Value */}
      {error ? (
        <div className="flex items-center gap-1.5">
          <span className="text-2xl font-semibold text-[rgb(var(--text-tertiary))]">
            —
          </span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded bg-[rgb(var(--state-warning-bg))] text-[rgb(var(--state-warning-fg))]"
              title="Retry loading"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              Retry
            </button>
          )}
        </div>
      ) : (
        <span
          // allow-presentation-style: value color is an optional caller override (prop)
          className="text-2xl font-semibold leading-none tracking-tight"
          style={{ color: valueColor || 'rgb(var(--text-primary))' }}
        >
          {displayValue}
        </span>
      )}

      {/* Meta: tag + hint */}
      <div className="flex items-center gap-1.5 mt-1.5">
        {tag && (
          <span
            // allow-presentation-style: tag pill colors are caller-provided (prop)
            className="text-xs font-medium px-2 py-0.5 rounded-[10px]"
            style={{ background: tag.bg, color: tag.color }}
          >
            {tag.text}
          </span>
        )}
        {hint && (
          <span className="text-xs text-[rgb(var(--text-disabled))]">
            {hint}
          </span>
        )}
      </div>

      {/* Accent bar */}
      <div
        // allow-presentation-style: accent bar color is the module accent (prop)
        className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{ background: barColor }}
      />
    </motion.div>
  )
}
