# EdForge Module Overview Pages V2 — Academics & Finance Sprint Plan

> **Source of truth** for the Academics and Finance overview page V2 redesigns.
> Generated from codebase audit + design prototypes + API response analysis + sub-agent review.
> Date: 2026-03-19 | Branch: `home-landing-dashboard`
> Reference: Home page V2 implementation (see `docs/home-page-redesign-sprint.md`)

---

## Codebase Audit Summary

| Concern | Current State |
|---|---|
| **Academics Overview** | `apps/academics/src/routes/overview.tsx` — `ModuleOverviewPage` wrapper, 4 KPI stats, enrollment chart, attendance trend, activity feed widgets |
| **Finance Overview** | `apps/finance/src/routes/overview.tsx` — inline `SummaryCard` + `PercentageBar` components, 5 KPIs, invoice/payment breakdowns, recent activity feed |
| **Academics data hooks** | `apps/academics/src/hooks/useAcademicsOverview.ts` — `useAcademicsOverview`, `useActiveTeacherCount`, `useEnrollmentDistribution`, `useCombinedAlerts`, `useAcademicCalendarContext` |
| **Finance data hooks** | `@edforge/finance-services` — `useDashboardSummary(schoolId, filters)` returns full summary including `byFeeType`, `recentPayments`, `recentInvoices`, `agingReport` |
| **Staff hooks** | `apps/people/src/hooks/useStaff.ts` — `useStaffList(filters)` exists but lives in the People MFE; **no shared hook** for fetching staff from other modules |
| **Academic year** | `useCurrentAcademicYear(schoolId)` in academics module; `useHomeAcademicYear` in shell's home.service.ts |
| **Attendance trend** | `AttendanceTrendWidget` in academics module (uses its own hook); `AttendanceTrendCard` in shell (reusable, V2 styled) |
| **V2 reusable components** | `HomeStatCard`, `AlertsRow`, `SectionErrorBoundary`, `useCountUp`, `AttendanceTrendCard`, `FinanceSummaryCard` — all in `apps/shell/src/` |
| **V2 CSS tokens** | `apps/shell/src/styles/home-v2-tokens.css` scoped to `[data-page="home-v2"]` |
| **V2 animations** | `apps/shell/src/styles/home-v2-animations.css` |
| **Module layouts** | Both modules render inside shell's `AppShell` (sidebar + header). Academics has `AcademicsLayout` (school guard), Finance has `FinanceLayout` (error boundary) |
| **Routing** | TanStack Router — `/academics/$` (splat), `/finance/$` (splat). Modules are MFEs loaded via Module Federation |
| **NPR formatting** | `formatNPR` and `formatNPRShort` exist in `@edforge/types` (packages/types/src/payment.ts) |
| **Theme system** | `useThemeStore` (Zustand + localStorage), CSS variables in `packages/theme/src/base.css`, `.dark` class on `<html>` |

### Key Findings from Audit

1. **MFE boundary challenge**: V2 components (HomeStatCard, SectionErrorBoundary, useCountUp) live in `apps/shell/` — MFE modules cannot import from shell directly. These must be moved to shared packages or recreated.
2. **byFeeType bug confirmed**: In `useHomeData.ts:284`, `byFeeType` is typed as `Record<string, number>` but the API returns `Array<{feeType, invoiceCount, totalAmount, collectedAmount}>`. The array passes through unmapped (`d.byFeeType` at line 308), so `Object.entries()` in `FinanceSummaryCard` iterates array indices "0", "1" instead of fee type names.
3. **No staff hook in shared packages**: Staff data is only accessible via `useStaffList` in the People MFE. Need a shared service for the academics overview staff roster card.
4. **Finance overview lacks V2 styling**: Current finance overview uses generic Tailwind classes and inline SummaryCard — complete V2 redesign needed.
5. **Academics overview uses `ModuleOverviewPage` wrapper**: This wrapper handles the KPI grid and header — V2 redesign replaces this with custom layout matching the design prototype.
6. **CSS token scope**: V2 tokens are scoped to `[data-page="home-v2"]`. Module pages need the same scope applied to inherit tokens. Recommend renaming scope to `[data-v2]` or applying `[data-page="home-v2"]` to module overview roots.
7. **Attendance trend chart**: Shell's `AttendanceTrendCard` is V2-styled with Recharts, threshold line, and custom legend — can be reused if extracted to shared package.
8. **Finance dashboard summary API** returns `agingReport`, `monthlyCollections`, `recentPayments`, `recentInvoices` — all needed for Finance V2 but currently unused by finance overview page.

---

## Architecture Decisions

### 1. Component Sharing Strategy

**Decision**: Extract V2 reusable components to `@edforge/ui` shared package.

**Components to extract**:
- `HomeStatCard` → `@edforge/ui` as `StatCard` (rename to module-agnostic)
- `SectionErrorBoundary` → `@edforge/ui` as `WidgetErrorBoundary` (or reuse existing `WidgetErrorBoundary` pattern)
- `useCountUp` hook → `@edforge/ui` hooks
- `AnimatedBar` (from FinanceSummaryCard) → `@edforge/ui` as `AnimatedProgressBar`
- `parseFormattedValue`, `formatAnimatedValue` → `@edforge/ui` utilities

**Components that stay module-specific**:
- `AttendanceTrendCard` — already has module-specific equivalent in academics; finance doesn't need it
- `AlertsRow` — each module builds its own alert data; shared alert component pattern used
- Module-specific cards (staff roster, enrollment chart, aging report, etc.)

### 2. CSS Token Scope

**Decision**: Widen the V2 token scope from `[data-page="home-v2"]` to `[data-v2]`. Both the home page and module overview pages will use `data-v2` attribute. This is a non-breaking rename — add `[data-v2]` as an additional selector alongside the existing one.

### 3. Staff Data Access

**Decision**: Create a shared staff service in `packages/shared-services/` (or add to existing shared package) that wraps `GET /api/schools/{schoolId}/staff`. The academics overview page calls this directly — no dependency on the People MFE.

### 4. Finance byFeeType Fix

**Decision**: Fix at the data layer in `useHomeData.ts` (home page) and implement correctly in the finance V2 overview. Create `formatFeeType(type: string): string` utility in `@edforge/types` or finance-services package.

---

## Known Bug Fix — CRITICAL

### byFeeType Label Bug

**Location**: `apps/shell/src/hooks/useHomeData.ts:284-308` and `apps/shell/src/components/home/FinanceSummaryCard.tsx:19,231-233`

**Root cause**: The API returns `byFeeType` as an array of objects `{feeType, invoiceCount, totalAmount, collectedAmount}`, but the home page hook passes it through as-is while the component types it as `Record<string, number>`. When `Object.entries()` iterates an array, keys are "0", "1" (array indices).

**Fix**:
1. In `useHomeData.ts`: Transform the array to a proper Record using `feeType` as key and `totalAmount` as value:
   ```typescript
   byFeeType: Array.isArray(d.byFeeType)
     ? Object.fromEntries(d.byFeeType.map((f: any) => [f.feeType, f.totalAmount]))
     : d.byFeeType
   ```
2. Create `formatFeeType(type: string): string` utility:
   ```typescript
   const FEE_TYPE_LABELS: Record<string, string> = {
     admission: 'Admission fees',
     lab: 'Lab fees',
     transport: 'Transport fees',
     tuition: 'Tuition fees',
   }
   export function formatFeeType(type: string): string {
     return FEE_TYPE_LABELS[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + ' fees'
   }
   ```
3. Update `FinanceSummaryCard` to use `formatFeeType()` instead of `formatFeeTypeName()`.
4. For Finance V2 overview: use the full `byFeeType` array objects (with `collectedAmount`, `totalAmount`, `invoiceCount`) for the detailed fee breakdown cards.

---

## Sprint Plan

**Complexity scale:** 1 SP = ~2 hours, 2 SP = ~4 hours, 3 SP = ~6 hours

---

### Sprint 1: Shared Infrastructure & Token Widening (16 SP)

**Goal:** Extract V2 components to shared packages, widen CSS token scope, create shared staff service, fix byFeeType bug, update TypeScript interfaces. No visual changes yet — infrastructure only.

**Demo:** All shared components importable from `@edforge/ui`, byFeeType labels correct on home page, staff API callable from academics module, DashboardSummary type complete.

---

#### Task 1.1 — Widen V2 Token CSS Scope
- **Type:** style | **SP:** 1 | **Dependencies:** none
- **File:** `apps/shell/src/styles/home-v2-tokens.css`
- Add `[data-v2]` as an additional selector alongside existing `[data-page="home-v2"]`
- Both selectors apply identical tokens: `[data-page="home-v2"], [data-v2] { ... }`
- Update light theme overrides similarly
- Verify home page still works (no regression)
- **Acceptance:**
  - Any element with `data-v2` attribute inherits all V2 tokens
  - Home page unchanged (backward compatible)
  - Both dark and light overrides apply to new selector

#### Task 1.1b — Update DashboardSummary TypeScript Interface
- **Type:** types | **SP:** 1 | **Dependencies:** none
- **File:** `packages/types/src/payment.ts`
- Add missing fields to `DashboardSummary` interface:
  - `byFeeType: Array<{ feeType: string; invoiceCount: number; totalAmount: number; collectedAmount: number }>`
  - `agingReport: Array<{ label: string; minDays: number; maxDays: number | null; count: number; amount: number }>`
  - `monthlyCollections: Array<{ month: string; collected: number; invoiced: number; paymentCount: number }>`
  - `byGradeLevel: Array<{ gradeLevel: string; invoiceCount: number; totalInvoiced: number; totalCollected: number; outstanding: number }>`
  - Make `recentInvoices` required (not optional)
- **Acceptance:**
  - TypeScript compiles without errors for all downstream usages
  - All fields match actual API response shapes from `network-req.txt`

#### Task 1.2 — Extract StatCard Component to @edforge/ui
- **Type:** component | **SP:** 2 | **Dependencies:** none (soft dep on 1.1 for token scope; tokens already defined)
- **Source:** `apps/shell/src/components/home/HomeStatCard.tsx`
- **Target:** `packages/ui/src/components/StatCard.tsx`
- Copy `HomeStatCard` to shared package, rename export to `StatCard`
- Move `useCountUp`, `parseFormattedValue`, `formatAnimatedValue` to `packages/ui/src/hooks/useCountUp.ts`
- Also extract `useV2ChartColors` hook from shell to `packages/ui/src/hooks/useV2ChartColors.ts` for chart theme reactivity
- Export all from package index (`packages/ui/src/index.ts` barrel update)
- Update shell's `HomeStatCard.tsx` to re-export from `@edforge/ui` (no breaking change)
- **Acceptance:**
  - `import { StatCard, useCountUp, useV2ChartColors } from '@edforge/ui'` works in academics and finance modules
  - Home page still uses the same component (via re-export)
  - All props, animations, skeleton, error states preserved

#### Task 1.3 — Extract AnimatedProgressBar to @edforge/ui
- **Type:** component | **SP:** 1 | **Dependencies:** 1.1
- **Source:** `AnimatedBar` from `apps/shell/src/components/home/FinanceSummaryCard.tsx`
- **Target:** `packages/ui/src/components/AnimatedProgressBar.tsx`
- Extract and generalize — props: `percentage`, `color`, `label`, `height?`, `trackColor?`
- Respects `prefers-reduced-motion`
- ARIA: `role="progressbar"`, `aria-valuenow`, `aria-valuemin=0`, `aria-valuemax=100`
- Export from package index
- **Acceptance:** Importable from `@edforge/ui`, ARIA attributes present, animation works

#### Task 1.4 — Extract SectionErrorBoundary to @edforge/ui
- **Type:** component | **SP:** 0.5 | **Dependencies:** none
- **Source:** `apps/shell/src/components/home/SectionErrorBoundary.tsx`
- **Target:** `packages/ui/src/components/SectionErrorBoundary.tsx`
- Rename to `WidgetErrorBoundaryV2` to avoid collision with existing `WidgetErrorBoundary`
- Update shell to re-export
- **Acceptance:** Importable from `@edforge/ui`

#### Task 1.5 — Extract V2 Animation CSS to Shared Theme Package
- **Type:** style | **SP:** 1 | **Dependencies:** 1.1
- **Source:** `apps/shell/src/styles/home-v2-animations.css`
- **Target:** `packages/theme/src/v2-animations.css`
- Import in theme package entry point
- Ensure `v2-skeleton-pulse` and `v2-bar-fill` classes available globally
- Remove duplicate import from shell (theme package import covers it)
- **Acceptance:** Animation classes work in all MFE modules

#### Task 1.6 — Create Shared Staff Service
- **Type:** service | **SP:** 2.5 | **Dependencies:** none
- **Package scaffolding:** If `packages/shared-services/` does not exist, create it with:
  - `package.json` (name: `@edforge/shared-services`, with `@tanstack/react-query` as peer dep)
  - `tsconfig.json` extending root config
  - Add to `pnpm-workspace.yaml`
  - Build script in package.json
  - **Alternative:** If scaffolding is too heavy, add staff service to an existing shared package like `@edforge/types` or create a new export path in `@edforge/finance-services` → rename consideration.
- **File:** `packages/shared-services/src/staff.service.ts`
- Create `getSchoolStaff(schoolId: string): Promise<StaffListResponse>`
  - Calls `GET /api/schools/{schoolId}/staff`
  - Returns `{ items: StaffMember[], hasMore: boolean }`
- Create `useSchoolStaff(schoolId: string)` React Query hook
  - Query key: `['staff', 'school', schoolId]`
  - `staleTime: 5 * 60 * 1000`
  - `enabled: !!schoolId`
- Type: `StaffMember` with fields: `staffId`, `firstName`, `lastSurname`, `email`, `role`, `employmentType`, `employmentStatus`, `schoolAssignments[]` (with `department`, `role`, `positionTitle`)
- Staff with no `department` field → fallback to "General" in department coverage
- Export from package index
- **Acceptance:**
  - Hook returns staff data for a given school
  - Types match API response shape from `network-req.txt`
  - No dependency on People MFE internals
  - Package builds and is importable by MFE modules

#### Task 1.7 — Fix byFeeType Bug in Home Page
- **Type:** bugfix | **SP:** 1.5 | **Dependencies:** 1.1b
- **Files:**
  - `packages/types/src/finance-utils.ts` (new) — Create shared finance utilities:
    - `formatFeeType(type: string): string` — `admission` → "Admission fees", `lab` → "Lab fees", `transport` → "Transport fees", `tuition` → "Tuition fees". Fallback: title-case with " fees" suffix.
    - `formatGatewayLabel(gateway: string): string` — `bank_transfer` → "Bank transfer", `cash` → "Cash", `cheque` → "Cheque". Title-case fallback.
    - `formatInvoiceStatus(status: string): string` — `partially_paid` → "Partially paid", etc.
    - `formatRelativeDate(dateString: string): string` — "Today · 1:54 PM", "Yesterday", "Mar 17", etc.
  - `apps/shell/src/hooks/useHomeData.ts` — Transform byFeeType array to richer Record:
    ```typescript
    byFeeType: Array.isArray(d.byFeeType)
      ? Object.fromEntries(d.byFeeType.map((f: any) => [f.feeType, { totalAmount: f.totalAmount, collectedAmount: f.collectedAmount, invoiceCount: f.invoiceCount }]))
      : d.byFeeType
    ```
  - `apps/shell/src/components/home/FinanceSummaryCard.tsx`:
    - Update `byFeeType` type from `Record<string, number>` to `Record<string, { totalAmount: number; collectedAmount: number; invoiceCount: number }>`
    - Use `formatFeeType()` for display names (replace inline `formatFeeTypeName`)
    - **Delete** the now-redundant `formatFeeTypeName` function
- Export all utilities from `@edforge/types` package index
- **Acceptance:**
  - Home page fee type breakdown shows "Admission fees", "Lab fees" (not "0", "1")
  - All formatters exported and reusable by finance/academics modules
  - `formatFeeTypeName` removed from FinanceSummaryCard
  - No regression in other finance displays

#### Task 1.8a — NPR Formatting Verification & Enhancement
- **Type:** utility | **SP:** 0.5 | **Dependencies:** none
- **File:** `packages/types/src/payment.ts`
- Verify `formatNPRShort` produces correct output:
  - `formatNPRShort(457200)` → "NPR 4.6 lakh" (for card text)
- Create `formatNPRCompact(amount: number): string` for KPI tiles (space-constrained):
  - >= 100,000: `NPR X.XL` (e.g., "NPR 4.6L")
  - < 100,000: `NPR X,XXX` (comma formatted)
- Note: prototype uses "NPR 4.6L" in KPI tiles but "NPR 1.48 lakh" in cards — two format variants
- **Acceptance:** Both formats available and consistent

#### Task 1.8b — Create getAttendanceColor Utility
- **Type:** utility | **SP:** 0.5 | **Dependencies:** none
- **File:** `packages/types/src/academics-utils.ts` (new)
- `getAttendanceColor(rate: number): string`:
  - `< 60` → `#E24B4A` (danger)
  - `60–80` → `#EF9F27` (warning)
  - `>= 80` → `#1D9E75` (brand)
- `getAttendanceSeverity(rate: number): 'critical' | 'warning' | 'good'`
- Export from `@edforge/types`
- **Acceptance:** Attendance color coding consistent across home, academics pages

#### Task 1.9 — Create V2 Alert Component in @edforge/ui
- **Type:** component | **SP:** 2 | **Dependencies:** 1.1
- **Target:** `packages/ui/src/components/V2AlertItem.tsx`
- Props: `severity: 'critical' | 'warning' | 'info'`, `title: string`, `subtitle: string`, `count: number`, `icon?: ReactNode`, `cta?: { label: string, onClick: () => void }`
- Styling matches home V2 `AlertsRow` items:
  - Critical: bg `rgba(226,75,74,0.07)`, border `rgba(226,75,74,0.18)`, title `#f09595`
  - Warning: bg `rgba(239,159,39,0.07)`, border `rgba(239,159,39,0.18)`, title `#FAC775`
  - Info: bg `rgba(55,138,221,0.07)`, border `rgba(55,138,221,0.18)`, title `#85B7EB`
- Uses V2 CSS tokens for theme compatibility
- **Acceptance:** Importable from `@edforge/ui`, matches prototype styling in both themes

#### Task 1.10 — Update @edforge/ui Barrel Exports
- **Type:** config | **SP:** 0.5 | **Dependencies:** 1.2, 1.3, 1.4, 1.9
- **File:** `packages/ui/src/index.ts`
- Add exports for all newly extracted components:
  - `export { StatCard, type StatCardProps } from './components/StatCard'`
  - `export { AnimatedProgressBar } from './components/AnimatedProgressBar'`
  - `export { WidgetErrorBoundaryV2 } from './components/SectionErrorBoundary'`
  - `export { V2AlertItem } from './components/V2AlertItem'`
  - `export { useCountUp, parseFormattedValue, formatAnimatedValue } from './hooks/useCountUp'`
  - `export { useV2ChartColors } from './hooks/useV2ChartColors'`
- **Acceptance:** All exports resolve, no circular dependencies

#### Task 1.11 — Build Verification
- **Type:** config | **SP:** 1 | **Dependencies:** 1.1b, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8a, 1.8b, 1.9, 1.10
- Run full build (`pnpm build`) — verify all packages compile
- Run existing tests — verify no regressions
- Verify home page renders correctly with re-exported components
- Verify MFE modules can import from updated shared packages
- Verify `DashboardSummary` type changes compile cleanly
- **Acceptance:** Clean build, no test failures, home page unchanged

---

### Sprint 2: Academics Overview V2 — Core Layout & KPIs (14 SP)

**Goal:** Academics overview page renders with V2 design — page header, 4 KPI tiles with count-up, attendance alerts card, skeleton states, error boundaries. Both themes work.

**Demo:** Navigate to `/academics` → see V2 page header with teal icon, 4 animated KPI tiles, attendance alerts with critical/warning/info items.

---

#### Task 2.1 — Create Academics V2 Page Shell & Header
- **Type:** component | **SP:** 2 | **Dependencies:** 1.1 (token scope), 1.11 (build pass)
- **File:** `apps/academics/src/routes/overview.tsx` (rewrite)
- Replace `ModuleOverviewPage` wrapper with custom V2 layout
- Add `data-v2` attribute to root element for token inheritance
- Page header: 36×36px icon (teal `rgba(29,158,117,0.12)` bg, academics icon), title "Academics overview" (22px/600), subtitle with academic year name
- Top-right: academic year chip + "Updated just now" refresh indicator
- Breadcrumb: "Home > Academics" (Home is clickable link to `/`)
- **Sidebar note:** Module pages render inside shell's `AppShell` which provides the global sidebar. The module-specific nav (Overview, Students, Classrooms, Curriculum) is configured via the existing module router — verify the sidebar already supports this or update the sidebar config to show module-specific nav items when on `/academics` routes. "Back to home" link should render at the top of the sidebar nav when inside a module.
- Import V2 tokens via `data-v2` scope (tokens loaded globally by shell)
- **Acceptance:**
  - V2 header matches prototype exactly
  - Academic year name populates from `useCurrentAcademicYear`
  - Breadcrumb navigation works ("Home" links to `/`)
  - Module sidebar nav shows correct items
  - Both dark and light themes render correctly

#### Task 2.2 — Academics KPI Grid (4 Tiles)
- **Type:** component | **SP:** 2 | **Dependencies:** 1.2, 2.1
- Use `StatCard` from `@edforge/ui` for all 4 tiles
- **Tile 1 — Total Enrolled**: value from `overview.enrollment.totalEnrolled`, tag `+N recent` from `recentEnrollments`, accent teal `#1D9E75`
- **Tile 2 — Active Sections**: value from `overview.activeSectionsCount`, tag shows teacher count from staff API, accent blue `#378ADD`
- **Tile 3 — Today's Attendance**: value formatted as percentage with `getAttendanceColor`, tag "Partial data" when `totalRecorded < totalStudents`, shows "X of Y recorded"
- **Tile 4 — At-Risk Students**: value from `alerts.totalAtRiskCount`, tag shows count below 80% threshold, accent red `#E24B4A`
- Grid: `grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px`
- Responsive: 2-col below 1024px
- All tiles use `useCountUp` animation
- **Acceptance:**
  - 4 tiles match prototype values and colors
  - Count-up animates on data load
  - Skeleton loading state with exact same dimensions
  - Responsive at 2 breakpoints

#### Task 2.3 — Academics Data Fetching Hook
- **Type:** hook | **SP:** 3 | **Dependencies:** 1.6 (staff service)
- **File:** `apps/academics/src/hooks/useAcademicsOverviewV2.ts`
- Parallel fetch all data sources using `useQueries` or multiple `useQuery`:
  1. `useAcademicsOverview(schoolId, academicYearId)` — existing
  2. `useSchoolStaff(schoolId)` — new shared hook from Task 1.6
  3. Attendance alerts: `GET /api/academics/attendance/alerts?schoolId={}&academicYearId={}&threshold=90&startDate={}&endDate={}`
  4. Attendance trend: `GET /api/academics/attendance/trend?schoolId={}&startDate={}&endDate={}`
  5. `useCurrentAcademicYear(schoolId)` — existing
- **Important:** The alerts API is called with `threshold=90` (returns all students below 90%). The 80% boundary for critical vs. warning classification is applied client-side:
  - `criticalStudents`: alerts where `attendanceRate < 80`
  - `warningStudents`: alerts where `attendanceRate >= 80 && < 90`
  - `teacherCount`: staff filtered to role "teacher"
  - `avgAttendanceRate`: computed from trend data (sum of rates / count of days)
  - `unrecordedCount`: `overview.attendance.totalStudents - overview.attendance.totalRecorded`
- Background refresh: `refetchInterval: 5 * 60 * 1000` on all queries
- Export structured data object with loading/error states per section
- **Acceptance:**
  - All 5 API calls execute in parallel (not waterfall)
  - Each section independently shows loading/error states
  - Derived values computed correctly from API responses
  - No N+1 queries

#### Task 2.4 — Attendance Alerts Card
- **Type:** component | **SP:** 2 | **Dependencies:** 1.9, 2.3
- **File:** `apps/academics/src/components/overview-v2/AttendanceAlertsCard.tsx`
- Full-width card with title "Attendance alerts" and subtitle "N students below 90% threshold · 30-day period"
- Uses `V2AlertItem` from `@edforge/ui` for each alert:
  - **Critical** (red): students with `attendanceRate < 80` — count and name list in subtitle
  - **Warning** (amber): students with `attendanceRate >= 80 && < 90`
  - **Info** (blue): incomplete recording — shown when `totalRecorded < totalStudents`, count = unrecorded students
- Right side of each alert: count number in semantic color
- "View all students" link in top-right navigates to Students page
- Skeleton: 3 alert-shaped placeholders
- Wrap in `WidgetErrorBoundaryV2`
- **Acceptance:**
  - 3 alert items with correct student counts and names
  - Info alert shows only when attendance is incomplete
  - Animations: stagger slide-in (0.08s delay per item)
  - Both themes styled correctly

#### Task 2.5 — Section Fade-In Stagger Animation
- **Type:** style | **SP:** 0.5 | **Dependencies:** 2.1
- Wrap each section in Framer Motion `motion.div`:
  - `initial={{ opacity: 0 }}`, `animate={{ opacity: 1 }}`
  - Parent uses `staggerChildren: 0.06` (60ms)
  - Duration: 200ms ease
- Respects `prefers-reduced-motion`
- **Acceptance:** Visible stagger on page load, instant when reduced-motion

#### Task 2.6 — Academics Skeleton States
- **Type:** component | **SP:** 1.5 | **Dependencies:** 2.1, 2.2, 2.4
- Create skeleton variants for each section:
  - Page header: title + subtitle placeholders
  - KPI grid: 4 `StatCard` skeletons (already built into StatCard)
  - Alerts card: 3 alert-shaped bars
  - Chart cards: rectangular placeholder matching chart height
  - Bottom row cards: list-item shaped rows
- All use `v2-skeleton-pulse` animation class
- **Acceptance:** No layout shift between skeleton and loaded states

#### Task 2.7 — Error Boundaries Per Section
- **Type:** component | **SP:** 1 | **Dependencies:** 1.4
- Wrap each section in `WidgetErrorBoundaryV2`:
  - KPI grid section
  - Alerts section
  - Chart row (left and right independently)
  - Bottom row (each card independently)
- Verify: crash in alerts card doesn't affect KPI tiles or charts
- Academic year failure: show top-level banner "Unable to load academic year" with retry
- **Acceptance:** Simulated crash in one section doesn't crash others

#### Task 2.8 — Light Theme Verification for Sprint 2 Components
- **Type:** style | **SP:** 1 | **Dependencies:** 2.1, 2.2, 2.4
- Test all Sprint 2 components in light mode
- Verify: card backgrounds, text colors, alert semantic backgrounds, skeleton colors, borders
- Fix any remaining hardcoded dark-only values
- **Acceptance:** Visual parity between dark and light themes

---

### Sprint 3: Academics Overview V2 — Charts & Bottom Row (14 SP)

**Goal:** Complete academics page — attendance trend chart, enrollment by grade level chart, at-risk student detail, staff roster, enrollment snapshot cards.

**Demo:** Full academics page renders with all 5 sections populated, charts animate, bottom row shows real data.

---

#### Task 3.1 — Attendance Trend Chart (Left Column)
- **Type:** component | **SP:** 2 | **Dependencies:** 2.3
- **File:** `apps/academics/src/components/overview-v2/AttendanceTrendChart.tsx`
- Reuse Recharts configuration pattern from shell's `AttendanceTrendCard`:
  - AreaChart with 30-day data
  - Line: `#1D9E75`, strokeWidth 1.5, tension 0.3
  - Fill gradient: `rgba(29,158,117,0.08)` → transparent
  - 80% threshold ReferenceLine: amber dashed, strokeDasharray `4 4`
  - Y-axis: domain [40, 110], tick format `v => v + '%'`
  - Theme-aware grid colors via `useThemeStore`
- Custom HTML legend above chart: title + subtitle left, legend items right (Actual line, 80% target dashed, Avg XX.X% in green)
- "View Attendance →" link at bottom
- Skeleton: rectangular placeholder matching chart height (160px)
- **Acceptance:**
  - Chart matches home V2 attendance trend exactly
  - Threshold line visible at 80%
  - Theme-aware colors (re-renders on toggle)

#### Task 3.2 — Enrollment By Grade Level Chart (Right Column)
- **Type:** component | **SP:** 2 | **Dependencies:** 2.3
- **File:** `apps/academics/src/components/overview-v2/EnrollmentByGradeChart.tsx`
- Horizontal bar chart (custom CSS, not Recharts — matches prototype):
  - Each grade = row: grade label (56px right-aligned) | bar track (flex:1) | count (16px)
  - Bar fill width proportional to max grade count
  - Colors (matching prototype): count 1 → teal `#1D9E75`, count 2 → purple `#7F77DD`, count 3 → blue `#378ADD`, count 4+ → amber `#EF9F27`
- Sort grades in natural order: PK, K, 1, 2, 3, ... 12
  - Grade label formatting: "PK" → "Pre-K", "K" → "Kinder.", "1" → "Grade 1", etc.
- Header: "Enrollment by grade level" + total count in blue
- "View Enrollment →" link at bottom
- Bar fill animates width 0→target (600ms ease-out, same as progress bars). Respects `prefers-reduced-motion` (instant width).
- Data source: `overview.enrollment.byGradeLevel` object
- ARIA: overall chart `aria-label="Enrollment by grade level, N total students"`, each bar row has `role="img"` with `aria-label` describing grade and count
- **Acceptance:**
  - Bars render with correct proportional widths
  - Color coding matches prototype count thresholds
  - Natural sort order (PK first, 12 last)
  - Animation on mount, instant with reduced-motion
  - ARIA labels present

#### Task 3.3 — At-Risk Student Detail Card
- **Type:** component | **SP:** 2 | **Dependencies:** 2.3
- **File:** `apps/academics/src/components/overview-v2/AtRiskStudentsCard.tsx`
- Left column of bottom 3-col row (`grid-template-columns: 1.2fr 1fr 0.8fr`)
- Header: "At-risk student detail" + "N at risk" count in red
- Student list from `alerts.alerts` sorted by `attendanceRate` ascending, max 5 shown:
  - Initials avatar (26px circle): red bg when rate < 80%, amber when 80–90%
  - Student name (12px, secondary text), grade + absent days below (10px, faint)
  - Rate percentage in semantic color + mini progress bar (50px wide, 2px height)
- "View all N at-risk students" link at bottom → Students page filtered by attendance
- Skeleton: 5 list item placeholders
- **Acceptance:**
  - Students sorted by worst attendance first
  - Color coding matches rate thresholds
  - Mini progress bars animate
  - Link navigates correctly

#### Task 3.4 — Staff Roster Card
- **Type:** component | **SP:** 2 | **Dependencies:** 1.6, 2.3
- **File:** `apps/academics/src/components/overview-v2/StaffRosterCard.tsx`
- Middle column of bottom row
- Header: "Staff roster" + "N active" count
- Staff list from `useSchoolStaff` hook:
  - Initials avatar (28px circle) with gradient background (cycle through: teal, blue, purple, coral)
  - Staff name (12px/500), role + department below (10px, faint)
  - Employment type badge: "Full-time" (teal bg/text), "Contract" (amber bg/text)
- Department coverage summary below divider:
  - Aggregate unique departments with teacher count per department
  - Row: department name left, "N teacher(s)" right in green
- Skeleton: 3 staff item placeholders + 2 department rows
- **Acceptance:**
  - Staff renders from API data
  - Gradient avatars cycle correctly
  - Employment badges styled per type
  - Department coverage accurate

#### Task 3.5 — Enrollment Snapshot Card
- **Type:** component | **SP:** 1.5 | **Dependencies:** 2.3
- **File:** `apps/academics/src/components/overview-v2/EnrollmentSnapshotCard.tsx`
- Right column of bottom row (narrowest: 0.8fr)
- Header: "Enrollment snapshot"
- Key-value list with bottom borders:
  - Total enrolled → bold primary text
  - Active status → green count
  - Recent enrollments → blue "+N"
  - Withdrawals → faint "0"
  - Active sections → primary text
  - Grade levels covered → count of unique keys in `byGradeLevel`
- Bottom: green info pill with academic year date range and calendar type
  - Bg: `rgba(29,158,117,0.07)`, border: `rgba(29,158,117,0.15)`, radius 7px
  - "Academic year on track" title, date range subtitle
- Data from `overview.enrollment` + `currentAcademicYear`
- **Acceptance:**
  - All 6 metric rows render with correct values
  - Academic year pill shows date range
  - Values from live API data

#### Task 3.6 — Academics Page Layout Assembly
- **Type:** component | **SP:** 1.5 | **Dependencies:** 3.1, 3.2, 3.3, 3.4, 3.5
- Wire all sections together in `overview.tsx`:
  - Section 1: Page header (Task 2.1)
  - Section 2: KPI grid (Task 2.2)
  - Section 3: Attendance alerts card (Task 2.4)
  - Section 4: Two-column row (`grid-template-columns: 1fr 1fr; gap: 12px`) — trend chart left, enrollment chart right
  - Section 5: Three-column row (`grid-template-columns: 1.2fr 1fr 0.8fr; gap: 12px`) — at-risk left, staff middle, snapshot right
- Each section wrapped in error boundary
- Fade-in stagger across sections
- Responsive: charts stack below 1024px, bottom row stacks below 768px
- **Acceptance:**
  - Full page matches prototype layout
  - Responsive at 375/768/1024/1440px
  - Error isolation between sections

#### Task 3.7 — Academics Light Theme & Responsive Polish
- **Type:** style | **SP:** 1 | **Dependencies:** 3.6
- Test entire academics page in light theme
- Test at 375px, 768px, 1024px, 1440px
- Fix: chart grid lines, tooltip backgrounds, bar track colors, avatar contrasts
- **Acceptance:** Visual parity between themes, no horizontal scroll at any breakpoint

#### Task 3.8 — Academics Accessibility Pass
- **Type:** a11y | **SP:** 1 | **Dependencies:** 3.6
- Tab order: header → KPIs → alerts → charts → bottom cards
- `aria-label` on: each KPI tile, chart containers, student list items, staff list items
- `aria-live="polite"` on alerts section
- Progress bars have `role="progressbar"` with proper aria attributes
- Focus rings visible in both themes
- `prefers-reduced-motion`: all animations instant
- **Acceptance:** Keyboard navigation works, axe-core 0 critical/serious issues

---

### Sprint 4: Finance Overview V2 — Complete Implementation (16 SP)

**Goal:** Finance overview page renders with complete V2 design — all 6 sections, overdue alert, KPI tiles, collection performance, invoice/payment breakdowns, aging report, recent activity lists.

**Demo:** Navigate to `/finance` → see V2 finance page with all sections, progress bars animate, aging report highlights overdue buckets.

---

#### Task 4.1 — Finance V2 Page Shell & Header
- **Type:** component | **SP:** 1.5 | **Dependencies:** 1.1 (token scope), 1.11 (build pass)
- **File:** `apps/finance/src/routes/overview.tsx` (rewrite)
- Add `data-v2` attribute to root element
- Page header: 36×36px icon (amber `rgba(239,159,39,0.10)` bg, finance clock icon), title "Finance overview" (22px/600), subtitle "Billing, payments, and fee collection for {schoolName}"
- Top-right action buttons: "Bulk invoice" secondary button, "Record payment" primary green button. Both keyboard-accessible (Enter/Space activation, focus ring `outline: 2px solid var(--v2-brand-primary)`)
- Breadcrumb: "Home > Finance" (Home clickable, links to `/`)
- **Sidebar note:** Finance sidebar has section headers ("Billing", "Configuration") with specific styling (10px/600, uppercase, `#3a4055`). Verify shell's sidebar supports section headers or add this UI pattern. Nav items: Overview (active, amber highlight), Invoices, Student accounts, Payments under "Billing", Fee structures under "Configuration".
- **Acceptance:** Header matches prototype, action buttons render and are keyboard-accessible, breadcrumb works, sidebar section headers styled

#### Task 4.1b — Finance Filters & Export Row
- **Type:** component | **SP:** 2 | **Dependencies:** 4.1
- **File:** `apps/finance/src/components/overview-v2/FilterRow.tsx`
- Preserve existing filter functionality from current overview (MUST NOT regress):
  - Academic year dropdown (populated from `useFeeStructures` → unique academic years)
  - Date range filters (from/to date pickers)
  - "Clear Filters" button when any filter active
- Filter state: `useState` for `fromDate`, `toDate`, `academicYear`
- Pass filters to `useDashboardSummary(schoolId, filters)` — existing API supports this
- "Export CSV" button: reuse `useExportInvoicesCsv()` mutation with loading state
- V2 styling: filter chips match prototype (bg `rgba(255,255,255,0.04)`, border `rgba(255,255,255,0.08)`, radius 7px, 11px text)
- **Acceptance:**
  - Filters update dashboard data in real-time
  - CSV export works with loading indicator
  - No functional regression from current finance overview

#### Task 4.2 — Finance Data Fetching Hook
- **Type:** hook | **SP:** 2 | **Dependencies:** 1.1b (DashboardSummary type), 1.7 (formatters)
- **File:** `apps/finance/src/hooks/useFinanceOverviewV2.ts`
- Parallel fetch:
  1. `useDashboardSummary(schoolId, filters)` — existing from `@edforge/finance-services`, accepts optional date/year filters
  2. `useFeeStructures(schoolId)` — for academic year filter dropdown (preserve from current overview)
- Extract and structure all needed data:
  - KPI values: `totalInvoiced`, `totalCollected`, `outstanding`, `overdue`, `collectionRate`
  - `invoicesByStatus` with total count computed
  - `paymentsByGateway` with total count computed
  - `byFeeType` array (full objects with `feeType`, `invoiceCount`, `totalAmount`, `collectedAmount`)
  - `agingReport` array
  - `recentPayments` array (top 5)
  - `recentInvoices` array (top 5, filtered to show overdue first)
  - `monthlyCollections[0]` for current month payment count
- Computed: `nonOverdueOutstanding = outstanding - overdue`
- Loading/error states per section
- **Acceptance:** All finance data structured and available, parallel fetching

#### Task 4.3 — Overdue Alert Banner
- **Type:** component | **SP:** 1 | **Dependencies:** 1.9, 4.2
- **File:** `apps/finance/src/components/overview-v2/OverdueAlertBanner.tsx`
- Renders only when `overdue > 0`
- Uses `V2AlertItem` pattern (critical severity):
  - Title: "{invoicesByStatus.overdue} invoices overdue — NPR {overdue formatted} uncollected"
  - Subtitle: "Collection rate is {collectionRate}%. {dynamicAgingLabel from agingReport data}. {invoicesByStatus.draft} additional drafts need to be issued." — derive aging label dynamically (e.g., "32 invoices in 1–30 day bucket") instead of hardcoding "1–30 days"
  - CTA: "Review billing" button → navigates to Invoices filtered by overdue
- Hidden when no overdue invoices
- **Acceptance:** Banner shows with correct data, CTA navigates correctly, hidden when 0 overdue

#### Task 4.4 — Finance KPI Grid (4 Tiles)
- **Type:** component | **SP:** 1.5 | **Dependencies:** 1.2, 4.2
- Use `StatCard` from `@edforge/ui`
- **Tile 1 — Total Invoiced**: value formatted as NPR lakh, tag shows total invoice count, accent blue `#378ADD`
- **Tile 2 — Total Collected**: value formatted, tag shows current month payment count from `monthlyCollections[0].paymentCount`, accent teal `#1D9E75`
- **Tile 3 — Outstanding**: value formatted, tag shows outstanding invoice count (derived: `invoicesByStatus.overdue + invoicesByStatus.issued + invoicesByStatus.partially_paid`), accent amber `#EF9F27`
- **Tile 4 — Collection Rate**: percentage value, red when < 60%, tag "Below 60% target" when applicable, accent red `#E24B4A`
- Count-up animation on all numeric values
- **Acceptance:** 4 tiles match prototype, conditional red styling on collection rate

#### Task 4.5 — Collection Performance Card (Left)
- **Type:** component | **SP:** 2 | **Dependencies:** 1.3, 4.2
- **File:** `apps/finance/src/components/overview-v2/CollectionPerformanceCard.tsx`
- Card header: "Collection performance" + "XX.X% collected" right
- 3 `AnimatedProgressBar` components:
  - Collected: width = collectionRate%, color `#1D9E75`, label shows NPR amount
  - Outstanding (non-overdue): width = (outstanding - overdue) / totalInvoiced * 100%, color `#EF9F27`
  - Overdue: width = overdue / totalInvoiced * 100%, color `#E24B4A`
- Divider
- Fee type breakdown section:
  - For each item in `byFeeType` array:
    - Fee item card (subtle bg/border): display name via `formatFeeType()`, invoice count
    - Progress bar: width = `collectedAmount / totalAmount * 100%`, color varies (first teal, second blue)
    - Stats: "NPR X collected" + "of NPR Y invoiced"
  - **THIS FIXES THE byFeeType BUG** — uses `feeType` field, not array index
- Edge cases: collectionRate 0% → only overdue bar visible, 100% → only collected bar, no byFeeType → section hidden
- **Acceptance:**
  - 3 progress bars animate correctly
  - Fee type names display correctly ("Admission fees", "Lab fees")
  - Collected/total amounts accurate per fee type
  - Edge cases handled (0%, 100%, empty byFeeType)

#### Task 4.6 — Invoice Status & Payment Methods Card (Right)
- **Type:** component | **SP:** 2 | **Dependencies:** 4.2
- **File:** `apps/finance/src/components/overview-v2/InvoiceStatusCard.tsx`
- **Invoice status breakdown** section:
  - For each status in `invoicesByStatus`: semantic dot, label (via `formatInvoiceStatus()`), horizontal bar, percentage, count
  - Status colors: overdue → `#E24B4A`, draft → `#888780`, paid → `#1D9E75`, partially_paid → `#EF9F27`, issued → `#378ADD`, cancelled → `#5F5E5A`
  - Bar widths proportional to total invoice count
  - Sort by count descending (overdue first in prototype)
- Divider
- **Payment methods breakdown** section:
  - For each gateway in `paymentsByGateway`: dot, label, bar, percentage, count
  - Gateway colors: cash → `#1D9E75`, cheque → `#7F77DD`, bank_transfer → `#378ADD`
- **Acceptance:** Status bars render with correct proportions and colors, payment methods render

#### Task 4.7 — Overdue Aging Report Card
- **Type:** component | **SP:** 1.5 | **Dependencies:** 4.2
- **File:** `apps/finance/src/components/overview-v2/AgingReportCard.tsx`
- Full-width card: "Overdue aging report" title
- 5 bucket cards in horizontal grid (`grid-template-columns: repeat(5, 1fr); gap: 6px`):
  - Each: label, count (16px/600), NPR amount (10px)
  - Buckets with count > 0: red styling — bg `rgba(226,75,74,0.07)`, border `rgba(226,75,74,0.15)`, count in `#E24B4A`
  - Buckets with count 0: neutral styling — bg `rgba(255,255,255,0.03)`, border default
- Labels from API: "Current", "1–30 days", "31–60 days", "61–90 days", "90+ days"
- Responsive: below 768px → `grid-template-columns: repeat(3, 1fr)` with remaining 2 in second row
- ARIA: each bucket `aria-label="1-30 days overdue: 32 invoices, NPR 3.09 lakh"` (descriptive label)
- **Acceptance:** 5 buckets render, red highlighting on non-zero buckets, amounts formatted, responsive grid, ARIA labels

#### Task 4.8 — Recent Payments Card (Left)
- **Type:** component | **SP:** 1.5 | **Dependencies:** 4.2
- **File:** `apps/finance/src/components/overview-v2/RecentPaymentsCard.tsx`
- Card header: "Recent payments" + "View all" link (green) → Payments page
- Feed list (top 5 from `recentPayments`):
  - Gateway icon square (24px, 6px radius): cash → teal bg, cheque → purple, bank_transfer → blue
  - Receipt number + gateway name via `formatGatewayLabel()`, timestamp via `formatRelativeDate()`
  - Amount in green, "completed" subtitle
- Bottom border between items, last item no border
- Empty state: "No recent payments"
- **Acceptance:** 5 payment items render with correct gateway colors and amounts

#### Task 4.9 — Recent Invoices Card (Right)
- **Type:** component | **SP:** 1.5 | **Dependencies:** 4.2
- **File:** `apps/finance/src/components/overview-v2/RecentInvoicesCard.tsx`
- Card header: "Recent invoices" + "View all N" link (red, count = overdue count) → Invoices filtered by overdue
- **Note:** The API `recentInvoices` returns mixed statuses (overdue, draft, paid) — card shows all recent invoices, not just overdue. Title is "Recent invoices" to match the mixed data.
- Feed list (top 5 from `recentInvoices`):
  - Invoice icon square color-coded by status: overdue → red, draft → gray/amber, paid → teal
  - Invoice number + student name (use `formatInvoiceStatus()` for status label)
  - Status subtitle in semantic color (overdue red, draft gray, paid green)
  - Grand total amount, amount due or "fully settled" for paid (`amountDue === 0`)
  - Timestamp formatted via `formatRelativeDate()`
- **Acceptance:** 5 invoice items render with correct status colors, "fully settled" for zero amountDue, mixed statuses displayed

#### Task 4.10 — Finance Page Layout Assembly
- **Type:** component | **SP:** 1.5 | **Dependencies:** 4.1b, 4.3–4.9
- Wire all sections in `overview.tsx`:
  - Section 1: Page header + filter row (4.1, 4.1b)
  - Section 2: Overdue alert banner (4.3) — conditional
  - Section 3: KPI grid (4.4)
  - Section 4: Two-column row (`grid-template-columns: 1.4fr 1fr`) — collection performance left, invoice status right
  - Section 5: Aging report (4.7) — full width
  - Section 6: Two-column row (`grid-template-columns: 1fr 1fr`) — recent payments left, recent invoices right
- Error boundaries per section
- Fade-in stagger
- Responsive: KPIs 2-col below 1024px, all rows stack below 768px, aging grid 3+2 below 768px
- **Acceptance:** Full page matches finance prototype layout

---

### Sprint 5: Polish, Theme, Responsive, A11y & Integration (10 SP)

**Goal:** Production-grade quality. Both pages pixel-perfect in both themes. Responsive at all breakpoints. Full keyboard navigation. Build passes.

**Demo:** Both pages render correctly at 375/768/1024/1440px, theme toggle works, keyboard navigation works, build clean.

---

#### Task 5.1 — Finance Light Theme & Responsive Polish
- **Type:** style | **SP:** 2 | **Dependencies:** Sprint 4
- Test every finance component in light mode
- Test at 375px, 768px, 1024px, 1440px
- Fix: progress bar tracks, aging bucket borders, feed item backgrounds, icon squares, alert banner
- Aging grid: 3+2 layout below 768px (first row 3, second row 2)
- **Acceptance:** Visual parity, no horizontal scroll

#### Task 5.2 — Finance Accessibility Pass
- **Type:** a11y | **SP:** 1.5 | **Dependencies:** Sprint 4
- Tab order: header buttons → alert CTA → KPIs → performance bars → status items → aging buckets → feed items
- `aria-label` on: action buttons, each KPI, progress bars, feed item buttons, aging buckets
- Screen reader: progress bars have `role="progressbar"`, status counts announced
- Focus rings in both themes
- `prefers-reduced-motion`: all animations instant
- **Acceptance:** Keyboard nav works, axe-core 0 critical/serious issues

#### Task 5.3 — Skeleton States Audit (Both Pages)
- **Type:** component | **SP:** 1.5 | **Dependencies:** Sprints 2-4
- Verify every section on both pages has matching skeleton states
- Measure: skeleton → loaded must cause zero layout shift
- Fix any mismatched dimensions
- Test skeleton rendering when individual API calls are slow (stagger mock delays)
- **Acceptance:** No layout shift, every section has skeleton, independent loading

#### Task 5.4 — Empty States (Both Pages)
- **Type:** component | **SP:** 1 | **Dependencies:** Sprints 2-4
- **Academics**: No academic year → guard page, no enrollment → onboarding state, no alerts → section hidden, no attendance → chart empty state, no staff → "No staff members" message
- **Finance**: No school → guard, no summary data → "No financial data" message, no overdue → alert hidden, no payments → "No recent payments", no invoices → "No recent invoices", zero aging → all buckets show 0
- **Acceptance:** All empty states tested in both themes

#### Task 5.5 — Navigation & Routing Verification
- **Type:** config | **SP:** 1 | **Dependencies:** Sprints 2-4
- Verify breadcrumb "Home" link navigates to `/`
- Verify sidebar "Back to home" navigates to `/`
- Verify all internal links resolve correctly:
  - Academics:
    - "View Attendance →" → `/academics/classrooms?tab=attendance`
    - "View all N at-risk students" → `/academics/students?filter=attendance`
    - "View Enrollment →" → `/academics/students`
  - Finance:
    - "Review billing" CTA → `/finance/invoices?status=overdue`
    - "View all" (payments) → `/finance/payments`
    - "View all N" (invoices) → `/finance/invoices?status=overdue`
    - "Bulk invoice" button → `/finance/invoices?action=bulk`
    - "Record payment" button → `/finance/payments?action=record`
- Verify browser back/forward works
- **Acceptance:** All navigation paths work correctly, no dead links

#### Task 5.6 — Performance & Bundle Audit
- **Type:** config | **SP:** 1 | **Dependencies:** all
- Verify no circular dependencies between shell and MFE modules
- Verify academics module only imports from: `@edforge/ui`, `@edforge/types`, `@edforge/abac`, shared services
- Verify finance module only imports from: `@edforge/ui`, `@edforge/types`, `@edforge/finance-services`
- No imports from `apps/shell/` or other `apps/` modules
- Measure page chunk sizes
- **Acceptance:** No circular deps, clean import boundaries

#### Task 5.7a — Academics Integration Smoke Test
- **Type:** test | **SP:** 1.5 | **Dependencies:** all Academics tasks
- Run `pnpm build` — verify clean build
- Manual smoke test academics page:
  - Page loads → skeletons → data populates with count-up animations
  - All 4 KPI tiles show correct values
  - Alerts card renders with correct student counts and names
  - Charts render (attendance trend with threshold line, enrollment bars with colors)
  - Bottom row cards (at-risk, staff, snapshot) render with real data
  - Theme toggle switches all components correctly
  - Responsive at 375/768/1024/1440px
  - Error boundaries catch simulated crashes (per section)
  - Filters do not exist on this page (no regression concern)
- **Acceptance:** Clean build for academics, all sections render

#### Task 5.7b — Finance Integration Smoke Test
- **Type:** test | **SP:** 1.5 | **Dependencies:** all Finance tasks
- Manual smoke test finance page:
  - Page loads → skeletons → data populates
  - Overdue alert banner shows when overdue > 0
  - 4 KPI tiles with correct values and conditional red on collection rate
  - Collection performance card with 3 progress bars + fee type breakdown (fixed labels)
  - Invoice status and payment method bars render
  - Aging report highlights non-zero buckets in red
  - Recent payments and invoices feeds render
  - Date filters work — dashboard data updates
  - CSV export works
  - Theme toggle, responsive, error boundaries
- Verify home page byFeeType labels now show correctly (Sprint 1 fix)
- **Acceptance:** Clean build for finance, all sections render, no filter regression

---

## Summary

| Sprint | SP | Key Deliverable |
|---|---|---|
| Sprint 1 | 16 | Shared infrastructure — extract V2 components, widen tokens, staff service, type updates, byFeeType fix, shared formatters |
| Sprint 2 | 14 | Academics V2 — page shell, 4 KPI tiles, attendance alerts, skeletons, error boundaries |
| Sprint 3 | 14 | Academics V2 — charts (attendance trend, enrollment), bottom row (at-risk, staff, snapshot) |
| Sprint 4 | 19 | Finance V2 — complete page (header, filters/export, alert, KPIs, performance, status, aging, activity feeds) |
| Sprint 5 | 12 | Polish — light theme, responsive, a11y, empty states, navigation, split integration tests |
| **Total** | **75 SP** | |

---

## Critical Implementation Notes

1. **MFE import boundary**: Module apps (academics, finance) MUST NOT import from `apps/shell/`. All shared code goes through `@edforge/ui`, `@edforge/types`, or other shared packages.

2. **CSS token inheritance**: V2 tokens are inherited via DOM. Module pages add `data-v2` attribute to their root element. Shell's global CSS applies the tokens.

3. **byFeeType fix is Sprint 1**: This bug affects the home page right now. Fix it in Sprint 1 before building Finance V2.

4. **Staff service is new**: No shared staff API hook exists. Task 1.6 creates one. Academics V2 depends on it for the staff roster card.

5. **Recharts theme reactivity**: Charts must re-render on theme toggle. Use `useThemeStore().resolvedTheme` to derive colors. Do NOT hardcode hex values in chart configs.

6. **formatFeeType utility**: Must be in a shared package so both home page (FinanceSummaryCard) and finance V2 overview use the same display names.

7. **Parallel data fetching**: Both pages must fetch all API data in parallel. Never waterfall — academic year → overview → alerts is NOT acceptable. Use `useQueries` or independent `useQuery` calls.

8. **Grade level sort order**: PK, K, 1, 2, 3, ... 12. Create a `gradeOrder` map for sorting: `{ PK: -2, K: -1, '1': 1, '2': 2, ... }`.

9. **NPR formatting consistency**: Use `formatNPRShort` from `@edforge/types` everywhere. If it doesn't produce "NPR X.XL" format, enhance it in Task 1.8.

10. **Reduced motion**: Every animation (count-up, progress bars, stagger, chart transitions) must respect `prefers-reduced-motion: reduce`.

11. **DashboardSummary type update is Sprint 1**: The `DashboardSummary` TypeScript interface is missing `agingReport`, `monthlyCollections`, `byFeeType` (array form), and `byGradeLevel`. Task 1.1b adds these. Without it, Finance V2 tasks will fail TypeScript compilation.

12. **Finance filters must not regress**: The current finance overview has functional date range filters, academic year filter, and CSV export. Task 4.1b preserves these. Omitting this task would be a functional regression.

13. **formatGatewayLabel and formatRelativeDate utilities**: Created in Task 1.7 alongside `formatFeeType`. These are needed by finance payment/invoice feed cards (Tasks 4.8, 4.9).

14. **Attendance rate calculation**: The API returns `attendanceRate` as `present/totalStudents` (not `present/totalRecorded`). When only 6 of 22 students are recorded and all 6 are present, the rate is 27.3% (not 100%). The "Partial data" tag in the KPI tile communicates this to users.

15. **Sidebar module nav**: Both modules render inside shell's `AppShell`. The sidebar configuration for module-specific nav items (academics vs. finance) needs verification — the existing sidebar may already support this via route-based nav, or may need updates.

---

## Sub-Agent Review Summary

A comprehensive review identified 43 issues. Key items incorporated:
- **Added** Task 1.1b (DashboardSummary type update) — blocker for Finance V2
- **Added** Task 4.1b (Finance filters & export) — prevents functional regression
- **Added** Task 1.10 (barrel export updates for @edforge/ui)
- **Split** Task 1.8 into 1.8a (NPR formatting) and 1.8b (attendance color)
- **Split** Task 5.7 into 5.7a (academics test) and 5.7b (finance test)
- **Fixed** enrollment chart colors to match prototype (count 2 → purple, not blue)
- **Renamed** "Recent overdue invoices" → "Recent invoices" (mixed statuses in API)
- **Added** `formatGatewayLabel`, `formatInvoiceStatus`, `formatRelativeDate` utilities to Task 1.7
- **Added** `useV2ChartColors` extraction to Task 1.2
- **Added** aging report responsive grid and ARIA labels
- **Added** edge case handling (0%/100% collection rate, no department staff, dynamic aging labels)
- **Fixed** dependency chains (granular task IDs instead of blanket "Sprint 1")
- **Added** package scaffolding sub-task for `packages/shared-services/`
- **Clarified** sidebar implementation notes for both modules
