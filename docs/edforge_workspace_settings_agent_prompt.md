# EdForge — Workspace Settings & Tenant Context Enforcement
## Agent Prompt: Full System Review → Sprint Plan

---

## WHO YOU ARE

You are a senior full-stack engineer and product lead on EdForge — a next-generation multi-tenant
enterprise EMIS platform. You are responsible for identifying exactly why Workspace Settings are
half-baked today, and delivering a complete, tested, demoable end-to-end implementation.

You have two mandatory phases before writing any code:
**PHASE 1 — Deep System Audit** → **Sub-Agent Review** → **PHASE 2 — Sprint Plan**

Do not write a single line of implementation code until the sub-agent has reviewed and approved
your sprint plan.

---

## WHAT YOU KNOW GOING IN (read this before touching anything)

### The Core Problem

The tenant settings API returns this:

```json
GET /api/tenants/3909d28b-d3b8-4a45-8f3d-595a422a6e82/settings
{
  "regional": {
    "defaultLocale": "en-US",
    "defaultWeekStartsOn": "sunday",
    "defaultDateFormat": "YYYY-MM-DD",
    "defaultTimeFormat": "12h",
    "defaultTimezone": "America/Chicago"
  }
}
```

The school-level API returns this for a Nepalese school:

```json
GET /api/schools/45eaa374-824e-4704-8b49-6866657f6f66
{
  "timezone": "Asia/Kathmandu",
  "locale": "ne-NP",
  "calendarSystem": "bikram_sambat",
  "academicCalendarType": "annual"
}
```

And the school configuration API returns:

```json
GET /api/schools/45eaa374-824e-4704-8b49-6866657f6f66/configuration
{
  "timezone": "Asia/Kathmandu",
  "locale": "ne-NP",
  "dateFormat": "YYYY/MM/DD",
  "timeFormat": "24h"
}
```

**The Finance module shows NPR amounts but the tenant settings have no `currency` field at all.**
**The school records have `calendarSystem: "bikram_sambat"` but no consuming module reads it.**
**Workspace Settings UI saves to the tenant API but no frontend module reads from it.**

This means:
- Settings are being saved into a void — nothing listens to them
- Currency, calendar system, and BS date formatting are disconnected from the settings layer
- The school-level override chain exists in the data model but the frontend is completely deaf to it
- The React app has no concept of a "resolved settings context" — modules hardcode or guess

### What the Data Model Already Tells You

The architecture is already correct and enterprise-grade at the data layer:

```
Tenant Settings  →  School Settings  →  School Configuration
(org defaults)       (school overrides)   (operational config)
```

Precedence chain should be:
  School Configuration → School Settings → Tenant Settings → System Defaults

This is already implied by the data. It just isn't wired in the frontend.

### What Is Missing from the Data Model (gaps you must flag)

1. `currency` — not present in tenant settings OR school settings. Finance module is showing NPR
   but there is no settings field driving it. This is hardcoded somewhere. Find it. Fix it.

2. `calendarSystem` — present on school record (`bikram_sambat`) but absent from tenant settings.
   Tenant-level calendar system preference has no field to be set. Workspace Settings UI has no
   calendar system control.

3. `enableBSCalendar` / `bsDateDisplay` — no field exists anywhere for whether to show dual
   dates (Gregorian + BS) in finance tables. This is a critical Nepal MVP requirement.

4. `numberFormat` — South Asian formatting (1,00,000) vs international (100,000) — no field exists.

5. The Workspace Settings UI renders fields for `timezone`, `dateFormat`, `timeFormat`,
   `weekStartsOn`, `language` — but the tenant settings response field names are:
   `defaultTimezone`, `defaultDateFormat`, `defaultTimeFormat`, `defaultWeekStartsOn`,
   `defaultLocale`. The UI field names and API field names must be verified to match exactly.
   A mismatch here would cause settings to save but never be read back correctly.

---

## PHASE 1 — DEEP SYSTEM AUDIT

### Step 1 — Read these files first

```
apps/settings/src/pages/WorkspaceSettings.tsx
apps/settings/src/pages/Organization.tsx
apps/settings/src/hooks/useWorkspaceSettings.ts  (if exists)
apps/settings/src/hooks/useTenantSettings.ts     (if exists)

packages/@edforge/context/src/                   (entire directory)
packages/@edforge/hooks/src/                     (entire directory)
packages/@edforge/ui/src/                        (look for any settings-aware components)

apps/finance/src/                                (entire directory — how does it get currency?)
apps/finance/src/hooks/useFormatCurrency.ts      (if exists)
apps/finance/src/utils/currency.ts               (if exists)
apps/finance/src/utils/formatDate.ts             (if exists)

apps/academics/src/utils/                        (any date formatting utilities)
apps/people/src/utils/                           (any locale-aware utilities)

lib/tenant-context/                              (if exists anywhere)
lib/school-context/                              (if exists anywhere)
```

### Step 2 — Answer these specific audit questions in writing

**A. Settings Save Path (Workspace Settings UI → API)**

- When a user changes "Default Timezone" in Workspace Settings and clicks Save, what exact
  API call is made? What is the request body? Does the field name match the API response schema
  (`defaultTimezone` not `timezone`)?
- Is there optimistic update, loading state, and error handling on the save?
- Does the UI re-read from API after save, or does it trust local state?

**B. Settings Read Path (API → React Context → Consuming Modules)**

- Is there a React Context, Zustand store, or React Query cache that holds tenant settings
  after they are fetched?
- When Finance Overview mounts, does it read currency from tenant settings? From school
  configuration? From a hardcoded constant? Trace this exactly.
- When a date is displayed in the Finance Payments table (e.g. "18/03/2026" + "BS: 2082/12/05"),
  where does the BS date come from? Is there a conversion utility? Is it hardcoded mock data?
- When the Finance module shows "NPR", where does that string come from? Grep for "NPR" across
  all source files and report every location.

**C. School Context vs Tenant Context**

- When a user is logged in and viewing Westfield High School (schoolId: d5adb754),
  does the app know which school is active? Is there a `useActiveSchool()` hook or similar?
- Does the app fetch school configuration (`/api/schools/:id/configuration`) on school switch?
- Is the school's `calendarSystem: "bikram_sambat"` ever read by any component?
- Is the school's `timezone: "Asia/Kathmandu"` ever used to format timestamps anywhere?

**D. The Gaps — exact locations**

For each gap below, find the exact file and line where the gap exists, or confirm the gap
is a missing file entirely:

| Gap | Expected Location | Finding |
|-----|-------------------|---------|
| `currency` field missing from tenant settings | `/api/tenants/:id/settings` response | ? |
| `calendarSystem` missing from tenant settings | `/api/tenants/:id/settings` regional block | ? |
| `enableBSCalendar` / dual-date flag missing | tenant settings OR school configuration | ? |
| `numberFormat` field missing | tenant settings regional block | ? |
| No resolved settings context in React | packages/@edforge/context | ? |
| Currency hardcoded in Finance | apps/finance/src/utils or constants | ? |
| BS date conversion utility | apps/finance/src/utils or shared lib | ? |
| Workspace Settings UI field/API name mismatch | apps/settings/src/pages/WorkspaceSettings.tsx | ? |

### Step 3 — Write the Audit Report

Write `docs/workspace-settings-audit.md` with:

1. **Settings Save Path** — what works, what is broken, exact file references
2. **Settings Read Path** — what is wired, what is hardcoded, what is missing
3. **Data Model Gaps** — the 5 missing fields listed above, confirmed or denied with evidence
4. **School Context Gaps** — whether the app knows the active school's configuration at runtime
5. **Risk Assessment** — for each gap: Low / Medium / High impact on Nepal MVP
6. **Recommended Scope for MVP** — which gaps are blocking, which can be deferred

---

## SUB-AGENT REVIEW GATE — MANDATORY

After writing the audit report and sprint plan, stop completely.

Invoke the sub-agent with this exact prompt:

```
You are a senior product engineer and technical lead reviewing a sprint plan for EdForge.

Read these files in full:
  1. docs/workspace-settings-audit.md
  2. docs/workspace-settings-sprint.md

You are reviewing for the following:

PRODUCT CORRECTNESS
□ Does the plan close the gap between "settings saved" and "settings applied"?
  i.e. after a user sets NPR + Kathmandu + bikram_sambat in Workspace Settings,
  do Finance amounts show NPR, do dates show BS format, do timestamps use NST?
□ Is currency handled end-to-end — API field, settings UI, Finance module consumption?
□ Is calendarSystem handled end-to-end — API field, settings UI, dual-date display in Finance?
□ Is the Nepal MVP requirement completable with these sprints alone, without future sprints?
□ Is language/localization correctly scoped as a USER preference, not an org rule?
  (Language changing in UI is not a blocker for MVP — flag if the plan mixes this up)

TECHNICAL CORRECTNESS
□ Is there a single resolved settings context (hook or store) that consuming modules read from?
  There must be exactly one source of truth — not Finance fetching its own settings,
  Academics fetching its own settings, etc. separately.
□ Does the precedence chain work correctly:
  School Configuration → School Settings → Tenant Settings → System Default
□ Are the API field names consistent? (defaultTimezone vs timezone — must be verified)
□ Is the BS calendar conversion handled by a shared utility, not inline in each component?
□ Is currency formatting handled by a shared utility (formatCurrency(amount, currency)) 
  used everywhere — not duplicated per module?
□ Does each sprint produce demoable, runnable software that builds on the previous sprint?
□ Is every task atomic — one commit, one concern, one test?
□ Are there tests or explicit validation criteria for every task?

MVP SCOPE DISCIPLINE
□ Does the plan avoid over-engineering for the 20-50 Nepal pilot schools use case?
□ School-level overrides: are they deferred correctly, or included unnecessarily in MVP scope?
□ Language/i18n full implementation: correctly deferred to post-MVP?
□ Payment gateway configuration (eSewa/Khalti): is it scoped separately from regional settings?

Produce a REVIEW REPORT saved to docs/workspace-settings-subagent-review.md:
  - APPROVED items (no changes needed)
  - FLAG items (blocking — must fix before implementation, with exact file and correction)
  - SUGGESTIONS (non-blocking improvements)
  - Final verdict: APPROVED TO IMPLEMENT or CHANGES REQUIRED

If CHANGES REQUIRED: list every required change. Primary agent revises the sprint plan
and resubmits. Do not proceed until verdict is APPROVED TO IMPLEMENT.
```

---

## PHASE 2 — SPRINT PLAN

After the audit is complete, write `docs/workspace-settings-sprint.md` following this structure.

Every sprint must produce **demoable, runnable software** that builds on previous sprints.
Every task must be **atomic** — one commit, one concern, one clear validation criterion.
Every task must have **tests or an explicit alternative validation** (e.g. API contract test,
visual smoke test checklist, or Postman collection step).

Structure each sprint as:

```
## Sprint N — [Goal]
**Demo:** What can be shown running at end of this sprint

### Task N.1 — [Title]
What: [one sentence]
Where: [exact file(s)]
Validation: [how to verify it worked]
```

---

### Sprint 0 — Data Model Completeness (Backend)

**Goal:** The API contracts are complete. Every setting the frontend needs exists in the API.
No frontend work can be correct if the data model is missing fields.

**Demo:** Postman collection hitting all settings endpoints returns complete, correct schemas.

Tasks must cover:

- Add `currency` field to tenant settings (`regional.defaultCurrency: "NPR" | "USD" | "EUR"`)
  including migration, validation, default value
- Add `calendarSystem` to tenant settings (`regional.calendarSystem: "gregorian" | "bikram_sambat"`)
- Add `enableDualDateDisplay` to tenant settings (boolean, default false for non-Nepal tenants)
- Add `numberFormat` to tenant settings (`regional.numberFormat: "south_asian" | "international"`)
- Verify field name consistency: all tenant settings regional fields use `default` prefix
  consistently (`defaultTimezone`, `defaultCurrency`, `defaultCalendarSystem`, etc.) OR
  remove the prefix and use flat names consistently. Pick one. Apply everywhere.
- Write API contract tests for GET and PATCH `/api/tenants/:id/settings` that validate
  every field is present, typed correctly, and has a sensible default

---

### Sprint 1 — Resolved Settings Context (Frontend Foundation)

**Goal:** A single React hook exists that any module can call to get the active resolved
settings for the current school/tenant. No module should fetch settings independently.

**Demo:** Open browser console on Finance Overview. Call `window.__edforgeSettings` (a debug
export). It returns resolved settings with currency, timezone, calendarSystem, dateFormat.
Changing Workspace Settings and refreshing shows the new values.

Tasks must cover:

- Create `packages/@edforge/context/src/TenantSettingsContext.tsx`
  Fetches `/api/tenants/:id/settings` once on app load, stores in context
  Provides: `useTenantSettings()` hook returning the full regional settings object

- Create `packages/@edforge/context/src/useResolvedSettings.ts`
  This is the precedence resolver. Takes school configuration (if active school known) and
  tenant settings. Returns a single flat resolved object:
  ```typescript
  {
    currency: string,          // "NPR" | "USD" etc
    timezone: string,          // "Asia/Kathmandu" etc
    dateFormat: string,        // "YYYY-MM-DD" etc
    timeFormat: string,        // "12h" | "24h"
    calendarSystem: string,    // "gregorian" | "bikram_sambat"
    enableDualDateDisplay: boolean,
    numberFormat: string,      // "south_asian" | "international"
    locale: string,            // "en-US" | "ne-NP"
    weekStartsOn: string,
  }
  ```
  Precedence: schoolConfig → tenantSettings → systemDefault
  Validation: unit tests covering all precedence combinations

- Create `packages/@edforge/context/src/useActiveSchool.ts`
  Returns the currently active school ID and fetches school + school configuration
  Feeds into `useResolvedSettings` as the school-level input
  Validation: test that switching active school produces different resolved settings

- Export all three from `packages/@edforge/context/src/index.ts`

---

### Sprint 2 — Shared Formatting Utilities

**Goal:** Two shared utilities exist — `formatCurrency()` and `formatDate()` — that any module
can import and use. They read from resolved settings, not hardcoded values.
No module should format currency or dates with its own inline logic.

**Demo:** Open Finance Overview. Currency shows NPR formatting. Open a Nepalese school's
Finance Overview. Currency shows NPR with South Asian number grouping. Open a US school.
Currency shows USD with international number grouping. No code changes between views —
just the resolved settings change.

Tasks must cover:

- Audit and grep for every location where "NPR", "USD", "$", "Rs" appears in source code.
  Record every file. These are all the locations that need to be migrated to the utility.

- Create `packages/@edforge/utils/src/formatCurrency.ts`
  Signature: `formatCurrency(amount: number, settings: ResolvedSettings): string`
  Handles: NPR South Asian grouping (1,50,000), USD international (150,000), symbol placement
  Returns: "NPR 1,50,000" or "USD 1,500.00" depending on settings
  Validation: unit tests for NPR South Asian format, USD international format, edge cases (0, decimals, large numbers)

- Create `packages/@edforge/utils/src/formatDate.ts`
  Signature: `formatDate(date: Date | string, settings: ResolvedSettings, options?: { showBS?: boolean }): string`
  Handles: date format from settings, BS conversion when calendarSystem = "bikram_sambat"
  Returns: primary formatted date string
  Validation: unit tests for Gregorian format, BS conversion with known reference dates

- Create `packages/@edforge/utils/src/convertToBS.ts`
  Pure function: takes a Gregorian date, returns BS year/month/day
  Uses a lookup table or algorithm (verify the BS conversion algorithm against known Nepal
  calendar dates — this must be accurate, it is a compliance requirement)
  Validation: unit tests against 10+ known BS↔Gregorian reference date pairs

- Create `packages/@edforge/utils/src/formatDateTime.ts`
  Handles timezone-aware display: converts UTC timestamp to local time using settings.timezone
  Validation: unit tests for NST offset (UTC+5:45), CST offset, confirmed correct output

- Export all from `packages/@edforge/utils/src/index.ts`

---

### Sprint 3 — Workspace Settings UI Completeness

**Goal:** The Workspace Settings page is complete, correct, and saves every field that exists
in the API. The UI field names match the API field names exactly. Saving shows a success toast
and the new values are reflected immediately on revisit.

**Demo:** Go to Workspace Settings. Change currency to NPR, calendar to Bikram Sambat, enable
dual date display. Save. Reload page. All three values are still set. Network tab shows the
correct PATCH request body with correct field names.

Tasks must cover:

- Audit `WorkspaceSettings.tsx` field names against API response field names.
  Fix any mismatch between what the form sends and what the API expects.
  Validation: network tab shows correct field names on save

- Add missing fields to the Workspace Settings UI:
  - Default Currency (NPR | USD | EUR | GBP)
  - Calendar System (Gregorian | Bikram Sambat)
  - Enable Dual Date Display (toggle — show BS dates alongside Gregorian in finance tables)
  - Number Format (South Asian 1,00,000 | International 100,000)
  These are the 4 fields identified as missing from the data model (Sprint 0 adds them to API,
  this sprint adds them to the UI)

- Wire the Workspace Settings form to `useTenantSettings()` from Sprint 1 context.
  On mount: read values from context (not a fresh API call).
  On save: PATCH the API, then invalidate the context cache so all modules re-read.
  Validation: change a value, save, navigate to Finance — the change is reflected without reload

- Per-section save rows: Regional Settings section saves independently, Nepal Localization
  section saves independently, Currency section saves independently.
  Each has its own loading state and error handling.
  Validation: each section save button triggers only that section's fields in the PATCH body

---

### Sprint 4 — Finance Module Consumes Resolved Settings

**Goal:** Every currency amount and every date in the Finance module reads from resolved
settings. No hardcoded "NPR". No hardcoded date format. Switching between a Nepalese school
and a US school changes the formatting without any code change.

**Demo:** Log in. Navigate to Finance Overview for Westfield High School (US) → amounts show
USD format. Switch to Pragati Sishu Sadhan (Nepal) → amounts show NPR South Asian format.
Go to Finance Payments → dates show dual format (Gregorian + BS) for Nepal school, single
Gregorian for US school.

Tasks must cover:

- Replace every hardcoded currency string in `apps/finance/src/` with `formatCurrency(amount, resolvedSettings)`
  from Sprint 2 utility. Each replacement is a separate atomic commit per file.
  Files to cover at minimum: Finance Overview KPI tiles, Invoices table amount column,
  Payments table amount column, Student Accounts balance column, Fee Structures amount fields.
  Validation: grep for hardcoded "NPR" in apps/finance returns zero results after this task

- Replace every date formatting call in `apps/finance/src/` with `formatDate(date, resolvedSettings)`
  Files to cover: Invoices date column, Payments date column (both Gregorian and BS line),
  Student Accounts due date, any date filter chips.
  Validation: Nepal school Finance Payments table shows both "18/03/2026" and "BS: 2082/12/05"
  correctly. US school shows only "03/18/2026" (no BS line).

- Replace every timestamp formatting in `apps/finance/src/` with `formatDateTime(timestamp, resolvedSettings)`
  This fixes the known bug: "Yesterday 7:00 PM" on all payment records (timezone bug).
  Validation: payment timestamps show correct NST time for Nepal school, correct CST/EST for US school

- Wire `useResolvedSettings()` into the Finance module root component so it is available to
  all child components via context or prop drilling as appropriate.
  Validation: `useResolvedSettings()` is called once at the Finance module level, not inside
  each individual component

---

### Sprint 5 — Academics Module Consumes Resolved Settings

**Goal:** Academic calendar dates, attendance timestamps, and grade display respect the resolved
settings for the active school.

**Demo:** Navigate to Academics for Pragati Sishu Sadhan. Attendance dates show BS format.
Navigate to Academics for Westfield High School. Dates show MM/DD/YYYY. No code change — just
settings driving the difference.

Tasks must cover:

- Wire `useResolvedSettings()` into the Academics module root
- Replace date formatting in attendance records, enrollment dates, academic calendar display
- Replace date formatting in student profile dates (enrollment date, birth date display)
- Validate: Nepal school student list shows BS dates. US school shows Gregorian.

---

### Sprint 6 — Validation: End-to-End Nepal School Journey

**Goal:** One complete end-to-end user journey works without any hardcoded values.
This is the MVP acceptance test. Every piece from Sprint 0–5 is proven together.

**Demo:** A recorded walkthrough of this exact journey:

```
1. Org admin opens Workspace Settings
   → Sets: Currency = NPR, Calendar = Bikram Sambat, Dual Date = ON,
           Timezone = Asia/Kathmandu, Number Format = South Asian
   → Saves each section. Success toast appears.

2. Admin navigates to Finance Overview
   → KPI tiles show: "NPR 4.9L", "NPR 1.6L" — South Asian formatting confirmed

3. Admin opens Finance Payments
   → Each payment row shows: amount in NPR, date as "18/03/2026" with "BS: 2082/12/05" below
   → Timestamps show correct Nepal time (no "Yesterday 7:00 PM" bug)

4. Admin opens Invoices
   → Invoice due dates show both Gregorian and BS format
   → Invoice amounts are in NPR

5. Admin opens Academics → Students list
   → Enrollment dates show BS format

6. Admin changes Currency back to USD in Workspace Settings → saves
   → Returns to Finance Overview → amounts now show USD formatting
   → Confirms the setting is live, not cached

7. Repeat step 1-5 for a US school (Westfield High) with USD + Gregorian settings
   → Everything shows USD and Gregorian only
```

Tasks must cover:

- Write a test script / Playwright E2E spec covering steps 1-6 above
- Fix any failures found during the walkthrough
- Write `docs/nepal-mvp-validation-checklist.md` — a human-readable checklist that a QA
  engineer or pilot school admin can use to verify the feature is working
- Fix the "Auth Debug" page: confirm it is not visible in sidebar nav for any non-dev build.
  Validation: `NODE_ENV=production npm run build` → Auth Debug nav item absent from sidebar

---

## CONSTRAINTS — APPLY THROUGHOUT

**In-scope for this sprint plan:**
- Tenant settings API completeness (currency, calendarSystem, dual date, number format)
- Single resolved settings context consumed by all modules
- Finance and Academics modules consuming resolved settings
- Workspace Settings UI completeness and correctness
- BS↔Gregorian date conversion utility (accuracy is a compliance requirement)
- Nepal MVP end-to-end journey validation

**Explicitly out of scope (do not include, do not build):**
- School-level settings override UI (the data model supports it, but the UI is post-MVP)
- Full i18n / Nepali language translation of UI strings
- eSewa / Khalti payment gateway configuration (separate sprint)
- Parent/Student portal localization
- Multi-currency invoicing (single currency per org only for MVP)
- Notifications timezone enforcement (post-MVP)
- People / HR module date formatting (post-MVP unless trivial reuse of utilities)

**Non-negotiables that must not be broken:**
- DiceBear avatar logic anywhere in the codebase — do not touch
- TanStack Table instances — do not rebuild, only modify cell renderers
- Ed-Fi compliance fields on school and organization records
- The shell architecture: topbar z-index:50, sidebar z-index:40, no position:fixed overlays

---

## DELIVERABLES

Return with all of the following:

1. `docs/workspace-settings-audit.md` — Phase 1 audit answers
2. `docs/workspace-settings-subagent-review.md` — Sub-agent verdict
3. `docs/workspace-settings-sprint.md` — Final approved sprint plan (atomic tasks, demos, validations)
4. `docs/nepal-mvp-validation-checklist.md` — Human-readable QA checklist (written in Sprint 6)
