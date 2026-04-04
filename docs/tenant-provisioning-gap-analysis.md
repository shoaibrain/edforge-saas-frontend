# Tenant Provisioning Gap Analysis

**Date:** 2026-03-22
**Scope:** AdminWeb (`client/AdminWeb/`) + EdForge Platform App (`edforge-saas-frontend/`) + Backend (`server/`)
**Purpose:** Identify gaps between current implementation and Nepal MVP requirements.

---

## Gap Analysis Table

| Gap ID | Description | Location | Severity | Blocks Nepal MVP? |
|--------|-------------|----------|----------|-------------------|
| G-01 | Tenant creation form missing country/currency/calendarSystem/timezone/locale/numberFormat fields | `client/AdminWeb/src/pages/Tenants/TenantCreate.tsx` — FormData interface has only 6 fields (name, email, tier, federation, ec2, rproxy). No regional fields exist in form, state, validation, or API payload. | HIGH | YES |
| G-02 | Tenant provisioning automation does not seed regional settings at creation time. Workspace settings are created lazily on first access with US-centric defaults (USD, America/New_York, gregorian, en-US, international). | `server/application/microservices/identity/src/common/entities/workspace-settings.entity.ts` lines 60-95 — `createDefaultWorkspaceSettings()` hardcodes US defaults. Provisioning script (`server/lib/provision-scripts/provision-tenant.sh`) does not pass regional params. | HIGH | YES |
| G-03 | Brand new tenant `GET /tenants/{tenantId}/settings` returns US defaults: `{ defaultCurrency: "USD", defaultTimezone: "America/New_York", defaultCalendarSystem: "gregorian", defaultLocale: "en-US", defaultNumberFormat: "international", enableDualDateDisplay: false }`. No way to set these during provisioning. | Backend entity defaults + frontend `SYSTEM_DEFAULTS` in `packages/config/src/resolved-settings.ts` lines 28-38. Shell hook in `apps/shell/src/hooks/useResolvedSettings.ts`. | HIGH | YES |
| G-04 | Currency in Finance module IS settings-driven via `useCurrency(resolvedSettings)`. This works correctly IF workspace settings have `defaultCurrency: 'NPR'`. Gap: workspace settings default to USD, so Finance shows USD until admin manually changes settings. | `packages/types/src/use-currency.ts` (hook), `apps/finance/src/layouts/FinanceLayout.tsx` (context provider). Currency display is correct once settings are configured. | MEDIUM | YES — but fixable by configuring settings |
| G-05 | BS date display in Finance is HARDCODED in `formatDateDual()` — always shows dual "DD/MM/YYYY (BS: YYYY/MM/DD)" regardless of `calendarSystem` or `enableDualDateDisplay` settings. Real BS conversion exists via `@edforge/date-utils` `toBSString()`. Not mock data — real AD→BS conversion using lookup table (BS 2000-2090). | `apps/finance/src/utils/format-date.ts` lines 36-47 — `formatDateDual()` always appends BS. Does not check `resolvedSettings.calendarSystem` or `resolvedSettings.enableDualDateDisplay`. | MEDIUM | Partially — works for Nepal but breaks for non-Nepal tenants |
| G-06 | Timezone in timestamps — displayed in browser local time, NOT converted to tenant/school timezone. Finance uses `toLocaleDateString('en-GB')` and `toLocaleTimeString('en-GB')` without explicit timezone parameter. `resolvedSettings.timezone` is resolved but never consumed by Finance date utilities. | `apps/finance/src/utils/format-date.ts` lines 15-30 — `formatDate()` and `formatDateTime()` use browser timezone. No `timeZone` option passed to `toLocaleDateString()`. | MEDIUM | YES — Nepal is UTC+5:45, timestamps will show wrong if browser is in different timezone |
| G-07 | First-login experience has no mandatory onboarding flow. Admin lands on role-aware dashboard (`AdminCommandCenter`). An optional, dismissible `OrgSetupOnboarding` component exists in Settings → Organization but is not shown on first login and not blocking. No prompt to configure regional settings. | `apps/shell/src/pages/HomePage.tsx` — dashboard only. `apps/shell/src/components/settings/OrgSetupOnboarding.tsx` — optional, in settings, dismissible via localStorage. | HIGH | YES — Nepal admin must know to navigate to Settings → Workspace to configure NPR/BS/timezone |
| G-08 | Module guards are minimal. Only Academics checks `schoolStatus === 'setup'`. Finance and People have NO guards. User can navigate to Finance with no schools, no academic year, no configuration. | `apps/finance/src/layouts/FinanceLayout.tsx` — no guards. `apps/academics/src/layouts/AcademicsLayout.tsx` lines 71-74 — only guard. `apps/people/src/layouts/PeopleLayout.tsx` — no guards. | MEDIUM | NO — but poor UX for new tenants |
| G-09 | School creation wizard has `calendarSystem` field (Location step) but defaults to `'gregorian'` and does NOT inherit from tenant workspace settings. Timezone defaults to `'America/Chicago'`. Currency is not a school-level field. | `apps/shell/src/components/settings/school-wizard/SchoolWizard.tsx` — defaults in `school-wizard.utils.ts`. | MEDIUM | YES — Nepal school will be created with wrong defaults unless admin manually changes them |
| G-10 | Academic year creation uses standard Gregorian date pickers. No BS date picker. No BS↔AD conversion in the creation form. If tenant uses Bikram Sambat calendar, admin must mentally convert dates. | `apps/shell/src/pages/settings/school-academic-years.tsx` — `CreateAcademicYearModal` uses standard date inputs. | HIGH | YES — Nepal academic year is 2082 BS, form only accepts Gregorian dates |
| G-11 | AdminWeb has no tenant edit page. After creation, admin cannot update any tenant settings (regional or otherwise) from AdminWeb. Must use platform app directly. | `client/AdminWeb/src/pages/Tenants/TenantDetail.tsx` — read-only with delete only. No edit form, no PATCH endpoint called. | MEDIUM | YES — SaaS admin cannot fix wrong defaults for tenant |
| G-12 | Finance `formatDate()` and `formatDateTime()` hardcode `en-GB` locale, ignoring `resolvedSettings.dateFormat` and `resolvedSettings.locale`. Finance has its own date utilities that bypass shared `useDateFormatter` hook from `@edforge/date-utils`. | `apps/finance/src/utils/format-date.ts` lines 19, 29 — hardcoded `'en-GB'`. Shared hook at `packages/date-utils/src/hooks/useDateFormatter.ts` is not used by Finance. | LOW | NO — DD/MM/YYYY is acceptable for Nepal, but settings are being ignored |
| G-13 | Invitation email template is hardcoded English, no localization. No onboarding instructions beyond "change your password". No prompt to configure regional settings or create schools. | `server/lib/tenant-template/identity-provider.ts` lines 59-73 — template baked into CDK deployment. | LOW | NO — but poor experience for Nepal admin receiving English-only email |
| G-14 | Deprecated `formatNPR*` functions still exist in `packages/types/src/payment.ts` alongside new `useCurrency()`. Dual code paths create confusion. | `packages/types/src/payment.ts` lines 316-379 — `formatNPR()`, `formatNPRShort()`, `formatNPRCompact()` marked `@deprecated`. | LOW | NO — deprecated functions are being replaced |
| G-15 | Workspace Settings page exists in platform app (`/settings/workspace`) allowing tenant admin to update regional settings. However, there is no indication that this MUST be done first, and no validation that it has been configured before other operations proceed. | `apps/shell/src/pages/settings/WorkspaceSettingsPage` (referenced in router). Settings can be changed but nothing enforces it. | MEDIUM | YES — settings page exists but admin may never find or use it |

---

## What Works End-to-End Today

1. **Tenant creation + infrastructure provisioning:** AdminWeb form → SBT → CDK → DynamoDB + Cognito + ECS services + routing. This pipeline works.

2. **Admin invitation email:** Cognito sends email with temporary password. Admin can log in and change password. Auth flow works end-to-end.

3. **Currency display in Finance (when configured):** `useCurrency(resolvedSettings)` hook correctly reads `settings.currency` and formats amounts. If workspace settings have `defaultCurrency: 'NPR'`, Finance shows NPR with South Asian grouping. The infrastructure is in place.

4. **BS date conversion utility:** `@edforge/date-utils` package has working AD↔BS conversion with lookup table (BS 2000-2090), tested. `toBSString()` is actively called from Finance `formatDateDual()`.

5. **Settings resolution chain:** `useResolvedSettings()` correctly implements School Config → School → Workspace → System Defaults precedence. Shell broadcasts resolved settings to MFEs via `school-context-channel`.

6. **i18n infrastructure:** `packages/i18n` supports English and Nepali with browser detection and localStorage persistence. Devanagari font injection works for `ne` locale.

---

## What Is Half-Baked (Infrastructure Exists but Not Fully Wired)

1. **Workspace settings exist but start wrong:** The data model supports all needed fields (currency, calendarSystem, timezone, locale, numberFormat). Backend can store and return them. But defaults are US-centric and there's no prompt to configure them. Admin must discover Settings → Workspace on their own.

2. **Finance dates always show BS:** `formatDateDual()` always appends BS dates, ignoring `enableDualDateDisplay` and `calendarSystem` settings. This accidentally works for Nepal but would break for US tenants. The shared `useDateFormatter` hook that respects settings is NOT used by Finance.

3. **School creation has regional fields but wrong defaults:** The school wizard has `calendarSystem`, `timezone`, and `locale` fields. But they default to US values and don't inherit from workspace settings. Admin must manually set each one.

4. **Timezone is resolved but never consumed:** `useResolvedSettings()` correctly resolves timezone from school config or workspace settings. But Finance (and likely other modules) never pass this timezone to date formatting functions. Timestamps render in browser local time.

5. **Number format field exists but consumption is opaque:** `numberFormat: 'south_asian' | 'international'` is in ResolvedSettings and presumably consumed by `formatCurrency()` in the external `@aibrains/shared-types` package, but the actual consumption is not visible in frontend code.

---

## What Is Completely Missing

1. **Regional settings in AdminWeb tenant creation form:** No fields, no API payload, no backend parameter passing. Cannot set country, currency, calendar, timezone at tenant creation time.

2. **AdminWeb tenant edit capability:** No edit page, no settings management from the SaaS admin console. Admin console is create-only + delete.

3. **Mandatory first-login onboarding:** No wizard, no checklist, no blocking flow that ensures workspace settings are configured before admin starts using the system. OrgSetupOnboarding exists but is optional, dismissible, and only covers organizational structure (SEA/LEA/School), not regional settings.

4. **Academic year BS date support:** Academic year creation form uses Gregorian date pickers only. No BS date picker component. Nepal academic years (2082, 2083 BS) cannot be entered natively.

5. **Module prerequisite guards:** Finance and People have no guards preventing access in unconfigured state. No check for "has workspace settings been configured?", "does a school exist?", or "is there an active academic year?".

6. **Timezone-aware timestamp display:** No place in the codebase converts UTC timestamps to the tenant's timezone for display. All date/time formatting uses browser local time.

---

## Minimum Required Changes for Nepal MVP

These are the bare minimum changes needed for a Nepal school to use EdForge end-to-end. Listed in dependency order:

1. **Backend: Accept regional settings during tenant creation** — Modify the provisioning API to accept country/currency/calendarSystem/timezone/locale/numberFormat and pass them to `createDefaultWorkspaceSettings()` instead of US defaults.

2. **AdminWeb: Add regional fields to tenant creation form** — Add country, currency (dropdown with NPR), calendarSystem (gregorian/bikram_sambat), timezone (Asia/Kathmandu), locale (en-US/ne-NP) fields to TenantCreate.tsx and include them in the API payload.

3. **Platform: Add mandatory workspace settings check** — On first login (or when settings have US defaults for a non-US tenant), show a blocking prompt to review and confirm regional settings before proceeding.

4. **Finance: Wire date formatting to resolved settings** — Replace hardcoded `formatDate()`/`formatDateDual()` with calls that respect `resolvedSettings.calendarSystem`, `resolvedSettings.enableDualDateDisplay`, and `resolvedSettings.dateFormat`.

5. **Finance: Add timezone to timestamp formatting** — Pass `resolvedSettings.timezone` to `toLocaleDateString()` / `toLocaleTimeString()` via `timeZone` option.

6. **School wizard: Inherit workspace settings** — Pre-populate calendarSystem, timezone, locale from workspace settings when creating a new school.

7. **Academic year: Add BS date support** — Either add a BS date picker or add BS↔AD conversion helpers to the academic year creation form so Nepal admins can enter BS dates.
