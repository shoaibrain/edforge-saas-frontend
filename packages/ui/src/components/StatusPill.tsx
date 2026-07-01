import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../utils'

const SUCCESS = 'bg-[rgb(var(--state-success-bg))] text-[rgb(var(--state-success-fg))] border-[rgb(var(--state-success-border))]'
const DANGER = 'bg-[rgb(var(--state-danger-bg))] text-[rgb(var(--state-danger-fg))] border-[rgb(var(--state-danger-border))]'
const WARNING = 'bg-[rgb(var(--state-warning-bg))] text-[rgb(var(--state-warning-fg))] border-[rgb(var(--state-warning-border))]'
const INFO = 'bg-[rgb(var(--state-info-bg))] text-[rgb(var(--state-info-fg))] border-[rgb(var(--state-info-border))]'
const NEUTRAL = 'bg-[rgb(var(--background-tertiary)/0.5)] text-[rgb(var(--text-tertiary))] border-[rgb(var(--border-primary)/0.35)]'

const STATUS_STYLES = {
  // Domain variants (attendance / fees) — kept for existing consumers.
  present: SUCCESS,
  absent: DANGER,
  late: WARNING,
  excused: INFO,
  paid: SUCCESS,
  overdue: DANGER,
  pending: NEUTRAL,
  upcoming: WARNING,
  // Semantic tone variants — surfaces (e.g. StatBand) that need a tone-driven
  // pill compose these instead of borrowing a domain name.
  success: SUCCESS,
  danger: DANGER,
  warning: WARNING,
  info: INFO,
  neutral: NEUTRAL,
} as const

export type StatusPillVariant = keyof typeof STATUS_STYLES

export interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  /** Semantic status variant */
  variant: StatusPillVariant
  /** Label text displayed inside the pill */
  label: string
}

export const StatusPill = forwardRef<HTMLSpanElement, StatusPillProps>(
  ({ className, variant, label, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium leading-tight border',
          STATUS_STYLES[variant],
          className
        )}
        {...props}
      >
        {label}
      </span>
    )
  }
)

StatusPill.displayName = 'StatusPill'
