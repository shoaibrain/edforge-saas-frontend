import type { Table } from '@tanstack/react-table'
import { cn } from '../../utils'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  totalCount?: number
  pageSizeOptions?: number[]
}

export function DataTablePagination<TData>({
  table,
  totalCount,
  pageSizeOptions = [10, 20, 50, 100],
}: DataTablePaginationProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const pageCount = table.getPageCount()
  const totalRows = totalCount ?? table.getFilteredRowModel().rows.length
  const start = pageIndex * pageSize + 1
  const end = Math.min((pageIndex + 1) * pageSize, totalRows)

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-[rgb(var(--border-primary)/0.3)] bg-[rgb(var(--surface-tertiary)/0.25)]">
      <span className="text-xs text-[rgb(var(--text-secondary))]">
        Showing {start}-{end} of {totalRows} results
      </span>
      <div className="flex items-center gap-1">
        {/* Page size selector */}
        <select
          value={pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value))
            table.setPageIndex(0)
          }}
          className="mr-3 px-2 py-1 text-xs border border-[rgb(var(--border-primary)/0.6)] rounded-md bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-secondary))] focus:outline-none focus:ring-1 focus:ring-teal-500/30"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>

        {/* Previous */}
        <button
          type="button"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-2.5 py-1 text-xs font-medium rounded-md border border-[rgb(var(--border-primary)/0.6)] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-tertiary)/0.5)] hover:text-[rgb(var(--text-primary))] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Prev
        </button>

        {/* Page numbers */}
        {getPageNumbers(pageIndex, pageCount).map((page, i) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${i}`}
              className="px-1.5 text-xs text-[rgb(var(--text-tertiary))]"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => table.setPageIndex(page as number)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                pageIndex === page
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'border border-[rgb(var(--border-primary)/0.6)] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-tertiary)/0.5)] hover:text-[rgb(var(--text-primary))]'
              )}
            >
              {(page as number) + 1}
            </button>
          )
        )}

        {/* Next */}
        <button
          type="button"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-2.5 py-1 text-xs font-medium rounded-md border border-[rgb(var(--border-primary)/0.6)] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-tertiary)/0.5)] hover:text-[rgb(var(--text-primary))] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

function getPageNumbers(
  currentPage: number,
  totalPages: number
): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i)
  }

  const pages: (number | 'ellipsis')[] = []

  // Always show first page
  pages.push(0)

  if (currentPage > 2) {
    pages.push('ellipsis')
  }

  // Pages around current
  const start = Math.max(1, currentPage - 1)
  const end = Math.min(totalPages - 2, currentPage + 1)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (currentPage < totalPages - 3) {
    pages.push('ellipsis')
  }

  // Always show last page
  pages.push(totalPages - 1)

  return pages
}
