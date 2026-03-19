import { Fragment } from 'react'
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react'
import { Check, ListFilter } from 'lucide-react'
import type { Column } from '@tanstack/react-table'
import { cn } from '../../utils'
import type { FacetedFilterOption } from './types'

interface DataTableFacetedFilterProps<TData> {
  column: Column<TData>
  title: string
  options: FacetedFilterOption[]
}

export function DataTableFacetedFilter<TData>({
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData>) {
  const selectedValues = new Set(
    (column.getFilterValue() as string[] | undefined) ?? []
  )

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
          'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors',
          selectedValues.size > 0
            ? 'border-teal-500/30 bg-teal-500/10 text-[rgb(var(--text-primary))]'
            : 'border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-secondary))]'
        )}
      >
        <ListFilter className="w-3.5 h-3.5" />
        {title}
        {selectedValues.size > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-teal-500 text-white">
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
        <PopoverPanel className="absolute z-50 mt-1 w-56 origin-top-left rounded-xl bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-primary))] shadow-lg focus:outline-none overflow-hidden">
          <div className="py-1 max-h-64 overflow-y-auto">
            {options.map((option) => {
              const isSelected = selectedValues.has(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleValue(option.value)}
                  className={cn(
                    'flex items-center w-full px-3 py-2 text-sm transition-colors',
                    'hover:bg-[rgb(var(--surface-secondary))]',
                    isSelected && 'text-teal-500'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-4 h-4 rounded border mr-2.5 flex-shrink-0',
                      isSelected
                        ? 'bg-teal-500 border-teal-500'
                        : 'border-[rgb(var(--border-primary))]'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  {option.icon && (
                    <span className="flex-shrink-0 mr-2">{option.icon}</span>
                  )}
                  <span className={cn(
                    'text-left',
                    isSelected
                      ? 'text-[rgb(var(--text-primary))] font-medium'
                      : 'text-[rgb(var(--text-secondary))]'
                  )}>
                    {option.label}
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
                Clear filter
              </button>
            </div>
          )}
        </PopoverPanel>
      </Transition>
    </Popover>
  )
}
