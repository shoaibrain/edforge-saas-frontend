/**
 * StatStrip — Horizontal row of stat tiles matching the EdForge editorial design.
 *
 * Prototype specs (parent-home.html):
 *   - Card: white bg, 22px 24px padding, 22px radius, warm shadow
 *   - Icon chip: 34x34, 10px radius, semantic background color
 *   - Label: font-mono, 10px, uppercase, 0.12em tracking, ink-3
 *   - Value: font-display (Fraunces), 40px, weight 500, SOFT 40
 *   - Subtitle: 12px, ink-3
 *   - Hover: translateY(-2px), shadow-hover
 *   - Grid: 4 columns, 16px gap, 44px bottom margin
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../utils'
import { useCountUp, parseFormattedValue, formatAnimatedValue } from '../hooks/useCountUp'

export interface StatStripItem {
  label: string
  value: string
  subtitle?: string
  icon?: ReactNode
  /** Background color for the icon chip (CSS color string) */
  iconBgColor?: string
  /** Text color for the icon (CSS color string) */
  iconColor?: string
  loading?: boolean
  error?: boolean
  onRetry?: () => void
}

export interface StatStripProps extends HTMLAttributes<HTMLDivElement> {
  items: StatStripItem[]
}

function StatTileSkeleton() {
  return (
    <div
      className="border"
      style={{
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
        borderRadius: '22px',
        padding: '22px 24px',
        boxShadow: 'var(--v2-shadow-card, 0 1px 3px rgba(0,0,0,0.06))',
      }}
    >
      <div className="h-[34px] w-[34px] rounded-[10px] v2-skeleton-pulse mb-3" style={{ background: 'var(--v2-bg-elevated)' }} />
      <div className="h-3 w-14 rounded v2-skeleton-pulse mb-3" style={{ background: 'var(--v2-bg-elevated)' }} />
      <div className="h-10 w-20 rounded v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
    </div>
  )
}

function StatTile({ label, value, subtitle, icon, iconBgColor, iconColor, loading, error, onRetry }: StatStripItem) {
  const parsed = parseFormattedValue(value)
  const animatedNum = useCountUp(parsed.number, 800, { enabled: !loading && !error })
  const displayValue =
    parsed.number > 0
      ? formatAnimatedValue(animatedNum, parsed.number, parsed.prefix, parsed.suffix)
      : value

  if (loading) return <StatTileSkeleton />

  return (
    <div
      className="border transition-all duration-200 motion-safe:hover:-translate-y-0.5"
      style={{
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
        borderRadius: '22px',
        padding: '22px 24px',
        boxShadow: 'var(--v2-shadow-card, 0 1px 3px rgba(0,0,0,0.06))',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--v2-shadow-hover, 0 4px 12px rgba(0,0,0,0.10))'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--v2-shadow-card, 0 1px 3px rgba(0,0,0,0.06))'
      }}
      role="status"
      aria-label={`${label}: ${value}`}
    >
      {/* Icon chip — 34x34, 10px radius, colored background */}
      {icon && (
        <span
          className="shrink-0 flex items-center justify-center"
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: iconBgColor || 'var(--v2-surface-interactive)',
            color: iconColor || 'var(--v2-text-muted)',
            marginBottom: 6,
          }}
        >
          {icon}
        </span>
      )}

      {/* Label — monospace, 10px, uppercase, wide tracking */}
      <span
        className="font-mono uppercase"
        style={{
          fontSize: '10px',
          letterSpacing: '0.12em',
          color: 'var(--v2-text-muted)',
        }}
      >
        {label}
      </span>

      {/* Value — display serif, 40px, weight 500, tabular nums */}
      {error ? (
        <div className="flex items-center gap-2">
          <span
            className="font-display italic"
            style={{ fontSize: 24, fontWeight: 300, color: 'var(--v2-text-hint)' }}
          >
            —
          </span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: 'var(--v2-warning-bg)', color: 'var(--v2-warning)' }}
            >
              Retry
            </button>
          )}
        </div>
      ) : (
        <span
          className="font-display leading-none tabular-nums"
          style={{
            fontSize: 40,
            fontWeight: 500,
            letterSpacing: '-0.025em',
            color: 'var(--v2-text-primary)',
          }}
        >
          {displayValue}
        </span>
      )}

      {/* Subtitle — 12px, muted */}
      {subtitle && (
        <p style={{ fontSize: 12, color: 'var(--v2-text-muted)', marginTop: 2 }}>
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
          'grid',
          items.length <= 4
            ? 'grid-cols-2 sm:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
          className
        )}
        style={{ gap: 16 }}
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
