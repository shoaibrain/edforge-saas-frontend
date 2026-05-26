/**
 * Cross-MFE navigation helpers.
 *
 * Centralizes the URL patterns + the navigation primitive for moving
 * between MFE-owned and shell-owned routes. The Receipt page is the
 * canonical example: it lives in Shell at `/payments/:paymentId/receipt`
 * but is invoked from the Finance MFE's payments index. Finance's
 * `@tanstack/react-router` has `basepath: '/finance'`, so a local
 * `navigate({to: '/payments/.../receipt'})` resolves to
 * `/finance/payments/.../receipt` (no such route) and prior to M0.5
 * silently rendered `null`. That was the PR #64 View Receipt
 * regression.
 *
 * `viewDocument` does a full-page navigation via `window.location.href`.
 * That:
 *   - bypasses the local MFE router's basepath entirely
 *   - lets Shell mount the correct route on cold load
 *   - preserves Cognito auth (Amplify rehydrates from localStorage on
 *     full reload; verified separately in M0.6)
 *
 * Wrapping the primitive in a helper means: when (if) we ever decide
 * to swap to a shell-exposed router bridge (plan §0.5 Option B), one
 * file changes — not every call site.
 *
 * Implements ticket M1.1 of the PDF service MFE integration plan
 * (`docs/pilot-greenlight/pdf-service-mfe-integration-plan.md` §3).
 */

/**
 * Navigate to a same-origin URL via a full-page load.
 *
 * SSR/test-safe: if `window` is absent (e.g. node-only vitest env),
 * the call is a no-op. happy-dom + jsdom both provide `window`, so
 * normal browser code paths always fire the redirect.
 *
 * Intentionally NOT a wrapper around `<a href>` — this is for
 * programmatic navigation triggered by click handlers; the anchor
 * approach loses our type-safety + can be confused with download
 * anchors.
 */
export function viewDocument(href: string): void {
  if (typeof window !== 'undefined') {
    window.location.href = href
  }
}

/**
 * Build the shell-owned URL for a payment receipt page.
 *
 * `paymentId` is encoded to be URL-safe — DDB payment UUIDs are
 * always safe, but treating untrusted input safely is cheap and
 * means the same helper can power deep-link scenarios where the
 * id originates from a user-supplied source.
 */
export function receiptHref(paymentId: string): string {
  return `/payments/${encodeURIComponent(paymentId)}/receipt`
}
