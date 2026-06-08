import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn, focusRing, focusRingInset } from '../utils'

export interface TabItem {
  id: string
  label: ReactNode
  count?: number
  disabled?: boolean
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  tabs: readonly TabItem[]
  value: string
  onChange: (value: string) => void
  variant?: 'line' | 'segmented'
  'aria-label'?: string
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ className, tabs, value, onChange, variant = 'line', 'aria-label': ariaLabel = 'Tabs', ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        variant === 'segmented'
          ? 'inline-flex rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-tertiary))] p-1'
          : 'flex border-b border-[rgb(var(--border-secondary))]',
        className
      )}
      {...props}
    >
      {tabs.map((tab) => {
        const selected = tab.id === value

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={cn(
              'inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors duration-fast ease-standard',
              'disabled:pointer-events-none disabled:opacity-50',
              variant === 'segmented'
                ? cn(
                    'rounded-lg px-3 py-1.5',
                    selected
                      ? 'bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-primary))] shadow-sm'
                      : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]',
                    focusRingInset
                  )
                : cn(
                    '-mb-px border-b-2 px-4 py-3',
                    selected
                      ? 'border-[rgb(var(--border-focus))] text-[rgb(var(--text-primary))]'
                      : 'border-transparent text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--border-secondary))] hover:text-[rgb(var(--text-primary))]',
                    focusRing
                  )
            )}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-xs',
                  selected
                    ? 'bg-[rgb(var(--action-primary-bg)/0.12)] text-[rgb(var(--action-secondary-fg))]'
                    : 'bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]'
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
)

Tabs.displayName = 'Tabs'

export { Tabs as SegmentedControl }
