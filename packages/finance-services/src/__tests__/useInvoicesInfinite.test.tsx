import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

vi.mock('../services/invoices.service', () => ({
  getInvoices: vi.fn(),
}))

import { getInvoices } from '../services/invoices.service'
import { useInvoicesInfinite } from '../hooks/useInvoicesInfinite'

const mockGetInvoices = vi.mocked(getInvoices)

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
  }
}

describe('useInvoicesInfinite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resets when status filter changes', async () => {
    mockGetInvoices
      .mockResolvedValueOnce({ items: [{ id: 'draft-1' } as any], hasMore: false })
      .mockResolvedValueOnce({ items: [{ id: 'issued-1' } as any], hasMore: false })

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result, rerender } = renderHook(
      ({ status }: { status?: string }) =>
        useInvoicesInfinite('sch-1', status ? { status: status as any } : {}),
      {
        wrapper: wrapper(client),
        initialProps: { status: 'draft' },
      },
    )

    await waitFor(() => expect(result.current.items[0]?.id).toBe('draft-1'))

    rerender({ status: 'issued' })

    await waitFor(() => expect(result.current.items[0]?.id).toBe('issued-1'))
    expect(mockGetInvoices).toHaveBeenCalledTimes(2)
    expect(mockGetInvoices.mock.calls[1][1]).toMatchObject({ status: 'issued' })
  })

  it('forwards cursor on loadMore', async () => {
    mockGetInvoices
      .mockResolvedValueOnce({
        items: [{ id: '1' } as any],
        hasMore: true,
        lastEvaluatedKey: 'page-2',
      })
      .mockResolvedValueOnce({ items: [{ id: '2' } as any], hasMore: false })

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(
      () => useInvoicesInfinite('sch-1'),
      { wrapper: wrapper(client) },
    )

    await waitFor(() => expect(result.current.hasMore).toBe(true))

    act(() => result.current.loadMore())

    await waitFor(() => expect(result.current.items).toHaveLength(2))
    expect(mockGetInvoices).toHaveBeenLastCalledWith(
      'sch-1',
      expect.objectContaining({ cursor: 'page-2', limit: 50 }),
    )
  })
})
