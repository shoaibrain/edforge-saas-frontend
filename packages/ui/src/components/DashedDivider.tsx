import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../utils'

export interface DashedDividerProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional centered label on the divider line */
  label?: string
}

export const DashedDivider = forwardRef<HTMLDivElement, DashedDividerProps>(
  ({ className, label, ...props }, ref) => {
    if (label) {
      return (
        <div
          ref={ref}
          className={cn('flex items-center gap-3 my-3', className)}
          role="separator"
          {...props}
        >
          <div className="flex-1 border-t border-dashed border-[rgb(var(--border-primary) / 0.35)]" />
          <span className="text-xs font-mono uppercase tracking-[0.06em] text-[rgb(var(--text-tertiary))] shrink-0">
            {label}
          </span>
          <div className="flex-1 border-t border-dashed border-[rgb(var(--border-primary) / 0.35)]" />
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          'border-t border-dashed border-[rgb(var(--border-primary) / 0.35)] my-3',
          className
        )}
        role="separator"
        {...props}
      />
    )
  }
)

DashedDivider.displayName = 'DashedDivider'
