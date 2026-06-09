import { type ReactNode } from 'react'
import type { Table } from '@tanstack/react-table'
import { X } from 'lucide-react'
import { cn, focusRingInset } from '../../utils'
import { DataTableFacetedFilter } from './DataTableFacetedFilter'
import { DataTableViewOptions } from './DataTableViewOptions'
import type { FacetedFilterConfig } from './types'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchPlaceholder?: string
  facetedFilters?: FacetedFilterConfig[]
  enableColumnVisibility?: boolean
  toolbarStart?: ReactNode
  toolbarExtra?: ReactNode
}

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder,
  facetedFilters,
  enableColumnVisibility,
  toolbarStart,
  toolbarExtra,
}: DataTableToolbarProps<TData>) {
  const isFiltered =
    table.getState().columnFilters.length > 0 ||
    !!(table.getState().globalFilter as string)

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Leading slot (e.g. filter chips / search / selects) */}
      {toolbarStart}

      {/* Search */}
      {searchPlaceholder && (
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={(table.getState().globalFilter as string) ?? ''}
            onChange={(e) => {
              table.setGlobalFilter(e.target.value)
              table.setPageIndex(0)
            }}
            className={cn(
              'w-full pl-9 pr-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))]',
              focusRingInset
            )}
          />
        </div>
      )}

      {/* Faceted Filters */}
      {facetedFilters?.map((filter) => {
        const column = table.getColumn(filter.columnId)
        if (!column) return null
        return (
          <DataTableFacetedFilter
            key={filter.columnId}
            column={column}
            title={filter.title}
            options={filter.options}
          />
        )
      })}

      {/* Reset Button */}
      {isFiltered && (
        <button
          type="button"
          onClick={() => {
            table.resetColumnFilters()
            table.setGlobalFilter('')
            table.setPageIndex(0)
          }}
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium rounded-lg',
            'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--background-secondary))] transition-colors'
          )}
        >
          Reset
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Column Visibility */}
      {enableColumnVisibility && <DataTableViewOptions table={table} />}

      {/* Extra Actions */}
      {toolbarExtra}
    </div>
  )
}
