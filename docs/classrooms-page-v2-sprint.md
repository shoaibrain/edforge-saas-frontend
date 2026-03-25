# EdForge Classrooms V2 — Sprint Completion Report

## Sprint Goal
Deliver a production-ready, fully styled EdForge V2 Classrooms page with KPI tiles on Overview, complete Gradebook redesign, and Attendance redesign — all fetching from live API, using V2 design tokens, and matching the prototype at `edforge_classrooms_v2_redesign.html`.

---

## Files Modified

| File | Changes |
|------|---------|
| `apps/academics/src/routes/classrooms/index.tsx` | Added Context Banner (CLS-003); imports `useGradeOverview`, `useAttendanceOverview` |
| `apps/academics/src/routes/grades/overview.tsx` | Complete V2 rewrite (CLS-005 through CLS-012) |
| `apps/academics/src/routes/attendance/index.tsx` | V2 sub-header + pill-style sub-tabs (CLS-013) |
| `apps/academics/src/routes/attendance/dashboard.tsx` | Complete V2 rewrite (CLS-014 through CLS-020) |

---

## Sprint 1 — Foundation & Overview KPI Tiles

### CLS-001 — Audit Classrooms page component tree
**Status:** DONE
Audited full component tree: `classrooms/index.tsx` → inline `OverviewTab`, `GradebookTab`, `ClassroomsModule`. Mapped all React Query hooks and data paths.

### CLS-002 — Add StatCard KPI row to Overview tab
**Status:** ALREADY IMPLEMENTED
KPI tiles (Total Sections, Total Students, Avg Utilization, Active Teachers) were already present using `StatCard` from `@edforge/ui` with `WidgetErrorBoundaryV2` wrapper.

### CLS-003 — Add context banner to Classrooms page
**Status:** DONE
- Added `ContextBanner` component between page header and tab navigation
- Dynamic content per active tab: Overview / Gradebook / Grading Policies / Attendance
- Color-coded `<em>` spans: info=#378ADD, success=#1D9E75, warning=#EF9F27, danger=#E24B4A
- Hooks are conditionally enabled per active tab (React Query deduplication)

### CLS-004 — Validate Overview tab responsive behavior
**Status:** DEFERRED — KPI tiles already responsive via existing grid layout.

---

## Sprint 2 — Gradebook Tab V2 Redesign

### CLS-005 — Redesign Gradebook KPI row
**Status:** DONE
Replaced local StatCard with `StatCard` from `@edforge/ui`. 4 KPIs: Students Graded, Average GPA, Pass Rate, At Risk. Wrapped in `WidgetErrorBoundaryV2`.

### CLS-006 — Redesign Grading Completion card
**Status:** DONE
V2 card chrome. Inline SVG donut ring (purple #7F77DD) with `stroke-dasharray/stroke-dashoffset`. Center text showing completion %. Right-side stats: Graded, Remaining, Total entries. Removed Recharts PieChart dependency.

### CLS-007 — Redesign Assessment Performance card
**Status:** DONE
Two 68px SVG gauges: Formative (green) + Summative (blue). Insight text from API delta. Unclassified note below.

### CLS-008 — Redesign Grade Distribution chart
**Status:** DONE
CSS bar chart with 5 bars (A/B/C/D/F). V2 colors: A=#1D9E75, B=#378ADD, C=#EF9F27, D=rgba(255,255,255,0.15), F=#E24B4A. Count labels above each bar.

### CLS-009 — Redesign Category Performance card
**Status:** DONE
Score bars with cycling category colors. Weight % from grading policy. All data from `categoryPerformance` array.

### CLS-010 — Redesign Course Performance table
**Status:** DONE
Simple HTML table with sortable columns. Color-coded Avg Grade and Pass Rate per V2 thresholds.

### CLS-011 — Redesign At-Risk Students section
**Status:** DONE
Avatar chips (28px, deterministic gradient from `getStudentGradient()`). Grade color-coding. Letter grade badges with red/amber backgrounds.

### CLS-012 — Gradebook tab layout composure
**Status:** DONE
Layout order: KPI → 2-col (Completion + Assessment) → Full-width Distribution → 2-col (Category + Course) → Full-width At-Risk.

---

## Sprint 3 — Attendance Tab V2 Redesign

### CLS-013 — Attendance sub-header and sub-tab chrome
**Status:** DONE
- Sub-header: 32px amber icon square (#EF9F27) + "Attendance" 15px/600 + subtitle + "Last updated" + Export portal
- Sub-tabs: V2 pill-style with active state `background:rgba(55,138,221,0.10); border:rgba(55,138,221,0.20); color:#378ADD`
- Removed old Tailwind gradient header and border-bottom chrome

### CLS-014 — Redesign Today Summary strip
**Status:** DONE
V2 single-row strip with 4 stats (Present/Absent/Late/Excused) + vertical divider + School Average section with trend badges. Trend badges conditionally colored green/red.

### CLS-015 — Redesign DOW Pattern as bar chart
**Status:** DONE
6-column mini bar chart (Sun–Fri). Bar heights proportional to `avgRate`. Lowest day highlighted in red (#E24B4A). Insight text below. Replaced old heatmap-style badges.

### CLS-016 — Redesign 30-Day Trend chart
**Status:** DONE
Full-width inline SVG area chart. Dynamic x-positions from actual `trend[].date` values (fixes hardcoded date bug). Gradient fill #1D9E75. Last two points highlighted. Card header shows 7-day and 30-day averages. Removed Recharts AreaChart dependency.

### CLS-017 — Redesign Section Completion
**Status:** DONE
Inline SVG donut ring (72x72px, purple #7F77DD when > 0%). Center % + "X / Y" sub-label. Right-side scrollable section list with status chips: "Not Started" (ghost), "Partial" (amber), "Complete" (green).

### CLS-018 — Add Period Averages card
**Status:** DONE
3 mini KPI tiles (7-Day, 30-Day, Yearly) in grid. 7-Day colored green, others muted. Contextual insight note about trend direction.

### CLS-019 — Redesign Attendance Alerts table
**Status:** DONE
Full-width card with sortable columns (Student+Grade, Rate, Absent, Total, Trend). Rate severity colors: <60% red (critical), 60–79% amber (warn), ≥80% muted (ok). Grade level as sub-text. Student name clickable for drill-down modal.

### CLS-020 — Attendance tab layout composure
**Status:** DONE
Layout: Today Strip → 2-col (Breakdown + DOW) → Full-width Trend → 2-col (Completion + Averages) → Full-width Alerts. All sections wrapped in `WidgetErrorBoundaryV2`.

---

## Design System Compliance

| Check | Status |
|-------|--------|
| V2 design tokens (CSS vars with fallbacks) | PASS |
| No KPI tile rebuilt from scratch (uses `StatCard` from `@edforge/ui`) | PASS |
| `WidgetErrorBoundaryV2` wraps all KPI groups and card sections | PASS |
| `useCountUp` on numeric KPI values (built into StatCard) | PASS |
| No `position: fixed` anywhere | PASS |
| Tab active color = #378ADD | PASS |
| No Recharts in grades/overview.tsx (inline SVG) | PASS |
| No Recharts in attendance/dashboard.tsx (inline SVG) | PASS |
| All Tailwind classes replaced with V2 inline styles | PASS |
| TanStack Table NOT rebuilt | PASS |
| DiceBear logic NOT changed | PASS |

---

## Sprint 4 — Deferred / Future

| Task | Status | Notes |
|------|--------|-------|
| CLS-021 — Trend chart date fix verification | Addressed in CLS-016 | Dates are now dynamic from API |
| CLS-022 — Storybook stories | DEFERRED | Lower priority |
| CLS-023 — Storybook stories (attendance) | DEFERRED | Lower priority |
| CLS-024 — E2E tests | DEFERRED | Lower priority |
| CLS-025 — Write sprint plan | THIS FILE | |

---

## TypeScript Verification
All modified files pass `tsc --noEmit` with zero errors.
