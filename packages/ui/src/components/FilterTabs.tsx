/**
 * FilterTabs — Generic tab group with count badges
 *
 * Used for filtering views (Outstanding/Overdue/Paid/All).
 * Generic enough for reuse beyond fees.
 */

import {
  forwardRef,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent,
} from 'react'
import { cn, focusRing } from '../utils'

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
    const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])

    const focusTab = (index: number) => {
      const max = tabs.length - 1
      const nextIndex = index < 0 ? max : index > max ? 0 : index
      buttonRefs.current[nextIndex]?.focus()
    }

    const handleKeyDown = (
      event: KeyboardEvent<HTMLButtonElement>,
      index: number
    ) => {
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault()
          focusTab(index + 1)
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault()
          focusTab(index - 1)
          break
        case 'Home':
          event.preventDefault()
          focusTab(0)
          break
        case 'End':
          event.preventDefault()
          focusTab(tabs.length - 1)
          break
        default:
          break
      }
    }

    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-1 flex-wrap', className)}
        role="tablist"
        {...props}
      >
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.key
          return (
            <button
              ref={(element) => {
                buttonRefs.current[index] = element
              }}
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => onTabChange(tab.key)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                focusRing,
                isActive
                  ? 'bg-[rgb(var(--brand-primary))] text-[rgb(var(--text-inverted))] shadow-sm'
                  : 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--interactive-hover))] hover:text-[rgb(var(--text-primary))]'
              )}
            >
              {tab.label}
              {tab.count != null && (
                <span
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full leading-none font-semibold',
                    isActive
                      ? 'bg-[rgb(var(--surface-primary)/0.18)] text-[rgb(var(--text-inverted))]'
                      : 'bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-tertiary))]'
                  )}
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
