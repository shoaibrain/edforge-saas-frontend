import { X } from 'lucide-react'
import { type ReactNode } from 'react'
import type { Table } from '@tanstack/react-table'
import { cn } from '../../utils'
import { ToolbarSearch } from './ToolbarSearch'
import { DataTableFacetedFilter } from './DataTableFacetedFilter'
import { DataTableViewOptions } from './DataTableViewOptions'
import { DataTableExport } from './DataTableExport'
import { DataTableMoreFilters } from './DataTableMoreFilters'
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
  /** Keep the first faceted filter inline and move the rest into "More filters". */
  foldFacets?: boolean
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
  /** Primary facet control shown inline; folds into the overflow below @4xl. */
  primaryFilter?: ReactNode
  /** Secondary controls the toolbar places in its OWN "More filters" overflow. */
  overflowFilters?: ReactNode
  overflowActiveCount?: number
  onOverflowClear?: () => void
  overflowLabel?: string
  overflowClearLabel?: string
  /** @deprecated Prefer `overflowFilters`; a pre-built popover is rendered inline. */
  moreFilters?: ReactNode
}

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder,
  facetedFilters,
  foldFacets,
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
  overflowFilters,
  overflowActiveCount,
  onOverflowClear,
  overflowLabel,
  overflowClearLabel,
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
  const showView = enableColumnVisibility || showDensity
  const showRightCluster = showView || toolbarExtra || exportOptions

  // The toolbar owns ONE "More filters" overflow when there are secondary
  // controls and/or a primary filter that folds in on narrow widths. The
  // primary filter is rendered inline (@4xl+) AND inside the overflow panel
  // (< @4xl) — both are controlled and mirror the same state. The overflow
  // trigger stays hidden while everything it holds is shown inline.
  // With `foldFacets`, the first faceted filter stays inline; the rest move
  // into the overflow so the toolbar shows "one facet + More filters".
  const facets = facetedFilters ?? []
  const inlineFacets = foldFacets ? facets.slice(0, 1) : facets
  const overflowFacets = foldFacets ? facets.slice(1) : []
  const hasPrimary = !!primaryFilter
  const hasOverflowContent = !!overflowFilters || overflowFacets.length > 0
  const showOverflow = hasPrimary || hasOverflowContent
  // Trigger visibility: always when it permanently holds overflow content;
  // otherwise only below @4xl (when the folded primary appears in the panel).
  const overflowTriggerClass = hasOverflowContent ? '' : '@4xl:hidden'

  return (
    <div className="@container flex min-h-9 flex-wrap items-center gap-x-3 gap-y-2">
      {/* Leading cluster — search · presets · primary facet · More filters */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
        {toolbarStart}

        {/* Unified search — fluid: absorbs slack, shrinks instead of wrapping */}
        {searchPlaceholder && (
          <ToolbarSearch
            value={searchVal}
            onChange={setSearch}
            onClear={() => setSearch('')}
            placeholder={searchPlaceholder}
            clearLabel={resolvedLabels.clearSearch}
          />
        )}

        {/* Docked status presets — scroll horizontally rather than wrap */}
        {presets && activePreset != null && onPresetChange ? (
          <div className="min-w-0 max-w-full overflow-x-auto">
            <TablePresetTabs presets={presets} active={activePreset} onChange={onPresetChange} />
          </div>
        ) : null}

        {/* Primary facet — inline at @4xl+, folded into the overflow below */}
        {hasPrimary && <div className="hidden @4xl:flex">{primaryFilter}</div>}

        {/* Client-side faceted filters (TanStack columns), shown inline */}
        {inlineFacets.map((filter) => {
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

        {/* Toolbar-owned "More filters" overflow (single trigger) */}
        {showOverflow && (
          <div className={overflowTriggerClass}>
            <DataTableMoreFilters
              label={overflowLabel ?? resolvedLabels.moreFilters}
              clearLabel={overflowClearLabel ?? resolvedLabels.clearFilters}
              activeCount={overflowActiveCount ?? 0}
              onClear={onOverflowClear}
            >
              {/* Folded primary — only visible in the panel below @4xl */}
              {hasPrimary && <div className="flex @4xl:hidden">{primaryFilter}</div>}
              {/* Folded faceted filters (kept out of the inline row) */}
              {overflowFacets.map((filter) => {
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
              {overflowFilters}
            </DataTableMoreFilters>
          </div>
        )}

        {/* Deprecated: pre-built popover passed inline (back-compat) */}
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

      {/* Trailing cluster — View (density + columns) · Export · consumer extras */}
      {showRightCluster && (
        <div className="ml-auto flex flex-shrink-0 items-center gap-2">
          {showView && (
            <DataTableViewOptions
              table={table}
              labels={resolvedLabels}
              density={density}
              onDensityChange={onDensityChange}
              enableDensityToggle={showDensity}
            />
          )}
          {exportOptions && (
            <DataTableExport table={table} options={exportOptions} labels={resolvedLabels} />
          )}
          {toolbarExtra}
        </div>
      )}
    </div>
  )
}
