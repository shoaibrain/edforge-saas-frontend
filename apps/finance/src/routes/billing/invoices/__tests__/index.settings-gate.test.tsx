/**
 * KPI money values must never paint in the fallback currency: while the
 * finance settings are unresolved the band shows placeholders, and once
 * ready it formats with the tenant currency (NPR lakh) — a dollar sign
 * must never appear on a PABSON tenant (the 2026-07-09 USD-flash bug).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type * as FinanceServices from '@edforge/finance-services'

vi.mock('@edforge/finance-services', async (importOriginal) => {
  const actual = await importOriginal<typeof FinanceServices>()
  return {
    ...actual,
    useInvoicesInfinite: () => ({
      items: [],
      isLoading: false,
      hasMore: false,
      loadMore: vi.fn(),
      isFetchingNextPage: false,
      totalLoaded: 0,
      error: null,
      refetch: vi.fn(),
    }),
    useDashboardSummary: () => ({
      data: {
        totalInvoiced: 1260000,
        totalCollected: 251800,
        outstanding: 1008200,
        overdue: 0,
        collectionRate: 20,
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

let settingsReady = true
vi.mock('../../../../layouts/FinanceLayout', () => ({
  useFinanceSettings: () => ({
    currency: 'NPR',
    timezone: 'Asia/Kathmandu',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '12h',
    calendarSystem: 'gregorian',
    enableDualDateDisplay: false,
    numberFormat: 'south_asian',
    locale: 'ne-NP',
    weekStartsOn: 'sunday',
  }),
  useFinanceSettingsReady: () => settingsReady,
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('@edforge/i18n', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
  normalizePlatformLanguage: (l: string) => l,
}))

// Real useCurrency — the assertion is about actual formatting output.

import InvoicesPage from '../index'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <InvoicesPage />
    </QueryClientProvider>,
  )
}

describe('InvoicesPage KPI settings gating', () => {
  it('renders placeholders — never a formatted amount — while settings are unresolved', () => {
    settingsReady = false
    renderPage()

    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(4)
    expect(screen.queryByText(/\$\s?\d/)).toBeNull()
    expect(screen.queryByText(/NPR\s?\d/)).toBeNull()
  })

  it('formats KPI amounts in the tenant currency once settings are ready', () => {
    settingsReady = true
    renderPage()

    expect(screen.getByText('NPR 12.6L')).toBeInTheDocument()
    expect(screen.getByText('NPR 2.5L')).toBeInTheDocument()
    expect(screen.queryByText(/\$\s?\d/)).toBeNull()
  })
})
