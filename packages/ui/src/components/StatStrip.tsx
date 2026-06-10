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
    <div className="border pt-[22px] pb-[22px] px-6 rounded-[22px] bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)] shadow-[var(--elevation-raised)]">
      <div className="h-8 w-8 rounded-[10px] v2-skeleton-pulse mb-3 bg-[rgb(var(--background-tertiary))]" />
      <div className="h-3 w-14 rounded v2-skeleton-pulse mb-3 bg-[rgb(var(--background-tertiary))]" />
      <div className="h-10 w-20 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
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
      className="border transition-all duration-200 motion-safe:hover:-translate-y-0.5 flex flex-col gap-2 pt-[22px] pb-[22px] px-6 rounded-[22px] bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)] shadow-[var(--elevation-raised)] hover:shadow-[var(--elevation-overlay)]"
      role="status"
      aria-label={`${label}: ${value}`}
    >
      {/* Icon chip — 34x34, 10px radius, colored background */}
      {icon && (
        <span
          // allow-presentation-style: icon chip bg/fg are caller-provided (props)
          className="shrink-0 flex items-center justify-center mb-1.5"
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: iconBgColor || 'rgb(var(--background-tertiary) / 0.6)',
            color: iconColor || 'rgb(var(--text-tertiary))',
          }}
        >
          {icon}
        </span>
      )}

      {/* Label — monospace, 10px, uppercase, wide tracking */}
      <span className="font-mono uppercase text-3xs tracking-[0.12em] text-[rgb(var(--text-tertiary))]">
        {label}
      </span>

      {/* Value — display serif, 40px, weight 500, tabular nums */}
      {error ? (
        <div className="flex items-center gap-2">
          <span className="font-display italic text-2xl font-light text-[rgb(var(--text-tertiary))]">
            —
          </span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs font-medium px-1.5 py-0.5 rounded bg-[rgb(var(--state-warning-bg))] text-[rgb(var(--state-warning-fg))]"
            >
              Retry
            </button>
          )}
        </div>
      ) : (
        <span
          // allow-presentation-style: 40px Fraunces display size is an editorial value with no scale token
          className="font-display leading-none tabular-nums font-medium tracking-[-0.025em] text-[rgb(var(--text-primary))]"
          style={{ fontSize: 40 }}
        >
          {displayValue}
        </span>
      )}

      {/* Subtitle — 12px, muted */}
      {subtitle && (
        <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
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
          'grid gap-4',
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
