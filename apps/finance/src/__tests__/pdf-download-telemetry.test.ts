/**
 * Sprint M1.10 — PDF download telemetry.
 *
 * Two layers:
 *   1. classifyPdfDownloadError — pure function mapping Error.message
 *      shapes to coarse error_class strings for the dashboard pivot.
 *   2. trackPdfDownload{Started,Succeeded,Failed} — emit the events
 *      via `window.va` (the Vercel analytics global installed by
 *      `<Analytics />` in apps/shell/src/main.tsx).
 *
 * The hook-level adoption (started/succeeded/failed firing inside
 * useDownloadInvoicePdf / useDownloadReceiptPdf) is covered by the
 * existing M1.4 hook spec — we extend it in a sibling test rather
 * than re-mocking the whole stack here.
 *
 * No PII guard: assertions explicitly verify that no payment id,
 * invoice number, or backend message reaches the payload.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  classifyPdfDownloadError,
  trackPdfDownloadFailed,
  trackPdfDownloadStarted,
  trackPdfDownloadSucceeded,
} from '@edforge/finance-services/utils/telemetry'

describe('classifyPdfDownloadError', () => {
  it('returns "unauthorized" for 401 / session-expired messages', () => {
    expect(classifyPdfDownloadError(new Error('Request failed with status code 401'))).toBe(
      'unauthorized',
    )
    expect(classifyPdfDownloadError(new Error('Unauthorized'))).toBe('unauthorized')
    expect(classifyPdfDownloadError(new Error('Session expired'))).toBe('unauthorized')
  })

  it('returns "forbidden" for 403 / permission messages', () => {
    expect(classifyPdfDownloadError(new Error('Request failed with status code 403'))).toBe(
      'forbidden',
    )
    expect(classifyPdfDownloadError(new Error('Forbidden'))).toBe('forbidden')
    expect(classifyPdfDownloadError(new Error('Missing permission'))).toBe('forbidden')
  })

  it('returns "not_found" for 404 / "not found" messages', () => {
    expect(classifyPdfDownloadError(new Error('Request failed with status code 404'))).toBe(
      'not_found',
    )
    expect(
      classifyPdfDownloadError(
        new Error('Payment 1dbe886b-1a1f-42f6-a188-4042a785fbec not found'),
      ),
    ).toBe('not_found')
  })

  it('returns "server_error" for 5xx messages', () => {
    expect(classifyPdfDownloadError(new Error('Request failed with status code 500'))).toBe(
      'server_error',
    )
    expect(classifyPdfDownloadError(new Error('Internal Server Error'))).toBe('server_error')
    expect(classifyPdfDownloadError(new Error('Request failed with status code 503'))).toBe(
      'server_error',
    )
  })

  it('returns "network" for network / timeout / fetch errors', () => {
    expect(classifyPdfDownloadError(new Error('Network Error'))).toBe('network')
    expect(classifyPdfDownloadError(new Error('fetch failed'))).toBe('network')
    expect(classifyPdfDownloadError(new Error('Request timeout'))).toBe('network')
    expect(classifyPdfDownloadError(new Error('Connection aborted'))).toBe('network')
  })

  it('returns "unknown" for non-Error values and unrecognized shapes', () => {
    expect(classifyPdfDownloadError('a bare string')).toBe('unknown')
    expect(classifyPdfDownloadError(undefined)).toBe('unknown')
    expect(classifyPdfDownloadError(null)).toBe('unknown')
    expect(classifyPdfDownloadError({ weird: 'shape' })).toBe('unknown')
    expect(classifyPdfDownloadError(new Error('quantum tunneling encountered'))).toBe('unknown')
  })
})

describe('track helpers — event shape via window.va', () => {
  let vaSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vaSpy = vi.fn()
    // Install our spy as the Vercel analytics global. The helpers
    // call `window.va?.(...)` so the spy receives every event.
    ;(window as Window & { va?: typeof vaSpy }).va = vaSpy
  })

  afterEach(() => {
    // Remove the global so other specs don't see a leaked spy.
    delete (window as Window & { va?: typeof vaSpy }).va
  })

  it('trackPdfDownloadStarted emits pdf_download_started with doc_type + school_id only', () => {
    trackPdfDownloadStarted({ docType: 'invoice', schoolId: 'school-uuid' })
    expect(vaSpy).toHaveBeenCalledTimes(1)
    const [eventType, payload] = vaSpy.mock.calls[0]!
    expect(eventType).toBe('event')
    expect(payload).toEqual({
      name: 'pdf_download_started',
      doc_type: 'invoice',
      school_id: 'school-uuid',
    })
  })

  it('trackPdfDownloadSucceeded emits with byte_size, no PII', () => {
    trackPdfDownloadSucceeded({
      docType: 'receipt',
      schoolId: 'school-uuid',
      byteSize: 17034,
    })
    const [, payload] = vaSpy.mock.calls[0]!
    expect(payload).toEqual({
      name: 'pdf_download_succeeded',
      doc_type: 'receipt',
      school_id: 'school-uuid',
      byte_size: 17034,
    })
  })

  it('trackPdfDownloadFailed emits error_class derived from the error, never the raw message', () => {
    // The error message contains a payment id (PII-adjacent). The
    // emitted payload must NOT carry it — only the classifier output.
    trackPdfDownloadFailed({
      docType: 'invoice',
      schoolId: 'school-uuid',
      error: new Error(
        'Payment 1dbe886b-1a1f-42f6-a188-4042a785fbec not found',
      ),
    })
    const [, payload] = vaSpy.mock.calls[0]!
    expect(payload).toEqual({
      name: 'pdf_download_failed',
      doc_type: 'invoice',
      school_id: 'school-uuid',
      error_class: 'not_found',
    })
    // PII guard — the raw message must not leak under any key.
    const flat = JSON.stringify(payload)
    expect(flat).not.toContain('1dbe886b')
    expect(flat).not.toContain('Payment')
  })

  it('no-ops cleanly when window.va is absent (shell not yet mounted)', () => {
    delete (window as Window & { va?: typeof vaSpy }).va
    expect(() =>
      trackPdfDownloadStarted({ docType: 'invoice', schoolId: 's' }),
    ).not.toThrow()
    expect(() =>
      trackPdfDownloadSucceeded({ docType: 'invoice', schoolId: 's', byteSize: 1 }),
    ).not.toThrow()
    expect(() =>
      trackPdfDownloadFailed({
        docType: 'invoice',
        schoolId: 's',
        error: new Error('x'),
      }),
    ).not.toThrow()
  })
})
