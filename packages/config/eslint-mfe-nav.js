/**
 * @edforge/config — MFE navigation lint rule.
 *
 * Forbids hard-coded shell-owned route patterns inside `navigate({to: ...})`
 * calls made from non-shell MFE source files.
 *
 * Implements ticket M0.7 of the PDF service MFE integration plan
 * (`docs/pilot-greenlight/pdf-service-mfe-integration-plan.md` §2).
 *
 * **History of the receipt rule:**
 * The very first version of this rule (M0.7) blocked
 * `/payments/<id>/receipt` from MFE navigates, because the receipt
 * page was shell-owned at the time. M1.5-FU.2 moved the receipt
 * page INTO Finance MFE — Finance now owns `/payments/$paymentId/receipt`
 * resolved through `basepath: '/finance'`. So an MFE-side
 * `navigate({to: '/payments/${id}/receipt'})` from inside Finance is
 * now CORRECT (Invoice list + Payments list eye-icons do exactly this).
 * The receipt-specific selectors were removed in M1.5-FU.6; the rule
 * keeps catching `/settings/...` and `/home/...` from MFE code
 * because those roots remain shell-owned and have no in-MFE equivalent.
 *
 * Why scoped to MFEs only, not Shell:
 *   Shell IS the host. `navigate({to: '/settings/...'})` is correct
 *   inside `apps/shell`. Only NON-shell MFEs need the guard.
 *
 * Why route-PATTERNS, not prefixes:
 *   Several MFEs own routes that LOOK shell-shaped because the local
 *   router's basepath strips the MFE prefix. Examples (inventoried
 *   2026-05-26 against actual apps/<name>/src/router.tsx files):
 *     - apps/finance owns `/payments` + `/payments/record` (→ /finance/...)
 *     - apps/finance owns `/payments/$paymentId/receipt` (post-M1.5-FU.2)
 *     - apps/finance owns `/dashboard`
 *     - apps/analytics owns `/dashboard` + `/finance` (sub-page!) + `/reports`
 *     - apps/academics owns `/students` + `/grades` + `/attendance`
 *   So a coarse "block /payments" rule would false-positive on
 *   finance's perfectly-valid routes. The blocklist below targets
 *   only the still-shell-owned roots.
 *
 * Blocked patterns (regex, anchored):
 *   - `^/settings(?:/.*)?$` — shell settings hub (no MFE owns /settings)
 *   - `^/home(?:/.*)?$`     — shell home (no MFE owns /home)
 *
 * NOT blocked (deliberately):
 *   - `/payments/<id>/receipt` — Finance owns this now (M1.5-FU.2)
 *   - `/dashboard` — finance + analytics own this locally
 *   - `/payments` (any depth) — finance-owned
 *   - `/login`, `/onboarding`, `/auth/callback` — MFE code shouldn't
 *     route here, but blocklisting them adds false-positive surface
 *     for marginal value; rely on code review
 *   - String concatenation: `navigate({to: '/' + prefix})` — too much
 *     false-positive risk; the M0.5 404 boundary surfaces these at
 *     runtime
 *
 * If you genuinely need to navigate to a shell-owned `/settings/` or
 * `/home/` route from an MFE (rare — usually a sign of architectural
 * confusion), use `window.location.href = '/settings/...'` and document
 * the reason in a comment so the next reader knows it was intentional.
 */

const SETTINGS_PATTERN = '\\/settings(?:\\/.*)?'
const HOME_PATTERN = '\\/home(?:\\/.*)?'

// Combined alternation — the value (string or template-literal raw) must
// match exactly one of these patterns from start to end.
const SHELL_ROUTE_REGEX = `^(${SETTINGS_PATTERN}|${HOME_PATTERN})$`

const MFE_NAV_MESSAGE = [
  'Do not navigate to shell-owned routes from inside an MFE.',
  '`navigate({to: ...})` resolves against the local MFE router\'s basepath,',
  'so a route like `/settings/branding` becomes `/finance/settings/branding`',
  'and 404s into MfeNotFoundBoundary.',
  '',
  'If you genuinely need a shell-owned route from MFE code (rare —',
  'usually a sign of architectural confusion), use',
  '`window.location.href = "/settings/..."` and document the reason.',
].join(' ')

/**
 * Two selectors cover the common shapes for the still-blocked
 * `/settings/...` and `/home/...` roots:
 *   A. String literal:    navigate({to: '/settings/branding'})
 *   B. Template literal:  navigate({to: `/settings/${section}`})
 *
 * For TemplateLiteral nodes, `quasis.0.value.raw` is the first chunk
 * before any `${}`. The receipt-specific selectors that used to live
 * here (matching `/payments/.../receipt`) were removed in M1.5-FU.6
 * when receipt moved into Finance MFE.
 */
const restrictedSyntaxRule = [
  'error',
  // A. String literal — full path is known, anchored regex.
  {
    selector: `CallExpression[callee.name='navigate'] > ObjectExpression > Property[key.name='to'] > Literal[value=/${SHELL_ROUTE_REGEX}/]`,
    message: MFE_NAV_MESSAGE,
  },
  // B. Template literal: `/settings/...` or `/home/...` — first-quasi
  //    prefix is sufficient because no MFE owns these roots.
  {
    selector: `CallExpression[callee.name='navigate'] > ObjectExpression > Property[key.name='to'] > TemplateLiteral[quasis.0.value.raw=/${SHELL_ROUTE_REGEX.replace('$', '')}/]`,
    message: MFE_NAV_MESSAGE,
  },
]

/**
 * Returns the flat-config block to merge into `eslint.config.js`.
 *
 * The `files` glob targets every non-shell MFE under `apps/`. Shell's
 * own router intentionally uses `navigate({to: '/settings/...'})` so
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
