import { Search, X } from 'lucide-react'
import { type ReactNode } from 'react'
import type { Table } from '@tanstack/react-table'
import { cn } from '../../utils'
import { DataTableFacetedFilter } from './DataTableFacetedFilter'
import { DataTableViewOptions } from './DataTableViewOptions'
import { DataTableDensityToggle } from './DataTableDensityToggle'
import { DataTableExport } from './DataTableExport'
import { TablePresetTabs, type TablePreset } from './TablePresetTabs'
import { DEFAULT_DATA_TABLE_LABELS } from './labels'
import type {
  DataTableDensity,
  DataTableExportOptions,
  DataTableLabels,
  FacetedFilterConfig,
} from './types'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchPlaceholder?: string
  facetedFilters?: FacetedFilterConfig[]
  enableColumnVisibility?: boolean
  toolbarStart?: ReactNode
  toolbarExtra?: ReactNode
  density?: DataTableDensity
  onDensityChange?: (next: DataTableDensity) => void
  enableDensityToggle?: boolean
  exportOptions?: DataTableExportOptions
  labels?: DataTableLabels
  /** Docked status presets (handoff ③). When set, renders TablePresetTabs. */
  presets?: TablePreset[]
  activePreset?: string
  onPresetChange?: (value: string) => void
  /** Bulk-action bar node; swaps in (same footprint) when `bulkActive`. */
  bulkBar?: ReactNode
  bulkActive?: boolean
  /**
   * Controlled search. When `onSearchChange` is provided the input is
   * controlled (server-side-filtered pages wire it to their store); otherwise
   * the input drives the table's global filter (client-side pages).
   */
  searchValue?: string
  onSearchChange?: (value: string) => void
  /** Primary facet control shown inline (e.g. a Grade/Subject/Type dropdown). */
  primaryFilter?: ReactNode
  /** Secondary filters, typically wrapped in <DataTableMoreFilters>. */
  moreFilters?: ReactNode
}

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder,
  facetedFilters,
  enableColumnVisibility,
  toolbarStart,
  toolbarExtra,
  density,
  onDensityChange,
  enableDensityToggle,
  exportOptions,
  labels,
  presets,
  activePreset,
  onPresetChange,
  bulkBar,
  bulkActive,
  searchValue,
  onSearchChange,
  primaryFilter,
  moreFilters,
}: DataTableToolbarProps<TData>) {
  const resolvedLabels = labels ?? DEFAULT_DATA_TABLE_LABELS

  // Bulk-action bar swaps in on selection with the same min-height footprint,
  // so there is no layout shift between the two states.
  if (bulkActive && bulkBar) {
    return <div className="min-h-9">{bulkBar}</div>
  }

  // Search can be controlled (server-side pages) or drive the table's global
  // filter (client-side pages).
  const controlledSearch = typeof onSearchChange === 'function'
  const globalFilter = (table.getState().globalFilter as string) ?? ''
  const searchVal = controlledSearch ? (searchValue ?? '') : globalFilter
  const setSearch = (value: string) => {
    if (controlledSearch) {
      onSearchChange?.(value)
    } else {
      table.setGlobalFilter(value)
      table.setPageIndex(0)
    }
  }

  const activeFilterCount =
    table.getState().columnFilters.length + (globalFilter ? 1 : 0)
  const isFiltered = activeFilterCount > 0

  const handleClearAll = () => {
    table.resetColumnFilters()
    table.setGlobalFilter('')
    table.setPageIndex(0)
  }

  const showDensity = !!(enableDensityToggle && density && onDensityChange)
  const showRightCluster =
    enableColumnVisibility || toolbarExtra || showDensity || exportOptions

  return (
    <div className="flex min-h-9 flex-wrap items-center gap-x-3 gap-y-2">
      {/* Leading cluster — prototype order: [start] search · presets · facet · more filters */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
        {toolbarStart}

        {/* Unified search — one clean field, consistent width across pages */}
        {searchPlaceholder && (
          <div className="relative w-72 max-w-full flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-tertiary))]" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchVal}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                // physical padding (pl/pr) — logical ps/pe does not render in this build
                'h-9 w-full rounded-lg pl-9 pr-9 text-sm',
                'border border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-primary))]',
                'text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))]',
                'focus:border-[var(--mint-border)] focus:outline-none focus:ring-2 focus:ring-[var(--mint-soft)]',
              )}
            />
            {searchVal ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label={resolvedLabels.clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[rgb(var(--text-tertiary))] hover:bg-[rgb(var(--background-secondary))] hover:text-[rgb(var(--text-primary))]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd
                aria-hidden="true"
                className="absolute right-2 top-1/2 grid h-5 min-w-5 -translate-y-1/2 place-items-center rounded border border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-tertiary))] px-1.5 font-mono text-2xs font-semibold text-[rgb(var(--text-tertiary))]"
              >
                /
              </kbd>
            )}
          </div>
        )}

        {/* Docked status presets */}
        {presets && activePreset != null && onPresetChange ? (
          <TablePresetTabs presets={presets} active={activePreset} onChange={onPresetChange} />
        ) : null}

        {/* Primary facet (inline) */}
        {primaryFilter}

        {/* Client-side faceted filters (TanStack columns) */}
        {facetedFilters?.map((filter) => {
          const column = table.getColumn(filter.columnId)
          if (!column) return null
          return (
            <DataTableFacetedFilter
              key={filter.columnId}
              column={column}
              title={filter.title}
              options={filter.options}
              labels={resolvedLabels}
            />
          )
        })}

        {/* Secondary filters ("More filters" popover) */}
        {moreFilters}

        {/* Clear (N) — client-side facet/search reset */}
        {isFiltered && (
          <button
            type="button"
            onClick={handleClearAll}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium',
              'text-[rgb(var(--text-secondary))] transition-colors hover:text-[rgb(var(--text-primary))]',
              'hover:bg-[rgb(var(--background-secondary))]',
            )}
          >
            <X className="h-3 w-3" />
            <span className="tabular-nums">{resolvedLabels.clearActiveFilters(activeFilterCount)}</span>
          </button>
        )}
      </div>

      {/* Trailing cluster — Density / View / Export / consumer extras. */}
      {showRightCluster && (
        <div className="ml-auto flex flex-shrink-0 items-center gap-2">
          {showDensity && (
            <DataTableDensityToggle density={density} onChange={onDensityChange} labels={resolvedLabels} />
          )}
          {enableColumnVisibility && <DataTableViewOptions table={table} labels={resolvedLabels} />}
          {exportOptions && (
            <DataTableExport table={table} options={exportOptions} labels={resolvedLabels} />
          )}
          {toolbarExtra}
        </div>
      )}
    </div>
  )
}
