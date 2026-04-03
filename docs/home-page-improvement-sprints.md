# EdForge Home Page — Sprint Plan

## Context

The EdForge home page serves as the primary command center for school administrators, teachers, and students. The current V2 admin dashboard is feature-complete but has several production bugs and UX gaps:

1. **Stats cards show "---"** — `getCurrentAcademicYear` in `home.service.ts` called the wrong URL path (`/academics/schools/...` instead of `/schools/...`), preventing `academicYearId` from being populated, which disabled the unified dashboard query.
2. **Greeting showed email prefix** — Shell context only synced assignments from `/api/users/me`, never name fields.
3. **CSV export returned "Unauthorized"** — `window.open()` creates a new browser context without auth headers.
4. **Quick Actions section is low-value** — Static links that duplicate sidebar navigation.
5. **Attendance by Section shows fake data** — Hardcoded even/odd for Taken/Pending status instead of real API data.
6. **Teacher/Student dashboards still use legacy layout** — Not yet migrated to V2 design tokens.

### What's Already Fixed (Pre-Sprint)

- Stats cards URL fix (`/schools/...` path correction)
- Greeting name merging (shell-context.tsx syncs `firstName`/`lastName`/`displayName`)
- CSV export authentication (fetch-based download with JWT headers)
- Quick Actions removed from admin layout
- Attendance by Section card uses real `/academics/attendance/overview` API
- Attendance by Section card now shows student count, recorded count, completion status

### Parallelization Note

Sprints 2 and 3 have **no mutual dependencies** and can be developed in parallel by different developers. Sprint 4 depends on Sprints 1–3 being complete.

---

## Sprint 1: Data Reliability, Debug Tooling & Foundation

**Goal:** All admin dashboard KPIs, charts, and section data render correctly from real API data. Zero placeholder/hardcoded values remain. Debug tooling and a skeleton integration test are in place.

**Demoable outcome:** Admin logs in → sees real numbers in all 4 KPI cards, accurate section attendance status, and working attendance trend chart. React Query devtools available in dev mode.

### Ticket 1.1: Add React Query devtools (moved from Sprint 4)

**Files:** `apps/shell/src/App.tsx` or equivalent root

- Add `ReactQueryDevtools` in development mode only
- Verify all home page query keys are properly namespaced under `['home', ...]`
- Verify no duplicate queries are running

**Verification:** Open React Query devtools → see all home queries with proper keys, no duplicates, correct stale/fresh states.

---

### Ticket 1.2: Add debug logging and exponential backoff to snapshot queries

**Files:** `apps/shell/src/hooks/useHomeData.ts`

- Add `DEBUG` flag (same pattern as academics MFE: `localStorage.getItem('edforge-debug')`)
- Log query strategy (unified vs fallback) when it changes
- Log individual fallback query states when fallback is active
- Log data consistency warnings when unified response has null enrollment/attendance
- Add `retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000)` to all snapshot queries (dashboard, enrollment, attendance, sections fallbacks)

**Verification:** Set `localStorage.setItem('edforge-debug', 'true')`, reload home page, confirm debug messages in console. Throttle network → observe increasing retry delays.

---

### Ticket 1.3a: Refactor `useAcademicsSnapshot` per-field availability flags

**Files:** `apps/shell/src/hooks/useHomeData.ts`

- When `dashboard.isSuccess && dashboard.data`, derive per-field availability:
  - `hasEnrollment = dashboard.data.enrollment != null`
  - `hasAttendance = dashboard.data.attendance != null`
  - `hasSections = dashboard.data.activeSectionsCount != null`
- Use these flags to determine which fallback queries need to run (instead of all-or-nothing based on `dashboard.isError`)

**Verification:** Unit test: mock unified response with `enrollment: null` → verify `hasEnrollment` is false while other flags are true.

---

### Ticket 1.3b: Wire conditional fallback queries for partial unified responses

**Files:** `apps/shell/src/hooks/useHomeData.ts`

- Change fallback `enabled` from `enabled && unifiedFailed` to also include `enabled && dashboard.isSuccess && !hasEnrollment` (per field)
- Merge: if unified has a field, use it; otherwise use fallback data for that field
- Preserve existing all-fail fallback logic when `dashboard.isError`

**Verification:** Mock unified endpoint returning `{ enrollment: null, activeSectionsCount: 3, attendance: null }` → verify enrolled count and attendance rate populate from individual fallback queries while sections count comes from unified.

---

### Ticket 1.4: Fix `teacherSections` query key to include `academicYearId`

**Files:** `apps/shell/src/hooks/useHomeData.ts`

- Current bug: `homeKeys.teacherSections(schoolId!)` doesn't include `academicYearId`
- The query function passes `academicYearId` to the API, but cached data won't refresh when the year changes
- Add `academicYearId` to the query key: `homeKeys.teacherSections(schoolId!, academicYearId)`

**Verification:** Switch academic year in settings → teacher sections list updates immediately without stale cache.

---

### Ticket 1.5: Add query cache invalidation on school switch

**Files:** `apps/shell/src/hooks/useHomeData.ts` or `apps/shell/src/pages/HomePage.tsx`

- When `activeSchoolId` changes, invalidate all home queries using `queryClient.removeQueries({ queryKey: homeKeys.all })`
- Prevents stale data from a previous school bleeding into the new school's dashboard

**Verification:** Switch between two schools → KPI data refreshes immediately, no stale data from the previous school.

---

### Ticket 1.6: Fix `getCurrentAcademicYear` silent error swallowing

**Files:** `apps/shell/src/services/home.service.ts`

- Current code catches ALL errors and returns `null`, making it impossible to distinguish "no academic year" from "server down"
- Change: only catch 404 (no academic year) → return `null`. Re-throw all other errors so React Query can properly show loading/error states.
- Alternatively, return a discriminated union: `{ found: false }` vs `{ found: true, data: AcademicYearResponse }`

**Verification:** Simulate 500 server error → `useHomeAcademicYear` shows error state instead of silently returning null.

---

### Ticket 1.7: Verify all home page API endpoint paths against backend API spec

**Files:** `apps/shell/src/services/home.service.ts`, `docs/tenant-api.json`

- Cross-reference every URL in `home.service.ts` against the API spec in `docs/tenant-api.json`
- Verify parameter names match
- Document any discrepancies in a table

**Verification:** All endpoint URLs in `home.service.ts` match corresponding paths in `tenant-api.json`.

---

### Ticket 1.8: Skeleton integration test for AdminCommandCenter

**Files:** `apps/shell/src/__tests__/home.integration.test.tsx` (new)

- Set up test with mocked providers (React Query, Router, Shell Context)
- Mock all API responses with realistic data shapes
- Assert:
  - KPI cards show formatted numbers (not the "—" em-dash character)
  - Section attendance table renders with status badges
  - No console errors
- This skeleton will be expanded in subsequent sprints

**Verification:** `npm test -- --testPathPattern=home.integration` passes.

---

### Ticket 1.9: Type-check shell app with zero errors

**Files:** All shell TypeScript files

- Run `npx tsc --noEmit --project apps/shell/tsconfig.json`
- Fix any type errors introduced by recent changes
- Remove the `as any` cast in `useFinanceSummary` (line 373) — add a proper type for `useDashboardSummary`'s return

**Verification:** `tsc --noEmit` exits with code 0 and no errors. No `as any` casts in `useHomeData.ts`.

---

## Sprint 2: Attendance by Section Enhancement

**Goal:** The classroom attendance table becomes the primary operational tool for admins to see daily section health at a glance.

**Demoable outcome:** Admin sees a full-width table with section name, student count, recorded count, attendance rate per section, and completion status. Clicking a section navigates to its attendance page. Table is accessible with screen readers.

### Ticket 2.1: Add per-section attendance rate to `AttendanceOverviewResponse`

**Files:** `apps/shell/src/services/home.service.ts`, `apps/shell/src/hooks/useHomeData.ts`

- Extend `SectionCompletionItem` to include `attendanceRate?: number`
- If the backend `/academics/attendance/overview` response includes this field, add it to the type
- If not available, compute from `recordedCount` and `studentCount` (note: this gives completion rate, not attendance rate — flag if backend needs to add present/absent counts)

**Verification:** Console log the overview response → confirm `attendanceRate` is available or correctly computed per section.

---

### Ticket 2.2: Add attendance rate column to `AttendanceBySectionCard`

**Files:** `apps/shell/src/components/home/AttendanceBySectionCard.tsx`

- Add "Rate" column between "Recorded" and "Status"
- Color coding:
  - Green (>= 90%): `var(--v2-brand-primary)`
  - Amber (75-89%): `var(--v2-warning)`
  - Red (< 75%): `var(--v2-danger)`
- Show "—" if rate is not available

**Verification:** Visual inspection + RTL unit test asserting correct color class for each rate tier.

---

### Ticket 2.3: Make section rows clickable (navigate to section attendance)

**Files:** `apps/shell/src/components/home/AttendanceBySectionCard.tsx`

- Wrap each table row with navigation to `/academics/classrooms/${sectionId}?tab=attendance`
- Add hover state: `background: var(--v2-bg-elevated)`
- Ensure keyboard accessible (focusable rows, Enter to navigate)
- Verify cross-MFE deep link resolves correctly via academics MFE splat route

**Verification:** RTL test: render card, click row, assert router navigation. Manual: click row → correct section opens in academics MFE.

---

### Ticket 2.4: Add section summary header bar

**Files:** `apps/shell/src/components/home/AttendanceBySectionCard.tsx`

- Below the card title, add a compact summary bar:
  - Total sections count
  - "5/8 sections recorded" format
  - Overall attendance rate for the day

**Verification:** Summary bar counts match section rows below it.

---

### Ticket 2.5: Add empty state for no academic year

**Files:** `apps/shell/src/components/home/AttendanceBySectionCard.tsx`

- When `academicYearId` is undefined, show:
  "No active academic year. Set up an academic year in Settings to see classroom data."
- Include a link to `/settings/academic-years`

**Verification:** Remove the active academic year → card shows the empty state with settings link.

---

### Ticket 2.6: Add table accessibility (a11y) to `AttendanceBySectionCard`

**Files:** `apps/shell/src/components/home/AttendanceBySectionCard.tsx`

- Add `<caption>` element (visually hidden) describing the table purpose
- Add `scope="col"` to all `<th>` elements
- Ensure all rows are keyboard-navigable if clickable (Ticket 2.3)
- Add `aria-label` to status badges ("Attendance taken" / "Attendance pending")

**Verification:** Run axe-core accessibility audit on the card → zero violations. Navigate table with keyboard → all rows focusable.

---

## Sprint 3: Teacher & Student Dashboard V2 Migration

**Goal:** Teacher and Student dashboards use V2 design tokens and layout patterns, consistent with the admin dashboard.

**Demoable outcome:** Teacher logs in → sees V2-styled section cards with attendance status and KPI tiles. Student logs in → sees V2-styled welcome card.

### Ticket 3.1: Migrate TeacherDashboard to V2 layout wrapper

**Files:** `apps/shell/src/components/home/TeacherDashboard.tsx`, `apps/shell/src/pages/HomePage.tsx`

- Replace `DynamicPageLayout` wrapper with V2 `motion.div` container (same as AdminCommandCenter)
- Apply `data-page="home-v2"` attribute for V2 CSS custom property scoping
- Keep `SectionErrorBoundary` wrapping for error isolation
- Add `prefers-reduced-motion` check for stagger animation

**Verification:** Login as teacher → page renders with V2 background, spacing, and border tokens. Toggle "Reduce motion" in OS settings → animations disabled.

---

### Ticket 3.2: Redesign MySectionsCard with V2 tokens

**Files:** `apps/shell/src/components/home/MySectionsCard.tsx`

- Replace hardcoded colors (amber, purple) with V2 CSS custom properties
- Use `rounded-xl border` pattern matching other V2 cards
- Add enrollment count and active indicator per section
- Show section attendance status (Taken/Pending) if available
- Add ARIA labels to section list items

**Verification:** Visual comparison with admin dashboard cards → consistent typography, colors, borders, spacing. axe audit → zero violations.

---

### Ticket 3.3: Add teacher KPI tiles

**Files:** `apps/shell/src/components/home/TeacherDashboard.tsx`, `apps/shell/src/hooks/useHomeData.ts`

- Add 3 KPI tiles:
  - "My Sections" — count of assigned sections
  - "Total Students" — sum of `currentEnrollment` across sections
  - "Today's Attendance" — attendance rate for teacher's sections (filter from attendance overview)
- Reuse `HomeStatCard` component
- Data flows through `useHomeTeacherSections` and `useSectionAttendanceItems`

**Verification:** Teacher sees 3 KPI tiles with real numbers above their section list.

---

### Ticket 3.4: Add teacher section attendance detail

**Files:** `apps/shell/src/components/home/TeacherDashboard.tsx`

- For each assigned section show: name, course, attendance status, student count, link to take/view attendance
- Reuse `AttendanceBySectionCard` component with teacher's sections filtered
- All data must flow through shell's own hooks, NOT academics MFE internal imports (Module Federation boundary)

**Verification:** Teacher sees sections with real attendance status. "Take Attendance" link navigates to correct section.

---

### Ticket 3.5a: Migrate StudentDashboard layout to V2 wrapper

**Files:** `apps/shell/src/components/home/StudentDashboard.tsx`, `apps/shell/src/pages/HomePage.tsx`

- Replace `DynamicPageLayout` with V2 container
- Replace static quick actions with a welcome card + relevant links
- This is purely a styling migration, always demoable regardless of backend API availability

**Verification:** Student login → V2-styled dashboard with consistent look/feel.

---

### Ticket 3.5b: Add student KPI tiles (backend-dependent)

**Files:** `apps/shell/src/components/home/StudentDashboard.tsx`, `apps/shell/src/hooks/useHomeData.ts`

- If student-specific APIs exist (`/academics/students/:id/attendance-summary`, `/academics/students/:id/grades-summary`), add KPI tiles for attendance and grade average
- If APIs don't exist, skip this ticket and create a backend task instead
- **Prerequisite:** Verify endpoint availability before starting

**Verification:** Student sees KPI tiles with real data, or ticket is explicitly deferred with a backend dependency logged.

---

### Ticket 3.6: Parent Dashboard V2 (or explicit deferral)

**Files:** `apps/shell/src/pages/HomePage.tsx`

- Currently renders `<QuickActionsWidget />` for parents
- Either: create a `ParentDashboard` with V2 styling showing child's attendance/grades
- Or: explicitly defer to a future sprint with documented rationale

**Verification:** Parent login → V2-styled page, or deferral documented in this plan.

---

## Sprint 4: Resilience, Performance & Observability

**Goal:** Home page is production-hardened with graceful degradation, performance optimization, monitoring, and full test coverage.

**Demoable outcome:** Simulate API failures → each card shows error/retry state. Page loads under 2 seconds on 3G. Debug mode shows query telemetry. Light/dark themes both render correctly.

### Ticket 4.1: Add per-card error states with retry

**Files:** `apps/shell/src/components/home/HomeStatCard.tsx` (or its source in `@edforge/ui`)

- When `error=true`, show a subtle error indicator with "Retry" button
- Animate transition between loading → error → data states
- Retry triggers the correct `refetch` for that specific data source

**Verification:** Block individual API endpoints → affected cards show error state. Click retry → card refetches.

---

### Ticket 4.2: Add stale data indicator and offline handling

**Files:** `apps/shell/src/hooks/useHomeData.ts`, `apps/shell/src/components/home/AdminCommandCenter.tsx`

- When any query's `dataUpdatedAt` is older than `staleTime`, show "updating..." indicator
- Add "Refresh All" action in the page header
- When browser goes offline (`navigator.onLine === false`), show a subtle "Viewing cached data" banner
- Track last-refreshed timestamp in the home store

**Verification:** Wait for stale time → see "updating..." flash. Go offline → see cached data banner.

---

### Ticket 4.3: Add error telemetry to `SectionErrorBoundary`

**Files:** `apps/shell/src/components/home/SectionErrorBoundary.tsx`

- Currently only does `console.error('[SectionErrorBoundary]', error)`
- Add error reporting to monitoring service (Sentry, Vercel Analytics, or custom endpoint)
- In debug mode, show error stack details in the UI
- Reset boundary key on route change

**Verification:** Trigger a component error → verify telemetry event is sent. In debug mode → stack trace visible in UI.

---

### Ticket 4.4: Day-change detection for date-based queries

**Files:** `apps/shell/src/hooks/useHomeData.ts`

- `getTodayISO()` is memoized with `useMemo(() => ..., [])` — never updates if browser stays open past midnight
- Implement a date-change detector that invalidates stale date-based queries when the day rolls over
- Options: `setInterval` check every 60s, or `requestAnimationFrame` comparing cached vs current date

**Verification:** Mock time to 11:59pm → advance to 12:01am → verify date-based queries refetch with new date.

---

### Ticket 4.5: Light theme audit for home page

**Files:** `packages/theme/src/base.css`, all home components

- Switch to light theme → verify all V2 tokens render correctly
- Fix any hardcoded dark-theme colors (e.g., `rgba(255,255,255,0.06)`)
- Ensure chart colors are readable in light mode

**Verification:** Toggle light/dark → all cards, charts, text are legible and styled in both themes.

---

### Ticket 4.6: Responsive layout audit

**Files:** `apps/shell/src/components/home/AdminCommandCenter.tsx`, all home cards

- Test at breakpoints: 320px, 768px, 1024px, 1440px
- Verify KPI grid collapses 4-col → 2-col → 1-col
- Verify bottom row stacks vertically on mobile
- Fix any overflow issues in the attendance table

**Verification:** Chrome DevTools responsive mode → clean layout at all breakpoints. No horizontal scroll, no truncation.

---

### Ticket 4.7: Add `prefers-reduced-motion` support

**Files:** `apps/shell/src/components/home/AdminCommandCenter.tsx`, `TeacherDashboard.tsx`

- Wrap Framer Motion stagger animations with a `prefers-reduced-motion` check
- When reduced motion is preferred, skip all entrance animations (instant render)
- Affects `staggerContainer`, `sectionVariants`, progress bar fill animations

**Verification:** Enable "Reduce motion" in OS settings → all sections render instantly without stagger/fade.

---

### Ticket 4.8: Expand integration test to cover all sprints

**Files:** `apps/shell/src/__tests__/home.integration.test.tsx`

- Expand the skeleton test from Sprint 1 to cover:
  - KPI cards with formatted numbers
  - Attendance chart with data points
  - Finance card with currency formatting
  - Section attendance table with real status badges
  - Alert row when thresholds are breached
  - Error states when APIs fail
  - Fallback behavior when unified endpoint returns partial data
- Add to CI pipeline

**Verification:** `npm test -- --testPathPattern=home.integration` passes with all assertions.

---

### Ticket 4.9: i18n extraction for V2 home components

**Files:** All home components, `packages/i18n/src/locales/en/dashboard.json`, `packages/i18n/src/locales/ne/dashboard.json`

- Extract all hardcoded English strings in V2 home components to i18n keys:
  - `AdminCommandCenter.tsx`: "Students enrolled", "Active sections", "Today's attendance", "Outstanding fees"
  - `AttendanceBySectionCard.tsx`: "Classroom attendance", "completed", "Section", "Students", "Recorded", "Status", "Taken", "Pending"
  - `FinanceSummaryCard.tsx`: "Financial overview", "Collected", "Outstanding", "Overdue"
  - `AlertsRow.tsx`: "Review billing", "View students"
  - `AttendanceTrendCard.tsx`: "Attendance trend", "30-day rolling average"
  - `RecentActivityFeed.tsx`: "Recent activity", "No recent activity"
- Add corresponding Nepali translations to `ne/dashboard.json`

**Verification:** Switch language to Nepali → all home page strings render in Nepali. Switch back → English renders correctly.

---

## Sprint Summary

| Sprint | Focus | Tickets | Key Deliverable | Parallelizable |
|--------|-------|---------|-----------------|----------------|
| 1 | Data Reliability & Foundation | 1.1–1.9 | All KPIs real, debug tooling, skeleton test, cache correctness | — |
| 2 | Section Enhancement | 2.1–2.6 | Full-width section table with rate, clickable rows, a11y | Yes (with Sprint 3) |
| 3 | Role Migration | 3.1–3.6 | Teacher & Student dashboards on V2 design system | Yes (with Sprint 2) |
| 4 | Production Hardening | 4.1–4.9 | Error states, performance, themes, responsive, tests, i18n | Depends on 1–3 |

## Known Technical Risks

| Risk | Mitigation |
|------|-----------|
| `useHomeData.ts` is the highest-conflict file (8+ tickets modify it) | Serialize tickets 1.2–1.6 on the same branch. Review before merging Sprint 2/3 changes. |
| Ticket 2.1 may require backend API change for `attendanceRate` per section | Verify backend response shape first. Fall back to completion rate if needed. |
| Module Federation boundary: teacher dashboard must NOT import academics MFE internals | All data flows through shell's `useHomeData.ts` hooks only. |
| `MySectionsCard` deep links use splat routes | Verify cross-MFE deep links resolve in Ticket 3.2. |
| `useFinanceSummary` uses `as any` cast | Fix in Ticket 1.9 — add proper type for finance response. |
| Recharts gradient ID collision if chart is reused | Use `useId()` hook for gradient IDs when adding charts to teacher dashboard. |

## Key Files Reference

| File | Purpose |
|------|---------|
| `apps/shell/src/services/home.service.ts` | API wrapper — all home page endpoints |
| `apps/shell/src/hooks/useHomeData.ts` | React Query hooks — data fetching & transformation |
| `apps/shell/src/components/home/AdminCommandCenter.tsx` | Admin layout — orchestrates all sections |
| `apps/shell/src/components/home/AttendanceBySectionCard.tsx` | Section attendance table |
| `apps/shell/src/components/home/TeacherDashboard.tsx` | Teacher role home page |
| `apps/shell/src/components/home/StudentDashboard.tsx` | Student role home page |
| `apps/shell/src/components/home/MySectionsCard.tsx` | Teacher's section cards |
| `apps/shell/src/stores/home.store.ts` | Zustand store — alert count, active year |
| `apps/shell/src/pages/HomePage.tsx` | Route page — role-based component selection |
| `apps/shell/src/lib/shell-context.tsx` | Shell context — user profile sync |
| `packages/i18n/src/locales/en/dashboard.json` | English i18n strings for dashboard |
| `packages/i18n/src/locales/ne/dashboard.json` | Nepali i18n strings for dashboard |
| `docs/tenant-api.json` | Backend API spec — endpoint reference |
