/**
 * Sprint M1.5-FU.4 — Per-row Download PDF button on Payments list.
 *
 * Locks in the critical per-row-isolation invariant: clicking
 * Download on row N must NOT disable Download on rows ≠ N. The
 * production code achieves this by giving each row its own
 * `useDownloadReceiptPdf()` hook instance (extracted as
 * `ReceiptDownloadIconButton`). A single hoisted mutation hook
 * would make all rows share `isPending`.
 *
 * Mirror of M1.6's `invoice-list-row-download.test.tsx`. Same
 * 3-row stand-in pattern. Full page render of `PaymentsPage`
 * would require mocking 7+ unrelated hooks; this pattern-level
 * test exercises the only invariant the M1.5-FU.4 change
 * introduces.
 *
 * Mocks at the api-client layer (same approach as the M1.4 hook
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

const { useDownloadReceiptPdf } = await import('@edforge/finance-services')

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

/**
 * Production-equivalent per-row button. Each invocation creates
 * its own `useDownloadReceiptPdf` hook instance — that's the
 * per-row isolation contract under test.
 */
function ReceiptDownloadIconButton({
  schoolId,
  paymentId,
}: {
  schoolId: string
  paymentId: string
}) {
  const downloadReceipt = useDownloadReceiptPdf()
  return (
    <button
      type="button"
      data-testid={`btn-${paymentId}`}
      onClick={() => downloadReceipt.mutate({ schoolId, paymentId })}
      disabled={downloadReceipt.isPending}
      aria-label={tMock('actions.downloadPdf')}
    >
      {downloadReceipt.isPending ? (
        <Loader2 data-testid={`spinner-${paymentId}`} />
      ) : (
        <Download data-testid={`icon-${paymentId}`} />
      )}
    </button>
  )
}

function ThreeRowTable() {
  return (
    <div>
      <div data-testid="row-1">
        <ReceiptDownloadIconButton schoolId="s" paymentId="pmt-1" />
      </div>
      <div data-testid="row-2">
        <ReceiptDownloadIconButton schoolId="s" paymentId="pmt-2" />
      </div>
      <div data-testid="row-3">
        <ReceiptDownloadIconButton schoolId="s" paymentId="pmt-3" />
      </div>
    </div>
  )
}

describe('Payments list — per-row Download button (M1.5-FU.4)', () => {
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

  it('clicking row 2 calls the C.1.6 endpoint with row 2 payment id', async () => {
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
      '/finance/payments/pmt-2/receipt/pdf',
      { params: { schoolId: 's' }, responseType: 'blob', headers: { Accept: 'application/pdf' } },
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
    await screen.findByTestId('spinner-pmt-2')

    // Per-row isolation invariant:
    expect(row2Button).toBeDisabled()
    expect(row1Button).not.toBeDisabled()
    expect(row3Button).not.toBeDisabled()
    expect(screen.queryByTestId('spinner-pmt-1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('spinner-pmt-3')).not.toBeInTheDocument()
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
    await screen.findByTestId('spinner-pmt-2')

    // Rows 1 + 3 still clickable. Expect TWO additional apiGet
    // calls (one per row), and crucially row 2 isn't re-fired.
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
      '/finance/payments/pmt-2/receipt/pdf',
      { params: { schoolId: 's' }, responseType: 'blob', headers: { Accept: 'application/pdf' } },
    )
    expect(apiGetMock).toHaveBeenNthCalledWith(
      2,
      '/finance/payments/pmt-1/receipt/pdf',
      { params: { schoolId: 's' }, responseType: 'blob', headers: { Accept: 'application/pdf' } },
    )
    expect(apiGetMock).toHaveBeenNthCalledWith(
      3,
      '/finance/payments/pmt-3/receipt/pdf',
      { params: { schoolId: 's' }, responseType: 'blob', headers: { Accept: 'application/pdf' } },
    )
  })
})
