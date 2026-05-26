/**
 * Sprint M0.5 — Logged 404 boundary.
 *
 * Confirms the boundary that replaced `defaultNotFoundComponent: () => null`
 * in `apps/finance/src/router.tsx` does the three things M0.5 needed:
 *   1. Renders a visible element so screens are no longer blank
 *   2. Fires a `console.warn` so the bug-of-this-shape is grep-able + claimable
 *   3. Exposes a "Return to home" affordance backed by `window.location.href`
 *
 * The boundary lives in `@edforge/ui` so the assertions cover the binding
 * the Finance MFE actually relies on (i.e. the published surface, not a
 * local copy).
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MfeNotFoundBoundary } from '@edforge/ui'

describe('MfeNotFoundBoundary', () => {
  afterEach(cleanup)

  it('renders the boundary UI when an MFE has no matching route', () => {
    render(<MfeNotFoundBoundary mfe="finance" />)
    const boundary = screen.getByTestId('mfe-not-found-boundary')
    expect(boundary).toBeInTheDocument()
    expect(boundary).toHaveAttribute('role', 'alert')
    // The "caught by <mfe>" string proves the prop is wired through;
    // a screenshot of this is enough to triage the wrong MFE.
    expect(boundary.textContent).toContain('finance')
  })

  it('fires a console.warn so cross-MFE nav bugs are no longer silent', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      render(<MfeNotFoundBoundary mfe="academics" />)
      // First arg captures the structured message; we don't assert the
      // exact wording — only that the warn fires for the right MFE so
      // future grep-by-mfe queries still resolve.
      expect(warnSpy).toHaveBeenCalled()
      const msg = warnSpy.mock.calls[0]?.[0] as string
      expect(msg).toMatch(/MfeNotFoundBoundary/)
      expect(msg).toMatch(/academics/)
    } finally {
      warnSpy.mockRestore()
    }
  })

  it('navigates to "/" via window.location.href when the home button is clicked', () => {
    // window.location is non-configurable in some environments. happy-dom
    // exposes it as a normal object so we can spy on the setter via a
    // proxy. Simplest path: capture writes by overriding `href` with a
    // setter on a fresh property descriptor.
    // Capture the actual Location object BEFORE replacing it — the
    // `finally` block restores this exact reference, not a plain-object
    // spread (which would leak into subsequent specs and lose Location
    // prototype semantics like `assign`, `reload`, etc.).
    const originalLocation = window.location
    const originalHref = originalLocation.href
    let nextHref: string | null = null
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        pathname: '/finance/wrong-route',
        // The component only reads `pathname` + writes `href`; this
        // stub keeps everything else intact while letting us assert.
        get href() {
          return originalHref
        },
        set href(value: string) {
          nextHref = value
        },
      },
    })

    try {
      render(<MfeNotFoundBoundary mfe="finance" />)
      const button = screen.getByRole('button', { name: /return to home/i })
      fireEvent.click(button)
      expect(nextHref).toBe('/')
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      })
    }
  })
})
