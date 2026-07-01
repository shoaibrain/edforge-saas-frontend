import { type ReactNode } from 'react'
import type { Table } from '@tanstack/react-table'
import { X } from 'lucide-react'
import { cn, focusRingInset } from '../../utils'
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
  /** Docked status presets (handoff ③). When set, renders TablePresetTabs at the toolbar start. */
  presets?: TablePreset[]
  activePreset?: string
  onPresetChange?: (value: string) => void
  /** Bulk-action bar node; swaps in (same footprint) when `bulkActive`. */
  bulkBar?: ReactNode
  bulkActive?: boolean
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
}: DataTableToolbarProps<TData>) {
  const resolvedLabels = labels ?? DEFAULT_DATA_TABLE_LABELS

  // Bulk-action bar swaps in on selection with the same min-height footprint,
  // so there is no layout shift between the two states.
  if (bulkActive && bulkBar) {
    return <div className="min-h-9">{bulkBar}</div>
  }
  const globalFilter = (table.getState().globalFilter as string) ?? ''
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
    <div className="flex min-h-9 items-center gap-x-3 gap-y-2 flex-wrap">
      {/* Leading cluster — filters/search/facets grow and wrap among themselves */}
      <div className="flex flex-1 min-w-0 items-center gap-x-3 gap-y-2 flex-wrap">
        {/* Docked status presets (handoff ③) */}
        {presets && activePreset != null && onPresetChange ? (
          <TablePresetTabs presets={presets} active={activePreset} onChange={onPresetChange} />
        ) : null}

        {/* Leading slot (e.g. filter chips / search / selects) */}
        {toolbarStart}

        {/* Search */}
        {searchPlaceholder && (
          <div className="relative flex-1 max-w-sm min-w-40">
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
              value={globalFilter}
              onChange={(e) => {
                table.setGlobalFilter(e.target.value)
                table.setPageIndex(0)
              }}
              className={cn(
                'w-full pl-9 pr-8 py-2 h-9 text-sm rounded-lg',
                'border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))]',
                'text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))]',
                focusRingInset
              )}
            />
            {globalFilter && (
              <button
                type="button"
                onClick={() => {
                  table.setGlobalFilter('')
                  table.setPageIndex(0)
                }}
                aria-label={resolvedLabels.clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--background-secondary))]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
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
              labels={resolvedLabels}
            />
          )
        })}

        {/* Clear (N) — replaces the older "Reset" pill */}
        {isFiltered && (
          <button
            type="button"
            onClick={handleClearAll}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md',
              'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]',
              'hover:bg-[rgb(var(--background-secondary))] transition-colors'
            )}
          >
            <X className="w-3 h-3" />
            <span className="tabular-nums">
              {resolvedLabels.clearActiveFilters(activeFilterCount)}
            </span>
          </button>
        )}
      </div>

      {/* Trailing cluster — Density / View / Export / consumer extras.
          On narrow widths this cluster stays grouped and wraps as a unit. */}
      {showRightCluster && (
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          {showDensity && (
            <DataTableDensityToggle
              density={density}
              onChange={onDensityChange}
              labels={resolvedLabels}
            />
          )}
          {enableColumnVisibility && (
            <DataTableViewOptions table={table} labels={resolvedLabels} />
          )}
          {exportOptions && (
            <DataTableExport
              table={table}
              options={exportOptions}
              labels={resolvedLabels}
            />
          )}
          {toolbarExtra}
        </div>
      )}
    </div>
  )
}
