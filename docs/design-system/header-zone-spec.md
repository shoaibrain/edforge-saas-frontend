# Header Zone — technical product feature specification

**Status:** Shipped to `uat` via PRs #297 (slice 1a — primitives + Academics Overview), #298
(1b — Students), #299 (1c — Classrooms), #300 (1d — Exams), #301 (phase 2 — Home +
Finance Invoices). This document is the canonical spec: contracts, motion, adoption
matrix, backend gaps, and the remaining backlog with acceptance criteria. It is written
so an agent can complete the remaining work with no other context.

**Source of truth (read these before changing anything):**

| Concern | File |
|---|---|
| Signal contract + labels | `packages/ui/src/components/header-zone/Signal.ts` |
| ⑧ AttentionCorner (provider + pill + shade) | `packages/ui/src/components/header-zone/AttentionCorner.tsx` |
| ⑨ SelectionContextBar | `packages/ui/src/components/header-zone/SelectionContextBar.tsx` |
| Selection label defaults | `packages/ui/src/components/header-zone/labels.ts` |
| Barrel | `packages/ui/src/components/header-zone/index.ts` (re-exported from `packages/ui/src/index.ts`) |
| Ack persistence | `packages/ui/src/hooks/useSignalAcks.ts` |
| Header slot | `packages/ui/src/components/layout/PageHeader.tsx` (`pagebar` mode, `attention` prop) |
| Toolbar morph | `packages/ui/src/components/data-table/DataTable.tsx` (`selectionBar` prop) → `packages/ui/src/components/data-table/DataTableToolbar.tsx` (`bulkBar`/`bulkActive`) |
| Unit tests | `packages/ui/src/components/header-zone/__tests__/AttentionCorner.test.tsx`, `.../SelectionContextBar.test.tsx` |
| Integration test | `apps/shell/src/__tests__/home.integration.test.tsx` |
| Showcase | `apps/shell/src/pages/dev/design-system.tsx` ("Header Zone" section) |

Per repo convention (CLAUDE.md): never assume a file renders at a URL from its name —
trace `apps/shell/src/router.tsx` → the remote's `router.tsx` → tab/step conditional
before editing any adopter.

---

## 1. Product framing

EdForge is an EMIS aligned with the World Bank's **SABER** framework, whose fourth
pillar is **utilization for decision-making**: an education data system earns its keep
only when data prompts decisions, not when it merely displays. The Header Zone is the
frontend expression of that pillar, as two shared, config-driven systems:

- **⑧ AttentionCorner** — every *Signal* is a **prompted decision**: a quantified,
  page-scoped condition ("16 students below 80% attendance"), tagged with the SABER
  domain it serves (**Attendance · Assessment · Finance · Enrollment · Capacity · Data
  quality**), carrying a deep-linked **fix** that lands the operator on the surface
  where the decision is executed. Signals are **derived, never stored**: the page's
  hooks compute them from live react-query data on every render, so when the data heals
  (attendance recorded, invoice collected, exam results generated) the signal simply
  stops being emitted — auto-resolution with zero lifecycle machinery.
- **⑨ SelectionContextBar** — selection is a *state*, not a floating afterthought. When
  rows are selected, the table's own toolbar morphs in place into a state-aware action
  matrix: actions show **subset count chips** when they apply to only part of the
  selection (and the confirm handler receives exactly those ids), show a
  **plain-language disabled reason** when nothing qualifies, and stay **visible with a
  lock glyph** when the signed-in role lacks permission — discoverability teaches the
  role model instead of hiding capability.

**The decision hierarchy per severity is deliberate:**

| Severity | Affordances | Persistence |
|---|---|---|
| `critical` | Deep-link fix (primary button) + thumbs-up **Acknowledge** ("Got it") | Ack persisted per user (`useSignalAcks`, localStorage today) — an acknowledged critical leaves the pill count but stays visible, dimmed, in the shade with an "Acknowledged" chip (click = undo). It can never be silently swiped away. |
| `warn` / `info` | Optional fix (secondary button) + **Dismiss** (×) | Session-scoped only — resets on remount by design. |

**Coverage of the removed year/date corner.** `PageHeader` `pagebar` mode used to
render a year chip / date in the top-left. Since the app is always scoped to the
current academic year, that chip was static noise; it was removed (see the comment in
`PageHeader.tsx`: *"No year chip / date anymore — an empty pagebar renders nothing"*).
The Attention Corner pill now occupies that top-left slot (`attention` prop), turning
dead header real estate into the page's decision queue — visually balancing the primary
actions on the right (same row, same `h-9` height).

---

## 2. Architecture

### 2.1 Component tree and context coordination

`AttentionCorner` is a **compound component**. The root is a pure context provider (no
DOM); the pill and shade are siblings that can be mounted anywhere inside it:

```
<AttentionCorner signals acked onAck onUnack labels>     ← provider (no DOM)
  <PageHeader mode="pagebar" attention={<AttentionCornerPill/>} actions=… />
  <AttentionCornerShade />                               ← full-width, in flow, below the header
</AttentionCorner>
```

The context (`AttentionContextValue`, private) carries: `open`/`setOpen`, the
`pillRef` (focus return target), resolved `labels`, `visible` (signals minus
session-dismissed, severity-ranked critical → warn → info), `counts` per severity
(**excluding acknowledged** signals), `total`, `ackedSet`, `onAck`/`onUnack`, and
`dismiss`. `AttentionCornerPill` / `AttentionCornerShade` throw if rendered outside the
provider. Session dismissals live in provider state (`useState<Set>`), so they reset on
remount — intentionally.

Two mounting patterns exist in production:

1. **Pagebar slot** (all list/dashboard pages): the pill goes into
   `PageHeader mode="pagebar"` via the `attention` prop; `PageBar` renders
   `<div className="flex min-w-0 items-center">{attention}</div>` opposite
   `PageActions`. The shade is rendered as the next sibling.
2. **Slim standalone row** (shell Home, which has no pagebar — the greeting lives in
   the topbar): `<div className="flex items-center"><AttentionCornerPill/></div>`
   followed by `<AttentionCornerShade className="mt-3"/>`.

The Classrooms module mounts one corner at the *module shell* level, above the tab
strip, so its signals span all four tabs (see §5.3).

### 2.2 Selection bar → toolbar morph path

`SelectionContextBar` is a dumb, host-agnostic toolbar node. Two hosting paths:

- **DataTable path** (Students, Exams, classroom table view, Finance Invoices): the
  page builds the `<SelectionContextBar/>` node and passes it as `DataTable`'s
  `selectionBar` prop. Inside `DataTable.tsx`:
  `const selectionBarActive = !!selectionBar && selectedRowCount > 0` — the node is
  forwarded to `DataTableToolbar` as `bulkBar`/`bulkActive`. `DataTableToolbar` early
  returns `<div className="min-h-9">{bulkBar}</div>` when active; the normal toolbar
  row is also `min-h-9`, so the swap is **in place with zero layout shift**. The morph
  requires a toolbar to exist (any toolbar-triggering prop present). Passing
  `selectionBar` also **suppresses the legacy `FloatingBulkBar` entirely**
  (`{!selectionBar && <FloatingBulkBar …/>}`).
- **Page-owned toolbar path** (Classrooms OverviewTab, whose one toolbar drives both
  the card grid and the table): the page conditionally renders either its toolbar row
  or the selection bar inside the identical container chrome
  (`rounded-t-xl border border-b-0 … px-3 py-2.5`), achieving the same
  zero-layout-shift morph without DataTable.

Domain table wrappers (`apps/academics/src/components/students/StudentTable.tsx`,
`.../scheduling/SectionTable.tsx`, `.../exams/ExamTable.tsx`) pass `selectionBar`
through and set `bulkActions={selectionBar ? undefined : bulkActions}` so the two
systems can never render together.

### 2.3 Why FloatingBulkBar is being retired

`FloatingBulkBar` (private, bottom of `DataTable.tsx`) is the legacy floating pill that
appears centered over the table on selection. It is retired because:

- It **floats over rows**, obscuring the data the user just selected, and is positioned
  by magic numbers (58 px pill height, 68 px footer offset).
- It is **not state-aware**: `BulkAction` (`packages/ui/src/components/data-table/types.ts`)
  has only `label/icon/onRun/disabled/tone` — no applicability subsets, no per-action
  disabled reasons, no role locks; handlers receive raw `selectedRows` regardless of
  eligibility, pushing eligibility logic into every confirm modal.
- No `Select all N`, no single-select peek, weaker a11y (an `aria-live` region, not a
  `role="toolbar"` that keyboard users can reach in document order).

It still renders on pages that pass `bulkActions` without `selectionBar` (§7a lists
them). New pages must never use `bulkActions`.

### 2.4 Ownership boundary

The bar/corner own **presentation and interaction only**. Pages own: signal derivation
(role-filtered there, not in the component), the action matrix computation, heavy
surfaces (drawers/modals/toasts) opened from `onAction`, selection state
(`RowSelectionState` lifted to the page so completion callbacks can clear it), and
localized labels. `useSignalAcks` owns ack persistence.

---

## 3. Contracts

### 3.1 Signal (`packages/ui/src/components/header-zone/Signal.ts`)

```ts
export type SignalSeverity = 'critical' | 'warn' | 'info'

export interface Signal {
  /** Stable id per source condition (e.g. 'academics.at-risk-critical'). */
  id: string
  severity: SignalSeverity
  /** SABER domain tag, already localized (Attendance · Assessment · Finance · Enrollment · Capacity · Data quality). */
  domain: string
  /** One line, specific and quantified. */
  title: string
  /** One line of context. */
  description?: string
  icon?: ReactNode
  /** Deep-link to the fixing surface. Rendered primary on critical signals. */
  fix?: { label: string; onAction: () => void }
  /**
   * Whether the signal offers the acknowledge affordance (persisted per user
   * upstream). Defaults to true for critical signals, false otherwise —
   * critical signals acknowledge, warn/info dismiss (session-scoped).
   */
  ackable?: boolean
}
```

Field semantics:

- **`id`** — stable per *condition*, namespaced by page (`<page>.<condition>`:
  `students.at-risk-critical`, `classrooms.at-capacity`, `invoices.overdue`,
  `finance-overdue` on Home via `useHomeAlerts`). Acks are keyed on this id, so
  changing an id orphans persisted acks. Never encode counts into the id.
- **`severity`** — drives ranking, styling, the pill segment, pulse (critical only),
  and the ack-vs-dismiss affordance.
- **`domain`** — a *pre-localized string*, not an enum; pages pass
  `t('moduleOverview.signals.domains.attendance')` etc. Rendered as an uppercase
  bordered tag on the row.
- **`title` / `description`** — title must be quantified and specific; description is
  one context line (rendered `text-2xs`, tertiary).
- **`icon`** — optional 4×4 lucide glyph, rendered inside an 8×8 severity-tinted chip.
- **`fix`** — the prompted decision's execution path. On `critical` rows it renders as
  the primary (filled) button; on warn/info as a secondary outline button. Handlers
  either navigate (`navigate({to})`), switch a tab (`setActiveTab`), or apply the
  page's own filter/preset (`setFilterMode('at-risk')`, `setStatusFilter('overdue')`,
  `setActiveBucket('awaiting')`).
- **`ackable`** — override only; the default (`severity === 'critical'`) is the
  product rule. Non-critical rows always get the dismiss ×; critical rows never do.

### 3.2 AttentionCornerLabels + defaults (same file)

```ts
export interface AttentionCornerLabels {
  needAttention: string      // pill suffix next to severity counts
  allClear: string           // pill label when no live signals remain
  region: string             // shade eyebrow + region aria-label, e.g. "Needs attention"
  minimize: string           // shade close button
  acknowledge: string        // ack button ("Got it")
  acknowledged: string       // acknowledged chip (click to undo)
  acknowledgedHint: string   // chip title tooltip
  dismiss: string            // dismiss aria-label prefix
  emptyTitle: string         // shade empty state ("You're all caught up.")
}

export const DEFAULT_ATTENTION_LABELS: AttentionCornerLabels = {
  needAttention: 'need attention',
  allClear: 'All clear',
  region: 'Needs attention',
  minimize: 'Minimize',
  acknowledge: 'Got it',
  acknowledged: 'Acknowledged',
  acknowledgedHint: 'Acknowledged — click to undo',
  dismiss: 'Dismiss',
  emptyTitle: 'You’re all caught up.',
}
```

English defaults ship in the package; every app passes a full localized set (see §5
for the namespaces). `labels` on the provider is `Partial<>`-merged over the defaults.

### 3.3 AttentionCornerProps (`AttentionCorner.tsx`)

```ts
export interface AttentionCornerProps {
  signals: Signal[]
  /** Acknowledged signal ids (persisted per user by the app). */
  acked?: ReadonlySet<string> | readonly string[]
  onAck?: (id: string) => void
  onUnack?: (id: string) => void
  labels?: Partial<AttentionCornerLabels>
  children: ReactNode
}
```

- **`signals`** — recompute every render from query data; pass `[]` while the source
  query loads (all adopters do `isLoading ? [] : signals`). Note the pill renders the
  mint "All clear" state for `[]`, so pages that would rather show nothing while
  loading must gate the whole corner (Home does: `{!alertsLoading && <AttentionCorner…}`).
- **`acked`** — the component is *controlled* for acks: it renders whatever the app
  says is acknowledged. `onAck`/`onUnack` fire after the 480 ms pop / chip click; the
  app persists (all adopters wire `useSignalAcks`). If `onAck` is absent, the ack
  button is not rendered at all.
- **Ack counting rule** — acked signals are excluded from pill `counts`/`total` but
  remain in `visible` (dimmed rows in the shade). Dismissed signals are excluded from
  both until remount.

### 3.4 SelectionAction + SelectionContextBar (`SelectionContextBar.tsx`)

```ts
export interface SelectionAction {
  id: string
  label: string
  icon?: ReactNode
  /** Ids of the selected rows this action can apply to. */
  applicableIds: string[]
  /** The signed-in role lacks permission — render with a lock, don't hide. */
  locked?: boolean
  /** Tooltip when locked (e.g. "Requires Admin"). */
  lockedReason?: string
  /** Plain-language tooltip when nothing in the selection qualifies. */
  disabledReason?: string
  danger?: boolean
  onAction?: (applicableIds: string[]) => void
}

export interface SelectionContextBarLabels {
  selected: (count: number) => string
  selectAll: (total: number) => string
  clear: string
}

export interface SelectionContextBarProps {
  selectedCount: number
  /** Total selectable rows — enables the "Select all N" affordance. */
  totalCount?: number
  onClear: () => void
  onSelectAll?: () => void
  actions: SelectionAction[]
  /** Single-select peek strip (avatar + name + one key stat line). */
  peek?: ReactNode
  labels?: Partial<SelectionContextBarLabels>
  className?: string
  'aria-label'?: string
}
```

Behavioral semantics (all load-bearing — tests assert them):

- **`applicableIds`** — the page computes this per action from the selected rows'
  state (e.g. drafts only, inactive sections only). Rendering rules:
  `applicable < selectedCount` and not locked → **count chip** with the applicable
  number and a `"{label} · {applicable}/{selected}"` tooltip; `applicable === 0` →
  disabled (`aria-disabled`, 45 % opacity, `disabledReason` as `title`); on click the
  handler receives **exactly `applicableIds`, never the raw selection** — subset
  honesty is the core guarantee.
- **`locked`** — visually identical to disabled plus a trailing lock glyph and
  `lockedReason` tooltip; click is a no-op. Locked wins over the count chip.
- **`danger`** — red-tinted border/text (used for Archive, destructive bulk deletes).
- **`peek`** — rendered instead of the count when `selectedCount === 1`; the sr-only
  `aria-live="polite"` count remains either way.
- **Select all N** — rendered only when `onSelectAll && totalCount != null && selectedCount < totalCount`;
  hidden below the `sm` breakpoint. "N" is whatever the page passes — all shipped pages
  pass the *loaded/filtered* row count, not the server total (see §6 bulk-endpoint gap).
- **Clear** — the leading ✕ button and a window-level `Escape` listener (active only
  while the bar is mounted, i.e. only while a selection exists) both call `onClear`.
- **Actions row** — `overflow-x-auto`, never wraps; buttons are `shrink-0`.
- `DEFAULT_SELECTION_LABELS` (in `labels.ts`) provides English fallbacks; apps pass
  localized closures.

### 3.5 useSignalAcks (`packages/ui/src/hooks/useSignalAcks.ts`)

```ts
const STORAGE_KEY = 'edforge.signal-acks'

export function useSignalAcks(): {
  acked: ReadonlySet<string>
  ack: (id: string) => void
  unack: (id: string) => void
}
```

- Stores a `Record<signalId, epochMs>` JSON map under localStorage key
  **`edforge.signal-acks`** (per browser ≈ per user — interim, see §6). `ack` writes
  `Date.now()`; `unack` deletes the key. Storage failures degrade to in-memory for the
  session. Dismissals are **not** stored here — those are session state inside
  `AttentionCorner` by design.
- Exported from `@edforge/ui` (`packages/ui/src/index.ts`);
  `apps/academics/src/hooks/useSignalAcks.ts` is a thin re-export so all MFEs share one
  map.
- Known limitation: each hook instance snapshots localStorage at mount and there is no
  `storage`-event or cross-instance sync — two simultaneously mounted corners (e.g.
  two MFEs) won't see each other's acks until remount. Acceptable at current scale;
  the backend roaming slot (§6/§7d) supersedes it.

---

## 4. Interaction, motion, and accessibility spec

### 4.1 Pill states

- **Counts state** (`total > 0`): `h-9` rounded-full bordered pill showing, in severity
  order, a colored 1.5×1.5 dot + tabular-nums count *per severity that is non-zero*,
  then the muted `needAttention` label, then a chevron. The **critical dot pulses**:
  `scale [1, 1.45, 1]`, `opacity [1, 0.75, 1]`, 2.2 s, infinite, easeInOut —
  suppressed under reduced motion. Counts **exclude acknowledged** signals; a page
  whose only signals are all acked shows the all-clear pill while the shade still
  lists the dimmed rows.
- **All-clear state** (`total === 0`): mint success-tinted pill, check icon +
  `allClear` label + chevron. Still expandable (empty/acked shade state behind it).
- Chevron rotates 180° when open (`transition-transform`, `motion-reduce:transition-none`).
- `aria-expanded` reflects `open`; the pill is the focus-return target for every close
  path.

### 4.2 Shade — desktop (≥768 px)

In-flow expanding region rendered where the page placed `<AttentionCornerShade/>`
(directly below the header): `AnimatePresence` + measured-height animation
`initial {height: 0, opacity: 0, y: -6}` → `animate {height: 'auto', opacity: 1, y: 0}`,
**0.34 s, cubic-bezier(0.32, 0.72, 0, 1)** — framer-motion measures the natural height,
so content is *pushed down smoothly*, never an auto-height jump and never an overlay.
Body: a bordered `rounded-xl` panel with the uppercase `region` eyebrow + `minimize`
button, then either the success-tinted `emptyTitle` row or a `<ul>` of `SignalRow`s
(gap 1.5).

### 4.3 Shade — mobile bottom sheet (<768 px)

Gated by `useMediaQuery('(max-width: 767px)')`. Same body content presents as a
**fixed bottom sheet**: full-width, `rounded-t-2xl`, `maxHeight: 72vh`, scrollable,
drag-handle bar, over a scrim (`fixed inset-0`, 40 % text-primary tint, 0.2 s fade,
click-to-close, `aria-hidden`). Sheet enters/exits `y: '105%' ↔ 0`, **0.32 s,
cubic-bezier(0.32, 0.72, 0, 1)**. The sheet is **focus-trapped** via `useFocusTrap`
(`packages/ui/src/hooks/useFocusTrap.ts`): focuses the first focusable child on open
(rAF-deferred for AnimatePresence), wraps Tab/Shift-Tab, and restores prior focus on
close.

### 4.4 Esc ladder

- **Selection bar**: `Escape` clears the selection — listener is active exactly while
  the bar is mounted (a selection exists).
- **Attention shade**: `Escape` closes the shade and returns focus to the pill —
  listener active only while `open`.
- **Heavier surfaces** (modals/drawers the actions open — `BulkArchiveStudentsModal`,
  `BulkExamStatusDrawer`, `CancelInvoiceDialog`, …) own their own Esc handling above
  both.
- Known sharp edge: both header-zone listeners attach to `window` without
  `stopPropagation`, so with a shade open *and* rows selected one Esc press does both.
  In practice the surfaces rarely coexist on screen; a formal ladder (topmost surface
  consumes) is fair game for the polish pass (§7c) but is not currently implemented.

### 4.5 Acknowledge micro-interaction (critical rows)

Click "Got it" → 480 ms optimistic **pop** state before `onAck(id)` fires
(`setTimeout(480)`): button flips to success tint; the thumbs-up icon springs
(`scale [1, 1.4, 0.9, 1]`, `rotate [0, -12, 4, 0]`, 0.48 s,
cubic-bezier(0.34, 1.56, 0.64, 1) — overshoot) while a **radiating ring** expands from
it (`scale 0.5 → 2.3`, `opacity 0.6 → 0`, 0.5 s easeOut). After `onAck`, the app's
`acked` set updates and the row re-renders dimmed (`opacity-60`, desaturated domain
tag) with the success "Acknowledged" chip — clicking the chip fires `onUnack(id)`
(tooltip: `acknowledgedHint`). Under reduced motion, `onAck` fires immediately with no
pop/ring. Re-clicks during the pop are ignored (`acking` guard).

### 4.6 Dismiss (warn/info rows)

The trailing × adds the id to the provider's session `dismissed` set: the row leaves
both the shade and the pill counts until the corner remounts (navigation). No
persistence, no callback.

### 4.7 Morph semantics (⑨)

Toolbar → selection bar swap happens in the same `min-h-9` footprint: no height
change, no scroll jump, no re-layout of the table below. The bar's visual grammar —
left `border-l-2` focus-colored edge + mint left-to-transparent gradient — marks the
"selection mode" state. Restoring (✕/Esc/selection emptied) re-renders the ordinary
toolbar with all its state (search text, presets, facets) intact, because the toolbar
was never unmounted conceptually — only the row's content swapped.

### 4.8 Reduced motion

`useReducedMotion()` (framer-motion) collapses everything to end states: scrim/shade/
sheet durations 0, no critical-dot pulse, immediate `onAck`, no pop/ring; CSS
transitions carry `motion-reduce:transition-none`. Adopters also gate their page-level
stagger variants.

### 4.9 Accessibility contract (normative)

| Surface | Requirement |
|---|---|
| Pill | Real `<button>`, `aria-expanded`, focus ring (`focusRing`), severity dots `aria-hidden` (counts are text). |
| Shade / sheet | `role="region"` + `aria-label={labels.region}`; unmounted entirely when closed (no hidden content). |
| Signal list | `<ul>`/`<li>` — rows are `listitem`s (tests select by role). |
| Ack / dismiss buttons | `aria-label` = `"{acknowledge} — {title}"` / `"{dismiss} — {title}"` — unique per row. |
| Focus return | Every close path (Esc, minimize, scrim) returns focus to the pill; the mobile sheet additionally restores via the focus trap. |
| Selection bar | `role="toolbar"` + `aria-label` (page passes a localized one, default "Selection actions"). |
| Selection count | sr-only `aria-live="polite"` span always announces `labels.selected(count)`, including when the peek replaces the visible count. |
| Disabled/locked actions | `aria-disabled` (NOT `disabled` — they stay focusable/discoverable) + reason via `title`. Locked adds an `aria-hidden` lock glyph; the reason text is the accessible differentiator. |
| Clear | `aria-label={labels.clear}` on the ✕. |
| FloatingBulkBar (legacy) | `aria-live="polite"` + `role="region"` while visible — inferior; do not replicate. |

---

## 5. Adoption matrix — shipped pages

Every adopter follows the same wiring recipe: derive signals from queries the page
already runs (or shares keys with), gate with `isLoading ? [] : signals`, wire
`useSignalAcks`, pass fully localized labels, lift `rowSelection` to the page so
completion callbacks can clear it, and compute the action matrix with
`useMemo<SelectionAction[]>`.

### 5.1 Academics Overview — corner only

**File:** `apps/academics/src/routes/overview.tsx` (academics remote; shell URL
`/academics` overview — verify via routers). **Data:**
`useAcademicsOverviewV2(schoolId)`. **i18n:** `academics` namespace
(`moduleOverview.signals.*`, `moduleOverview.alerts.*`, domains under
`moduleOverview.signals.domains.*`).

| Signal id | Sev | Domain | Emitted when | Derivation | Fix |
|---|---|---|---|---|---|
| `academics.at-risk-critical` | critical | Attendance | `data.alerts.criticalCount > 0` | at-risk alerts query inside `useAcademicsOverviewV2` (students below 80 % / 30-day) | "View details" → `navigate('/students')` |
| `academics.at-risk-warning` | warn | Attendance | `data.alerts.warningCount > 0` | same query (80–90 % band) | "Review" → `navigate('/students')` |
| `academics.attendance-unrecorded` | info | Data quality | `unrecordedCount > 0` where `unrecorded = todayAttendanceSummary.totalStudents − (totalRecorded ?? 0)` | today-attendance summary | "Take attendance" → `navigate('/classrooms', {search:{tab:'attendance'}})` |

Auto-resolve: recording attendance / risk improving changes the overview-v2 query
results on refetch; the conditions stop holding; the signals stop being emitted.
Signals pass `data.alerts.isLoading ? [] : signals`. Corner replaces the previous
AlertLane stack on this page. No selection bar (no table).

### 5.2 Students — corner + full matrix

**File:** `apps/academics/src/routes/students/index.tsx`. **Data:** signals from
`useAcademicsOverviewV2(schoolId)` (same derivations as 5.1); roster from
`useStudents` (infinite) intersected with the `filterMode` chip
(`filterStudentsByMode`). **Perms:** `useResourcePermissions('students')`.
**i18n:** `academics` — reuses `moduleOverview.signals/alerts.*` for signals, plus
`studentsModule.signals.*`, `studentsModule.bulk.*`, `studentsModule.selection.*`,
`dataTable.selection.*` for the bar.

Signals — ids `students.at-risk-critical` / `students.at-risk-warning` /
`students.attendance-unrecorded`; identical severities/domains/conditions to 5.1 but
the at-risk fixes **stay on-page**: `setFilterMode('at-risk')` applies this page's own
at-risk preset (label `studentsModule.signals.showAtRisk`); unrecorded still deep-links
to `/classrooms?tab=attendance`.

Action matrix (`selectionActions`):

| id | Label | Applicable | Lock | Danger | Surface / handler |
|---|---|---|---|---|---|
| `message` | Message guardians | all selected | — | — | `toast.info(common.comingSoon)` — pending guardian-messaging backend (**#221**) |
| `move` | Change section | all selected | `!studentPerms.edit` → `studentsModule.bulk.requiresAdmin` | — | coming-soon toast — pending section-transfer backend (**#222**) |
| `archive` | Archive | all selected | `!studentPerms.delete` → same reason | yes | `setBulkArchiveTarget(rowsFor(ids))` → `BulkArchiveStudentsModal` (**#223**), `onComplete` clears selection |

Bar wiring: `totalCount = filteredStudents.length` (loaded + chip-filtered rows —
select-all is page-local, see §6); peek = `UserAvatar` + full name + grade + at-risk
attendance % (danger tint < 80, else warning) from the alerts map. `selectionBar`
flows through `StudentTable` → `DataTable` (legacy `bulkActions` suppressed).

### 5.3 Classrooms — module-shell corner spanning 4 tabs + OverviewTab matrix

**File:** `apps/academics/src/routes/classrooms/index.tsx`. The corner mounts in
`ClassroomsModule` (the tab shell) above the `Tabs` strip, so signals persist across
`?tab=overview|gradebook|policies|attendance`. **Perms:**
`useResourcePermissions('scheduling')`.

**Shared-query-key design (load-bearing):** the shell derives signals from queries the
tabs already run with *identical react-query keys*, so no duplicate fetches once a tab
is open:

- `useSections({ schoolId, filters: { isActive: true, academicYearId: currentYear?.yearId } })`
  — same key the GradebookTab uses for its section list.
- `useAttendanceOverview({ schoolId, academicYearId, date: today })` — same key the
  Attendance tab uses; **recording attendance in the drawer invalidates this key,
  which refetches and auto-resolves the unrecorded signal live** while the corner
  stays mounted.

| Signal id | Sev | Domain | Emitted when | Fix |
|---|---|---|---|---|
| `classrooms.at-capacity` | critical | Capacity | count of active sections with `maxEnrollment > 0 && currentEnrollment >= maxEnrollment` > 0 | "Review sections" → `setActiveTab('overview')` |
| `classrooms.low-utilization` | warn | Capacity | count with `currentEnrollment / maxEnrollment < 0.4` > 0 | same |
| `classrooms.attendance-unrecorded` | info | Attendance | `sectionCompletion.totalSections − sectionsWithAttendance > 0` (description shows done/total) | "Open attendance" → `setActiveTab('attendance')` |

**OverviewTab matrix** (page-owned toolbar morph — §2.2 path 2; the same
`selectionBar` node is also passed into `SectionTable` for the table view):

| id | Label | Applicable | Lock | disabledReason | Surface |
|---|---|---|---|---|---|
| `activate` | Activate | selected **inactive** sections | `!schedPerms.edit` → `requiresAdmin` | `classrooms.selection.noInactive` | `BulkSectionStatusModal` `targetActive: true` (**#224**) |
| `deactivate` | Deactivate | selected **active** sections | same | `classrooms.selection.noActive` | `BulkSectionStatusModal` `targetActive: false` |
| `notify` | Send notification | all selected | — | — | coming-soon toast |

Activate/Deactivate are the canonical **subset-chip pair**: a mixed selection shows
each with its own count chip, and each confirm receives only its subset. Peek =
`courseName — sectionNumber` + `enrolled/cap seats · Active|Inactive`.
`totalCount = sections.length` (loaded, client-search-filtered). Modal `onComplete`
clears selection.

### 5.4 Exams — corner + matrix

**File:** `apps/academics/src/routes/exams/index.tsx`. **Data:**
`useExams({ schoolId, academicYearId })` — the list the page already renders; signals
gated on `isLoading`. **Perms:** `usePermission('edit', 'assessments')` (note: no
`exams` resource exists in ABAC — §6). **i18n:** `academics` —
`examModule.signals.*`, `examModule.bulk.*`.

| Signal id | Sev | Domain | Emitted when (against `todayStr`) | Fix |
|---|---|---|---|---|
| `exams.live-ending-today` | critical | Assessment | `status === 'in_progress' && endDate <= today` count > 0 | "View live" → `setActiveBucket('live')` |
| `exams.awaiting-results` | warn | Assessment | `status === 'closed' && resultGenerationStatus !== 'generated'` count > 0 | "View awaiting" → `setActiveBucket('awaiting')` |
| `exams.starting-soon` | info | Assessment | `status === 'scheduled' && startDate ∈ [today, today+7d]` count > 0 | "View upcoming" → `setActiveBucket('upcoming')` |

Fixes drive the page's own `ExamSummary` lifecycle buckets (`filterExamsByBucket`), so
the table narrows in place. Auto-resolve: statuses/results moving on changes the exam
list on refetch.

| id | Label | Applicable | Lock | disabledReason | Surface |
|---|---|---|---|---|---|
| `change-status` | Change status | all selected | `!canEditExam` → `requiresAdmin` | — | `BulkExamStatusDrawer` (computes per-row eligible transitions), `onComplete` clears selection |
| `generate-results` | Generate results | `status === 'closed' && resultGenerationStatus !== 'generated'` | — | `examModule.bulk.onlyClosed` | coming-soon toast — no bulk result-batch backend (§6) |

Peek = `examName` + `termName · status`. Selection is taken against `filteredExams`
(the active bucket), and `totalCount = filteredExams.length`.

### 5.5 Finance Invoices — corner + money matrix

**File:** `apps/finance/src/routes/billing/invoices/index.tsx` (route
`/finance/billing/invoices`). **Data:** signals from `useDashboardSummary(schoolId)`
(fetched anyway for the StatBand); rows from `useInvoicesInfinite` (server-driven
status/grade filters). **i18n:** `payments` namespace — `headerZone.*` (labels +
domains) and `invoices.signals.*` / `invoices.selection.*`; bar labels under
`headerZone.selection.*`.

| Signal id | Sev | Domain | Emitted when | Fix |
|---|---|---|---|---|
| `invoices.overdue` | critical | Finance | `invoicesByStatus.overdue > 0` — title carries `formatCompact(overdueAmount)` + count | "View overdue" → `setStatusFilter('overdue')` (server-side preset — refetches via GSI) |
| `invoices.drafts-ready` | info | Finance | `invoicesByStatus.draft > 0` | "View drafts" → `setStatusFilter('draft')` |

Auto-resolve: issuing/collecting moves the dashboard summary on invalidation/refetch.

| id | Label | Applicable | disabledReason | Surface |
|---|---|---|---|---|
| `issue` | Issue | `status === 'draft'` | `invoices.selection.noDrafts` | `BulkIssueConfirmModal` → `useBulkIssueInvoices` (real bulk endpoint; toasts issued/skipped, clears selection). NB: the handler ignores its `ids` arg — the modal reads the independently computed `selectedDraftIds` (same set by construction). |
| `send-reminder` | Send reminder | `REMINDABLE_STATUSES = ['overdue','issued','partially_paid']` | `invoices.selection.noneRemindable` | `BulkSendInvoiceReminderDrawer` (**#236**/D2) with `rowsFor(ids)`, `onComplete` clears selection |
| `pdf-export` | Download PDFs | all selected (deduped) | — | `BulkPdfExportDrawer` (Sprint F.5, ZIP via G.2 worker) |

No role locks on this page today — finance write access is gated at route/module
level; adding `billing:manage`-based locks is fine but not required. Peek =
`invoiceNumber` + localized status. When rows are selected and `hasMore`, the page
shows an "operating on loaded rows only" hint above the table
(`invoices.loadedSelectionOnly`) — `onSelectAll` covers **loaded** invoices only (§6).

### 5.6 Shell Home — AdminCommandCenter corner (replaces AlertLane)

**File:** `apps/shell/src/components/home/AdminCommandCenter.tsx` (rendered at `/` for
admin roles). **Mounting:** slim standalone row (no pagebar — greeting lives in the
topbar): pill (`data-testid="attention-pill"`) + `<AttentionCornerShade className="mt-3"/>`,
inside a `SectionErrorBoundary`; the whole corner is hidden while `alertsLoading`.
**i18n:** `dashboard` namespace — `homeV2.headerZone.*` labels/domains,
`homeV2.alerts.*` fix labels.

Signals map 1:1 from `useHomeAlerts` (`apps/shell/src/hooks/useHomeData.ts`,
`HomeAlert { id, severity: 'critical'|'warning', title, description, count?, href, module }`):

| HomeAlert id | Emitted when | Mapped severity | Domain | Fix |
|---|---|---|---|---|
| `finance-overdue` | `financeSummary.overdue > 0` (from `useFinanceSummary`) | critical | Finance | "Review billing" → `navigate('/finance/billing')` |
| `attendance-critical` | count of students with `attendanceRate < ATTENDANCE_THRESHOLD` (80) over a 90-day window > 0 (query key `homeKeys.alerts`, deferred until snapshot+finance load) | `'warning'` → `warn` | Attendance | "View students" → `navigate('/academics/classrooms?tab=attendance')` |

Mapping rule in the component: `severity === 'critical' ? 'critical' : 'warn'`; domain
chosen by `module`; `title`/`description` arrive **pre-formatted from the hook**
(currency baked in — these strings are still hardcoded English inside `useHomeAlerts`,
inherited from AlertLane; localizing them is part of the AlertLane deprecation, §7f).
Auto-resolve: react-query revalidation on navigation-back/staleness; attendance
mutations can invalidate `homeKeys.alerts`.

### 5.7 Design-system showcase

`apps/shell/src/pages/dev/design-system.tsx` — "Header Zone" `SectionCard`: a live
corner (3 fixture signals, local `useState` ack set) inside a pagebar, and a static
`SelectionContextBar` (5 selected / 255 total) demonstrating subset chip, disabled
reason, role lock, and danger. Covered by
`e2e/tests/design-system-visual-regression.spec.ts`. Must be kept in parity (§7e).

---

## 6. Persistence + backend gaps

1. **Ack store is localStorage-only** (`edforge.signal-acks`, §3.5). The approved
   prototype accepted this because the backend `/users/:id/preferences` endpoint is a
   **fixed schema with no key-value slot** — there is nowhere to PUT arbitrary
   `signalId → timestamp` maps. Consequence: acks do not roam across devices/browsers,
   and clearing site data resurrects acknowledged criticals. Flagged backend gap
   (ticket in §7d): add a namespaced KV slot (e.g.
   `preferences.custom['signal-acks']`) or a dedicated
   `/users/:id/signal-acks` resource; then `useSignalAcks` becomes a react-query-backed
   hook with optimistic writes and the localStorage map becomes a migration source.
2. **No server-side signal aggregation.** Every page derives signals client-side from
   its own queries. That is the design's strength (auto-resolve for free) but means:
   (a) the Home corner and module corners can disagree transiently (different queries,
   windows, staleness); (b) there is no cross-module "N things need attention" badge
   for the sidebar/topbar; (c) mobile/notification surfaces have nothing to poll.
   Proposed: `GET /api/signals?schoolId=…` returning the same
   `{id, severity, domain, title, count, href}` shape, computed server-side from the
   same thresholds — frontend keeps client derivation as the live layer and uses the
   endpoint for global surfaces only.
3. **Matrix actions blocked on missing endpoints:**
   - Guardian **messaging** (Students `message`) — issue **#221**; no messaging
     endpoint for guardians-of-students batches.
   - **Section transfer** (Students `move`) — issue **#222**; no bulk
     transfer/re-section endpoint.
   - **Bulk generate-results** (Exams `generate-results`) — result batches exist only
     per-exam; no bulk surface.
   - **Interventions** — the at-risk critical signal's ideal fix is "start an
     intervention", which has no backend concept yet; today it deep-links to the
     at-risk roster view instead.
   - "True bulk" semantics generally: `useBulkIssueInvoices` is a real bulk endpoint
     (returns `{issued, skipped}`), but bulk archive (#223) and bulk section status
     (#224) fan out per-row PATCHes client-side, and select-all is capped at *loaded*
     rows on server-paginated tables because there is no "apply to filter" endpoint.
     A true bulk contract (ids-or-filter + partial-success report) unlocks
     `Select all N(server)`.
4. **RBAC verb/resource gaps** (`packages/abac/src/permissions.ts`):
   - The `Action` union is `view | create | edit | delete | manage | approve | send |
     export | configure` — no **`publish`**, **`close`**, or **`issue`** verbs, so
     lifecycle actions (issue invoice, close/publish exam) can only be modeled as
     `edit`/`manage` today.
   - The `Resource` union has **no `exams` resource** — the Exams page borrows
     `assessments` (`usePermission('edit','assessments')`) for its lock. When exams
     get their own resource + lifecycle verbs, update the lock in
     `apps/academics/src/routes/exams/index.tsx` and add locks to the invoice matrix
     (`billing` today carries only view/create/edit/manage/approve).
   - Any new verb/resource must mirror the backend's `DEFAULT_ROLE_PERMISSIONS`
     (`role-assignment.entity.ts`) — the frontend map is a mirror, not the source.

---

## 7. Remaining work (the backlog — each item with acceptance criteria)

### (a) Retire `FloatingBulkBar` entirely

Last remaining consumers (they pass `bulkActions` without `selectionBar`):

| Page | Current `bulkActions` | Target matrix (minimum) |
|---|---|---|
| `apps/finance/src/routes/billing/payments/index.tsx` | `void` (tone critical → `BulkVoidDialog` target), `send-receipt` (→ `BulkSendReceiptsDrawer`), `pdf-export` (→ receipts ZIP drawer, dedupes ids) | `void`: danger, applicable = voidable payments (completed, not already voided); `send-receipt` + `pdf-export`: applicable = completed payments (G.2 worker skips non-completed — surface that as the subset instead); peek = payer + amount + gateway/status |
| `apps/finance/src/routes/billing/accounts/index.tsx` | `send-statement` (→ `BulkSendStatementsDrawer` #231/D3), `adjust-balance` (→ `BulkAdjustBalanceDrawer` #232/D4) | applicable = all selected for both (accounts have no disqualifying state today); peek = student name + balance |
| `apps/shell/src/pages/settings/people.tsx` | `change-role` (→ `BulkChangeUserRoleModal` #233), `suspend` (tone critical → suspend target) | `suspend`: danger, applicable = active users (skip already-suspended, skip self — today the modal handles this; move it to `applicableIds`); role-lock both on tenant-admin capability; peek = user name + email + role |
| `apps/shell/src/pages/settings/school-departments.tsx` | `delete` (tone critical → bulk delete target) | `delete`: danger, applicable = deletable departments; lock on `departments:delete`; peek = name + code |

Steps: for each page, lift/keep `rowSelection` at page level, build
`SelectionAction[]` with real applicability predicates + `disabledReason`s + visible
locks, build the `<SelectionContextBar/>` node with localized labels + peek, pass it
as `selectionBar`, delete the `bulkActions` array. Then delete the component and its
plumbing.

**Acceptance criteria:**
- `rg FloatingBulkBar packages apps` returns zero matches; the component and its
  `labels.selectedRows`-only styling are removed from `DataTable.tsx`.
- `rg "bulkActions" apps packages/ui` returns zero live usages; the `bulkActions` prop
  and `BulkAction<TData>` type are removed from `data-table/types.ts` (or marked
  `@deprecated` for one release with a changelog note), and the
  `bulkActions={selectionBar ? undefined : …}` fallbacks in `StudentTable` /
  `SectionTable` / `ExamTable` are removed.
- The four migrated pages: selecting rows morphs the toolbar in place (no floating
  pill), Esc/✕ clears, subset chips show where predicates apply, confirm handlers
  receive `applicableIds` only, destructive actions are `danger`-styled, locks visible
  for non-privileged role fixtures.
- Existing E2E specs updated and green: `payments-bulk-void.spec.ts`,
  `payments-bulk-send-receipt.spec.ts`, `accounts-bulk-send-statement.spec.ts`,
  `accounts-bulk-adjust-balance.spec.ts`, `users-bulk-change-role.spec.ts`,
  `users-bulk-suspend.spec.ts` (their locators currently target the floating pill's
  buttons; retarget to `role="toolbar"` buttons — mirror
  `sections-bulk-status.spec.ts` which already drives the new bar).
- `pnpm turbo typecheck && pnpm turbo lint && pnpm vitest run` and
  `PLAYWRIGHT_START_SERVER=1 pnpm test:e2e:smoke` pass.

### (b) People module overview corner

`apps/people/src/routes/overview.tsx` currently omits any alert surface ("No alert
source for People"). Add an AttentionCorner in its pagebar following the 5.1 recipe.
Candidate signals (derive from `useStaffList` + department data the page already
loads; confirm exact hooks at implementation time): unassigned/uncovered sections or
staff without assignments (**Capacity** or **Enrollment** domain, warn), staff records
with missing critical fields (**Data quality**, info), expiring contracts if HR data
is available (**Data quality**/HR, warn).

**Acceptance criteria:** pill in the pagebar `attention` slot; signals derived from
live queries and auto-resolving (unit-tested with a rerender assertion); ids namespaced
`people.*`; `useSignalAcks` wired; full localized labels in the people/staff namespace
(en + ne); signals `[]` while loading; a11y contract of §4.9 holds.

### (c) Mobile-sheet polish + shade slide-shuttle visual QA (Vercel)

Run visual QA on a Vercel preview across real mobile widths:

**Acceptance criteria:** desktop shade opens/closes with no height jump or scroll
anchor shift at 768–1440 px (content below is pushed, never overlapped); mobile sheet
respects safe-area insets (`pb-6` today — verify on notched devices), scrim blocks
interaction, focus trap holds and restores, drag-handle affordance visible; pill counts
don't wrap at 320 px; reduced-motion verified on both; resolve the §4.4 Esc
double-fire if both surfaces are open (topmost consumes); no horizontal scrollbar
introduced by the actions row on narrow widths. File follow-up issues with
screenshots for anything failing.

### (d) Backend tickets (file in the backend repo; frontend follows)

1. **User-preferences KV slot for ack roaming** — extend `/users/:id/preferences`
   (or add `/users/:id/signal-acks`) to store the `signalId → epochMs` map. Frontend
   AC: `useSignalAcks` reads via react-query with optimistic writes, migrates the
   existing localStorage map once, keeps localStorage as offline fallback; acks roam
   across devices.
2. **`GET /api/signals` aggregation** — server-computed signals per school (same shape
   as §6.2) for global surfaces (sidebar badge, notifications). Frontend AC: page
   corners keep client derivation; a shared hook consumes the endpoint for shell-level
   surfaces only.
3. **True bulk endpoints** — bulk archive students, bulk section status, bulk
   generate-results, guardian messaging (#221), section transfer (#222); all with
   ids-or-filter input and `{succeeded, skipped[], failed[]}` partial-success output.
   Frontend AC: coming-soon toasts in §5.2/§5.4 replaced by real drawers; select-all
   can offer the server total.
4. **RBAC** — add `exams` resource and lifecycle verbs (`publish`/`close`/`issue`) to
   the backend permission map, then mirror into `packages/abac/src/permissions.ts` and
   swap the borrowed `assessments` lock on the Exams page; add invoice-issue locks.

### (e) Design-system showcase parity

**Acceptance criteria:** every new prop/state added to either component (and every
migration in (a) that surfaces a new pattern, e.g. a danger+locked combination) is
represented in the `design-system.tsx` Header Zone section;
`design-system-visual-regression.spec.ts` snapshots updated in the same PR; the
showcase compiles against the real exported types (no local prop clones).

### (f) AlertLane deprecation

`AlertLane` (`packages/ui/src/components/dashboard/AlertLane.tsx`) remains in use by
`apps/finance/src/routes/overview.tsx` and
`apps/shell/src/components/home/TeacherDashboard.tsx` (People overview never adopted
it; Admin Home already migrated).

**Acceptance criteria:** Finance Overview and TeacherDashboard migrate to
AttentionCorner (Finance Overview's `DashboardAlert`s map to signals the same way
§5.6 did — and move the hardcoded English titles in `useHomeAlerts`/finance mappers
into i18n while touching them); then `AlertLane`, `DashboardAlert`, its export in
`packages/ui/src/components/dashboard/index.ts` + `packages/ui/src/index.ts`, and
`packages/ui/src/components/__tests__/AlertLane.test.tsx` are deleted;
`rg AlertLane` returns only historical docs.

---

## 8. Testing contract

### 8.1 What exists (do not regress)

**`AttentionCorner.test.tsx`** — pill: severity-segmented counts + label; acked
excluded from counts but present in shade as "Acknowledged" chip; mint all-clear for
`signals={[]}`; `aria-expanded` toggling + named `region` appears. Shade rows:
severity ranking (critical → warn → info as `listitem` order); critical rows have
ack-not-dismiss, warn/info have dismiss-not-ack; ack fires `onAck('crit-1')` only
after the ~480 ms pop (fake timers), chip click fires `onUnack`; dismiss removes the
row for the session; Escape collapses immediately, returns focus to the pill, region
unmounts after exit; **auto-resolve** — re-rendering with a signal omitted removes its
row.

**`SelectionContextBar.test.tsx`** — labelled `toolbar` role + polite sr-only count;
subset count chip renders and confirm receives **only** `['a','b','c']`;
zero-applicable → `aria-disabled` + `disabledReason` title + click no-op; locked →
`aria-disabled` + `lockedReason` + click no-op; single-select peek replaces visible
count (sr-only remains); "Select all 255" fires `onSelectAll`; ✕ and Escape each call
`onClear`.

**`apps/shell/src/__tests__/home.integration.test.tsx`** (MSW) — signals derive from
mocked thresholds (finance overdue + 2 students below 80 %): pill (testid
`attention-pill`) shows counts, expanding reveals both signals with formatted amounts;
a11y case asserts expandable pill + labelled region + `listitem` rows. Note the
documented flake guard: the corner remounts collapsed when a late alert query flips
`isLoading`, so assertions re-click inside `waitFor`.

**E2E (Playwright, per `docs/testing/agent-e2e-guide.md`)** — the new bar is already
driven end-to-end by `e2e/tests/sections-bulk-status.spec.ts` (@smoke: "4 selected" →
`Activate` exact-match → eligible-count modal → PATCH capture + skipped toast) and
`e2e/tests/students-bulk-archive.spec.ts`; `invoices-bulk-send-reminder.spec.ts`
covers the invoices reminder flow. The other `*-bulk-*.spec.ts` files still drive the
FloatingBulkBar (see §7a). No E2E yet asserts the AttentionCorner outside the
design-system visual regression.

There is **no dedicated unit test for `useSignalAcks`** (persistence round-trip,
corrupt-JSON fallback, storage-unavailable fallback) — add one when touching it (§7d.1).

### 8.2 What every page adoption must add

1. **Signal derivation unit test** (vitest + MSW, `test-utils/`): for each signal id,
   mock the source query into the emitting condition and assert the row (by title)
   appears with the right severity affordance; then re-render/refetch with healed data
   and assert **auto-resolve** (row gone, pill count drops). Assert `[]` while
   loading.
2. **Matrix unit test**: role fixture without the gating permission sees the locked
   action (visible, `aria-disabled`, reason); mixed-state selection produces the
   correct `applicableIds` subsets; the confirm surface receives the subset only;
   completion clears selection.
3. **E2E happy path** for each destructive/bulk action (tag `@smoke` per
   `docs/testing/rollout-playbook.md`), driving the real toolbar morph: select rows →
   assert "N selected" → exact-name action button (the bar can hold near-identical
   labels — use `exact: true`, see the strict-mode comment in
   `sections-bulk-status.spec.ts`) → modal/drawer → captured write → selection
   cleared. Never against production or an operator tenant; never commit
   `e2e/.auth/` or `e2e/.mcp-artifacts/`.
4. **A11y assertions** folded into the above: pill `aria-expanded`, named region,
   `listitem` count; `toolbar` role with the page's localized `aria-label`.
5. Route→component trace re-verified in the PR description (CLAUDE.md rule) — the
   corner/bar must be asserted on the component the router actually renders for the
   URL, not a look-alike file.

Gates before any PR (repo standard):

```bash
pnpm turbo typecheck && pnpm turbo lint && pnpm vitest run
PLAYWRIGHT_START_SERVER=1 pnpm test:e2e:smoke
```
