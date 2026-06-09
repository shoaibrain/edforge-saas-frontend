import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../utils'

export interface CategoryBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Category name (e.g., "Homework") */
  label: string
  /** Weight percentage (0-100) */
  weight: number
  /** Fill percentage (0-100, representing achievement within this category) */
  fill: number
  /** Optional bar color override. Defaults to brand-primary. */
  color?: string
}

export const CategoryBar = forwardRef<HTMLDivElement, CategoryBarProps>(
  ({ className, label, weight, fill, color, ...props }, ref) => {
    const clampedFill = Math.min(Math.max(fill, 0), 100)

    return (
      <div ref={ref} className={cn('space-y-1', className)} {...props}>
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-medium"
            style={{ color: 'rgb(var(--text-secondary))' }}
          >
            {label}
          </span>
          <span
            className="text-xs font-mono tabular-nums"
            style={{ color: 'rgb(var(--text-tertiary))' }}
          >
            {weight}%
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: 'rgb(var(--background-tertiary))' }}
        >
          <div
            className="h-full rounded-full v2-bar-fill"
            style={{
              width: `${clampedFill}%`,
              background: color || '#1D9E75',
              '--v2-bar-fill-duration': '600ms',
            } as React.CSSProperties}
          />
        </div>
      </div>
    )
  }
)

CategoryBar.displayName = 'CategoryBar'
