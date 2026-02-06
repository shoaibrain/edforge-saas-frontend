/**
 * Pagination Component
 *
 * Simple "Load More" pagination for cursor-based API pagination.
 */

import { Loader2 } from 'lucide-react'

export interface PaginationProps {
  /** Whether there are more items to load */
  hasMore: boolean
  /** Whether currently loading more items */
  isLoading: boolean
  /** Callback when "Load More" is clicked */
  onLoadMore: () => void
  /** Number of items currently loaded */
  totalLoaded: number
  /** Total number of items available (optional) */
  total?: number
  /** Label for what items are being displayed */
  itemLabel?: string
}

export function Pagination({
  hasMore,
  isLoading,
  onLoadMore,
  totalLoaded,
  total,
  itemLabel = 'items',
}: PaginationProps) {
  if (!hasMore && totalLoaded === 0) {
    return null
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Count display */}
      <p className="text-sm text-text-secondary">
        Showing{' '}
        <span className="font-medium text-text-primary">{totalLoaded}</span>
        {total !== undefined && (
          <>
            {' '}
            of <span className="font-medium text-text-primary">{total}</span>
          </>
        )}{' '}
        {itemLabel}
      </p>

      {/* Load More button */}
      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary bg-surface-secondary border border-border-secondary rounded-lg hover:bg-surface-tertiary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            <span>Load More</span>
          )}
        </button>
      )}
    </div>
  )
}
