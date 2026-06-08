import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../utils'

const STATUS_STYLES = {
  present: {
    bg: 'var(--v2-status-present-bg)',
    text: 'var(--v2-status-present)',
    border: 'var(--v2-success-border)',
  },
  absent: {
    bg: 'var(--v2-status-absent-bg)',
    text: 'var(--v2-status-absent)',
    border: 'var(--v2-danger-border)',
  },
  late: {
    bg: 'var(--v2-status-late-bg)',
    text: 'var(--v2-status-late)',
    border: 'var(--v2-warning-border)',
  },
  excused: {
    bg: 'var(--v2-status-excused-bg)',
    text: 'var(--v2-status-excused)',
    border: 'var(--v2-info-border)',
  },
  paid: {
    bg: 'var(--v2-status-paid-bg)',
    text: 'var(--v2-status-paid)',
    border: 'var(--v2-success-border)',
  },
  overdue: {
    bg: 'var(--v2-status-overdue-bg)',
    text: 'var(--v2-status-overdue)',
    border: 'var(--v2-danger-border)',
  },
  pending: {
    bg: 'var(--v2-status-pending-bg)',
    text: 'var(--v2-status-pending)',
    border: 'var(--v2-border-default)',
  },
  upcoming: {
    bg: 'var(--v2-status-upcoming-bg)',
    text: 'var(--v2-status-upcoming)',
    border: 'var(--v2-warning-border)',
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
