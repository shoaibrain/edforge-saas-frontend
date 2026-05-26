/**
 * Sprint M1.5-FU.7.3 — Differentiated error messages on the Finance
 * Receipt page (closes Issue #20).
 *
 * Pre-fix: every error class produced the same generic
 * "Failed to load payment data" message. The receipt fetch can fail
 * for several distinguishable reasons, and the error UI is the
 * operator's only signal — they need to know:
 *   - 400: this payment isn't completed, no receipt to fetch
 *   - 403: permission denied
 *   - 404: receipt not found / deleted
 *   - default: server / network / unknown
 *
 * The test exercises the receipt page's error branch directly by
 * mocking `usePaymentReceipt` to return different AxiosError shapes.
 * Cheaper + more precise than driving the underlying fetch path.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

// Mock the finance hook BEFORE the page imports it. Other tests in
// this directory mock at the @edforge/api-client layer; that approach
// is overkill here — we just need to inject a controlled error shape.
const usePaymentReceiptMock = vi.fn()
vi.mock('@edforge/finance-services', () => ({
  usePaymentReceipt: (...args: unknown[]) => usePaymentReceiptMock(...args),
}))

// Echo the i18n key back so assertions can target the key text.
vi.mock('@edforge/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
  }),
}))

// Stub the router hooks. The error branch only uses `navigate` for
// the Return button — we don't need to assert it fires in this spec.
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ paymentId: 'pmt-1' }),
}))

// Stub the app store hook used by the page (returns truthy schoolId
// so the page proceeds past its idle/pending guard).
vi.mock('../stores/app.store', () => ({
  useAppStore: (selector: (s: { activeSchoolId: string }) => unknown) =>
    selector({ activeSchoolId: 'school-1' }),
}))

// The PaymentReceipt subcomponent is only rendered in the success
// branch — stub to avoid pulling its dependency graph into this test.
vi.mock('../components/billing/PaymentReceipt', () => ({
  PaymentReceipt: () => <div data-testid="payment-receipt" />,
}))

const { default: FinanceReceiptPage } = await import('../routes/billing/payments/receipt')

function Wrapper({ children }: { children: ReactNode }) {
  return <div>{children}</div>
}

interface FakeAxiosLikeError {
  response?: { status?: number }
  message?: string
}

function setError(error: FakeAxiosLikeError | null) {
  usePaymentReceiptMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    isPending: false,
    error,
  })
}

describe('Finance Receipt page — differentiated error messages (M1.5-FU.7.3)', () => {
  beforeEach(() => {
    usePaymentReceiptMock.mockReset()
  })

  it('renders the "not-available-yet" message on 400 (payment not completed)', () => {
    setError({ response: { status: 400 } })
    render(
      <Wrapper>
        <FinanceReceiptPage />
      </Wrapper>,
    )
    expect(screen.getByText('error.receiptNotAvailable')).toBeInTheDocument()
    // 400 case also surfaces the explanatory detail copy
    expect(screen.getByText('error.receiptNotAvailableDetail')).toBeInTheDocument()
  })

  it('renders the "not-found" message on 404', () => {
    setError({ response: { status: 404 } })
    render(
      <Wrapper>
        <FinanceReceiptPage />
      </Wrapper>,
    )
    expect(screen.getByText('error.receiptNotFound')).toBeInTheDocument()
    // No detail copy on 404 — the headline is self-explanatory
    expect(screen.queryByText('error.receiptNotAvailableDetail')).not.toBeInTheDocument()
  })

  it('renders the "forbidden" message on 403', () => {
    setError({ response: { status: 403 } })
    render(
      <Wrapper>
        <FinanceReceiptPage />
      </Wrapper>,
    )
    expect(screen.getByText('error.receiptForbidden')).toBeInTheDocument()
  })

  it('falls back to the generic message on 5xx', () => {
    setError({ response: { status: 500 } })
    render(
      <Wrapper>
        <FinanceReceiptPage />
      </Wrapper>,
    )
    expect(screen.getByText('error.failedToLoad')).toBeInTheDocument()
  })

  it('falls back to the generic message when the error has no response (network error)', () => {
    setError({ message: 'Network Error' })
    render(
      <Wrapper>
        <FinanceReceiptPage />
      </Wrapper>,
    )
    expect(screen.getByText('error.failedToLoad')).toBeInTheDocument()
  })

  it('always renders a Return button regardless of error class', () => {
    setError({ response: { status: 400 } })
    render(
      <Wrapper>
        <FinanceReceiptPage />
      </Wrapper>,
    )
    expect(screen.getByRole('button', { name: 'flow.returnToPayments' })).toBeInTheDocument()
  })
})
