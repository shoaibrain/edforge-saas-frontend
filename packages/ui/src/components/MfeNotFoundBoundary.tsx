/**
 * MfeNotFoundBoundary
 *
 * Renders when a Module Federation host (Shell) hands an MFE a route the
 * MFE's `@tanstack/react-router` does NOT recognize.
 *
 * Why this exists at all:
 *   Every MFE's router declares `basepath: '/<mfe>'` and historically used
 *   `defaultNotFoundComponent: () => null`. When code in one MFE navigated
 *   to a route owned by another MFE (or by Shell) — e.g.
 *   `navigate({to: '/payments/${id}/receipt'})` from within Finance — the
 *   local router resolved the path against its own basepath, found no
 *   match, and rendered `null`. The screen went blank. No error in the
 *   console. No telemetry. A class of cross-MFE bugs were invisible.
 *
 *   This component replaces `null` with:
 *     1. A visible explanatory UI so the operator sees a problem.
 *     2. A `console.warn` capturing the bad URL + which MFE caught it,
 *        so the next bug-of-this-shape is grep-able + claim-able by the
 *        right team.
 *     3. A primary action that returns to Shell — `window.location.href`
 *        to `/` does a clean cross-MFE reset.
 *
 * Implements ticket M0.5 of the PDF service MFE integration plan
 * (`docs/pilot-greenlight/pdf-service-mfe-integration-plan.md` §2).
 */

import { useEffect } from 'react'
import { AlertTriangle, Home } from 'lucide-react'

export interface MfeNotFoundBoundaryProps {
  /**
   * The MFE that caught this 404 — `'finance'`, `'academics'`, …
   * Goes into the warn-log message + the on-screen "caught by" copy
   * so a screenshot is enough to identify the wrong MFE.
   */
  mfe: string
}

export function MfeNotFoundBoundary({ mfe }: MfeNotFoundBoundaryProps) {
  // `window.location.pathname` is the path the router tried to resolve.
  // SSR-safe guard for environments where `window` is absent (vitest +
  // happy-dom both provide it, but defensive code costs nothing here).
  const attemptedPath =
    typeof window !== 'undefined' ? window.location.pathname : '<unknown>'

  // Fire the warn in an effect so render stays pure. React strict-mode
  // in dev will run effects once per (mfe, attemptedPath) tuple change;
  // the message is identifiable so duplicate fires in dev are harmless.
  useEffect(() => {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn(
        `[MfeNotFoundBoundary] No route matched in MFE "${mfe}" for path "${attemptedPath}". ` +
          `This usually means a cross-MFE navigation used the local router's basepath when it should have used window.location.href.`,
      )
    }
  }, [mfe, attemptedPath])

  const goHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  return (
    <div
      data-testid="mfe-not-found-boundary"
      role="alert"
      className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
    >
      <div className="mb-4 p-3 rounded-full bg-amber-100 dark:bg-amber-500/10">
        <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
      </div>
      <h1 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">
        Page not found
      </h1>
      <p className="text-sm text-[rgb(var(--text-secondary))] max-w-md mb-1">
        We couldn&apos;t find anything at{' '}
        <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-[rgb(var(--surface-tertiary))]">
          {attemptedPath}
        </code>
        .
      </p>
      <p className="text-xs text-[rgb(var(--text-tertiary))] mb-6">
        Caught by the <strong>{mfe}</strong> module.
      </p>
      <button
        type="button"
        onClick={goHome}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 active:bg-teal-800 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
      >
        <Home className="w-4 h-4" />
        Return to home
      </button>
    </div>
  )
}
