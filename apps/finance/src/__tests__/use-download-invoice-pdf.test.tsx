/**
 * Sprint M1.4 — useDownloadInvoicePdf hook.
 *
 * Locks in the hook contract M1.5 (Invoice detail page) and
 * M1.6 (per-row list action) call sites depend on:
 *   - mutationFn invokes the service with (schoolId, invoiceId)
 *   - onSuccess constructs a Blob with `application/pdf` MIME,
 *     creates an anchor, clicks it, schedules cleanup at 100ms
 *   - filename uses `invoiceNumber` when present, falls back to
 *     `invoice-<8-char-id>.pdf` otherwise
 *
 * Mocks at the api-client layer (the bottom of the stack) rather
 * than at the service or hook level. Reasoning:
 *
 *   The hook imports `downloadInvoicePdf` from `'../services/...'`
 *   (a package-internal path), NOT from the public barrel. A
 *   `vi.mock('@edforge/finance-services', ...)` would override the
 *   barrel re-export but the hook source already captured the REAL
 *   service at module-evaluation time via the internal path. Mocking
 *   `@edforge/api-client` instead lets the real service run (and
 *   incidentally double-checks that the M1.3 service still wires
 *   through correctly) — clean end-to-end-with-fake-transport.
 *
 * Tests live in apps/finance per M0.1.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

// Mock the api-client transport layer. M1.3's service spec uses the
// same approach.
const apiGetMock = vi.fn()
vi.mock('@edforge/api-client', () => ({
  api: { get: apiGetMock },
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
}))

// Import AFTER vi.mock so the service (and the hook that wraps it)
// bind to the mocked api transport.
const { useDownloadInvoicePdf } = await import('@edforge/finance-services')

function wrapper({ children }: { children: ReactNode }) {
  // Fresh QueryClient per test — disable retries so error-path specs
  // surface failures immediately instead of waiting for backoff.
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe('useDownloadInvoicePdf', () => {
  // `vi.spyOn` returns more-specific `MockInstance<TSpecificSig>` types
  // that don't widen to the abstract `ReturnType<typeof vi.spyOn>`. The
  // cleanest workaround in test code is a permissive any — we only use
  // these refs as recording handles, never as typed callbacks.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let createObjectURLSpy: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let revokeObjectURLSpy: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let appendChildSpy: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let removeChildSpy: any

  beforeEach(() => {
    apiGetMock.mockReset()
    // happy-dom doesn't implement createObjectURL by default — stub
    // it so the spy below can intercept calls cleanly.
    if (typeof URL.createObjectURL !== 'function') {
      ;(URL as unknown as { createObjectURL: () => string }).createObjectURL =
        () => 'blob:stub'
      ;(URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL =
        () => undefined
    }
    createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:test-url')
    revokeObjectURLSpy = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {})
    appendChildSpy = vi.spyOn(document.body, 'appendChild')
    removeChildSpy = vi.spyOn(document.body, 'removeChild')
  })

  afterEach(() => {
    vi.useRealTimers() // safe no-op if fake timers weren't enabled
    createObjectURLSpy.mockRestore()
    revokeObjectURLSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })

  it('calls the C.1.5 endpoint with (schoolId, invoiceId)', async () => {
    const blob = new Blob(['%PDF-...'], { type: 'application/pdf' })
    apiGetMock.mockResolvedValueOnce({ data: blob })

    const { result } = renderHook(() => useDownloadInvoicePdf(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        schoolId: 'school-1',
        invoiceId: 'inv-abc',
        invoiceNumber: 'INV-2026-001',
      })
    })

    expect(apiGetMock).toHaveBeenCalledWith(
      '/finance/schools/school-1/invoices/inv-abc/pdf',
      { responseType: 'blob', headers: { Accept: 'application/pdf' } },
    )
  })

  // Helper: scrape the anchor the hook injected from the spy's
  // recorded calls. Avoids `mockImplementation`'s generic-erasure
  // typing issues with HTMLElement.appendChild's <T extends Node>.
  function getAnchor(): HTMLAnchorElement | null {
    for (const call of appendChildSpy.mock.calls) {
      const node = call[0]
      if (node instanceof HTMLAnchorElement) return node
    }
    return null
  }

  it('uses invoiceNumber as the filename when supplied', async () => {
    const blob = new Blob(['%PDF-...'], { type: 'application/pdf' })
    apiGetMock.mockResolvedValueOnce({ data: blob })

    const { result } = renderHook(() => useDownloadInvoicePdf(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({
        schoolId: 'school-1',
        invoiceId: 'inv-abc-1234',
        invoiceNumber: 'INV-2026-001',
      })
    })

    const anchor = getAnchor()
    expect(anchor).not.toBeNull()
    expect(anchor!.download).toBe('INV-2026-001.pdf')
    expect(anchor!.href).toBe('blob:test-url')
  })

  it('treats empty or whitespace-only invoiceNumber as absent (no ".pdf" filename)', async () => {
    // Regression guard for the post-M1.4 CodeRabbit finding: `??`
    // only falls back on null/undefined, so an empty string produced
    // ".pdf" (no name). The fix uses `.trim() ||` so empty AND
    // whitespace-only strings fall through to the id-derived name.
    const blob = new Blob(['%PDF-...'], { type: 'application/pdf' })
    apiGetMock.mockResolvedValueOnce({ data: blob })

    const { result } = renderHook(() => useDownloadInvoicePdf(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({
        schoolId: 'school-1',
        invoiceId: 'abcdef1234567890',
        invoiceNumber: '   ', // whitespace only
      })
    })

    const anchor = getAnchor()
    expect(anchor!.download).toBe('invoice-abcdef12.pdf')
  })

  it('falls back to invoice-<first-8-chars-of-id>.pdf when invoiceNumber is absent', async () => {
    const blob = new Blob(['%PDF-...'], { type: 'application/pdf' })
    apiGetMock.mockResolvedValueOnce({ data: blob })

    const { result } = renderHook(() => useDownloadInvoicePdf(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({
        schoolId: 'school-1',
        invoiceId: 'abcdef1234567890-and-the-rest',
      })
    })

    const anchor = getAnchor()
    expect(anchor).not.toBeNull()
    expect(anchor!.download).toBe('invoice-abcdef12.pdf')
  })

  it('wraps the response Blob with application/pdf MIME', async () => {
    const blob = new Blob(['%PDF-...'], { type: 'application/octet-stream' })
    apiGetMock.mockResolvedValueOnce({ data: blob })

    const { result } = renderHook(() => useDownloadInvoicePdf(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ schoolId: 's', invoiceId: 'i' })
    })

    // createObjectURL must receive a freshly-MIME'd Blob (the response
    // had `application/octet-stream`). Safari + Edge need the explicit
    // application/pdf MIME on the client-side Blob to honor the .pdf
    // extension on save.
    const blobArg = createObjectURLSpy.mock.calls[0]![0] as Blob
    expect(blobArg).toBeInstanceOf(Blob)
    expect(blobArg.type).toBe('application/pdf')
  })

  it('cleans up the anchor + revokes the object URL after 100ms', async () => {
    // Fake timers ONLY for this spec — RTL's waitFor uses real timers
    // internally so global fake-timer usage breaks the other specs.
    vi.useFakeTimers()

    const blob = new Blob(['%PDF-...'], { type: 'application/pdf' })
    apiGetMock.mockResolvedValueOnce({ data: blob })

    const { result } = renderHook(() => useDownloadInvoicePdf(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ schoolId: 's', invoiceId: 'i' })
    })

    // Pre-timeout: anchor inserted, NOT yet removed/revoked.
    expect(appendChildSpy).toHaveBeenCalled()
    expect(removeChildSpy).not.toHaveBeenCalled()
    expect(revokeObjectURLSpy).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    expect(removeChildSpy).toHaveBeenCalled()
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test-url')
  })
})
