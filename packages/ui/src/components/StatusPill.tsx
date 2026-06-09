import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../utils'

const STATUS_STYLES = {
  present: {
    bg: 'rgb(var(--state-success-bg))',
    text: 'rgb(var(--state-success-fg))',
    border: 'rgb(var(--state-success-border))',
  },
  absent: {
    bg: 'rgb(var(--state-danger-bg))',
    text: 'rgb(var(--state-danger-fg))',
    border: 'rgb(var(--state-danger-border))',
  },
  late: {
    bg: 'rgb(var(--state-warning-bg))',
    text: 'rgb(var(--state-warning-fg))',
    border: 'rgb(var(--state-warning-border))',
  },
  excused: {
    bg: 'rgb(var(--state-info-bg))',
    text: 'rgb(var(--state-info-fg))',
    border: 'rgb(var(--state-info-border))',
  },
  paid: {
    bg: 'rgb(var(--state-success-bg))',
    text: 'rgb(var(--state-success-fg))',
    border: 'rgb(var(--state-success-border))',
  },
  overdue: {
    bg: 'rgb(var(--state-danger-bg))',
    text: 'rgb(var(--state-danger-fg))',
    border: 'rgb(var(--state-danger-border))',
  },
  pending: {
    bg: 'rgb(var(--background-tertiary) / 0.5)',
    text: 'rgb(var(--text-tertiary))',
    border: 'rgb(var(--border-primary) / 0.35)',
  },
  upcoming: {
    bg: 'rgb(var(--state-warning-bg))',
    text: 'rgb(var(--state-warning-fg))',
    border: 'rgb(var(--state-warning-border))',
  },
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
    const styles = STATUS_STYLES[variant]

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium leading-tight border',
          className
        )}
        style={{
          backgroundColor: styles.bg,
          color: styles.text,
          borderColor: styles.border,
        }}
        {...props}
      >
        {label}
      </span>
    )
  }
)

StatusPill.displayName = 'StatusPill'
