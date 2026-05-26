/**
 * Breadcrumbs — FU.7.1 navigability invariant.
 *
 * Locks in the rule introduced by Sprint M1.5-FU.7.1 (closes Issue #18):
 * a URL segment that doesn't correspond to a routable match must NOT
 * render as a `<Link>`. The bug it prevents: clicking the auto-generated
 * "Details" crumb on `/finance/payments/<UUID>/receipt` was navigating
 * to `/finance/payments/<UUID>` which falls through every MFE router
 * and lands in `MfeNotFoundBoundary`.
 *
 * We mock `useMatches` directly. That keeps the test fully decoupled
 * from TanStack Router's internals — the only invariant under test is
 * the component's choice of `<span>` vs `<Link>` given a known matches
 * array, which is the choice the fix is about.
 *
 * Why mock the Link as a plain anchor: render-only assertions need to
 * inspect the rendered tag (`a` vs `span`), and TanStack Router's
 * `<Link>` would otherwise require a full router instance to render.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

// Mocks must be set up BEFORE the Breadcrumbs import runs.
const useMatchesMock = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useMatches: () => useMatchesMock(),
  Link: ({ children, to, ...rest }: { children: ReactNode; to: string; [k: string]: unknown }) => {
    // Strip class/style noise to keep DOM matchers simple
    const safeProps: Record<string, unknown> = {}
    for (const key of Object.keys(rest)) {
      if (key === 'className' || key === 'title') safeProps[key] = rest[key]
    }
    return (
      <a href={to} data-link {...safeProps}>
        {children}
      </a>
    )
  },
}))

vi.mock('@edforge/i18n', () => ({
  useTranslation: () => ({
    // Echo the key back. For breadcrumb-prefixed lookups, strip the
    // prefix so the rendered label matches what the param-resolution
    // path produces for our fixture (`Student Details` etc would be
    // overkill — `studentDetails` is fine for assertions).
    t: (key: string, options?: { defaultValue?: string }) => {
      if (key === 'home') return 'Home'
      return options?.defaultValue ?? key
    },
  }),
}))

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: () => (props: Record<string, unknown>) => {
        const { children, ...rest } = props as { children?: ReactNode }
        const tagProps: Record<string, unknown> = {}
        // Drop motion-only props (initial/animate/exit/transition)
        for (const k of Object.keys(rest)) {
          if (!['initial', 'animate', 'exit', 'transition'].includes(k)) {
            tagProps[k] = rest[k]
          }
        }
        return <li {...tagProps}>{children}</li>
      },
    },
  ),
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

// `cn` helper resolves at module init — re-export the real one (no
// behavior change; only avoids a "Cannot find module" if path differs).
vi.mock('../../../lib/utils', () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(' '),
}))

const { Breadcrumbs } = await import('../Breadcrumbs')

interface MockMatch {
  pathname: string
  routeId?: string
  params?: Record<string, string>
}

function setMatches(matches: MockMatch[]) {
  useMatchesMock.mockReturnValue(matches)
}

describe('Breadcrumbs — M1.5-FU.7.1 navigability rule', () => {
  it('does NOT render a Link for a dynamic UUID segment whose pathname has no match (FU.7.1 invariant)', () => {
    // Simulates /finance/payments/<UUID>/receipt where the routing
    // structure is `/payments` → `/payments/$paymentId/receipt`. There
    // is no `/finance/payments/<UUID>` route, so the UUID crumb must
    // not be clickable — pre-fix it generated an `<a href="/finance/
    // payments/<UUID>">` that fell through every MFE router into
    // `MfeNotFoundBoundary`. (The crumb's rendered label text varies
    // depending on whether `paymentId` is in `PARAM_KEYS` or falls
    // through to the `'PaymentId'.replace(/Id$/, ' Details')` fallback
    // — asserting against the path-href contract is the invariant
    // that actually matters.)
    const paymentId = '1dbe886b-1a1f-42f6-a188-4042a785fbec'
    setMatches([
      { pathname: '/' },
      { pathname: '/finance', routeId: '/finance' },
      { pathname: '/finance/payments', routeId: '/finance/payments' },
      // Note: NO match at /finance/payments/<UUID> — that's the bug fixture.
      {
        pathname: `/finance/payments/${paymentId}/receipt`,
        routeId: '/finance/payments/$paymentId/receipt',
        params: { paymentId },
      },
    ])

    render(<Breadcrumbs />)

    // PRIMARY CONTRACT: the UUID-derived path is never linkable.
    const allLinks = screen.getAllByRole('link')
    expect(
      allLinks.some((el) => el.getAttribute('href') === `/finance/payments/${paymentId}`),
    ).toBe(false)

    // SANITY: a regular intermediate segment with a matching route
    // (`/finance/payments`) IS still linkable. Pre-fix this also
    // worked; the FU.7.1 change should not have regressed it.
    const paymentsLinks = allLinks.filter(
      (el) => el.getAttribute('href') === '/finance/payments',
    )
    expect(paymentsLinks.length).toBe(1)
  })

  it('renders a navigable non-current segment as a Link when a matching pathname exists', () => {
    // /finance/payments — both `/finance` and `/finance/payments` are
    // routable; only `/finance` should be clickable (Payments is the
    // current page).
    setMatches([
      { pathname: '/' },
      { pathname: '/finance', routeId: '/finance' },
      { pathname: '/finance/payments', routeId: '/finance/payments' },
    ])

    render(<Breadcrumbs />)

    const financeLinks = screen
      .getAllByRole('link')
      .filter((el) => el.getAttribute('href') === '/finance')
    expect(financeLinks.length).toBe(1)
  })

  it('always treats the current page (last segment) as a non-Link span even when matching', () => {
    setMatches([
      { pathname: '/' },
      { pathname: '/settings', routeId: '/settings' },
      { pathname: '/settings/branding', routeId: '/settings/branding' },
    ])

    render(<Breadcrumbs />)

    // 'branding' is the current page — must not be a Link even though
    // its pathname matches a route.
    const allLinks = screen.getAllByRole('link')
    expect(
      allLinks.some((el) => el.getAttribute('href') === '/settings/branding'),
    ).toBe(false)
  })
})
