import { forwardRef, type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils'

/**
 * StatusBadge — canonical state-token-backed status chip.
 *
 * Replaces the ad-hoc emerald/red/amber/gray status pills scattered across
 * finance/academics/shell. The `tone` is the semantic meaning; domain
 * status -> tone mapping stays in app code. All tones are theme-aware because
 * the `--state-*` tokens carry dark-mode variants.
 */
const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-secondary))]',
        info: 'bg-[rgb(var(--state-info-bg))] text-[rgb(var(--state-info-fg))]',
        success: 'bg-[rgb(var(--state-success-bg))] text-[rgb(var(--state-success-fg))]',
        warning: 'bg-[rgb(var(--state-warning-bg))] text-[rgb(var(--state-warning-fg))]',
        danger: 'bg-[rgb(var(--state-danger-bg))] text-[rgb(var(--state-danger-fg))]',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
      },
    },
    defaultVariants: {
      tone: 'neutral',
      size: 'sm',
    },
  }
)

export type StatusTone = NonNullable<VariantProps<typeof statusBadgeVariants>['tone']>

export interface StatusBadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  /** Render a leading status dot in the current tone color. */
  dot?: boolean
}

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, tone, size, dot = false, children, ...props }, ref) => (
    <span ref={ref} className={cn(statusBadgeVariants({ tone, size }), className)} {...props}>
      {dot ? (
        <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      ) : null}
      {children}
    </span>
  )
)

StatusBadge.displayName = 'StatusBadge'

export { statusBadgeVariants }
