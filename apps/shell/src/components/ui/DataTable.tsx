/**
 * DataTable Component
 * 
 * Reusable data table with:
 * - Configurable columns with custom renderers
 * - Skeleton loading state
 * - Empty state with optional CTA
 * - "Load More" pagination (cursor-based)
 * - Client-side sorting
 * - Horizontal scroll on narrow viewports
 * - Row actions support
 */

import { useState, useMemo, type ReactNode } from 'react'
import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  width?: string
  render: (item: T) => ReactNode
}

export interface DataTableEmptyState {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  // Loading
  isLoading?: boolean
  skeletonRows?: number
  // Empty state
  emptyState?: DataTableEmptyState
  // Pagination
  hasMore?: boolean
  isFetchingMore?: boolean
  onLoadMore?: () => void
  // Row interaction
  onRowClick?: (item: T) => void
  rowActions?: (item: T) => ReactNode
}

type SortDirection = 'asc' | 'desc' | null

interface SortState {
  key: string | null
  direction: SortDirection
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  skeletonRows = 5,
  emptyState,
  hasMore = false,
  isFetchingMore = false,
  onLoadMore,
  onRowClick,
  rowActions,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>({ key: null, direction: null })

  // Handle column header click for sorting
  const handleSort = (key: string) => {
    setSort((prev) => {
      if (prev.key !== key) {
        return { key, direction: 'asc' }
      }
      if (prev.direction === 'asc') {
        return { key, direction: 'desc' }
      }
      return { key: null, direction: null }
    })
  }

  // Sort data client-side
  const sortedData = useMemo(() => {
    if (!sort.key || !sort.direction) return data

    const column = columns.find((col) => col.key === sort.key)
    if (!column) return data

    return [...data].sort((a, b) => {
      // Get values for comparison - use the key to access nested properties
      const aValue = getNestedValue(a, sort.key!)
      const bValue = getNestedValue(b, sort.key!)

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return sort.direction === 'asc' ? 1 : -1
      if (bValue == null) return sort.direction === 'asc' ? -1 : 1

      // Compare values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue)
        return sort.direction === 'asc' ? comparison : -comparison
      }

      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sort, columns])

  // Render sort indicator
  const renderSortIndicator = (key: string) => {
    if (sort.key !== key) {
      return <span className="w-4 h-4" /> // Placeholder for alignment
    }
    if (sort.direction === 'asc') {
      return <ChevronUp className="w-4 h-4 text-teal-500" />
    }
    return <ChevronDown className="w-4 h-4 text-teal-500" />
  }

  // Check if we should show row actions column
  const showActionsColumn = !!rowActions

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-primary))]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgb(var(--border-secondary))]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-sm font-medium text-[rgb(var(--text-secondary))]"
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
              {showActionsColumn && (
                <th className="px-4 py-3 text-right text-sm font-medium text-[rgb(var(--text-secondary))] w-24">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-[rgb(var(--border-tertiary))] last:border-b-0">
                {columns.map((col, colIndex) => (
                  <td key={col.key} className="px-4 py-3">
                    <div
                      className="h-4 bg-[rgb(var(--surface-tertiary))] rounded animate-pulse"
                      style={{ 
                        width: colIndex === 0 ? '80%' : rowIndex % 2 === 0 ? '60%' : '45%' 
                      }}
                    />
                  </td>
                ))}
                {showActionsColumn && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <div className="w-8 h-8 bg-[rgb(var(--surface-tertiary))] rounded animate-pulse" />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Empty state
  if (data.length === 0 && emptyState) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-primary))]">
        {emptyState.icon && (
          <div className="mb-4 text-[rgb(var(--text-tertiary))]">
            {emptyState.icon}
          </div>
        )}
        <h3 className="text-lg font-medium text-[rgb(var(--text-primary))] mb-2">
          {emptyState.title}
        </h3>
        {emptyState.description && (
          <p className="text-[rgb(var(--text-secondary))] mb-6 max-w-sm">
            {emptyState.description}
          </p>
        )}
        {emptyState.action && (
          <button
            type="button"
            onClick={emptyState.action.onClick}
            className="
              inline-flex items-center gap-2 px-4 py-2
              bg-teal-500 text-white rounded-lg
              hover:bg-teal-600 transition-colors
              focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:ring-offset-2
            "
          >
            {emptyState.action.label}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-primary))] overflow-hidden">
      {/* Table with horizontal scroll */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgb(var(--border-secondary))] bg-[rgb(var(--surface-secondary))]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`
                    px-4 py-3 text-left text-sm font-medium text-[rgb(var(--text-secondary))]
                    ${col.sortable ? 'cursor-pointer select-none hover:text-[rgb(var(--text-primary))] transition-colors' : ''}
                  `}
                  style={{ width: col.width }}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.header}</span>
                    {col.sortable && renderSortIndicator(col.key)}
                  </div>
                </th>
              ))}
              {showActionsColumn && (
                <th className="px-4 py-3 text-right text-sm font-medium text-[rgb(var(--text-secondary))] w-24">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item) => (
              <tr
                key={keyExtractor(item)}
                className={`
                  border-b border-[rgb(var(--border-tertiary))] last:border-b-0
                  ${onRowClick ? 'cursor-pointer hover:bg-[rgb(var(--surface-secondary))]/50 transition-colors' : ''}
                `}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-[rgb(var(--text-primary))]">
                    {col.render(item)}
                  </td>
                ))}
                {showActionsColumn && (
                  <td 
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()} // Prevent row click when clicking actions
                  >
                    <div className="flex items-center justify-end gap-1">
                      {rowActions(item)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center py-4 border-t border-[rgb(var(--border-tertiary))]">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isFetchingMore}
            className="
              inline-flex items-center gap-2 px-4 py-2
              text-sm font-medium text-[rgb(var(--text-secondary))]
              bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-secondary))] rounded-lg
              hover:bg-[rgb(var(--surface-tertiary))] hover:text-[rgb(var(--text-primary))]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-teal-500/20
            "
          >
            {isFetchingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <span>Load More</span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Helper to get nested property value from an object
 * e.g., getNestedValue({ user: { name: 'John' } }, 'user.name') => 'John'
 */
function getNestedValue(obj: unknown, path: string): unknown {
  if (obj == null) return undefined
  
  const keys = path.split('.')
  let value: unknown = obj
  
  for (const key of keys) {
    if (value == null || typeof value !== 'object') return undefined
    value = (value as Record<string, unknown>)[key]
  }
  
  return value
}
