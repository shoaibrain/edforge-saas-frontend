/**
 * Issue #357 — the Student Accounts list must page past the first server page.
 *
 * Observed in production on a 254-student school: the footer read
 * "Showing 1-20 of 50 results" with numbered page buttons and no way to reach
 * account 51, and the TOTAL STUDENTS card read 50. `useStudentAccounts` was
 * already cursor-paginated; the page dropped the controls.
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
    useStudentAccounts: () => ({
      data: Array.from({ length: 20 }, (_, i) => ({
        id: `acc-${i}`,
        studentId: `s-${i}`,
        studentName: `Student ${i}`,
        schoolId: 'school-1',
        balance: 1000,
        totalPaid: 0,
        lastPaymentDate: null,
      })),
      isLoading: false,
      hasMore: true,
      loadMore,
      isFetchingNextPage: false,
      totalLoaded: 20,
      error: null,
      refetch: vi.fn(),
    }),
    useStudentLedger: () => ({ data: [], isLoading: false, isError: false }),
    useInvoices: () => ({ data: [], isLoading: false }),
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

import StudentAccountsPage from '../index'

describe('StudentAccountsPage pagination (#357)', () => {
  beforeEach(() => loadMore.mockClear())

  it('asks the server for more when Next is pressed at the end of the loaded rows', async () => {
    const client = new QueryClient()
    render(
      <QueryClientProvider client={client}>
        <StudentAccountsPage />
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
        <StudentAccountsPage />
      </QueryClientProvider>,
    )

    expect(await screen.findByText(/of 20\+ results/)).toBeTruthy()
    // The KPI cards must not claim the loaded slice is the whole school.
    expect((await screen.findAllByText('20+')).length).toBeGreaterThan(0)
  })
})
