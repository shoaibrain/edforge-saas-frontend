# Workspace Settings — Sprint Plan (Revised)

**Date:** 2026-03-21
**Author:** Claude (Opus 4.6)
**Status:** Revised — addressing 5 blocking flags from sub-agent review
**Prerequisite:** [Audit Report](workspace-settings-audit.md) — read first
**Review:** [Sub-Agent Review](workspace-settings-subagent-review.md)

---

## Sprint 0 — Data Model Completeness (Backend)

**Goal:** The API contracts are complete. Every setting the frontend needs exists in the API.

**Demo:** `GET /api/tenants/:id/settings` returns a `regional` block with all 9 fields. `PATCH` updates any field and returns the updated object.

### Task 0.1 — Add currency, calendarSystem, enableDualDateDisplay, numberFormat to workspace settings entity

**What:** Extend `RegionalSettings` interface in the DynamoDB entity to include 4 new fields with defaults.

**Where:**
- `server/application/microservices/identity/src/common/entities/workspace-settings.entity.ts` (lines 14-20)

**Changes:**
```typescript
interface RegionalSettings {
  defaultTimezone: string           // existing
  defaultLocale: string             // existing
  defaultDateFormat: string         // existing
  defaultTimeFormat: '12h' | '24h'  // existing
  defaultWeekStartsOn: 'sunday' | 'monday' // existing
  defaultCurrency: string           // NEW — "NPR" | "USD" | "EUR" | "GBP" | "INR"
  defaultCalendarSystem: 'gregorian' | 'bikram_sambat' // NEW
  enableDualDateDisplay: boolean    // NEW — default false
  defaultNumberFormat: 'south_asian' | 'international' // NEW
}
```

**Defaults for lazy-creation** (in `tenants.service.ts:172`): `defaultCurrency: "USD"`, `defaultCalendarSystem: "gregorian"`, `enableDualDateDisplay: false`, `defaultNumberFormat: "international"`.

**Validation:** GET endpoint returns all 9 regional fields. PATCH with any subset updates correctly.

### Task 0.2a — Update WorkspaceSettings TypeScript type (frontend)

**What:** Add the 4 new fields to the frontend TypeScript interface so the frontend can type-safely read and write them.

**Where:** `packages/types/src/tenant.ts` (lines 135-161)

**Validation:** `tsc --noEmit` passes across all packages.

### Task 0.2b — Update regionalSettingsSchema Zod validation (shared-types)

> **[FLAG 3 fix]** The Zod validation schema at `packages/shared-types/src/schemas/identity/tenant.schema.ts` (lines 110-116) currently only validates the original 5 fields. Without updating it, PATCH requests with the new fields will be silently stripped by Zod validation on the backend.

**What:** Update `regionalSettingsSchema` to include `defaultCurrency`, `defaultCalendarSystem`, `enableDualDateDisplay`, and `defaultNumberFormat` with their Zod types and defaults.

**Where:** `packages/shared-types/src/schemas/identity/tenant.schema.ts` (lines 110-116)

**Changes:**
```typescript
const regionalSettingsSchema = z.object({
  defaultTimezone: z.string(),                              // existing
  defaultLocale: z.string(),                                // existing
  defaultDateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']), // existing
  defaultTimeFormat: z.enum(['12h', '24h']),                // existing
  defaultWeekStartsOn: z.enum(['sunday', 'monday']),        // existing
  defaultCurrency: z.string().default('USD'),               // NEW
  defaultCalendarSystem: z.enum(['gregorian', 'bikram_sambat']).default('gregorian'), // NEW
  enableDualDateDisplay: z.boolean().default(false),         // NEW
  defaultNumberFormat: z.enum(['south_asian', 'international']).default('international'), // NEW
})
```

**Validation:** PATCH with `{ regional: { defaultCurrency: "NPR" } }` succeeds and returns the new value (not stripped). Existing fields without the new fields still pass validation (defaults kick in).

### Task 0.3 — Update workspace settings default factory

**What:** Update the default settings object in `tenants.service.ts` (lazy-creation path) and in `workspace.tsx` (frontend fallback at lines 128-148) to include the new fields with sensible defaults.

**Where:**
- `server/application/microservices/identity/src/tenants/tenants.service.ts:172`
- `apps/shell/src/pages/settings/workspace.tsx:128-148`

**Validation:** New tenant creation → GET settings returns all fields with defaults.

### Task 0.4 — Verify field name consistency

**What:** Audit that all regional fields consistently use the `default` prefix: `defaultTimezone`, `defaultLocale`, `defaultDateFormat`, `defaultTimeFormat`, `defaultWeekStartsOn`, `defaultCurrency`, `defaultCalendarSystem`, `defaultNumberFormat`. The one exception is `enableDualDateDisplay` (boolean toggle, not a "default" setting).

**Where:** Entity, Zod schema, TypeScript type, and UI — all four must agree.

**Validation:** Grep for each field name across all source files. Each appears in entity, schema, type, and UI with identical naming.

### Task 0.5 — API contract test

**What:** Write integration tests for GET and PATCH `/api/tenants/:id/settings` that validate:
- All 9 regional fields are present and correctly typed in GET response
- PATCH with partial regional update only changes specified fields
- PATCH preserves fields not included in the request body
- New fields (defaultCurrency, defaultCalendarSystem, etc.) are NOT stripped by Zod validation
- `isLocked: true` prevents updates (returns 403)

**Where:** `server/application/microservices/identity/src/tenants/tenants.controller.spec.ts` (new or extend existing)

**Validation:** Tests pass in CI.

---

## Sprint 1 — Resolved Settings Context (Frontend Foundation)

**Goal:** A single React hook exists that any module can call to get the active resolved settings for the current school/tenant.

**Demo:** Open browser console on any page. The shell context provides resolved settings. Changing workspace settings and refreshing shows new values propagated.

### Task 1.1 — Add workspace settings to shell context

> **[FLAG 4 fix]** `ShellContextValue` is an exported interface. This extension is a shell-internal concern. MFEs must NOT import shell types — they access settings via the school context channel (Task 1.4). The `useWorkspaceSettings()` hook is for shell-internal consumers only (e.g., Workspace Settings page, sidebar, topbar).

**What:** Extend `shell-context.tsx` to fetch workspace settings alongside existing tenant/school queries. Add a `useWorkspaceSettings()` hook export.

**Where:** `apps/shell/src/lib/shell-context.tsx` (extend existing context, lines 25-57 for interface, lines 107-149 for queries)

**Details:**
- Extend `ShellContextValue` interface with `workspaceSettings: WorkspaceSettings['regional'] | null`
- Add React Query for `tenantService.getWorkspaceSettings(tenantId)` with 5-minute stale time
- Expose via `useWorkspaceSettings()` hook returning the `WorkspaceSettings.regional` object
- This hook is shell-internal. MFEs access settings via school context channel (Task 1.4)

**Validation:** `useWorkspaceSettings()` returns the correct regional object on any page. Network tab shows the settings fetched once on app load.

### Task 1.2 — Auto-fetch school configuration on school switch

**What:** When `activeSchoolId` changes, automatically fetch the school's configuration and expose it in context.

**Where:** `apps/shell/src/lib/shell-context.tsx` (extend the school query block at lines 143-149)

**Details:**
- Add React Query for `tenantService.getSchoolConfiguration(activeSchoolId)` keyed on `['schoolConfiguration', activeSchoolId]`
- Expose via `useSchoolConfiguration()` hook (shell-internal)
- Also expose `activeSchool.calendarSystem` and `activeSchool.timezone` from the school object already fetched

**Validation:** Switch schools. `useSchoolConfiguration()` returns the correct config for the active school. Network tab shows configuration fetched on switch.

### Task 1.3 — Create useResolvedSettings() hook

**What:** The precedence resolver. Takes school configuration + school entity + tenant settings → returns a single flat resolved settings object.

**Where:** `apps/shell/src/hooks/useResolvedSettings.ts` (new file), exported from `shell-context.tsx`

**Signature:**
```typescript
export const SYSTEM_DEFAULTS: ResolvedSettings = {
  currency: "USD",
  timezone: "UTC",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
  calendarSystem: "gregorian",
  enableDualDateDisplay: false,
  numberFormat: "international",
  locale: "en-US",
  weekStartsOn: "sunday",
}

interface ResolvedSettings {
  currency: string          // "NPR" | "USD" etc
  timezone: string          // "Asia/Kathmandu" etc
  dateFormat: string        // "YYYY-MM-DD" etc
  timeFormat: '12h' | '24h'
  calendarSystem: 'gregorian' | 'bikram_sambat'
  enableDualDateDisplay: boolean
  numberFormat: 'south_asian' | 'international'
  locale: string            // "en-US" | "ne-NP"
  weekStartsOn: 'sunday' | 'monday'
}
```

**Precedence chain:**
1. School Configuration (if field present) → wins
2. School entity (calendarSystem, timezone) → wins if school config missing
3. Tenant Workspace Settings → fallback
4. System defaults (`SYSTEM_DEFAULTS`) → final fallback

**Validation:** Unit tests covering:
- School config present → school config wins
- School config absent, school entity has calendarSystem → school entity wins
- Neither present → tenant settings used
- All absent → `SYSTEM_DEFAULTS` returned

### Task 1.4 — Expose resolved settings to MFEs via school context channel

> **[FLAG 5 fix]** The `resolvedSettings` field is optional. MFEs must handle `undefined` gracefully by falling back to `SYSTEM_DEFAULTS`.

**What:** Extend the school context broadcast to include resolved settings, so MFE apps (Finance, Academics) that are separate builds can access them.

**Where:** `packages/config/src/school-context-channel.ts` (extend `SchoolContextPayload`)

**Details:**
- Add `resolvedSettings?: ResolvedSettings` to the broadcast payload (optional — `?` is mandatory for backward compatibility)
- Export `SYSTEM_DEFAULTS` from `packages/config/src/defaults.ts` so MFEs can import it without depending on shell
- Export `ResolvedSettings` type from `packages/config/src/types.ts`
- Shell broadcasts resolved settings alongside `schoolId` and `schoolStatus` on every school change AND on settings save
- MFEs read via `getSchoolContext().resolvedSettings ?? SYSTEM_DEFAULTS`

**Validation:**
- Finance MFE can call `getSchoolContext()` and receive resolved settings without importing shell internals
- When `resolvedSettings` is `undefined` (old Shell build), Finance falls back to `SYSTEM_DEFAULTS` without error

---

## Sprint 2 — Shared Formatting Utilities

**Goal:** `formatCurrency()` and `formatDate()` utilities exist that read from resolved settings. No module should format currency or dates with inline hardcoded logic.

**Demo:** Call `formatCurrency(150000, "NPR", { grouping: "south_asian" })` → `"NPR 1,50,000"`. Call with USD → `"$150,000.00"`.

### Task 2.1 — Extend existing formatCurrency in shared-types with compact/short modes

> **[FLAG 2 fix]** A generic `formatCurrency(amount, currency, options)` already exists at `packages/shared-types/src/utils/currency.ts` with South Asian grouping, Devanagari support, and a currency registry. We MUST extend this existing utility rather than creating a duplicate.

**What:** Add `compact` and `short` display modes to the existing `formatCurrency` in `packages/shared-types/src/utils/currency.ts`.

**Where:** `packages/shared-types/src/utils/currency.ts` (extend existing function)

**Changes:**
- Add `compact?: boolean` option — returns "NPR 4.6L" / "USD 150K" style
- Add `short?: boolean` option — returns "NPR 1.5 lakh" / "USD 150,000" style
- Compact abbreviation rules:
  - South Asian: L (lakh, ≥100K), Cr (crore, ≥10M)
  - International: K (≥1K), M (≥1M), B (≥1B)
- Ensure `numberFormat` / grouping option drives the grouping style (south_asian vs international)

**Re-export:** Add re-export from `packages/types/src/payment.ts` so existing Finance imports don't need to change import paths during migration:
```typescript
export { formatCurrency } from '@edforge/shared-types/utils/currency'
```

**Validation:** Unit tests:
- `formatCurrency(150000, "NPR", { grouping: "south_asian" })` → `"NPR 1,50,000.00"`
- `formatCurrency(150000, "USD")` → `"$150,000.00"`
- `formatCurrency(490000, "NPR", { compact: true, grouping: "south_asian" })` → `"NPR 4.9L"`
- `formatCurrency(1500000, "USD", { compact: true })` → `"$1.5M"`
- Edge cases: 0, negative, very large numbers, Devanagari locale

### Task 2.2 — Create settings-aware formatDate utility

**What:** A date formatter that respects resolved settings for format and dual-date display.

**Where:** `packages/types/src/format-date.ts` (new file — no existing equivalent exists)

**Signature:**
```typescript
function formatDate(date: Date | string, settings: Pick<ResolvedSettings, 'dateFormat' | 'calendarSystem' | 'enableDualDateDisplay'>, options?: {
  showBS?: boolean  // override: force show/hide BS
  showTime?: boolean
  timeFormat?: '12h' | '24h'
  timezone?: string
}): string
```

**Returns:**
- With `enableDualDateDisplay: true` and `calendarSystem: "bikram_sambat"`: `"15/04/2026 (BS: 2083/01/02)"`
- With `enableDualDateDisplay: false`: `"15/04/2026"` only
- Respects `dateFormat` setting for AD date ordering

**Uses:** `@edforge/date-utils` converter (the existing package) — do NOT create a new converter.

**Validation:** Unit tests for all format combinations.

### Task 2.3 — Create settings-aware formatDateTime utility

**What:** Timezone-aware timestamp formatter.

**Where:** `packages/types/src/format-datetime.ts` (new file)

**Signature:**
```typescript
function formatDateTime(timestamp: Date | string, settings: Pick<ResolvedSettings, 'timezone' | 'timeFormat' | 'dateFormat'>): string
```

**Uses:** `Intl.DateTimeFormat` with the timezone from settings.

**Validation:** Unit tests:
- UTC timestamp with `timezone: "Asia/Kathmandu"` → shows +5:45 offset time
- UTC timestamp with `timezone: "America/Chicago"` → shows CST time
- 12h vs 24h format respected

### Task 2.4 — Create useCurrency convenience hook

> **[SUGGESTION 1 adopted]** Reduces boilerplate across 15+ files. Each call site changes from `formatNPR(amount)` to `format(amount)` instead of `formatCurrency(amount, settings.currency, { grouping: settings.numberFormat })`.

**What:** A thin hook that pre-binds resolved settings to `formatCurrency`.

**Where:** `packages/types/src/hooks/useCurrency.ts` (new file)

**Signature:**
```typescript
function useCurrency(settings: ResolvedSettings): {
  format: (amount: number, opts?: { decimals?: number }) => string
  formatCompact: (amount: number) => string
  formatShort: (amount: number) => string
}
```

**Validation:** Unit test: `useCurrency({ currency: "NPR", numberFormat: "south_asian", ... }).format(150000)` → `"NPR 1,50,000.00"`

### Task 2.5 — Deprecate hardcoded formatNPR functions

**What:** Add `@deprecated Use formatCurrency() from @edforge/shared-types instead` JSDoc to `formatNPR`, `formatNPRShort`, `formatNPRCompact` in `packages/types/src/payment.ts`. Do NOT delete yet — Finance module still references them. Deletion happens in Sprint 4c.

**Where:** `packages/types/src/payment.ts:317-388`

**Validation:** IDE shows deprecation warnings on all usage sites.

---

## Sprint 3 — Workspace Settings UI Completeness

**Goal:** The Workspace Settings page renders controls for all 9 regional fields and saves them correctly.

**Demo:** Open Workspace Settings. See currency dropdown, calendar system dropdown, dual-date toggle, number format dropdown alongside existing fields. Change currency to NPR, calendar to Bikram Sambat, enable dual dates, set South Asian numbers. Save. Reload. All values persist.

### Task 3.1 — Add currency selector to Workspace Settings UI

**What:** Add a "Default Currency" dropdown with options: NPR, USD, EUR, GBP, INR.

**Where:** `apps/shell/src/pages/settings/workspace.tsx` — add to the regional settings section after the existing fields

**Validation:** Select NPR, save. Network tab shows `regional.defaultCurrency: "NPR"` in PATCH body. Reload shows NPR selected.

### Task 3.2 — Add calendar system selector

**What:** Add "Calendar System" dropdown with options: Gregorian, Bikram Sambat.

**Where:** `apps/shell/src/pages/settings/workspace.tsx`

**Validation:** Select Bikram Sambat, save. API response includes `defaultCalendarSystem: "bikram_sambat"`.

### Task 3.3 — Add dual date display toggle

**What:** Add "Show Bikram Sambat Dates" toggle. Only visible when calendar system is Bikram Sambat.

**Where:** `apps/shell/src/pages/settings/workspace.tsx`

**Validation:** Toggle on, save. Toggle visibility conditional on calendar system selection.

### Task 3.4 — Add number format selector

**What:** Add "Number Format" dropdown with options: South Asian (1,00,000) | International (100,000).

**Where:** `apps/shell/src/pages/settings/workspace.tsx`

**Validation:** Select South Asian, save. Reload confirms persistence.

### Task 3.5 — Wire form to useWorkspaceSettings context

**What:** Replace the page-local React Query fetch with `useWorkspaceSettings()` from Sprint 1 context. On save, invalidate the shell context cache so all modules see updated settings immediately.

**Where:** `apps/shell/src/pages/settings/workspace.tsx` (lines 201-236)

**Details:**
- Remove duplicate fetch — read initial values from shell context
- On save success: invalidate shell context's workspace settings query + re-broadcast resolved settings via school context channel

**Validation:** Change a setting, save, navigate to Finance — the resolved settings reflect the change without a full page reload.

---

## Sprint 4a — Finance Module: Overview Components (Settings Consumption)

> **[SUGGESTION 2 adopted]** Sprint 4 split into 4a (overview), 4b (billing pages), 4c (cleanup) to reduce risk.

**Goal:** Finance Overview page and all its cards consume resolved settings for currency formatting.

**Demo:** Nepal school Finance Overview → KPI tiles show "NPR 4.9L" with lakh grouping. Switch to US school → tiles show "USD $490K". No code changes between views.

### Task 4a.1 — Access resolved settings in Finance module

> **[FLAG 5 fix applied]** Must handle `resolvedSettings` being `undefined` from old Shell builds.

**What:** At the Finance layout level, read resolved settings from the school context channel and provide them to all Finance child components via a local React context.

**Where:** `apps/finance/src/layouts/FinanceLayout.tsx`

**Details:**
- Import `getSchoolContext`, `onSchoolChange`, `SYSTEM_DEFAULTS` from `@edforge/config`
- Create a `FinanceSettingsContext` providing `ResolvedSettings`
- **Fallback:** `const settings = getSchoolContext().resolvedSettings ?? SYSTEM_DEFAULTS`
- All child components access via `useFinanceSettings()` hook
- Also provide `useCurrency()` convenience hook pre-bound with settings

**Validation:** `useFinanceSettings()` returns correct resolved settings for the active school. When `resolvedSettings` is `undefined`, returns `SYSTEM_DEFAULTS` without errors.

### Task 4a.2 — Migrate Finance Overview KPI tiles

**What:** Replace `formatNPRCompact()` calls with `formatCompact(amount)` from `useCurrency()`.

**Where:** `apps/finance/src/routes/overview.tsx` (lines 276, 288, 301, 313)

**Validation:** KPI tiles show correct currency for active school's settings.

### Task 4a.3 — Migrate BillingHealthCard

**What:** Replace `formatNPRShort()` calls with `formatShort(amount)`.

**Where:** `apps/finance/src/components/overview-v2/BillingHealthCard.tsx` (lines 136, 141, 355, 390)

**Validation:** Billing health amounts use settings-driven formatting.

### Task 4a.4 — Migrate CollectionPerformanceCard

**What:** Replace `formatNPRShort()` calls.

**Where:** `apps/finance/src/components/overview-v2/CollectionPerformanceCard.tsx` (lines 108, 120, 133, 171-175, 217)

**Validation:** Collection bars show correct currency.

### Task 4a.5 — Migrate RecentPaymentsCard and RecentInvoicesCard

**What:** Replace `formatNPR()` calls.

**Where:**
- `apps/finance/src/components/overview-v2/RecentPaymentsCard.tsx` (line 127)
- `apps/finance/src/components/overview-v2/RecentInvoicesCard.tsx` (lines 109, 113)

**Validation:** Recent activity cards show settings-driven currency.

### Task 4a.6 — Migrate OverdueAlertBanner

> **[FLAG 1 fix]** This file was missing from original Sprint 4.

**What:** Replace `formatNPR`/`formatNPRShort` calls (2 occurrences).

**Where:** `apps/finance/src/components/overview-v2/OverdueAlertBanner.tsx`

**Validation:** Overdue alert shows settings-driven currency.

### Task 4a.7 — Migrate AgingReportCard

> **[FLAG 1 fix]** This file was missing from original Sprint 4.

**What:** Replace `formatNPR`/`formatNPRShort` calls (3 occurrences).

**Where:** `apps/finance/src/components/overview-v2/AgingReportCard.tsx`

**Validation:** Aging report amounts show settings-driven currency.

---

## Sprint 4b — Finance Module: Billing Pages (Settings Consumption)

**Goal:** All billing pages (Invoices, Payments, Accounts, Fee Structures) consume resolved settings.

**Demo:** Open Invoices, Payments, Student Accounts for a Nepal school → all amounts show NPR, all dates show dual AD+BS format. Switch to US school → USD, Gregorian only.

### Task 4b.1 — Migrate Invoices table (full audit)

**What:** Replace ALL currency and date formatting calls in the invoices list.

**Where:** `apps/finance/src/routes/billing/invoices/index.tsx` (11 occurrences of `formatNPR*`)

**Validation:** All invoice amounts and dates respect resolved settings. Grep confirms zero `formatNPR` calls remain in this file.

### Task 4b.2 — Migrate Invoice detail page

**What:** Replace currency formatting and dual-date formatting.

**Where:** `apps/finance/src/routes/billing/invoices/$invoiceId.tsx` (lines 89, 150-189)

**Validation:** Invoice detail amounts and dates respect resolved settings.

### Task 4b.3 — Migrate Payments table (full audit)

**What:** Replace ALL currency and date formatting calls in the payments list.

**Where:** `apps/finance/src/routes/billing/payments/index.tsx` (8 occurrences of `formatNPR*`)

**Validation:** All payment amounts and dates respect resolved settings. Grep confirms zero `formatNPR` calls remain.

### Task 4b.4 — Migrate Student Accounts page

> **[FLAG 1 fix]** This file was missing from original Sprint 4 — has 13 `formatNPR` occurrences.

**What:** Replace ALL currency formatting calls (13 occurrences) in student accounts/ledger.

**Where:** `apps/finance/src/routes/billing/accounts/index.tsx`

**Validation:** Grep confirms zero `formatNPR` calls remain in this file.

### Task 4b.5 — Migrate BulkInvoiceForm

> **[FLAG 1 fix]** This file was missing from original Sprint 4 — has 8 `formatNPR` occurrences.

**What:** Replace ALL currency formatting calls (8 occurrences).

**Where:** `apps/finance/src/components/billing/BulkInvoiceForm.tsx`

**Validation:** Grep confirms zero `formatNPR` calls remain in this file.

### Task 4b.6 — Migrate FeeStructureList

> **[FLAG 1 fix]** This file was missing from original Sprint 4 — has 2 `formatNPR` occurrences.

**What:** Replace currency formatting calls (2 occurrences).

**Where:** `apps/finance/src/components/configuration/FeeStructureList.tsx`

**Validation:** Grep confirms zero `formatNPR` calls remain.

### Task 4b.7 — Migrate payment recording and fee structure creation

**What:** Replace hardcoded `currency: 'NPR'` with the resolved currency.

**Where:**
- `apps/finance/src/routes/billing/payments/record.tsx` (line 221)
- `apps/finance/src/routes/configuration/fee-structures.tsx` (line 162)

**Validation:** New payments and fee structures use the org's configured currency.

### Task 4b.8 — Migrate date formatting across all billing pages

**What:** Replace all calls to `formatDate()`, `formatDateDual()`, `formatDateTime()` from `apps/finance/src/utils/format-date.ts` with the settings-aware versions from Sprint 2.

**Where:** All files in `apps/finance/src/routes/billing/` that import from `../utils/format-date`

**Validation:** Nepal school pages show dual AD+BS dates. US school pages show Gregorian only.

### Task 4b.9 — Fix relative date timestamps with timezone

**What:** Replace `formatRelativeDate()` in `packages/types/src/finance-utils.ts` with a timezone-aware version using resolved settings.

**Where:** `packages/types/src/finance-utils.ts` (lines 100-130)

**Validation:** Nepal school timestamps show NST times. US school timestamps show CST/EST.

---

## Sprint 4c — Finance Module: Cleanup

**Goal:** All old hardcoded formatters are removed. Finance module is fully settings-driven.

**Demo:** `grep -r "formatNPR" apps/finance/` returns zero results. `tsc --noEmit` passes.

### Task 4c.1 — Full grep audit of formatNPR across all source

**What:** Run `grep -rn "formatNPR\|formatNPRShort\|formatNPRCompact" apps/finance/src/` and verify ZERO results. If any remain, migrate them before proceeding.

**Where:** Entire `apps/finance/src/` directory

**Validation:** Grep returns empty result set.

### Task 4c.2 — Delete deprecated formatNPR functions

**What:** Remove `formatNPR`, `formatNPRShort`, `formatNPRCompact` from `packages/types/src/payment.ts`.

**Where:** `packages/types/src/payment.ts` (lines 317-388)

**Validation:** `tsc --noEmit` passes across all packages. Grep for `formatNPR` returns zero results in all `apps/` directories.

### Task 4c.3 — Widen Payment.currency type

**What:** Change `Payment.currency` from literal `'NPR'` to `string` so payments can be recorded in any configured currency. Also update `InitiatePaymentRequest.currency` and `RecordManualPaymentDto.currency`.

**Where:** `packages/types/src/payment.ts` (lines 87-88, 123-124, 162)

**Validation:** `tsc --noEmit` passes. Payment recording with USD works.

### Task 4c.4 — Delete old finance date utilities

**What:** Remove `formatDate`, `formatDateDual`, `formatDateTime` from `apps/finance/src/utils/format-date.ts` now that all call sites use the shared settings-aware versions.

**Where:** `apps/finance/src/utils/format-date.ts`

**Validation:** No imports from `../utils/format-date` remain in `apps/finance/src/`.

---

## Sprint 5 — Academics Module Consumes Resolved Settings

**Goal:** Academic dates, attendance timestamps, and enrollment dates respect resolved settings.

**Demo:** Nepal school Academics → dates show BS format. US school → Gregorian only. No code change.

### Task 5.1 — Access resolved settings in Academics module

**What:** At the Academics layout level, read resolved settings from school context channel. Provide to child components. Use the same pattern as Finance (Task 4a.1): `getSchoolContext().resolvedSettings ?? SYSTEM_DEFAULTS`.

**Where:** `apps/academics/src/layouts/` (layout component)

**Validation:** `useAcademicsSettings()` returns resolved settings.

### Task 5.2 — Wire date display components to resolved settings

**What:** The `DateDisplay` and `SchoolDate` components in `packages/ui/` currently use `i18n.language` to decide BS vs AD. Add an alternative path: if `calendarSystem` is passed as a prop, use that instead of language detection.

**Where:**
- `packages/ui/src/components/DateDisplay.tsx` (line 42)
- `packages/ui/src/components/SchoolDate.tsx`

**Details:**
- Add optional `calendarSystem` prop
- Priority: explicit `calendarSystem` prop > `calendar` prop > `i18n.language` detection
- This is backward-compatible — existing usage without the prop still works via language detection

**Validation:** `<DateDisplay date="2026-04-15" calendarSystem="bikram_sambat" />` shows BS date regardless of i18n language setting.

### Task 5.3 — Update Academics date formatting

**What:** Ensure attendance records, enrollment dates, and academic calendar views pass `resolvedSettings.calendarSystem` to date display components.

**Where:** Attendance views, student list, enrollment forms in `apps/academics/src/`

**Validation:** Nepal school student list shows BS dates for enrollment. US school shows Gregorian.

---

## Sprint 6 — Validation: End-to-End Nepal School Journey

**Goal:** Complete end-to-end user journey verified. MVP acceptance test passes.

**Demo:** Recorded walkthrough of the full journey (see below).

### Task 6.1 — E2E test script for Nepal school journey

**What:** Write a Playwright E2E spec covering:

1. Org admin opens Workspace Settings → sets Currency=NPR, Calendar=Bikram Sambat, Dual Date=ON, Timezone=Asia/Kathmandu, Number Format=South Asian → saves each section
2. Navigate to Finance Overview → KPI tiles show NPR with lakh formatting
3. Open Finance Payments → amounts in NPR, dates show dual AD+BS format, timestamps show NST
4. Open Invoices → due dates show dual format, amounts in NPR
5. Open Student Accounts → balances in NPR with lakh grouping
6. Open Academics Students → enrollment dates show BS format
7. Change currency to USD → save → Finance shows USD formatting
8. Verify Westfield High (US school) with USD+Gregorian settings shows correctly

**Where:** `e2e/tests/workspace-settings-nepal-journey.spec.ts` (new file)

**Validation:** Playwright spec passes green.

### Task 6.2 — Write Nepal MVP validation checklist

**What:** Human-readable checklist for QA or pilot school admin to verify the feature.

**Where:** `docs/nepal-mvp-validation-checklist.md`

**Validation:** Checklist covers every step from Task 6.1 in plain language.

### Task 6.3 — Fix any failures found during validation

**What:** Buffer task for any bugs discovered during E2E testing. Each fix is its own commit.

**Validation:** E2E spec passes. Manual walkthrough matches expected screenshots.

---

## Out of Scope (Explicitly Excluded)

- School-level settings override UI
- Full i18n / Nepali language translation of UI strings
- eSewa / Khalti payment gateway configuration
- Parent/Student portal localization
- Multi-currency invoicing (single currency per org for MVP)
- Notifications timezone enforcement
- People / HR module date formatting
- Auth Debug page visibility (tracked as separate chore — see SUGGESTION 3)

## Non-Negotiable Constraints

- Do not touch DiceBear avatar logic
- Do not rebuild TanStack Table instances — only modify cell renderers
- Do not break Ed-Fi compliance fields
- Shell architecture: topbar z-index:50, sidebar z-index:40, no position:fixed overlays

---

## Appendix: Flag Resolution Summary

| Flag | Issue | Resolution |
|------|-------|------------|
| FLAG 1 | Sprint 4 missing 5+ files with `formatNPR` calls | Added Tasks 4a.6, 4a.7, 4b.4, 4b.5, 4b.6 + full grep audit in 4c.1 |
| FLAG 2 | Duplicate `formatCurrency` — existing one in shared-types | Task 2.1 now extends `packages/shared-types/src/utils/currency.ts` instead of creating new file |
| FLAG 3 | Missing Zod schema update | Added Task 0.2b for `regionalSettingsSchema` in shared-types |
| FLAG 4 | Shell context type boundary unclear | Task 1.1 now explicitly notes MFE boundary — MFEs use school context channel, not shell imports |
| FLAG 5 | MFE backward compatibility for resolvedSettings | Task 1.4 exports `SYSTEM_DEFAULTS`, Tasks 4a.1 and 5.1 use `?? SYSTEM_DEFAULTS` fallback |
