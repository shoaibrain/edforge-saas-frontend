# Workspace Settings — System Audit Report

**Date:** 2026-03-21
**Auditor:** Claude (Opus 4.6)
**Scope:** End-to-end settings save/read path, data model gaps, school context, Nepal MVP readiness

---

## 1. Settings Save Path (Workspace Settings UI → API)

### What Works

- **UI exists and saves correctly.** `apps/shell/src/pages/settings/workspace.tsx` renders a complete form for regional settings (timezone, locale, dateFormat, timeFormat, weekStartsOn) plus branding and attendance policy.
- **API call:** On save, the component calls `tenantService.updateWorkspaceSettings(tenantId, data)` which issues `PATCH /tenants/{tenantId}/settings` via `apps/shell/src/services/tenant.service.ts:245-253`.
- **Field names match.** The UI uses the same `defaultTimezone`, `defaultLocale`, `defaultDateFormat`, `defaultTimeFormat`, `defaultWeekStartsOn` field names as the API response schema. No mismatch.
- **Optimistic update:** React Query mutation invalidates the `['workspaceSettings', tenantId]` cache on success, triggers toast notifications on success/error.
- **Lock check:** Backend checks `isLocked` flag before allowing updates (`tenants.service.ts:214`).

### What Is Broken

- **Settings are saved into a void.** The React Query cache for workspace settings is only consumed by the workspace settings page itself. No other module, context, or store reads from this cache.
- **No global propagation.** After save, there is no broadcast mechanism (like the school context channel) to notify consuming modules of changed settings.

### Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `apps/shell/src/pages/settings/workspace.tsx` | 201-272 | UI form, mutation, query |
| `apps/shell/src/services/tenant.service.ts` | 237-253 | API client for GET/PATCH |
| `packages/types/src/tenant.ts` | 135-161 | `WorkspaceSettings` TypeScript interface |
| `server/.../workspace-settings.entity.ts` | 1-88 | DynamoDB entity (PK: `TENANT#{id}`, SK: `SETTINGS#WORKSPACE`) |
| `server/.../tenants.service.ts` | 172-241 | Backend service — lazy-creates defaults, merges partial updates |
| `server/.../tenants.controller.ts` | 44-60 | REST endpoints with TenantAdmin guard |

---

## 2. Settings Read Path (API → React Context → Consuming Modules)

### Current State: No Read Path Exists

- **No React Context** for workspace settings. `apps/shell/src/lib/shell-context.tsx` provides `useActiveSchool()` and `useTenant()` hooks but does NOT fetch or expose workspace settings.
- **No Zustand store** holds workspace settings. `app.store.ts` manages `activeSchoolId`, `sidebarCollapsed`, `theme` only.
- **Finance module is completely deaf** to workspace settings. It has its own hardcoded formatting:
  - Currency: `formatNPR()`, `formatNPRShort()`, `formatNPRCompact()` in `packages/types/src/payment.ts:317-388` — all hardcoded to NPR.
  - Dates: `apps/finance/src/utils/format-date.ts` — hardcoded to `en-GB` DD/MM/YYYY + BS dual format always on.
  - Relative dates: `packages/types/src/finance-utils.ts:100-130` — hardcoded `en-US` 12-hour format.
- **Academics module** uses shared `DateDisplay` and `SchoolDate` UI components which accept `calendarSystem` as a prop, but these are driven by `i18n.language` (Nepali → BS, English → AD), not by workspace settings.
- **The `useDateFormatter()` hook** in `packages/date-utils/src/hooks/useDateFormatter.ts` ties calendar system to language preference, not to a settings field.

### Currency Trace

| Location | What it does | Settings-aware? |
|----------|-------------|-----------------|
| `packages/types/src/payment.ts:317-350` | `formatNPR(amount)` — NPR with lakh grouping | NO — hardcoded NPR |
| `packages/types/src/payment.ts:370-378` | `formatNPRCompact(amount)` — "NPR 4.6L" | NO — hardcoded NPR |
| `packages/types/src/payment.ts:380-388` | `formatNPRShort(amount)` — "NPR 1.5 lakh" | NO — hardcoded NPR |
| `apps/finance/src/routes/overview.tsx:276-313` | KPI tiles use `formatNPRCompact()` | NO |
| `apps/finance/src/routes/billing/payments/record.tsx:221` | `currency: 'NPR'` in payment creation | NO |
| `apps/finance/src/routes/configuration/fee-structures.tsx:162` | `currency: 'NPR'` in fee structure creation | NO |
| `Payment` type in `packages/types/src/payment.ts:87-88` | `currency: 'NPR'` literal type | NO — type-locked |

### BS Date Trace

| Location | What it does | Settings-aware? |
|----------|-------------|-----------------|
| `packages/date-utils/src/converter.ts` | Core `adToBS()` / `bsToAD()` conversion | N/A — pure utility |
| `apps/finance/src/utils/format-date.ts:32-47` | `formatDateDual()` — always shows BS alongside AD | NO — always dual |
| `packages/ui/src/components/DateDisplay.tsx` | Dual date display, checks `i18n.language` | Partially — language-driven, not settings-driven |
| `packages/ui/src/components/BsDatePicker.tsx:264` | BS picker when `calendarSystem === 'bikram_sambat'` | YES — prop-driven |
| `packages/shared-types/src/utils/bikram-sambat.ts` | Backend BS conversion utilities | N/A — server-side |

---

## 3. Data Model Gaps

### Gap Analysis Table

| # | Gap | Expected Location | Finding | Evidence |
|---|-----|-------------------|---------|----------|
| 1 | `currency` field missing from tenant settings | `WorkspaceSettings.regional` | **CONFIRMED MISSING** | `workspace-settings.entity.ts:14-20` has no currency field. `tenant.ts:135-161` type has no currency. Finance hardcodes NPR everywhere. |
| 2 | `calendarSystem` missing from tenant settings | `WorkspaceSettings.regional` | **CONFIRMED MISSING** | Field exists on School entity (`school.entity.ts:50`) but not in workspace settings entity or type. |
| 3 | `enableDualDateDisplay` / BS toggle missing | Tenant settings or school config | **CONFIRMED MISSING** | No field exists anywhere. Finance `formatDateDual()` always shows both formats unconditionally. |
| 4 | `numberFormat` field missing | `WorkspaceSettings.regional` | **CONFIRMED MISSING** | No field exists. `formatNPR()` hardcodes South Asian grouping (lakh/crore). |
| 5 | No resolved settings context in React | `packages/@edforge/context` or shell | **CONFIRMED MISSING** | No context, store, or hook provides resolved settings to consuming modules. Shell context has `useActiveSchool()` and `useTenant()` but no `useResolvedSettings()`. |
| 6 | Currency hardcoded in Finance | `packages/types/src/payment.ts` | **CONFIRMED** | Three formatting functions (`formatNPR`, `formatNPRShort`, `formatNPRCompact`) all hardcoded to NPR at lines 317-388. Payment type locks currency to literal `'NPR'`. |
| 7 | BS date conversion utility | `packages/date-utils/src/converter.ts` | **EXISTS** | Full AD↔BS conversion with lookup table for years 2000-2090. Also duplicated in `packages/shared-types/src/utils/bikram-sambat.ts`. |
| 8 | Workspace Settings UI field/API name mismatch | `workspace.tsx` | **NO MISMATCH** | Field names are consistent: `defaultTimezone`, `defaultLocale`, etc. match between UI, type, and API. |

### Additional Finding: Duplicate BS Conversion

There are **two separate** BS conversion implementations:
1. `packages/date-utils/src/converter.ts` — frontend package
2. `packages/shared-types/src/utils/bikram-sambat.ts` — shared backend/frontend package

Both have their own lookup tables. These should be consolidated to a single source of truth to prevent drift.

---

## 4. School Context Gaps

### What Works

- **Active school is known.** `useActiveSchool()` hook from `shell-context.tsx:370-373` returns `activeSchool`, `activeSchoolId`, `setActiveSchool`, `availableSchools`.
- **School context broadcasting works.** `packages/config/src/school-context-channel.ts` broadcasts school changes via `CustomEvent` on `window`. All MFEs can listen via `onSchoolChange()`.
- **School entity has `calendarSystem`.** The school record includes `calendarSystem: 'gregorian' | 'bikram_sambat'` (auto-set based on country code — NPL → bikram_sambat).
- **School configuration endpoint exists.** `GET /schools/:id/configuration` is implemented and returns school-specific operational config.

### What Doesn't Work

- **School configuration is NOT auto-fetched.** The shell context fetches the school object but NOT the school configuration on school switch. Configuration is only fetched by the school configuration settings page.
- **`calendarSystem` from school record is NOT propagated** to consuming modules via context. It exists in the school object but no hook/context exposes it to Finance or Academics for formatting decisions.
- **School timezone** (`timezone: "Asia/Kathmandu"`) exists on the school record but is never used for timestamp formatting. All timestamps use the browser's local timezone or hardcoded `en-US`/`en-GB` locale.
- **No precedence chain is implemented.** The data model supports School Config → School → Tenant → System Default, but no code resolves settings through this chain.

---

## 5. Risk Assessment

| Gap | Impact | Risk Level | Rationale |
|-----|--------|------------|-----------|
| No `currency` in settings | Finance shows NPR for all tenants including US schools | **HIGH** | Blocks multi-tenant deployment — US pilot schools would see NPR |
| No resolved settings context | Every module must independently hardcode or guess settings | **HIGH** | Architectural blocker — without this, every module fix is ad-hoc |
| Currency hardcoded as NPR | Cannot support any non-NPR tenant | **HIGH** | Literal type lock in `Payment` interface + 3 hardcoded formatters |
| No `calendarSystem` in tenant settings | Org admin cannot set default calendar for all schools | **MEDIUM** | School-level field exists; tenant default is nice-to-have for MVP |
| BS dual-date always on | US school Finance pages show BS dates they don't need | **MEDIUM** | Confusing for non-Nepal users but not blocking Nepal MVP |
| No `numberFormat` field | Lakh/crore grouping hardcoded — OK for Nepal, wrong for US | **MEDIUM** | Only matters when multi-tenant with US schools is needed |
| Duplicate BS conversion libs | Risk of conversion drift between frontend/backend | **LOW** | Both use lookup tables; functional today |
| School timezone not used | Timestamps show browser timezone, not school timezone | **LOW** | Acceptable for Nepal MVP (most users are in Nepal timezone) |

---

## 6. Recommended Scope for Nepal MVP

### Must Do (Blocking)

1. **Add `currency` field** to tenant settings API + entity + type
2. **Create resolved settings context** — single `useResolvedSettings()` hook that any module can call
3. **Create `formatCurrency(amount, settings)`** shared utility to replace hardcoded `formatNPR*` functions
4. **Wire Finance module** to consume resolved settings for currency formatting
5. **Add `calendarSystem` and `enableDualDateDisplay`** to tenant settings so dual-date can be toggled
6. **Wire Finance date formatting** to respect `enableDualDateDisplay` setting

### Should Do (Important but not blocking)

7. **Add `numberFormat`** field for South Asian vs international grouping
8. **Workspace Settings UI** — add currency, calendar system, dual-date controls
9. **Wire Academics** to consume resolved settings for date display

### Defer (Post-MVP)

10. School-level settings override UI
11. Full i18n / Nepali language translation
12. School timezone-aware timestamp formatting
13. Consolidate duplicate BS conversion libraries
14. People/HR module date formatting
