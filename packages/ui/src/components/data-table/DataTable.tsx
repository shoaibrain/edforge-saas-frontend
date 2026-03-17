import { type ReactNode } from 'react'
import { flexRender } from '@tanstack/react-table'
import type { Row } from '@tanstack/react-table'
import { cn } from '../../utils'
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
  toolbarExtra,
  bulkActions,
  className,
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
          'flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-[rgb(var(--border-primary)/0.6)] shadow-sm bg-[rgb(var(--surface-primary))]',
          className
        )}
      >
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
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
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        )}
      </div>
    )
  }

  // Empty state
  if (data.length === 0 && emptyState && !isLoading) {
    return <DataTableEmpty config={emptyState} className={className} />
  }

  const selectedRowCount = Object.keys(
    table.getState().rowSelection
  ).length

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      {(searchPlaceholder || facetedFilters?.length || enableColumnVisibility || toolbarExtra) && (
        <DataTableToolbar
          table={table}
          searchPlaceholder={searchPlaceholder}
          facetedFilters={facetedFilters}
          enableColumnVisibility={enableColumnVisibility}
          toolbarExtra={toolbarExtra}
        />
      )}

      {/* Bulk Actions Bar */}
      {bulkActions && selectedRowCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-teal-500/10 border border-teal-500/20">
          <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
            {selectedRowCount} selected
          </span>
          <div className="flex items-center gap-2">
            {bulkActions.map((action, i) => (
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
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : action.variant === 'outline'
                      ? 'border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-secondary))]'
                      : 'bg-teal-600 text-white hover:bg-teal-700',
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

      {/* Table Container */}
      <div className="rounded-xl border border-[rgb(var(--border-primary)/0.6)] shadow-sm bg-[rgb(var(--surface-primary))] overflow-hidden relative">
        {/* Fetching overlay */}
        {isFetching && data.length > 0 && (
          <div className="absolute inset-x-0 top-0 z-10">
            <div className="h-0.5 w-full bg-[rgb(var(--surface-tertiary))] overflow-hidden">
              <div className="h-full w-1/3 bg-teal-500 animate-[shimmer_1.5s_infinite]" style={{
                animation: 'shimmer 1.5s infinite',
              }} />
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full" role="grid">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-[rgb(var(--border-secondary))] bg-[rgb(var(--surface-tertiary)/0.5)]"
                >
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef
                      .meta as DataTableColumnMeta | undefined
                    return (
                      <th
                        key={header.id}
                        className={cn(
                          'px-6 py-3',
                          meta?.align === 'right'
                            ? 'text-right'
                            : meta?.align === 'center'
                              ? 'text-center'
                              : 'text-left'
                        )}
                        style={{
                          width: header.getSize() !== 150 ? header.getSize() : undefined,
                        }}
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
              {table.getRowModel().rows.map((row) => (
                <TableRowWithExpansion
                  key={row.id}
                  row={row}
                  onRowClick={onRowClick}
                  enableExpanding={enableExpanding}
                  renderSubComponent={renderSubComponent}
                  visibleCellCount={table.getVisibleFlatColumns().length}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && table.getPageCount() > 1 && (
          <DataTablePagination
            table={table}
            totalCount={totalCount}
            pageSizeOptions={pagination.pageSizeOptions}
          />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// TABLE ROW (with expansion support)
// ============================================================================

function TableRowWithExpansion<TData>({
  row,
  onRowClick,
  enableExpanding,
  renderSubComponent,
  visibleCellCount,
}: {
  row: Row<TData>
  onRowClick?: (row: TData) => void
  enableExpanding: boolean
  renderSubComponent?: (props: { row: Row<TData> }) => ReactNode
  visibleCellCount: number
}) {
  const isSelected = row.getIsSelected()

  return (
    <>
      <tr
        className={cn(
          'border-b border-[rgb(var(--border-secondary))] last:border-b-0 transition-colors',
          isSelected
            ? 'bg-teal-500/5'
            : onRowClick
              ? 'cursor-pointer hover:bg-[rgb(var(--surface-tertiary)/0.5)]'
              : 'hover:bg-[rgb(var(--surface-tertiary)/0.3)]'
        )}
        onClick={onRowClick ? () => onRowClick(row.original) : undefined}
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
                'px-6 py-4 text-sm text-[rgb(var(--text-primary))]',
                meta?.align === 'right' && 'text-right',
                meta?.align === 'center' && 'text-center'
              )}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          )
        })}
      </tr>
      {/* Expanded row */}
      {enableExpanding && row.getIsExpanded() && renderSubComponent && (
        <tr>
          <td colSpan={visibleCellCount} className="p-0">
            {renderSubComponent({ row })}
          </td>
        </tr>
      )}
    </>
  )
}

