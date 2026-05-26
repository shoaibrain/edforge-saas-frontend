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
 * Four selectors cover the common shapes:
 *   A. String literal:   navigate({to: '/payments/abc/receipt'})
 *   B. Template literal interpolated payment id:
 *                        navigate({to: `/payments/${id}/receipt`})
 *   C. Template literal under /settings or /home:
 *                        navigate({to: `/settings/${section}`})
 *   D. Template literal with the receipt path baked into the first
 *      quasi (no interpolation OR receipt path before any expression):
 *                        navigate({to: `/payments/abc/receipt`})
 *                        navigate({to: `/payments/abc/receipt/${x}`})
 *
 * For TemplateLiteral nodes, `quasis.0.value.raw` is the first chunk
 * before any `${}`. For `/payments/${id}/receipt` it is `/payments/`;
 * for `/payments/${id}` it is ALSO `/payments/`. A naive prefix match
 * on the first quasi would false-positive on the latter (which is
 * finance-MFE-owned, NOT a shell route).
 *
 * Selector B inspects BOTH quasis: requires the first to be exactly
 * `/payments/` AND the second to start with `/receipt`. That uniquely
 * identifies the shell receipt shape — interpolated payment-detail
 * routes like `/payments/${id}` (no second quasi) and arbitrary
 * extensions like `/payments/${id}/refund` are NOT flagged.
 *
 * Selector C keeps the simple first-quasi prefix match for /settings
 * and /home because no MFE owns those roots — anything starting with
 * those prefixes from inside an MFE is a real bug.
 *
 * Cases this DOES NOT catch (deliberately):
 *   - Templates that build the prefix dynamically:
 *     `${base}/payments/${id}/receipt`. Lint can't statically resolve
 *     ${base}; code review + the M0.5 boundary catch this.
 */
// Exact-string equality in esquery uses literal quoted values — no
// regex escaping needed for the first-quasi check below. The
// second-quasi check uses a regex; backslashes in regex syntax are
// doubled because we're embedding the regex inside a JS string.
const PAYMENTS_FIRST_QUASI_VALUE = '/payments/'
const RECEIPT_SECOND_QUASI_REGEX = '^\\/receipt(\\/|$)'
const SETTINGS_HOME_PREFIX_REGEX = '^\\/(settings|home)(\\/|$)'

const restrictedSyntaxRule = [
  'error',
  // A. String literal — full path is known, anchored regex.
  {
    selector: `CallExpression[callee.name='navigate'] > ObjectExpression > Property[key.name='to'] > Literal[value=/${SHELL_ROUTE_REGEX}/]`,
    message: MFE_NAV_MESSAGE,
  },
  // B. Template literal: `/payments/${id}/receipt[...]` — requires
  //    BOTH quasis to match. The first quasi must be EXACTLY
  //    "/payments/" (string equality); the second must START with
  //    "/receipt" (regex). So `/payments/${id}` alone — which has
  //    no second quasi — is NOT flagged.
  {
    selector: `CallExpression[callee.name='navigate'] > ObjectExpression > Property[key.name='to'] > TemplateLiteral[quasis.0.value.raw='${PAYMENTS_FIRST_QUASI_VALUE}'][quasis.1.value.raw=/${RECEIPT_SECOND_QUASI_REGEX}/]`,
    message: MFE_NAV_MESSAGE,
  },
  // C. Template literal: `/settings/...` or `/home/...` — first-quasi
  //    prefix is sufficient because no MFE owns these roots.
  {
    selector: `CallExpression[callee.name='navigate'] > ObjectExpression > Property[key.name='to'] > TemplateLiteral[quasis.0.value.raw=/${SETTINGS_HOME_PREFIX_REGEX}/]`,
    message: MFE_NAV_MESSAGE,
  },
  // D. Template literal with the full payments-receipt path baked into
  //    the first quasi: matches `\`/payments/abc/receipt\`` (no
  //    interpolation — sometimes wrapped in backticks unintentionally),
  //    as well as multi-quasi templates whose first quasi already
  //    contains the receipt path (e.g. `\`/payments/abc/receipt/${x}\``).
  //    The anchored receipt regex requires a non-empty id segment,
  //    so it does NOT overlap with Selector B (which targets
  //    `\`/payments/${id}/receipt\`` — first quasi exactly "/payments/").
  {
    selector: `CallExpression[callee.name='navigate'] > ObjectExpression > Property[key.name='to'] > TemplateLiteral[quasis.0.value.raw=/^\\/payments\\/[^\\/]+\\/receipt(\\/.*)?$/]`,
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
