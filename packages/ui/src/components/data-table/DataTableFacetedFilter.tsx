import { Fragment, useMemo } from 'react'
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react'
import { Check, ListFilter } from 'lucide-react'
import type { Column } from '@tanstack/react-table'
import { cn, focusRingInset } from '../../utils'
import { DEFAULT_DATA_TABLE_LABELS } from './labels'
import type {
  DataTableColumnMeta,
  DataTableLabels,
  FacetedFilterOption,
} from './types'

interface DataTableFacetedFilterProps<TData> {
  column: Column<TData>
  title: string
  options: FacetedFilterOption[]
  labels?: DataTableLabels
}

export function DataTableFacetedFilter<TData>({
  column,
  title,
  options,
  labels,
}: DataTableFacetedFilterProps<TData>) {
  const resolvedLabels = labels ?? DEFAULT_DATA_TABLE_LABELS
  const selectedValues = new Set(
    (column.getFilterValue() as string[] | undefined) ?? []
  )

  const meta = column.columnDef.meta as DataTableColumnMeta | undefined

  // Live per-value counts driven by TanStack's faceted unique values. Map keys
  // are the underlying cell values — coerced to string to match option values.
  const facetedCounts = useMemo(() => {
    const map = column.getFacetedUniqueValues?.()
    const result = new Map<string, number>()
    if (!map) return result
    map.forEach((count, value) => {
      if (Array.isArray(value)) {
        // Array-valued cells (e.g. gradeLevels: ['G9','G10']) contribute one
        // count to each member so the dropdown count matches what users see.
        value.forEach((v) => {
          const k = String(v)
          result.set(k, (result.get(k) ?? 0) + count)
        })
        return
      }
      result.set(String(value), count)
    })
    return result
  }, [column])

  const toggleValue = (value: string) => {
    const next = new Set(selectedValues)
    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }
    const arr = Array.from(next)
    column.setFilterValue(arr.length > 0 ? arr : undefined)
  }

  return (
    <Popover className="relative">
      <PopoverButton
        className={cn(
          'inline-flex items-center gap-1.5 px-3 h-9 text-sm font-medium rounded-lg border transition-colors',
          focusRingInset,
          selectedValues.size > 0
            ? 'bg-[var(--mint-soft)] border-[var(--mint-border)] text-[rgb(var(--text-primary))]'
            : 'border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-secondary))]'
        )}
        aria-label={resolvedLabels.filterAriaLabel(title)}
      >
        <ListFilter className="w-3.5 h-3.5" />
        {title}
        {selectedValues.size > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold tabular-nums rounded-full bg-[var(--mint)] text-[rgb(var(--text-on-accent))]">
            {selectedValues.size}
          </span>
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
        <PopoverPanel className="absolute z-50 mt-1 w-60 origin-top-left rounded-xl bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary))] shadow-popover focus:outline-none overflow-hidden">
          <div className="py-1 max-h-64 overflow-y-auto">
            {options.map((option) => {
              const isSelected = selectedValues.has(option.value)
              const labelText = meta?.facetLabelMap
                ? meta.facetLabelMap(option.value)
                : option.label
              const count = facetedCounts.get(option.value) ?? 0
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleValue(option.value)}
                  className={cn(
                    'flex items-center w-full px-3 py-2 text-sm transition-colors',
                    'hover:bg-[rgb(var(--background-secondary))]',
                    focusRingInset,
                    isSelected && 'text-[rgb(var(--text-primary))] font-medium'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-4 h-4 rounded border mr-2.5 flex-shrink-0',
                      isSelected
                        ? 'bg-[var(--mint)] border-[var(--mint)]'
                        : 'border-[rgb(var(--border-primary))]'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 text-[rgb(var(--text-on-accent))]" />}
                  </div>
                  {option.icon && (
                    <span className="flex-shrink-0 mr-2">{option.icon}</span>
                  )}
                  <span
                    className={cn(
                      'flex-1 text-left',
                      isSelected
                        ? 'text-[rgb(var(--text-primary))]'
                        : 'text-[rgb(var(--text-secondary))]'
                    )}
                  >
                    {labelText}
                  </span>
                  <span className="ml-2 text-xs tabular-nums text-[rgb(var(--text-tertiary))]">
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
          {selectedValues.size > 0 && (
            <div className="border-t border-[rgb(var(--border-secondary))] p-1">
              <button
                type="button"
                onClick={() => column.setFilterValue(undefined)}
                className="w-full px-3 py-1.5 text-xs font-medium text-center text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
              >
                {resolvedLabels.clearFilter}
              </button>
            </div>
          )}
        </PopoverPanel>
      </Transition>
    </Popover>
  )
}
