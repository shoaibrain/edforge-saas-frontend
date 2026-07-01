import { type KeyboardEvent, type ReactNode } from 'react'
import { flexRender } from '@tanstack/react-table'
import type { Row, Table } from '@tanstack/react-table'
import { cn, focusRingInset } from '../../utils'
import { useDataTable } from './hooks/useDataTable'
import { DataTableColumnHeader } from './DataTableColumnHeader'
import { DataTableSkeleton } from './DataTableSkeleton'
import { DataTableEmpty } from './DataTableEmpty'
import { DataTablePagination } from './DataTablePagination'
import { DataTableToolbar } from './DataTableToolbar'
import { resolveDataTableLabels } from './labels'
import type {
  BulkAction,
  DataTableColumnMeta,
  DataTableLabels,
  DataTableProps,
  FacetedFilterConfig,
} from './types'
import { AlertCircle, RefreshCw, X } from 'lucide-react'

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
  toolbarStart,
  toolbarExtra,
  rightToolbarSlot,
  presets,
  activePreset,
  onPresetChange,
  searchValue,
  onSearchChange,
  primaryFilter,
  moreFilters,
  density: densityProp,
  enableDensityToggle,
  bulkActions,
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
    enableDensityToggle ?? (hasFacets || hasSearch || !!bulkActions?.length)

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
    showDensityToggle ||
    exportOptions
  const hasBulkActions = bulkActions && selectedRowCount > 0
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
            enableColumnVisibility={enableColumnVisibility}
            toolbarStart={toolbarStart}
            toolbarExtra={resolvedToolbarExtra}
            presets={presets}
            activePreset={activePreset}
            onPresetChange={onPresetChange}
            primaryFilter={primaryFilter}
            moreFilters={moreFilters}
            density={density}
            onDensityChange={setDensity}
            enableDensityToggle={showDensityToggle}
            exportOptions={exportOptions}
            labels={resolvedLabels}
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
                            ? 'text-right'
                            : meta?.align === 'center'
                              ? 'text-center'
                              : 'text-left',
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

      {/* Floating bulk action bar — centered above the footer, on top of the body. */}
      <FloatingBulkBar
        visible={!!hasBulkActions}
        actions={bulkActions ?? []}
        table={table}
        hasFooter={!!resolvedPagination && !isEmpty}
        labels={resolvedLabels}
      />
    </div>
  )
}

// ============================================================================
// FLOATING BULK BAR
// ============================================================================

function FloatingBulkBar<TData>({
  visible,
  actions,
  table,
  hasFooter,
  labels,
}: {
  visible: boolean
  actions: BulkAction<TData>[]
  table: Table<TData>
  hasFooter: boolean
  labels: DataTableLabels
}) {
  const selectedRows = table.getFilteredSelectedRowModel().rows.map((r) => r.original)
  const count = selectedRows.length

  return (
    <div
      aria-live="polite"
      role={visible ? 'region' : undefined}
      aria-label={visible ? labels.selectedRows(count) : undefined}
      // bottom offset matches the prototype's "58px above footer" spec;
      // inline style avoids the design-system arbitrary-spacing lint rule
      // since this magic gap is specific to this component's layout.
      style={{ bottom: hasFooter ? 68 : 16 }}
      className={cn(
        'pointer-events-none absolute left-1/2 -translate-x-1/2 z-30',
        'transition-[opacity,transform] duration-[var(--dt-duration,200ms)] ease-[var(--dt-easing,cubic-bezier(.32,.72,0,1))]',
        'motion-reduce:transition-none',
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-2'
      )}
    >
      <div
        // 58px is the prototype's bulk-bar height; inline style for the same
        // reason as the parent.
        style={{ height: 58 }}
        className={cn(
          'pointer-events-auto flex items-center gap-3 pl-4 pr-2 rounded-full',
          'bg-[rgb(var(--background-elevated))] border border-[rgb(var(--border-strong))]',
          'shadow-overlay text-sm text-[rgb(var(--text-primary))]'
        )}
      >
        <span className="font-medium tabular-nums">
          {labels.selectedRows(count)}
        </span>
        <span className="h-5 w-px bg-[rgb(var(--border-primary)/0.4)]" aria-hidden />
        <div className="flex items-center gap-1.5">
          {actions.map((action, i) => {
            const handler = action.onRun ?? action.onClick
            const tone = action.tone === 'critical' ? 'danger' : action.variant
            return (
              <button
                key={action.id ?? i}
                type="button"
                onClick={() => handler?.(selectedRows)}
                disabled={action.disabled}
                aria-label={action.label}
                title={action.label}
                className={cn(
                  'inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium rounded-full transition-colors',
                  tone === 'danger'
                    ? 'text-[rgb(var(--action-danger-bg))] hover:bg-[rgb(var(--action-danger-bg)/0.1)]'
                    : tone === 'outline'
                      ? 'border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--background-secondary))]'
                      : 'text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--background-tertiary))]',
                  action.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {action.icon}
                {action.label}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => table.toggleAllRowsSelected(false)}
            aria-label={labels.clearSelection}
            title={labels.clearSelection}
            className={cn(
              'inline-flex items-center justify-center w-9 h-9 rounded-full',
              'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-secondary))]',
              focusRingInset
            )}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
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
            ? 'bg-[var(--mint-soft)] border-l-2 border-l-[var(--mint-border)]'
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
                meta?.align === 'right' && 'text-right',
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
            className="bg-[rgb(var(--background-tertiary)/0.2)] border-l-2 border-l-[var(--mint-border)] px-4 py-3"
          >
            {renderSubComponent({ row })}
          </td>
        </tr>
      )}
    </>
  )
}
