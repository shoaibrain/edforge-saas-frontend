/**
 * Sprint M1.5-FU.7.4 — Print Receipt button removed (closes Issue #21).
 *
 * Pre-fix: PaymentReceipt rendered a `Print Receipt` button that called
 * `window.print()` — which prints the live HTML page (sidebar, header,
 * nav chrome included) rather than the polished server-rendered PDF.
 * Two divergent print paths for the same intent; the Download button
 * next to it produces the right output.
 *
 * Post-fix: only Download remains. Operators print via Download →
 * open PDF → OS print dialog.
 *
 * This test prevents the Print button from regressing back in. It does
 * NOT assert anything about the Download button (covered by the
 * existing `payments-list-row-download.test.tsx` and the
 * `use-download-invoice-pdf.test.tsx` specs for both flows).
 */

import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { Receipt } from '@edforge/types'

vi.mock('@edforge/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Stub the finance settings + app store hooks used by the component.
vi.mock('../layouts/FinanceLayout', () => ({
  useFinanceSettings: () => ({
    currency: 'NPR',
    locale: 'en-US',
    timezone: 'Asia/Kathmandu',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    calendarSystem: 'gregorian',
    enableDualDateDisplay: false,
    numberFormat: 'international',
    weekStartsOn: 'sunday',
  }),
}))

vi.mock('../stores/app.store', () => ({
  useAppStore: (selector: (s: { activeSchoolId: string }) => unknown) =>
    selector({ activeSchoolId: 'school-1' }),
}))

// Stub `useDownloadReceiptPdf` — the component subscribes to it but
// nothing in this spec exercises it. A no-op mutation shape keeps the
// component happy.
vi.mock('@edforge/finance-services', () => ({
  useDownloadReceiptPdf: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    reset: vi.fn(),
  }),
}))

// `DateDisplay` from @edforge/ui pulls a date-utils chain. Stub to keep
// the test focused on the print-button absence assertion.
vi.mock('@edforge/ui', () => ({
  DateDisplay: ({ date }: { date: string }) => <span>{date}</span>,
}))

// `useCurrency` returns the formatter — stub to a passthrough.
vi.mock('@edforge/types/use-currency', () => ({
  useCurrency: () => ({
    format: (n: number) => `NPR ${n.toFixed(2)}`,
  }),
}))

const { PaymentReceipt } = await import('../components/billing/PaymentReceipt')

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function makeReceipt(): Receipt {
  return {
    receiptNumber: 'RC-001',
    paymentId: 'pmt-1',
    schoolId: 'school-1',
    schoolName: 'Saraswati Academy',
    schoolAddress: 'Lalitpur, Nepal',
    studentName: 'Aarav Sharma',
    paidBy: 'Aarav Sharma',
    paidDate: '2026-05-26T12:00:00.000Z',
    transactionId: 'txn-1',
    gatewayDisplayName: 'eSewa',
    lineItems: [
      { description: 'Tuition Fee', total: 5000, quantity: 1, unitPrice: 5000 },
    ],
    subtotal: 5000,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 5000,
    taxBreakdown: { panNumber: '301234567', vatNumber: null, taxRate: 0, taxAmount: 0 },
  } as unknown as Receipt
}

describe('PaymentReceipt (Finance MFE) — Print button removal (M1.5-FU.7.4)', () => {
  it('does NOT render a Print Receipt button', () => {
    render(
      <Wrapper>
        <PaymentReceipt receipt={makeReceipt()} />
      </Wrapper>,
    )

    // Print button used to render `<Printer />` icon + `t('receipt.print')`
    // text. Assert neither lives in the action-bar region.
    expect(screen.queryByText('receipt.print')).not.toBeInTheDocument()

    // Defense in depth: no button with the i18n key as accessible name
    expect(
      screen.queryByRole('button', { name: 'receipt.print' }),
    ).not.toBeInTheDocument()
  })

  it('still renders the Download button (sanity — Download is the surviving print path)', () => {
    render(
      <Wrapper>
        <PaymentReceipt receipt={makeReceipt()} />
      </Wrapper>,
    )

    // `t('receipt.download')` returns the i18n key in the test setup.
    expect(screen.getByText('receipt.download')).toBeInTheDocument()
  })
})
