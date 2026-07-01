/**
 * TablePresetTabs — docked status presets for the unified table toolbar.
 *
 * A compact segmented control (the handoff `.segd` surface) that replaces the
 * scattered per-page "All / Active / At-risk / …" preset buttons with one
 * config-driven strip. Single-select, keyboard-navigable (roving arrow keys),
 * with per-preset counts. Composes the shared `focusRing`.
 */
import { forwardRef, useRef, type HTMLAttributes, type KeyboardEvent } from 'react'
import { cn, focusRing } from '../../utils'

export interface TablePreset {
  /** Stable value identifying the preset (e.g. "active"). */
  value: string
  label: string
  /** Optional count badge. */
  count?: number
}

export interface TablePresetTabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  presets: TablePreset[]
  /** Currently selected preset value. */
  active: string
  onChange: (value: string) => void
  /** Accessible name for the group. Default "Status presets". */
  ariaLabel?: string
}

export const TablePresetTabs = forwardRef<HTMLDivElement, TablePresetTabsProps>(
  ({ className, presets, active, onChange, ariaLabel = 'Status presets', ...props }, ref) => {
    const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])

    const focusAt = (index: number) => {
      const max = presets.length - 1
      const next = index < 0 ? max : index > max ? 0 : index
      buttonRefs.current[next]?.focus()
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault()
          focusAt(index + 1)
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault()
          focusAt(index - 1)
          break
        case 'Home':
          event.preventDefault()
          focusAt(0)
          break
        case 'End':
          event.preventDefault()
          focusAt(presets.length - 1)
          break
        default:
          break
      }
    }

    return (
      <div
        ref={ref}
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          'inline-flex items-center gap-0.5 rounded-lg border p-0.5',
          'border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-primary))]',
          className,
        )}
        {...props}
      >
        {presets.map((preset, index) => {
          const isActive = preset.value === active
          return (
            <button
              key={preset.value}
              ref={(el) => {
                buttonRefs.current[index] = el
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(preset.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                'inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-xs font-medium transition-colors',
                focusRing,
                isActive
                  ? 'bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-primary))] shadow-[var(--elevation-raised)]'
                  : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]',
              )}
            >
              {preset.label}
              {preset.count != null ? (
                <span
                  className={cn(
                    'tabular-nums',
                    isActive ? 'text-[rgb(var(--text-secondary))]' : 'text-[rgb(var(--text-tertiary))]',
                  )}
                >
                  {preset.count}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    )
  },
)

TablePresetTabs.displayName = 'TablePresetTabs'
