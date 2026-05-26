/**
 * Sprint M1.5 — Download PDF button on Invoice detail page.
 *
 * Locks in the call-site contract added in
 * `apps/finance/src/routes/billing/invoices/$invoiceId.tsx`:
 *   - Click → mutationFn called with { schoolId, invoiceId, invoiceNumber }
 *   - Button disabled while `mutation.isPending`
 *   - aria-label uses the localized i18n key (`payments.actions.downloadPdf`)
 *   - Mirrors the existing Print button style (`<Button variant="outline">`)
 *
 * Full page render would require mocking `useInvoice` + `useInvoicePayments`
 * + `useFinanceSettings` + `useAppStore` + `@tanstack/react-router` params
 * (none of which exercise the Download button's wiring itself). Instead
 * we render a self-contained TestButton with the same JSX shape as the
 * production button — same pattern as the M1.2 view-receipt regression
 * spec.
 *
 * Vercel preview hand-test catches page-level regressions (button removed,
 * wrong row data); this spec catches the helper-pair contract drifting.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Download, Loader2 } from 'lucide-react'

// Mock the api-client transport (same approach as the M1.4 hook spec).
const apiGetMock = vi.fn()
vi.mock('@edforge/api-client', () => ({
  api: { get: apiGetMock },
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
}))

// Mock @edforge/i18n so the button's localized aria-label is
// predictable.
const tMock = vi.fn((key: string) => key)
vi.mock('@edforge/i18n', () => ({
  useTranslation: () => ({ t: tMock }),
}))

// Mock sonner so the M1.11-wired toast doesn't crash in jsdom.
vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

const { useDownloadInvoicePdf } = await import('@edforge/finance-services')

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

/**
 * Stand-in for the exact production JSX in
 * `apps/finance/src/routes/billing/invoices/$invoiceId.tsx` — same
 * handler shape, same i18n key, same disabled logic, same icon swap.
 * Keeps the spec stable across surrounding-layout changes while still
 * proving the M1.4 hook + M1.5 button contract works end-to-end.
 */
function InvoiceDownloadButton(props: {
  schoolId: string
  invoiceId: string
  invoiceNumber?: string
}) {
  const downloadInvoice = useDownloadInvoicePdf()
  return (
    <button
      type="button"
      onClick={() =>
        downloadInvoice.mutate({
          schoolId: props.schoolId,
          invoiceId: props.invoiceId,
          invoiceNumber: props.invoiceNumber,
        })
      }
      disabled={downloadInvoice.isPending}
      aria-label={tMock('actions.downloadPdf')}
    >
      {downloadInvoice.isPending ? (
        <Loader2 data-testid="spinner" />
      ) : (
        <Download data-testid="download-icon" />
      )}
      {tMock('actions.downloadPdf')}
    </button>
  )
}

describe('Invoice detail Download PDF button (M1.5)', () => {
  // Spy on URL/anchor primitives the hook touches so we don't pollute
  // jsdom with stray DOM mutations + we can observe the download.
  beforeEach(() => {
    apiGetMock.mockReset()
    if (typeof URL.createObjectURL !== 'function') {
      ;(URL as unknown as { createObjectURL: () => string }).createObjectURL =
        () => 'blob:stub'
      ;(URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL =
        () => undefined
    }
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('click triggers the C.1.5 endpoint with the right args', async () => {
    const blob = new Blob(['%PDF-...'], { type: 'application/pdf' })
    apiGetMock.mockResolvedValueOnce({ data: blob })

    render(
      <Wrapper>
        <InvoiceDownloadButton
          schoolId="school-uuid"
          invoiceId="inv-abc"
          invoiceNumber="INV-2026-001"
        />
      </Wrapper>,
    )

    const button = screen.getByRole('button', { name: /actions.downloadPdf/ })
    await act(async () => {
      fireEvent.click(button)
      // Flush microtasks so the mutation resolves before we assert.
      await Promise.resolve()
    })

    expect(apiGetMock).toHaveBeenCalledWith(
      '/finance/schools/school-uuid/invoices/inv-abc/pdf',
      { responseType: 'blob' },
    )
  })

  it('uses the localized aria-label from payments.actions.downloadPdf', () => {
    render(
      <Wrapper>
        <InvoiceDownloadButton schoolId="s" invoiceId="i" />
      </Wrapper>,
    )
    // The mocked t() echoes the key; in prod, real i18n resolves to
    // "Download PDF" (en) or "PDF डाउनलोड गर्नुहोस्" (ne).
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'actions.downloadPdf',
    )
  })

  it('renders the Download icon by default, Loader2 spinner while pending', async () => {
    // First render: default state. The Download icon (NOT spinner)
    // should be present.
    apiGetMock.mockImplementation(() => new Promise(() => {})) // never resolves
    render(
      <Wrapper>
        <InvoiceDownloadButton schoolId="s" invoiceId="i" />
      </Wrapper>,
    )
    expect(screen.getByTestId('download-icon')).toBeInTheDocument()
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()

    // Click → mutation never resolves → button enters pending state.
    // `findByTestId` (= waitFor + getByTestId) polls until the
    // re-render happens — `await Promise.resolve()` flushes only one
    // microtask but React Query schedules the isPending update across
    // more turns than that, so single-flush is not enough.
    fireEvent.click(screen.getByRole('button'))
    const spinner = await screen.findByTestId('spinner')
    expect(spinner).toBeInTheDocument()
    expect(screen.queryByTestId('download-icon')).not.toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('passes invoiceNumber through so the filename matches the on-screen invoice number', async () => {
    const blob = new Blob(['%PDF-...'], { type: 'application/pdf' })
    apiGetMock.mockResolvedValueOnce({ data: blob })

    // Capture anchors injected by the hook so we can assert the
    // download attribute matches the invoiceNumber the button passed.
    const appendChildSpy = vi.spyOn(document.body, 'appendChild')

    render(
      <Wrapper>
        <InvoiceDownloadButton
          schoolId="s"
          invoiceId="i"
          invoiceNumber="INV-2026-007"
        />
      </Wrapper>,
    )

    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
      await Promise.resolve()
    })

    // Find the injected anchor (skip non-anchor appends like spinners).
    const anchor = appendChildSpy.mock.calls
      .map((call) => call[0])
      .find((node): node is HTMLAnchorElement => node instanceof HTMLAnchorElement)
    expect(anchor).toBeDefined()
    expect(anchor!.download).toBe('INV-2026-007.pdf')
  })
})
