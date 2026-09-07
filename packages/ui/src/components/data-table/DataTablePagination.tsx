import { useEffect, useRef } from 'react'
import type { Table } from '@tanstack/react-table'
import { cn, focusRingInset } from '../../utils'
import { DEFAULT_DATA_TABLE_LABELS } from './labels'
import type { DataTableLabels, ServerPaginationConfig } from './types'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  totalCount?: number
  pageSizeOptions?: number[]
  /**
   * Server-pagination adapter. When supplied, the Next button stays enabled
   * while the server reports `hasMore=true`, even if the loaded `data` has
   * been exhausted client-side. See `ServerPaginationConfig` for details.
   */
  serverPagination?: ServerPaginationConfig
  labels?: DataTableLabels
}

export function DataTablePagination<TData>({
  table,
  totalCount,
  pageSizeOptions = [10, 20, 50, 100],
  serverPagination,
  labels,
}: DataTablePaginationProps<TData>) {
  const resolvedLabels = labels ?? DEFAULT_DATA_TABLE_LABELS
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const pageCount = table.getPageCount()
  const loadedRows = table.getFilteredRowModel().rows.length
  const totalRows = totalCount ?? serverPagination?.serverTotalHint ?? loadedRows
  const start = loadedRows === 0 ? 0 : pageIndex * pageSize + 1
  const end = Math.min((pageIndex + 1) * pageSize, loadedRows)

  // Track the Next press that asked the server for more rows, so the page can
  // move once they land. Without this the operator would have to press Next a
  // second time after the fetch completes.
  //
  // `from` is the count of rows already shown at press time, so the row the
  // operator has not seen yet is at index `from`. Landing on the page that
  // holds it is correct whether the page they pressed from was full or short:
  //
  //   full  — 40 loaded, size 20, on 21-40 → from 40 → page 2 → 41-60
  //   short — 50 loaded, size 20, on 41-50 → from 50 → page 2 → 41-60
  //
  // The short case is why this is not a plain `nextPage()`. Advancing one page
  // from a short page lands on 61-80 and steps over rows 51-60 entirely, which
  // no scroll or Prev press would reveal as missing.
  //
  // `loadedAt` gates the effect until the rows have actually arrived; the
  // fetching flag alone can still read false on the render that schedules it.
  const pendingAdvance = useRef<{ from: number; loadedAt: number } | null>(null)
  useEffect(() => {
    const pending = pendingAdvance.current
    if (!pending || serverPagination?.isFetching) return
    if (loadedRows <= pending.loadedAt) return
    pendingAdvance.current = null
    const target = Math.floor(pending.from / pageSize)
    if (target * pageSize < loadedRows) {
      table.setPageIndex(target)
    }
  }, [serverPagination?.isFetching, loadedRows, pageSize, table])

  const serverHasMore = serverPagination?.hasMore ?? false
  const canClientNext = table.getCanNextPage()
  const canNext = canClientNext || serverHasMore

  const handleNext = () => {
    if (canClientNext) {
      table.nextPage()
      return
    }
    if (serverHasMore && serverPagination && !serverPagination.isFetching) {
      // Schedule the move for when the fetched rows land.
      pendingAdvance.current = { from: end, loadedAt: loadedRows }
      serverPagination.onLoadMore()
    }
  }

  // The `of Z` label: when server pagination is active and we only know a
  // lower bound (loaded count), suffix with "+" to communicate "more exist".
  const totalDisplay = serverHasMore && totalCount == null && serverPagination?.serverTotalHint == null
    ? `${totalRows}+`
    : String(totalRows)

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-[rgb(var(--border-primary)/0.3)] bg-[rgb(var(--background-tertiary)/0.25)]">
      <span className="text-xs text-[rgb(var(--text-secondary))]">
        {resolvedLabels.paginationShowing(start, end, totalDisplay)}
      </span>
      <div className="flex items-center gap-1">
        {/* Page size selector */}
        <select
          value={pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value))
            table.setPageIndex(0)
          }}
          className={cn(
            'mr-3 px-2 py-1 text-xs border border-[rgb(var(--border-primary)/0.6)] rounded-md bg-[rgb(var(--background-primary))] text-[rgb(var(--text-secondary))]',
            focusRingInset
          )}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {resolvedLabels.rowsPerPage(size)}
            </option>
          ))}
        </select>

        {/* Previous */}
        <button
          type="button"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-2.5 py-1 text-xs font-medium rounded-md border border-[rgb(var(--border-primary)/0.6)] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-tertiary)/0.5)] hover:text-[rgb(var(--text-primary))] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {resolvedLabels.previousPage}
        </button>

        {/* Page numbers — only in pure client-side mode. When server
            pagination is active the total page count is unknown, so
            numbered buttons would be misleading. */}
        {!serverPagination &&
          getPageNumbers(pageIndex, pageCount).map((page, i) =>
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
                    ? 'bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] shadow-sm'
                    : 'border border-[rgb(var(--border-primary)/0.6)] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-tertiary)/0.5)] hover:text-[rgb(var(--text-primary))]'
                )}
              >
                {(page as number) + 1}
              </button>
            )
          )}

        {/* Next */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!canNext || serverPagination?.isFetching}
          className="px-2.5 py-1 text-xs font-medium rounded-md border border-[rgb(var(--border-primary)/0.6)] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-tertiary)/0.5)] hover:text-[rgb(var(--text-primary))] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {serverPagination?.isFetching
            ? resolvedLabels.loadingPage
            : resolvedLabels.nextPage}
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
