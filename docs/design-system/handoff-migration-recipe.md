# Handoff Migration Recipe & Definition of Done

**Sprint:** S0 (Foundation) · **Ticket:** T0.5

The copy-paste recipe every page-migration ticket (S2 pilot, S3–S6 fan-out) follows, plus the
per-PR Definition of Done. Derived from the design handoff for the three canonical surfaces.

## The three canonical surfaces

1. **PageHeader (pagebar mode)** — year switcher + date on the left, page actions on the right.
   No `<h1>` and no counts subtitle (the breadcrumb is the page name; the StatBand is the summary).
   `@edforge/ui` → `<PageHeader mode="pagebar" year date actions … />`.
2. **StatBand** — one KPI strip, calm by default; `state` drives the single accent color; exactly one
   micro-viz per metric (`delta` | `pill` | `meter` | `donut`).
   `@edforge/ui` → `<StatBand metrics={…} />`.
3. **TableToolbar** — one search · docked segmented presets · primary facet · More filters · quiet
   right cluster (density · columns · export); bulk-action bar swaps in on selection (same footprint).
   `@edforge/ui` `data-table` → presets via `<TablePresetTabs>` in the toolbar, bulk via `<TableBulkBar>`.

## Per-page migration steps

1. **Header:** replace the local title / `ContextBar` / insight-subtitle with `PageHeader`
   (`mode="pagebar"` for list/dashboard pages; `mode="titled"` stays for detail/form pages).
2. **Band:** replace `StatCard`/`StatStrip` KPI grids with `StatBand`. Choose `state` + one micro-viz
   per metric. **Calm by default** — no per-metric signature accent; semantic color only when the data
   warrants it.
3. **Toolbar (list pages):** fold local filter rows + any second search box into the DataTable toolbar
   — status presets as `TablePresetTabs`, the primary facet + "More filters", right cluster
   (density · columns · export). Bulk actions render in `TableBulkBar` (same footprint, no layout shift).
4. **States:** replace bespoke skeleton/empty/error/guard blocks with `@edforge/ui` state primitives
   (`EmptyState`, `ErrorState`, `LoadingState`, `InlineAlert`) where they fit.
5. **Delete** all superseded local code — old KPI cards, orphan preset buttons, the second search box,
   the H1/subtitle, and any now-unused imports/components. **No commented-out or hidden leftovers.**
6. **Tokens only** — no hardcoded palette colors, no arbitrary Tailwind values, no inline presentation
   styles (except `allow-presentation-style` for genuinely dynamic data viz, with a reason).

## Acceptance checklist (paste into every migration PR)

- [ ] No `<h1>`/page title and no counts subtitle on list pages (breadcrumb + band carry it).
- [ ] StatBand is calm by default; color appears only for non-normal `state`s.
- [ ] Exactly one micro-viz per metric.
- [ ] One search field only; status presets are docked in the toolbar; facet + More filters present.
- [ ] Bulk-action bar swaps in on selection with no layout shift.
- [ ] Bespoke skeleton/empty/error states replaced by shared `@edforge/ui/states` primitives where applicable.
- [ ] All removed UI is physically deleted — `grep` confirms no dead `StatCard`/insight/filter-row imports.
- [ ] Only semantic tokens used; ESLint design-system rules pass (delta ≤ 0).
- [ ] Unit/interaction tests updated (KPI assertions → band assertions); or a reviewed before/after
      screenshot + visual-regression baseline where a unit test doesn't fit.

## Stop-the-line gates (every PR)

`pnpm turbo typecheck` · `pnpm turbo lint` (zero net-new) · `pnpm vitest run` · contrast test ·
focus-ring test · visual-regression (intended drift reviewed) · cross-remote `pnpm dev:mvp` smoke when
`@edforge/ui` changes · smoke path (login → dashboard → academics → finance → settings, both themes).
If any gate fails, the PR pauses.
