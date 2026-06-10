# Platform Responsiveness — Sprint Plan (scoped)

**Status:** proposed (separate sprint). Surfaced during the Students-table V1
hardening, where the table toolbar wrapped awkwardly at mid widths.

## Why a dedicated sprint (not per-page)

Responsiveness is cross-cutting — toolbars, data tables, KPI grids, drawers, the
shell nav. Fixing it page-by-page drifts. This sprint defines **common
breakpoints** and a **shared pattern library**, then applies them to the
highest-traffic surfaces first.

Breakpoints (Tailwind): `sm 640 · md 768 · lg 1024 · xl 1280`. Design
mobile-first.

## Already shipped (out of scope here)

- Table **toolbar wrap fix**: `DataTableToolbar` groups View + actions into a
  trailing cluster (`ml-auto`, no-shrink) so they wrap together, right-aligned,
  instead of an action dropping alone to the bottom-left.
- Table **responsive column visibility**: the View menu + the Students table's
  `< lg` auto-hide of Guardian/Location/Enrolled (the correct table strategy).

## R1 — Toolbar "Filters sheet" (Students + Classrooms first)

The current toolbar (`presets · search · Grade ▾ · Status ▾ … View · Export`)
is fine ≥ `md`. Below `md`:

- **Search** → full-width on its own row.
- **Presets** (All/Active/At-risk/Pending) → a horizontally-scrollable chip rail
  (no wrap).
- **Grade + Status selects** → collapse into a single **"Filters" button** with
  an active-count badge → opens a **bottom sheet / popover** (reuse
  `@edforge/ui` `Drawer`/`QuickDrawer` or a `Modal`); apply/clear inside.
- **View + Export** → compact **icon buttons** (no labels).

Build as a shared, additive `DataTableToolbar` capability (a `compact`/sheet
mode driven by `useMediaQuery`) so every table benefits, not just Students.

**Acceptance:** at 375 / 768 / 1024 / 1440 px the toolbar never overflows or
orphans a control; filters reachable in ≤ 2 taps on mobile; keyboard + SR
complete; light + dark.

## R2 — Dense tables on small screens

The `tableLayout: fixed; w-full` table compresses columns rather than scrolling.
Decide per-table between (a) the responsive column-visibility already in place,
and (b) an opt-in horizontal-scroll/`minWidth` mode (the deferred
`DataTable` enhancement) for tables that must show all columns. Students uses
(a); confirm Classrooms/Finance.

## R3 — KPI grids, drawers, shell nav

- KPI `StatCard` grids: `grid-cols-2` → `lg:grid-cols-4` (verify all 4 MFEs).
- `QuickDrawer`/`Drawer`: full-width sheet < `sm`; confirm focus-trap + scroll.
- Shell sidebar: collapse to a hamburger/rail < `md`; verify the MFE content
  pane reflows.

## R4 — Verification gate

Per the CLAUDE.md render-path gate: `pnpm dev:shell`, walk the highest-traffic
routes at 375 / 768 / 1024 / 1440 in light + dark before sign-off. Add a small
Playwright viewport-matrix smoke for the toolbar + table.
