/**
 * usePaginatedQuery Hook
 * 
 * Wraps TanStack Query's useInfiniteQuery for cursor-based pagination
 * with "Load More" pattern (not page numbers).
 */

import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo, useCallback } from 'react'

export interface PaginatedResponse<T> {
  items: T[]
  lastEvaluatedKey?: string
  hasMore: boolean
}

export interface UsePaginatedQueryOptions<T> {
  queryKey: unknown[]
  queryFn: (params: { limit: number; cursor?: string }) => Promise<PaginatedResponse<T>>
  limit?: number
  enabled?: boolean
  staleTime?: number
}

export interface UsePaginatedQueryResult<T> {
  items: T[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasMore: boolean
  loadMore: () => void
  error: Error | null
  refetch: () => void
  totalLoaded: number
}

export function usePaginatedQuery<T>({
  queryKey,
  queryFn,
  limit = 20,
  enabled = true,
  staleTime = 30000,
}: UsePaginatedQueryOptions<T>): UsePaginatedQueryResult<T> {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }): Promise<PaginatedResponse<T>> => {
      const result = await queryFn({ limit, cursor: pageParam as string | undefined })
      // Ensure result has expected shape
      return {
        items: result?.items ?? [],
        hasMore: result?.hasMore ?? false,
        lastEvaluatedKey: result?.lastEvaluatedKey,
      }
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: PaginatedResponse<T> | undefined) => {
      // Defensive check - lastPage might be undefined in some edge cases
      if (!lastPage) return undefined
      if (lastPage.hasMore && lastPage.lastEvaluatedKey) {
        return lastPage.lastEvaluatedKey
      }
      return undefined
    },
    enabled,
    staleTime,
  })

  const items = useMemo(() => {
    if (!query.data?.pages) return []
    return query.data.pages.flatMap((page) => page?.items ?? [])
  }, [query.data])

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage()
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
