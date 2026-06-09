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
    <div
      className="relative overflow-hidden rounded-xl border p-4"
      style={{
        background: 'rgb(var(--background-secondary))',
        borderColor: 'rgb(var(--border-primary) / 0.35)',
      }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div
          className="h-3 w-24 rounded v2-skeleton-pulse"
          style={{ background: 'rgb(var(--background-tertiary))' }}
        />
        <div
          className="w-7 h-7 rounded-[7px] v2-skeleton-pulse"
          style={{ background: 'rgb(var(--background-tertiary))' }}
        />
      </div>
      <div
        className="h-7 w-16 rounded v2-skeleton-pulse mb-1.5"
        style={{ background: 'rgb(var(--background-tertiary))' }}
      />
      <div className="flex items-center gap-1.5">
        <div
          className="h-4 w-20 rounded-full v2-skeleton-pulse"
          style={{ background: 'rgb(var(--background-tertiary))' }}
        />
        <div
          className="h-3 w-16 rounded v2-skeleton-pulse"
          style={{ background: 'rgb(var(--background-tertiary))' }}
        />
      </div>
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: '2px', background: 'rgb(var(--background-tertiary))' }}
      />
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
      className="relative overflow-hidden rounded-xl border cursor-pointer"
      style={{
        background: 'rgb(var(--background-secondary))',
        borderColor: 'rgb(var(--border-primary) / 0.35)',
        padding: '16px 16px 12px',
        transition: 'border-color 150ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgb(var(--border-primary) / 0.5)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgb(var(--border-primary) / 0.35)'
      }}
      role="status"
      aria-label={`${label}: ${value}`}
    >
      {/* Top row: label + icon */}
      <div className="flex items-center justify-between mb-2.5">
        <span
          className="text-xs font-medium uppercase tracking-[0.5px]"
          style={{ color: 'rgb(var(--text-disabled))' }}
        >
          {label}
        </span>
        <div
          className="flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: accentColor,
          }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
        </div>
      </div>

      {/* Value */}
      {error ? (
        <div className="flex items-center gap-1.5">
          <span className="text-2xl font-semibold" style={{ color: 'rgb(var(--text-tertiary))' }}>
            —
          </span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded"
              style={{
                background: 'rgb(var(--state-warning-bg))',
                color: 'rgb(var(--state-warning-fg))',
              }}
              title="Retry loading"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              Retry
            </button>
          )}
        </div>
      ) : (
        <span
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
            className="text-xs font-medium px-2 py-0.5 rounded-[10px]"
            style={{ background: tag.bg, color: tag.color }}
          >
            {tag.text}
          </span>
        )}
        {hint && (
          <span className="text-xs" style={{ color: 'rgb(var(--text-disabled))' }}>
            {hint}
          </span>
        )}
      </div>

      {/* Accent bar */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: 2, background: barColor }}
      />
    </motion.div>
  )
}
