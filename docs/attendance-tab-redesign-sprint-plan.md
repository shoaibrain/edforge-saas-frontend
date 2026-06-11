# Attendance Tab — Redesign Sprint Plan

**Status:** proposed · **Owner:** academics (frontend) + identity/academics API (backend) + design-system
**Surface:** `/academics/classrooms?tab=attendance` (Academics MFE)
**Type:** UX redesign + table correctness + metric-semantics audit

---

## 1. Business intent (what this page is for)

The Attendance area does **two different jobs** for **two different moments**, behind one
sub-toggle:

- **Daily Entry** — the *operational, high-frequency* task: a teacher/admin records today's
  attendance for a section in a grid (compliance goal: every section recorded before end of
  day). Offline-resilient, calendar-aware (skips non-instructional days).
- **Overview** — the *monitoring, lower-frequency* task: an admin/attendance coordinator
  reviews today's recording progress, 30-day trend, absence patterns, section completion, and
  the **at-risk student list** (the actionable intervention surface — students below 90%).

It is **school-scoped + academic-year-scoped**. The redesign must respect that these are two
distinct jobs and make the **at-risk list the hero** of Overview (it's the only part that
drives action), while keeping Daily Entry fast.

### Route → component (the real tree; filenames don't match)

`/classrooms?tab=attendance` → `ClassroomsModule` (`routes/classrooms/index.tsx:658-802`,
dispatches at `:792`) → **`AttendanceModule`** (`routes/attendance/index.tsx:231-256`, a gate
that checks the current academic year) → `AttendanceModuleContent` (`:264-540`, holds the
Overview/Daily-Entry `useState` sub-tabs) → Overview renders **`AttendanceDashboard`**
(`routes/attendance/dashboard.tsx:832-977`).

---

## 2. Diagnosis — why the page feels "poorly designed"

| # | Problem | Evidence |
|---|---|---|
| **D1** | **Triple-nested chrome.** The page already sits under the Classrooms `PageHeader` + the Overview/Gradebook/Policies/Attendance tab bar; then a **second** "Attendance · Record and review…" sub-header with its own icon (`attendance/index.tsx:420-441`); then the **Overview / Daily Entry** `TabBar` (`:113-142`) top-**left**. Three levels of nav before any content. | `attendance/index.tsx:420-441` |
| **D2** | **Unbounded vertical page.** Seven full-width widgets stacked, no max-heights, then an unbounded table. The page grows without limit. | `dashboard.tsx:879-976` (stacked `flex flex-col gap-3`) |
| **D3** | **Attendance Alerts is hand-rolled, not the EdForge `DataTable`.** `AlertsTableV2` maps every row into `<div>`s — **no pagination, no virtualization, no max-height.** As the at-risk list grows, the table (and page) grow unbounded. *This is the core complaint.* | `dashboard.tsx:679-826`, rows at `:780-820` |
| **D4** | **Section Completion is also unbounded** — maps every section as a flex list, no cap/scroll. | `dashboard.tsx:527-619` |
| **D5** | **Everything is bespoke.** Every widget (stat strip, absence breakdown, day-of-week bars, 30-day line, completion donut, period averages, alerts) is hand-rolled `<div>`/SVG — **zero** use of the `@edforge/ui` primitives built for exactly this (`StatStrip`, `SectionCard`, `DataTable`, `AttendanceTrend`, `CategoryBar`, `AttendanceDonutRing`). ~800 LOC of drift; inconsistent light/dark + a11y. | `dashboard.tsx` throughout |
| **D6** | **Metric redundancy.** 7-day / 30-day / school-average appear in the header banner, the stat-strip "School Average" block, **and** the "Period Averages" card — the same numbers 3×. | banner + `dashboard.tsx:205-278` + `:625-665` |
| **D7** | **Metric-semantics bug (correctness, not cosmetics).** The headline **"School Average" renders `periodAverages.academicYear` = 10.3%** (`dashboard.tsx:247-248`), with 7-day 13.5% / 30-day 10.8%. But the at-risk list flags students *below 90%* at **66–85%**. A 10.3% "school average attendance" is mutually exclusive with "85% = at-risk": they're on **different scales/definitions**. Almost certainly `periodAverages.*` is *not* the same metric as the per-student `attendanceRate` (e.g. it's a recording-completion or present-over-all-enrolled-incl-unrecorded rate that looks catastrophic early in the day when only 41/250 are recorded). Shipping "School Average 10.3% ↑" in green is **misleading and erodes trust.** | `dashboard.tsx:247-248` vs `:679-826` |

---

## 3. Data layer (grounding the plan)

**One server aggregate** powers all of Overview:
`GET /academics/attendance/overview?schoolId&academicYearId&date` →
`{ todaySummary, absenceBreakdown, dowPattern, trend30d, sectionCompletion, periodAverages,
atRiskStudents: AttendanceAlert[], totalAtRiskCount }`
(`academics.service.ts` `getAttendanceOverview`; hook `useAttendanceOverview`). Stats are
**aggregated server-side** (good — the client doesn't compute them).

**Critical for the table fix:** `atRiskStudents` is **NOT server-paginated** — the endpoint
takes no `limit`/`cursor`/`sort`/`filter`; it returns the full list and the UI renders all of
it. `totalAtRiskCount` is just a count for the "Showing N of M" label (`dashboard.tsx:750`).

**Daily Entry** uses separate queries: `useSections`, `useSectionRoster`,
`useSectionAttendanceRecords`, `useCalendarDate`, + `recordBulkSectionAttendance` /
`updateSectionAttendance` mutations.

---

## 4. Target design (staff-engineer + product-designer)

### 4.1 One header; toggle top-right (the requested fix)

Collapse D1's three levels into **one** header for the Attendance tab, using the canonical
EdForge pattern (`flex items-center justify-between`, right-aligned actions — cf. the Gradebook
toolbar's `ml-auto` "Grade Analytics" at `classrooms/index.tsx:420-430`):

- **Left:** "Attendance" + context (academic year · selected date).
- **Right:** the **Overview / Daily Entry** toggle as a `SegmentedControl` (`@edforge/ui`) +
  mode-specific actions — Overview: **date picker · Export**; Daily Entry: **section · date ·
  save status**.
- Drop the redundant second "Attendance · Record and review…" icon/sub-header.

### 4.2 Overview = a bounded, prioritized dashboard

Re-rank by *actionability* and **bound every region** (no infinite stack):

1. **KPI strip** (`StatStrip`): Recorded `41/250` · Present · Absent · Late · Excused · School
   Average — **one source per metric** (fold "Period Averages" in here; delete D6 duplicates).
2. **2-up, bounded:** 30-Day trend (`AttendanceTrend` / chart primitive) + Day-of-Week pattern
   (`CategoryBar`).
3. **Section Completion** — a single completion KPI (`AttendanceDonutRing`, e.g. 4/8) + a
   **bounded** list: a small `DataTable` or a capped list (max-height + scroll + "view all").
   This is a compliance checklist ("did every section record today"), not an infinite feed.
4. **Attendance Alerts = the hero**, as a proper **`DataTable`** (see §4.3). Promote it: it's
   the only part that drives intervention.

### 4.3 The table fix — Attendance Alerts → `DataTable` (core deliverable)

Replace `AlertsTableV2` (`dashboard.tsx:679-826`) with the shared TanStack `DataTable` from
`@edforge/ui`:

- Columns: **Student** (avatar + name + grade) · **Rate** (color-coded) · **Absent** · **Total**
  · **Trend** (Declining/Improving/Stable). Row click → existing `StudentAttendanceModal`.
- **Bounded height** + **pagination footer** + **sortable** columns + **faceted filters**
  (trend, grade level). This alone fixes D2/D3 — the page stops growing.

**Phase 1 — no backend change (ship first):** the aggregate already returns a bounded
`atRiskStudents` array; render it through `DataTable` with **client-side** pagination/sort/
filter. Immediate, low-risk, and gives the standard EdForge table UX today. Bound Section
Completion the same way.

**Phase 2 — scale (backend, follow-up):** the unbounded list does not belong inside a mega
aggregate. **Decouple** it into a dedicated, paginated endpoint:
`GET /academics/attendance/at-risk?schoolId&academicYearId&limit&cursor&sortBy&order&trend&gradeLevel`
→ `{ items: AttendanceAlert[], nextCursor?, total }`. Switch `DataTable` to **server**
pagination/sort/filter. Remove `atRiskStudents` from the overview aggregate (keep
`totalAtRiskCount` for the headline). *This is an `edforge` (backend) change — flagged for that
team; the frontend `DataTable` is built server-pagination-ready in Phase 1 so the swap is small.*

### 4.4 Adopt the design system (kill the drift)

Swap bespoke markup for primitives: `StatStrip`, `SectionCard` (card chrome), `DataTable`
(alerts + completion), `AttendanceTrend`/`CategoryBar`/`AttendanceDonutRing` (charts). Net LOC
down, consistent light/dark + a11y, no more hand-rolled SVG. (Design-system principle: "MFE
drift is a defect.")

### 4.5 Metric correctness (D7 — cross-team, do not skip)

- **Define each metric precisely** and put the **headline on the same scale as per-student
  rates** (or relabel). "School Average 10.3%" next to "at-risk below 90%" cannot both be
  attendance-rate.
- **Separate "recording completion"** (`41/250 recorded`) from **"attendance rate"** (% present
  of *recorded*). Decide explicitly whether "today" counts unrecorded students as absent — if
  so, the headline must say "recorded so far," not present a doom number early in the day.
- Verify server semantics of `periodAverages.*` in `edforge` (`getAttendanceOverview`). This is
  the single biggest driver of the "buggy/untrustworthy" feel.

---

## 5. Daily Entry (lighter touch)

The toggle moves into the new header (§4.1); keep the section/date/save toolbar and the
`AttendanceGrid` quick-actions. `AttendanceGrid` maps the full roster (`AttendanceGrid.tsx:173-574`)
— fine for typical sections (≤~40); note **row virtualization** as a *low-priority* follow-up
for very large rosters. No functional change to the recording flow.

---

## 6. Sequencing & risk

| Ticket | Change | Repo | Risk | Gate |
|---|---|---|---|---|
| **T1** | One header; move Overview/Daily-Entry toggle top-right (`SegmentedControl`); drop redundant sub-header | frontend | low | typecheck · lint · vitest · visual QA light+dark |
| **T2** | **Alerts → `DataTable`** (client-paginated/sortable/filterable) + bound Section Completion | frontend | low–med | the headline fix; QA with 0 / few / many at-risk rows |
| **T3** | Swap widgets to `@edforge/ui` primitives; dedupe metrics; bounded grid | frontend | med (pure presentation) | eslint 0 errors; visual parity QA |
| **T4** | Server-paginated `/academics/attendance/at-risk` endpoint; switch `DataTable` to server mode | **backend (edforge)** | med | API contract + unit/integration; FE swap |
| **T5** | Metric-semantics audit (define metrics; fix/relabel headline) | backend + frontend | med | agreed definitions; QA the numbers make sense |

**Definition of done:** the page no longer grows unbounded (alerts + completion are bounded,
paginated tables); the Overview/Daily-Entry toggle sits top-right in a single header; widgets
use shared primitives; the headline metric is correct and on the same scale as the at-risk
rates; `eslint apps/academics` stays at 0 errors; light/dark verified.

**Out of scope (flagged):** the organic loader and the school-resolution work (separate plan);
mobile/responsive (separate Claude Design track); deeper analytics features.
