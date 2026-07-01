# MFE Modernization — S0–S2 Retrospective & Handoff to Design

**Audience:** Claude Design (next slice) · **Status of this slice:** S0–S2 pilot complete on
`claude/edforge-s2-academics-pilot` (PR #278) · **Next slice:** design-first prototypes for the
**/home page** and the **module Overview pages**.

This is a context handoff, not a spec. It captures *what the pilot proved*, *the presentation contract
you must design within*, and *what's specifically open* for the Home + Overview surfaces — so the
prototypes drop straight into the existing system with no drift.

---

## 1. Where we are

The EPIC converges every operator page in the Edforge Platform Web MFEs onto **three canonical,
config-driven surfaces** distilled from the original design handoff:

1. **① `PageHeader` (pagebar mode)** — year switcher + date on the left, page actions on the right.
   **No H1 / no counts subtitle** (the breadcrumb names the page; the stat band summarizes it).
2. **② `StatBand`** — one unified KPI strip. **Calm by default**; semantic color appears *only* when a
   metric needs attention. Exactly **one micro-viz per metric** (delta chip · status pill · target meter
   · readiness donut).
3. **③ Unified table toolbar** — one search · docked status presets · a primary facet · "More filters"
   · a quiet right cluster (density · columns · export). A bulk-action bar swaps in on selection with the
   same footprint (no layout shift).

S0–S2 built these in `@edforge/ui` and piloted them on **Students, Curriculum, Exams**. Scope was
deliberately those three pages only — **classrooms and the overview/home surfaces were deferred to this
design-first slice** precisely because they're richer than the three surfaces and warrant a design pass
before implementation.

---

## 2. What shipped (S0–S2 + two polish rounds)

- **S0 — foundation:** token-reconciliation map (`docs/design-system/handoff-token-map.md` — confirms the
  handoff needs **no new tokens**), migration recipe + Definition-of-Done
  (`docs/design-system/handoff-migration-recipe.md`), contract-test scaffolds, and the full sprint plan
  (`docs/mfe-modernization-sprint-plan.md`, S0–S7).
- **S1 — canonical components** in `@edforge/ui` (composed from existing primitives, not forked):
  - `components/StatBand.tsx` — segments, states, one-micro-viz discriminated union, live pulse.
  - `components/Ring.tsx` — shared SVG donut-ring core extracted from `GpaRing`/`AttendanceDonutRing`.
  - `components/layout/PageHeader.tsx` — added `mode: 'titled' | 'pagebar'` (default `titled`, back-compat).
  - `components/data-table/` — `DataTableToolbar` (unified layout), `TablePresetTabs` (docked presets w/
    counts), `TableBulkBar` (same-footprint bulk bar), `DataTableMoreFilters` (headlessui popover).
  - Live showcase: `apps/shell/src/pages/dev/design-system.tsx`.
- **S2 — academics pilot:** `apps/academics/src/routes/{students,curriculum,exams}/index.tsx` migrated to
  the three surfaces; bespoke insight strips / KPI grids / skeletons / empty states deleted.
- **Round 2 (prototype fidelity):** single clean ~288px search with `/` kbd hint; docked presets **with
  counts**; primary facet + "More filters" popover in the correct order; KPI chips adopted the merged
  **AnimatedIcon** system (PR #274).
- **Round 3 (polish):** search icon overlap fixed (logical→physical padding); toolbar borders unified to a
  subtle `/0.35` in both themes; Curriculum tabs now reflect the active tab in the **URL**, the top
  `StatBand` is **dynamic per tab**, and the Grade-levels table gained the unified toolbar.

---

## 3. The contract you must design within

These are the reusable rules the pilot locked in. Designing the Home + Overview prototypes to match them
means the implementation is mostly wiring, not reinvention.

- **Tokens — semantic only** (`rgb(var(--…))`), never hex/hardcoded:
  - `--border-primary` is **contrast-locked** (pure white in dark, taupe in light — passes 3:1). Get
    subtlety via **`/opacity`** (the toolbar uses `/0.35`), not by picking a lighter token.
  - `--mint` = focus accent (aqua, `--border-focus`) — **not** the brand CTA. `--action-primary` = deep
    green `#0F6E56`. Don't conflate them.
  - `--state-{success|warning|danger|info}-{bg|fg|border}` = **attention only**. `--accent-*` = per-metric
    signature family (enrollment/finance/attendance/academics + module accents like `--accent-reports`).
- **Calm by default.** A KPI band should read neutral; a metric turns colored *only* via its `state`.
- **`StatBand` contract:** exactly one micro-viz per metric — `delta | pill | meter | donut` (enforced by
  a discriminated union). `state ∈ normal | good | warn | critical | info | live | muted`.
  `iconSignature` → `AnimatedIcon` (44 curated signatures; `.ef-motion` hover-replay; reduced-motion safe).
  It **composes** `StatusPill` / `AnimatedProgressBar` / `Ring` — reuse these, don't build parallel viz.
- **`PageHeader` pagebar:** no H1/subtitle; year switcher + date + right-aligned actions (one `primary`).
- **Toolbar order:** search → docked presets(counts) → primary facet → More filters → *(grows)* →
  density · columns · export.
- **Governance (ESLint `eslint-design-system`, errors app-wide):** no hardcoded colors, no arbitrary
  Tailwind size values (use scale classes — `w-72`, `min-h-24`, not `w-[288px]`), no presentation style
  objects. App is **LTR-only** → use **physical** utilities (`pl-`/`pr-`/`ml-`/`border-l`), not logical
  (`ps-`/`pe-`/`ms-`/`border-s`) — logical padding does not render in this Tailwind build. `pnpm
  check:icons` guards animated-icon coverage.

---

## 4. Open threads / deferrals (not blockers for design)

- Exams' client-side facets aren't yet folded into "More filters" (needs a non-nested-popover facet
  renderer) — a component gap, not a design one.
- `packages/theme` border-token change is **out** (contrast-locked).
- S3–S7 fan-out (rest of academics, finance, people, shell, governance ratchet) is still pending.

---

## 5. Guidance for the next slice — Home + module Overview prototypes

These are **dashboard** surfaces, so the top of each page maps cleanly onto what already exists:

- **Reuse the top band:** `PageHeader` (pagebar) + `StatBand` fit the header + KPI strip directly. Please
  **do not** reintroduce color-block `StatCard` grids — those are the pattern S2 removed. KPI identity
  icons should use **AnimatedIcon signatures**, and the band stays **calm by default**.
- **Design the missing 4th recipe.** Home and Overview carry content the three surfaces don't cover —
  quick-actions, carousels, upcoming-events, charts, welcome/onboarding widgets, and activity feeds. The
  pilot has no canonical "section/widget card" surface for these, so they're the highest drift risk.
  **The most valuable thing this slice can produce is a canonical, config-driven section/widget-card
  recipe** (header + optional actions + body slot + empty/loading states) that composes from tokens, so
  every dashboard widget shares one contract instead of bespoke cards.
- **Account for role variants.** The Home page is role-based (Admin / Teacher / Student dashboards). The
  prototype should show how the same surfaces recompose per role rather than three unrelated layouts.
- **Deliver in the established handoff format** — component contracts with **exact token names** and
  one-micro-viz-per-metric discipline (the same shape the S0–S2 handoff used). That lets implementation
  extract contracts and reuse existing primitives (`StatBand`, `Ring`, `StatusPill`, `AnimatedProgressBar`,
  `PageHeader`, the toolbar suite) without guesswork.

**One-line brief for design:** *Top of every dashboard = pagebar header + calm StatBand (reuse). Below it,
give us the one canonical widget/section-card recipe that the current three surfaces are missing — token-
driven, role-aware, with defined empty/loading states.*
