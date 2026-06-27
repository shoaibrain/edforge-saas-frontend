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
import type { DataTableProps, DataTableColumnMeta } from './types'
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
  enableSorting = false,
  onSortingChange,
  enableColumnFilters = false,
  enableColumnVisibility = false,
  tableId: _tableId,
  initialColumnVisibility,
  enableRowSelection = false,
  rowSelection,
  onRowSelectionChange,
  enableExpanding = false,
  renderSubComponent,
  onRowClick,
  searchPlaceholder,
  facetedFilters,
  toolbarStart,
  toolbarExtra,
  bulkActions,
  className,
  maxHeight,
}: DataTableProps<TData>) {
  const table = useDataTable<TData>({
    data,
    columns,
    getRowId,
    enableSorting,
    enableColumnFilters: enableColumnFilters || !!facetedFilters?.length || !!searchPlaceholder,
    enableRowSelection,
    enableExpanding,
    onSortingChange,
    rowSelection,
    onRowSelectionChange,
    initialColumnVisibility,
    pagination,
  })

  // Loading skeleton
  if (isLoading) {
    return (
      <DataTableSkeleton
        columnCount={columns.length}
        rowCount={pagination?.pageSize ? Math.min(pagination.pageSize, 8) : 5}
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
          Failed to load data
        </h3>
        <p className="text-sm text-[rgb(var(--text-secondary))] mb-4 max-w-sm">
          {error.message || 'An unexpected error occurred.'}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] rounded-lg hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        )}
      </div>
    )
  }

  const selectedRowCount = Object.keys(
    table.getState().rowSelection
  ).length

  const hasToolbar = searchPlaceholder || facetedFilters?.length || enableColumnVisibility || toolbarExtra || toolbarStart
  const hasBulkActions = bulkActions && selectedRowCount > 0
  // Empty body is rendered INSIDE the card so a toolbar (filters/search) stays
  // visible above it — otherwise a search that returns nothing would hide its
  // own search box. Without a toolbar, render the empty state as a standalone card.
  const isEmpty = data.length === 0 && !!emptyState && !isLoading
  if (isEmpty && !hasToolbar) {
    return <DataTableEmpty config={emptyState} className={className} />
  }

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border border-[rgb(var(--border-primary)/0.5)] shadow-[0_1px_3px_0_rgb(0_0_0/0.08),0_1px_2px_-1px_rgb(0_0_0/0.08)] bg-[rgb(var(--background-secondary))] overflow-hidden',
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
            facetedFilters={facetedFilters}
            enableColumnVisibility={enableColumnVisibility}
            toolbarStart={toolbarStart}
            toolbarExtra={toolbarExtra}
          />
        </div>
      )}

      {/* Bulk Actions Bar — outside scroll area */}
      {hasBulkActions && (
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 bg-[rgb(var(--state-info-bg)/0.18)] border-b border-[rgb(var(--state-info-border)/0.35)]">
          <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
            {selectedRowCount} selected
          </span>
          <div className="flex items-center gap-2">
            {bulkActions!.map((action, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const selectedRows = table
                    .getFilteredSelectedRowModel()
                    .rows.map((r) => r.original)
                  action.onClick(selectedRows)
                }}
                disabled={action.disabled}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  action.variant === 'danger'
                    ? 'bg-[rgb(var(--action-danger-bg))] text-[rgb(var(--action-danger-fg))] hover:brightness-95'
                    : action.variant === 'outline'
                      ? 'border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--background-secondary))]'
                      : 'bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] hover:bg-[rgb(var(--action-primary-bg-hover))]',
                  action.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => table.toggleAllRowsSelected(false)}
            className="ml-auto text-xs text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
          >
            Deselect all
          </button>
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
          <DataTableEmpty config={emptyState} bare />
        ) : (
        <table className="w-full" role="grid" style={{ tableLayout: 'fixed' }}>
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-[rgb(var(--border-primary)/0.3)] bg-[rgb(var(--background-tertiary))] shadow-[0_1px_3px_-1px_rgb(0_0_0/0.1)]"
              >
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef
                    .meta as DataTableColumnMeta | undefined
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
                        'px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))]',
                        meta?.align === 'right'
                          ? 'text-right'
                          : meta?.align === 'center'
                            ? 'text-center'
                            : 'text-left'
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
      {pagination && !isEmpty && (
        <div className="flex-shrink-0">
          <DataTablePagination
            table={table}
            totalCount={totalCount}
            pageSizeOptions={pagination.pageSizeOptions}
            serverPagination={serverPagination}
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
        className={cn(
          'border-b border-[rgb(var(--border-secondary)/0.7)] last:border-b-0 transition-colors duration-150',
          isSelected
            ? 'bg-[rgb(var(--state-info-bg)/0.18)] border-l-2 border-l-[rgb(var(--border-focus))]'
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
          const meta = cell.column.columnDef
            .meta as DataTableColumnMeta | undefined
          return (
            <td
              key={cell.id}
              className={cn(
                'px-4 py-2.5 text-sm text-[rgb(var(--text-primary))]',
                meta?.align === 'right' && 'text-right',
                meta?.align === 'center' && 'text-center'
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
            className="bg-[rgb(var(--background-tertiary)/0.2)] border-l-2 border-l-teal-500/30 px-4 py-3"
          >
            {renderSubComponent({ row })}
          </td>
        </tr>
      )}
    </>
  )
}
