import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../utils'
import { useCountUp, parseFormattedValue, formatAnimatedValue } from '../hooks/useCountUp'

export interface StatStripItem {
  /** Label above the value */
  label: string
  /** Formatted value string (e.g., "3.75", "96%", "$0") */
  value: string
  /** Optional subtitle below the value */
  subtitle?: string
  /** Optional icon (ReactNode, typically a Lucide icon) */
  icon?: ReactNode
  /** Whether this tile is still loading */
  loading?: boolean
  /** Whether this tile errored */
  error?: boolean
  /** Retry callback for error state */
  onRetry?: () => void
}

export interface StatStripProps extends HTMLAttributes<HTMLDivElement> {
  items: StatStripItem[]
}

function StatTileSkeleton() {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
      }}
    >
      <div
        className="h-3 w-16 rounded v2-skeleton-pulse mb-2"
        style={{ background: 'var(--v2-bg-elevated)' }}
      />
      <div
        className="h-7 w-12 rounded v2-skeleton-pulse"
        style={{ background: 'var(--v2-bg-elevated)' }}
      />
    </div>
  )
}

function StatTile({ label, value, subtitle, icon, loading, error, onRetry }: StatStripItem) {
  const parsed = parseFormattedValue(value)
  const animatedNum = useCountUp(parsed.number, 800, { enabled: !loading && !error })
  const displayValue =
    parsed.number > 0
      ? formatAnimatedValue(animatedNum, parsed.number, parsed.prefix, parsed.suffix)
      : value

  if (loading) return <StatTileSkeleton />

  return (
    <div
      className="rounded-xl border p-4 transition-colors"
      style={{
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
      }}
      role="status"
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        {icon && (
          <span className="text-[var(--v2-text-muted)] shrink-0">{icon}</span>
        )}
        <span
          className="text-[11px] font-medium uppercase tracking-[0.04em]"
          style={{ color: 'var(--v2-text-muted)' }}
        >
          {label}
        </span>
      </div>
      {error ? (
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold" style={{ color: 'var(--v2-text-hint)' }}>
            —
          </span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{
                background: 'var(--v2-warning-bg)',
                color: 'var(--v2-warning)',
              }}
            >
              Retry
            </button>
          )}
        </div>
      ) : (
        <span
          className="text-xl font-semibold leading-none tracking-tight tabular-nums"
          style={{ color: 'var(--v2-text-primary)' }}
        >
          {displayValue}
        </span>
      )}
      {subtitle && (
        <p
          className="text-[11px] mt-1"
          style={{ color: 'var(--v2-text-hint)' }}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}

export const StatStrip = forwardRef<HTMLDivElement, StatStripProps>(
  ({ className, items, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'grid gap-3',
          items.length <= 4
            ? 'grid-cols-2 sm:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
          className
        )}
        {...props}
      >
        {items.map((item, i) => (
          <StatTile key={`${item.label}-${i}`} {...item} />
        ))}
      </div>
    )
  }
)

StatStrip.displayName = 'StatStrip'
