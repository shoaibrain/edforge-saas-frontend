# EdForge Classrooms V2 — Sprint Plan & Agent Prompt
# Academics → Classrooms: Overview KPI, Gradebook, Attendance Redesign

---

## DESIGN ANALYSIS SUMMARY

### What Was Audited

**Classrooms Overview Tab (Current State):**
- ✅ Sections table working — Ed-Fi compliant data, filters, search, enrollment progress bars, sort
- ❌ Missing KPI tiles — 4 tiles (Total Sections, Total Students, Avg Utilization, Active Teachers) exist in prototype but were not implemented in production code
- ❌ No context banner driving insight from data

**Gradebook Tab (Current State):**
- ✅ Data is all correctly fetched and rendered — grade analytics, grading completion donut, assessment performance gauges, grade distribution bar chart, category performance, course performance table, at-risk students table, section gradebook selector
- ❌ Broken visual hierarchy — cards have inconsistent padding, headers, and structure
- ❌ No V2 design token compliance — colors, typography, spacing out of system
- ❌ Section headers, card chrome, and data layout do not match EdForge V2 component specs
- ❌ Assessment performance gauges sized and labeled inconsistently
- ❌ Category performance table lacks aligned score bars and data density of V2 standard
- ❌ At-risk students section missing avatar chips, grade color-coding, letter grade badges
- ❌ Grade distribution chart missing count labels above bars and V2 color coding per range

**Attendance Tab (Current State):**
- ✅ Data is correctly fetched — today summary, section completion, 30-day trend, at-risk students, DOW pattern, period averages
- ❌ Sub-header/sub-section chrome doesn't match V2 design system
- ❌ Today's summary strip uses raw colored boxes instead of V2 KPI-style stat layout
- ❌ DOW pattern displayed as text badges not as a mini bar chart — loses visual insight
- ❌ Section Completion uses basic list without donut ring completion indicator
- ❌ 30-day attendance trend chart x-axis dates are incorrect (showing Nov/Dec dates, not Feb-Mar 2026 data)
- ❌ At-risk alerts table missing grade level, severity color gradation (critical/warn/ok)
- ❌ Period averages (7-day, 30-day, yearly) have no dedicated visual section

### V2 Prototype Reference
The authoritative visual target for this sprint is:
```
/edforge-saas-frontend/edforge_classrooms_v2_redesign.html
```
This prototype demonstrates all three redesigned tabs with correct V2 design tokens, component specs, and data presentation. Every implementation decision must reference this file.

---

## AGENT PROMPT FOR CLAUDE CODE OPUS

```
You are a senior full-stack engineer implementing EdForge V2 design system changes for the Academics → Classrooms page. Before writing a single line of code, you MUST:

STEP 1 — AUDIT
  Read: apps/academics/src/pages/ClassroomsPage.tsx (or equivalent shell)
  Read: apps/academics/src/components/classrooms/ (all files)
  Read: apps/academics/src/hooks/useClassroomsData.ts (or React Query hooks)
  Read: apps/academics/src/components/classrooms/tabs/ (Overview, Gradebook, GradingPolicies, Attendance)
  Read the EdForge V2 Design System Master Context Document in full
  Read: /edforge-saas-frontend/edforge_classrooms_v2_redesign.html (the AUTHORITATIVE visual prototype)

STEP 2 — PLAN (output your plan, don't implement yet)
  For each tab, state EXACTLY what files you will touch and what you will change.
  Confirm: "I will NOT rebuild TanStack Table. I will only modify/add cell renderers."
  Confirm: "I will NOT change any DiceBear logic."

STEP 3 — SUB-AGENT REVIEW
  Output your full plan. A sub-agent will review it. Wait for approval before implementing.
  The sub-agent must verify:
  - All V2 design tokens are referenced correctly (see Master Context Section 3)
  - No KPI tile is being rebuilt from scratch (use StatCard from @edforge/ui)
  - SectionErrorBoundary wraps all KPI groups
  - useCountUp is used on all numeric KPI values
  - No position:fixed anywhere in drawer/overlay code
  - Tab active color = #378ADD (Classrooms module accent)

STEP 4 — IMPLEMENT (after sub-agent approval)
  Implement one tab at a time. Build → validate → next tab.
  Validation criteria listed per sprint task below.

STEP 5 — WRITE SPRINT PLAN FILE
  After all implementation, write the completed sprint plan to:
  docs/classrooms-page-v2-sprint.md

DO NOT rebuild TanStack Table. DO NOT change DiceBear logic.
```

---

## SPRINT PLAN

### Sprint Goal
Deliver a production-ready, fully styled EdForge V2 Classrooms page with KPI tiles on Overview, complete Gradebook redesign, and Attendance redesign — all fetching from live API, using V2 design tokens, and matching the prototype at `edforge_classrooms_v2_redesign.html`.

---

### SPRINT 1 — Foundation & Overview KPI Tiles

**Sprint 1 Deliverable:** Classrooms Overview tab is visually complete with V2 KPI tiles above the existing sections table. Page is demoable and matches prototype row 1.

---

#### TASK CLS-001 — Audit Classrooms page component tree
**Type:** Chore / Research  
**Files:** `apps/academics/src/pages/ClassroomsPage.tsx`, `apps/academics/src/components/classrooms/`  
**Work:**
- Map full component tree: ClassroomsPage → tab routing → each tab component
- Identify which React Query hooks supply data for Overview (sections list, student counts, utilization)
- Identify which hooks supply data for Gradebook (grades overview, grading policies, sections)
- Identify which hooks supply data for Attendance (attendance overview, section completion, trend)
- Document every component file that will be touched this sprint
- Output audit findings as code comments in `ClassroomsPage.tsx`

**Validation:** PR description lists every file touched, maps hook → component → rendered data path. Reviewable before implementation starts.

---

#### TASK CLS-002 — Add StatCard KPI row to Overview tab
**Type:** Feature  
**Files:** `apps/academics/src/components/classrooms/tabs/ClassroomsOverviewTab.tsx`  
**Work:**
- Import `StatCard`, `SectionErrorBoundary`, `useCountUp` from `@edforge/ui`
- Add a 4-column KPI grid (`gap: 10px`) above the filter strip and sections table
- **KPI 1 — Total Sections:** value=`sectionCount`, accent=#378ADD, icon=classroom SVG, tag="active classrooms"
- **KPI 2 — Total Students:** value=`totalEnrolled`, accent=#1D9E75, icon=users SVG, tag="across all sections"  
- **KPI 3 — Avg Utilization:** value=`avgUtilization%`, accent=#EF9F27, icon=activity SVG, tag="of seat capacity"
- **KPI 4 — Active Teachers:** value=`activeTeachers`, accent=#7F77DD, icon=team SVG, tag="assigned sections"
- Wrap the 4-card group in `<SectionErrorBoundary>`
- All numeric values use `useCountUp`
- Derive all values from existing sections API response (`/api/academics/sections`)

**Validation:**
- `npm test -- --testPathPattern classrooms-overview` passes
- Visual: 4 KPI tiles appear above the filter strip, matching prototype row 1
- Values animate on mount (useCountUp)
- Error boundary renders gracefully if data is undefined

---

#### TASK CLS-003 — Add context banner to Classrooms page
**Type:** Feature  
**Files:** `apps/academics/src/pages/ClassroomsPage.tsx`  
**Work:**
- Below page header, above tab bar: render a single-line context banner (11px, `var(--text-muted)`)
- Banner content changes per active tab:
  - Overview: "{count} active sections across {courses} courses — {students} students enrolled, avg utilization {pct}%."
  - Gradebook: "{atRisk} students at risk — concentrated in {worstCourse}. {passingCourses} at 100% pass rate. Grading {completionPct}% complete."
  - Attendance: "{recorded} of {total} students recorded today. 7-day avg {7day}% vs 30-day {30day}%."
- Accent colors: success=green, warning=amber, danger=red, info=blue (per V2 spec)
- No card, no border — plain text line

**Validation:**
- Banner text is visible and correct for each tab
- Color-coded `<em>` spans match V2 semantic colors
- No layout shift when tab changes

---

#### TASK CLS-004 — Validate Overview tab responsive behavior
**Type:** QA / Polish  
**Files:** `apps/academics/src/components/classrooms/tabs/ClassroomsOverviewTab.tsx`  
**Work:**
- KPI grid: `repeat(2, 1fr)` at ≤1024px, `repeat(1, 1fr)` at ≤768px
- Filter strip and table scroll horizontally at ≤768px
- Run Storybook snapshot if available

**Validation:**
- Manual test at 1440px, 1024px, 768px widths — no overflow, no clipping
- Enrollment progress bars render at all breakpoints

---

### SPRINT 2 — Gradebook Tab V2 Redesign

**Sprint 2 Deliverable:** Gradebook tab fully redesigned with correct V2 design tokens, card chrome, data density, and visual hierarchy. All existing data preserved. Section gradebook selector remains functional.

---

#### TASK CLS-005 — Redesign Gradebook KPI row
**Type:** Refactor  
**Files:** `apps/academics/src/components/classrooms/tabs/GradebookTab.tsx` (or equivalent)  
**Work:**
- Replace existing KPI section with 4 `StatCard` components in `repeat(4,1fr)` grid
- **KPI 1 — Students Graded:** value=`totalStudentsGraded`, accent=#378ADD, sub="X of 10 sections graded"
- **KPI 2 — Average GPA:** value=`averageGpa` (1 decimal), accent=#1D9E75, sub="Avg grade: {avgGrade}%"
- **KPI 3 — Pass Rate:** value=`passRate%`, accent=#1D9E75, sub="Students scoring 60%+"
- **KPI 4 — At Risk:** value=`atRiskCount`, accent=#E24B4A, sub="Below 60% threshold"
- Wrap in `<SectionErrorBoundary>`, use `useCountUp` on all numerics

**Validation:** KPI row matches prototype `edforge_classrooms_v2_redesign.html` Gradebook section row 1. Unit tests for StatCard prop rendering.

---

#### TASK CLS-006 — Redesign Grading Completion card
**Type:** Refactor  
**Files:** `GradebookTab.tsx`  
**Work:**
- Card chrome: `background:var(--bg-surface); border:1px solid var(--border-default); border-radius:10px`
- Card header: `padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.05)` — 22px icon square (purple) + "Grading Completion" 12px/600 + subtitle 10px ghost
- Card body: SVG donut ring (purple `#7F77DD`) showing completion %, center text = pct% + "graded"
- Right side stats: Graded count, Remaining count, total entries row
- Remove any old donut library; use inline SVG with correct `stroke-dasharray` calculation

**Formula:** `dasharray = 2π × r`, `dashoffset = dasharray × (1 - completionRate/100)`

**Validation:** Donut renders at correct percentage. Card header matches V2 spec. No third-party charting library for this simple donut.

---

#### TASK CLS-007 — Redesign Assessment Performance card
**Type:** Refactor  
**Files:** `GradebookTab.tsx`  
**Work:**
- Side-by-side gauges: Formative (green) + Summative (blue), each 68×68px SVG donut
- Below each gauge: type label 11px/600 + subtitle 9px ghost
- Right panel: insight text from API delta (formative vs summative score diff)
- Unclassified note: "+51 unclassified (avg X%)" in 9px ghost

**Validation:** Both gauges render correct percentages from API `assessmentBreakdown.formative.avgScore` and `assessmentBreakdown.summative.avgScore`. Two-col layout at all breakpoints.

---

#### TASK CLS-008 — Redesign Grade Distribution chart
**Type:** Refactor  
**Files:** `GradebookTab.tsx`  
**Work:**
- Full-width card
- Bar chart: 5 bars (A/B/C/D/F) with height proportional to count, max bar = 100%
- Colors: A=#1D9E75, B=#378ADD, C=#EF9F27, D=rgba(255,255,255,0.15), F=#E24B4A
- Count label floated above each bar (font-size:11px, font-weight:700, matching bar color)
- X-axis labels: "A (90–100)", "B (80–89)", "C (70–79)", "D (60–69)", "F (0–59)"
- Data source: `gradeDistribution` array from grades overview API

**Validation:** All 5 bars render with correct relative heights. Bar colors match grade letter. Count labels visible above bars.

---

#### TASK CLS-009 — Redesign Category Performance card
**Type:** Refactor  
**Files:** `GradebookTab.tsx`  
**Work:**
- Card with 5 category rows
- Each row: category name (110px), weight pill (10px ghost), score bar (flex:1, color varies by category), assignment count (right), avg score % (right, colored)
- Bar width = `avgScore / 100 * 100%`
- Bar colors cycle: Participation=#1D9E75, Homework=#378ADD, Projects=#7F77DD, Tests=#EF9F27, Quizzes=#D85A30
- Data source: `categoryPerformance` array + `categoryWeights` from grading policy

**Validation:** All rows render. Score bars proportional. Weight % shown per policy `categoryWeights` lookup. Scores colored correctly.

---

#### TASK CLS-010 — Redesign Course Performance table
**Type:** Refactor  
**Files:** `GradebookTab.tsx`  
**Work:**
- Card with TanStack Table sub-table (or simple HTML table — this is not the main sections table, so a simple table is acceptable here)
- Columns: Course name | Sections | Students | Avg Grade (sortable desc default) | Avg GPA | Pass Rate
- Avg Grade color: ≥80%=green, 70-79%=blue, 60-69%=amber, <60%=red
- Pass Rate color: 100%=green, 80-99%=amber, <80%=red
- Data source: `coursePerformance` array from grades overview API

**Validation:** Table renders all courses. Color coding matches thresholds. Default sorted by avgGrade descending.

---

#### TASK CLS-011 — Redesign At-Risk Students section
**Type:** Refactor  
**Files:** `GradebookTab.tsx`  
**Work:**
- Card with header: warning icon (red) + "At-Risk Students" + "X students" badge top-right
- Each student row: avatar chip (28px, deterministic gradient from `getStudentGradient(name)`), name + course, numeric grade (red if <60%, amber if 60-69%), letter grade badge
- Letter grade badge: red background for F, amber for D
- Data source: `atRiskStudents` array from grades overview API

**Validation:** All 7 at-risk students render. Avatar chips use `getStudentGradient()` (existing util — DO NOT rebuild). Grade colors correct.

---

#### TASK CLS-012 — Gradebook tab layout composure and responsive
**Type:** Polish  
**Files:** `GradebookTab.tsx`  
**Work:**
- Layout order (top to bottom):
  1. KPI row (4 tiles)
  2. Two-col: Grading Completion + Assessment Performance
  3. Full-width: Grade Distribution
  4. Two-col: Category Performance + Course Performance
  5. Full-width: At-Risk Students
  6. Full-width: Section Gradebook selector + placeholder
- At ≤1024px: two-col sections collapse to single-col
- At ≤768px: all sections single-col, tables scroll

**Validation:** Layout matches prototype at all tested breakpoints. No orphaned cards. No z-index or overflow issues.

---

### SPRINT 3 — Attendance Tab V2 Redesign

**Sprint 3 Deliverable:** Attendance tab fully redesigned with correct V2 design tokens and improved data presentation hierarchy. Today strip, DOW pattern, section completion ring, 30-day trend chart, and at-risk alerts all match prototype.

---

#### TASK CLS-013 — Attendance sub-header and sub-tab chrome
**Type:** Refactor  
**Files:** `apps/academics/src/components/classrooms/tabs/AttendanceTab.tsx`  
**Work:**
- Add attendance sub-header above sub-tabs: 32px icon square (amber bg) + "Attendance" 15px/600 + subtitle + right: "Last updated: {time}" + Export button
- Sub-tabs (Overview / Daily Entry): styled as `att-subtab` — pill-style with active state `background:rgba(55,138,221,0.10); border:rgba(55,138,221,0.20); color:#378ADD`
- Module accent for attendance sub-header: amber `#EF9F27` (calendar icon)
- Remove any existing header-style chrome that doesn't match V2

**Validation:** Sub-header renders correctly. Sub-tabs switch panels. Active state shows blue (info) per V2 tab patterns.

---

#### TASK CLS-014 — Redesign Today Summary strip
**Type:** Refactor  
**Files:** `AttendanceTab.tsx`  
**Work:**
- Single-row strip: `background:var(--bg-surface); border:1px solid var(--border-default); border-radius:10px; padding:14px 16px`
- 4 stats side-by-side: Present (green), Absent (red), Late/Tardy (amber), Excused (blue)
- Each stat: large value (20px/700) + uppercase label (9px ghost) + sub-text (9px ghost) e.g. "0 of 25 recorded"
- Divider + School Average section: avg rate (20px/700 green) + label + two trend badges (7-day / 30-day)
- Trend badges: green bg if 7-day > 30-day avg, red bg if declining
- Data source: `todaySummary` + `periodAverages` from attendance overview API

**Validation:** Strip renders with live data. Color coding correct. Trend badges conditionally colored. Responsive: wraps at ≤768px.

---

#### TASK CLS-015 — Redesign DOW Pattern as bar chart
**Type:** Feature/Refactor  
**Files:** `AttendanceTab.tsx`  
**Work:**
- Replace text badge display with 6-column mini bar chart (Sun through Fri)
- Each column: bar bg container (height:36px, rounded) + fill bar (height proportional to `avgRate`) + day label + pct label below
- Lowest rate day: red label + red tinted bar
- Data source: `dayOfWeekPattern` object from attendance overview API
- Insight text below: "Monday has the lowest avg attendance (X%). Friday is highest."

**Validation:** All 6 DOW columns render. Lowest day highlighted red. Bar heights proportional to rates.

---

#### TASK CLS-016 — Redesign 30-Day Trend chart
**Type:** Refactor  
**Files:** `AttendanceTab.tsx`  
**Work:**
- Full-width card with SVG area chart
- X-axis: actual dates from `trend` array (Feb 23 → Mar 24 2026) — NOT hardcoded dates
- Y-axis: 0–100% with 4 faint horizontal gridlines
- Area fill: gradient from `#1D9E75` (25% opacity at top) to transparent
- Line: `#1D9E75` 1.5px, rounded joins
- Last two data points highlighted with filled circles
- Card header: right side shows "7-day avg: X%" and "30-day avg: X%" from `periodAverages`
- Data source: `trend` array (sorted by date ascending)

**BUG FIX:** The current x-axis shows Nov/Dec dates — this is a hardcoded date range bug. The fix is to derive x positions dynamically from the actual date strings in `trend[i].date`.

**Validation:** Chart renders with correct Feb–Mar 2026 date range. Last data point (Mar 24 at 76%) is visually highest recent point. Responsive: SVG scales to container width.

---

#### TASK CLS-017 — Redesign Section Completion
**Type:** Refactor  
**Files:** `AttendanceTab.tsx`  
**Work:**
- Card with SVG donut ring showing `sectionsWithAttendance / totalSections` completion %
- Left: donut (72×72px) with center % + "X / Y" sub-label below
- Right: scrollable list of all sections with columns: Section name + number | Enrolled | Recorded | Status chip
- Status chip: "Not Started" (ghost), "Partial" (amber), "Complete" (green) — derived from `isComplete` + `recordedCount` vs `studentCount`
- Data source: `sectionCompletion` from attendance overview API

**Validation:** Ring renders at correct completion pct. All 10 sections listed. Status chips correct for each section's state.

---

#### TASK CLS-018 — Add Period Averages card
**Type:** Feature  
**Files:** `AttendanceTab.tsx`  
**Work:**
- New card placed beside Section Completion in two-col layout
- 3 mini KPI tiles inside: "7-Day" (green if trending up), "30-Day" (muted), "Yearly" (muted)
- Each tile: label (9px/700 ghost uppercase) + value (20px/700)
- Insight note below: contextual message about trend direction
- Data source: `periodAverages` from attendance overview API

**Validation:** 3 period averages render correctly from API data.

---

#### TASK CLS-019 — Redesign Attendance Alerts table
**Type:** Refactor  
**Files:** `AttendanceTab.tsx`  
**Work:**
- Full-width card with warning icon header
- Sortable columns: Student name + grade level | Rate | Absent | Total | Trend
- Rate color-coding: <60%=red (critical), 60–79%=amber (warn), 80–89%=muted (ok)
- Grade level shown as sub-text below student name (gray)
- Student count in header top-right
- Data source: `atRiskStudents` from attendance overview API

**Validation:** All 16 at-risk students render. Rate colors match severity thresholds. Table is not a TanStack Table rebuild — it's a simple `<table>` since it's a sub-section component.

---

#### TASK CLS-020 — Attendance tab layout composure and responsive
**Type:** Polish  
**Files:** `AttendanceTab.tsx`  
**Work:**
- Layout order:
  1. Sub-header + sub-tabs
  2. Today summary strip (full width)
  3. Two-col: Today's Absence Breakdown + DOW Pattern
  4. Full-width: 30-Day Trend chart
  5. Two-col: Section Completion + Period Averages
  6. Full-width: Attendance Alerts
- At ≤1024px: two-col → single-col
- At ≤768px: all single-col, trend chart scales

**Validation:** Layout matches prototype at 1440px, 1024px, 768px.

---

### SPRINT 4 — Integration, Testing, Bug Fixes

**Sprint 4 Deliverable:** All 3 tabs passing CI, no known visual regressions, sprint plan written to docs/.

---

#### TASK CLS-021 — Fix: Attendance trend chart date range bug
**Type:** Bug Fix  
**File:** `AttendanceTab.tsx`  
**Work:** (Already addressed in CLS-016 — this task confirms fix in isolation)
- Write a unit test that verifies the x-axis date labels come from the `trend[].date` API field, not from any hardcoded range.
- The test should render with mock data where the first date is `2026-02-23` and last is `2026-03-24` and assert those labels appear.

**Validation:** Unit test passes. No hardcoded date strings in the component.

---

#### TASK CLS-022 — Write Storybook stories for new Gradebook cards
**Type:** Testing  
**Files:** `apps/academics/src/stories/classrooms/`  
**Work:**
- GradingCompletionCard.stories.tsx: loading state, 85% complete, 100% complete, 0% complete
- AssessmentPerformanceCard.stories.tsx: normal data, equal formative/summative, no unclassified
- GradeDistributionChart.stories.tsx: normal, all-A, all-F distribution
- AtRiskStudentsCard.stories.tsx: 0 at-risk, 7 at-risk, with long student names

**Validation:** All stories render in Storybook without errors. Screenshot regression test passes.

---

#### TASK CLS-023 — Write Storybook stories for new Attendance cards
**Type:** Testing  
**Files:** `apps/academics/src/stories/classrooms/`  
**Work:**
- TodaySummaryStrip.stories.tsx: no data yet, partial data, full day recorded
- DOWPatternChart.stories.tsx: uniform rates, Monday lowest, all zeros
- SectionCompletionCard.stories.tsx: 0%, 50%, 100% complete
- AttendanceAlertsTable.stories.tsx: 0 alerts, 16 alerts, with grade level data

**Validation:** All stories render. 

---

#### TASK CLS-024 — E2E smoke test: Classrooms page tabs
**Type:** Testing  
**Files:** `e2e/classrooms.spec.ts`  
**Work:**
- Visit `/academics/classrooms`
- Assert: 4 KPI tiles visible (Total Sections, Total Students, Avg Utilization, Active Teachers)
- Click Gradebook tab → assert: "Grade Analytics" heading, 7 at-risk count visible
- Click Attendance tab → assert: today summary strip renders, at-risk alerts table visible
- Click back to Overview → assert: sections table has 10 rows

**Validation:** E2E test passes in CI.

---

#### TASK CLS-025 — Write sprint plan file
**Type:** Documentation  
**Files:** `docs/classrooms-page-v2-sprint.md`  
**Work:**
- Document all decisions made during this sprint
- List all files modified and why
- Document the API endpoints used per tab
- Note any deferred items for future sprints (e.g. Daily Entry attendance sub-tab)
- Reference: `edforge_classrooms_v2_redesign.html` as the authoritative prototype

**Validation:** File exists at `docs/classrooms-page-v2-sprint.md`, is readable, and committed.

---

## IMPLEMENTATION NOTES FOR AGENT

### API Endpoints (Already Implemented — DO NOT Re-Implement)

| Tab | Endpoint | Hook |
|-----|----------|------|
| Overview | `GET /api/academics/sections?schoolId=&academicYearId=&isActive=true&limit=50` | `useSections()` |
| Gradebook | `GET /api/academics/grades/overview?schoolId=&academicYearId=` | `useGradesOverview()` |
| Gradebook | `GET /api/academics/grading-policies?schoolId=` | `useGradingPolicies()` |
| Attendance | `GET /api/academics/attendance/overview?schoolId=&academicYearId=&date=` | `useAttendanceOverview()` |
| Attendance | `GET /api/academics/attendance/summary?schoolId=&date=&academicYearId=` | `useAttendanceSummary()` |

### Shared Components to Use (Already Built)
- `StatCard` from `@edforge/ui` — KPI tiles
- `SectionErrorBoundary` from `@edforge/ui` — error boundaries
- `useCountUp` from `@edforge/ui` — animate numeric values
- `getStudentGradient(name)` from `apps/academics/src/utils/` — at-risk avatar chips

### V2 Design Token Reference (for inline style enforcement)
- Classrooms module accent: `#378ADD` (blue) — all tab active colors, icon squares
- Attendance accent (sub-header): `#EF9F27` (amber) — calendar icon square
- Gradebook accent: `#378ADD` (blue) — section icon squares
- KPI accent bar per card: varies (see prototype)
- bg-surface: `#161b27`, bg-elevated: `#1e2436`
- All card border-radius: `10px`
- All card header: `padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.05)`

### What NOT to Touch
- ❌ Do NOT rebuild TanStack Table in the sections overview
- ❌ Do NOT change DiceBear avatar generation logic
- ❌ Do NOT modify the Grading Policies tab (out of scope this sprint)
- ❌ Do NOT implement the Daily Entry attendance sub-tab (future sprint)
- ❌ Do NOT change any Finance, People, or Settings module files

---

## SUB-AGENT REVIEW CHECKLIST

Before approving the implementation plan, the sub-agent must verify:

1. [ ] All V2 design tokens are referenced by CSS variable, not hardcoded hex (exception: accent colors defined in master context)
2. [ ] StatCard is imported from `@edforge/ui`, not rebuilt
3. [ ] SectionErrorBoundary wraps every KPI group
4. [ ] useCountUp is applied to every numeric KPI value
5. [ ] No `position: fixed` appears anywhere — drawers/overlays use `position: absolute` inside content-pane
6. [ ] Tab active color for Classrooms is `#378ADD` (blue), not teal
7. [ ] Context banner is a plain text line, no card/border
8. [ ] Export CSV button is in the filter strip (far right), not in the header button group
9. [ ] Trend chart dates are derived from API data, not hardcoded
10. [ ] At-risk avatar chips use `getStudentGradient()` from existing util
11. [ ] Grade distribution bars use: A=green, B=blue, C=amber, D=ghost, F=red
12. [ ] The `docs/classrooms-page-v2-sprint.md` file is written at the end of the sprint
