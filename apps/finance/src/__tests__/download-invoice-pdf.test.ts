/**
 * Sprint M1.3 — downloadInvoicePdf service.
 *
 * Locks in the contract that the M1.4 hook + the M1.5/M1.6 button
 * call sites depend on:
 *   - happy path returns the Blob from `api.get(...)` as-is
 *   - blob-wrapped JSON error → throws `new Error(message)` with the
 *     backend's `message` field
 *   - blob-wrapped JSON with non-string `message` → throws with
 *     JSON.stringify(message), never `"[object Object]"`
 *   - blob-wrapped non-JSON text → throws with the raw text
 *   - non-blob error → re-thrown unchanged when it's an Error
 *
 * Tests live in apps/finance per M0.1's vitest setup. The shared
 * package itself doesn't have a test runner yet (no plan ticket for
 * that). Mocking @edforge/api-client through vitest's `vi.mock` keeps
 * the spec hermetic — no axios interceptors or auth wiring needed.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// vi.mock must be hoisted, so we can't reference local helpers here.
// Each spec sets `api.get.mockResolvedValue(...)` / `.mockRejectedValue(...)`
// inside `beforeEach`-driven test bodies.
const apiGetMock = vi.fn()
vi.mock('@edforge/api-client', () => ({
  api: { get: apiGetMock },
  // The service file imports these too; harmless to expose them as no-ops
  // since none of the specs exercise their behavior.
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
}))

// Import AFTER vi.mock so the service binds to the mocked module.
const { downloadInvoicePdf } = await import('@edforge/finance-services')

describe('downloadInvoicePdf', () => {
  beforeEach(() => {
    apiGetMock.mockReset()
  })

  afterEach(() => {
    apiGetMock.mockReset()
  })

  it('returns the Blob from a 200 response', async () => {
    const pdfBlob = new Blob(['%PDF-1.7...'], { type: 'application/pdf' })
    apiGetMock.mockResolvedValueOnce({ data: pdfBlob })

    const result = await downloadInvoicePdf('school-1', 'inv-1')

    expect(result).toBe(pdfBlob)
    expect(apiGetMock).toHaveBeenCalledWith(
      '/finance/schools/school-1/invoices/inv-1/pdf',
      { responseType: 'blob' },
    )
  })

  it('throws when the success response body is not a Blob', async () => {
    // E.g. some proxy stripped the binary body. Defensive guard so
    // the consumer never tries to feed undefined into URL.createObjectURL.
    apiGetMock.mockResolvedValueOnce({ data: null })

    await expect(downloadInvoicePdf('school-1', 'inv-1')).rejects.toThrow(
      'Server returned an invalid response for invoice PDF',
    )
  })

  it('unwraps a blob-wrapped JSON {message: string} error', async () => {
    const errorBlob = new Blob([JSON.stringify({ message: 'Invoice not found' })], {
      type: 'application/json',
    })
    apiGetMock.mockRejectedValueOnce({
      response: { status: 404, data: errorBlob },
    })

    await expect(downloadInvoicePdf('school-1', 'inv-1')).rejects.toThrow(
      'Invoice not found',
    )
  })

  it('serializes a blob-wrapped JSON {message: object} error via JSON.stringify', async () => {
    // Guards against the future ValidationException shape where the
    // backend returns `{ message: { field, error } }`. We must NOT
    // surface `"[object Object]"` to the UI.
    const validationError = { message: { field: 'amount', error: 'must be positive' } }
    const errorBlob = new Blob([JSON.stringify(validationError)], {
      type: 'application/json',
    })
    apiGetMock.mockRejectedValueOnce({
      response: { status: 400, data: errorBlob },
    })

    await expect(downloadInvoicePdf('school-1', 'inv-1')).rejects.toThrow(
      JSON.stringify(validationError.message),
    )
  })

  it('falls back to raw text when the blob body is not JSON', async () => {
    // E.g. an ALB / proxy returned an HTML error page.
    const errorBlob = new Blob(['<html>504 Gateway Timeout</html>'], {
      type: 'text/html',
    })
    apiGetMock.mockRejectedValueOnce({
      response: { status: 504, data: errorBlob },
    })

    await expect(downloadInvoicePdf('school-1', 'inv-1')).rejects.toThrow(
      '<html>504 Gateway Timeout</html>',
    )
  })

  it('re-throws non-blob Error instances unchanged', async () => {
    const networkError = new Error('Network Error')
    apiGetMock.mockRejectedValueOnce(networkError)

    await expect(downloadInvoicePdf('school-1', 'inv-1')).rejects.toBe(networkError)
  })

  it('wraps non-Error throws with a generic message', async () => {
    // Defensive: if axios ever rejects with a string or undefined,
    // the consumer still gets an Error it can introspect.
    apiGetMock.mockRejectedValueOnce('something weird')

    await expect(downloadInvoicePdf('school-1', 'inv-1')).rejects.toThrow(
      'Failed to download invoice PDF',
    )
  })
})
