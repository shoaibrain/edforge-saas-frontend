import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '../../utils'

type InlineAlertVariant = 'info' | 'success' | 'warning' | 'danger'

const iconByVariant = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
} satisfies Record<InlineAlertVariant, typeof Info>

const classByVariant = {
  info: 'border-[rgb(var(--state-info-border)/0.40)] bg-[rgb(var(--state-info-bg)/0.45)] text-[rgb(var(--state-info-fg))]',
  success:
    'border-[rgb(var(--state-success-border)/0.40)] bg-[rgb(var(--state-success-bg)/0.45)] text-[rgb(var(--state-success-fg))]',
  warning:
    'border-[rgb(var(--state-warning-border)/0.45)] bg-[rgb(var(--state-warning-bg)/0.50)] text-[rgb(var(--state-warning-fg))]',
  danger:
    'border-[rgb(var(--state-danger-border)/0.45)] bg-[rgb(var(--state-danger-bg)/0.45)] text-[rgb(var(--state-danger-fg))]',
} satisfies Record<InlineAlertVariant, string>

export interface InlineAlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: InlineAlertVariant
  title?: ReactNode
  icon?: ReactNode
}

export const InlineAlert = forwardRef<HTMLDivElement, InlineAlertProps>(
  ({ className, variant = 'info', title, icon, children, ...props }, ref) => {
    const Icon = icon ? null : iconByVariant[variant]

    return (
      <div
        ref={ref}
        role={variant === 'danger' ? 'alert' : 'status'}
        className={cn('flex items-start gap-3 rounded-xl border px-4 py-3 text-sm', classByVariant[variant], className)}
        {...props}
      >
        <span className="mt-0.5 shrink-0">
          {icon ?? (Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null)}
        </span>
        <span className="min-w-0 flex-1">
          {title ? <span className="block font-semibold">{title}</span> : null}
          {children ? <span className={cn('block', title && 'mt-0.5')}>{children}</span> : null}
        </span>
      </div>
    )
  }
)

InlineAlert.displayName = 'InlineAlert'

export type { InlineAlertVariant }
