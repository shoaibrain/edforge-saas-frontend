/**
 * Sprint M1.6 — Per-row Download PDF button on Invoice list.
 *
 * Locks in the critical per-row-isolation invariant: clicking
 * Download on row N must NOT disable Download on rows ≠ N. The
 * production code achieves this by giving each row its own
 * `useDownloadInvoicePdf()` hook instance (extracted as
 * `InvoiceDownloadIconButton`). A single hoisted mutation hook
 * would make all rows share `isPending`.
 *
 * The test stands up a tiny 3-row "table" using the same
 * `InvoiceDownloadIconButton` shape as production. Full page
 * render of `InvoicesPage` would require mocking 7+ unrelated
 * hooks; this pattern-level test exercises the only invariant
 * the M1.6 change introduces.
 *
 * Mocks at the api-client layer (same approach as M1.4 hook
 * spec). i18n + sonner mocked so we don't drag in the full
 * @edforge/i18n init.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Download, Loader2 } from 'lucide-react'

const apiGetMock = vi.fn()
vi.mock('@edforge/api-client', () => ({
  api: { get: apiGetMock },
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
}))

const tMock = vi.fn((key: string) => key)
vi.mock('@edforge/i18n', () => ({
  useTranslation: () => ({ t: tMock }),
}))

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
 * Production-equivalent per-row button. Each invocation creates its
 * own `useDownloadInvoicePdf` hook instance — that's the per-row
 * isolation contract under test.
 */
function InvoiceDownloadIconButton({
  schoolId,
  invoiceId,
}: {
  schoolId: string
  invoiceId: string
}) {
  const downloadInvoice = useDownloadInvoicePdf()
  return (
    <button
      type="button"
      data-testid={`btn-${invoiceId}`}
      onClick={() => downloadInvoice.mutate({ schoolId, invoiceId })}
      disabled={downloadInvoice.isPending}
      aria-label={tMock('actions.downloadPdf')}
    >
      {downloadInvoice.isPending ? (
        <Loader2 data-testid={`spinner-${invoiceId}`} />
      ) : (
        <Download data-testid={`icon-${invoiceId}`} />
      )}
    </button>
  )
}

function ThreeRowTable() {
  return (
    <div>
      <div data-testid="row-1">
        <InvoiceDownloadIconButton schoolId="s" invoiceId="inv-1" />
      </div>
      <div data-testid="row-2">
        <InvoiceDownloadIconButton schoolId="s" invoiceId="inv-2" />
      </div>
      <div data-testid="row-3">
        <InvoiceDownloadIconButton schoolId="s" invoiceId="inv-3" />
      </div>
    </div>
  )
}

describe('Invoice list — per-row Download button (M1.6)', () => {
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

  it('clicking row 2 calls the C.1.5 endpoint with row 2 invoice id', async () => {
    const blob = new Blob(['%PDF-...'], { type: 'application/pdf' })
    apiGetMock.mockResolvedValueOnce({ data: blob })

    render(
      <Wrapper>
        <ThreeRowTable />
      </Wrapper>,
    )

    const row2 = within(screen.getByTestId('row-2'))
    await act(async () => {
      fireEvent.click(row2.getByRole('button'))
      await Promise.resolve()
    })

    expect(apiGetMock).toHaveBeenCalledTimes(1)
    expect(apiGetMock).toHaveBeenCalledWith(
      '/finance/schools/s/invoices/inv-2/pdf',
      { responseType: 'blob', headers: { Accept: 'application/pdf' } },
    )
  })

  it('row 2 pending state does NOT disable rows 1 + 3', async () => {
    // Row 2's mock never resolves → its mutation stays pending forever.
    apiGetMock.mockImplementationOnce(() => new Promise(() => {}))

    render(
      <Wrapper>
        <ThreeRowTable />
      </Wrapper>,
    )

    const row1Button = within(screen.getByTestId('row-1')).getByRole('button')
    const row2Button = within(screen.getByTestId('row-2')).getByRole('button')
    const row3Button = within(screen.getByTestId('row-3')).getByRole('button')

    fireEvent.click(row2Button)
    // Wait for the per-row re-render to flip row 2 into pending.
    await screen.findByTestId('spinner-inv-2')

    // Per-row isolation invariant:
    expect(row2Button).toBeDisabled()
    expect(row1Button).not.toBeDisabled()
    expect(row3Button).not.toBeDisabled()
    expect(screen.queryByTestId('spinner-inv-1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('spinner-inv-3')).not.toBeInTheDocument()
  })

  it('rows 1 + 3 can be clicked independently while row 2 is still pending', async () => {
    // Row 2 hangs forever; rows 1 + 3 resolve normally.
    apiGetMock
      .mockImplementationOnce(() => new Promise(() => {})) // row 2
      .mockResolvedValueOnce({ data: new Blob(['%PDF']) }) // row 1
      .mockResolvedValueOnce({ data: new Blob(['%PDF']) }) // row 3

    render(
      <Wrapper>
        <ThreeRowTable />
      </Wrapper>,
    )

    // Click row 2 → it hangs.
    fireEvent.click(within(screen.getByTestId('row-2')).getByRole('button'))
    await screen.findByTestId('spinner-inv-2')

    // Row 1 still clickable. We expect TWO additional apiGet calls
    // (one per row), and crucially row 2 isn't re-fired.
    await act(async () => {
      fireEvent.click(within(screen.getByTestId('row-1')).getByRole('button'))
      await Promise.resolve()
    })
    await act(async () => {
      fireEvent.click(within(screen.getByTestId('row-3')).getByRole('button'))
      await Promise.resolve()
    })

    expect(apiGetMock).toHaveBeenCalledTimes(3)
    expect(apiGetMock).toHaveBeenNthCalledWith(
      1,
      '/finance/schools/s/invoices/inv-2/pdf',
      { responseType: 'blob', headers: { Accept: 'application/pdf' } },
    )
    expect(apiGetMock).toHaveBeenNthCalledWith(
      2,
      '/finance/schools/s/invoices/inv-1/pdf',
      { responseType: 'blob', headers: { Accept: 'application/pdf' } },
    )
    expect(apiGetMock).toHaveBeenNthCalledWith(
      3,
      '/finance/schools/s/invoices/inv-3/pdf',
      { responseType: 'blob', headers: { Accept: 'application/pdf' } },
    )
  })
})
