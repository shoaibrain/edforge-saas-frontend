import { Fragment } from 'react'
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react'
import { SlidersHorizontal } from 'lucide-react'
import type { Table } from '@tanstack/react-table'

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  const columns = table
    .getAllColumns()
    .filter((col) => col.getCanHide())

  if (columns.length === 0) return null

  return (
    <Popover className="relative">
      <PopoverButton className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-secondary))] transition-colors">
        <SlidersHorizontal className="w-3.5 h-3.5" />
        View
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
        <PopoverPanel className="absolute right-0 z-50 mt-1 w-48 origin-top-right rounded-xl bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-primary))] shadow-lg focus:outline-none overflow-hidden">
          <div className="px-3 py-2 border-b border-[rgb(var(--border-secondary))]">
            <span className="text-xs font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider">
              Toggle columns
            </span>
          </div>
          <div className="py-1 max-h-64 overflow-y-auto">
            {columns.map((column) => (
              <label
                key={column.id}
                className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-[rgb(var(--surface-secondary))] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={column.getIsVisible()}
                  onChange={column.getToggleVisibilityHandler()}
                  className="w-3.5 h-3.5 rounded border-[rgb(var(--border-primary))] text-teal-500 focus:ring-teal-500/30 mr-2.5"
                />
                <span className="text-[rgb(var(--text-primary))] capitalize">
                  {typeof column.columnDef.header === 'string'
                    ? column.columnDef.header
                    : column.id}
                </span>
              </label>
            ))}
          </div>
        </PopoverPanel>
      </Transition>
    </Popover>
  )
}
