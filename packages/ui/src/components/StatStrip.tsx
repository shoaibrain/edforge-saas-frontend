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
        background: 'rgb(var(--background-secondary))',
        borderColor: 'rgb(var(--border-primary) / 0.35)',
        borderRadius: '22px',
        padding: '22px 24px',
        boxShadow: 'var(--elevation-raised)',
      }}
    >
      <div className="h-8 w-8 rounded-[10px] v2-skeleton-pulse mb-3" style={{ background: 'rgb(var(--background-tertiary))' }} />
      <div className="h-3 w-14 rounded v2-skeleton-pulse mb-3" style={{ background: 'rgb(var(--background-tertiary))' }} />
      <div className="h-10 w-20 rounded v2-skeleton-pulse" style={{ background: 'rgb(var(--background-tertiary))' }} />
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
        background: 'rgb(var(--background-secondary))',
        borderColor: 'rgb(var(--border-primary) / 0.35)',
        borderRadius: '22px',
        padding: '22px 24px',
        boxShadow: 'var(--elevation-raised)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--elevation-overlay)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--elevation-raised)'
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
            background: iconBgColor || 'rgb(var(--background-tertiary) / 0.6)',
            color: iconColor || 'rgb(var(--text-tertiary))',
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
          color: 'rgb(var(--text-tertiary))',
        }}
      >
        {label}
      </span>

      {/* Value — display serif, 40px, weight 500, tabular nums */}
      {error ? (
        <div className="flex items-center gap-2">
          <span
            className="font-display italic"
            style={{ fontSize: 24, fontWeight: 300, color: 'rgb(var(--text-tertiary))' }}
          >
            —
          </span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs font-medium px-1.5 py-0.5 rounded"
              style={{ background: 'rgb(var(--state-warning-bg))', color: 'rgb(var(--state-warning-fg))' }}
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
            color: 'rgb(var(--text-primary))',
          }}
        >
          {displayValue}
        </span>
      )}

      {/* Subtitle — 12px, muted */}
      {subtitle && (
        <p style={{ fontSize: 12, color: 'rgb(var(--text-tertiary))', marginTop: 2 }}>
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
