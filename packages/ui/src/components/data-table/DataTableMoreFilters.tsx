/**
 * DataTableMoreFilters — the unified-toolbar "More filters" popover.
 *
 * Folds a page's secondary filter controls (Status, Type, Credit, …) into one
 * trigger + panel so the toolbar shows only a single primary facet inline and
 * keeps the rest a click away. Mirrors DataTableFacetedFilter's headlessui
 * Popover/Transition pattern. The caller owns the actual controls (passed as
 * children) and the active count / clear behavior.
 */
import { Fragment, type ReactNode } from 'react'
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react'
import { ChevronDown, ListFilter } from 'lucide-react'
import { cn, focusRingInset } from '../../utils'

export interface DataTableMoreFiltersProps {
  /** Secondary filter controls, stacked vertically in the panel. */
  children: ReactNode
  /** Number of active secondary filters (drives the badge). */
  activeCount?: number
  /** Clears all secondary filters; renders a footer button when provided and active. */
  onClear?: () => void
  /** Trigger label. Default "More filters". */
  label?: string
  /** Clear button label. Default "Clear". */
  clearLabel?: string
}

export function DataTableMoreFilters({
  children,
  activeCount = 0,
  onClear,
  label = 'More filters',
  clearLabel = 'Clear',
}: DataTableMoreFiltersProps) {
  const active = activeCount > 0
  return (
    <Popover className="relative">
      <PopoverButton
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors',
          focusRingInset,
          active
            ? 'border-[var(--mint-border)] bg-[var(--mint-soft)] text-[rgb(var(--text-primary))]'
            : 'border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-secondary))]',
        )}
      >
        <ListFilter className="h-3.5 w-3.5" />
        {label}
        {active ? (
          <span className="ms-1 rounded-full bg-[var(--mint)] px-1.5 py-0.5 text-xs font-semibold tabular-nums text-[rgb(var(--text-on-accent))]">
            {activeCount}
          </span>
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-[rgb(var(--text-tertiary))]" />
        )}
      </PopoverButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <PopoverPanel className="absolute z-50 mt-1 w-64 origin-top-start rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] shadow-popover focus:outline-none">
          <div className="flex flex-col gap-3 p-3">{children}</div>
          {active && onClear ? (
            <div className="border-t border-[rgb(var(--border-secondary))] p-1">
              <button
                type="button"
                onClick={onClear}
                className="w-full px-3 py-1.5 text-center text-xs font-medium text-[rgb(var(--text-secondary))] transition-colors hover:text-[rgb(var(--text-primary))]"
              >
                {clearLabel}
              </button>
            </div>
          ) : null}
        </PopoverPanel>
      </Transition>
    </Popover>
  )
}
