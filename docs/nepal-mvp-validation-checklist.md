# Nepal MVP Validation Checklist

**Purpose:** Manual QA checklist for validating the Nepal pilot school onboarding flow.
Each item describes what to do, what to look for, and pass/fail criteria.

---

## 1. Tenant Creation (AdminWeb)

| # | Action | Expected | Pass/Fail |
|---|--------|----------|-----------|
| 1.1 | Open AdminWeb → Create Tenant | Country/Region dropdown is visible | |
| 1.2 | Select "Nepal (NPL)" from country dropdown | Info alert shows: "Currency: NPR, Calendar: Bikram Sambat, Timezone: Asia/Kathmandu" | |
| 1.3 | Fill name, email, tier → Submit | Tenant created successfully. Detail page shows Regional Settings card | |
| 1.4 | Check TenantDetail Regional Settings card | Shows: NPR, Bikram Sambat, Asia/Kathmandu, ne-NP, South Asian | |

## 2. Workspace Settings (Auto-seeded)

| # | Action | Expected | Pass/Fail |
|---|--------|----------|-----------|
| 2.1 | `GET /api/tenants/{id}/settings` | Returns `defaultCurrency: "NPR"`, `defaultCalendarSystem: "bikram_sambat"`, `defaultTimezone: "Asia/Kathmandu"` | |
| 2.2 | Check `workspaceConfirmedAt` field | Should be `null` (not yet confirmed) | |

## 3. First Login & WorkspaceSetupGate

| # | Action | Expected | Pass/Fail |
|---|--------|----------|-----------|
| 3.1 | Log in as TenantAdmin for the Nepal tenant | WorkspaceSetupGate appears — NOT the dashboard | |
| 3.2 | Verify displayed settings | Currency: NPR, Calendar: Bikram Sambat, Timezone: Asia/Kathmandu, Number Format: South Asian | |
| 3.3 | Try navigating to another page (e.g., /finance) | Gate still shows — it is non-dismissible | |
| 3.4 | Click "Confirm & Start Using EdForge" | Gate disappears, dashboard loads | |
| 3.5 | Reload the page | Gate does NOT reappear (localStorage + server cache) | |
| 3.6 | Click "These look wrong — edit settings" instead | Navigates to /settings/workspace (gate allows this route) | |

## 4. School Creation (Inherits Settings)

| # | Action | Expected | Pass/Fail |
|---|--------|----------|-----------|
| 4.1 | Settings → Organization → Create New School | School wizard opens | |
| 4.2 | Check Location & Contact step → Regional Settings | Timezone: "Asia/Kathmandu" (pre-selected), Calendar: "Bikram Sambat" shown | |
| 4.3 | Check inheritance indicator | "Inherited from organization settings" text visible below timezone | |
| 4.4 | Create the school without changing regional defaults | School created with BS calendar and NST timezone | |

## 5. Academic Year (BS Dates)

| # | Action | Expected | Pass/Fail |
|---|--------|----------|-----------|
| 5.1 | Settings → School → Academic Years → Create | Create Academic Year modal opens | |
| 5.2 | BS date input is shown | Year/Month/Day fields with BS month names (Baisakh, Jestha, etc.) | |
| 5.3 | Enter BS 2082 / Baisakh (1) / 1 | Gregorian equivalent shows: "Apr 14, 2025" | |
| 5.4 | Academic year name auto-populates | Shows "2082-2083" or similar BS year range | |
| 5.5 | Submit and check list | Academic year list shows "BS 2082/2083" as primary label | |

## 6. Finance Module

| # | Action | Expected | Pass/Fail |
|---|--------|----------|-----------|
| 6.1 | Navigate to Finance → Overview | KPI tiles render. Currency shown as NPR | |
| 6.2 | Navigate to Finance → Payments | Date column shows DD/MM/YYYY format with "(BS: YYYY/MM/DD)" | |
| 6.3 | Check timestamps (e.g., invoice created at) | Time shows in Asia/Kathmandu (NST, UTC+5:45) | |
| 6.4 | New tenant, no schools → navigate to Finance | Empty state: "No schools configured" with link to Settings | |

## 7. People Module

| # | Action | Expected | Pass/Fail |
|---|--------|----------|-----------|
| 7.1 | New tenant, no schools → navigate to People | Empty state: "No schools configured" with link to Settings | |
| 7.2 | After creating school → navigate to People | Module renders normally | |

## 8. US Tenant (Regression)

| # | Action | Expected | Pass/Fail |
|---|--------|----------|-----------|
| 8.1 | Create a US tenant (country: USA) | Settings auto-seeded with USD, gregorian, America/New_York | |
| 8.2 | Log in → WorkspaceSetupGate | Shows USD, Gregorian, US timezone | |
| 8.3 | Create school | Calendar defaults to Gregorian, Mon-Fri school days | |
| 8.4 | Finance module | Dates show MM/DD/YYYY, no BS secondary date, USD currency | |

---

**Completed by:** _______________
**Date:** _______________
**Result:** PASS / FAIL (if fail, list failing items)
