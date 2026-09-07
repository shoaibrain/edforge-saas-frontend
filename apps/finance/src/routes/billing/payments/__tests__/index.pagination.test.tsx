/**
 * Issue #357 — the Payments list must page past the first server page.
 *
 * `useSchoolPayments` has always returned `hasMore` / `loadMore`; the page
 * destructured only `data` and `isLoading`, so the table's Next button went
 * dead at row 50 and the footer stated that page's size as the exact total.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type * as FinanceServices from '@edforge/finance-services'

const loadMore = vi.fn()

vi.mock('@edforge/finance-services', async (importOriginal) => {
  const actual = await importOriginal<typeof FinanceServices>()
  return {
    ...actual,
    useSchoolPayments: () => ({
      data: Array.from({ length: 20 }, (_, i) => ({
        id: `pay-${i}`,
        receiptNumber: `RCP-${i}`,
        invoiceId: `inv-${i}`,
        studentAccountId: `acc-${i}`,
        studentName: 'Student',
        amount: 1000,
        currency: 'NPR',
        gateway: 'cash',
        status: 'completed',
        paidAt: '2026-06-01',
        refunds: [],
      })),
      isLoading: false,
      hasMore: true,
      loadMore,
      isFetchingNextPage: false,
      totalLoaded: 20,
      error: null,
      refetch: vi.fn(),
    }),
    useVoidPayment: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useCreateRefund: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useExportPaymentsCsv: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useDownloadReceiptPdf: () => ({ mutate: vi.fn(), isPending: false }),
  }
})

vi.mock('../../../../stores/app.store', () => ({
  useAppStore: (sel: (s: { activeSchoolId: string }) => unknown) =>
    sel({ activeSchoolId: 'school-1' }),
}))

vi.mock('../../../../layouts/FinanceLayout', () => ({
  useFinanceSettings: () => ({
    currency: 'NPR',
    calendarSystem: 'gregorian',
    enableDualDateDisplay: false,
  }),
  useFinanceSettingsReady: () => true,
}))

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }))

vi.mock('@edforge/i18n', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
  normalizePlatformLanguage: (l: string) => l,
}))

vi.mock('@edforge/types/use-currency', () => ({
  useCurrency: () => ({
    format: (n: number) => String(n),
    formatCompact: (n: number) => String(n),
  }),
}))

import PaymentsPage from '../index'

describe('PaymentsPage pagination (#357)', () => {
  beforeEach(() => loadMore.mockClear())

  it('asks the server for more when Next is pressed at the end of the loaded rows', async () => {
    const client = new QueryClient()
    render(
      <QueryClientProvider client={client}>
        <PaymentsPage />
      </QueryClientProvider>,
    )

    const next = await screen.findByRole('button', { name: /next/i })
    expect(next).not.toBeDisabled()
    fireEvent.click(next)
    expect(loadMore).toHaveBeenCalled()
  })

  it('marks the loaded count as a lower bound while the server holds more', async () => {
    const client = new QueryClient()
    render(
      <QueryClientProvider client={client}>
        <PaymentsPage />
      </QueryClientProvider>,
    )

    // Without the "+" the footer asserts a total it cannot know.
    expect(await screen.findByText(/of 20\+ results/)).toBeTruthy()
  })
})
