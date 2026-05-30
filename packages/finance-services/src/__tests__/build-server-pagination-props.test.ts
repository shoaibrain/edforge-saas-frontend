import { describe, it, expect, vi } from 'vitest'
import { buildServerPaginationProps } from '../utils/build-server-pagination-props'

describe('buildServerPaginationProps', () => {
  it('produces enabled server pagination config when hasMore is true', () => {
    const loadMore = vi.fn()
    const result = buildServerPaginationProps({
      hasMore: true,
      loadMore,
      isFetchingNextPage: false,
      isLoading: false,
    })

    expect(result.serverPagination).toEqual({
      hasMore: true,
      isFetching: false,
      onLoadMore: loadMore,
    })
    expect(result.isFetching).toBe(false)
  })

  it('sets isFetching when loading next page', () => {
    const result = buildServerPaginationProps({
      hasMore: true,
      loadMore: vi.fn(),
      isFetchingNextPage: true,
      isLoading: false,
    })

    expect(result.serverPagination.isFetching).toBe(true)
    expect(result.isFetching).toBe(true)
  })

  it('sets isFetching during initial load', () => {
    const result = buildServerPaginationProps({
      hasMore: false,
      loadMore: vi.fn(),
      isFetchingNextPage: false,
      isLoading: true,
    })

    expect(result.isFetching).toBe(true)
  })
})
