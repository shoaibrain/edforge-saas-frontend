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
          <div className="flex-1 border-t border-dashed border-[var(--v2-border-default)]" />
          <span className="text-[10px] font-mono uppercase tracking-[0.06em] text-[var(--v2-text-hint)] shrink-0">
            {label}
          </span>
          <div className="flex-1 border-t border-dashed border-[var(--v2-border-default)]" />
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          'border-t border-dashed border-[var(--v2-border-default)] my-3',
          className
        )}
        role="separator"
        {...props}
      />
    )
  }
)

DashedDivider.displayName = 'DashedDivider'
