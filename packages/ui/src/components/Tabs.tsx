import {
  forwardRef,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
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

type TabsMode = 'tabs' | 'segmented'

const ARROW_KEYS = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End']

function tabItemClasses(variant: 'line' | 'segmented', selected: boolean) {
  return cn(
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
  )
}

const TabsImpl = forwardRef<HTMLDivElement, TabsProps & { mode: TabsMode }>(
  (
    { className, tabs, value, onChange, variant = 'line', mode, 'aria-label': ariaLabel = 'Tabs', ...props },
    ref
  ) => {
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])
    const isTablist = mode === 'tabs'

    // WAI-ARIA tabs: roving tabindex + arrow/Home/End move selection between
    // enabled tabs. Segmented controls are a group of independent toggle
    // buttons, so they keep native Tab order and no roving behavior.
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (!isTablist || !ARROW_KEYS.includes(event.key)) return
      const enabled = tabs.map((tab, index) => (tab.disabled ? -1 : index)).filter((index) => index >= 0)
      if (enabled.length === 0) return
      event.preventDefault()
      const currentPos = Math.max(0, enabled.indexOf(tabs.findIndex((tab) => tab.id === value)))
      let nextPos = currentPos
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          nextPos = (currentPos + 1) % enabled.length
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          nextPos = (currentPos - 1 + enabled.length) % enabled.length
          break
        case 'Home':
          nextPos = 0
          break
        case 'End':
          nextPos = enabled.length - 1
          break
      }
      const nextIndex = enabled[nextPos]
      const nextTab = tabs[nextIndex]
      if (nextTab) {
        onChange(nextTab.id)
        buttonRefs.current[nextIndex]?.focus()
      }
    }

    return (
      <div
        ref={ref}
        role={isTablist ? 'tablist' : 'group'}
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
        className={cn(
          variant === 'segmented'
            ? 'inline-flex rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-tertiary))] p-1'
            : 'flex border-b border-[rgb(var(--border-secondary))]',
          className
        )}
        {...props}
      >
        {tabs.map((tab, index) => {
          const selected = tab.id === value

          return (
            <button
              key={tab.id}
              ref={(node) => {
                buttonRefs.current[index] = node
              }}
              type="button"
              role={isTablist ? 'tab' : undefined}
              aria-selected={isTablist ? selected : undefined}
              aria-pressed={isTablist ? undefined : selected}
              tabIndex={isTablist ? (selected ? 0 : -1) : undefined}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onChange(tab.id)}
              className={tabItemClasses(variant, selected)}
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
  }
)

TabsImpl.displayName = 'TabsImpl'

export const Tabs = forwardRef<HTMLDivElement, TabsProps>((props, ref) => (
  <TabsImpl ref={ref} mode="tabs" {...props} />
))

Tabs.displayName = 'Tabs'

export const SegmentedControl = forwardRef<HTMLDivElement, TabsProps>(
  ({ variant = 'segmented', ...props }, ref) => (
    <TabsImpl ref={ref} mode="segmented" variant={variant} {...props} />
  )
)

SegmentedControl.displayName = 'SegmentedControl'
