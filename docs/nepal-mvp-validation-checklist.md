# Nepal MVP Validation Checklist

**Purpose:** Human-readable checklist for QA engineers or pilot school admins to verify that Workspace Settings drive formatting across all modules.

**Prerequisites:**
- Two schools configured: one Nepal school (e.g., Pragati Sishu Sadhan) and one US school (e.g., Westfield High School)
- At least 3 invoices and 3 payments exist for each school
- User has TenantAdmin role

---

## 1. Workspace Settings — Nepal Configuration

- [ ] Navigate to **Settings → Workspace Settings**
- [ ] Set **Default Currency** to `NPR`
- [ ] Set **Calendar System** to `Bikram Sambat`
- [ ] Set **Show Bikram Sambat Dates** toggle to ON
- [ ] Set **Default Timezone** to `Asia/Kathmandu`
- [ ] Set **Number Format** to `South Asian (1,00,000)`
- [ ] Set **Date Format** to `YYYY-MM-DD`
- [ ] Set **Time Format** to `12-hour`
- [ ] Click **Save** on the Regional Settings section
- [ ] Verify success toast appears
- [ ] Reload the page — all values should persist as set

---

## 2. Finance Overview — Nepal School

- [ ] Switch to the Nepal school (e.g., Pragati Sishu Sadhan)
- [ ] Navigate to **Finance → Overview**
- [ ] **KPI Tiles:** Verify amounts show NPR with lakh formatting (e.g., "NPR 4.9L", "NPR 1.6L")
- [ ] **Billing Health card:** Amounts show NPR with South Asian grouping (e.g., "NPR 1,50,000")
- [ ] **Collection Performance card:** Amounts show NPR
- [ ] **Recent Payments card:** Amounts show NPR
- [ ] **Recent Invoices card:** Amounts show NPR
- [ ] **Overdue Alert Banner:** If visible, amount shows NPR
- [ ] **Aging Report:** Amounts show NPR

---

## 3. Finance Payments — Nepal School (Dual Dates + Timezone)

- [ ] Navigate to **Finance → Payments**
- [ ] **Amount column:** All amounts show NPR (e.g., "NPR 10,000")
- [ ] **Date column:** Shows dual format — Gregorian date with BS date below (e.g., "18/03/2026" with "BS: 2082/12/05")
- [ ] **Timestamps:** Recent payments show Nepal Standard Time (NST), NOT browser local time
  - Verify: a payment recorded at 2:00 PM NST should show "2:00 PM", not a different timezone offset
- [ ] **No "Yesterday 7:00 PM" bug:** Timestamps should show correct times, not all the same time

---

## 4. Finance Invoices — Nepal School

- [ ] Navigate to **Finance → Invoices**
- [ ] **Amount column:** All amounts show NPR
- [ ] **Due Date column:** Shows dual AD + BS format
- [ ] Click into an invoice detail → amounts show NPR, due date shows dual format
- [ ] **Invoice line items:** Amounts in NPR with South Asian grouping

---

## 5. Finance Student Accounts — Nepal School

- [ ] Navigate to **Finance → Student Accounts**
- [ ] **Balance column:** Shows NPR with South Asian grouping
- [ ] **All amount fields:** NPR formatting throughout

---

## 6. Finance — Record a New Payment

- [ ] Navigate to **Finance → Payments → Record Payment**
- [ ] Verify the currency shown is NPR (not hardcoded)
- [ ] Record a test payment → confirm it saves with NPR currency
- [ ] Verify the new payment appears in the payments list with NPR formatting

---

## 7. Academics — Nepal School

- [ ] Switch to the Nepal school
- [ ] Navigate to **Academics → Students**
- [ ] **Enrollment dates:** Should show in BS format (e.g., "2082/12/05")
- [ ] **Attendance dates:** Should show in BS format
- [ ] Navigate to **Academics → Overview** → date references should use BS format

---

## 8. Settings Change — Switch to USD

- [ ] Navigate to **Settings → Workspace Settings**
- [ ] Change **Default Currency** to `USD`
- [ ] Change **Calendar System** to `Gregorian`
- [ ] Disable **Show Bikram Sambat Dates**
- [ ] Change **Number Format** to `International (100,000)`
- [ ] Save
- [ ] Navigate to **Finance → Overview** → amounts should now show USD (e.g., "$490,000")
- [ ] Navigate to **Finance → Payments** → amounts in USD, dates in Gregorian only (no BS line)
- [ ] Navigate to **Finance → Invoices** → amounts in USD, dates in Gregorian only
- [ ] This confirms settings are live and not cached

---

## 9. US School Verification

- [ ] Switch to the US school (e.g., Westfield High School)
- [ ] Set workspace settings to: USD, Gregorian, dual dates OFF, America/Chicago timezone, International number format
- [ ] Navigate to **Finance → Overview** → all amounts in USD with international grouping
- [ ] Navigate to **Finance → Payments** → dates in Gregorian only, no BS dates shown
- [ ] Navigate to **Finance → Invoices** → dates in Gregorian only
- [ ] Timestamps should show Central Time (CST/CDT), not NST
- [ ] Navigate to **Academics** → all dates in Gregorian

---

## 10. Edge Cases

- [ ] **Zero amounts:** "NPR 0" or "$0.00" should display correctly (not blank or NaN)
- [ ] **Large amounts:** Values in crores (e.g., NPR 1,00,00,000) should display as "NPR 1.0Cr" in compact view
- [ ] **Missing dates:** Invoices with no due date should show "—" (dash), not error
- [ ] **Page reload:** After any settings change and save, a full page reload should show the new settings everywhere
- [ ] **School switch:** Switching between Nepal and US schools should update all formatting without page reload

---

## Sign-Off

| Section | Tester | Date | Pass/Fail | Notes |
|---------|--------|------|-----------|-------|
| 1. Workspace Settings | | | | |
| 2. Finance Overview (Nepal) | | | | |
| 3. Finance Payments (Nepal) | | | | |
| 4. Finance Invoices (Nepal) | | | | |
| 5. Finance Accounts (Nepal) | | | | |
| 6. Record Payment | | | | |
| 7. Academics (Nepal) | | | | |
| 8. Settings Change to USD | | | | |
| 9. US School Verification | | | | |
| 10. Edge Cases | | | | |
