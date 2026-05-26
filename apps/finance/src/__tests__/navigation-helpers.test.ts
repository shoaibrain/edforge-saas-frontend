/**
 * Sprint M1.1 — viewDocument + receiptHref helpers.
 *
 * The helpers live in `@edforge/finance-services` and centralize the
 * cross-MFE navigation pattern (`window.location.href` for shell-owned
 * routes). These specs lock in the contract that the M1.2 fix to the
 * Finance Payments View Receipt button — and every future cross-MFE
 * nav site — depends on.
 *
 * Why the spec lives in apps/finance, not packages/finance-services:
 *   M0.1 bootstrapped vitest in the Finance MFE. The shared
 *   finance-services package doesn't yet have its own test runner
 *   (no plan ticket for that). Tests against its public surface
 *   live in the consumer MFE for now.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { receiptHref, viewDocument } from '@edforge/finance-services'

describe('receiptHref', () => {
  it('builds the shell-owned receipt URL for a plain UUID', () => {
    expect(receiptHref('a1b2c3d4-1234-5678-90ab-cdef12345678')).toBe(
      '/payments/a1b2c3d4-1234-5678-90ab-cdef12345678/receipt',
    )
  })

  it('encodes characters that would otherwise break the URL', () => {
    expect(receiptHref('a b')).toBe('/payments/a%20b/receipt')
    expect(receiptHref('1/2')).toBe('/payments/1%2F2/receipt')
  })

  it('produces a path (no scheme/host) — shell route is same-origin', () => {
    const href = receiptHref('payment-123')
    expect(href.startsWith('/')).toBe(true)
    expect(href).not.toMatch(/^https?:/)
  })
})

describe('viewDocument', () => {
  // Capture the real Window + Location BEFORE any spec stubs them.
  // afterEach restores both references exactly so subsequent specs
  // don't see a plain-object replacement (same idiom adopted in
  // M0.5 followup for `mfe-not-found-boundary.test.tsx`).
  const originalWindow = globalThis.window
  const originalLocation = originalWindow.location

  afterEach(() => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: originalWindow,
    })
    Object.defineProperty(originalWindow, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })

  it('sets window.location.href to the given URL', () => {
    let nextHref: string | null = null
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        // Location properties are prototype getters in jsdom/happy-dom —
        // spread copies own props only, so we re-expose `origin`
        // explicitly. The new same-origin guard in viewDocument reads
        // it to resolve the target URL.
        get origin() {
          return originalLocation.origin
        },
        get href() {
          return originalLocation.href
        },
        set href(value: string) {
          nextHref = value
        },
      },
    })

    viewDocument('/payments/abc/receipt')
    expect(nextHref).toBe('/payments/abc/receipt')
  })

  it('is SSR-safe — no-op when window is unavailable', () => {
    // Simulate the SSR / node-test env by hiding `window`. The helper's
    // `typeof window` guard sees `undefined` and returns without
    // touching anything. afterEach restores the real reference.
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: undefined,
    })
    expect(() => viewDocument('/payments/abc/receipt')).not.toThrow()
  })

  // ----- same-origin guard (open-redirect protection) -----

  /**
   * Wraps each rejection case in a tiny helper: stub `window.location`
   * with a writable `href`, call `viewDocument(unsafeHref)`, and assert
   * the setter was never invoked. A `console.warn` spy confirms the
   * helper surfaces the bug instead of silently dropping.
   */
  const expectRefused = (unsafeHref: string) => {
    let nextHref: string | null = null
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        get origin() {
          return originalLocation.origin
        },
        get href() {
          return originalLocation.href
        },
        set href(value: string) {
          nextHref = value
        },
      },
    })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      viewDocument(unsafeHref)
      expect(nextHref).toBeNull()
      expect(warnSpy).toHaveBeenCalled()
      expect(warnSpy.mock.calls[0]?.[0]).toMatch(/Refusing to navigate/)
    } finally {
      warnSpy.mockRestore()
    }
  }

  it('refuses protocol-relative URLs (//evil.com/path)', () => {
    expectRefused('//evil.com/path')
  })

  it('refuses cross-origin absolute URLs', () => {
    expectRefused('https://evil.com/path')
  })

  it('refuses javascript: URIs', () => {
    expectRefused('javascript:alert(1)')
  })

  it('refuses data: URIs', () => {
    expectRefused('data:text/html,<script>alert(1)</script>')
  })

  it('allows same-origin absolute URLs', () => {
    let nextHref: string | null = null
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        get origin() {
          return originalLocation.origin
        },
        get href() {
          return originalLocation.href
        },
        set href(value: string) {
          nextHref = value
        },
      },
    })
    const safeAbsolute = `${originalLocation.origin}/payments/abc/receipt`
    viewDocument(safeAbsolute)
    expect(nextHref).toBe(safeAbsolute)
  })
})
