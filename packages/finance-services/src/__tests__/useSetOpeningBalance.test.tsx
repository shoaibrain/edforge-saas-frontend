import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

vi.mock('../services/student-accounts.service', () => ({
  setOpeningBalance: vi.fn(),
}))

import { setOpeningBalance } from '../services/student-accounts.service'
import { useSetOpeningBalance } from '../hooks/useSetOpeningBalance'
import { paymentKeys } from '../hooks/usePayments'

const mockSetOpeningBalance = vi.mocked(setOpeningBalance)

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe('useSetOpeningBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls setOpeningBalance with the school/account/payload', async () => {
    mockSetOpeningBalance.mockResolvedValue({
      account: { id: 'acc-1', studentId: 'stu-1' } as any,
      ledgerEntryId: 'led-1',
      isRevision: false,
    })

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useSetOpeningBalance('sch-1'), {
      wrapper: wrapper(client),
    })

    await act(async () => {
      await result.current.mutateAsync({
        accountId: 'acc-1',
        payload: { amount: 5000, asOf: '2026-04-12', note: 'BS 2082 carry-forward' },
      })
    })

    expect(mockSetOpeningBalance).toHaveBeenCalledWith('sch-1', 'acc-1', {
      amount: 5000,
      asOf: '2026-04-12',
      note: 'BS 2082 carry-forward',
    })
  })

  it('invalidates studentAccounts + ledger query keys on success', async () => {
    mockSetOpeningBalance.mockResolvedValue({
      account: { id: 'acc-1' } as any,
      ledgerEntryId: null,
      isRevision: true,
    })

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(() => useSetOpeningBalance('sch-1'), {
      wrapper: wrapper(client),
    })

    await act(async () => {
      await result.current.mutateAsync({
        accountId: 'acc-1',
        payload: { amount: 7000, asOf: '2026-05-01' },
      })
    })

    await waitFor(() => {
      const keys = invalidateSpy.mock.calls.map(c => c[0]?.queryKey)
      expect(keys).toEqual(
        expect.arrayContaining([
          paymentKeys.studentAccounts('sch-1'),
          paymentKeys.ledger('sch-1', 'acc-1'),
        ]),
      )
    })
  })

  it('surfaces error from the underlying call', async () => {
    mockSetOpeningBalance.mockRejectedValue(new Error('OPENING_BALANCE_NEGATIVE'))

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useSetOpeningBalance('sch-1'), {
      wrapper: wrapper(client),
    })

    await expect(
      result.current.mutateAsync({
        accountId: 'acc-1',
        payload: { amount: -1, asOf: '2026-04-12' },
      }),
    ).rejects.toThrow('OPENING_BALANCE_NEGATIVE')
  })
})
