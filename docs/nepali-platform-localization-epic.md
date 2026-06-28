# Nepali Platform Localization and Internationalization Epic

**Date:** 2026-06-28
**Branch:** `codex/epic-nepali-i18n-localization`
**Primary repo:** `edforge-saas-frontend/`
**Scope:** Platform MFE frontend localization and internationalization for the
Nepal pilot. Backend contracts, generated PDFs, and tenant data translation are
called out only where the frontend depends on them.

This is a planning and audit artifact. It does not implement UI changes.

---

## Executive Summary

EdForge already has a real i18n foundation: `@edforge/i18n`, English and Nepali
resource bundles, an `i18next` singleton for most MFEs, localStorage language
detection, Nepali font activation, and a shell header language toggle. The
screenshots show that this foundation works for parts of the shell and dashboard.

The implementation is incomplete in the places that matter most for the Nepal
launch:

- The finance MFE has large newer surfaces that are still hardcoded in English:
  overview, bulk invoice generation, fee structures, list/detail/payment flows,
  generated sentences, toast copy, labels, placeholders, and table chrome.
- Shell navigation and breadcrumbs fall back to English for many current finance
  route ids and path segments even when Nepali is selected.
- Currency, relative dates, BS/AD date labels, finance enum labels, and payment
  method/status labels are formatted through English-only helpers or without
  passing the active Nepali locale.
- The locale parity test checks only six of twelve configured namespaces, so a
  large part of the translation catalog can drift without CI failing.
- User preference persistence exists in the API model, but the header toggle is
  currently localStorage-only, while workspace `defaultLocale` is a regional
  tenant setting. Platform UI language and tenant regional locale need a clear
  precedence model.
- There is no hardcoded-string ratchet, route-key coverage test, or localized
  screenshot smoke to prevent regressions after the first sweep.

The right product target is not "translate every string-like value." The target
is a coherent Nepali platform experience for system UI, workflows, statuses,
alerts, filters, validation, and formatting, while preserving tenant/user-owned
content such as names, invoice numbers, custom fee names, email addresses, school
codes, and imported records exactly as entered.

---

## Evidence Reviewed

### Screenshots

1. Home dashboard in Nepali/dark mode shows mixed localization: Nepali shell
   labels alongside English finance alerts, English role labels, English
   Light/Dark controls, English fee-type names, English recent activity, `NPR`
   display, and English BS/AD date text.
2. Finance overview in English confirms the current route and visible finance
   components: filter row, alert banner, KPI cards, billing health, collection
   performance, recent payments, and recent invoices.
3. Bulk Generate Invoices shows a current finance route where nearly all wizard
   copy remains English: title, subtitle, steps, mode toggle, placeholders, quick
   segments, counts, select-all affordance, and grade labels.
4. Fee Structures in Nepali mode shows shell partial localization but finance
   configuration copy, table headers, filters, KPI cards, info banner, type and
   frequency labels, and action aria labels still in English.

### Source Review

Key files reviewed:

- `packages/i18n/src/config.ts`
- `packages/i18n/src/hooks/useLocaleEffect.ts`
- `packages/i18n/src/i18n-init.test.ts`
- `packages/i18n/src/locale-parity.test.ts`
- `packages/i18n/src/locales/en/*.json`
- `packages/i18n/src/locales/ne/*.json`
- `packages/config/src/mf-shared.ts`
- `apps/shell/src/main.tsx`
- `apps/shell/src/router.tsx`
- `apps/shell/src/components/layout/Header.tsx`
- `apps/shell/src/components/layout/Sidebar.tsx`
- `apps/shell/src/components/layout/Breadcrumbs.tsx`
- `apps/shell/src/config/sidebar-modules.ts`
- `apps/shell/src/pages/settings/preferences.tsx`
- `apps/shell/src/pages/settings/workspace.tsx`
- `apps/shell/src/services/users.service.ts`
- `apps/finance/src/router.tsx`
- `apps/finance/src/routes/overview.tsx`
- `apps/finance/src/routes/billing/invoices/bulk-generate.tsx`
- `apps/finance/src/routes/configuration/fee-structures.tsx`
- `apps/finance/src/components/overview-v2/*.tsx`
- `apps/finance/src/components/billing/bulk/*.tsx`
- `apps/finance/src/components/configuration/FeeStructureForm.tsx`
- `apps/finance/src/components/configuration/FeeStructureList.tsx`
- `packages/types/src/finance-utils.ts`
- `packages/types/src/use-currency.ts`
- `packages/types/src/format-datetime.ts`
- `packages/shared-types/src/utils/currency.ts` in the backend/shared package
- `packages/ui/src/components/BsDatePicker.tsx`
- `packages/ui/src/components/DateDisplay.tsx`
- `packages/date-utils/src/hooks/useDateFormatter.ts`
- `packages/date-utils/src/components/BSDateInput.tsx`

### Current Coverage Snapshot

Approximate static scan of `.tsx` files, excluding tests and build artifacts:

| Area                  | Files | Files importing i18n | Approx hardcoded string hits |
| --------------------- | ----: | -------------------: | ---------------------------: |
| `apps/shell/src`      |   253 |                   65 |                         1012 |
| `apps/academics/src`  |   140 |                    6 |                          803 |
| `apps/people/src`     |    48 |                    7 |                          309 |
| `apps/finance/src`    |    43 |                    5 |                          258 |
| `packages/ui/src`     |    71 |                    3 |                           84 |
| `packages/forms/src`  |    16 |                    0 |                           26 |
| `apps/analytics/src`  |    11 |                    0 |                           25 |
| `packages/wizard/src` |     6 |                    0 |                           11 |

This count is intentionally approximate. It is useful as a risk map, not as a
literal backlog. The first enforcement task should turn this into a real
allowlisted audit with clear false-positive handling.

### Translation Catalog Snapshot

The configured namespaces currently have equal English and Nepali key counts:

| Namespace     | English keys | Nepali keys | Same-value strings |
| ------------- | -----------: | ----------: | -----------------: |
| `academics`   |          144 |         144 |                  2 |
| `auth`        |           60 |          60 |                  0 |
| `branding`    |           51 |          51 |                  1 |
| `common`      |           75 |          75 |                  0 |
| `dashboard`   |          141 |         141 |                  0 |
| `errors`      |           26 |          26 |                  0 |
| `identifiers` |           18 |          18 |                  0 |
| `nav`         |          121 |         121 |                  0 |
| `payments`    |          200 |         200 |                  7 |
| `people`      |          133 |         133 |                  1 |
| `portal`      |           82 |          82 |                  0 |
| `settings`    |          101 |         101 |                  0 |

The parity is better than expected, but the existing parity test hardcodes only
six namespaces instead of deriving from `NAMESPACES`. It does not currently
protect `academics`, `people`, `payments`, `portal`, `branding`, or
`identifiers`.

---

## Current I18n Architecture

### What Works

- `packages/i18n/src/config.ts` defines `SUPPORTED_LANGUAGES = ['en', 'ne']`,
  `NAMESPACES`, English and Nepali resources, fallback language `en`, and
  localStorage detection through the `edforge-language` key.
- `apps/shell/src/main.tsx` initializes i18n before rendering the shell.
- `apps/shell/src/router.tsx` calls `useLocaleEffect()` from the root layout.
- `useLocaleEffect()` sets `document.documentElement.lang` and injects Noto Sans
  Devanagari for Nepali mode.
- `packages/theme/src/base.css` applies the Devanagari font stack when
  `html[lang="ne"]`.
- `packages/config/src/mf-shared.ts` shares `@edforge/i18n`, `i18next`, and
  `react-i18next` as singleton/eager dependencies for shell, academics, people,
  and finance.
- The header profile menu can call `i18n.changeLanguage(code)` and immediately
  updates many shell labels.
- Existing catalog namespaces already include useful finance terms in
  `payments.json`: statuses, gateways, fee-structure labels, filters, actions,
  and empty states.

### Important Exception

The analytics MFE uses a hand-rolled shared map in
`apps/analytics/rsbuild.config.ts` and does not share `@edforge/i18n`,
`i18next`, or `react-i18next` through the central helper. Analytics appears
parked in shell routing, but it should be explicitly audited before it is treated
as a localized MFE.

---

## Product Localization Policy

### Localize

These are platform-owned and should resolve through i18n:

- Navigation, breadcrumbs, app/module titles, tab labels, and sidebars.
- Page titles, subtitles, banners, alerts, empty states, loading states, and
  error states.
- Buttons, menu items, filter chips, segmented controls, tooltips, placeholders,
  aria labels, table headers, sort labels, and dialogs.
- Toasts, inline validation, confirmation text, and retry/error messages.
- Generated system sentences, especially counts and money summaries.
- Finance enum labels: invoice status, payment gateway, fee type, fee frequency,
  payment method, aging bucket, and collection/billing categories.
- Relative dates and times: today, yesterday, days ago, generated-at labels, due
  labels, and displayed calendar names.
- Numeric formatting where product policy says Nepali UI should use Nepali
  digits or Nepali currency symbol.
- Role display labels when shown to users, such as `TenantAdmin`.
- Accessibility text, including icon-only button labels and hidden screen-reader
  labels.

### Do Not Localize By Default

These are user, tenant, or external identifiers and should remain exactly as
stored unless a separate content-translation feature exists:

- Student, guardian, staff, school, tenant, and user names.
- Email addresses, phone numbers, PAN, EMIS, invoice numbers, receipt numbers,
  payment references, tenant codes, and school codes.
- Custom fee structure names and descriptions entered by operators.
- Academic year names and custom billing-period names entered by operators.
- Gateway brand names: eSewa, Khalti, FonePay, ConnectIPS.
- Acronyms or regulatory identifiers where the approved Nepal product glossary
  keeps the English acronym, such as PAN, EMIS, IEP, PDF, CSV, and BS/AD if the
  glossary chooses those short labels.
- Imported third-party data and freeform notes.

### Policy Decisions To Make Once, Then Enforce

1. **Platform language precedence**
   - Proposed: explicit user preference -> localStorage -> tenant default locale
     -> browser language -> `en`.
   - The header toggle should update UI immediately and persist to both
     localStorage and the user preference API when authenticated.

2. **Platform language vs tenant regional locale**
   - Platform language is the UI language (`en` or `ne`).
   - Tenant regional locale is school/workspace configuration for currency,
     calendar, timezone, week start, number format, and defaults.
   - Workspace `defaultLocale` should not be treated as the same thing as the
     logged-in user's UI language.

3. **Currency and digits**
   - `@aibrains/shared-types` can emit Nepali currency style when locale is
     normalized to `ne`.
   - The frontend currently drops this signal in `useCurrency`.
   - Product must choose whether Nepali UI displays `NPR 72,290`, `रू ७२,२९०`,
     or a hybrid. The implementation should support the chosen policy without
     forking finance formatting code.

4. **Grade labels**
   - School grade-level codes are operator-owned source of truth.
   - The UI prefix "Grade" is platform-owned and should localize, but grade
     values such as `3`, `ECD`, `LKG`, or school-specific codes remain as data.

5. **Generated sentences**
   - Avoid string concatenation. Use i18next interpolation and pluralization for
     messages like "3 invoices overdue", "14 invoices in Current bucket", and
     "2 recipients selected."

---

## Gap Inventory

### 1. Regression Guard Gaps

- `packages/i18n/src/locale-parity.test.ts` hardcodes a subset of namespaces
  instead of deriving from `NAMESPACES`.
- There is no test that all sidebar module ids and group ids have `nav` keys.
- There is no test that route breadcrumb segments used by current shell/MFE
  routes resolve without English fallback.
- There is no hardcoded-string audit or touched-file ratchet.
- There is no plural/interpolation variable parity test between English and
  Nepali strings.
- There is no Playwright smoke that captures critical routes in both languages.

### 2. Shell Gaps

- `Header.tsx` has hardcoded `Light`, `Dark`, `EN`, `NP` visible labels and
  hardcoded language aria labels.
- `HomeTopbarCenter` uses English day/month names and appends English `BS`.
- The language toggle is localStorage-only and is not wired to persisted user
  preferences.
- `preferences.tsx` does not expose the existing `language` preference.
- `workspace.tsx` calls regional `defaultLocale` "Default Language", which can
  confuse platform language with tenant regional settings.
- `Sidebar.tsx` falls back to English labels from `sidebar-modules.ts`.
- `Breadcrumbs.tsx` falls back to an English `ROUTE_LABELS` map and title-case
  segments.
- Current finance ids and segments are missing or mismatched in `nav.json`:
  `finance-home`, `invoices`, `student-accounts`, `payments`, `billing`,
  `configuration`, `finance`, `bulk-generate`, and hyphenated `fee-structures`.

### 3. Finance Overview Gaps

Route trace:

`/finance` -> `apps/shell/src/router.tsx` lazy remote -> `apps/finance/src/router.tsx` -> `apps/finance/src/routes/overview.tsx` -> `overview-v2/*`.

Hardcoded areas include:

- Page header date and action labels.
- Filter row quick options, custom range labels, all-years selector, clear, and
  export copy.
- Overdue alert title, message, and CTA.
- KPI labels and tag text.
- Billing health chart labels, aging messages, bucket labels, payment method
  labels, and empty states.
- Collection performance labels, fee type labels, type counts, and total labels.
- Recent payments and recent invoices card titles, empty states, status labels,
  relative dates, and "due" suffixes.

### 4. Bulk Invoice Wizard Gaps

Route trace:

`/finance/invoices/bulk-generate` -> `apps/finance/src/router.tsx` -> `apps/finance/src/routes/billing/invoices/bulk-generate.tsx` -> `components/billing/bulk/BulkGenerateWizard.tsx` -> `Step1Recipients` through `Step4Review` and `GenerateSuccess`.

Hardcoded areas include:

- Wizard title, subtitle, step labels, loading, footer controls, toasts, and
  async limit error.
- Step 1 mode toggle, search placeholder, quick segments, count labels,
  select-all/clear controls, grade labels, empty states, and selected-recipient
  rail.
- Step 2 fee selection, line-item copy, discount labels, custom-line labels,
  skip-zero behavior labels, empty states, and remove aria labels.
- Step 3 invoice details, academic year empty state, term defaults, optional
  labels, note placeholders, due/issue-date helper text, and validation copy.
- Step 4 review, preview/loading copy, error states, grouped summaries, and
  server preview labels.
- Success state actions and follow-up copy.

### 5. Fee Configuration Gaps

Route trace:

`/finance/configuration/fee-structures` -> `apps/finance/src/router.tsx` -> `apps/finance/src/routes/configuration/fee-structures.tsx` -> `FeeStructureForm` and `FeeStructureList`.

Hardcoded areas include:

- Header, subtitle, info banner, create/edit/delete toasts, error states, and
  no-school state.
- KPI card labels, filter chips, and delete dialog.
- Form sections, labels, helper text, placeholders, validation errors, date
  labels, toggles, and enrollment-rule copy.
- Table headers, sort labels, type/frequency display, "All Grades", edit/delete
  aria labels, and empty states.
- Row data such as `fee.name` and `fee.description` should not be translated by
  default because it is operator-entered content.

### 6. Formatting and Shared Helper Gaps

- `packages/types/src/use-currency.ts` passes only currency to
  `formatCurrency`, so Nepali locale and native symbol/digit behavior never
  activates.
- `packages/shared-types/src/utils/currency.ts` supports Nepali output when
  locale is exactly `ne`; the frontend needs a normalization helper such as
  `ne-NP -> ne`.
- `packages/types/src/finance-utils.ts` has English-only functions:
  `formatFeeType`, `formatGatewayLabel`, `formatInvoiceStatus`, and
  `formatRelativeDate`.
- `packages/types/src/format-datetime.ts` hardcodes `en-US` for several
  relative and formatted date paths.
- `packages/ui/src/components/BsDatePicker.tsx`,
  `packages/ui/src/components/DateDisplay.tsx`, and
  `packages/date-utils/src/components/BSDateInput.tsx` have hardcoded labels or
  aria labels.
- `packages/ui` imports `react-i18next` in a few components but package
  dependency ownership should be clarified.

### 7. Non-Finance MFE Gaps

- Academics and People have many hardcoded strings and low i18n import coverage.
- Portal namespaces exist, but parent/student-facing routes need a separate
  route-by-route sweep because Nepal pilot families and students may see these
  screens early.
- Analytics appears parked and has a different module-federation sharing setup.
  It should be excluded explicitly or brought into the shared i18n pattern before
  localization claims include it.

---

## Engineering Operating Rules

1. Every frontend PR starts with a URL -> router -> page -> tab/step -> component
   trace in the PR body or commit body.
2. One route or primitive family per PR. No "localize the whole app" sweeps.
3. Reuse existing namespaces first. For finance, wire current code to
   `payments.json` before adding new keys. Do not create duplicate terminology.
4. Translation keys and tests land in the same PR as the component that consumes
   them.
5. Generated sentences use interpolation and pluralization. Do not concatenate
   English-shaped fragments.
6. User/tenant content remains data. Do not translate stored names, descriptions,
   ids, invoice numbers, or imported text.
7. New visible text requires an English key, a Nepali key, and a test or explicit
   screenshot validation.
8. Native Nepali copy review is required before release hardening, especially for
   financial and parent/student-facing workflows.
9. Shell, finance, people, academics, and shared packages must keep typecheck and
   lint green for touched areas.
10. This is frontend planning. Backend/API, pdf-renderer, and public marketing
    localization are separate coordinated work unless a frontend task explicitly
    depends on them.

---

## Sprint Map

| Sprint | Goal                                      | Demoable outcome                                                                             |
| ------ | ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| 0      | Audit, policy, and regression harness     | CI can detect namespace drift, route-key gaps, and hardcoded-string debt without UI changes. |
| 1      | Shell language contract and global chrome | Nepali mode persists and shell navigation/breadcrumb/profile chrome are coherent.            |
| 2      | Locale-aware formatting primitives        | Currency, dates, relative time, finance enums, and shared UI labels can be localized safely. |
| 3      | Finance overview vertical slice           | `/finance` in Nepali is coherent for platform-owned copy and formatting.                     |
| 4      | Bulk invoice wizard vertical slice        | `/finance/invoices/bulk-generate` in Nepali is coherent across all steps.                    |
| 5      | Fee configuration vertical slice          | `/finance/configuration/fee-structures` in Nepali is coherent.                               |
| 6      | Remaining finance operator flows          | Invoice, payment, account, receipt, and drawer flows are localized.                          |
| 7      | Shared UI/forms/date primitives           | Common controls stop leaking English into localized MFEs.                                    |
| 8      | Academics and People route sweeps         | High-priority school operations screens are localized route by route.                        |
| 9      | Portal and public boundary                | Parent/student portal is localized; public/marketing scope is explicitly decided.            |
| 10     | Release hardening                         | Ratchets, Playwright screenshot smoke, accessibility, and native copy QA are release-ready.  |

---

## Sprint 0 - Audit, Policy, and Regression Harness

**Goal:** Make localization measurable before broad UI edits land.

**Demo:** `pnpm vitest run packages/i18n` catches missing namespace keys and
route-key gaps; the hardcoded-string audit produces a baseline report; the
localization policy is checked into docs.

### L10N-0.1 - Write Localization Boundary and Glossary Seed

**Files:** `docs/localization/boundary-and-glossary.md` (new)

**Work:** Document what is platform copy vs tenant/user data. Seed a glossary for
finance, navigation, attendance, academics, portal, dates, currency, roles, and
accessibility labels. Include rules for grade labels, fee names, gateway brand
names, PAN/EMIS/BS/AD acronyms, and generated sentences.

**Validation:** Product/design review. Native Nepali reviewer can comment on the
glossary. No runtime test needed.

**Commit:** `docs(i18n): define localization boundary and glossary seed`

### L10N-0.2 - Derive Locale Parity Tests From Configured Namespaces

**Files:** `packages/i18n/src/locale-parity.test.ts`,
`packages/i18n/src/config.ts`

**Work:** Replace the hardcoded six-namespace test list with the exported
`NAMESPACES` or a resource-derived list. Assert key parity and non-empty Nepali
strings for every configured namespace.

**Validation:** `pnpm vitest run packages/i18n/src/locale-parity.test.ts`

**Commit:** `test(i18n): check parity for every namespace`

### L10N-0.3 - Add Interpolation and Plural Variable Parity Test

**Files:** `packages/i18n/src/interpolation-parity.test.ts` (new)

**Work:** Parse `{{variable}}` placeholders in English and Nepali strings and
fail when a translation drops or adds variables. Include plural key suffixes if
the repo uses i18next plural forms.

**Validation:** `pnpm vitest run packages/i18n/src/interpolation-parity.test.ts`

**Commit:** `test(i18n): enforce interpolation variable parity`

### L10N-0.4 - Add Nav Sidebar and Breadcrumb Key Coverage

**Files:** `apps/shell/src/config/sidebar-modules.ts`,
`apps/shell/src/components/layout/Breadcrumbs.tsx`,
`packages/i18n/src/locales/en/nav.json`,
`packages/i18n/src/locales/ne/nav.json`,
`apps/shell/src/components/layout/__tests__/nav-i18n-coverage.test.tsx` (new)

**Work:** Add a test that every `sidebar-modules.ts` group id and item id has
English and Nepali `nav` keys. Add a test fixture for known route segments used
by finance, academics, people, settings, and portal breadcrumbs.

**Validation:** Shell test run. Test fails when an id falls back to English.

**Commit:** `test(shell): cover localized nav and breadcrumb keys`

### L10N-0.5 - Add Hardcoded String Audit Baseline

**Files:** `scripts/i18n/audit-hardcoded-strings.ts` (new),
`scripts/i18n/hardcoded-string-allowlist.json` (new), root package scripts

**Work:** Add a non-blocking audit for JSX text and common string-bearing props:
`title`, `aria-label`, `placeholder`, `label`, `description`, toast calls, and
dialog copy. Support allowlist entries for tenant data, tests, examples, and
brand names. Emit counts by app/package.

**Validation:** `pnpm i18n:audit` produces deterministic output and exits 0 in
baseline mode.

**Commit:** `chore(i18n): add hardcoded string audit baseline`

### L10N-0.6 - Add Localized Render Test Helper

**Files:** app test utilities under `apps/shell/src/test/` or
`packages/i18n/src/test-utils/`

**Work:** Provide `renderWithLocale(ui, { language: 'ne' })` or equivalent.
Ensure tests can switch language without leaking state between cases.

**Validation:** Add one sample shell component test using English and Nepali.

**Commit:** `test(i18n): add localized render helper`

### L10N-0.7 - Add Language Preference Precedence Design Note

**Files:** `docs/localization/language-precedence.md` (new)

**Work:** Define precedence: user preference, localStorage, tenant default locale,
browser, fallback. Define how `en`, `ne`, `en-US`, and `ne-NP` normalize. Define
where workspace regional locale differs from UI language.

**Validation:** Reviewed design note. Follow-up tasks reference the final policy.

**Commit:** `docs(i18n): define platform language precedence`

### L10N-0.8 - Audit Module Federation I18n Sharing

**Files:** `packages/config/src/mf-shared.ts`,
`apps/*/rsbuild.config.ts`, docs note

**Work:** Confirm every active MFE shares `@edforge/i18n`, `i18next`, and
`react-i18next`. Explicitly document analytics as excluded/parked or migrate it
to the shared helper if it is active.

**Validation:** Unit/config assertion where feasible; otherwise documented audit
with file references.

**Commit:** `docs(i18n): audit mfe i18n singleton sharing`

### L10N-0.9 - Add Critical Route Screenshot Smoke Skeleton

**Files:** `e2e/localization.spec.ts` or existing Playwright area

**Work:** Add a smoke that can visit `/finance`,
`/finance/invoices/bulk-generate`, and
`/finance/configuration/fee-structures` in English and Nepali. In Sprint 0 it may
capture screenshots without strict visual assertions.

**Validation:** Playwright can run locally against `pnpm dev:shell`; screenshots
are generated and reviewed.

**Commit:** `test(e2e): add localization screenshot smoke skeleton`

---

## Sprint 1 - Shell Language Contract and Global Chrome

**Goal:** The global shell stops leaking English in Nepali mode and language
choice survives reload/login.

**Demo:** In `pnpm dev:shell`, switch to Nepali, reload, and navigate to finance
overview, bulk invoice, and fee structures. Header controls, sidebar groups,
sidebar items, breadcrumbs, and profile menu remain localized.

### L10N-1.1 - Implement Platform Language Normalization

**Files:** `packages/i18n/src/language.ts` (new),
`packages/i18n/src/config.ts`, tests

**Work:** Add helpers to normalize browser/API/tenant locale values into
`PlatformLanguage` (`en` or `ne`) and `LocaleCode` (`en-US`, `ne-NP`, etc.).
Treat `ne-NP` as platform language `ne`.

**Validation:** Unit tests for `en`, `en-US`, `ne`, `ne-NP`, unsupported values,
and null/undefined.

**Commit:** `feat(i18n): add platform language normalization`

### L10N-1.2 - Hydrate I18n From User Preference

**Files:** `apps/shell/src/services/users.service.ts`,
`apps/shell/src/hooks/` or auth/session initialization area, tests

**Work:** Read normalized `preferences.language` after user profile load and
apply it to i18n if no more explicit local override exists. Preserve
localStorage fallback for anonymous or early boot states.

**Validation:** Unit/RTL test for precedence. No network call on anonymous boot.

**Commit:** `feat(shell): hydrate i18n from user language preference`

### L10N-1.3 - Persist Header Language Toggle

**Files:** `apps/shell/src/components/layout/Header.tsx`, user preference hook or
service tests

**Work:** Keep immediate `i18n.changeLanguage(code)` behavior, persist the
normalized value to localStorage, and call the user preferences update API when
authenticated.

**Validation:** Mocked component test asserts localStorage write, i18n change,
and API mutation. Failed API mutation should not roll back the visible toggle.

**Commit:** `feat(shell): persist language toggle preference`

### L10N-1.4 - Add Language Control To Preferences Page

**Files:** `apps/shell/src/pages/settings/preferences.tsx`,
`packages/i18n/src/locales/en/settings.json`,
`packages/i18n/src/locales/ne/settings.json`

**Work:** Add a platform UI language field to preferences. Keep workspace
regional locale separate and label it clearly.

**Validation:** Form test verifies language saves with theme/default
school/notifications and updates i18n after save.

**Commit:** `feat(settings): expose platform language preference`

### L10N-1.5 - Localize Header Menu Controls

**Files:** `apps/shell/src/components/layout/Header.tsx`,
`packages/i18n/src/locales/en/nav.json`,
`packages/i18n/src/locales/ne/nav.json`

**Work:** Replace hardcoded Light/Dark, language aria label, appearance toggle
labels, sidebar button aria labels, and user menu action labels with i18n keys.
Keep `EN` and `NP` visible codes if product approves, but localize accessible
labels.

**Validation:** Header render test in English and Nepali.

**Commit:** `fix(shell): localize header preference controls`

### L10N-1.6 - Localize Finance Sidebar Keys

**Files:** `packages/i18n/src/locales/en/nav.json`,
`packages/i18n/src/locales/ne/nav.json`,
`apps/shell/src/components/layout/__tests__/nav-i18n-coverage.test.tsx`

**Work:** Add or align keys for finance module, `finance-home`, `billing`,
`configuration`, `invoices`, `student-accounts`, `payments`, and
`fee-structures`. Remove reliance on English default labels for those ids.

**Validation:** Sidebar coverage test and manual finance navigation smoke.

**Commit:** `fix(nav): localize finance sidebar ids`

### L10N-1.7 - Localize Finance Breadcrumb Segments

**Files:** `packages/i18n/src/locales/en/nav.json`,
`packages/i18n/src/locales/ne/nav.json`,
`apps/shell/src/components/layout/Breadcrumbs.tsx`, tests

**Work:** Add hyphenated segment keys used by the current router:
`finance`, `invoices`, `bulk-generate`, `configuration`, `fee-structures`,
`payments`, `student-accounts`, `record`, and `receipt`. Prefer i18n keys over
the English fallback map.

**Validation:** Breadcrumb tests for `/finance`,
`/finance/invoices/bulk-generate`, and
`/finance/configuration/fee-structures`.

**Commit:** `fix(nav): localize finance breadcrumb segments`

### L10N-1.8 - Localize Shell Error, Loading, and Empty Chrome

**Files:** shell route boundary components and `common`/`errors` namespaces

**Work:** Sweep only shell-level error boundaries, remote loading fallbacks,
not-found/access-denied copy, and retry buttons.

**Validation:** Component tests for English and Nepali boundary states.

**Commit:** `fix(shell): localize global fallback states`

---

## Sprint 2 - Locale-Aware Formatting Primitives

**Goal:** Shared formatting and display helpers stop forcing English output.

**Demo:** A small dev/test harness can render finance statuses, fee types,
gateways, currency, dates, and relative times in English and Nepali without route
specific code.

### L10N-2.1 - Normalize Locale For Currency Formatting

**Files:** `packages/types/src/use-currency.ts`,
`packages/i18n/src/language.ts`, tests

**Work:** Pass the normalized locale into `formatCurrency`. Support the product
decision for Nepali digits/symbols. Avoid duplicating currency logic outside
`@aibrains/shared-types`.

**Validation:** Unit tests for `en-US`, `ne-NP`, `ne`, NPR grouping, decimals,
and compact/short variants.

**Commit:** `fix(types): format currency with active locale`

### L10N-2.2 - Add Finance Display Key Helpers

**Files:** `packages/types/src/finance-utils.ts`, `packages/i18n` payments
namespace, tests

**Work:** Add key-producing helpers such as `getInvoiceStatusLabelKey`,
`getFeeTypeLabelKey`, `getGatewayLabelKey`, and `getFeeFrequencyLabelKey`.
Keep current English formatting helpers as deprecated fallback if other
consumers still need them.

**Validation:** Unit tests map every known enum to an existing `payments` key in
English and Nepali.

**Commit:** `feat(types): expose finance i18n label keys`

### L10N-2.3 - Localize Finance Relative Date Helpers

**Files:** `packages/types/src/format-datetime.ts`,
`packages/types/src/finance-utils.ts`, `packages/i18n/src/locales/*/common.json`,
tests

**Work:** Replace hardcoded `Today`, `Yesterday`, `days ago`, and `en-US`
formatting where finance callers need platform-localized relative display.

**Validation:** Unit tests for today, yesterday, multiple days ago, and explicit
timezone settings in both languages.

**Commit:** `fix(types): localize relative date formatting`

### L10N-2.4 - Localize Header BS/AD Date Display

**Files:** `apps/shell/src/components/layout/Header.tsx`,
`packages/date-utils` if shared helpers are needed, tests

**Work:** Use active language and tenant regional settings for topbar date text.
Remove forced English weekday/month output in Nepali mode.

**Validation:** Header test asserts Nepali mode does not render English weekday
names. Manual check for BS/AD display in Nepal tenant.

**Commit:** `fix(shell): localize topbar date display`

### L10N-2.5 - Add Shared Number and Count Formatting Helper

**Files:** `packages/i18n/src/number.ts` or approved shared package, tests

**Work:** Provide a helper for counts, percentages, and pluralized labels using
the active platform language and tenant regional settings.

**Validation:** Unit tests for count labels and percentages in English and
Nepali policy output.

**Commit:** `feat(i18n): add localized number formatting helpers`

### L10N-2.6 - Clarify UI Package I18n Dependency Ownership

**Files:** `packages/ui/package.json`, `packages/ui/src/components/*.tsx`,
tests

**Work:** Either add the correct peer/dependency contract for `react-i18next` or
make shared UI components receive localized labels from app callers. Prefer label
props for generic primitives; use i18n directly only for EdForge-specific
components.

**Validation:** `pnpm turbo typecheck --filter=@edforge/ui`; package tests.

**Commit:** `chore(ui): clarify i18n dependency boundary`

### L10N-2.7 - Localize Shared Date Components

**Files:** `packages/ui/src/components/BsDatePicker.tsx`,
`packages/ui/src/components/DateDisplay.tsx`,
`packages/date-utils/src/components/BSDateInput.tsx`,
related locale files and tests

**Work:** Replace hardcoded previous/next labels, Gregorian labels, validation
messages, and fixed English AD display where the component owns system copy.

**Validation:** Component tests with language set to English and Nepali.

**Commit:** `fix(date-utils): localize shared date controls`

---

## Sprint 3 - Finance Overview Vertical Slice

**Goal:** The finance overview page is coherent in Nepali mode.

**Demo:** `/finance` renders localized shell chrome, filter row, alert, KPI
cards, health cards, recent activity cards, enum labels, money, and relative
dates. Tenant data remains unchanged.

### L10N-3.1 - Wire Overview To Existing Payments Namespace

**Files:** `packages/i18n/src/locales/en/payments.json`,
`packages/i18n/src/locales/ne/payments.json`,
`apps/finance/src/routes/overview.tsx`

**Work:** Inventory existing `payments` keys and add only missing overview keys
under a consistent `overview` subtree. Do not create a duplicate `finance`
namespace in this sprint.

**Validation:** Full i18n parity and interpolation tests.

**Commit:** `feat(payments): add finance overview localization keys`

### L10N-3.2 - Localize Finance Overview Page Header

**Files:** `apps/finance/src/routes/overview.tsx`

**Work:** Localize no-school state, screen-reader heading, date line, summary
line, action button labels, action aria labels, and error/empty states.

**Validation:** Render test in English and Nepali with mocked summary data.

**Commit:** `fix(finance): localize overview page header`

### L10N-3.3 - Localize Overview Filter Row

**Files:** `apps/finance/src/components/overview-v2/FilterRow.tsx`

**Work:** Localize quick options, "or", date input aria labels, all-years select,
clear, export, and disabled/empty labels.

**Validation:** Component test checks Nepali labels and accessible names.

**Commit:** `fix(finance): localize overview filters`

### L10N-3.4 - Localize Overdue Alert Banner

**Files:** `apps/finance/src/components/overview-v2/OverdueAlertBanner.tsx`,
payments locale files

**Work:** Replace generated English sentences with plural/interpolation keys for
invoice count, overdue amount, collection rate, bucket name, and draft count.

**Validation:** Unit/render tests for 0, 1, and many invoice cases in both
languages.

**Commit:** `fix(finance): localize overdue alert banner`

### L10N-3.5 - Localize Overview KPI Cards

**Files:** `apps/finance/src/routes/overview.tsx`, shared `StatCard` call sites

**Work:** Localize Total Invoiced, Collected, Outstanding, Overdue, invoice count
tags, payment count tags, awaiting tag, this-month hint, and no-data variants.

**Validation:** Render test with representative dashboard summary.

**Commit:** `fix(finance): localize overview kpi cards`

### L10N-3.6 - Localize Billing Health Card

**Files:** `apps/finance/src/components/overview-v2/BillingHealthCard.tsx`,
finance display helpers

**Work:** Localize card title, donut center label, status labels, aging insight,
bucket labels, payment method labels, empty states, and generated strings.

**Validation:** Render tests for all-account-current, overdue, and no-invoice
states.

**Commit:** `fix(finance): localize billing health card`

### L10N-3.7 - Localize Collection Performance Card

**Files:** `apps/finance/src/components/overview-v2/CollectionPerformanceCard.tsx`

**Work:** Localize section labels, collected percent, fee type labels through
finance label keys, show-all/show-less, type counts, and total labels.

**Validation:** Render test for multiple fee types and collapsed/expanded state.

**Commit:** `fix(finance): localize collection performance`

### L10N-3.8 - Localize Recent Payments and Invoices Cards

**Files:** `apps/finance/src/components/overview-v2/RecentPaymentsCard.tsx`,
`apps/finance/src/components/overview-v2/RecentInvoicesCard.tsx`

**Work:** Localize card titles, empty states, gateway/status labels, unknown
fallback, relative date labels, and due suffix.

**Validation:** Render tests with payment and invoice fixtures.

**Commit:** `fix(finance): localize recent activity cards`

### L10N-3.9 - Add Overview Localized Screenshot Smoke

**Files:** `e2e/localization.spec.ts`

**Work:** Add focused screenshot smoke for `/finance` in English and Nepali.
Whitelist tenant-entered values that intentionally remain English.

**Validation:** Playwright screenshot review.

**Commit:** `test(e2e): cover localized finance overview`

---

## Sprint 4 - Bulk Invoice Wizard Vertical Slice

**Goal:** Bulk invoice generation is usable in Nepali mode across all steps.

**Demo:** `/finance/invoices/bulk-generate` shows localized wizard chrome,
recipient selection, fee selection, details, review, and success states. Student
names, student ids, grade codes, and invoice identifiers remain data.

### L10N-4.1 - Add Bulk Wizard Translation Keys

**Files:** `packages/i18n/src/locales/en/payments.json`,
`packages/i18n/src/locales/ne/payments.json`

**Work:** Add a `bulkGenerate` subtree for step labels, actions, footer text,
loading, errors, segment labels, count strings, preview, and success states.
Reuse existing finance terminology keys where possible.

**Validation:** Parity and interpolation tests.

**Commit:** `feat(payments): add bulk invoice wizard localization keys`

### L10N-4.2 - Localize Wizard Shell and Stepper

**Files:** `apps/finance/src/components/billing/bulk/BulkGenerateWizard.tsx`,
`apps/finance/src/components/billing/bulk/types.ts`

**Work:** Localize step labels, title/subtitle if owned here, loading state,
footer buttons, footer info, toasts, async limit messages, and generation state.

**Validation:** Render test for stepper and footer in English/Nepali.

**Commit:** `fix(finance): localize bulk invoice wizard shell`

### L10N-4.3 - Localize Step 1 Recipients

**Files:** `apps/finance/src/components/billing/bulk/Step1Recipients.tsx`

**Work:** Localize mode toggle, search placeholder, quick segments, tooltips,
recipient counts, select-all/clear controls, empty states, grade prefix, selected
rail, and helper text.

**Validation:** Component test for by-grade and by-student modes in Nepali.

**Commit:** `fix(finance): localize bulk invoice recipients step`

### L10N-4.4 - Localize Step 2 Fee Structures

**Files:** `apps/finance/src/components/billing/bulk/Step2FeeStructures.tsx`

**Work:** Localize fee selection labels, custom line labels, discount labels,
skip-zero controls, placeholders, empty states, and remove aria labels. Preserve
operator-entered fee names and descriptions.

**Validation:** Component test with fixed fee fixtures.

**Commit:** `fix(finance): localize bulk invoice fee step`

### L10N-4.5 - Localize Step 3 Invoice Details

**Files:** `apps/finance/src/components/billing/bulk/Step3InvoiceDetails.tsx`

**Work:** Localize academic year empty state, term defaults, optional labels,
payment note placeholder, issue/due date helper text, review/skip settings, and
validation copy.

**Validation:** Component test for valid and invalid state.

**Commit:** `fix(finance): localize bulk invoice details step`

### L10N-4.6 - Localize Step 4 Review

**Files:** `apps/finance/src/components/billing/bulk/Step4Review.tsx`

**Work:** Localize review headings, summary labels, no-fees state, server preview
loading/error, generated amount labels, and warning messages.

**Validation:** Component test for preview loading, error, and ready states.

**Commit:** `fix(finance): localize bulk invoice review step`

### L10N-4.7 - Localize Generate Success

**Files:** `apps/finance/src/components/billing/bulk/GenerateSuccess.tsx`

**Work:** Localize success title, summary, download action labels, close/new batch
actions, and deferred PDF messaging.

**Validation:** Component test for success state.

**Commit:** `fix(finance): localize bulk invoice success state`

### L10N-4.8 - Add Bulk Wizard Localized Screenshot Smoke

**Files:** `e2e/localization.spec.ts`

**Work:** Add screenshot smoke for step 1 and review/success reachable states.

**Validation:** Playwright screenshots in English and Nepali.

**Commit:** `test(e2e): cover localized bulk invoice wizard`

---

## Sprint 5 - Fee Configuration Vertical Slice

**Goal:** Fee structures and adjacent configuration screens are coherent in
Nepali mode.

**Demo:** `/finance/configuration/fee-structures` shows localized header, stats,
filters, banner, table, form, dialog, and toasts. Fee names/descriptions remain
operator data.

### L10N-5.1 - Add Fee Configuration Key Coverage

**Files:** `packages/i18n/src/locales/en/payments.json`,
`packages/i18n/src/locales/ne/payments.json`

**Work:** Add missing keys for fee structures route, form, list, delete dialog,
states, errors, and toasts. Reuse existing `feeStructure` terminology where it
already exists.

**Validation:** I18n parity and interpolation tests.

**Commit:** `feat(payments): add fee configuration localization keys`

### L10N-5.2 - Localize Fee Structures Route

**Files:** `apps/finance/src/routes/configuration/fee-structures.tsx`

**Work:** Localize header, subtitle, info banner, stat cards, filter chips,
add/edit/delete toasts, no-school state, loading/error states, and delete dialog.

**Validation:** Route render test in English/Nepali.

**Commit:** `fix(finance): localize fee structures route`

### L10N-5.3 - Localize Fee Structure Form

**Files:** `apps/finance/src/components/configuration/FeeStructureForm.tsx`

**Work:** Localize section headings, field labels, placeholders, helper text,
validation, toggles, dates, pricing labels, and submit/cancel actions. Do not
translate operator-entered field values.

**Validation:** Component test for create and edit modes in Nepali.

**Commit:** `fix(finance): localize fee structure form`

### L10N-5.4 - Localize Fee Structure List

**Files:** `apps/finance/src/components/configuration/FeeStructureList.tsx`

**Work:** Localize table headers, sort labels, empty state, all-grades label,
type/frequency labels, status filters, edit/delete aria labels, and per-row
helper labels. Preserve fee names/descriptions.

**Validation:** Component test with representative fee fixture.

**Commit:** `fix(finance): localize fee structure list`

### L10N-5.5 - Localize Payment Gateway Configuration If Active

**Files:** `apps/finance/src/routes/configuration/payment-gateways.tsx`,
gateway config components

**Work:** Route-trace the payment gateway configuration surface. Localize only if
it is active in the current finance navigation; otherwise document as deferred.

**Validation:** Component test or explicit deferred note.

**Commit:** `fix(finance): localize gateway configuration copy`

### L10N-5.6 - Add Fee Configuration Localized Screenshot Smoke

**Files:** `e2e/localization.spec.ts`

**Work:** Add screenshot smoke for fee structures list and create/edit form in
English and Nepali.

**Validation:** Playwright screenshot review.

**Commit:** `test(e2e): cover localized fee configuration`

---

## Sprint 6 - Remaining Finance Operator Flows

**Goal:** Finance is no longer a mixed-language MFE after the three screenshot
paths are fixed.

**Demo:** In Nepali mode, an operator can navigate invoices, payments, student
accounts, receipts, and drawers without platform English leaks except approved
data/brand names.

### L10N-6.1 - Localize Invoices List

**Files:** `apps/finance/src/routes/billing/invoices/index.tsx`, invoice list
components and tests

**Work:** Localize filters, table columns, row action labels, status chips,
bulk/issue/cancel actions, empty states, loading/errors, and toasts.

**Validation:** Render test and route smoke.

**Commit:** `fix(finance): localize invoices list`

### L10N-6.2 - Localize Invoice Detail

**Files:** `apps/finance/src/routes/billing/invoices/$invoiceId.tsx`, detail
components

**Work:** Localize summary sections, line items, history, payment status,
download/share/cancel actions, dialog copy, and error states. Keep invoice id and
student/school data unchanged.

**Validation:** Detail render test with fixture invoice.

**Commit:** `fix(finance): localize invoice detail`

### L10N-6.3 - Localize Payments List

**Files:** `apps/finance/src/routes/billing/payments/index.tsx`, payments
components

**Work:** Localize filters, table headers, gateway/status labels, refund labels,
bulk action labels, empty states, and toasts.

**Validation:** Render test and route smoke.

**Commit:** `fix(finance): localize payments list`

### L10N-6.4 - Localize Record Payment Flow

**Files:** record payment route/component files after route trace

**Work:** Localize picker labels, form labels, validation, helper text, payment
method labels, success/error toasts, and confirmation copy.

**Validation:** Form interaction test for successful and invalid submission.

**Commit:** `fix(finance): localize record payment flow`

### L10N-6.5 - Localize Student Accounts List and Detail

**Files:** student accounts route/component files after route trace

**Work:** Localize account filters, ledger tabs, invoices/payments tabs, summary
cards, status labels, empty states, and actions.

**Validation:** List and detail render tests with fixtures.

**Commit:** `fix(finance): localize student account flows`

### L10N-6.6 - Localize Receipt Screen

**Files:** `apps/finance/src/components/billing/PaymentReceipt.tsx`,
`apps/finance/src/routes/billing/payments/receipt.tsx`

**Work:** Localize receipt labels, print/download actions, method/status labels,
and fallback states. Do not translate receipt numbers, payment references, names,
or freeform notes.

**Validation:** Receipt render test and print preview smoke if available.

**Commit:** `fix(finance): localize payment receipt screen`

### L10N-6.7 - Localize Shared Finance Drawers and Async Job Chrome

**Files:** finance drawer/job/progress components after route trace

**Work:** Localize drawer headers, progress states, retry/cancel buttons,
download labels, generated summaries, and error messages.

**Validation:** Component tests for pending/success/error states.

**Commit:** `fix(finance): localize finance async workflow chrome`

---

## Sprint 7 - Shared UI, Forms, Wizard, and Date Primitives

**Goal:** Common packages no longer leak English into localized app routes.

**Demo:** A localized finance or people route using shared tables, date controls,
forms, and wizard controls has no English chrome from shared primitives.

### L10N-7.1 - Add Localized Data Table Label Contract

**Files:** `packages/ui/src/components/data-table/*`, tests

**Work:** Add a labels prop or context for pagination, empty state, search,
clear, column visibility, density, selected rows, export, sort, and load-more
labels. Keep English defaults for standalone safety.

**Validation:** DataTable tests for default English and supplied Nepali labels.

**Commit:** `feat(ui): add localized data table labels`

### L10N-7.2 - Pass Localized Data Table Labels From App Routes

**Files:** shell/finance/people/academics table call sites touched by active
routes

**Work:** Wire app-level i18n labels into DataTable consumers one route family at
a time.

**Validation:** Route component tests show localized table chrome.

**Commit:** `fix(apps): pass localized data table labels`

### L10N-7.3 - Localize Select, Combobox, Empty, and Loading Primitives

**Files:** shared UI controls after inventory

**Work:** Add label props or namespace-backed labels for no-results, loading,
clear, search, selected count, and retry copy.

**Validation:** Component tests for each primitive.

**Commit:** `fix(ui): localize shared selection primitives`

### L10N-7.4 - Localize Forms Package Copy

**Files:** `packages/forms/src/**`

**Work:** Route-trace current consumers and convert platform-owned labels,
validation messages, helper text, address labels, phone labels, and contact
section labels to caller-provided or i18n-backed labels.

**Validation:** Package tests and one consuming route render test.

**Commit:** `fix(forms): localize shared form copy`

### L10N-7.5 - Localize Wizard Package Copy

**Files:** `packages/wizard/src/**`

**Work:** Add localized labels for generic wizard controls, step states,
validation summary, next/back/cancel controls, and progress indicators.

**Validation:** Package tests in English and Nepali.

**Commit:** `fix(wizard): localize shared wizard controls`

### L10N-7.6 - Ratchet Hardcoded String Audit For Shared Packages

**Files:** `scripts/i18n/*`, CI config

**Work:** Turn the audit from report-only to ratchet mode for touched files in
`packages/ui`, `packages/forms`, `packages/wizard`, `packages/date-utils`, and
`packages/types`.

**Validation:** CI fails on a new unallowlisted hardcoded user-facing string in
those packages.

**Commit:** `chore(i18n): ratchet shared package hardcoded strings`

---

## Sprint 8 - Academics and People Route Sweeps

**Goal:** High-priority school operations screens outside finance are localized
without a big-bang rewrite.

**Demo:** Pilot admin/teacher can use core academics and people flows in Nepali
mode with localized system chrome and preserved data values.

### L10N-8.1 - Academics Route Inventory and Priority Matrix

**Files:** `docs/localization/academics-people-route-inventory.md` (new)

**Work:** Route-trace academics and people screens. Rank by pilot usage:
attendance, students, classes/sections, exams, staff/users, and settings.

**Validation:** Reviewed inventory with exact route/component paths.

**Commit:** `docs(i18n): inventory academics and people localization routes`

### L10N-8.2 - Localize Attendance Screens

**Files:** attendance route/component files after route trace

**Work:** Localize date controls, section labels, statuses, submission actions,
empty states, warning banners, validation, and summary cards.

**Validation:** Render/interaction tests for daily attendance and class view.

**Commit:** `fix(academics): localize attendance workflows`

### L10N-8.3 - Localize Student Profile and Enrollment Screens

**Files:** student profile/registration route files after route trace

**Work:** Localize tabs, section headings, field labels, helper text, empty
states, actions, validation, and identifier labels. Preserve names, codes, and
freeform values.

**Validation:** Render tests for profile and create/edit flows.

**Commit:** `fix(academics): localize student profile flows`

### L10N-8.4 - Localize Classes, Sections, and Academic Setup

**Files:** route files after URL-to-component trace

**Work:** Localize setup tabs, table headers, filters, dialogs, toasts, and
validation for academic setup screens. Avoid the known wrong-file trap by
documenting the route trace in the PR.

**Validation:** Route render tests and visual smoke.

**Commit:** `fix(academics): localize academic setup flows`

### L10N-8.5 - Localize Exams and Result Surfaces

**Files:** exams/result route files after route trace

**Work:** Localize statuses, workflow actions, table headers, filter labels,
empty/error states, result card labels, and publish/close confirmations.

**Validation:** Component tests for draft/scheduled/published states.

**Commit:** `fix(academics): localize exams and results`

### L10N-8.6 - Localize People Staff Directory

**Files:** people directory route/components after route trace

**Work:** Localize table chrome, role/status labels, filters, actions, drawer
labels, create/edit forms, invitation/credential copy, and toasts.

**Validation:** Render and interaction tests for directory and drawer.

**Commit:** `fix(people): localize staff directory`

### L10N-8.7 - Localize People Role and Access Workflows

**Files:** role/access/assignment components after route trace

**Work:** Localize permissions, roles, access warnings, assignment actions,
confirmation dialogs, and error states.

**Validation:** Component tests with representative role fixtures.

**Commit:** `fix(people): localize role management flows`

---

## Sprint 9 - Portal and Public Boundary

**Goal:** Parent/student-facing experiences are localized where they are in pilot
scope, and public/marketing surfaces have an explicit localization decision.

**Demo:** Parent and student portal routes can be shown in Nepali with localized
platform chrome and preserved student/school data.

### L10N-9.1 - Portal Route Inventory and Pilot Scope

**Files:** `docs/localization/portal-route-inventory.md` (new)

**Work:** Route-trace parent/student portal pages and decide which are in the
Nepal pilot localization scope. Document any public/landing routes that remain
English intentionally.

**Validation:** Reviewed inventory and scope decision.

**Commit:** `docs(i18n): define portal localization scope`

### L10N-9.2 - Localize Parent Portal Home

**Files:** parent portal home route/components

**Work:** Localize cards, timelines, fees summary, grades/attendance labels,
actions, loading/empty states, and relative dates.

**Validation:** Render test with parent fixture.

**Commit:** `fix(portal): localize parent portal home`

### L10N-9.3 - Localize Parent Finance and Attendance Views

**Files:** parent portal finance/attendance route files

**Work:** Localize invoice/payment summaries, status labels, attendance labels,
filters, empty states, and action copy.

**Validation:** Render tests for paid/overdue/no-data states.

**Commit:** `fix(portal): localize parent finance and attendance`

### L10N-9.4 - Localize Student Portal Home

**Files:** student portal home route/components

**Work:** Localize schedule, grade, attendance, announcement, and task labels.
Preserve names, course titles, and teacher-entered text.

**Validation:** Render test with student fixture.

**Commit:** `fix(portal): localize student portal home`

### L10N-9.5 - Decide Public Landing Localization Boundary

**Files:** public/landing docs and route files if active

**Work:** Decide whether public marketing pages are in this epic. If not, add a
documented exclusion so product demos do not imply full public-site localization.

**Validation:** Reviewed scope note or localized landing smoke if included.

**Commit:** `docs(i18n): decide public localization boundary`

---

## Sprint 10 - Release Hardening

**Goal:** Localization is shippable and hard to regress.

**Demo:** `pnpm dev:shell` plus localized Playwright smoke can show the Nepal
pilot flow in English and Nepali; CI fails on missing keys, variable drift, and
new hardcoded-string leaks in ratcheted folders.

### L10N-10.1 - Turn Hardcoded String Audit Into Touched-File Ratchet

**Files:** `scripts/i18n/*`, CI config

**Work:** Fail CI only for new unallowlisted strings in touched files or already
ratcheted folders. Keep legacy debt visible without blocking unrelated PRs.

**Validation:** CI proof with a fixture that adds a new hardcoded button label.

**Commit:** `chore(i18n): enforce touched-file hardcoded string ratchet`

### L10N-10.2 - Add Critical Route Missing-Key Smoke

**Files:** `e2e/localization.spec.ts` or route render smoke tests

**Work:** Mount/visit critical routes under `ne` and fail if visible text
contains raw i18n keys, obvious fallback markers, or known English platform
labels not in the allowlist.

**Validation:** Smoke fails with a deliberately missing key.

**Commit:** `test(i18n): detect missing keys on critical routes`

### L10N-10.3 - Add En/Ne Visual Regression Baselines

**Files:** Playwright baseline area

**Work:** Add reviewed baselines for `/finance`,
`/finance/invoices/bulk-generate`, `/finance/configuration/fee-structures`,
one attendance route, one people route, and one portal route in English and
Nepali.

**Validation:** Visual diff is stable on local and CI runner.

**Commit:** `test(e2e): baseline localized pilot routes`

### L10N-10.4 - Native Nepali Copy QA Pass

**Files:** `packages/i18n/src/locales/ne/*.json`,
`docs/localization/boundary-and-glossary.md`

**Work:** Native reviewer checks tone, domain terms, financial copy, parent
portal copy, and consistency with the glossary. Update keys without code churn.

**Validation:** Review sign-off documented in PR.

**Commit:** `copy(i18n): apply native Nepali localization review`

### L10N-10.5 - Accessibility And Layout QA For Nepali Text

**Files:** route/component CSS only where issues are found

**Work:** Verify Devanagari text does not overflow buttons, filters, table cells,
sidebars, cards, dialogs, and mobile breakpoints. Verify aria labels are localized
and icon-only controls remain named.

**Validation:** Axe/RTL/Playwright checks plus screenshot review for desktop and
mobile widths.

**Commit:** `fix(a11y): harden Nepali localized layouts`

### L10N-10.6 - Release Checklist

**Files:** `docs/localization/release-checklist.md` (new)

**Work:** Document gates, smoke routes, expected non-localized data, rollback
behavior, language preference fallback, and known deferred surfaces.

**Validation:** Checklist dry run before release candidate.

**Commit:** `docs(i18n): add localization release checklist`

---

## Recommended Validation Commands

Use the repo's current package-manager commands and the known working Node if the
default Homebrew Node is broken:

```bash
PATH=/Users/shoaibrain/.nvm/versions/node/v22.22.2/bin:$PATH pnpm vitest run packages/i18n
PATH=/Users/shoaibrain/.nvm/versions/node/v22.22.2/bin:$PATH pnpm turbo typecheck --filter=@edforge/shell --filter=@edforge/finance --filter=@edforge/ui
PATH=/Users/shoaibrain/.nvm/versions/node/v22.22.2/bin:$PATH pnpm turbo lint --filter=@edforge/shell --filter=@edforge/finance --filter=@edforge/ui
PATH=/Users/shoaibrain/.nvm/versions/node/v22.22.2/bin:$PATH pnpm i18n:audit
PATH=/Users/shoaibrain/.nvm/versions/node/v22.22.2/bin:$PATH pnpm dev:shell
```

For finance-specific implementation PRs, also run the relevant finance services
tests when hooks/services are touched:

```bash
PATH=/Users/shoaibrain/.nvm/versions/node/v22.22.2/bin:$PATH pnpm vitest run packages/finance-services
PATH=/Users/shoaibrain/.nvm/versions/node/v22.22.2/bin:$PATH pnpm turbo typecheck --filter=@edforge/finance
PATH=/Users/shoaibrain/.nvm/versions/node/v22.22.2/bin:$PATH pnpm turbo lint --filter=@edforge/finance --filter=@edforge/finance-services
```

---

## Subagent Review Incorporated

The subagent was asked for a read-only staff-level critique of this plan basis:
what was missed, sequencing recommendations, task split/combine suggestions, and
testing additions. The review led to these explicit changes in this plan:

- Treat analytics MFE sharing as an audit item instead of claiming universal
  i18n singleton sharing.
- Make all-namespace locale parity a Sprint 0 task because the current parity
  test hardcodes only six namespaces.
- Reuse `payments.json` finance terminology before adding new keys.
- Add sidebar/breadcrumb coverage tests rather than relying on manual nav edits.
- Split language preference work into precedence, boot hydration, header
  persistence, settings UI, and backend mutation tests.
- Add currency locale normalization, including `ne-NP -> ne`.
- Make localization-boundary policy explicit for user/tenant data.
- Strengthen generated sentence/pluralization tasks for finance banners, wizard
  footer text, and aging insights.
- Add tests for plural/interpolation variable parity, localized render helpers,
  and Playwright screenshot smoke in English and Nepali.

---

## Deferred Or Coordinated Work

- Generated PDFs and downloaded receipt PDFs may require backend/pdf-renderer
  localization. This plan covers frontend receipt screens only unless a PDF task
  explicitly enters scope.
- AdminWeb is separate from the tenant-facing MFE platform and should not import
  workspace-only frontend packages.
- Public marketing localization should be explicitly scoped before work starts.
- Tenant/user content translation is a separate product feature, not part of
  platform i18n.
- Additional languages beyond English and Nepali are out of scope for this epic,
  but the architecture should avoid Nepal-only hardcoding where a general locale
  helper is just as cheap.
