import { type KeyboardEvent, type ReactNode } from 'react'
import { flexRender } from '@tanstack/react-table'
import type { Row } from '@tanstack/react-table'
import { cn, focusRingInset } from '../../utils'
import { useDataTable } from './hooks/useDataTable'
import { DataTableColumnHeader } from './DataTableColumnHeader'
import { DataTableSkeleton } from './DataTableSkeleton'
import { DataTableEmpty } from './DataTableEmpty'
import { DataTablePagination } from './DataTablePagination'
import { DataTableToolbar } from './DataTableToolbar'
import { resolveDataTableLabels } from './labels'
import type {
  DataTableColumnMeta,
  DataTableProps,
  FacetedFilterConfig,
} from './types'
import { AlertCircle, RefreshCw } from 'lucide-react'

export function DataTable<TData>({
  columns,
  data,
  getRowId,
  isLoading = false,
  isFetching = false,
  error,
  onRetry,
  emptyState,
  pagination,
  totalCount,
  serverPagination,
  pageSizes,
  enableSorting = false,
  onSortingChange,
  defaultSort,
  enableColumnFilters = false,
  enableColumnVisibility = false,
  tableId,
  initialColumnVisibility,
  enableRowSelection = false,
  rowSelection,
  onRowSelectionChange,
  enableExpanding = false,
  renderSubComponent,
  onRowClick,
  searchPlaceholder,
  facetedFilters,
  facets,
  foldFacets,
  toolbarStart,
  toolbarExtra,
  rightToolbarSlot,
  presets,
  activePreset,
  onPresetChange,
  presetsLabel,
  searchValue,
  onSearchChange,
  primaryFilter,
  moreFilters,
  overflowFilters,
  overflowActiveCount,
  onOverflowClear,
  overflowLabel,
  overflowClearLabel,
  density: densityProp,
  enableDensityToggle,
  selectionBar,
  exportOptions,
  labels,
  className,
  maxHeight,
}: DataTableProps<TData>) {
  const resolvedLabels = resolveDataTableLabels(labels)
  // Resolve prototype-shaped aliases onto the canonical props.
  const resolvedFacets: FacetedFilterConfig[] | undefined =
    facets ?? facetedFilters
  const resolvedToolbarExtra: ReactNode = toolbarExtra ?? rightToolbarSlot
  const resolvedPagination = pagination
    ? {
        ...pagination,
        pageSizeOptions:
          pagination.pageSizeOptions ?? pageSizes ?? undefined,
      }
    : pageSizes
      ? { pageSizeOptions: pageSizes }
      : undefined

  const hasFacets = !!resolvedFacets?.length
  const hasSearch = !!searchPlaceholder
  const showDensityToggle =
    enableDensityToggle ?? (hasFacets || hasSearch || !!selectionBar)

  const { table, density, setDensity } = useDataTable<TData>({
    data,
    columns,
    getRowId,
    enableSorting,
    enableColumnFilters: enableColumnFilters || hasFacets || hasSearch,
    enableFaceted: hasFacets,
    enableRowSelection,
    enableExpanding,
    onSortingChange,
    rowSelection,
    onRowSelectionChange,
    initialColumnVisibility,
    pagination: resolvedPagination,
    tableId,
    defaultSort,
    initialDensity: densityProp,
  })

  // Loading skeleton
  if (isLoading) {
    return (
      <DataTableSkeleton
        columnCount={columns.length}
        rowCount={
          resolvedPagination?.pageSize ? Math.min(resolvedPagination.pageSize, 8) : 5
        }
        className={className}
      />
    )
  }

  // Error state (no data)
  if (error && data.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-[rgb(var(--border-primary)/0.5)] shadow-[0_1px_3px_0_rgb(0_0_0/0.08),0_1px_2px_-1px_rgb(0_0_0/0.08)] bg-[rgb(var(--background-primary))]',
          className
        )}
      >
        <AlertCircle className="w-10 h-10 text-[rgb(var(--state-danger-fg))] mb-3" />
        <h3 className="text-lg font-medium text-[rgb(var(--text-primary))] mb-2">
          {resolvedLabels.errorTitle}
        </h3>
        <p className="text-sm text-[rgb(var(--text-secondary))] mb-4 max-w-sm">
          {error.message || resolvedLabels.errorDescription}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] rounded-lg hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {resolvedLabels.retry}
          </button>
        )}
      </div>
    )
  }

  const selectedRowCount = Object.keys(table.getState().rowSelection).length

  const hasToolbar =
    hasSearch ||
    hasFacets ||
    enableColumnVisibility ||
    resolvedToolbarExtra ||
    toolbarStart ||
    presets ||
    primaryFilter ||
    moreFilters ||
    overflowFilters ||
    showDensityToggle ||
    exportOptions
  // ⑨ Selection Context Bar: morphs the toolbar in place on selection.
  // (The legacy floating bulk pill is gone — this is the only bulk surface.)
  const selectionBarActive = !!selectionBar && selectedRowCount > 0
  const activeFilterCount =
    table.getState().columnFilters.length +
    (((table.getState().globalFilter as string) ?? '') ? 1 : 0)
  const isFiltered = activeFilterCount > 0

  // Empty body is rendered INSIDE the card so a toolbar (filters/search) stays
  // visible above it — otherwise a search that returns nothing would hide its
  // own search box. Without a toolbar, render the empty state as a standalone card.
  const isEmpty = data.length === 0 && !!emptyState && !isLoading
  const handleClearFilters = () => {
    table.resetColumnFilters()
    table.setGlobalFilter('')
    table.setPageIndex(0)
  }

  if (isEmpty && !hasToolbar) {
    return (
      <DataTableEmpty
        config={emptyState}
        className={className}
        onClearFilters={isFiltered ? handleClearFilters : undefined}
        labels={resolvedLabels}
      />
    )
  }

  return (
    <div
      data-density={density}
      className={cn(
        'relative flex flex-col rounded-xl border border-[rgb(var(--border-primary)/0.5)] shadow-[0_1px_3px_0_rgb(0_0_0/0.08),0_1px_2px_-1px_rgb(0_0_0/0.08)] bg-[rgb(var(--background-secondary))] overflow-hidden',
        className
      )}
      style={maxHeight ? { maxHeight, height: maxHeight } : undefined}
    >
      {/* Toolbar — outside scroll area */}
      {hasToolbar && (
        <div className="flex-shrink-0 px-4 py-3 border-b border-[rgb(var(--border-primary)/0.3)]">
          <DataTableToolbar
            table={table}
            searchPlaceholder={searchPlaceholder}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            facetedFilters={resolvedFacets}
            foldFacets={foldFacets}
            enableColumnVisibility={enableColumnVisibility}
            toolbarStart={toolbarStart}
            toolbarExtra={resolvedToolbarExtra}
            presets={presets}
            activePreset={activePreset}
            onPresetChange={onPresetChange}
            presetsLabel={presetsLabel}
            primaryFilter={primaryFilter}
            moreFilters={moreFilters}
            overflowFilters={overflowFilters}
            overflowActiveCount={overflowActiveCount}
            onOverflowClear={onOverflowClear}
            overflowLabel={overflowLabel}
            overflowClearLabel={overflowClearLabel}
            density={density}
            onDensityChange={setDensity}
            enableDensityToggle={showDensityToggle}
            exportOptions={exportOptions}
            labels={resolvedLabels}
            bulkBar={selectionBar}
            bulkActive={selectionBarActive}
          />
        </div>
      )}

      {/* Scrollable table area — flex-1 fills remaining height */}
      <div className="flex-1 min-h-0 overflow-auto scrollbar-thin">
        {/* Fetching progress bar — sticky at top of scroll area */}
        {isFetching && data.length > 0 && (
          <div className="sticky top-0 z-20">
            <div className="h-0.5 w-full bg-[rgb(var(--background-tertiary))] overflow-hidden">
              <div className="h-full w-1/3 bg-[rgb(var(--action-primary-bg))] animate-shimmer" />
            </div>
          </div>
        )}

        {isEmpty && emptyState ? (
          <DataTableEmpty
            config={emptyState}
            bare
            onClearFilters={isFiltered ? handleClearFilters : undefined}
            labels={resolvedLabels}
          />
        ) : (
          <table className="w-full" role="grid" style={{ tableLayout: 'fixed' }}>
            <thead className="sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-[rgb(var(--border-primary)/0.3)] bg-[rgb(var(--background-tertiary))] shadow-[0_1px_3px_-1px_rgb(0_0_0/0.1)]"
                >
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta as
                      | DataTableColumnMeta
                      | undefined
                    const sorted = header.column.getIsSorted()
                    const ariaSort = header.column.getCanSort()
                      ? sorted === 'asc'
                        ? 'ascending'
                        : sorted === 'desc'
                          ? 'descending'
                          : 'none'
                      : undefined
                    return (
                      <th
                        key={header.id}
                        scope="col"
                        aria-sort={ariaSort}
                        className={cn(
                          'px-4 text-2xs font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))]',
                          'h-[var(--dt-header-h-comfortable)] [[data-density=compact]_&]:h-[var(--dt-header-h-compact)]',
                          meta?.align === 'right'
                            ? 'text-end'
                            : meta?.align === 'center'
                              ? 'text-center'
                              : 'text-start',
                          meta?.className
                        )}
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : header.column.getCanSort()
                            ? (
                                <DataTableColumnHeader
                                  column={header.column}
                                  title={
                                    typeof header.column.columnDef.header === 'string'
                                      ? header.column.columnDef.header
                                      : header.id
                                  }
                                />
                              )
                            : (
                                flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )
                              )}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody className={cn(isFetching && 'opacity-60 transition-opacity')}>
              {table.getRowModel().rows.map((row, rowIndex) => (
                <TableRowWithExpansion
                  key={row.id}
                  row={row}
                  rowIndex={rowIndex}
                  onRowClick={onRowClick}
                  enableExpanding={enableExpanding}
                  renderSubComponent={renderSubComponent}
                  visibleCellCount={table.getVisibleFlatColumns().length}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination — hidden under the empty state */}
      {resolvedPagination && !isEmpty && (
        <div className="flex-shrink-0">
          <DataTablePagination
            table={table}
            totalCount={totalCount}
            pageSizeOptions={resolvedPagination.pageSizeOptions}
            serverPagination={serverPagination}
            labels={resolvedLabels}
          />
        </div>
      )}

    </div>
  )
}

// ============================================================================
// TABLE ROW (with expansion support)
// ============================================================================

function TableRowWithExpansion<TData>({
  row,
  rowIndex,
  onRowClick,
  enableExpanding,
  renderSubComponent,
  visibleCellCount,
}: {
  row: Row<TData>
  rowIndex: number
  onRowClick?: (row: TData) => void
  enableExpanding: boolean
  renderSubComponent?: (props: { row: Row<TData> }) => ReactNode
  visibleCellCount: number
}) {
  const isSelected = row.getIsSelected()
  const isExpanded = enableExpanding && row.getIsExpanded()
  const isEvenRow = rowIndex % 2 === 0
  const isInteractive = typeof onRowClick === 'function'

  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (!isInteractive) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onRowClick(row.original)
    }
  }

  return (
    <>
      <tr
        role={isInteractive ? 'button' : undefined}
        className={cn(
          'border-b border-[rgb(var(--border-secondary)/0.7)] last:border-b-0',
          'transition-colors duration-[var(--motion-duration-fast)]',
          'motion-reduce:transition-none',
          isSelected
            ? 'bg-[var(--mint-soft)] border-s-2 border-s-[var(--mint-border)]'
            : isEvenRow
              ? 'bg-[rgb(var(--background-tertiary)/0.35)]'
              : '',
          !isSelected && isInteractive && ['cursor-pointer', focusRingInset],
          !isSelected && 'hover:bg-[rgb(var(--action-primary-bg)/0.06)]',
          isExpanded && 'border-b-0'
        )}
        onClick={isInteractive ? () => onRowClick(row.original) : undefined}
        onKeyDown={handleKeyDown}
        tabIndex={isInteractive ? 0 : undefined}
        data-state={isSelected ? 'selected' : undefined}
        aria-selected={isSelected || undefined}
      >
        {row.getVisibleCells().map((cell) => {
          const meta = cell.column.columnDef.meta as
            | DataTableColumnMeta
            | undefined
          return (
            <td
              key={cell.id}
              className={cn(
                'px-4 text-sm text-[rgb(var(--text-primary))]',
                'h-[var(--dt-row-h-comfortable)] [[data-density=compact]_&]:h-[var(--dt-row-h-compact)]',
                meta?.align === 'right' && 'text-end',
                meta?.align === 'center' && 'text-center',
                meta?.className
              )}
              style={{ width: cell.column.getSize() }}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          )
        })}
      </tr>
      {/* Expanded sub-component */}
      {isExpanded && renderSubComponent && (
        <tr className="border-b border-[rgb(var(--border-secondary)/0.7)]">
          <td
            colSpan={visibleCellCount}
            className="bg-[rgb(var(--background-tertiary)/0.2)] border-s-2 border-s-[var(--mint-border)] px-4 py-3"
          >
            {renderSubComponent({ row })}
          </td>
        </tr>
      )}
    </>
  )
}
