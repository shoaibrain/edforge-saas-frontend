# Edforge MFE Modernization — Sprint & Ticket Plan

## Context

A design handoff established a **new presentation-layer pattern** for three Academics screens
(Students, Curriculum, Exams). It distills every operator list/dashboard page down to **three canonical,
config-driven surfaces**:

1. **① Page Header (`pagebar`)** — year switcher + date on the left, page actions on the right.
   *No H1 title / no counts subtitle* (breadcrumb names the page; the stat band summarizes it).
2. **② Stat Band (`band`)** — one unified KPI strip. Calm by default; semantic color appears **only**
   when a metric needs attention (`state` drives the single color). Exactly one micro-viz per metric:
   delta chip · status pill · SABER target meter · readiness donut.
3. **③ Table Toolbar (`tbar`)** — one search field · docked status **segmented presets** · a primary
   **facet** dropdown · "More filters" · quiet right cluster (density · columns · export). Replaces
   per-page orphan preset buttons + the second search box. A bulk-action bar swaps in on selection with
   the same footprint (no layout shift).

Handoff `AGENT_PROMPT` rules carried into every ticket: **refactor in place** (no parallel component
tree); **no dead/zombie code** (physically delete removed elements); **reuse existing tokens only**
(flag-and-stop if a value has no token); **generic + config-driven**; **strict scope** (the pilot touches
only header/band/toolbar — table body, shell, data layer out of scope).

**This project:** take that proven pattern and **convert, modernize, and standardize every page across
the Edforge Platform Web MFEs** — replacing per-page drift with the three canonical surfaces (plus the
already-documented detail/form/wizard/state recipes) so all ~120 routes across 5 remotes share one
presentation contract, with governance that prevents drift returning.

---

## Codebase facts this plan is built on (verified)

- **Monorepo:** pnpm + Turborepo. **React 19 + TS 5.6 strict.** **Rsbuild/Rspack + Module Federation**:
  host `shell` :3000; remotes `academics` :3002, `finance` :3003, `people` :3006, `analytics` (parked —
  see below). Route inventory: academics **21**, finance **10**, people **9**, analytics **4**, shell
  pages many (settings ×15+, portals, home, landing) — ~120 total.
- **Shared UI `@edforge/ui`** already has `PageHeader`, `ContextBar` (+`ContextBarYear`), `StatCard`,
  `StatStrip`, `FilterTabs`, the full `data-table/` suite (`DataTableToolbar`, `DataTableFacetedFilter`,
  `DataTableDensityToggle`, `DataTableExport`, `DataTableViewOptions`, `DataTablePagination`), **and viz
  primitives to compose from**: `AnimatedProgressBar` (reduced-motion aware), `AttendanceDonutRing`,
  `GpaRing` (SVG ring), `CategoryBar`, `StatusPill`. **This is refactor-in-place, not greenfield.**
- **Tokens `@edforge/theme`** (`packages/theme/src/base.css`): semantic roles `background.*`, `text.*`,
  `border.*`, `action.*`, `state.{success|warning|danger|info}.{bg,fg,border}`, radius/motion/elevation
  scales, consumed as `rgb(var(--…))`. **Two facts that shaped this plan:**
  - The handoff's raw tokens are the *prototype's* names and must be **mapped**, not imported as hex.
    ⚠️ **`--mint` is NOT `action.primary`.** `--mint = color-aqua-600 (#61bd9e)` (an aqua accent, aliased
    to `--border-focus` via `--mint-border`); `action.primary.bg = #0F6E56` (deep brand green). Mapping
    them silently recolors the pilot — this is a flagged Plan decision (T0.1), not an assertion.
  - The pilot pages already run on an **`--accent-{enrollment,finance,attendance,academics}`** signature
    family (+`-text` variants) via `StatCard`'s required `accentColor`/`iconColor`/`barColor` props and
    `focus:ring-[rgb(var(--accent-enrollment)/0.4)]`. StatBand's "calm by default" conflicts with an
    always-on per-metric accent — reconciling this is a required T0.1 design decision.
- **Governance (already enforced), `packages/config/eslint-design-system.js`:** `no-hardcoded-colors`,
  `no-arbitrary-tailwind-values`, `no-presentation-style-objects` are **already errors app-wide**
  (`apps/**` + `packages/ui/**`). Only `prefer-ui-select`, `prefer-ui-form-controls`,
  `no-local-form-style-constants` are `warn` (the 1st + 3rd already error on settings/onboarding).
  `allow-*: <reason>` comments are the only escape hatch; per-path overrides exist for `CSVImport.tsx`
  and portal paths.
- **Tests:** Vitest 4 + Testing Library (179 files) via `pnpm vitest run`; Playwright E2E + opt-in
  **visual regression** (`e2e/tests/design-system-visual-regression.spec.ts`, `pnpm test:e2e:visual`).
  **No Storybook** — the live showcase is `apps/shell/src/pages/dev/design-system.tsx`.
- **House conventions** (`docs/design-system/README.md`, `page-recipes.md`,
  `docs/design-system-sprint-plan-FINAL.md`): semantic-tokens-first; primitives before page styling;
  **one primitive / one page-sweep per PR (~15-file cap)**; **pilot one MFE end-to-end before fan-out**;
  every PR ships before/after screenshots + contrast delta + ESLint delta + gate results.
- **Analytics is parked** (`sidebar-modules.ts`: "PARKED (backend 403) — hidden from nav"; shell shows
  "temporarily unavailable"), but its route files exist. Treated here as an **explicit recorded
  deferral** with a migrate-on-unpark ticket — not silently dropped.

**Current Students page (canonical migration target):** `ContextBar` (year+date meta, `StudentsInsightStrip`
description, inline `<button>` actions) + 4× `StatCard` grid (the color-block KPI cards the handoff removes)
+ `StudentTable`→`DataTable` with `toolbarStart={<StudentsFilterRow/>}` + a separate export `Button`. It also
carries bespoke `TableSkeleton`/`EmptyFilterState`/`ErrorState`/`NoSchoolGuard`. Migration = ContextBar/insight
→ **PageHeader** (pagebar mode); StatCard grid → **StatBand**; StudentsFilterRow + 2nd search → **TableToolbar**;
bespoke states → `@edforge/ui/states`; delete the removed pieces.

---

## Operating rules (every ticket)

1. No new features, no route changes, no API/service/data-model changes. Presentation layer only.
2. No ground-up redesign. The Edforge palette stays; only which semantic token a surface consumes, its
   micro-viz, and its states change.
3. `packages/theme/src/base.css` is edited **only** in the Sprint 0 token ticket, and only for a
   Plan-approved diff. If a surface needs a value with no token, **flag-and-stop** there.
4. One primitive per PR, one page sweep per PR, ~15-file cap. No big-bang PRs.
5. **Rollback path = the PR itself.** Each page migration is one self-contained, revertible PR; the
   highest-risk pages (classroom detail, invoices) may hide behind a lightweight local flag if desired.
6. Every PR body: what changed · before/after screenshots (light+dark) · contrast delta · ESLint delta ·
   gate results · visual-regression notes.
7. If any gate fails, the PR pauses — failures are not deferred to a later PR.

## Stop-the-line gates (every PR)

| Gate | Required result |
|---|---|
| Typecheck | `pnpm turbo typecheck` clean |
| Lint | `pnpm turbo lint` clean; **zero net-new** warnings/errors |
| Unit tests | `pnpm vitest run` green |
| Contrast | WCAG token/component contrast test green for the supported matrix |
| Focus rings | Focus-ring test green for changed interactive primitives |
| Visual regression | Zero unexpected light-mode drift; intended drift reviewed via screenshots |
| Cross-remote (when `@edforge/ui` changes) | `pnpm dev:mvp` smoke across shell + all remotes; no MF version-skew warnings |
| Bundle budget | Changed remote's bundle size within budget (no unexpected increase) |
| Smoke | login → dashboard → one academic flow → one finance flow → settings; both themes; zero console errors |

---

## Sprint map (each sprint is independently demoable and builds on the last)

| Sprint | Goal | Demo at the end |
|---|---|---|
| **S0 — Foundation & Proof** | Token map + accent decision, VR baselines, contract-test + DoD scaffolds, showcase scaffold | `/dev/design-system` renders the 3 component *stubs* w/ sample config, light+dark; token map + DoD merged; baselines + gates green |
| **S1 — Canonical components** | Build PageHeader(pagebar)/StatBand/DataTableToolbar(unified) in `@edforge/ui` by **composing existing viz primitives**; not yet wired to pages | Every state/micro-viz/preset/bulk variant live in the showcase; unit/focus/contrast/axe/RTL tests green; cross-remote smoke green |
| **S2 — Academics pilot** | Migrate the 3 handoff screens end-to-end | Students/Curriculum/Exams on the new surfaces; dead code + bespoke states gone; before/after screenshots |
| **S3 — Academics fan-out** | Every remaining Academics route (incl. rostering, both attendance routes, classroom-detail tabs) | All 21 Academics routes standardized; VR suite covers them |
| **S4 — Finance** | All 10 Finance routes (incl. invoice/payment detail + drawers) | Finance MFE standardized |
| **S5 — People** | All 9 People routes (incl. staff detail/new, new, analytics) | People MFE standardized |
| **S6 — Shell** | Home + dashboards + settings + dynamic-page widgets + landing; portals per deferral | Shell operator surfaces standardized |
| **S7 — Governance ratchet & cleanup** | Deprecate old APIs, ratchet named lint rules, docs, full-matrix QA, analytics/portal deferral records | No color-block KPI code remains; named rules at error; docs updated; full a11y/contrast/VR/perf pass |

**Cross-cutting workstream (threads through all sprints):** state-primitive standardization (in the
fan-out template), RTL/`dir` audit (T1.9), new-token-pair contrast baselines (T1.10), keyboard-nav +
reduced-motion matrix (per-component acceptance + S7 audit), bundle budget (gate + S7), adoption
codemod + deprecation comms (T7.x).

---

## Sprint 0 — Foundation & Proof Harness

**Goal:** make later token/visual claims measurable and give the three surfaces a home + live showcase —
before any page changes.

### T0.1 — Token reconciliation map + accent/calm decision
- **Files:** `docs/design-system/handoff-token-map.md` (new); `packages/theme/src/base.css` only if a
  genuinely missing token is approved.
- **Work:** Map every handoff token used by the 3 surfaces to an existing role — `--critical*`→`state.danger.*`,
  `--warn*`→`state.warning.*`, `--info*`→`state.info.*`, `--bg/--surface/--raised*`→`background.*`,
  `--border*`→`border.*`, `--r-*`→radius scale. **Flag for Plan decision** (do not assert): (a) `--mint`
  (aqua accent / `border-focus`) vs the app's `action.primary` green — which becomes the CTA/primary and
  which the "live/good" accent; (b) the fate of `--accent-{enrollment,finance,attendance,academics}` — does
  StatBand keep per-metric signature accents (conflicts with calm-by-default) or collapse to `state.*`, and
  what happens to the `--accent-*/0.4` focus rings. Produce the **flag-and-stop list** for values with no
  token (SABER meter track/fill, donut track, live-pulse ring, `data-state` accent tick) with a
  reuse-or-propose recommendation each. **No `base.css` change without Plan sign-off.**
- **Validation:** every handoff token + the `--accent-*` family has a decided mapping or a recorded flagged
  decision; the mint/accent/calm decisions are resolved before S1.

### T0.2 — Visual-regression baselines (pilot + representatives)
- **Files:** extend `e2e/tests/design-system-visual-regression.spec.ts`; `e2e/` fixtures.
- **Work:** Deterministic baselines (light+dark) for Students, Curriculum, Exams + one representative per
  other MFE (Finance overview, People staff, Shell home). Document the update flow.
- **Validation:** `pnpm test:e2e:visual` runs locally, stable baselines; **no production code changed.**

### T0.3 — Component contract test + a11y scaffolds
- **Files:** `packages/ui/src/components/__tests__/StatBand.test.tsx`, `PageHeader.pagebar.test.tsx`,
  `data-table/__tests__/DataTableToolbar.unified.test.tsx` (initially `test.todo`).
- **Work:** Encode the three data contracts as `test.todo`/type-level tests S1 turns green one at a time;
  wire the existing a11y helper (jest-axe or repo equivalent) for the new surfaces. (Note: the toolbar is
  `data-table/DataTableToolbar.tsx` — there is no separate `TableToolbar` component.)
- **Validation:** `pnpm vitest run` green with pending markers; contracts compile against exported types.

### T0.4 — Dev showcase scaffold
- **Files:** `apps/shell/src/pages/dev/design-system.tsx`.
- **Work:** Add a "Surfaces" section rendering the (stub) header/band/toolbar with sample config from all
  three handoff pages, light+dark. This is the S0–S1 demo surface.
- **Validation:** route renders; typecheck/lint green; screenshot attached.

### T0.5 — Definition-of-Done + PR checklist doc (promoted from pilot)
- **Files:** `docs/design-system/handoff-migration-recipe.md` (new).
- **Work:** Write the per-page migration recipe + the handoff **acceptance checklist** (no H1/subtitle;
  band calm-by-default; single search; presets docked; bespoke states → shared primitives; dead code gone;
  tokens only; all gates green) as the copy-paste DoD every later ticket references.
- **Validation:** checklist embedded in the fan-out template below; reviewed.

**Sprint 0 demo:** showcase shows the three surfaces (stubs) with real sample config in both themes; token
map + DoD merged; baselines + gates green. Nothing user-facing changed.

---

## Sprint 1 — Canonical Presentation Components

**Goal:** build the three surfaces as generic, config-driven `@edforge/ui` components that **compose the
existing viz/state primitives** and consume only semantic tokens. Wired **only** into the showcase — zero
page risk.

> Contracts (from the decoded handoff JS/CSS):
> - `PageHeader` pagebar mode: `{ year, date, actions:[{label, icon, primary?, onClick, disabled?}], breadcrumbs? }`
> - `StatBand`: `metrics:[{ label, icon, value, state, nature, primary?, sub, detail,
>   delta?{dir,val} | pill?{tone,text} | meter?{pct,target} | donut?{pct} }]`,
>   `state ∈ normal|good|warn|critical|info|live|muted`; **exactly one** micro-viz per metric.
> - Toolbar: `{ search, presets:[{label,n,value}], activePreset, onPreset, facet, facetIcon,
>   onMoreFilters, density, columns…, export… }` + a bulk-bar slot (same footprint).

### T1.0 — Viz + reduced-motion primitive audit
- **Files:** none (audit note appended to the showcase + T1.x tickets).
- **Work:** Confirm the composition targets — `meter` → `AnimatedProgressBar`; `donut` → extract the shared
  SVG-ring core from `AttendanceDonutRing`/`GpaRing` into a reusable `Ring`; `pill` → `StatusPill`;
  reduced-motion → the established `useReducedMotion` pattern already in `AnimatedProgressBar`/`AnimatedIcon`/
  `useCountUp`. StatBand must **wrap** these, not duplicate them (no parallel tree).
- **Validation:** each T1.3–T1.5 viz references an existing primitive; net-new SVG/motion code minimized.

### T1.1 — `PageHeader` pagebar mode (⚠ prop-signature change)
- **Files:** `packages/ui/src/components/layout/PageHeader.tsx`, `ContextBar.tsx` (reconcile), tests, showcase.
- **Work:** `PageHeader.title` is currently **required** and always renders `<Heading level={1}>`. Add a
  discriminated `mode: 'titled' | 'pagebar'` (or make `title` optional): pagebar mode renders year-switcher
  chip (reuse `ContextBarYear`) + date + right-aligned actions and **no `<h1>`**; titled mode is unchanged for
  detail/settings pages. This changes the type contract of **all 31+ `PageHeader`/`ContextBar` consumers** —
  include a consumer audit + codemod sub-step (default `mode:'titled'` so existing callers compile unchanged).
- **Validation:** unit test: pagebar mode renders **zero** `<h1>` and correct action ordering/primary styling;
  titled mode still renders **exactly one** `<h1>`; focus-ring test on year chip + actions; contrast green;
  consumer audit shows no broken callers; showcase updated.

### T1.2 — `StatBand` shell + segment
- **Files:** `packages/ui/src/components/StatBand.tsx` (new), types, tests, showcase.
- **Work:** Segment grid, `primary` emphasis, hover detail swap, `data-state` accent tick, entrance animation
  via shared `useReducedMotion`. Color strictly via `state.*` per the T0.1 decision; icon chip via tokens.
- **Validation:** N segments from config; state→color unit-tested; reduced-motion test; no unjustified lint escapes.

### T1.3 — StatBand micro-viz: **delta chip** & **status pill** (compose `StatusPill`)
- **Files:** `StatBand.tsx`, tests, showcase.
- **Work:** `delta{dir,val}` up/down chip (success/danger tone); `pill{tone,text}` via existing `StatusPill`.
  Enforce "exactly one micro-viz" with a **discriminated union** on the metric type + a runtime guard/test.
- **Validation:** unit tests per viz; type test rejects >1 viz; `StatusPill` reused (no new pill markup).

### T1.4 — StatBand micro-viz: **meter** (compose `AnimatedProgressBar`) & **donut** (shared `Ring`)
- **Files:** `StatBand.tsx`, extract `packages/ui/src/components/Ring.tsx` from `AttendanceDonutRing`/`GpaRing`,
  tests, showcase; track/fill tokens per T0.1.
- **Work:** `meter{pct,target}` = `AnimatedProgressBar` + a target notch; `donut{pct}` = shared `Ring`.
  Dynamic pct is data-driven (`allow-presentation-style: dynamic viz` only if approved).
- **Validation:** meter clamps 0–100, notch at `target`; donut dashoffset unit-tested via the shared `Ring`;
  reduced-motion disables transitions; `AttendanceDonutRing`/`GpaRing` still pass after the `Ring` extraction.

### T1.5 — StatBand `live` state (pulse) + a11y
- **Files:** `StatBand.tsx`, tests, showcase.
- **Work:** `state:'live'` pulsing icon ring (reduced-motion → static). ARIA: each segment `role="status"`/
  `aria-label` "{label}: {value}"; band as a labelled region.
- **Validation:** axe clean; reduced-motion test; live pulse only for `live`.

### T1.6 — `DataTableToolbar` unified layout
- **Files:** `packages/ui/src/components/data-table/DataTableToolbar.tsx` (refactor),
  `DataTableFacetedFilter.tsx`, `DataTableDensityToggle.tsx`, `DataTableExport.tsx`,
  `DataTableViewOptions.tsx`, tests, showcase.
- **Work:** Re-lay to canonical order: search · **docked segmented presets** (new — a `SegmentedControl`/
  `FilterTabs`-based strip driven by `presets[]`, replacing scattered `toolbarStart` preset buttons) ·
  primary **facet** trigger · **More filters** · right cluster (density · columns · export). Keep the
  `Table`-driven data wiring; this is a layout + presets refactor.
- **Validation:** preset click sets active + count; single search (no double render); keyboard order correct;
  existing DataTable pagination/filter tests still green.

### T1.7 — Toolbar bulk-action bar (same-footprint swap)
- **Files:** `data-table/` (bulk bar), tests, showcase.
- **Work:** On selection, the bulk bar replaces the toolbar row at identical height (no layout shift); reuse
  the existing **`BulkAction<T>`** type from `@edforge/ui` (already used by Students).
- **Validation:** selection toggles bar; height parity asserted; bulk actions keyboard-reachable (axe).

### T1.8 — Showcase full matrix + deprecation notes + cross-remote smoke
- **Files:** `apps/shell/src/pages/dev/design-system.tsx`; JSDoc on new components.
- **Work:** Render every state/micro-viz/preset/bulk permutation; JSDoc-mark `StatCard`/`StatStrip`
  color-block KPI usage **superseded by `StatBand`** (kept for other uses until S7). Run `pnpm dev:mvp`
  cross-remote smoke to confirm the `@edforge/ui` singleton change doesn't break any remote.
- **Validation:** all permutations render light+dark; VR baseline for showcase added; cross-remote smoke green.

### T1.9 — RTL / `dir` audit for the three surfaces
- **Files:** the three components + tests.
- **Work:** `packages/ui` has no `dir` handling today; audit header/band/toolbar for RTL mirroring
  (logical properties, chevron/notch/donut direction) and fix.
- **Validation:** RTL render test for each surface; no physical-direction assumptions leak.

### T1.10 — Contrast baselines for **new** StatBand token pairs
- **Files:** `packages/ui/src/components/__tests__/contrast.test.ts` (extend).
- **Work:** Add the new pairs StatBand introduces (live accent, muted value, donut/meter track vs surface) to
  the WCAG matrix; record any failing pair as a to-fix baseline.
- **Validation:** contrast test lists the new pairs; no silent gaps.

**Sprint 1 demo:** the three production components fully working in the showcase across every variant, both
themes, all tests (unit/focus/contrast/axe/RTL) green, cross-remote smoke green — **no page touched yet.**

---

## Sprint 2 — Academics Pilot (the three handoff screens)

**Goal:** prove the migration on the exact handoff screens, end-to-end, deleting all removed code. Pilot gate
before any fan-out.

### T2.1 — Students → three surfaces (+ state primitives + governance override)
- **Files:** `apps/academics/src/routes/students/index.tsx`; `components/students/StudentsFilterRow.tsx`,
  `StudentTable.tsx`; `packages/config/eslint-design-system.js` (override entry).
- **Work:** ContextBar+`StudentsInsightStrip` → `PageHeader` pagebar (Import IEMIS / Govt. Reports / Enroll
  student). 4× `StatCard` grid → `StatBand` (Enrolled▸delta · At-risk▸critical pill · Attendance▸meter@90 ·
  Grade Levels▸plain) applying the T0.1 accent/calm decision. `StudentsFilterRow`+export → toolbar presets
  (All·Active·At-risk·Pending) + Grade facet + export. Bespoke `TableSkeleton`/`EmptyFilterState`/`ErrorState`/
  `NoSchoolGuard` → `@edforge/ui/states`. **Delete** the insight strip, KPI grid, `WidgetErrorBoundaryV2` KPI
  wrappers, the standalone filter row. **Decide explicitly** the fate of the commented-out CSVImport block and
  its dedicated `no-presentation-style-objects: warn` override entry in the eslint config (remove the override
  if the code is removed — no governance drift).
- **Validation:** page renders with live data; unit/interaction tests updated (KPI→band assertions); VR baseline
  updated with reviewed diff; grep confirms no dead `StatCard`/insight/filter-row imports; eslint override state
  consistent.

### T2.2 — Curriculum → three surfaces
- **Files:** `apps/academics/src/routes/curriculum/index.tsx`; `components/curriculum/*`.
- **Work:** Header + [Add Course]; **deliberately calm** band (Total Courses▸meter 23/28 · Subject Areas ·
  Electives · Specialized Types▸`muted` 0); toolbar presets All·Active·Inactive + Subject facet; bespoke states
  → shared primitives. Delete old H1/subtitle, KPI cards, orphan presets, 2nd search.
- **Validation:** band shows zero red; tests updated; VR diff reviewed.

### T2.3 — Exams → three surfaces
- **Files:** `apps/academics/src/routes/exams/index.tsx`; `components/exams/ExamSummary.tsx`.
- **Work:** Header + [Create Exam]; **five-segment** band (Total · Live Now▸`live` pulse · Upcoming▸info ·
  Awaiting Results▸warn "Action needed" pill · Result Readiness▸donut 50%); toolbar presets
  All·Scheduled·In Progress·Published·Closed + Type facet, folding the four loose Type/Term/Status/Results
  buttons in; bespoke states → shared primitives. Delete removed pieces.
- **Validation:** 5 segments; live pulse only on Live Now; donut at 50%; tests updated; VR diff reviewed.

### T2.4 — Pilot retro
- **Files:** update `docs/design-system/handoff-migration-recipe.md` (from T0.5) with pilot learnings.
- **Validation:** recipe reflects real pilot friction; fan-out template updated.

**Sprint 2 demo:** Students, Curriculum, Exams live on the new surfaces (both themes), matching the handoff
references, with removed UI physically gone.

---

## Fan-out ticket template (S3–S6)

Each page = **one atomic ticket** applying the T0.5 recipe:
- **Header:** local title/ContextBar/subtitle → `PageHeader` (pagebar for list/dashboard; titled mode for
  detail/form).
- **Band:** `StatCard`/`StatStrip` KPI grids → `StatBand` (states/micro-viz per metric; calm by default).
- **Toolbar (list pages):** local filter rows + 2nd search → unified `DataTableToolbar` (presets + facet +
  more filters + right cluster; bulk-bar where bulk actions exist).
- **States:** bespoke skeleton/empty/error/guard → `@edforge/ui/states` primitives.
- **Recipes (non-list):** apply `SectionCard`/`Drawer`/wizard recipes; remove local header/tab/card drift.
- **Delete** all superseded local code.
- **Validation (every ticket):** updated unit/interaction tests (or, where none fit, reviewed before/after
  screenshot + VR baseline), all gates green, ESLint delta ≤ 0, no dead code (grep-verified).

---

## Sprint 3 — Academics fan-out (18 remaining routes)

- **T3.1 Overview** (`routes/overview.tsx`) — hero → PageHeader; widget KPI strip → StatBand.
- **T3.2 Classrooms index** (`routes/classrooms/index.tsx`) — list surfaces.
- **T3.3 Classroom detail** (`routes/classrooms/$sectionId.tsx`, ~852 lines, tabs
  **overview / classwork / people / progress**) — **split into atomic tickets** (exceeds ~15-file cap):
  - **T3.3a** header + tab-shell recipe · **T3.3b** overview tab band · **T3.3c** classwork/gradebook toolbar ·
    **T3.3d** people + progress tabs.
- **T3.4 Classroom create/edit** (`classrooms/create.tsx`, `$sectionId.edit.tsx`) — wizard/form recipe.
- **T3.5 Curriculum detail** (`curriculum/$courseId.tsx`) — detail recipe; `GradeLevelsTab.tsx` band.
- **T3.6 Exam detail** (`exams/$examId.tsx`) — detail recipe; `ExamSummary.tsx` band.
- **T3.7 Teachers** (`routes/teachers/index.tsx`) — list surfaces.
- **T3.8 Enrollment** (`routes/enrollment/index.tsx`) — list/wizard recipe.
- **T3.9 Rostering** (`routes/rostering/index.tsx`) — list/toolbar.
- **T3.10 Calendar** (`routes/calendar/index.tsx`) — header + toolbar; calendar body out of scope.
- **T3.11 Grades overview** (`routes/grades/overview.tsx`) — band + toolbar.
- **T3.12 Report card** (`routes/grades/report-card.tsx`) — detail recipe.
- **T3.13 Sections roster** (`routes/sections/roster.tsx`) — toolbar.
- **T3.14 Attendance index** (`routes/attendance/index.tsx`) — header + band.
- **T3.15 Attendance dashboard** (`routes/attendance/dashboard.tsx`) — band; keep heatmap.
- **T3.16 Student profile** (`students/$studentId.tsx`, `students/profiles.tsx`,
  `components/students/profile/OverviewTab.tsx`, `ScheduleTab.tsx`) — detail recipe; tab bands.
- **T3.17 Academics `ModuleOverviewPage`** — align to shared overview recipe.
- **T3.18 Academics VR sweep** — refresh all academics baselines; confirm zero unexpected drift.

**Demo:** every Academics route on the standard surfaces; VR suite green across the MFE.

---

## Sprint 4 — Finance fan-out (10 routes)

- **T4.1 Overview** (`routes/overview.tsx`) — band + header.
- **T4.2 Invoices index** (`billing/invoices/index.tsx`) — toolbar + band.
- **T4.3 Invoice detail** (`billing/invoices/$invoiceId.tsx`) — detail recipe.
- **T4.4 Bulk generate** (`billing/invoices/bulk-generate.tsx`) — wizard/bulk recipe (bulk-bar).
- **T4.5 Payments index** (`billing/payments/index.tsx`) — toolbar + band.
- **T4.6 Record payment** (`billing/payments/record.tsx`) — form recipe.
- **T4.7 Payment receipt** (`billing/payments/receipt.tsx`) — detail/print recipe.
- **T4.8 Accounts** (`billing/accounts/index.tsx`) — toolbar (bulk adjust-balance uses bulk-bar).
- **T4.9 Fee structures** (`configuration/fee-structures.tsx`) — recipe + band.
- **T4.10 Payment gateways** (`configuration/payment-gateways.tsx`) — settings recipe.
- **T4.11 Finance `ModuleOverviewPage` + VR sweep.**

**Demo:** Finance MFE standardized; existing finance pagination/table tests still green.

---

## Sprint 5 — People fan-out (9 routes)

- **T5.1 Overview** (`routes/overview.tsx`) — band + header (People was the house pilot MFE for prior
  design-system streams; align to the established pattern).
- **T5.2 Staff directory** (`routes/staff.tsx`) — toolbar + band; Google-Admin user-list rhythm.
- **T5.3 Staff detail** (`routes/staff/detail.tsx`) — detail recipe.
- **T5.4 Staff new** (`routes/staff/new.tsx`) — form/wizard recipe.
- **T5.5 People new** (`routes/new.tsx`) — form recipe.
- **T5.6 Departments** (`routes/departments.tsx`) — list/toolbar.
- **T5.7 Roles** (`routes/roles.tsx`) — list/toolbar.
- **T5.8 People analytics** (`routes/analytics.tsx`) — band + header.
- **T5.9 People settings** (`routes/settings.tsx`) — settings recipe.
- **T5.10 People `ModuleOverviewPage` + VR sweep.**

**Demo:** People MFE standardized.

---

## Sprint 6 — Shell fan-out (home, dashboards, settings, widgets, landing; portals deferred)

- **T6.1 Authenticated Home** (`pages/HomePage.tsx` — the routed home; the old
  `components/layout/pages/HomePage.tsx` mock dashboard was unrouted residue and has been **deleted**
  in the school-context/loading-states cleanup) — header + bands.
- **T6.2 Admin/Teacher/Student dashboards** (`home/AdminCommandCenter.tsx`, `home/TeacherDashboard.tsx`,
  `home/StudentDashboard.tsx`, `home/HomeStatCard.tsx`) — bands + header.
- **T6.3 Dynamic-page widgets** (`components/dynamic-page/widgets/*`) — align widget presentation to
  shared primitives. Scope shrunk: only `QuickActionsWidget` remains — Carousel/UpcomingEvents/WelcomeTip
  were never rendered by any live page config and were **deleted** (with their `widget-registry.ts`
  definitions and the `module-overview` page type) in the school-context/loading-states cleanup.
- **T6.4 Placeholder pages** — **obsolete**: `components/layout/pages/*Placeholder.tsx` were unimported
  residue and have been deleted; no migration needed.
- **T6.5 Settings sweep** (`pages/settings/*`, `pages/settings/tabs/*`, `components/settings/*`) — settings
  recipe; this path already errors `prefer-ui-select`/`no-local-form-style-constants` — keep green. (Multiple
  atomic sub-tickets, one per settings tab group, to respect the ~15-file cap.)
- **T6.6 Onboarding** (`components/onboarding/*`) — wizard recipe.
- **T6.7 Shell `ModuleOverviewPage`** — **obsolete**: the shell copy (`components/layout/ModuleOverviewPage.tsx`)
  was unimported residue and has been deleted; MFE-local ModuleOverviewPage files are unaffected.
- **T6.8 Landing v2** (`components/landing-v2/*`) — align presentation, respecting its distinct marketing tokens.
- **T6.9 Portals** (`pages/parent-portal/*`, `student-portal/*`, `portal-shared/*`) — **recorded deferral**
  per existing eslint policy: confirm still intentionally deferred (they still consume `StatStrip`), record the
  decision, and note this **blocks T7.1 StatStrip deprecation**. Migrate only if explicitly de-deferred.
- **T6.10 Shell VR sweep** (home + settings + landing).

**Demo:** Shell operator surfaces standardized; portals decision recorded.

---

## Analytics (parked) — recorded deferral + migrate-on-unpark

- **T-A.1 Deferral record** — document that `apps/analytics` (`routes/overview.tsx`, `dashboard.tsx`,
  `comparisons/index.tsx`, `custom/index.tsx`, `ModuleOverviewPage.tsx`, `AdoptionReportCard.tsx`) is parked
  (backend 403, hidden from nav) and intentionally not migrated now; enumerate its pages so nothing is silently
  missed.
- **T-A.2 Migrate-on-unpark** (queued) — apply the fan-out template to all analytics routes when the module is
  un-parked. Same ticket shape as S3–S5.

---

## Sprint 7 — Governance Ratchet & Cleanup

**Goal:** make drift impossible to reintroduce and remove all superseded code.

- **T7.1a Deprecate `StatCard` color-block API** — after S3–S6, once no non-portal page consumes the KPI path,
  remove/replace the required `accentColor`/`iconColor`/`barColor` + `signature` props (migrate all **31**
  consumers; grep-verified zero before deletion). Breaking change — do it as a single coordinated PR-set.
- **T7.1b Deprecate `StatStrip` color-block API** — **blocked on T6.9**: `StatStrip`'s only consumers are the 3
  deferred portal pages. Do this only after portals migrate; otherwise keep and record the block.
- **T7.2 Ratchet named lint rules** — the three color/style rules are **already error app-wide**. This ticket
  ratchets the **form rules** (`prefer-ui-select`, `prefer-ui-form-controls`, `no-local-form-style-constants`)
  from `warn`→`error` on now-migrated paths, and **removes the per-path overrides** (`CSVImport.tsx`, portal
  paths) as each is migrated. Name each rule + path changed.
- **T7.3 Dead-code sweep** — remove zombie components, commented blocks, unused `allow-*` comments, orphaned
  styles surfaced during S2–S6; run `knip`/`ts-prune` for unused exports.
- **T7.4 Docs** — add the three canonical surfaces as first-class recipes in `docs/design-system/README.md` +
  `page-recipes.md`; link the handoff references.
- **T7.5 Adoption codemod + deprecation comms** — ship a codemod/upgrade note for the `StatCard`/`StatStrip`
  consumers and any external MFE that imports them; announce the deprecation window.
- **T7.6 Full-matrix QA** — complete a11y (axe), contrast (full pair matrix incl. new pairs), reduced-motion,
  keyboard-nav, bundle-budget, and visual-regression passes across all migrated pages, light+dark; publish the
  final gate report.

**Demo:** whole app (minus recorded deferrals) on one presentation contract; named rules at error; zero dead KPI
code; docs current; full QA report green.

---

## Verification (end-to-end)

- **Per ticket:** `pnpm turbo typecheck && pnpm turbo lint && pnpm vitest run`; add/adjust the ticket's
  unit/interaction test; attach before/after screenshots (light+dark) + VR diff; ESLint delta ≤ 0; grep-verify
  no dead code. When `@edforge/ui` changes, also run `pnpm dev:mvp` cross-remote smoke (MF singleton).
- **Per sprint:** run the smoke path (`pnpm dev:mvp` → login → dashboard → academics → finance → settings, both
  themes, zero console errors); refresh that sprint's VR baselines with reviewed diffs; the sprint's demo surface
  (showcase route S0–S1; real pages thereafter) runs from a clean build.
- **Component correctness:** the three contracts are covered by `packages/ui` unit + focus-ring + contrast +
  axe + RTL tests; "one micro-viz per metric" is a type-enforced discriminated union + runtime-tested; StatBand
  composes `AnimatedProgressBar`/shared `Ring`/`StatusPill` (no parallel viz tree).
- **Project done when:** every non-deferred route consumes the canonical surfaces/recipes; `StatCard` color-block
  KPI usage is gone (`StatStrip` after portals); the named lint rules are errors on migrated paths; analytics +
  portals deferrals are explicitly recorded; the full VR/a11y/contrast/perf matrix is green.
