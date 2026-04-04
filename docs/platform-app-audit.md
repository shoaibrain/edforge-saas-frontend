# EdForge Platform App Audit — Tenant-Facing Experience

**Date:** 2026-03-22
**Scope:** `/Users/shoaibrain/edforge/edforge-saas-frontend/`
**Purpose:** Read-only audit of the first login experience, tenant settings, module guards, currency/calendar/timezone consumption.

---

## 5. First Login Experience

### A. Authentication

**System:** AWS Cognito via AWS Amplify v6 (`@edforge/auth` package)
**Config:** `packages/auth/src/config.ts` — requires `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`, `VITE_COGNITO_DOMAIN`, `VITE_COGNITO_REGION`
**Flow:** PKCE Authorization Code flow (`responseType: 'code'`)

**Force password change:** YES — handled by Cognito challenge `CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED`.
- **File:** `apps/shell/src/components/layout/LoginPage.tsx`
- Login calls `signInDirect(email, password)` from `@edforge/auth`
- Cognito returns `CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED` challenge for first-time users with temporary passwords
- After password change, user is authenticated and redirected to `/home`

**Auth Store:** `apps/shell/src/stores/auth.store.ts`
- State: `user`, `isAuthenticated`, `isLoading`, `tenantName` (from Cognito custom claim), `tenantTier` (from Cognito custom claim)
- Persisted via Zustand + cookie storage
- `initializeAuth()` called on app load and after OAuth callback

### B. First Landing Page

**After authentication, user lands at:** `/home` (via `navigate('/home')` in OAuth callback handler, `apps/shell/src/router.tsx` line 229)

**Onboarding wizard:** PARTIAL — not mandatory.

- **File:** `apps/shell/src/components/settings/OrgSetupOnboarding.tsx`
- Purpose: Guides new tenants through SEA → LEA → School setup
- Steps: (1) Set Up State Education Agency, (2) Create First LEA/District, (3) Assign Schools
- **Trigger:** Shows when no SEA and no LEAs exist
- **Dismissible:** Yes — stored in `localStorage` key `edforge-org-onboarding-dismissed`
- **Location:** Displayed within Settings → Organization page, NOT on first login or home page
- **Not blocking:** User can navigate freely without completing onboarding

**What new tenant admin sees on `/home`:**
- **File:** `apps/shell/src/pages/HomePage.tsx` (lines 1-83)
- Role-aware dashboard: Admin → `AdminCommandCenter`, Teacher → `TeacherDashboard`, Student → `StudentDashboard`, Other → `QuickActionsWidget`
- `AdminCommandCenter` (`apps/shell/src/components/home/AdminCommandCenter.tsx`) renders KPI cards, charts, alerts, quick actions
- With no schools/data created, KPI cards likely show zeros or empty states (depends on API responses)
- No guards preventing access to empty dashboard

**Empty state behavior for new tenant:**
- No schools → Quick actions and KPI cards render with zero/empty data
- No academic year → Not checked on home page
- No students → KPI counts show 0
- No explicit "Get Started" wizard on the home page itself

### C. Home/Dashboard Page

**File:** `apps/shell/src/pages/HomePage.tsx`

**API calls on initial load** (via `apps/shell/src/lib/shell-context.tsx` ShellProvider):

| Query Key | Endpoint | Purpose |
|-----------|----------|---------|
| `['userProfile']` | `GET /users/me` | Fetch current user profile + assignments |
| `['tenant', tenantId]` | `GET /tenants/{tenantId}` | Fetch tenant data |
| `['schools', tenantId]` | `GET /tenants/{tenantId}/schools` | Fetch all schools |
| `['currentAcademicYear', schoolId]` | `GET /schools/{schoolId}/academic-years/current` | Fetch active academic year |
| `['workspaceSettings', tenantId]` | `GET /tenants/{tenantId}/settings` | Fetch workspace settings |
| `['schoolConfiguration', schoolId]` | `GET /schools/{schoolId}/configuration` | Fetch school config |

**Service file:** `apps/shell/src/services/tenant.service.ts`

**If no schools created:** Schools query returns empty array. `activeSchoolId` will be null. Modules that depend on school context will have no school selected.

**If no academic year:** Academic year query returns null/404. Finance and Academics modules receive no academic year context.

---

## 6. Tenant Settings Initialization on First Login

### How tenant settings are fetched

**API Call:** `GET /tenants/{tenantId}/settings`
**Service method:** `getWorkspaceSettings(tenantId)` in `apps/shell/src/services/tenant.service.ts` (lines 237-239)

**Response shape** (from `packages/types/src/tenant.ts` lines 135-165):
```typescript
interface WorkspaceSettings {
  tenantId: string
  regional: {
    defaultTimezone: string           // e.g. "America/New_York"
    defaultLocale: string             // e.g. "en-US"
    defaultDateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
    defaultTimeFormat: '12h' | '24h'
    defaultWeekStartsOn: 'sunday' | 'monday'
    defaultCurrency: string           // e.g. "USD"
    defaultCalendarSystem: 'gregorian' | 'bikram_sambat'
    enableDualDateDisplay: boolean
    defaultNumberFormat: 'south_asian' | 'international'
  }
  branding: {
    organizationName: string
    logoUrl?: string
    primaryColor?: string
    accentColor?: string
  }
  policies: {
    defaultAttendancePolicy: 'daily' | 'period' | 'both'
  }
  isLocked: boolean
  lockReason?: string
  createdAt: string
  updatedAt: string
}
```

### Brand new tenant defaults

Backend creates workspace settings lazily on first access with these defaults (from `server/application/microservices/identity/src/common/entities/workspace-settings.entity.ts` lines 60-95):

| Field | Default | Nepal needs |
|-------|---------|-------------|
| `defaultTimezone` | `America/New_York` | `Asia/Kathmandu` |
| `defaultLocale` | `en-US` | `ne-NP` or `en-US` |
| `defaultDateFormat` | `MM/DD/YYYY` | `DD/MM/YYYY` |
| `defaultTimeFormat` | `12h` | `12h` |
| `defaultWeekStartsOn` | `sunday` | `sunday` |
| `defaultCurrency` | `USD` | `NPR` |
| `defaultCalendarSystem` | `gregorian` | `bikram_sambat` |
| `enableDualDateDisplay` | `false` | `true` |
| `defaultNumberFormat` | `international` | `south_asian` |

### How the app handles missing/null settings

**File:** `apps/shell/src/hooks/useResolvedSettings.ts`

Precedence chain (implemented with `??` nullish coalescing):
```
School Configuration → School Entity → Workspace Settings → SYSTEM_DEFAULTS
```

**SYSTEM_DEFAULTS** (from `packages/config/src/resolved-settings.ts` lines 28-38):
```typescript
{
  currency: 'USD',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  calendarSystem: 'gregorian',
  enableDualDateDisplay: false,
  numberFormat: 'international',
  locale: 'en-US',
  weekStartsOn: 'sunday',
}
```

**Behavior:** The app never breaks from missing settings. It falls through the precedence chain to US-centric defaults. A Nepal tenant with unconfigured workspace settings will see USD currency, Gregorian calendar, UTC timezone.

---

## 7. Module Guard Rails

### Finance Module

**Layout:** `apps/finance/src/layouts/FinanceLayout.tsx` (lines 1-165)
- **School setup check:** NO
- **Academic year check:** NO
- **Guards:** Error boundary only (`FinanceErrorBoundary` lines 40-114) + school context sync
- **With no schools:** Renders normally. Finance overview attempts to fetch data; likely shows empty/zero states depending on API error handling
- **With no academic year:** Renders normally — Finance doesn't require academic year

### Academics Module

**Layout:** `apps/academics/src/layouts/AcademicsLayout.tsx` (lines 1-79)
- **School setup check:** YES — hard gate at lines 71-74:
  ```typescript
  if (schoolStatus === 'setup') {
    return <SchoolSetupGate />
  }
  ```
  Shows message: "School is in setup mode. Complete setup and activate the school."
- **Academic year check:** NO
- **With no academic year:** Renders normally, likely empty states

### People Module

**Layout:** `apps/people/src/layouts/PeopleLayout.tsx` (lines 1-46)
- **School setup check:** NO
- **Academic year check:** NO
- **Guards:** School context sync only (lines 23-41)
- **With no schools:** Renders normally

### Settings Module

**Location:** In shell, not a separate MFE (`apps/shell/src/pages/SettingsPage.tsx`)
- **Guards:** Standard route-level auth protection only

### Summary

| Module | Auth Guard | School Setup Check | Academic Year Check | Empty State Handling |
|--------|-----------|-------------------|-------------------|---------------------|
| Finance | YES (route) | NO | NO | Error boundary only |
| Academics | YES (route) | YES (`schoolStatus === 'setup'`) | NO | SchoolSetupGate |
| People | YES (route) | NO | NO | None visible |
| Settings | YES (route) | NO | NO | OrgSetupOnboarding (dismissible) |

---

## 8. Academic Year & School Creation Flows

### School Creation

**Page:** `apps/shell/src/pages/settings/school-create.tsx` (lines 1-34) — wrapper for wizard
**Wizard:** `apps/shell/src/components/settings/school-wizard/SchoolWizard.tsx` (lines 1-220+)

**5-step wizard:**

| Step | Name | Required | Fields |
|------|------|----------|--------|
| 1 | School Identity | YES | name, shortName, schoolCode, schoolType, gradeRange |
| 2 | Location & Contact | Optional | address (street1/2, city, state, zip, country, wardNumber, municipality, district, province), phone, email, website, timezone, locale, calendarSystem |
| 3 | Organization | Optional | LocalEducationAgencyId (district assignment), principal |
| 4 | Ed-Fi Compliance | Optional | schoolCategories, gradeLevels, descriptors, classification |
| 5 | Review & Create | YES | Confirmation |

**Validation:** Zod schemas in `school-wizard.schemas.ts`

**Tenant settings inheritance:**
- `calendarSystem` field exists on school entity — can be set per school (defaults to `'gregorian'`)
- `timezone` field exists in Location step — defaults to `'America/Chicago'` (NOT inherited from workspace settings)
- `locale` field exists — defaults to `'en-US'`
- **Currency is NOT a school-level field** — only at workspace level

**API call:** `POST /schools` via `tenantService.createSchool(dto)`

**Prerequisite validation:** NO — schools can be created regardless of tenant configuration state.

### Academic Year Creation

**Page:** `apps/shell/src/pages/settings/school-academic-years.tsx` (lines 1-300+)
**Modal:** `CreateAcademicYearModal` (lines 193-240+)

**Fields:**
- Name (e.g. "2024-2025")
- Start Date
- End Date
- Term Structure ('semester' | 'trimester' | 'quarter')
- Auto-generated grading periods based on term structure

**Status lifecycle:** `planning` → `active` → `completed`

**API call:** `POST /schools/{schoolId}/academic-years` via `tenantService.createAcademicYear(schoolId, data)`

**Prerequisite validation:** NO — academic years can be created without checking:
- Whether school is fully configured
- Whether regional settings are set
- Whether the calendar system is configured

**BS date support in academic year creation:** NO — dates are standard date picker inputs (Gregorian). No BS date picker or BS→AD conversion in the creation form.

---

## 9. Currency & Calendar Consumption Audit

### Currency

#### formatCurrency infrastructure

**Hook:** `packages/types/src/use-currency.ts`
```typescript
export function useCurrency(settings: ResolvedSettings) {
  return useMemo(() => ({
    format: (amount: number, opts?) =>
      formatCurrency(amount, settings.currency, { decimals: opts?.decimals ?? 2 }),
    formatCompact: (amount: number) =>
      formatCurrency(amount, settings.currency, { compact: true }),
    formatShort: (amount: number) =>
      formatCurrency(amount, settings.currency, { short: true }),
  }), [settings.currency])
}
```
- Pre-binds `settings.currency` from resolved settings
- Delegates to `formatCurrency()` from `@aibrains/shared-types/utils/currency` (external package)
- Re-exported via `packages/types/src/format-currency.ts`

#### Finance module usage

`useCurrency()` is actively used in **27+ files** across Finance:

**Key files (grep results):**
- `apps/finance/src/routes/billing/accounts/index.tsx:36`
- `apps/finance/src/routes/billing/invoices/index.tsx:49`
- `apps/finance/src/routes/billing/invoices/$invoiceId.tsx:21`
- `apps/finance/src/routes/billing/payments/record.tsx:23`
- `apps/finance/src/routes/billing/payments/index.tsx:41`
- `apps/finance/src/routes/configuration/fee-structures.tsx:17`
- `apps/finance/src/components/configuration/FeeStructureList.tsx:10`
- `apps/finance/src/components/billing/BulkInvoiceForm.tsx:18`
- `apps/finance/src/components/overview-v2/RecentInvoicesCard.tsx:8`
- `apps/finance/src/components/overview-v2/CollectionPerformanceCard.tsx:12`
- `apps/finance/src/components/overview-v2/OverdueAlertBanner.tsx:10`
- `apps/finance/src/components/overview-v2/RecentPaymentsCard.tsx:9`
- `apps/finance/src/components/overview-v2/AgingReportCard.tsx:8`
- `apps/finance/src/components/overview-v2/BillingHealthCard.tsx:20`

**Status:** Currency display IS settings-driven via `useCurrency(resolvedSettings)`. If workspace settings have `defaultCurrency: 'NPR'`, Finance will display NPR. If not configured, falls back to `USD`.

#### Deprecated hardcoded functions

`packages/types/src/payment.ts` contains deprecated Nepal-specific functions:
- `formatNPR()` (lines 316-357) — marked `@deprecated`
- `formatNPRShort()` (lines 374-379) — marked `@deprecated`
- `formatNPRCompact()` (lines 363-371) — marked `@deprecated`

These hardcode South Asian number grouping with NPR. Usage should be migrated to `useCurrency()`.

#### Mock data

`test-utils/mocks/data.ts` — hardcoded `NPR` in 11 occurrences (lines 41, 59, 77, 95, 194, 218, 241, 261, 293)
`test-utils/mocks/handlers.ts` — `currency: 'NPR' as const` (line 118)

### Calendar / Date / Bikram Sambat

#### BS conversion utility

**File:** `packages/date-utils/src/converter.ts`

Functions:
| Function | Signature | Purpose |
|----------|-----------|---------|
| `adToBS(adDate)` | `Date \| string → BSDate` | AD to BS conversion (lines 44-87) |
| `bsToAD(bsDate)` | `BSDate → Date` | BS to AD conversion (lines 99-122) |
| `formatBSDate(bs)` | `BSDate → "YYYY/MM/DD"` | Standard format (lines 131-133) |
| `formatBSShort(bs)` | `BSDate → "MM/DD"` | Short format (lines 138-140) |
| `formatBSLong(bs, monthNames?)` | `BSDate → "MonthName DD, YYYY"` | Long format (lines 145-149) |
| `formatDate(date, opts)` | Calendar-aware wrapper | Respects `calendar: 'ad' \| 'bs'` option (lines 154-191) |
| `toBSString(isoDate)` | `string → "YYYY/MM/DD"` | Convenience (lines 200-202) |
| `toBSShort(isoDate)` | `string → "MM/DD"` | Short for charts (lines 207-209) |

Lookup table: `BS_MONTH_DAYS` in `packages/date-utils/src/constants.ts` (BS 2000-2090)
Reference epoch: BS 2000/01/01 = AD 1943/04/14
Test coverage: `packages/date-utils/src/converter.test.ts` (122+ lines)

#### useDateFormatter hook

**File:** `packages/date-utils/src/hooks/useDateFormatter.ts`

- Auto-selects calendar based on `i18n.language`: `ne` → BS, `en` → AD
- Supports explicit override via options: `{ calendar: 'bs' }` or `{ calendar: 'ad' }`
- Returns: `formatDate()`, `formatDateRange()`, `formatDual()`, `calendarSystem`, `monthNames`

#### Finance module date formatting — HARDCODED

**File:** `apps/finance/src/utils/format-date.ts`

```typescript
// formatDate — hardcoded to en-GB (DD/MM/YYYY)
export function formatDate(dateStr) {
  return date.toLocaleDateString('en-GB')  // HARDCODED
}

// formatDateTime — hardcoded to en-GB
export function formatDateTime(dateStr) {
  return `${date.toLocaleDateString('en-GB')} ${date.toLocaleTimeString('en-GB', ...)}`
}

// formatDateDual — ALWAYS shows dual AD + BS, ignores enableDualDateDisplay setting
export function formatDateDual(dateStr) {
  const adStr = date.toLocaleDateString('en-GB')
  const bsStr = toBSString(dateStr)
  return `${adStr} (BS: ${bsStr})`  // ALWAYS dual
}
```

**Critical findings:**
1. `formatDate()` uses `en-GB` locale — does NOT respect `settings.dateFormat` or `settings.locale`
2. `formatDateDual()` ALWAYS shows BS dates — does NOT check `settings.calendarSystem` or `settings.enableDualDateDisplay`
3. `formatDateTime()` hardcodes `en-GB` — does NOT respect timezone setting
4. Finance has its OWN date utilities that bypass the shared `useDateFormatter` hook

**Usage across Finance** (14+ files):
- `apps/finance/src/routes/billing/accounts/index.tsx:39,132,214,323,446`
- `apps/finance/src/components/billing/BulkInvoiceForm.tsx:41,671`
- `apps/finance/src/routes/billing/invoices/$invoiceId.tsx:23,215,229`
- `apps/finance/src/routes/billing/payments/record.tsx:25,140,443`
- `apps/finance/src/routes/billing/payments/index.tsx:43,141,143,321,323`

#### ResolvedSettings calendar fields

**File:** `packages/config/src/resolved-settings.ts`

| Field | Type | System Default |
|-------|------|----------------|
| `calendarSystem` | `'gregorian' \| 'bikram_sambat'` | `'gregorian'` |
| `enableDualDateDisplay` | `boolean` | `false` |

**Precedence in `useResolvedSettings.ts`:**
- `calendarSystem`: `school?.calendarSystem ?? ws?.defaultCalendarSystem ?? SYSTEM_DEFAULTS.calendarSystem`
- `enableDualDateDisplay`: `ws?.enableDualDateDisplay ?? SYSTEM_DEFAULTS.enableDualDateDisplay`

### Timezone

#### ResolvedSettings

| Field | Source Precedence | System Default |
|-------|-------------------|----------------|
| `timezone` | `schoolConfig.location.timezone → ws.defaultTimezone → 'UTC'` | `'UTC'` |

#### Finance module timezone usage

**NO active timezone conversion in Finance module.**

- `formatDate()` — uses `toLocaleDateString('en-GB')` which uses browser local timezone
- `formatDateTime()` — same, browser local timezone
- No `Intl.DateTimeFormat` with explicit timezone
- Timestamps are displayed in browser local time, not school/tenant timezone

**Grep results for "Asia/Kathmandu" in finance:** No matches.
**Grep results for "timezone" in finance:** No references to timezone conversion.

#### FullCalendar integration

`docs/calendar-polish-sprints.md` documents that timezone/locale/firstDay are NOT passed to FullCalendar. This is documented as a Sprint 4 TODO, not yet implemented.

### Locale / Number Format

**i18n config:** `packages/i18n/src/config.ts`
- Supported languages: `['en', 'ne']`
- Detection: localStorage (`edforge-language`) → browser navigator
- Fallback: `'en'`

**Number format in ResolvedSettings:**
- Field: `numberFormat: 'south_asian' | 'international'`
- Default: `'international'`
- Consumed by `useCurrency()` hook (pre-bound in format functions)

**Locale propagation:**
```
Workspace Settings (defaultLocale) → Shell Context → useResolvedSettings() →
  resolvedSettings.locale → Finance/MFEs via FinanceSettingsContext
i18n.language (separate user preference) → useDateFormatter() auto-selects calendar
```

---

## Implementation Status Summary

| Feature | Shell/Config | Finance | Academics |
|---------|-------------|---------|-----------|
| Currency resolution | Resolves + broadcasts | ACTIVE via `useCurrency()` | Not checked |
| Calendar system resolution | Resolves + broadcasts | HARDCODED (always dual BS) | Via `useDateFormatter()` |
| Timezone resolution | Resolves + broadcasts | NOT USED (browser local) | Not checked |
| Locale resolution | Resolves + broadcasts | HARDCODED (`en-GB`) | Via `useTranslation()` |
| Number format resolution | Resolves + broadcasts | Via `useCurrency()` (assumed) | N/A |
| Dual date display setting | Resolves + broadcasts | IGNORED (always on) | Follows `calendarSystem` |
