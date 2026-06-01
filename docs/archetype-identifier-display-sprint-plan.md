# Archetype-Compliant Identifier Display System

## Context

Across the EdForge multi-tenant SPA (`edforge.app`), internal infrastructure UUIDs leak into UI surfaces where archetype-compliant human-readable identifiers should appear. This breaks compliance and user trust in regulated regions.

**Concrete examples in production today:**
- **Student Profile (PABSON / Nepal pilot — Shree Saraswati English Boarding School):** Renders `studentNumber=SSSEB-2026-00044` (an internal default) when CEHRD/IEMIS compliance requires the government-recognized `emisStudentId=1708400128200043` returned by the API.
- **Payment Receipt PDF + UI:** Renders `Paid By: 41136dda-a0e1-7083-7cb2-985af50d8280` (raw Cognito UUID) instead of a resolved user display name. `Student ID` in the PDF shows the internal student UUID instead of the EMIS ID.
- **~20 additional sites** across `apps/finance`, `apps/academics`, `apps/people`, `apps/shell` show `id.slice(0, 8)` UUID fragments as fallback identifiers.

**Outcome we want:** When a tenant's `archetype` (e.g., `PABSON`) defines a region-specific identifier, the UI renders it consistently with the right label and format (and the right fallback rules). When archetype is `GENERIC` or unset, the existing default IDs render unchanged. Adding a future archetype (`CBSE_IN`, `NAIS_US`, `GEMS_UAE`) is a single data-file change — no call-site edits.

The repo already has the archetype-broadcast infrastructure in place (`packages/config/src/school-context-channel.ts`, `packages/forms/src/hooks/useTenantContext.ts`, `IemisCodeBadge`, `TenantBadge`, `resolveAddressVariant`, `phoneFormatForArchetype`). This plan extends that exact pattern to identifiers.

---

## Solution Overview

A new package **`packages/identifier-resolver`** owns:

1. **Pure resolver** `resolveIdentifier(entity, data, ctx) → ResolvedIdentifier` — synchronous, framework-free, table-driven.
2. **Archetype registry** — `[archetype][entity] → IdentifierSpec` overlay on a `GENERIC` base. New archetype = new file.
3. **Hook** `useArchetypeIdentifier(entity, data)` — wraps resolver with `useTenantContext()`.
4. **Components** `<EntityIdDisplay>`, `<EntityIdLabel>`, `<EntityIdValue>`, `<UuidBadge>`, `<UserDisplay>` — drop-in replacements for the ~20 call sites.
5. **User UUID resolution** `usePaidByUser(userId)` / `useBatchedUsers(ids)` — React Query, tenant-scoped, with injected `fetchUser` to avoid `packages → apps` coupling.
6. **i18n** new `identifiers` namespace in `packages/i18n` with `en` + `ne` translations day-one.

**Reused existing primitives (do NOT duplicate):**
- `packages/forms/src/hooks/useTenantContext.ts` (archetype/country read)
- `packages/config/src/school-context-channel.ts` (broadcast)
- `packages/config/src/mf-shared.ts` (Module Federation share/singleton config — comment documents prior production bug from missing singleton)
- `apps/shell/src/services/users.service.ts::getUser` (UUID→user lookup)
- `apps/shell/src/components/settings/IemisCodeBadge.tsx` (style tokens for IEMIS badge variant)
- `apps/academics/src/components/students/profile/ProfileTab.tsx::mask()` privacy toggle (identifier display must honor it for PABSON EMIS — government PII)
- TanStack React Query (existing query-client setup)
- MSW (`test-utils/mocks/server.ts`) for hook tests

**Non-React surfaces also covered:** CSV export (`apps/finance/src/components/shared/ExportCsvButton.tsx`), IEMIS findings export (`apps/academics/src/components/students/iemis/iemis-findings-export.ts`), analytics exports, and the backend-rendered PDF receipt — these get a non-React sibling `serializeIdentifier(entity, data, ctx)` so the serialized output matches the on-screen output. Otherwise on-screen shows EMIS while CSV ships UUID — a regression.

---

## Critical Files

**New (foundation):**
- `packages/identifier-resolver/src/resolveIdentifier.ts` — pure core
- `packages/identifier-resolver/src/registry/entities.ts` — `EntityKind` union + `EntityDataMap`
- `packages/identifier-resolver/src/registry/archetypes/{generic,pabson,cbse-in,nais-us,gems-uae}.ts`
- `packages/identifier-resolver/src/registry/index.ts` — `ARCHETYPE_REGISTRY`
- `packages/identifier-resolver/src/useArchetypeIdentifier.ts`
- `packages/identifier-resolver/src/components/{EntityIdDisplay,UuidBadge,UserDisplay}.tsx`
- `packages/identifier-resolver/src/user-resolution/{usePaidByUser,useBatchedUsers,userKeys}.ts`
- `packages/identifier-resolver/src/config.ts` — `configureIdentifierResolver({ fetchUser })`
- `packages/i18n/src/locales/{en,ne}/common.json` — add `identifiers` keys

**Migration targets (sweep) — representative paths; pattern repeats:**
- `apps/academics/src/components/students/profile/ProfileTab.tsx:340-341`
- `apps/finance/src/components/billing/PaymentReceipt.tsx:116, 143, 144`
- `apps/finance/src/components/overview-v2/RecentPaymentsCard.tsx:119`
- `apps/finance/src/routes/billing/{payments,invoices,accounts}/index.tsx`
- `apps/finance/src/components/billing/{StudentSearchInput,BulkInvoiceForm}.tsx`
- `apps/academics/src/components/enrollment/EnrollmentTable.tsx:224, 331`
- `apps/academics/src/routes/enrollment/index.tsx:172`
- `apps/shell/src/pages/settings/account.tsx:520-523`

**Bootstrap wire-up:**
- `apps/shell/src/main.tsx` (or equivalent) — call `configureIdentifierResolver({ fetchUser: getUser })` at startup, before MFEs mount.

---

# Sprint Plan

Each sprint ends with a runnable, demoable artifact. Each task is independently committable with tests (or, where tests don't make sense, an explicit alternative validation).

---

## SPRINT 0 — Discovery, Contract & RFC Confirmation
*Goal: lock contracts before anyone writes code. No production code yet.*

**Demoable outcome:** Approved RFC document + verified API contract; CI passes a contract test asserting `Student.emisStudentId` exists in `@aibrains/shared-types`.

### Tickets

**S0-T1 — Audit & catalog every UUID/short-ID rendering site**
- Grep across all `apps/*` for `.slice(0, 8)`, `userId`, `studentId`, `transactionId`, `paidBy`, `createdBy`, `updatedBy`, `invoiceId`, `paymentId`, `enrollmentId`.
- Output: `docs/identifier-rendering-audit.md` — one row per site (`file:line`, entity, current field, context: table-cell / detail-header / receipt-line, interactive: yes/no).
- **Validation:** PR reviewer spot-checks 5 random rows; doc committed.

**S0-T2 — Confirm backend API contract for `emisStudentId` and `paidByUser`**
- Call `GET /api/academics/students/:id/profile` for a PABSON tenant (already confirmed: `emisStudentId` present).
- Call `GET /api/finance/payments/:id/receipt` — document whether `paidBy` is a UUID or `paidByUser: { displayName }` object. File backend ticket if enrichment missing.
- **Validation:** API contract documented in `docs/identifier-api-contract.md`; backend ticket linked if applicable.

**S0-T3 — Write RFC for `packages/identifier-resolver`**
- Document: package responsibilities, registry shape, resolver algorithm, fallback rules, country-tiebreak (`country='NPL'` + `archetype='GENERIC'` → PABSON registry — mirrors `resolveAddressVariant`), naming conventions.
- **Must explicitly specify:**
  - Sensitive-data masking contract: when `mask()` toggle is active in `ProfileTab.tsx`, `<EntityIdDisplay>` for `student` on PABSON masks `emisStudentId` (it's government PII); `<UuidBadge>` also masks the tooltip-full-UUID, not just the truncated display.
  - SSR/print-preview behavior: archetype broadcast is `window`-based; identify the one or two print-preview surfaces (if any) that render outside the browser event loop and document the snapshot-based fallback for them.
  - Error-boundary contract: registry lookup throwing must degrade to GENERIC fallback + log, not blank the UI.
- **Validation:** RFC reviewed and approved by 1+ engineer; merged to `docs/rfcs/`.

**S0-T4 — REMOVED.** Contract test moved to S1-T0 once the package scaffolds. (Avoids the "orphaned tests in test-utils" anti-pattern flagged by review.)

---

## SPRINT 1 — Foundation Package: Registry, Pure Resolver, Types
*Goal: ship the testable pure core + MF singleton config. Zero UI changes; CI green.*

**Demoable outcome:** `pnpm test --filter @edforge/identifier-resolver` runs a table-driven test suite covering GENERIC + PABSON across student/payment/invoice. New package installs, builds, and is registered as a Module Federation singleton.

### Tickets

**S1-T1 — Scaffold `packages/identifier-resolver` package**
- `package.json` (name `@edforge/identifier-resolver`, peer deps on `react`, `@tanstack/react-query`), `tsconfig.json`, `vitest.config.ts`, `src/index.ts`.
- Add to `pnpm-workspace.yaml`, `turbo.json` build pipeline.
- **Validation:** `pnpm install && pnpm build --filter @edforge/identifier-resolver` succeeds.

**S1-T1.5 — Register `@edforge/identifier-resolver` as Module Federation singleton (BLOCKS S3-T1)**
- File: `packages/config/src/mf-shared.ts`.
- Add to the shared-singleton list alongside `@edforge/config` (the same file documents a prior Sprint A.12 production bug from missing singleton — do not repeat it; the resolver holds a module-level config singleton via `configureIdentifierResolver`).
- **Validation:** Add a `mf-shared.test.ts` assertion that the new entry is present and singleton-flagged. Integration: build all MFEs; runtime check that `configureIdentifierResolver` is the same object reference across MFEs.

**S1-T0 — Contract test for `@aibrains/shared-types` fields (moved from S0-T4)**
- File: `packages/identifier-resolver/src/__tests__/shared-types-contract.test.ts`.
- `Expect<HasField<Student, 'emisStudentId'>>` + same for `studentNumber`, `receiptNumber`, `transactionId`, `paidBy`, `displayName` on `User`.
- **Validation:** Test green now; will fail CI red if any field is removed/renamed in the SDK.

**S1-T2 — Define `EntityKind` union and `EntityDataMap` type**
- File: `src/registry/entities.ts`.
- `EntityKind = 'student' | 'payment' | 'invoice' | 'account' | 'user' | 'receipt' | 'transaction' | 'enrollment'`.
- `EntityDataMap` maps each kind to the subset of fields the resolver reads (from `@aibrains/shared-types`).
- **Validation:** Unit test asserts compile-time shape via `Expect<Equal<...>>` helpers.

**S1-T3 — Define `IdentifierSpec`, `ArchetypeIdSpec`, `ResolvedIdentifier` types**
- File: `src/registry/types.ts`.
- `IdentifierSpec = { field: keyof EntityData; labelKey: string; format: 'iemis' | 'uuid-short' | 'plain' | 'mono'; copyable?: boolean }`.
- `ResolvedIdentifier = { primary: ResolvedId; secondary?: ResolvedId; fallbackUsed: boolean; archetype: string; entity: EntityKind }`.
- **Validation:** Types compile; export from package index.

**S1-T4 — Author GENERIC archetype registry**
- File: `src/registry/archetypes/generic.ts`.
- Covers all 8 `EntityKind`s with sensible defaults: student → `studentNumber`/fallback `id`; payment → `receiptNumber`/fallback `id`; user → `displayName`/fallback `id`; etc.
- **Validation:** Unit test: `resolveIdentifier('student', {...}, { archetype: 'GENERIC' })` returns expected primary/fallback.

**S1-T5 — Author PABSON archetype registry (delta-overlay on GENERIC)**
- File: `src/registry/archetypes/pabson.ts`.
- Overrides: student → primary `emisStudentId` (format `iemis`), secondary `studentNumber`, fallback `studentNumber`.
- **Validation:** Unit test: PABSON tenant with `emisStudentId='1708400128200043'` resolves to primary EMIS; missing EMIS resolves to fallback `studentNumber` with `fallbackUsed=true`.

**S1-T6 — Author future-archetype stubs (`CBSE_IN`, `NAIS_US`, `GEMS_UAE`)**
- Files: `src/registry/archetypes/{cbse-in,nais-us,gems-uae}.ts`.
- Stubs identical to GENERIC for now (placeholder until product defines fields).
- **Validation:** Unit test: each archetype resolves without throwing; matches GENERIC output.

**S1-T7 — Build `ARCHETYPE_REGISTRY` lookup + merge logic**
- File: `src/registry/index.ts`.
- `getRegistry(archetype): ArchetypeIdSpec` returns merged `{...GENERIC, ...archetype}` per-entity, per-slot.
- Country tiebreak: `country='NPL'` + unknown archetype → PABSON.
- **Validation:** Unit test covers: PABSON direct, NPL+GENERIC tiebreak, unknown archetype falls through to GENERIC, null archetype falls through.

**S1-T8 — Implement pure `resolveIdentifier(entity, data, ctx)`**
- File: `src/resolveIdentifier.ts`.
- Algorithm: look up spec → check `data[primary.field]` non-empty → fall back to `spec.fallback`/`spec.secondary` with `fallbackUsed=true`.
- UUID detection helper (regex) for `uuid-short` format.
- Error-boundary: lookup throws → degrade to GENERIC + emit error telemetry; never throw to caller.
- **Validation:** Table-driven unit test (Vitest `it.each`) with these specific cases enumerated:
  - Primary field is `''`, `null`, `undefined`, `' '` (whitespace), `'0'` (falsy-numeric-string) — each has explicit expected fallback semantics.
  - PABSON direct, NPL+GENERIC tiebreak, unknown archetype falls through to GENERIC, null archetype falls through, both `country` and `archetype` set with conflicting hints (archetype wins).
  - Compile-time: registry referencing a field NOT in `EntityDataMap[K]` is a TS error (asserted via `// @ts-expect-error` line in a test file).
  - Throwing-registry case degrades to GENERIC.

**S1-T8.5 — Implement non-React `serializeIdentifier(entity, data, ctx)` for CSV/PDF/export**
- File: `src/serializeIdentifier.ts`.
- Pure synchronous variant returning `{ label: string; value: string }` (already-translated label using injected `t` fn, or labelKey for caller to translate).
- Same registry, same resolution logic — wraps `resolveIdentifier` and flattens to a serializable shape.
- **Validation:** Unit test; integration test: piped through `ExportCsvButton.tsx` produces archetype-correct columns matching on-screen.

**S1-T9 — Add i18n `identifiers` keys to `en` + `ne` common namespaces**
- Files: `packages/i18n/src/locales/{en,ne}/common.json`.
- Keys: `identifiers.emisStudentId`, `studentNumber`, `stateStudentId`, `receiptNumber`, `transactionId`, `paymentId`, `invoiceNumber`, `invoiceId`, `paidBy`, `userId`, `enrollmentId`, plus format-level `copy`, `copied`, `unverifiedFormat`.
- **Validation:** Snapshot test asserts every `labelKey` referenced in the registry has a translation in both `en` and `ne`.

**S1-T10 — i18n coverage test (registry → translations) — MUST land before T4–T6**
- File: `packages/identifier-resolver/src/__tests__/i18n-coverage.test.ts`.
- Iterates registry, asserts each `labelKey` resolves in `en` + `ne`.
- **Sequencing note:** This ticket must merge before registry author tickets (T4–T6) so any future registry edit lacking a translation fails CI immediately, not retroactively.
- **Validation:** Fails red on a deliberately-uncovered registry entry; green on main.

---

## SPRINT 2 — React Layer: Hook, Components, Bootstrap Wiring
*Goal: ship the React-layer wrappers and wire the package into Shell. Zero migrations yet.*

**Demoable outcome:** Storybook (or a temporary route under `apps/shell/src/pages/dev/identifiers-demo.tsx`) shows `<EntityIdDisplay>` rendering correctly across all 5 archetypes with mock data. Manual archetype-toggle reproduces production behavior.

### Tickets

**S2-T1 — Implement `useArchetypeIdentifier(entity, data)` hook**
- File: `packages/identifier-resolver/src/useArchetypeIdentifier.ts`.
- Calls `useTenantContext()` from `@edforge/forms`, passes to `resolveIdentifier`, returns `ResolvedIdentifier`.
- **Validation:** RTL hook test wrapped in `<SchoolContextProvider archetype="PABSON">` mock — asserts hook resolves correctly when context changes.

**S2-T2 — Implement `<UuidBadge>` component (mono-truncated + copy)**
- File: `packages/identifier-resolver/src/components/UuidBadge.tsx`.
- Renders `41136dda…d8280` with `font-mono`, copy-to-clipboard, tooltip with full UUID.
- Reuses `IemisCodeBadge` style tokens for consistency.
- **Validation:** RTL test: renders truncated; clicking copy button puts full UUID on clipboard (mock `navigator.clipboard`).

**S2-T3 — Implement `<EntityIdDisplay entity data variant>` component**
- File: `packages/identifier-resolver/src/components/EntityIdDisplay.tsx`.
- `variant: 'inline' | 'stacked' | 'badge'` (default `inline`).
- Uses hook internally; formats per `ResolvedIdentifier.format` (`iemis` → IEMIS badge styling; `uuid-short` → `<UuidBadge>`; `plain` → text; `mono` → mono).
- Exposes `<EntityIdLabel>` and `<EntityIdValue>` sub-components for `<DataField label={…} value={…} />` call sites.
- **Validation:** RTL tests per archetype + variant × format combination.

**S2-T4 — Implement `configureIdentifierResolver({ fetchUser })` injection point**
- File: `packages/identifier-resolver/src/config.ts`.
- Module-level mutable singleton; throws clearly if `fetchUser` is read before being configured.
- **Validation:** Unit test: pre-config read throws with actionable error; post-config read returns the injected fn.

**S2-T5 — Wire `configureIdentifierResolver` from Shell bootstrap (BLOCKS S3)**
- File: `apps/shell/src/lib/shell-context.tsx` — call site must be *after* `school-context-channel` subscription is established (otherwise first paint sees archetype=null with a configured resolver — flicker bug).
- Calls `configureIdentifierResolver({ fetchUser: getUser })` from `apps/shell/src/services/users.service.ts`.
- Lazy-MFE consideration: each MFE's first paint must not occur before this call; document the load-order invariant in `shell-context.tsx` comments.
- **Validation:** Integration test asserts the singleton is configured before any MFE remote import resolves; manual dev-mode load shows no console errors and no archetype=null flash.

**S2-T6 — Implement `usePaidByUser(userId)` hook**
- File: `packages/identifier-resolver/src/user-resolution/usePaidByUser.ts`.
- React Query: `queryKey: ['user-display', tenantId, userId]`, `staleTime: 15min`, `gcTime: 60min`.
- UUID-regex short-circuit: non-UUID input returned as-is (already a name).
- Empty/null input → returns `{ displayName: '—', isLoading: false, isUuid: false }`.
- **Validation:** MSW-based test in `__tests__/usePaidByUser.test.tsx`: covers UUID-resolution-success, UUID-resolution-404 (returns short UUID), non-UUID short-circuit, cache hit on second render.

**S2-T7 — Implement `useBatchedUsers(ids[])` hook (N+1 guard for tables)**
- Same file. Uses `useQueries` to fan out + React Query cache to dedup; shares cache with `usePaidByUser`.
- **Decision required before merge:** either (a) gate this ticket on a backend bulk `POST /users/lookup` endpoint and use it, or (b) document the explicit per-tenant rate budget (e.g., max 50 user fetches per page render) and add a guard that returns `<UuidBadge>` for over-budget rows.
- **Validation:** MSW perf test: 100-row table renders within S7-T2 budget; cache hit on second render makes 0 network calls; budget overflow path triggers fallback.

**S2-T8 — Implement `<UserDisplay userId fallback>` component**
- File: `packages/identifier-resolver/src/components/UserDisplay.tsx`.
- Wraps `usePaidByUser`; shows skeleton while loading; renders `displayName`; on error shows `<UuidBadge>` fallback.
- **Validation:** RTL test: loading → skeleton; success → name; error → `<UuidBadge>`.

**S2-T9 — Build dev demo route (temp) `pages/dev/identifiers-demo.tsx`**
- File: `apps/shell/src/pages/dev/identifiers-demo.tsx` (gated behind `import.meta.env.DEV` or a `/dev` route).
- Renders `<EntityIdDisplay>` for student, payment, invoice across all 5 archetypes with mock data; archetype-toggle button.
- **Validation:** Manual visual review using `/run` skill or `pnpm dev:shell`; team agrees output matches RFC.

**S2-T10 — Public package exports + README**
- `packages/identifier-resolver/src/index.ts` re-exports the public surface.
- `packages/identifier-resolver/README.md` with usage examples for the 3 layers (pure / hook / component) and an "Adding a new archetype" guide.
- **Validation:** README reviewed; `pnpm typecheck` clean.

**S2-T11 — Handle tenant-context-not-yet-broadcast first paint (moved from S7-T4)**
- Component-layer: `<EntityIdDisplay>` renders a one-line skeleton when `useTenantContext()` returns `{archetype: null, country: null}` AND `getSchoolContext()` reports "not yet hydrated".
- Avoids flicker of default → archetype on first paint; ensures S3–S6 migrations don't ship this bug.
- **Validation:** RTL test simulates initial null context → asserts skeleton, not GENERIC fallback.

---

## SPRINT 3 — Thin Slice: PABSON Student Profile End-to-End
*Goal: prove the system on the highest-impact, lowest-blast-radius call site.*

**Demoable outcome:** Log into the production-shaped Shree Saraswati Secondary English Boarding School tenant (or a fixture clone) — Student Profile shows `EMIS Student ID: 1708400128200043` as the primary identifier, with `Student Number: SSSEB-2026-00044` shown as secondary. Switching to a GENERIC tenant shows unchanged behavior.

### Tickets

**S3-T0 — Sensitive-data masking contract for identifiers (BLOCKS S3-T2)**
- `<EntityIdDisplay entity="student">` reads the existing `mask()` toggle context from `ProfileTab.tsx` (lift it into a small shared hook `useStudentDataMasking()` if not already shared).
- On PABSON: when masked, `emisStudentId` shows `••••••••••••••••` (government PII).
- `<UuidBadge>` honors masking: tooltip-full-UUID is suppressed when masked (today's `ProfileTab` already toggles sensitive fields; this brings identifiers under the same regime).
- **Validation:** RTL test in `EntityIdDisplay.test.tsx` (or `ProfileTab.test.tsx`) — masked state hides EMIS digits AND tooltip; unmasked shows both.

**S3-T1 — Add `@edforge/identifier-resolver` as dep to `apps/academics`**
- Update `apps/academics/package.json`. Confirm Module Federation expose/share config doesn't break (i18n + react-query singletons).
- **Validation:** `pnpm build:mvp` succeeds; academics MFE still loads in shell.

**S3-T2 — Migrate `ProfileTab.tsx` student number display**
- File: `apps/academics/src/components/students/profile/ProfileTab.tsx:340-341`.
- Replace `<DataField label={t('fields.studentNumber')} value={student.studentNumber} />` with `<EntityIdDisplay entity="student" data={student} variant="stacked" />` (renders primary + secondary).
- Remove now-unused i18n key if appropriate.
- **Validation:** RTL test in `ProfileTab.test.tsx`: PABSON tenant fixture → asserts EMIS ID rendered; GENERIC tenant fixture → asserts `studentNumber` rendered; missing EMIS on PABSON → asserts fallback to studentNumber with subtle UI hint.

**S3-T3 — Update MSW fixtures to include `emisStudentId` for PABSON tenant**
- File: `apps/academics/src/__mocks__/students.fixtures.ts` (or wherever fixtures live).
- Add at least one PABSON-archetype student with `emisStudentId` populated, one with it missing.
- **Validation:** Existing `useStudents` tests still pass.

**S3-T4 — Update `useStudents.ts` types to include `emisStudentId`**
- File: `apps/academics/src/hooks/useStudents.ts` (and any local-narrowed types).
- Ensure the `StudentProfileResponseDto` from `@aibrains/shared-types` is propagated without local narrowing that drops the field.
- **Validation:** Typecheck clean; `student.emisStudentId` is reachable at the component layer.

**S3-T5 — Visual / accessibility validation**
- Run `pnpm dev:mvp` (or `/run` skill); navigate to Students → click any student in PABSON pilot tenant.
- Screenshot before/after for the PR.
- A11y check: `EntityIdDisplay` has appropriate `aria-label` (e.g., "EMIS Student ID, 1708400128200043, government registered").
- **Validation:** Screenshots in PR description match RFC mockups; axe-core check passes.

**S3-T6 — Remove dead i18n key + update changelog**
- If `fields.studentNumber` is no longer referenced, remove from locale files (or keep with a deprecation comment if backend still expects it elsewhere).
- Add CHANGELOG entry for `apps/academics`.
- **Validation:** `pnpm test` clean; CHANGELOG present.

---

## SPRINT 4a — Finance: Payment Receipt Page
*Goal: fix the highest-stakes single surface (the receipt the user sees and downloads). Small scope, clean revert boundary.*

**Demoable outcome:** Payment Receipt page on PABSON pilot tenant shows `Receipt #RCP-…`, `Transaction ID` as `<UuidBadge>` (truncated + copy), `Paid By` as resolved name like "Shoaib Rain". GENERIC tenant unchanged.

### Tickets

**S4a-T1 — Add `@edforge/identifier-resolver` to `apps/finance`**
- Update `apps/finance/package.json`; verify MF expose/share (already singleton from S1-T1.5).
- **Validation:** Finance MFE loads in shell; `pnpm build:mvp` clean.

**S4a-T2 — Migrate `PaymentReceipt.tsx` receipt number (line 116)**
- Replace `{t('receipt.receiptNumber')}{receipt.receiptNumber}` with `<EntityIdDisplay entity="payment" data={receipt} variant="inline" />`.
- **Validation:** Component test: renders `RCP-…` text; PABSON tenant unchanged (same primary field on this entity).

**S4a-T3 — Migrate `PaymentReceipt.tsx` transaction ID (line 143)**
- Replace `<ReceiptField label={t('receipt.transactionId')} value={receipt.transactionId} mono />` with `<EntityIdDisplay entity="transaction" data={receipt} variant="inline" />`.
- **Validation:** Component test: renders `<UuidBadge>` with truncated + copy.

**S4a-T4 — Migrate `PaymentReceipt.tsx` paid-by (line 144) using `<UserDisplay>`**
- Replace `<ReceiptField label={t('receipt.paidBy')} value={receipt.paidBy} />` with `<ReceiptField label={t('identifiers.paidBy')} value={<UserDisplay userId={receipt.paidBy} />} />`.
- **Validation:** MSW-backed test: UUID → resolved display name; loading shows skeleton; error falls back to `<UuidBadge>`.

**S4a-T5 — Visual + manual review on PABSON pilot tenant**
- Capture before/after screenshots of the on-screen receipt; clearly note PDF is still unchanged at this point (S6 will close that gap).
- **Validation:** Screenshots in PR; explicit "PDF still raw UUIDs — gated on S6" caveat in the PR description.

## SPRINT 4b — Finance: List Views & Action Forms
*Goal: sweep the lower-stakes finance surfaces (payment lists, invoice lists, accounts, search/bulk forms).*

**Demoable outcome:** Recent Payments card, Payment list, Invoice list, Invoice detail, Accounts list, Student Search, Bulk Invoice errors — every UUID slice replaced. PABSON tenant shows EMIS where applicable; GENERIC unchanged.

### Tickets

**S4b-T1 — Migrate `RecentPaymentsCard.tsx:119`**
- Replace `payment.receiptNumber || payment.id.slice(0, 8)` with `<EntityIdDisplay entity="payment" data={payment} variant="inline" />`.
- **Validation:** RTL test.

**S4b-T2 — Migrate `routes/billing/payments/index.tsx:502, 524`**
- Replace fallback slices in receiptNumber and invoiceId columns.
- **Validation:** Table snapshot test.

**S4b-T3 — Migrate CSV export in `ExportCsvButton.tsx` to use `serializeIdentifier`**
- Replace any raw `payment.id` / `studentId` column writes with `serializeIdentifier(...)` output so CSV matches on-screen.
- **Validation:** Unit test: PABSON archetype → CSV column shows EMIS; GENERIC → unchanged.

**S4b-T4 — Migrate `routes/billing/accounts/index.tsx:431-432`**
- Replace `account.studentId?.slice(0, 8)` with `<EntityIdDisplay entity="student" data={account} variant="inline" />`. Use `<UuidBadge>` directly if account row only has `studentId`.
- **Validation:** RTL test.

**S4b-T5 — Migrate `routes/billing/invoices/index.tsx:244, 261`**
- Same pattern for invoiceNumber + studentId columns.
- **Validation:** RTL test.

**S4b-T6 — Migrate `routes/billing/invoices/$invoiceId.tsx:90, 271`**
- Page header + cancel dialog title use `<EntityIdValue entity="invoice" data={invoice} />`.
- **Validation:** RTL test for both surfaces.

**S4b-T7 — Migrate `StudentSearchInput.tsx:72`**
- Replace UUID slice with `<EntityIdDisplay entity="student" data={selectedStudent} variant="inline" />`.
- **Validation:** RTL test in combobox-selected state.

**S4b-T8 — Migrate `BulkInvoiceForm.tsx:331` error row**
- Replace `Student ${err.studentId.slice(0, 8)}…` with `<EntityIdDisplay entity="student" data={{ id: err.studentId }} variant="inline" />`.
- **Validation:** RTL test of error table.

**S4b-T9 — Mobile / narrow-viewport check on `<UuidBadge>` truncation**
- Verify badge truncation degrades gracefully in finance lists at 360px width; copy button stays reachable.
- **Validation:** Visual review at narrow viewport; RTL test asserts no overflow.

---

## SPRINT 5 — Academics & Cross-MFE Sweep
*Goal: complete academics + people + shell sweeps.*

**Demoable outcome:** Enrollment table, attendance, account settings page, staff list — every UUID-slice/raw-UUID rendering site now uses `<EntityIdDisplay>` or `<UserDisplay>`. Audit doc S0-T1 shows zero open rows.

### Tickets

**S5-T1 — Migrate `EnrollmentTable.tsx:224, 331`**
- Replace `studentId.slice(0, 8)` with `<EntityIdDisplay entity="student" data={row} variant="inline" />`. Keep row-key logic unchanged (internal, not user-facing).
- **Validation:** Table RTL test.

**S5-T2 — Migrate `routes/enrollment/index.tsx:172` (confirmation dialog)**
- Replace UUID-slice fallback in the no-show confirmation message.
- **Validation:** RTL test on dialog.

**S5-T3 — Attendance components — DEFERRED**
- `AttendanceRow.tsx` already uses `studentNumber` properly (not a UUID). Whether daily roster should show EMIS instead is a product decision (teachers more likely want the student's familiar local number). Park behind a product confirmation; do not migrate as part of this cleanup.
- **Validation:** Product decision documented; ticket either reactivated or closed as "no change".

**S5-T4 — Migrate `apps/shell/src/pages/settings/account.tsx:520-523` (User ID)**
- Replace raw `userProfile.userId` mono + copy with `<UuidBadge value={userProfile.userId} />`. Keep copy behavior.
- **Validation:** RTL test; manual copy-to-clipboard works.

**S5-T5 — Migrate `apps/shell/src/pages/people/overview.tsx` staff badges (line 107, 891-893)**
- Replace conditional `s.userId` usage in status badges; if it's purely a presence check, leave as-is. If displayed, use `<UserDisplay>` or `<UuidBadge>`.
- **Validation:** RTL test on staff roster.

**S5-T6 — Migrate `apps/people/` staff profile** (if any UUID displays found)
- Per S0 audit; replace surfaces with `<EntityIdDisplay entity="user" data={staff} />`.
- **Validation:** RTL test.

**S5-T7 — ESLint AST rule preventing UUID-slice JSX expressions**
- Author a custom ESLint rule `no-id-slice-in-jsx` in `eslint.config.js` (or a `packages/eslint-plugin-edforge` package): flags `<JSXExpressionContainer>` containing a `CallExpression` of the shape `*.slice(0, 8)` (or `0, N` where N ≤ 12) AND the receiver is named `…id|…Id|userId|studentId|invoiceId|paymentId`. Grep-based check is too noisy (false-positives on legitimate Array/String slice).
- Provide an inline-disable comment for vetted edge cases.
- **Validation:** CI red on a deliberate offending PR; green on main; unit test against the rule with positive + negative fixtures.

**S5-T8 — Update S0 audit doc — verify zero open rows**
- Re-run the audit grep from S0-T1 and confirm every row from the original audit is now migrated.
- **Validation:** Audit doc updated; PR reviewer confirms.

---

## SPRINT 6 — Backend PDF Receipt Integration
*Goal: close the PDF gap (the only surface frontend can't fully own). After this sprint, on-screen and downloaded PDF tell the same story.*

**Demoable outcome:** Downloaded PDF receipt for a PABSON tenant shows `Student ID: 1708400128200043` (EMIS) and `Paid By: Shoaib Rain` (resolved name) — matching the on-screen page from S4a.

### Tickets

**S6-T1 — Define `IdentifierDisplayPayload` contract with backend**
- Coordinate with backend on the shape `{ receiptNumber, studentDisplayId, studentDisplayIdLabel, paidByDisplayName, transactionId, … }` accepted by the PDF generator.
- **Validation:** Contract documented in `docs/identifier-pdf-contract.md`; backend ticket merged + integration tag available.

**S6-T2 — Update `useDownloadReceiptPdf` mutation to accept `displayIdentifiers`**
- File: `packages/finance-services/src/…/useDownloadReceiptPdf.ts`.
- Accept and forward optional `displayIdentifiers` payload.
- **Validation:** Unit test asserts payload shape; mutation payload snapshot test.

**S6-T3 — `PaymentReceipt.tsx` pre-computes `displayIdentifiers` for PDF mutation**
- Before calling `downloadReceipt`, run `resolveIdentifier()` for `payment`/`student`/`transaction` and `usePaidByUser()` for the name; pass into the mutation.
- **Validation:** Snapshot test asserts new fields are sent; manual PDF download on PABSON tenant shows the right values rendered.

**S6-T4 — Verify PDF rendering end-to-end on PABSON tenant**
- Trigger PDF download; assert EMIS ID, resolved name, and receipt number appear correctly. Confirm GENERIC tenant unchanged.
- **Validation:** Manual PDF review attached to PR; backend integration test green.

**S6-T5 — Long-term: extract shared registry to `@aibrains/shared-types` (DEFERRED initiative)**
- NOT a sprint ticket — flagged as a cross-repo initiative tracked separately. Move `registry/archetypes/*.ts` to the shared SDK so backend imports the same source of truth.
- Frontend `packages/identifier-resolver` becomes a thin React-layer wrapper.
- **Validation:** Tracked in separate epic; not blocking this rollout. Documented as "next step" in S2-T10 README.

---

## SPRINT 7 — Hardening, A11y, Observability
*Goal: ship it for confidence.*

**Demoable outcome:** Dashboards show 0% raw-UUID rendering events; a11y audit clean; resolver perf within budget.

### Tickets

**S7-T1 — A11y audit of identifier displays**
- Run axe-core across migrated pages; fix any violations (e.g., missing `aria-label` on `<UuidBadge>` copy button).
- **Validation:** Axe-core CI check passes.

**S7-T2 — Performance / re-render budget**
- React Profiler on Students list (100+ rows): ensure `useArchetypeIdentifier` doesn't trigger excess re-renders (memoize where needed).
- **Validation:** Profiler trace attached to PR; before/after numbers.

**S7-T3 — Telemetry: log resolver fallback events**
- Emit a `identifier.fallback_used` telemetry event when `fallbackUsed=true` in production (sampled). Helps detect missing backend fields (e.g., PABSON student without `emisStudentId`).
- **Validation:** Telemetry verified in dev console; dashboard tile added.

**S7-T4 — Snapshot E2E test on Playwright pilot tenant**
- Add `e2e/identifier-display.spec.ts` — logs into PABSON-fixture tenant, navigates to Student Profile + Receipt, asserts EMIS ID and resolved name appear.
- **Validation:** Playwright run green in CI.

**S7-T5 — Final S0 audit closeout + retrospective doc**
- Re-confirm all original audit rows closed; close the project tracking doc.
- **Validation:** Audit doc archived; retro doc filed.

---

# Sprint Dependency Graph

```
S0 (RFC + audit + API contract)
  └── S1 (foundation package + MF singleton + i18n)
        └── S2 (React hooks, components, bootstrap wire-up, first-paint skeleton)
              └── S3 (thin slice: PABSON Student Profile)            [Demo milestone]
                    ├── S4a (Payment Receipt on-screen)              [Demo milestone]
                    │     └── S6 (PDF receipt: backend + payload wiring)  [Demo milestone — final UX truth]
                    ├── S4b (Finance lists + CSV export)
                    └── S5 (Academics + People + Shell sweep + ESLint guard)
                          └── S7 (a11y + perf + telemetry + E2E + closeout)
```

Critical blockers (annotated in tickets):
- **S1-T1.5 (MF singleton)** blocks all S3+ migrations.
- **S2-T5 (bootstrap wire-up)** blocks S3-T1.
- **S1-T10 (i18n coverage test)** sequences before S1-T4–T6 (registry authors).
- **S3-T0 (masking contract)** blocks S3-T2 onward.
- **S4a (on-screen receipt)** + **S6 (PDF)** logically pair; S6 should follow S4a within the same release if possible to avoid the "screen says EMIS, PDF says UUID" mixed-signal window.

# Verification (End-to-End)

After each sprint:

**Sprint 0:** RFC merged in `docs/rfcs/`; audit doc lists every site; API contract doc with `emisStudentId` confirmed.

**Sprint 1:** `pnpm test --filter @edforge/identifier-resolver` — table-driven suite green (≥30 cases including empty/null/whitespace/throwing-registry edges). `pnpm build --filter @edforge/identifier-resolver` clean. MF shared config test green.

**Sprint 2:** `pnpm dev:shell` → `/dev/identifiers-demo` → toggle archetype, all 5 archetypes render correctly. `<UserDisplay>` resolves with MSW fixtures. First-paint skeleton test green.

**Sprint 3 (thin-slice demo):** `pnpm dev:mvp` → log in as Shree Saraswati (PABSON) → Academics → Students → click Aatif Ansari → Profile tab shows `EMIS Student ID: 1708400128200043` primary, `Student Number: SSSEB-2026-00044` secondary. "Show sensitive details" toggle hides EMIS digits. GENERIC tenant unchanged.

**Sprint 4a:** Same tenant → Finance → Payments → Receipt for Aatif Ansari → `Receipt #RCP-61A-2605-0001`, truncated UUID badge with copy for Transaction ID, `Paid By: Shoaib Rain`. Note in demo: PDF still raw UUIDs (gated on S6).

**Sprint 4b:** Recent Payments, Payment list, Invoice list/detail, Accounts, Student Search, Bulk Invoice — all clean. CSV export of payments shows EMIS column on PABSON.

**Sprint 5:** Enrollment, account settings, staff badges — all clean. ESLint rule fires red on a deliberately-offending PR; green on main.

**Sprint 6:** Download PDF receipt on PABSON pilot tenant → `Student ID: 1708400128200043`, `Paid By: Shoaib Rain` appear in rendered output. On-screen and PDF now agree.

**Sprint 7:** Playwright `identifier-display.spec.ts` green; axe-core CI green; telemetry dashboard shows `identifier.fallback_used` events live; S0 audit fully closed.

---

# Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Backend doesn't return `emisStudentId` consistently for all PABSON students | Resolver has explicit fallback rule; S7-T3 telemetry alerts when fallback triggers in production. |
| `@aibrains/shared-types` removes/renames a registry-referenced field | S0-T4 contract test fails CI before deploy. |
| Module Federation singleton collision when adding new shared dep | Add `@edforge/identifier-resolver` to MF `shared` config in `packages/config/src/mf-shared.ts` from day one (S1-T1). |
| Cross-MFE event bus race: archetype not yet broadcast on first paint | S2-T11 explicit handling: render skeleton, not default fallback. |
| Backend PDF ticket (S4-T5 / S6-T1) slips | Frontend ships its mitigation independently; PDF stays on raw values until BE lands. No FE blocker. |
| Adding new archetype requires registry + locale + tests | "Adding a new archetype" runbook in `packages/identifier-resolver/README.md`; codified in S6-T5. |
| Performance regression in long student lists due to user-resolution hooks | `useBatchedUsers` + React Query cache; S7-T2 enforces budget. |
