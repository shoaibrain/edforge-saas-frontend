/**
 * Sprint M1.11 — usePdfErrorToast helper.
 *
 * Locks in the canonical PDF error-toast UX:
 *   - title comes from `errors.pdf.<docType>DownloadFailed` (i18n)
 *   - description prefers the backend's Error.message verbatim
 *     (already user-readable: "Invoice not found", "Network Error", ...)
 *   - description falls back to `errors.generic` for empty / non-Error
 *     values
 *
 * Both download hooks (`useDownloadInvoicePdf` from M1.4 + the
 * existing `useDownloadReceiptPdf` from C.1.6) call this in their
 * mutation `onError`, so failed downloads stop being silent.
 *
 * Mocks `sonner` and `@edforge/i18n` at the module level — the helper
 * is pure UI plumbing with no other transitive concerns.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

// Mock sonner so we can capture toast invocations without rendering.
const toastErrorMock = vi.fn()
vi.mock('sonner', () => ({
  toast: { error: toastErrorMock },
}))

// Mock @edforge/i18n's useTranslation to return predictable keys.
// The real i18n is bootstrapped by the consuming app; in tests we
// just want to verify the right namespace + key combinations are
// requested. We echo back the key (with the `errors:` prefix
// stripped) so assertions can match against the key shape.
// Echo the requested key so assertions can verify which key the hook
// asked for. We deliberately ignore the `defaultValue` option so the
// spec checks the i18n CONTRACT (which keys), not the fallback copy.
// The real app's en/ne/errors.json files supply the user-facing text.
const tMock = vi.fn((key: string, _opts?: { defaultValue?: string }) => key)
vi.mock('@edforge/i18n', () => ({
  useTranslation: () => ({ t: tMock }),
}))

// Import AFTER the mocks so the hook binds to the mocked deps.
const { usePdfErrorToast } = await import('@edforge/finance-services')

describe('usePdfErrorToast', () => {
  beforeEach(() => {
    toastErrorMock.mockReset()
    tMock.mockClear()
  })

  afterEach(() => {
    toastErrorMock.mockReset()
  })

  it('returns a stable callback that fires toast.error', () => {
    const { result } = renderHook(() => usePdfErrorToast())
    act(() => {
      result.current(new Error('Invoice not found'))
    })
    expect(toastErrorMock).toHaveBeenCalledTimes(1)
  })

  it('uses the invoice title key by default', () => {
    const { result } = renderHook(() => usePdfErrorToast())
    act(() => {
      result.current(new Error('boom'))
    })
    const [title] = toastErrorMock.mock.calls[0]!
    // The mock t() echoes the key. The hook should ask for the
    // invoice-specific title when no docType is provided.
    expect(title).toBe('pdf.invoiceDownloadFailed')
  })

  it('picks the receipt title when docType="receipt"', () => {
    const { result } = renderHook(() => usePdfErrorToast())
    act(() => {
      result.current(new Error('boom'), 'receipt')
    })
    expect(toastErrorMock.mock.calls[0]![0]).toBe('pdf.receiptDownloadFailed')
  })

  it('picks the report-card title when docType="report-card"', () => {
    const { result } = renderHook(() => usePdfErrorToast())
    act(() => {
      result.current(new Error('boom'), 'report-card')
    })
    expect(toastErrorMock.mock.calls[0]![0]).toBe(
      'pdf.reportCardDownloadFailed',
    )
  })

  it('uses the Error.message as the description', () => {
    const { result } = renderHook(() => usePdfErrorToast())
    act(() => {
      result.current(new Error('Invoice not found'))
    })
    const opts = toastErrorMock.mock.calls[0]![1] as { description: string }
    expect(opts.description).toBe('Invoice not found')
  })

  it('falls back to the generic description when Error.message is empty', () => {
    const { result } = renderHook(() => usePdfErrorToast())
    act(() => {
      result.current(new Error(''))
    })
    const opts = toastErrorMock.mock.calls[0]![1] as { description: string }
    // The mock t() echoes the requested key when no defaultValue is
    // overridden by the lookup; the hook asked for `errors:generic`.
    expect(opts.description).toBe('generic')
  })

  it('falls back to the generic description for whitespace-only messages', () => {
    const { result } = renderHook(() => usePdfErrorToast())
    act(() => {
      result.current(new Error('   '))
    })
    const opts = toastErrorMock.mock.calls[0]![1] as { description: string }
    expect(opts.description).toBe('generic')
  })

  it('accepts a string error value and uses it as the description', () => {
    const { result } = renderHook(() => usePdfErrorToast())
    act(() => {
      result.current('Backend timeout', 'invoice')
    })
    const opts = toastErrorMock.mock.calls[0]![1] as { description: string }
    expect(opts.description).toBe('Backend timeout')
  })

  it('falls back to the generic description for non-Error, non-string values', () => {
    const { result } = renderHook(() => usePdfErrorToast())
    act(() => {
      result.current({ weird: 'shape' })
    })
    const opts = toastErrorMock.mock.calls[0]![1] as { description: string }
    expect(opts.description).toBe('generic')
  })
})
