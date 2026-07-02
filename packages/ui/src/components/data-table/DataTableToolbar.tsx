import { X } from 'lucide-react'
import { type ReactNode } from 'react'
import type { Table } from '@tanstack/react-table'
import { cn } from '../../utils'
import { ToolbarSearch } from './ToolbarSearch'
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
          <ToolbarSearch
            value={searchVal}
            onChange={setSearch}
            onClear={() => setSearch('')}
            placeholder={searchPlaceholder}
            clearLabel={resolvedLabels.clearSearch}
          />
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
