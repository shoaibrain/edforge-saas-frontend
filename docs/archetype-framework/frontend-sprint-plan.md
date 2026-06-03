# Governance-Body Archetype Framework — Frontend Sprint Plan

> **Repo:** `shoaibrain/edforge-saas-frontend` (Module-Federation MFE SPA).
> **Reads with:** the North Star + backend plan in `shoaibrain/edforge` at
> `docs/archetype-framework/` (`00-north-star.md`, `backend-sprint-plan.md`).
> **Absorbs:** PR [#95](https://github.com/shoaibrain/edforge-saas-frontend/pull/95)
> *"archetype-compliant identifier display"* — its `packages/identifier-resolver`
> is re-sequenced here as the first consumer of the archetype profile registry.
> This plan does **not** rewrite PR #95's ~55 tickets; it cites their IDs.
>
> Six sprints, ~30 atomic tickets (plus PR #95's tickets it sequences). Every
> ticket is one commit + one PR with a `Validation:` line. Every sprint ends in a
> runnable demo (`pnpm dev:shell` / `pnpm dev:mvp`, a dev route, or a Vercel
> preview). Frontend tickets begin with the **URL→router→page→tab→component
> trace** in the commit body (CLAUDE.md "route → component" trap).

---

## Sprint sequence & demos

```
GF0  ARCHETYPE_PROFILE registry + conformance harness   → registry test green; region-aware-forms-divergence.md written
GF1  Identifier-resolver foundation (PR#95 S0–S2)        → /dev/identifiers-demo renders across archetypes
GF2  Thin-slice + cross-MFE sweep (PR#95 S3–S5)          → PABSON Student Profile shows emisStudentId; 14 UUID sites gone
GF3  Feature/availability matrix + archetype-gated UI    → PABSON currency dropdown shows NPR only
GF4  PDF payload contract + hardening (PR#95 S6–S7)      → downloaded PDF and screen agree; a11y/perf/e2e green
GF5  Add CBS UI profile (extensibility proof)            → CBS profile passes conformance, ZERO call-site edits
```

GF0 is the foundation. GF1–GF2 are PR #95 re-pointed at the GF0 registry. GF3 is
the FE half of Midnight Lockin P2.2. GF4 closes the PDF gap (backend handshake).
GF5 mirrors backend GB4 — the extensibility proof, in one coordinated shared-types
publish with GB4.

---

## Existing infrastructure this plan REUSES (do not rebuild)

Confirmed shipped by the code review — every new ticket composes these:

| Primitive | Import | Role |
|---|---|---|
| `useTenantContext()` → `{archetype, country}` | `@edforge/forms` | read governance body at component level |
| `school-context-channel` broadcast | `@edforge/config` | cross-MFE archetype propagation |
| **MF singleton config** | `packages/config/src/mf-shared.ts` | load-bearing; missing singleton caused the 2026-04-28 archetype=null bug |
| `resolveAddressVariant(archetype, country)` | `@edforge/forms` | **the canonical overlay precedent GF0 generalizes** |
| `phoneFormatForArchetype` / `PhoneInput` | `@edforge/forms` | second overlay precedent |
| BS↔AD utils / `BSDateInput` | `@edforge/date-utils` | calendar formatting (MF singleton) |
| i18n `en` + `ne` (11 namespaces) | `@edforge/i18n` | every label must resolve in both |
| `TenantBadge`, `IemisCodeBadge` | `@edforge/shell-components`, `apps/shell/.../IemisCodeBadge.tsx` | badge style tokens to reuse |

**Design rule (from the review):** forms primitives are **props-driven, not
hook-coupled** (`<AddressFields archetype={…} country={…} />`). The GF0 registry
and its hooks must preserve this — the registry is read by a hook at the app
edge, then *passed down as props* into packages, keeping `packages/` decoupled
from app state.

---

## Sprint GF0 — ARCHETYPE_PROFILE registry + conformance harness

**Goal.** Generalize the scattered `resolve<X>(archetype, country)` helpers into
one `ARCHETYPE_PROFILE` registry (delta-overlay on `GENERIC`, the same model PR #95
uses for identifiers) with a conformance + i18n-coverage test that fails CI if a
governance body is incompletely wired or missing a `ne` translation. No UI change.

**Demo.** `pnpm test --filter @edforge/archetype` runs the registry conformance
suite green for `PABSON` + `GENERIC`; the missing
`docs/decisions/region-aware-forms-divergence.md` is written and merged.

| # | Title | Validation |
|---|---|---|
| GF0.1 | Write `docs/decisions/region-aware-forms-divergence.md` (referenced by `AddressFields.tsx` but absent): policy for GENERIC-tenant-in-Nepal forms, xlsx round-trip mapping, and what happens to existing records (archetype is immutable, so no switch path). | Decision doc reviewed + merged; `AddressFields.tsx` comment link now resolves. |
| GF0.2 | Scaffold `packages/archetype` (`@edforge/archetype`): `package.json`, `tsconfig`, `vitest.config`, `src/index.ts`; add to `pnpm-workspace.yaml` + `turbo.json`. | `pnpm install && pnpm build --filter @edforge/archetype` succeeds. |
| GF0.3 | Register `@edforge/archetype` as an MF **singleton** in `packages/config/src/mf-shared.ts` (it holds the profile registry; must be one instance across MFEs — same rationale as the documented 2026-04-28 bug). | `mf-shared.test.ts` asserts the entry is present + singleton-flagged; build all MFEs; runtime check the registry is the same reference across MFEs. |
| GF0.4 | Define `ArchetypeUiProfile` type: `addressVariant`, `phoneFormat`, `calendarSystem`, `identifiers: Record<EntityKind, IdentifierSpec>`, `features: ArchetypeFeatureMatrix`, `allowedValues`. Types only. | `tsc` clean; exported; compiles against a hand-written PABSON literal. |
| GF0.5 | Author the `GENERIC` base profile + `PABSON` delta-overlay. **Source existing logic, don't fork it:** `addressVariant` calls `resolveAddressVariant`; `phoneFormat` calls `phoneFormatForArchetype`. | Unit test: `getArchetypeProfile('PABSON').addressVariant === 'nepal'`, `.calendarSystem === 'bikram_sambat'`; GENERIC → `legacy`/`gregorian`; parity test vs the existing `resolveAddressVariant`. |
| GF0.6 | Author `CBSE_IN`/`NAIS_US`/`GEMS_UAE` stubs identical to `GENERIC` (placeholders for the reserved enum). | Unit test: each resolves without throwing; equals GENERIC output. |
| GF0.7 | `getArchetypeProfile(archetype, country)` merge + country-tiebreak (`country='NPL'` + unknown archetype → PABSON, mirroring `resolveAddressVariant`). | Unit test: PABSON direct, NPL+GENERIC tiebreak, unknown→GENERIC, null→GENERIC, archetype-wins-over-country-conflict. |
| GF0.8 | Conformance harness `archetype-profile.conformance.test.ts`: every active archetype has every profile slot populated; every `identifiers[].labelKey` + every `features` label resolves in **both `en` and `ne`**. **Land before any registry author edits** so future edits fail CI immediately. | Suite green; a deliberately-uncovered label or empty slot fails red. |
| GF0.9 | `useArchetypeProfile()` hook: wraps `useTenantContext()` + `getArchetypeProfile`, returns the profile; renders nothing until context hydrated (skeleton-state contract, prevents the default→archetype first-paint flicker PR #95 S2-T11 calls out). | RTL test: under `archetype=null` context → "pending" state, not GENERIC; under PABSON → PABSON profile. |
| GF0.10 | `packages/archetype/README.md` + "Adding a governance body (frontend)" guide; public exports in `src/index.ts`. | README reviewed; `pnpm typecheck` clean. |

**Demo gate (Sprint GF0):** registry conformance suite green; divergence decision
doc merged; `useArchetypeProfile` resolves PABSON vs GENERIC in a unit harness.

---

## Sprint GF1 — Identifier-resolver foundation (sequences PR #95 S0–S2)

**Goal.** Build PR #95's `packages/identifier-resolver` **as a consumer of the
GF0 registry** — `identifiers` live in `ArchetypeUiProfile`, so the resolver reads
the profile instead of holding its own archetype table. Otherwise this is PR #95
Sprints 0–2 verbatim; do not re-derive its design.

**Demo.** `pnpm dev:shell` → `/dev/identifiers-demo` renders `<EntityIdDisplay>`
for student/payment/invoice across all archetypes with the archetype toggle;
`<UserDisplay>` resolves a UUID to a name via MSW.

| # | Title | Validation |
|---|---|---|
| GF1.1 | Execute PR #95 **S0-T1/T2/T3** (audit doc, API contract for `emisStudentId`+`paidBy`, RFC) — but fold the registry into GF0: the RFC notes `identifiers` is a slot of `ArchetypeUiProfile`, not a separate archetype table. | Per PR #95 S0 validations: `docs/identifier-rendering-audit.md` lists all 14 sites; contract doc; RFC merged. |
| GF1.2 | Execute PR #95 **S1** (scaffold `identifier-resolver`, shared-types contract test, `EntityKind`/`EntityDataMap`, pure `resolveIdentifier`/`serializeIdentifier`, i18n keys + coverage test) — **reading `IdentifierSpec` from `getArchetypeProfile(archetype).identifiers[entity]`** rather than a local registry. | Per PR #95 S1 validations (table-driven suite ≥30 cases incl. empty/null/whitespace/throwing-registry); plus a test asserting the resolver pulls specs from the GF0 profile. |
| GF1.3 | Execute PR #95 **S2** (hook `useArchetypeIdentifier`, `<UuidBadge>`/`<EntityIdDisplay>`/`<UserDisplay>`, `configureIdentifierResolver({fetchUser})`, Shell bootstrap wire-up, `usePaidByUser`/`useBatchedUsers`, first-paint skeleton, dev demo route). `useArchetypeIdentifier` builds on `useArchetypeProfile` from GF0.9. | Per PR #95 S2 validations; demo route renders across archetypes; bootstrap singleton configured before MFE mount. |

> **Note on PR #95 mechanics:** the MF-singleton ticket (PR #95 S1-T1.5), the
> i18n-coverage-before-registry sequencing (S1-T10), and the masking contract
> (S3-T0) are *already covered* by GF0.3 / GF0.8 / GF2.1 respectively — when
> executing, dedupe against GF0 rather than doing them twice.

**Demo gate (Sprint GF1):** the dev demo route, per PR #95 Sprint 2 verification.

---

## Sprint GF2 — Thin-slice + cross-MFE sweep (sequences PR #95 S3–S5)

**Goal.** Ship the identifier system on real surfaces and eliminate all 14 raw-UUID
sites. This is PR #95 Sprints 3–5; the only addition is that every migrated site
reads display rules from the GF0 profile, so a future archetype changes them with
zero edits here.

**Demo.** Log into the PABSON pilot tenant (Shree Saraswati): Student Profile shows
`EMIS Student ID: 1708400128200043` primary, `Student Number: SSSEB-2026-00044`
secondary; Payment Receipt shows resolved `Paid By` name + truncated copyable
transaction badge; finance/academics/people lists show zero `id.slice(0,8)`
fragments. GENERIC tenant unchanged.

| # | Title | Validation |
|---|---|---|
| GF2.1 | Execute PR #95 **S3** (PABSON Student Profile thin slice incl. S3-T0 masking contract, `ProfileTab.tsx` migration, fixtures, a11y). | Per PR #95 S3 validations; screenshots in PR; PABSON→EMIS, GENERIC→studentNumber, missing-EMIS→fallback. |
| GF2.2 | Execute PR #95 **S4a** (Payment Receipt on-screen: receipt #, transaction `<UuidBadge>`, `<UserDisplay>` paid-by). | Per PR #95 S4a validations; before/after screenshots; "PDF still raw — gated on GF4" caveat. |
| GF2.3 | Execute PR #95 **S4b** (finance lists + CSV `serializeIdentifier` so export matches screen). | Per PR #95 S4b validations; CSV column shows EMIS for PABSON. |
| GF2.4 | Execute PR #95 **S5** (academics/people/shell sweep incl. enrollment table, account settings, staff badges; S5-T3 attendance deferred pending product). | Per PR #95 S5 validations; audit doc shows 0 open rows. |
| GF2.5 | Execute PR #95 **S5-T7** ESLint AST rule `no-id-slice-in-jsx`, add to CI. | Rule fires red on offending fixture, green on main; positive+negative unit fixtures. |

**Demo gate (Sprint GF2):** PR #95 Sprint 3 + 4a + 4b + 5 verification flows.

---

## Sprint GF3 — Feature/availability matrix + archetype-gated UI

**Goal.** Close the "no archetype feature matrix" gap and ship the **frontend half
of Midnight Lockin P2.2**: dropdowns (currency/timezone/calendar) and conditionally-
required fields driven by the GF0 profile's `features` + `allowedValues`, not
hardcoded option lists.

**Demo.** On the PABSON pilot tenant, the workspace-settings currency dropdown
offers **NPR only**; timezone offers Asia/Kathmandu; the `emisSchoolCode` field is
shown **required**. A GENERIC tenant shows the full option set. An `OTHER`/freedom
path remains for unconstrained operators (per P2.2's anti-rigidity note).

| # | Title | Validation |
|---|---|---|
| GF3.1 | Define `ArchetypeFeatureMatrix` semantics in `@edforge/archetype`: per-field `required` / `optional` / `hidden` and per-control `allowedValues`. Populate PABSON (NPR/Asia-Kathmandu/bikram_sambat; `emisSchoolCode` required) + GENERIC (open). | Unit test: matrix lookups for PABSON vs GENERIC; conformance suite (GF0.8) now also asserts matrix completeness. |
| GF3.2 | **URL-trace** then migrate the workspace-settings dropdowns (`apps/shell/src/pages/settings/workspace.tsx`) to source options from `getArchetypeProfile(archetype).allowedValues`. Keep `OTHER` escape hatch. | Route-trace in commit body; component test: PABSON→NPR-only, GENERIC→full list; visual smoke screenshot. |
| GF3.3 | **URL-trace** then drive conditionally-required form fields (e.g., `emisSchoolCode` in the school-create wizard) from the feature matrix `required` flag. | Route-trace; component test: PABSON marks field required + blocks submit when empty; GENERIC optional. |
| GF3.4 | Surface a small read-only "Governance profile" panel in settings (reuse `TenantBadge` tokens) showing the resolved archetype + its locked-in defaults (calendar/currency/week-start) for operator transparency. | Component test renders PABSON values; a11y label present; visual smoke. |
| GF3.5 | i18n: add `ne` + `en` strings for all new matrix labels; GF0.8 coverage test gates it. | Coverage test green; missing `ne` string fails red. |

**Demo gate (Sprint GF3):** archetype-gated dropdowns + required-field behavior on
the PABSON tenant via `pnpm dev:shell`; GENERIC unchanged.

---

## Sprint GF4 — PDF payload contract + hardening (sequences PR #95 S6–S7)

**Goal.** Close the one surface the frontend can't fully own (the backend-rendered
PDF receipt) and ship the hardening gates. This is PR #95 Sprints 6–7, with the
backend handshake coordinated against the `edforge` repo.

**Demo.** Downloaded PDF receipt for a PABSON tenant shows `Student ID:
1708400128200043` (EMIS) + `Paid By: <resolved name>` — matching the on-screen
receipt from GF2.2. Dashboards show 0% raw-UUID render events; a11y + Playwright
e2e green.

| # | Title | Validation |
|---|---|---|
| GF4.1 | Execute PR #95 **S6-T1/T2/T3** (define `IdentifierDisplayPayload` contract with backend; `useDownloadReceiptPdf` accepts `displayIdentifiers`; `PaymentReceipt.tsx` pre-computes them via `resolveIdentifier` + `usePaidByUser`). File the backend ticket in `edforge` for the PDF generator. | Per PR #95 S6 validations; contract doc; mutation snapshot test; manual PDF download shows correct values. |
| GF4.2 | Execute PR #95 **S6-T4** (verify PDF e2e on PABSON tenant; GENERIC unchanged). | Manual PDF review attached; backend integration test green. |
| GF4.3 | Execute PR #95 **S7** (a11y audit, perf/re-render budget on 100-row lists, `identifier.fallback_used` telemetry, Playwright `identifier-display.spec.ts`, S0 audit closeout). | Per PR #95 S7 validations; axe-core CI green; Playwright green; telemetry tile live. |

> PR #95 **S6-T5** (extract the shared registry into `@aibrains/shared-types` so
> backend imports the same identifier source of truth) is the cross-repo
> convergence point: it aligns with backend GB0's `GovernanceProfile`. Track it as
> the post-GF5 convergence initiative, not a GF4 ticket.

**Demo gate (Sprint GF4):** PR #95 Sprint 6 + 7 verification flows.

---

## Sprint GF5 — Add CBS UI profile (extensibility proof)

**Goal.** Mirror backend GB4: prove that adding a governance body to the frontend
is a single profile module + locale pack, conformance-gated, **ZERO call-site
edits**. Ship CBS as a complete `ArchetypeUiProfile` that stays non-runtime-valid
until product greenlights, in the **same coordinated shared-types publish as
backend GB4**.

**Demo.** With CBS temporarily added to the active set in a dev build: the GF0
conformance suite passes for CBS; the identifier displays, address variant,
dropdowns, and feature matrix all resolve CBS values; `git diff` shows only the new
CBS profile file + locale entries — **no edits to any `apps/**` component**.

| # | Title | Validation |
|---|---|---|
| GF5.1 | Author the CBS `ArchetypeUiProfile` (address variant, phone format, calendarSystem, identifiers, features, allowedValues) per the CBS public-school brief; placeholder-but-plausible where pending, flagged `// TODO(cbs-liaison)`. Data file only. | `tsc` clean; CBS profile present in the registry. |
| GF5.2 | Add CBS `en` + `ne` strings for any CBS-specific labels (likely none beyond GENERIC, but the coverage test must pass). | GF0.8 coverage suite green for CBS. |
| GF5.3 | **The proof ticket.** Add `'CBS'` to a test-only active set and run the GF0 conformance + identifier suites against it. Assert pass with **no edits to any `apps/**` file** in the diff. | Conformance + identifier suites green for CBS; CI assertion / reviewer-verified `git diff --stat` confirms zero `apps/**` files changed. Headline acceptance test. |
| GF5.4 | Refresh the "Adding a governance body (frontend)" guide (GF0.10) with the exact CBS file list + the coordinated shared-types publish handshake with backend GB4. | Guide reviewed; a second engineer confirms completeness against the GF5 diff. |
| GF5.5 | Coordinated shared-types consumption + pin bump (batched with backend GB4). Keep CBS out of the production active set — ship the profile, not the activation. | `pnpm install` resolves; Vercel preview builds; production active set still `['PABSON','GENERIC']`. |

**Demo gate (Sprint GF5):** CBS conformance proof — green suite + zero-app-edit diff.

---

## Frontend Definition of Done (framework-level)

- [ ] `getArchetypeProfile(archetype, country)` is the single source for FE governance config; conformance + i18n-coverage suite green for all active archetypes (GF0).
- [ ] The identifier-resolver (PR #95) ships as a profile consumer; all 14 raw-UUID sites eliminated; ESLint guard prevents regressions (GF1–GF2).
- [ ] Dropdowns + required fields are archetype-driven, not hardcoded (GF3 = Midnight Lockin P2.2 FE half).
- [ ] On-screen and PDF identifiers agree; a11y/perf/e2e gates green (GF4).
- [ ] Adding CBS required only a profile file + locale entries — proven by a zero-app-edit diff (GF5), in one coordinated publish with backend GB4.
- [ ] `region-aware-forms-divergence.md` written; PR #95 absorbed and sequenced, not duplicated.

---

*Frontend plan generated 2026-06-03 from the end-to-end code review. Subagent-reviewed
against atomic-ticket / demoable-sprint / no-duplication criteria before finalization.*
