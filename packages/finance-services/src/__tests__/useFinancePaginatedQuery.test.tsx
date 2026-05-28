import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useFinancePaginatedQuery } from '../hooks/useFinancePaginatedQuery'
import type { FinancePaginatedResponse } from '../services/invoices.service'

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
  }
}

describe('useFinancePaginatedQuery', () => {
  it('flattens two pages and passes cursor on second request', async () => {
    const queryFn = vi
      .fn<
        (params: { limit: number; cursor?: string }) => Promise<FinancePaginatedResponse<{ id: string }>>
      >()
      .mockResolvedValueOnce({
        items: [{ id: '1' }],
        hasMore: true,
        lastEvaluatedKey: 'c2',
      })
      .mockResolvedValueOnce({
        items: [{ id: '2' }],
        hasMore: false,
      })

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(
      () =>
        useFinancePaginatedQuery({
          queryKey: ['test', 'paginated'],
          queryFn,
          limit: 50,
        }),
      { wrapper: wrapper(client) },
    )

    await waitFor(() => expect(result.current.items).toHaveLength(1))

    act(() => {
      result.current.loadMore()
    })

    await waitFor(() => expect(result.current.items).toHaveLength(2))
    expect(queryFn).toHaveBeenNthCalledWith(2, expect.objectContaining({ cursor: 'c2' }))
  })
})
