/** Mirrors ServerPaginationConfig from @edforge/ui (not exported from package entry). */
export interface FinanceServerPaginationConfig {
  hasMore: boolean
  onLoadMore: () => void
  isFetching: boolean
  serverTotalHint?: number
}

export interface FinancePaginationControls {
  hasMore: boolean
  loadMore: () => void
  isFetchingNextPage: boolean
  /** Initial page load — surfaces as table isFetching overlay. */
  isLoading?: boolean
}

/**
 * Map finance infinite-query result → TanstackDataTable serverPagination props.
 */
export function buildServerPaginationProps(
  controls: FinancePaginationControls,
): { serverPagination: FinanceServerPaginationConfig; isFetching: boolean } {
  const isFetching = controls.isFetchingNextPage || !!controls.isLoading
  return {
    serverPagination: {
      hasMore: controls.hasMore,
      onLoadMore: controls.loadMore,
      isFetching,
    },
    isFetching,
  }
}
