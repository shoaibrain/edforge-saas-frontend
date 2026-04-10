/**
 * FilterTabs — Generic tab group with count badges
 *
 * Used for filtering views (Outstanding/Overdue/Paid/All).
 * Generic enough for reuse beyond fees.
 */

import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../utils'

export interface FilterTab {
  key: string
  label: string
  count?: number
}

export interface FilterTabsProps extends HTMLAttributes<HTMLDivElement> {
  tabs: FilterTab[]
  activeTab: string
  onTabChange: (key: string) => void
}

export const FilterTabs = forwardRef<HTMLDivElement, FilterTabsProps>(
  ({ className, tabs, activeTab, onTabChange, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-1 flex-wrap', className)}
        role="tablist"
        {...props}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
              style={{
                background: isActive ? 'var(--v2-brand-primary)' : 'var(--v2-surface-interactive)',
                color: isActive ? '#fff' : 'var(--v2-text-muted)',
              }}
            >
              {tab.label}
              {tab.count != null && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full leading-none font-semibold"
                  style={{
                    background: isActive
                      ? 'rgba(255,255,255,0.2)'
                      : 'var(--v2-bg-elevated)',
                    color: isActive ? '#fff' : 'var(--v2-text-hint)',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }
)

FilterTabs.displayName = 'FilterTabs'
