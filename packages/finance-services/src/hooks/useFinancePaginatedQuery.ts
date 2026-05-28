/**
 * useFinancePaginatedQuery — cursor-based infinite list for finance APIs.
 * Adapted from apps/shell/src/hooks/usePaginatedQuery.ts (do not import from shell).
 */

import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo, useCallback } from 'react'
import type { FinancePaginatedResponse } from '../types/pagination'
import { flattenFinancePages } from '../utils/flatten-finance-pages'

export interface UseFinancePaginatedQueryOptions<T, TFilters = Record<string, unknown>> {
  queryKey: readonly unknown[]
  queryFn: (params: TFilters & { limit: number; cursor?: string }) => Promise<FinancePaginatedResponse<T>>
  filters?: TFilters
  limit?: number
  enabled?: boolean
  staleTime?: number
}

export interface UseFinancePaginatedQueryResult<T> {
  items: T[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasMore: boolean
  loadMore: () => void
  error: Error | null
  refetch: () => void
  totalLoaded: number
}

export function useFinancePaginatedQuery<T, TFilters = Record<string, unknown>>({
  queryKey,
  queryFn,
  filters = {} as TFilters,
  limit = 50,
  enabled = true,
  staleTime = 30_000,
}: UseFinancePaginatedQueryOptions<T, TFilters>): UseFinancePaginatedQueryResult<T> {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) =>
      queryFn({
        ...filters,
        limit,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore && lastPage.lastEvaluatedKey) {
        return lastPage.lastEvaluatedKey
      }
      return undefined
    },
    enabled,
    staleTime,
  })

  const items = useMemo(
    () => flattenFinancePages(query.data),
    [query.data],
  )

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage()
    }
  }, [query])

  return {
    items,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasMore: query.hasNextPage ?? false,
    loadMore,
    error: query.error ?? null,
    refetch: query.refetch,
    totalLoaded: items.length,
  }
}
