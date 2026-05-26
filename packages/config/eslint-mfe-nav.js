/**
 * @edforge/config — MFE navigation lint rule.
 *
 * Forbids hard-coded shell-owned route patterns inside `navigate({to: ...})`
 * calls made from non-shell MFE source files. The exact bug this catches:
 *
 *   // apps/finance/src/... — Finance's router has basepath: '/finance'
 *   navigate({ to: '/payments/${id}/receipt' })
 *   // resolves against the local basepath → /finance/payments/.../receipt
 *   // → no such route → MfeNotFoundBoundary (M0.5) renders the 404 panel
 *
 * That regression (PR #64 on this repo, pre-M0.5) was the trigger for
 * the whole PDF service MFE integration plan. M1.2 fixed the View
 * Receipt call site; this rule prevents the same shape from being
 * reintroduced anywhere else.
 *
 * Implements ticket M0.7 of the plan
 * (`docs/pilot-greenlight/pdf-service-mfe-integration-plan.md` §2).
 *
 * Why scoped to MFEs only, not Shell:
 *   Shell IS the host. `navigate({to: '/payments/...'})` is correct
 *   inside `apps/shell`. Only NON-shell MFEs need the guard.
 *
 * Why route-PATTERNS, not prefixes:
 *   Several MFEs own routes that LOOK shell-shaped because the local
 *   router's basepath strips the MFE prefix. Examples (inventoried
 *   2026-05-26 against actual apps/<name>/src/router.tsx files):
 *     - apps/finance owns `/payments` + `/payments/record` (→ /finance/...)
 *     - apps/finance owns `/dashboard`
 *     - apps/analytics owns `/dashboard` + `/finance` (sub-page!) + `/reports`
 *     - apps/academics owns `/students` + `/grades` + `/attendance`
 *   So a coarse "block /payments" rule would false-positive on
 *   finance's perfectly-valid `/payments/record`. The blocklist below
 *   matches SPECIFIC shell-owned routes, not loose prefixes.
 *
 * Blocked patterns (regex, anchored):
 *   - "^/payments/:id/receipt(?:/...)?$" — shell receipt page
 *                                            (the actual M1.2 target;
 *                                            finance's own /payments
 *                                            and /payments/record are
 *                                            NOT matched because they
 *                                            don't have a 3rd segment)
 *   - `^/settings(?:/.*)?$`                — shell settings hub
 *                                            (no MFE owns /settings)
 *   - `^/home(?:/.*)?$`                    — shell home
 *                                            (no MFE owns /home)
 *
 * NOT blocked (deliberately):
 *   - `/dashboard` — finance + analytics own this locally
 *   - `/payments` (no 3rd-segment suffix) — finance owns it
 *   - `/login`, `/onboarding`, `/auth/callback` — MFE code shouldn't
 *     route here, but blocklisting them adds false-positive surface
 *     for marginal value; rely on code review
 *   - String concatenation: `navigate({to: '/' + prefix})` — too much
 *     false-positive risk; the M0.5 404 boundary surfaces these at
 *     runtime
 *
 * If you NEED to navigate to a shell-owned route from an MFE, use
 * the M1.1 helpers from `@edforge/finance-services`:
 *
 *   import { viewDocument, receiptHref } from '@edforge/finance-services'
 *   viewDocument(receiptHref(paymentId))
 *
 * The helpers do a full-page `window.location.href` nav that bypasses
 * the local MFE router's basepath — which is the only correct way to
 * reach a shell-owned route from inside an MFE.
 */

// Patterns are written for ESQuery's `[attr=/regex/]` syntax — standard
// JS regex semantics. The leading `^` + trailing `(?:/.*)?$` anchors
// keep the match tight: `/payments` (no 3rd segment) does NOT match
// the receipt pattern, but `/payments/abc/receipt` does.
const RECEIPT_PATTERN = '\\/payments\\/[^\\/]+\\/receipt(?:\\/.*)?'
const SETTINGS_PATTERN = '\\/settings(?:\\/.*)?'
const HOME_PATTERN = '\\/home(?:\\/.*)?'

// Combined alternation — the value (string or template-literal raw) must
// match exactly one of these patterns from start to end.
const SHELL_ROUTE_REGEX = `^(${RECEIPT_PATTERN}|${SETTINGS_PATTERN}|${HOME_PATTERN})$`

const MFE_NAV_MESSAGE = [
  'Do not navigate to shell-owned routes from inside an MFE.',
  '`navigate({to: ...})` resolves against the local MFE router\'s basepath,',
  'so a route like `/payments/${id}/receipt` becomes `/finance/payments/.../receipt`',
  'and 404s into MfeNotFoundBoundary.',
  '',
  'Use the cross-MFE helpers from @edforge/finance-services instead:',
  '  import { viewDocument, receiptHref } from "@edforge/finance-services"',
  '  viewDocument(receiptHref(paymentId))',
].join(' ')

/**
 * Two selectors cover the common shapes:
 *   - String literal:   navigate({to: '/payments/abc/receipt'})
 *   - Template literal: navigate({to: `/payments/${id}/receipt`})
 *
 * The TemplateLiteral selector matches when the literal STARTS with a
 * shell route fragment. `quasis.0.value.raw` is the first chunk before
 * any `${}`. For interpolated paths like `/payments/${id}/receipt`,
 * the raw first chunk is `/payments/`; we still want to flag this, so
 * we match the path-prefix loosely (no end-anchor) for TemplateLiteral.
 * Same-segment-discrimination as the Literal case is impossible at
 * lint time because the `${id}` value is unknown — but the very
 * specific `/payments/.../receipt` shape makes false positives
 * essentially impossible.
 */
const TEMPLATE_PREFIX_REGEX = `^\\/(payments\\/$|settings(\\/|$)|home(\\/|$))`

const restrictedSyntaxRule = [
  'error',
  {
    selector: `CallExpression[callee.name='navigate'] > ObjectExpression > Property[key.name='to'] > Literal[value=/${SHELL_ROUTE_REGEX}/]`,
    message: MFE_NAV_MESSAGE,
  },
  {
    selector: `CallExpression[callee.name='navigate'] > ObjectExpression > Property[key.name='to'] > TemplateLiteral[quasis.0.value.raw=/${TEMPLATE_PREFIX_REGEX}/]`,
    message: MFE_NAV_MESSAGE,
  },
]

/**
 * Returns the flat-config block to merge into `eslint.config.js`.
 *
 * The `files` glob targets every non-shell MFE under `apps/`. Shell's
 * own router intentionally uses `navigate({to: '/payments/...'})` so
 * the rule must NOT apply there.
 */
export default {
  files: [
    'apps/finance/src/**/*.{ts,tsx}',
    'apps/academics/src/**/*.{ts,tsx}',
    'apps/people/src/**/*.{ts,tsx}',
    'apps/analytics/src/**/*.{ts,tsx}',
    'apps/edfi/src/**/*.{ts,tsx}',
    'apps/messages/src/**/*.{ts,tsx}',
    'apps/special-programs/src/**/*.{ts,tsx}',
  ],
  rules: {
    'no-restricted-syntax': restrictedSyntaxRule,
  },
}
