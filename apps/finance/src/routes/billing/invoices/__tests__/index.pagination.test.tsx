import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type * as FinanceServices from '@edforge/finance-services'

const loadMore = vi.fn()

vi.mock('@edforge/finance-services', async (importOriginal) => {
  const actual = await importOriginal<typeof FinanceServices>()
  return {
    ...actual,
    useInvoicesInfinite: () => ({
      items: Array.from({ length: 20 }, (_, i) => ({
        id: `inv-${i}`,
        invoiceNumber: `INV-${i}`,
        studentId: 's1',
        studentName: 'Student',
        grandTotal: 1000,
        amountPaid: 0,
        amountDue: 1000,
        dueDate: '2026-06-01',
        status: 'issued',
      })),
      isLoading: false,
      hasMore: true,
      loadMore,
      isFetchingNextPage: false,
      totalLoaded: 20,
      error: null,
      refetch: vi.fn(),
    }),
    useDashboardSummary: () => ({
      data: {
        totalInvoiced: 10000,
        totalCollected: 5000,
        outstanding: 5000,
        overdue: 0,
        collectionRate: 50,
        invoicesByStatus: {},
        paymentsByGateway: {},
        byFeeType: [],
        agingReport: [],
      },
      isLoading: false,
    }),
    useIssueInvoice: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useCancelInvoice: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useBulkIssueInvoices: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useDownloadInvoicePdf: () => ({ mutate: vi.fn(), isPending: false }),
    useFeeStructures: () => ({ data: [] }),
    useAcademicYears: () => ({ data: [] }),
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
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

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

import InvoicesPage from '../index'

describe('InvoicesPage pagination', () => {
  beforeEach(() => {
    loadMore.mockClear()
  })

  it('calls loadMore when Next is clicked at end of loaded buffer', async () => {
    const client = new QueryClient()
    render(
      <QueryClientProvider client={client}>
        <InvoicesPage />
      </QueryClientProvider>,
    )

    const nextButton = await screen.findByRole('button', { name: /next/i })
    fireEvent.click(nextButton)

    expect(loadMore).toHaveBeenCalled()
  })
})
