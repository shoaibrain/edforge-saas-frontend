# Students Table — Guardian, Location & Attendance-Trend Enhancement — Sprint Plan

**Status:** v2 — adversarial review incorporated (see §0 changelog).
**Surface:** `/academics/students` (Academics MFE)
**Author basis:** Direct codebase trace (render path, data layer, design tokens, ABAC) + production screenshot + prototype reference + live API payloads + a verification pass that corrected several first-draft claims.
**Branch:** `claude/bold-curie-tunpf2` (frontend) / `claude/bold-curie-tunpf2` (backend — Sprint 2 endpoint only).

This document breaks the enhancement into **demoable sprints** of **atomic, committable tasks**, each with explicit tests/validation, matching the house format of [`finance-table-pagination-sprint-plan.md`](./finance-table-pagination-sprint-plan.md).

A companion visual mock (`/tmp/students-table-preview.html`, delivered separately) renders the target design with the real payloads.

---

## 0. Review changelog (what the adversarial review corrected)

The first draft was well-grounded but carried real errors. Folded in:

- **Width math was wrong (B1).** Each `<td>/<th>` adds `px-4` = **32 px** padding (`DataTable.tsx:202,326`). 8 columns ⇒ +256 px before content. The 8-column set needs a **~1300 px content pane**, which a shell-sidebar layout rarely gives. → Default dense view is **7 columns**; the 8th (Enrolled) is **xl-only / opt-in**. Breakpoints keyed to **content-pane width (ResizeObserver)**, not viewport. Speculative DataTable "wide-mode" **cut**.
- **Avatar styles/seeding were wrong (A1/A2).** `UserAvatar` seeds **students by `userId`, staff by `userName`** (not id), and `guardianId` is `.optional()`. Naive `role="staff"` reuse ⇒ **colliding guardian avatars** for same-named guardians. → dedicated guardian seed task.
- **"Summary-only PII" was a rendering claim mislabeled as a privacy boundary (A3).** Full guardian `email`/`phone`/`address` already ship in the list payload. → honest reframing + backend slim-DTO follow-up decision.
- **`--v2-*` tokens live in `apps/shell/src/styles/home-v2-tokens.css`, not `base.css` (A4).** The page being edited is saturated with them. → "no new `--v2-*`" scoped to **new cell components**; skeleton-token migration is an explicit micro-task.
- **Endpoint name collision (A6).** `/attendance/trends` is one `s` from the existing `/attendance/trend`. → renamed `/attendance/student-trends`.
- **`getAttendanceColor` already exists in `@edforge/types` (E4)** and is already imported in `index.tsx:26`. → import it; do not add a 4th copy.
- **Sorting semantics were missing (D1/D2).** Grade sorts as strings (`"10" < "2"`). No `sortingFn` precedent in the repo. → explicit sort task + no-regression invariant.
- **Sprint-1 attendance honesty (A8/B2).** The FE `AttendanceAlert` type **already parses** `trend`/`totalDays`/`absentDays` — Sprint-1 caret is a pure map-widening. The header stays **"Attendance"** (not "trend") until Sprint 2. "—" for non-flagged rows is **honest** (absence from alerts conflates *healthy ≥ threshold* with *no records*; only the Sprint-2 endpoint disambiguates).
- **Task splits & descopes (C2/C3/E1/E2/E3):** split column-rebalance vs ABAC gating; split toolbar-introduction vs responsive visibility; cut wide-mode, cut cell "Add guardian" CTA (an `AddGuardianModal` already exists on the profile), mark drawer-parity optional.

---

## 1. Goal

Lift the Students roster from a flat, donut-led table to a **premium, humanized directory** surfacing the relationships an operator scans for:

1. **Guardian** — horizontal **stacked avatars** (primary on top, `+N` overflow) + primary's name · relationship + portal/pickup affordances; **popover** lists all guardians.
2. **Location** — Nepal-aware `Municipality, District` (fallback `City, State`) with a pin glyph.
3. **Attendance** — replace the flat **donut ring** with an inline **sparkline trend** (area + threshold color + caret + %); Sprint 1 ships the cell in *degraded* (bar+caret) mode for at-risk rows, Sprint 2 lights up a real 7-day sparkline for the whole roster.
4. **Grade** — collapse the over-wide single-glyph column into a compact **chip**, reclaiming horizontal budget.

All within the existing `@edforge/ui` + semantic-token language, the `TanstackDataTable` primitive, the DiceBear `UserAvatar` precedent, and the Epic-F `--v2-*` retirement direction.

---

## 2. Render-path trace (proof of the edit target)

Per the CLAUDE.md *"route → component, never file-name → component"* rule:

| Step | Evidence |
|------|----------|
| URL | `https://www.edforge.app/academics/students` |
| Route | `apps/academics/src/routes/students/index.tsx` → `StudentsModule` → `StudentsContent` |
| Table | `StudentsContent` renders `<StudentTable …>` (`routes/students/index.tsx:644`) |
| Columns | `StudentTable` builds `columns` via `useMemo` (`components/students/StudentTable.tsx:146-260`) → `@edforge/ui` `TanstackDataTable` |
| Drawer | Row click → `StudentQuickProfile` (`components/students/StudentQuickProfile.tsx`) |
| Filters | `StudentsFilterRow` (`components/students/StudentsFilterRow.tsx`) |

**Primary edit target:** `StudentTable.tsx` (column defs) + new sibling cell components + one new `@edforge/ui` primitive + (Sprint 2) one backend endpoint.

> **Token note (corrected):** the canonical semantic tokens (`--text-*`, `--border-*`, `--background-*`, `--state-*`) live in `packages/theme/src/base.css`. The `--v2-*` family lives in `apps/shell/src/styles/home-v2-tokens.css` and resolves at the shell level — `base.css` defines **none** of them. The current `routes/students/index.tsx` (header, insight strip, `TableSkeleton`, error state) is built almost entirely from `--v2-*`.

---

## 3. Column model & the width budget (corrected)

### Current (6 columns, `tableLayout: fixed`, `w-full`, **no horizontal scroll** — `DataTable.tsx:188`)

| # | Column | `size` | Cell |
|---|--------|-------:|------|
| 1 | Student | 260 | `UserAvatar` (lg) + name + `#studentNumber` |
| 2 | Grade | 100 | bare text — **over-wide for a 1–3 char value** |
| 3 | Attendance | 140 | `AttendanceDonutRing` + % — **only populated for at-risk students** (§5) |
| 4 | Status | 110 | `StudentStatusBadge` |
| 5 | Enrolled | 130 | formatted AD date |
| 6 | Actions | 48 | three-dot menu |

### The budget math (the thing the first draft got wrong)

`tableLayout: fixed` + `w-full` means `size` values are **proportional hints**, not min-widths — extra columns **compress** the row, they do **not** scroll. **Every cell also carries `px-4` = 32 px horizontal padding** (`DataTable.tsx:202,326`). So:

```
visible content width  ≈  Σ(size) + 32·(visible column count)
```

### Target sizes (proportional) + responsive visibility by **content-pane width**

| # | Column id | `size` | Cell | New? | ≥ xl pane (~1320) | lg–xl (~1100) | md–lg (~860) |
|---|-----------|-------:|------|:----:|:---:|:---:|:---:|
| 1 | `student` | 230 | unchanged | | ✅ | ✅ | ✅ |
| 2 | `grade` | 56 | `GradeChip` (center) | ✎ | ✅ | ✅ | ✅ |
| 3 | `attendance` | 128 | `AttendanceTrend` | ✎ | ✅ | ✅ | ✅ |
| 4 | `guardian` | 172 | `GuardianCell` | ➕ | ✅ | ✅ | — |
| 5 | `location` | 148 | `StudentLocationCell` | ➕ | ✅ | ✅ | — |
| 6 | `status` | 92 | unchanged | | ✅ | ✅ | ✅ |
| 7 | `enrollmentDate` | 110 | unchanged | | ✅ | — (opt-in) | — |
| 8 | `actions` | 44 | unchanged | | ✅ | ✅ | ✅ |

Budget check: **lg–xl (7 cols, no Enrolled):** `Σsize 826 + 32·7 = 1050 px` → fits a ~1100 px pane. **≥ xl (8 cols):** `936 + 256 = 1192 px` → needs a genuinely wide pane (~1300 px); gate it to xl. **md–lg (5 cols):** `550 + 160 = 710 px` → fits ~860.

> **Breakpoints are keyed to the *content pane*, not the viewport** — the shell sidebar means pane ≠ viewport. Use a **ResizeObserver on the table card** (preferred) or `useMediaQuery` as the cheap fallback; **confirm exact thresholds in the §8 visual smoke at real shell widths** (do not trust the numbers above blindly). `< md` (mobile) is a known weak spot — see D-7.

---

## 4. Reference patterns (copy/extend, do not re-invent)

| Pattern | Location |
|---------|----------|
| List-row student avatar (DiceBear + initials fallback) | `apps/academics/src/components/common/UserAvatar.tsx` — **students seeded by `userId`, staff by `userName`**; precedent commit `ba5a2ba` (`size="sm"`) |
| Stacked avatars + `+N` | `@edforge/ui` `AvatarGroup` (`packages/ui/src/components/Avatar.tsx:87`) — `-space-x-2`; **note last child paints on top** |
| SVG attendance viz (being replaced) | `@edforge/ui` `AttendanceDonutRing` (`AttendanceDonutRing.tsx`) — mirror its SVG/prop shape |
| **Threshold color (single source)** | **`@edforge/types` `getAttendanceColor`** (`packages/types/src/academics-utils.ts:18`) — already imported in `routes/students/index.tsx:26`. **Import it; do not duplicate.** Local copies in `StudentTable.tsx:62` + `AttendanceDonutRing.tsx:38` should converge on it. |
| Nepal-aware address formatting | `ProfileTab.tsx:89` (`formatAddress`/`isNepalAddress`) — **duplicated** in `registration/steps/ReviewStep.tsx:146`; consolidate, type against real `Address` (`@aibrains/shared-types`, has `zipCode` **not** `postalCode`) |
| Status pill | `components/students/StudentStatusBadge.tsx` |
| Column visibility / persistence | `TanstackDataTable` props `enableColumnVisibility`, `tableId`, `initialColumnVisibility` (`data-table/types.ts:156`) |
| Permission gating | `useResourcePermissions('guardians')` — ABAC `guardians` resource exists (`packages/abac/src/permissions.ts:51,147…`) |
| i18n | academics already uses i18n (`AttendanceGrid.tsx`, `StudentAttendanceModal.tsx`, …) — externalize new strings |
| Add-guardian flow (exists) | `components/students/profile/AddGuardianModal.tsx` — lives on the **profile**, not the directory |

---

## 5. Key finding — the attendance data gap (corrected & sharpened)

**The table has no per-student attendance time-series, and the rate it shows covers only at-risk students.**

- `alertsMap` is built from `overviewData.alerts.students` (`routes/students/index.tsx:353-359`), sourced from `GET /academics/attendance/alerts?threshold=90` — **only students below 90 %.** Everyone else has no entry ⇒ `"—"` (matches the production screenshot).
- The FE `AttendanceAlert` type (`academics.service.ts:1750`) **already parses** `trend: 'improving'|'declining'|'stable'` (backend-derived, `attendance.service.ts:180-196`), `totalDays`, `absentDays` — `alertsMap` just narrows to the rate. **Surfacing a caret in Sprint 1 is a pure map-widening — no service/type/backend change.**
- A **"—" for a non-flagged row is honest**: absence from the alerts list means *either* ≥ threshold *or* zero recorded days. **Only the Sprint-2 batch endpoint can tell those apart** — so don't fake a "healthy/green" state for `—` rows.
- **No endpoint returns a daily series for the full roster.** Per-student daily records exist (`GET …/attendance/student/:id?startDate&endDate`) but per-row is **N+1**. ⇒ Sprint 2 adds a **batch** endpoint.

**Phasing consequence:** Sprints 0–1 ship the new layout + the `AttendanceTrend` cell in **degraded** (bar + caret + %) mode for at-risk rows, with **no regression** to today's coverage and the header still reading **"Attendance"**. Sprint 2 adds the batch endpoint + a `useAttendanceTrends` hook keyed to the visible page, lighting up a real **7-day sparkline for every row** and earning the "· 7d / Trend" header.

---

## 6. Cross-cutting policies

### Design tokens
- **New cell components use canonical semantic tokens only** (`rgb(var(--text-*|border-*|background-*|state-*))`); **no new `var(--v2-*)`**. Vivid brand/threshold accents stay hex literals (`#1D9E75/#EF9F27/#E24B4A/#378ADD/#7F77DD`), via `getAttendanceColor` for attendance.
- Both light **and** dark must read correctly (the `--v2-*` family's dark-only fallbacks washing out in light mode is *why* Epic F retires it). New cells get an explicit **light-mode contrast check** (STU-TBL-1.10).

### Avatars (corrected)
- Students: `UserAvatar role="student"` (DiceBear *adventurer*, seed `studentId`).
- **Guardians: a dedicated seed** — `getStaffAvatar(seed)` (DiceBear *lorelei*) with `seed = guardianId ?? \`${firstName}|${lastName}|${relationship}\``, because (a) `UserAvatar role="staff"` seeds by **name** (collisions for same-named guardians) and (b) `guardianId` is optional. Either thread an explicit `seed` prop into `UserAvatar` or call `getStaffAvatar` directly in `GuardianCell` (UI-AVA-1.0).
- **Initials-first rendering** (show the colored initials immediately; overlay the DiceBear `<img>` once loaded, `loading="lazy"`) so constrained/offline networks degrade gracefully (see D-8 / risk table). The current `UserAvatar` is network-first (renders nothing until error) — improve it.

### Accessibility
- `AttendanceTrend`: `role="img"` + computed `aria-label` (locale-formatted, e.g. *"Attendance 73 %, trend declining"*); never color-only (color + caret + number).
- `GuardianCell`: labelled group; **popover** (not native `title`) is keyboard-reachable; each guardian row announces name · relationship · badges.
- `prefers-reduced-motion`: no sparkline draw animation (consistent with `useReducedMotion` at `routes/students/index.tsx:47`).
- Interactive sub-elements `stopPropagation` so they don't swallow row-click → drawer **and** preserve keyboard row activation (`DataTable.tsx:291`). Combined axe/keyboard pass in STU-TBL-3.4.

### Privacy / ABAC (honest reframing)
- Guardian/Location columns are **gated on `useResourcePermissions('guardians').view` / `('students').view`** — this controls **rendering**, who *sees* the column.
- **It is not a data-exposure boundary:** the student-list payload already includes guardian `email`/`phone`/`address` (`studentResponseSchema.guardians` → `guardianSchema:126-141`). True PII minimization needs a **slimmer list DTO** server-side — filed as **D-1** (backend follow-up), not claimed as done here.
- We render **non-sensitive summary only** (name, relationship, portal/pickup booleans) in the cell; full contact stays on the profile (consistent with the `StudentQuickProfile` privacy note, `:239`).

### Archetype / school-first / i18n
- Location prefers Nepal **fields** (`municipality`/`district`/`province`) over legacy `city`/`state`; reuse `isNepalAddress`.
- Grade chip shows the operator's **local** grade code verbatim (`PG`,`UKG`,`6`,`ECD`) — canonical CEHRD projection is report-time only, **not** applied here.
- New user-facing strings ("No guardian", "Portal", "Pickup", aria-labels) are **externalized via the academics i18n mechanism** (PABSON = `ne-NP`); attendance % uses the **locale number formatter** (south-asian numerals). Stacked-avatar `-space-x` direction noted for RTL (n/a for ne-NP, but documented).

### Performance
- `AttendanceTrend` is **pure SVG** (no per-row `recharts`).
- Avatars: initials-first + lazy + cap guardian stack at 3 + `+N`. Budget + third-party DiceBear dependency: D-8.

### No-regression invariants
- Server pagination (`serverPagination`), **sorting** (incl. Grade — see D1/D2), row-click drawer, filters, KPIs, empty/skeleton/error states unchanged in behavior.
- `TableSkeleton` (`routes/students/index.tsx:126`) is hand-built to the column widths — **update in lockstep** (STU-TBL-1.9) or skeleton↔table will jump.

---

## Sprint 0 — `@edforge/ui` foundation: `AttendanceTrend`

**Goal:** a reusable, tested, pure-SVG attendance trend component exists, degrading sparkline → bar → "—". No page wiring. **Demo:** `pnpm --filter @edforge/ui test` + render matrix.

### UI-TREND-0.1 — `AttendanceTrend` component
- **File:** `packages/ui/src/components/AttendanceTrend.tsx` (+ export in `index.ts`).
- **Props:** `{ rate?: number|null; series?: number[]|null; trend?: 'improving'|'declining'|'stable'; width?=64; height?=24; showValue?=true; locale?: string; className? }`.
- **Render:** `series.length≥2` → area sparkline (gradient fill in threshold color + stroke + end dot); else `rate!=null` → mini bar; else `"—"`. Always (when `showValue`): locale-formatted `rate %` + caret (▲/▼/–) tinted by `trend`.
- **Color:** **import `getAttendanceColor` from `@edforge/types`** (no local copy).
- **A11y/motion:** `role="img"`, computed `aria-label`; respects `prefers-reduced-motion`.
- **Tests** (`__tests__/AttendanceTrend.test.tsx`): sparkline when series≥2; bar when only rate; "—" when neither; threshold boundaries (79.9/80/89.9/90) via the shared util; caret per trend; `aria-label` present; no animation under mocked reduced-motion; locale number formatting.

> **No Storybook** precedent exists in `packages/ui` (verified) — the unit-test render matrix is the durable harness. **No `npm publish`** needed: `@edforge/ui` is an internal pnpm-workspace package (Vite resolves the symlink on rebuild).

---

## Sprint 1 — Frontend table re-architecture (no backend)

**Goal:** 8 rebalanced columns — compact Grade chip, stacked Guardian (popover), Location, `AttendanceTrend` (degraded), responsive by pane width — **shippable immediately, zero backend.** **Demo:** `pnpm dev:academics` → `/academics/students`, vs. the mock, at md/lg/xl, light+dark; **lead with the "At-risk" chip view** (where the attendance cell looks best — D-4).

**Dependency order:** `0.1 → 1.6`; `1.2/1.3/1.4 → 1.7a → 1.7b → 1.8a → 1.8b/1.9`.

### UI-AVA-1.0 — guardian avatar seed
- Thread an explicit `seed` into `UserAvatar` (or expose `getStaffAvatar` use in `GuardianCell`) + **initials-first** rendering. **Tests:** distinct seeds for same-named guardians; renders initials before image; falls back on error.

### STU-TBL-1.1 — consolidate location formatting
- **File:** `apps/academics/src/utils/student-location.ts` — `formatStudentLocation(address): { primary, secondary } | null` (`primary = municipality ?? city`, `secondary = district ?? state`); centralize `isNepalAddress`. Type against `Address` from `@aibrains/shared-types` (**`zipCode`, not `postalCode`**). Dedupe the `isNepalAddress` copies in `ProfileTab`/`ReviewStep`. **Tests:** Nepal fields, legacy fallback, empty (`{}`/`undefined`), partial.

### STU-TBL-1.2 — `GradeChip`
- **File:** `cells/GradeChip.tsx` — compact tinted pill, local grade code verbatim, `—` empty, `size:56`, `meta.align:'center'`. **Tests:** code render; empty.

### STU-TBL-1.3 — `GuardianCell` (stacked avatars + **popover**)
- **File:** `cells/GuardianCell.tsx`.
- Sort `isPrimary` desc; render up to **3** overlapping guardian avatars with the **primary painted on top** (reverse paint order / z-index) and a **brand-colored ring** on the primary vs. neutral `background-secondary` ring on others; `+N` chip for the rest. Beside: primary **name** + **relationship** + Portal/Pickup dot-badges.
- **Popover** (lightweight, keyboard-reachable, **not** native `title`) lists **all** guardians (name · relationship · badges). *(Build the popover here — the multi-guardian reveal is the feature; do not ship a throwaway tooltip.)*
- Empty (`guardians` empty/undefined — real, e.g. `DPPSW-2026-00112`): muted *"No guardian on file"* — **no "Add" CTA** (that flow lives in `AddGuardianModal` on the profile).
- `stopPropagation`. `size:172`. **Tests:** primary-first + on-top; `+N` past 3; portal/pickup badges; empty; relationship capitalization; popover keyboard open/close.

### STU-TBL-1.4 — `StudentLocationCell`
- **File:** `cells/StudentLocationCell.tsx` — `MapPin` + `formatStudentLocation` primary (`text-secondary`) over muted secondary (`text-tertiary`), both `truncate`; `—` null. `size:148`. **Tests:** 2 lines; truncation; `—`.

### STU-TBL-1.5 — widen `alertsMap` → carry `trend`
- **Files:** `routes/students/index.tsx`, `StudentTable.tsx`. Add a `Map<string,{rate;trend;totalDays;absentDays}>` (the FE `AttendanceAlert` already has these — **no service change**). Keep the existing `alertsMap` for `filterStudentsByMode`. **Tests:** map carries trend; table reads it.

### STU-TBL-1.6 — swap donut → `AttendanceTrend` (degraded)
- **File:** `StudentTable.tsx` attendance column (~195-223). Feed `rate` + `trend` (no series yet); header stays **"Attendance"**. Drop the local `getAttendanceRateColor` in favor of the shared util. **Tests:** at-risk → bar+caret; non-flagged → `—` (no regression).

### STU-TBL-1.7a — rebalance columns + insert new cells
- **File:** `StudentTable.tsx` `columns` memo per §3 (sizes, `meta.align`, `id`s, `enableHiding` on guardian/location/enrollmentDate). **Tests:** all expected columns present + ordered.

### STU-TBL-1.7b — ABAC gating (separate, changes prop contract)
- Thread `canViewGuardians`/`canViewLocation` from `StudentsContent` (`useResourcePermissions('guardians').view`); conditionally include those column defs. **Tests:** columns absent when `guardians.view` is false; present when true.

### STU-TBL-1.8a — introduce the column-visibility toolbar
- Enable `enableColumnVisibility` + `tableId="academics-students-table"`. **Note:** this renders a **new toolbar inside the card** that doesn't exist today (`DataTable.tsx:110`) — a visible chrome change (Columns menu). Visual review required. **Tests:** toolbar renders; toggle hides/shows a column.

### STU-TBL-1.8b — responsive visibility by pane width
- ResizeObserver on the card (fallback `useMediaQuery`) → `initialColumnVisibility` per the §3 matrix (xl: 8; lg–xl: hide `enrollmentDate`; md–lg: also hide `guardian`,`location`). **Tests:** visibility reacts to mocked width/`matchMedia`.

### STU-TBL-1.9 — sync `TableSkeleton` to the new columns
- **File:** `routes/students/index.tsx:126`. Match the 8-column shape (grade chip, guardian stack, location 2-line, trend spark). The skeleton currently uses `--v2-*`; either keep (allowed — it's existing) or migrate to semantic tokens as part of this task (preferred, small). **Validation:** throttle network; no skeleton↔table jump.

### STU-TBL-1.10 — sorting semantics (regression-critical)
- **File:** `StudentTable.tsx`. Grade currently sorts as **strings** (`"10" < "2"`); collapsing to a chip must keep a **stable accessor/id** and add a numeric-aware `sortingFn` (ECD/PPC < 1 < … < 10). Decide & set `enableSorting` for Guardian (by primary surname) and Location (by district) or `false`. No `sortingFn` precedent in repo — net-new. **Tests:** grade sorts numerically; guardian/location sort or are explicitly non-sortable; existing sort columns unaffected.

### STU-TBL-1.11 — i18n + locale number formatting
- Externalize new strings via the academics i18n mechanism; route attendance `%` through the locale number formatter. **Tests:** strings resolved via i18n key; ne-NP numeral formatting (or documented English-only).

---

## Sprint 2 — Attendance trend data (backend + full-roster sparkline)

**Goal:** every visible row shows a **real 7-day sparkline** via one batch request/page. **Demo:** non-prod `/academics/students` — sparklines for all rows; Network shows **one** `student-trends` request per 20.

### ATT-TREND-2.1 — backend batch endpoint *(repo: `edforge/server`)*
- **Route (renamed to avoid the existing `/attendance/trend`):** `GET /academics/attendance/student-trends?schoolId=&academicYearId=&studentIds=<csv≤50>&days=7`.
- **Response:** `{ trends: { [studentId]: { rate; series: number[]; trend; totalDays; absentDays } } }`.
- **Impl:** reuse `getStudentAttendance` internals over one window; group by day → daily rate; reuse `computeTrendFromRecords`. Bound `studentIds≤50`, `days≤30`.
- **THREE-WAY ROUTE REGISTRATION** (CLAUDE.md trap): (1) NestJS controller method; (2) **`server/lib/tenant-api-prod.json`** — API-GW is **explicitly enumerated per sub-path (verified)**, *not* prefix-fallthrough, so the new entry is **mandatory** or it 403s SigV4; (3) **nginx** `location ~ ^/academics` covers the prefix → **no nginx change** (verify).
- **IAM:** attendance is in academics' **own** table → **no cross-service grant**; expect `cdk diff tenant-template-stack-basic` **empty** (confirm).
- **Deploy order (matrix):** API-GW spec change → **`shared-infra-stack` (infra, order 1)**, *then* controller code → **ECR push + ECS rolling update (order 2)**. Ride non-prod → human gate → prod.
- **Tests:** service unit (grouping/trend/empty); controller; `npm run lint:routes` green.

### ATT-TREND-2.2 — service + hook (frontend)
- `academics.service.ts` `getAttendanceStudentTrends` + `AttendanceStudentTrendBatch` (mirror backend DTO); `hooks/useAttendance.ts` `useAttendanceStudentTrends({schoolId,academicYearId,studentIds,days})` — `enabled` on non-empty IDs; queryKey includes **sorted** IDs; `staleTime` 10 min. **Tests:** fetches on non-empty; disabled empty; stable key.

### ATT-TREND-2.3 — wire visible-page IDs → cell
- `routes/students/index.tsx` derives visible `studentIds`, builds `trendMap`; `StudentTable` feeds `series` to `AttendanceTrend`. Fallback chain: `trendMap[id].series` → `alertsTrendMap[id]` bar → `—`. Promote the header to **"Attendance · 7d"**. **Tests:** series → sparkline; absent → bar/`—`; **one** hook call/page (no N+1).

### ATT-TREND-2.4 — drawer parity *(optional, last)*
- Optionally feed the real series into the `StudentQuickProfile` tile. The single-aggregate donut is arguably fine for the drawer — **mark optional / cut if time-boxed**.

---

## Sprint 3 — Polish, hardening & decisions

### UI-TREND-3.1 — converge threshold color *(downgraded)*
- The 4th-copy problem is avoided by importing `@edforge/types getAttendanceColor` in Sprint 0. **This task is now just:** delete the local copies in `StudentTable.tsx:62` + `AttendanceDonutRing.tsx:38` and import the shared util. Small, opportunistic.

### STU-TBL-3.2 — guardian popover polish
- Avatar + name + relationship + portal/pickup + (permission-gated) contact affordance; full a11y. *(The functional popover ships in 1.3; this is visual/interaction refinement only.)*

### STU-TBL-3.3 — DiceBear offline hardening *(promoted from risk — see D-8)*
- Evaluate migrating the stacked column (and ideally all avatars) from the **`api.dicebear.com` HTTP API** to the local **`@dicebear/core`** packages so avatars render client-side with **no third-party network dependency** (school networks behind content filters are common in-market). Initials-first (UI-AVA-1.0) is the interim mitigation. **Decision D-8.**

### STU-TBL-3.4 — assembled-table a11y + e2e smoke
- Playwright: load students; assert Guardian stack, Location, attendance cell; toggle a column; resize to md and assert responsive hide; popover keyboard nav; row-click drawer unaffected by `stopPropagation`. One combined axe/keyboard pass.

### STU-TBL-3.5 — realistic fixtures
- Ensure `@edforge/pilot-fixtures` (or test fixtures) include: multi-guardian, no-guardian, Nepal-address, legacy-address, and at-risk/healthy/no-record attendance students — so the §8 visual smoke can actually validate every state.

**Cut from scope** (per "match scope to ask"): DataTable `minWidth`/`layout` wide-mode (xl fits 8, lg fits 7 — not load-bearing); a guardian-add CTA in the cell (flow already exists on the profile).

---

## 7. File inventory

**New (frontend):** `packages/ui/src/components/AttendanceTrend.tsx` (+test); `apps/academics/src/utils/student-location.ts` (+test); `cells/GradeChip.tsx`, `cells/GuardianCell.tsx`, `cells/StudentLocationCell.tsx` (+tests).
**Modified (frontend):** `packages/ui/src/index.ts`; `components/common/UserAvatar.tsx` (seed + initials-first); `components/students/StudentTable.tsx`; `routes/students/index.tsx`; (Sprint 2) `services/academics.service.ts`, `hooks/useAttendance.ts`, optionally `StudentQuickProfile.tsx`; `ProfileTab.tsx`/`ReviewStep.tsx` (dedupe `isNepalAddress`).
**Backend (Sprint 2):** `…/academics/src/attendance/attendance.controller.ts` + `attendance.service.ts`; `server/lib/tenant-api-prod.json`.

---

## 8. Validation gates (every PR)
- `pnpm -w typecheck` + per-package `vitest` green (new tests included).
- `pnpm -w lint` green; **no new `var(--v2-*)` in new cell components** (verify the repo's lint config actually scopes this; MFE lint coverage differs from the backend's documented gates).
- **Visual render-path smoke (required, CLAUDE.md):** `pnpm dev:academics` at md/lg/xl, light+dark, **confirming the §3 breakpoints at real shell pane widths** — lead with the At-risk chip view.
- Backend (Sprint 2): `nest build academics`, `npm run lint:routes`, `cdk diff tenant-template-stack-basic` empty, `cdk synth` clean; non-prod → human gate → prod.

---

## 9. Open decisions

- **D-1 — Guardian PII at the API.** Render summary-only in the cell now; **separately**, do we add a slim list DTO server-side to stop shipping guardian `email`/`phone`/`address` to the browser? (Recommended follow-up; current gating is rendering-only.)
- **D-2 — Sparkline window.** 7-day in-table (prototype) vs 30-day (drawer copy). Recommend 7-day cell, 30-day aggregate in drawer.
- **D-3 — Endpoint vs denormalization.** Batch `student-trends` endpoint (recommended) vs enriching the student-list response with attendance (couples cross-domain — not recommended).
- **D-4 — Default columns.** Confirm Enrolled is xl-only/opt-in, and the md–lg hide order (Enrolled → Location/Guardian) vs hiding Status.
- **D-5 — Roster CSV export.** The only wired export (`useAcademicsOverviewV2.ts:135`) is **enrollment-distribution**, not a roster export — so there's nothing to "add columns to." Do operators expect a **student-roster CSV with Guardian/Location**? If yes, that's a **new backend feature**, not part of this lift.
- **D-6 — Telemetry.** No first-class analytics/track hook found in academics. Instrument guardian-popover/column-toggle, or accept out-of-scope?
- **D-7 — Mobile (`< md`).** An 8→5 column table is still poor at 375 px. Ship a stacked-card representation (new task) or accept the responsive-hide floor as a documented non-goal for V1?
- **D-8 — DiceBear dependency.** Migrate to local `@dicebear/core` (no third-party fetch; resilient on filtered school networks) or keep the HTTP API + initials-first mitigation?

---

## 10. Risks & rollback

| Risk | Mitigation |
|------|------------|
| 8 fixed-layout columns crush the row (padding math) | xl-only 8th column; default 7; pane-width breakpoints; visual smoke |
| Colliding guardian avatars (name-seeded, optional id) | Dedicated composite seed (UI-AVA-1.0) |
| Guardian PII in payload | Rendering gate now; slim DTO follow-up (D-1) |
| **80 avatar fetches/page** to `api.dicebear.com`; blocked on filtered school networks | Initials-first + lazy + cap; local `@dicebear/core` migration (D-8) |
| Grade sort regression (`"10" < "2"`) | Numeric `sortingFn` + no-regression test (STU-TBL-1.10) |
| Skeleton↔table jump | STU-TBL-1.9 in lockstep |
| Batch endpoint latency | Bounds (`≤50`/`≤30`); cell degrades to bar while loading |
| Light-mode contrast on new tinted cells | Explicit AA check (STU-TBL-1.10 / 1.2) |

**Rollback:** Sprints 0–1 are additive/frontend-only — revert the `StudentTable.tsx` column memo to restore the donut. The Sprint-2 endpoint is read-only/additive; removing the hook call silently degrades to Sprint-1 behavior via the fallback chain.

---

## 11. Definition of done
- `/academics/students` renders Student · **Grade chip** · **Attendance** · **Guardian stack (popover)** · **Location** · Status · (xl) Enrolled · Actions — responsive by pane width, theme-correct in light + dark.
- Guardian/Location gated on ABAC; cell shows summary-only; PII-at-API decision (D-1) logged.
- At-risk rows show a trend caret immediately (Sprint 1); **all** rows show a real 7-day sparkline after Sprint 2 with **one request/page**; Grade sorts numerically.
- No regression to pagination, sorting, drawer, filters, KPIs, empty/error/skeleton states.
- New units + assembled-table e2e/a11y smoke green; lint/typecheck green; visual smoke (real shell widths) recorded in the PR.
