# EdForge Home Page V2 — Redesign Sprint Plan

> **Source of truth** for the home page redesign implementation.
> Generated from codebase audit + design prototype + sub-agent review.
> Date: 2026-03-18 | Branch: `home-landing-dashboard`

---

## Codebase Audit Summary

| Concern | Current State |
|---|---|
| **Home page** | `apps/shell/src/pages/HomePage.tsx` — role-based rendering via `DynamicPageLayout` + `GreetingHeader` |
| **Admin dashboard** | `apps/shell/src/components/home/AdminCommandCenter.tsx` — alerts, 4 KPI tiles, attendance trend, finance summary, quick actions |
| **Data hooks** | `apps/shell/src/hooks/useHomeData.ts` — `useHomeAcademicYear`, `useAcademicsSnapshot`, `useHomeAlerts`, `useHomeAttendanceTrend`, `useFinanceSummary` |
| **API service** | `apps/shell/src/services/home.service.ts` — wraps `/academics/dashboard/overview`, `/academics/attendance/alerts`, `/academics/attendance/trend`, `/academics/schools/:id/academic-years/current` |
| **Finance hook** | `useDashboardSummary` from `@edforge/finance-services` — calls `GET /finance/schools/:id/dashboard/summary` |
| **Theme system** | CSS custom properties (`rgb(var(--*))`) + Tailwind `darkMode: 'class'` + Zustand `useThemeStore` |
| **CSS architecture** | `packages/theme/src/base.css` defines `:root` (light) and `.dark` (dark) variables |
| **Chart library** | Recharts v3.7.0+ |
| **Animation library** | Framer Motion |
| **Sidebar** | `apps/shell/src/components/layout/Sidebar.tsx` — Framer Motion, ABAC-filtered nav items |
| **Header/Topbar** | `apps/shell/src/components/layout/Header.tsx` — breadcrumbs + UserMenu (theme picker, language toggle) |
| **App shell** | `apps/shell/src/components/layout/AppShell.tsx` — CSS grid, sidebar collapse, skip link |
| **BS date utility** | `packages/date-utils/src/converter.ts` — exports `adToBS` (not `gregorianToBs`) |
| **Routing** | TanStack Router — `/protected/home` route, `ProtectedLayout` wraps `AppShell` |
| **Existing components** | `HomeStatCard`, `AlertsRow`, `AttendanceTrendCard`, `FinanceSummaryCard` |
| **Shared UI** | `@edforge/ui` — `Card`, `Skeleton`, `Avatar`, `BsDatePicker`, `SchoolDate` |

### Key Findings from Audit

1. **Existing components are functional** — the redesign is a visual/UX upgrade, not a rewrite
2. **Finance `DashboardSummary` schema includes** `byFeeType`, `recentPayments`, `overdue` — currently unused by home page
3. **No per-section attendance status API** — `GET /academics/attendance/trend` returns aggregate daily, not section-level Taken/Pending
4. **Hardcoded Tailwind color classes** throughout home components — must migrate to V2 tokens
5. **Recharts does not reactively read CSS custom properties** — need theme-aware color resolution
6. **`GreetingHeader` renders inside `DynamicPageLayout`** — V2 moves greeting to the global topbar; must reconcile
7. **Academic year data lives inside `AdminCommandCenter`** — topbar date display needs access; must lift to shared store
8. **No React Error Boundaries** in the home page component tree

---

## Design System Tokens (V2 Specification)

### Color Tokens — Dark Theme (Primary)

| Token | Value | Usage |
|---|---|---|
| `--v2-bg-app` | `#0f1117` | Page background |
| `--v2-bg-surface` | `#161b27` | Cards, sidebar |
| `--v2-bg-elevated` | `#1e2436` | Tooltips, hover states |
| `--v2-text-primary` | `#e8eaf0` | Headings, values |
| `--v2-text-secondary` | `#c8ccd8` | Card titles, labels |
| `--v2-text-muted` | `#9aa0b8` | Body text |
| `--v2-text-hint` | `#7a8099` | Subtitles, hints |
| `--v2-text-faint` | `#4a5068` | Timestamps, axis ticks |
| `--v2-text-ghost` | `#3a4055` | Section labels, grid lines |
| `--v2-border-default` | `rgba(255,255,255,0.06)` | Card borders |
| `--v2-border-hover` | `rgba(255,255,255,0.10)` | Hover borders |
| `--v2-border-strong` | `rgba(255,255,255,0.14)` | Emphasized borders |

### Color Tokens — Light Theme Overrides

| Token | Value | Usage |
|---|---|---|
| `--v2-bg-app` | `#f5f6f8` | Page background |
| `--v2-bg-surface` | `#ffffff` | Cards |
| `--v2-bg-elevated` | `#f0f2f5` | Hover states |
| `--v2-text-primary` | `#1a1f2e` | Headings |
| `--v2-text-secondary` | `#374151` | Labels |
| `--v2-text-muted` | `#6b7280` | Body |
| `--v2-text-hint` | `#9aa0b8` | Hints |
| `--v2-text-faint` | `#b0b6c8` | Timestamps |
| `--v2-text-ghost` | `#d1d5db` | Section labels |
| `--v2-border-default` | `#e0e4ec` | Borders |
| `--v2-border-hover` | `#c8cdd8` | Hover |
| `--v2-border-strong` | `#9aa0b8` | Emphasis |
| `--v2-brand-primary` | `#0d7a5f` | Darkened for light bg contrast |

### Semantic Colors (Same in Both Themes)

| Name | Hex | Usage |
|---|---|---|
| Brand Primary | `#1D9E75` | Active nav, success, enrollment |
| Brand Deep | `#0F6E56` | Logo gradient end |
| Info | `#378ADD` | Sections, academics |
| Warning | `#EF9F27` | Attendance alerts, pending |
| Danger | `#E24B4A` | Overdue, critical alerts |
| Accent Purple | `#7F77DD` | Reports, bulk actions |
| Coral | `#D85A30` | Staff, HR |

### Semantic Backgrounds (Dark / Light)

| Semantic | Dark | Light |
|---|---|---|
| Danger bg | `rgba(226,75,74,0.08)` | `#fff1f1` |
| Warning bg | `rgba(239,159,39,0.08)` | `#fffbf0` |
| Success bg | `rgba(29,158,117,0.08)` | `#f0faf5` |
| Info bg | `rgba(55,138,221,0.08)` | `#f0f7ff` |

### Semantic Borders (Dark / Light)

| Semantic | Dark | Light |
|---|---|---|
| Danger | `rgba(226,75,74,0.20)` | `#fecaca` |
| Warning | `rgba(239,159,39,0.20)` | `#fed7aa` |
| Success | `rgba(29,158,117,0.20)` | `#6ee7b7` |
| Info | `rgba(55,138,221,0.20)` | `#bfdbfe` |

### Module Accent Backgrounds

| Module | Color |
|---|---|
| Students/Enrollment | `rgba(29,158,117,0.12)` |
| Sections/Academics | `rgba(55,138,221,0.12)` |
| Attendance/Warnings | `rgba(239,159,39,0.12)` |
| Finance/Fees | `rgba(226,75,74,0.12)` |
| Staff | `rgba(216,90,48,0.12)` |
| Reports | `rgba(127,119,221,0.12)` |
| Settings | `rgba(90,96,112,0.15)` |

### Spacing & Sizing

| Token | Value |
|---|---|
| Grid gap | `12px` |
| Section gap | `16px` |
| Content padding | `20px 28px` |
| Card padding | `18px 20px` |
| Card border-radius | `12px` |
| Icon square | `28px` / `7px` radius |
| Nav item height | `34px` / `8px` radius |
| Quick action radius | `9px` |
| Alert radius | `10px` |
| KPI accent bar height | `2px` |
| Sidebar width | `220px` |
| Topbar height | `56px` |

### Typography Scale

| Element | Spec |
|---|---|
| Font stack | `-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif` |
| Greeting | `14px / 500` |
| KPI value | `26px / 600` |
| Card title | `13px / 500` |
| KPI label | `11px / 500 uppercase 0.5px tracking` |
| Alert title | `12px / 500` |
| Alert subtitle | `11px / 400` |
| Feed text | `12px / 400` |
| Feed timestamp | `10px / 400` |
| Section micro-label | `10px / 600 uppercase 0.8px tracking` |
| Badge/pill | `10px / 500` |
| QA label | `12px / 500` |
| QA description | `10px / 400` |

### Animation Tokens

| Animation | Spec |
|---|---|
| Nav hover | `150ms ease` on background, color |
| Card hover | `150ms ease` on border-color |
| QA hover | `150ms ease` on background, border |
| Progress bar fill | `600ms ease-out` on width (mount via useEffect + 50ms delay) |
| KPI count-up | `800ms ease-out` (custom `useCountUp` hook) |
| Alert slide-in | `translateY(-8px) → translateY(0)`, `opacity 0 → 1`, `300ms ease-out`, `80ms` stagger |
| Page section fade-in | `opacity 0 → 1`, `200ms ease`, `60ms` stagger per section |
| Skeleton pulse | `opacity 0.4 → 0.7`, `1.5s ease-in-out infinite alternate` |
| Live dot pulse | `scale(1) → scale(1.4) → scale(1)`, `2s ease-in-out infinite` |

---

## Data Fetching Architecture

All fetches execute **in parallel** using existing React Query hooks. No new libraries.

| # | Data | Endpoint | Hook | Status |
|---|---|---|---|---|
| 1 | Academic year | `GET /academics/schools/:id/academic-years/current` | `useHomeAcademicYear` | **Exists** |
| 2 | Academics snapshot | `GET /academics/dashboard/overview` | `useAcademicsSnapshot` | **Exists** |
| 3 | Attendance trend | `GET /academics/attendance/trend` | `useHomeAttendanceTrend` | **Exists** |
| 4 | Attendance alerts | `GET /academics/attendance/alerts` | `useHomeAlerts` | **Exists** |
| 5 | Finance summary | `GET /finance/schools/:id/dashboard/summary` | `useFinanceSummary` | **Exists** — needs to expose `byFeeType`, `recentPayments`, `overdue` count |
| 6 | Section attendance | `GET /academics/sections` + attendance records | — | **Does not exist** — descoped to "derive from snapshot" or show static list |

### Error Isolation

Each section handles its own errors independently:
- Finance error → KPI "Outstanding Fees" shows error + retry; Finance card shows error
- Academics error → first 3 KPI tiles show error; chart shows empty state
- Academic year error → top-level message "Unable to load academic year" since all downstream queries depend on it
- Alerts error → alert section hidden (graceful degradation)

### Background Refresh

- `refetchInterval: 5 * 60 * 1000` on all home page queries
- `staleTime` unchanged (existing values are appropriate)
- No skeleton re-display on background refetch — stale-while-revalidate pattern

---

## Sprint Plan

**Complexity scale:** 1 SP = ~2 hours, 2 SP = ~4 hours, 3 SP = ~6 hours

---

### Sprint 1: Design System Foundation & Layout Shell (10 SP)

**Goal:** Application shell renders with V2 token-based styling, correct layout grid, skeleton states for all sections. Both themes work. No data changes.

**Demo:** Navigate to `/home`, see dark layout with skeletons → toggle to light → everything adapts.

---

#### Task 1.1 — Create V2 Design Token CSS File
- **Type:** style | **SP:** 2 | **Dependencies:** none
- **File:** `apps/shell/src/styles/home-v2-tokens.css`
- Create CSS custom properties scoped under `[data-page="home-v2"]` for dark theme (default)
- Add light overrides under `[data-page="home-v2"] .light` or `:root:not(.dark) [data-page="home-v2"]`
- Include all color, spacing, sizing, and typography tokens from the spec above
- **Acceptance:**
  - All token variables defined for BOTH dark and light
  - File imports without build errors
  - WCAG AA contrast check on text-ghost (#3a4055) against bg-surface (#161b27) — flag if below 3:1

#### Task 1.2 — Create V2 Animation CSS + Import Wiring
- **Type:** style | **SP:** 1 | **Dependencies:** none
- **File:** `apps/shell/src/styles/home-v2-animations.css`
- Define `@keyframes`: `v2-skeleton-pulse`, `v2-live-dot-pulse`
- Define CSS custom properties for transition durations/easings
- Note: slide-in and fade-in stagger will use Framer Motion (consistent with existing codebase), NOT CSS keyframes
- **Import wiring:** Add `@import` of both token and animation CSS files in shell's entry CSS or a home-page-specific import
- **Acceptance:** Animations importable, no conflicts with existing styles, imports confirmed in build

#### Task 1.3 — Create `useCountUp` Hook
- **Type:** hook | **SP:** 1 | **Dependencies:** none
- **File:** `apps/shell/src/hooks/useCountUp.ts`
- Signature: `useCountUp(target: number, duration?: number, options?: { enabled?: boolean }): number`
- Uses `requestAnimationFrame` with ease-out easing
- Respects `prefers-reduced-motion` — returns `target` immediately when enabled
- Handles: 0 target, value changes (re-animates), unmount cleanup (cancel RAF)
- **Separate utility:** `parseFormattedValue(str: string): { prefix: string, number: number, suffix: string }` for parsing "NPR 3.5L" → animate numeric part → reformat
- **Acceptance:**
  - Animates from 0 to target over 800ms
  - No memory leak on unmount during animation
  - Instant value when reduced-motion is active

#### Task 1.4a — Add `data-page` Scope to AdminCommandCenter
- **Type:** component | **SP:** 0.5 | **Dependencies:** 1.1
- Wrap `AdminCommandCenter` root div with `data-page="home-v2"` attribute
- Import V2 token CSS
- **Acceptance:** V2 CSS variables resolve correctly within the component tree

#### Task 1.4b — Restructure KPI Grid to V2 Layout
- **Type:** component | **SP:** 1 | **Dependencies:** 1.4a
- Change KPI section from `grid-cols-2 lg:grid-cols-4 gap-4` to `grid-template-columns: repeat(4, minmax(0, 1fr))` with `gap: 12px`
- Responsive: 2-col below 768px
- **Acceptance:** 4-column KPI grid at desktop, 2-column at mobile

#### Task 1.4c — Add Mid-Row Grid Template (1.6fr 1fr)
- **Type:** component | **SP:** 0.5 | **Dependencies:** 1.4a
- Change insights row from `grid-cols-1 lg:grid-cols-2 gap-6` to `grid-template-columns: 1.6fr 1fr` with `gap: 12px`
- Responsive: stack below 768px
- **Acceptance:** Chart card is 1.6x width of finance card at desktop

#### Task 1.4d — Add Bottom-Row Grid Placeholder (1fr 1fr 1.3fr)
- **Type:** component | **SP:** 0.5 | **Dependencies:** 1.4a
- Add 3-column bottom row: `grid-template-columns: 1fr 1fr 1.3fr` with `gap: 12px`
- Render empty Card placeholders with "Quick Actions", "Attendance by Section", "Recent Activity" titles
- Responsive: stack below 768px
- **Acceptance:** 3-column layout at desktop, stacked at mobile, placeholder cards visible

#### Task 1.5 — Redesign HomeStatCard to V2 KPI Tile
- **Type:** component | **SP:** 2 | **Dependencies:** 1.1, 1.3
- Update `HomeStatCard` props: add `accentColor: string`, `tag?: { text: string; color: string }`, `hint?: string`, `href?: string`
- Visual changes:
  - Card bg uses `--v2-bg-surface`, border uses `--v2-border-default`
  - Icon square: 28×28px, 7px radius, module-colored background
  - KPI label: 11px/500 uppercase, color `--v2-text-faint`
  - KPI value: 26px/600, color `--v2-text-primary` (or semantic override)
  - Tag pill: 10px/500, semantic bg + color, 10px radius
  - Hint text: 11px, color `--v2-text-faint`
  - Accent bar: 2px height, absolute bottom, full width, semantic color
  - Hover: border transitions to `--v2-border-hover` in 150ms
- Integrate `useCountUp` for numeric values
- Screen reader: set `aria-label` with final value immediately (count-up is visual only)
- Skeleton: exact same dimensions as loaded tile (no layout shift)
- **Acceptance:**
  - Tiles match prototype visual
  - Count-up animates 0→target on data load
  - No layout shift skeleton→loaded
  - `aria-label` has correct final value during animation

#### Task 1.6 — Redesign AlertsRow to V2 Alert Bar
- **Type:** component | **SP:** 1 | **Dependencies:** 1.1
- Visual changes:
  - Horizontal layout: icon (28×28, 7px radius) | title + subtitle | CTA button
  - Critical: bg `rgba(226,75,74,0.08)`, border `rgba(226,75,74,0.20)`, CTA border `rgba(226,75,74,0.30)`
  - Warning: bg `rgba(239,159,39,0.08)`, border `rgba(239,159,39,0.20)`
  - Border-radius: 10px (no left-border-only style)
  - Title: 12px/500, subtitle: 11px/400 color `--v2-text-faint`
  - CTA: 11px/500, pill-shaped button with semantic border
- Animation: Framer Motion `AnimatePresence` + stagger (translateY -8px, 300ms, 80ms stagger)
- Remove `WidgetSection` wrapper — alerts section now self-contained
- **Acceptance:**
  - Alerts match prototype horizontal layout
  - CTA buttons link correctly
  - Slide-in animation on mount, animate-out on removal
  - `AnimatePresence` handles exit animation

#### Task 1.7 — Create SectionErrorBoundary Component
- **Type:** component | **SP:** 0.5 | **Dependencies:** none
- **File:** `apps/shell/src/components/home/SectionErrorBoundary.tsx`
- React Error Boundary that catches rendering crashes per section
- Fallback: styled error message with "Something went wrong" + retry button
- Wrap each section of `AdminCommandCenter` (alerts, KPIs, charts, bottom row)
- **Acceptance:** Simulated crash in one section doesn't crash the entire page

#### Task 1.8 — Migrate Hardcoded Tailwind Colors to V2 Tokens
- **Type:** style | **SP:** 1 | **Dependencies:** 1.1
- Replace hardcoded Tailwind classes (`bg-teal-50`, `text-amber-600`, `bg-rose-400/20`, etc.) in:
  - `AdminCommandCenter.tsx` (ADMIN_HOME_ACTIONS color objects)
  - `HomeStatCard.tsx` (iconBg, iconColor props)
  - `AlertsRow.tsx` (SEVERITY_STYLES)
- Use V2 semantic CSS variables instead
- **Acceptance:** No hardcoded Tailwind color classes in home components; all colors resolve from V2 tokens

---

### Sprint 2: KPI Tiles, Alerts & Topbar Integration (10 SP)

**Goal:** Real data populates KPI tiles with count-up animation, alerts show with slide-in, topbar shows greeting + BS date + live pill + notification badge.

**Demo:** Page loads → skeletons → data populates with animations → alerts slide in → topbar shows correct BS date and alert count badge.

---

#### Task 2.1 — Wire Count-Up into KPI Tiles with Value Formatting
- **Type:** component | **SP:** 1 | **Dependencies:** 1.3, 1.5
- Integrate `useCountUp` in `HomeStatCard`:
  - Numeric values: animate raw number, format with `.toLocaleString()`
  - Percentage: animate decimal, append `%`
  - NPR values: parse via `parseFormattedValue`, animate lakh decimal, reformat as "NPR X.XL"
- **Acceptance:** All 4 KPI values animate correctly with proper formatting

#### Task 2.2 — Enhance Alert Data with Detailed Context
- **Type:** hook | **SP:** 2 | **Dependencies:** none
- Update `useHomeAlerts` in `useHomeData.ts`:
  - Finance alert title: include overdue count + amount (e.g., "34 invoices are overdue — NPR 3.54 lakh uncollected")
  - Finance alert description: include collection rate + aging info
  - Attendance alert title: include student count + threshold (e.g., "7 students below 80% attendance")
  - Attendance alert description: include today's rate vs 30-day average
- Export alert count as a derived value for notification badge
- Create shared threshold constant `ATTENDANCE_THRESHOLD = 80` (reused by KPI color coding)
- **Acceptance:**
  - Alert text detail level matches prototype
  - Alerts don't flash/reorder when late-arriving data appends new alerts (stable sort by severity)

#### Task 2.3 — Lift Academic Year to Shared Store + Add Notification Badge Store
- **Type:** hook/store | **SP:** 2 | **Dependencies:** 2.2
- Create Zustand slice or extend `app.store.ts`:
  - `homeAlertCount: number` — set by `AdminCommandCenter` when alert data resolves
  - `activeAcademicYear: AcademicYearResponse | null` — set when academic year loads
- Update `AdminCommandCenter` to write alert count to store
- Add notification bell icon + badge to `Header.tsx`:
  - Badge count = `homeAlertCount` from store (derived from fetched data, never hardcoded)
  - Badge hidden when count is 0
  - Badge style: 14px circle, bg `#E24B4A`, 9px white text, positioned top-right
- **Acceptance:**
  - Badge shows correct alert count
  - Badge updates when data changes
  - Badge hidden when no alerts

#### Task 2.4 — Add Greeting + BS/Gregorian Date to Topbar
- **Type:** component | **SP:** 2 | **Dependencies:** 2.3
- Add to `Header.tsx` left side (before breadcrumbs or replacing them on home page):
  - Greeting text: use existing `getGreeting()` utility, 14px/500
  - Date line: "DD MonthName YYYY BS · Weekday, Month DD, YYYY · Academic Year YYYY–YYYY"
  - Use `adToBS` from `@edforge/date-utils` (NOT `gregorianToBs`)
  - Use `getBsMonthName(month, 'en')` for month name
  - Academic year from `activeAcademicYear` in store — show skeleton span while loading, show nothing if null
  - Only show this expanded header on `/home` route; other routes keep breadcrumbs
- Handle BS date edge cases: if `adToBS` returns invalid result, show Gregorian only
- Remove `GreetingHeader` from `HomePage.tsx` `DynamicPageLayout` header prop (moved to topbar)
- **Acceptance:**
  - Correct BS date displays (verify: March 18, 2026 = ~4 Chaitra 2082)
  - Academic year shows when loaded, skeleton while loading, hidden if null
  - Other pages unaffected (still show breadcrumbs)

#### Task 2.5 — Add Live Data Pill to Topbar
- **Type:** component | **SP:** 1 | **Dependencies:** 1.2
- Green pill in topbar right area (before notification bell):
  - 6px dot with `v2-live-dot-pulse` animation (scale transform, NOT opacity)
  - "Live data" text, 11px/500, color `#1D9E75`
  - Pill bg: `rgba(29,158,117,0.1)`, border: `rgba(29,158,117,0.2)`, border-radius: 20px
- Pill reflects actual data freshness: turns gray when all queries are stale (> 10 minutes)
- Only visible on `/home` route
- **Acceptance:** Pill renders, dot pulses with scale transform, turns gray when stale

#### Task 2.6 — Per-Section Error States with Retry
- **Type:** component | **SP:** 1 | **Dependencies:** 1.7
- Each section independently handles API errors:
  - KPI tiles: individual error state with retry per tile (already exists, verify it works)
  - Chart: error message + retry button
  - Finance card: error message + retry button
  - Bottom row cards: error message + retry button
- **Academic year failure handling:** If academic year fetch fails, show top-level banner "Unable to load school data" with retry that re-triggers academic year query
- **Acceptance:** Simulate single API failure → other sections render normally → retry works

#### Task 2.7 — Conditional Alert Rendering with Exit Animation
- **Type:** component | **SP:** 0.5 | **Dependencies:** 1.6
- Alert section hidden (no DOM, no empty space) when no alerts exist
- Use Framer Motion `AnimatePresence` for exit animation (fade-out + translateY)
- **Acceptance:** No empty space when alerts are absent; animate out when clearing

#### Task 2.8 — KPI Attendance Color Coding + Dynamic Tags
- **Type:** component | **SP:** 0.5 | **Dependencies:** 2.2 (shared threshold constant)
- Attendance KPI value:
  - `>= 90%` → `#1D9E75` (green) + tag "+X% above target"
  - `75–89%` → `#EF9F27` (amber) + tag "Below threshold"
  - `< 75%` → `#E24B4A` (red) + tag "Critical"
- Enrolled KPI: tag "+X this month" (from enrollment data if available, otherwise hide tag)
- Sections KPI: tag "X teachers" (from snapshot data)
- Fees KPI: tag "X overdue" + hint "XX.X% collected"
- **Acceptance:** Colors match prototype conditions, tags show real data

---

### Sprint 3: Charts & Detailed Panels (13 SP)

**Goal:** Attendance trend chart with threshold line, financial overview with animated bars + fee breakdown, bottom row with quick actions, attendance sections, activity feed.

**Demo:** Full page renders with all sections populated, chart shows 30-day trend, progress bars animate, bottom row shows real data.

---

#### Task 3.1a — Update Chart Styling (Colors, Height, Axes, Grid)
- **Type:** component | **SP:** 1.5 | **Dependencies:** 1.1
- Update `AttendanceTrendCard`:
  - Chart wrapper: `position: relative; height: 148px`
  - Line: `#1D9E75`, `strokeWidth: 1.5`, `tension: 0.3` (Recharts: `type="monotone"`)
  - Fill gradient: `rgba(29,158,117,0.08)` → transparent
  - Point: radius 2.5, fill `#1D9E75`, border 1.5px in card surface color (`--v2-bg-surface`)
  - Y-axis: domain `[40, 110]`, tick format `v => v + '%'`
  - Grid lines: theme-aware — use `useThemeStore().resolvedTheme` to pick `rgba(255,255,255,0.04)` (dark) or `rgba(0,0,0,0.04)` (light)
  - X-axis ticks: color `#3a4055`, fontSize 10, maxTicksLimit 7
  - Tooltip: bg `--v2-bg-elevated`, border `--v2-border-default`, radius 6px
- Create `useV2ChartColors()` hook that returns resolved color values based on current theme
- **Acceptance:** Chart colors correct in both themes; re-renders on theme toggle

#### Task 3.1b — Add 80% Threshold Reference Line
- **Type:** component | **SP:** 0.5 | **Dependencies:** 3.1a
- Add Recharts `ReferenceLine` at y=80:
  - Color: `rgba(239,159,39,0.35)`, strokeDasharray: `4 4`, strokeWidth: 1
  - No label (handled by custom legend)
- **Acceptance:** Dashed line visible at 80% mark

#### Task 3.1c — Custom HTML Legend for Attendance Chart
- **Type:** component | **SP:** 1 | **Dependencies:** 3.1a
- Replace Recharts default legend with custom HTML above chart:
  - Left side: "Attendance trend" title (13px/500) + "30-day rolling average" subtitle (11px)
  - Right side: green line swatch + "Actual" | dashed amber swatch + "80% target" | "Avg XX.X%" in green bold
- Update `aria-describedby` screen reader summary to include threshold comparison
- **Acceptance:** Legend matches prototype layout, screen reader summary includes "compared to 80% target"

#### Task 3.2a — Add Overdue Progress Bar + Mount Animation
- **Type:** component | **SP:** 1.5 | **Dependencies:** 1.1
- Redesign `FinanceSummaryCard`:
  - 3 progress bars: Collected (green `#1D9E75`), Outstanding (amber `#EF9F27`), Overdue (red `#E24B4A`)
  - Bar track: 3px height, bg `rgba(255,255,255,0.06)` dark / `#e0e4ec` light, 2px radius
  - Bar fill: animates width from 0→target over 600ms ease-out on mount via `useEffect` + 50ms delay
  - Respects `prefers-reduced-motion` (instant width)
  - Label: 12px left, value: 12px/500 right (semantic color)
- Add `overdue` prop to `FinanceSummaryCard`
- Update `AdminCommandCenter` to pass `financeSummary.overdue`
- Add `role="progressbar"`, `aria-valuenow`, `aria-valuemin=0`, `aria-valuemax`, `aria-label` to each bar
- **Acceptance:** 3 bars render, animate on mount, ARIA attributes present

#### Task 3.2b — Fee Type Breakdown Rows
- **Type:** component | **SP:** 1 | **Dependencies:** 3.2a
- Below progress bars, add fee type breakdown:
  - Divider line
  - Row per fee type: label left (11px, `--v2-text-faint`), "NPR X.XL invoiced" right (11px, `--v2-text-hint`)
  - Data from `financeSummary.byFeeType` (already in DashboardSummary schema)
- Update `useFinanceSummary` wrapper to expose `byFeeType` field
- **Acceptance:** Fee type rows render with real data from API

#### Task 3.2c — Total Invoiced Footer + View Finance Link
- **Type:** component | **SP:** 0.5 | **Dependencies:** 3.2a
- Divider + "Total invoiced this year" row:
  - Label: 11px, `--v2-text-faint`
  - Value: 13px/600, `#E24B4A` (danger)
- "View Finance →" link at bottom (same style as existing)
- **Acceptance:** Footer shows total invoiced = sum of all fee types

#### Task 3.3 — Wire byFeeType + recentPayments from Finance Summary
- **Type:** hook | **SP:** 1 | **Dependencies:** none
- Update `useFinanceSummary` in `useHomeData.ts` to expose:
  - `byFeeType: Record<string, number>` — fee type → invoiced amount
  - `recentPayments: Array<{id, amount, gateway, status, receiptNumber?, paidAt?, createdAt}>` — latest payments
  - `totalInvoiced: number`
  - `overdue: number` (already available, just expose explicitly)
- Verify these fields exist in the `DashboardSummary` response type
- **Acceptance:** All fields available to consuming components

#### Task 3.4 — Build Quick Actions Grid V2
- **Type:** component | **SP:** 2 | **Dependencies:** 1.1
- **File:** new component or update `QuickActionsWidget`
- Bottom-left card: 2×3 grid layout
- 6 action cards:
  1. Add Student → `/academics/students` — teal icon bg
  2. Attendance → `/academics/classrooms?tab=attendance` — blue icon bg
  3. Generate Invoice → `/finance/billing/invoices` — amber icon bg
  4. View Reports → `/academics` — purple icon bg
  5. Manage Staff → `/people/staff` — coral icon bg
  6. Settings → `/settings` — gray icon bg
- Card styling: bg `--v2-bg-app`, border `--v2-border-default`, radius 9px, padding 12px
- Hover: bg `--v2-bg-surface`, border `--v2-border-hover`, 150ms ease
- Icon: 24×24, 6px radius, module-colored background
- Label: 12px/500, desc: 10px `--v2-text-faint`
- Replace existing `<QuickActionsWidget actions={ADMIN_HOME_ACTIONS} columns={4} />` in AdminCommandCenter
- **Acceptance:** 6 cards in 2×3 grid, correct links, hover transitions

#### Task 3.5 — Build Attendance By Section Panel
- **Type:** component | **SP:** 2 | **Dependencies:** 1.1
- **File:** `apps/shell/src/components/home/AttendanceBySectionCard.tsx`
- Bottom-middle card: list of today's sections with status badges
- **Data approach:** Since no per-section attendance API exists:
  - Use existing `useAcademicsSnapshot` data which includes `activeSectionsCount`
  - Use `getTeacherSections` (already in home.service.ts) to get section list
  - Show section name + "Taken"/"Pending" based on whether attendance has been recorded
  - If no section-level attendance data available, show section names with "—" status
- Header: "Attendance by section" + today's overall rate in amber
- Badge styles:
  - Taken: bg `rgba(29,158,117,0.12)`, color `#1D9E75`, checkmark icon
  - Pending: bg `rgba(239,159,39,0.10)`, color `#EF9F27`, clock icon
- Row: 9px vertical padding, bottom border `rgba(255,255,255,0.04)`
- Skeleton: 5 rows with badge-shaped placeholder
- **Acceptance:** Section list renders, badges styled correctly, graceful fallback when no data

#### Task 3.6 — Build Recent Activity Feed
- **Type:** component | **SP:** 2 | **Dependencies:** 3.3
- **File:** `apps/shell/src/components/home/RecentActivityFeed.tsx`
- Bottom-right card: timeline of recent events
- Data from `financeSummary.recentPayments` + `financeSummary.recentInvoices`
- Event mapping:
  - Payment received → green dot (`#1D9E75`)
  - Overdue auto-detected → red dot (`#E24B4A`)
  - Attendance submitted → blue dot (`#378ADD`)
  - Bulk invoice generated → purple dot (`#7F77DD`)
- Item layout: 7px colored dot | text (12px, `--v2-text-muted`) | timestamp (10px, `--v2-text-ghost`)
- Bottom border `rgba(255,255,255,0.04)` between items, last item no border
- "View all" link → `/finance/billing`
- Empty state: "No recent activity" message
- Skeleton: 5 rows with dot + text placeholders
- **Acceptance:** Feed renders with real data, dot colors correct, empty state works

#### Task 3.7 — Section Fade-In Stagger Animation
- **Type:** style | **SP:** 0.5 | **Dependencies:** 1.4a
- Wrap each section of `AdminCommandCenter` in Framer Motion `motion.div`:
  - `initial={{ opacity: 0 }}`, `animate={{ opacity: 1 }}`
  - Parent uses `staggerChildren: 0.06` (60ms)
  - Duration: 200ms ease
- Respects `prefers-reduced-motion` (instant)
- **Acceptance:** Visible stagger on page load, instant when reduced-motion

---

### Sprint 4: Theme Polish, Responsiveness, Accessibility & Performance (9 SP)

**Goal:** Production-grade quality. Both themes pixel-perfect. Responsive at all breakpoints. Full keyboard navigation. Performance validated.

**Demo:** Lighthouse 90+, axe-core 0 errors, responsive at 375/768/1024/1440px.

---

#### Task 4.1 — Light Theme Token Audit & Fixes
- **Type:** style | **SP:** 2 | **Dependencies:** all Sprint 3
- Test every component in light mode:
  - Chart grid lines switch to `rgba(0,0,0,0.04)`
  - Tooltip bg switches to `#ffffff` with proper border
  - Progress bar tracks use light border color
  - Quick action cards use light bg/border
  - Activity feed dots maintain semantic colors
  - Alert bars use light semantic backgrounds
- Fix any remaining hardcoded dark-only hex values
- **Acceptance:** Visual parity between themes — every component inspected in both

#### Task 4.2 — Responsive Breakpoints
- **Type:** style | **SP:** 2 | **Dependencies:** 4.1
- Breakpoint behavior:
  - `< 1024px`: KPI grid → 2 columns, bottom row → 2 columns (quick actions + sections, feed below)
  - `< 768px`: mid-row charts stack vertically, bottom row single column, content padding reduces
  - Sidebar collapse handled by existing AppShell (no changes needed)
- Test at: 375px, 768px, 1024px, 1440px
- **Acceptance:** Layout correct at all 4 breakpoints, no horizontal scroll

#### Task 4.3 — Keyboard Navigation, ARIA & Focus Rings
- **Type:** a11y | **SP:** 2 | **Dependencies:** all Sprint 3
- Tab order: alerts (CTA buttons) → KPI tiles → chart cards → quick action cards → section list → activity feed
- `aria-label` on: notification bell, live data pill, each KPI tile, each quick action card, each alert CTA
- `aria-live="polite"` on: alert count region, notification badge
- Focus rings: `outline: 2px solid var(--v2-brand-primary)` + 2px offset, visible in both themes
- Screen reader: count-up shows final value via `aria-label`, progress bars have `role="progressbar"`
- **Acceptance:** Full keyboard navigation works, axe-core scan passes with 0 critical/serious issues

#### Task 4.4 — Prefers-Reduced-Motion Support
- **Type:** a11y | **SP:** 0.5 | **Dependencies:** 1.3, 3.2a, 3.7
- When `prefers-reduced-motion: reduce`:
  - `useCountUp` returns target immediately
  - Alert slide-in: instant (no translateY/opacity transition)
  - Progress bar fill: instant width (no animation)
  - Section fade-in: instant opacity
  - Live dot: no pulse (static dot)
  - Card hover: instant border change
- **Acceptance:** All animations respect media query

#### Task 4.5 — Background Data Refresh
- **Type:** hook | **SP:** 0.5 | **Dependencies:** none
- Add `refetchInterval: 5 * 60 * 1000` to all home page queries
- Ensure `keepPreviousData: true` or equivalent to prevent skeleton flash
- Live data pill: green when fresh, gray when all queries stale > 10 min
- **Acceptance:** Data refreshes silently, no skeleton re-display, pill reflects freshness

#### Task 4.6 — Empty States
- **Type:** component | **SP:** 0.5 | **Dependencies:** all Sprint 3
- No alerts → section hidden (already in 2.7)
- No recent payments → "No recent activity" message in feed
- No attendance trend data → chart shows "No attendance data recorded" centered message
- No sections → "No sections scheduled today" in attendance panel
- No academic year → topbar shows Gregorian date only
- **Acceptance:** All empty states tested and styled in both themes

#### Task 4.7 — Bundle Analysis & Import Audit
- **Type:** config | **SP:** 0.5 | **Dependencies:** all Sprint 3
- Measure current home page chunk size (baseline)
- Verify no circular dependencies between shell and MFE modules
- Verify home page only imports:
  - `useDashboardSummary` from `@edforge/finance-services`
  - `apiGet` from shell's `lib/api`
  - `adToBS`, `getBsMonthName` from `@edforge/date-utils`
  - UI components from `@edforge/ui`
- No imports from `apps/academics/` or `apps/finance/` internal modules
- **Acceptance:** No circular deps, home page chunk < 50KB gzipped

#### Task 4.8 — Integration Smoke Test
- **Type:** test | **SP:** 1 | **Dependencies:** all
- Write integration test (Vitest + Testing Library or Playwright):
  - Page loads → skeletons appear → data populates
  - KPI values show correct numbers
  - Alerts render when overdue > 0
  - Notification badge count matches alert count
  - Theme toggle switches all components
  - Quick action links resolve to correct routes
- Test admin, teacher, student role variants still render (no regression)
- **Acceptance:** Test passes in CI

---

## Summary

| Sprint | SP | Key Deliverable |
|---|---|---|
| Sprint 1 | 10 | V2 tokens, layout grid, redesigned KPI tiles + alerts, error boundaries |
| Sprint 2 | 10 | Data integration, topbar enhancement (greeting, BS date, live pill, badge) |
| Sprint 3 | 13 | Chart redesign, financial overview, bottom row panels (QA, sections, feed) |
| Sprint 4 | 9 | Theme polish, responsive, a11y, performance, integration test |
| **Total** | **42 SP** | |

---

## Critical Implementation Notes

1. **Scoped tokens:** V2 tokens are scoped to `[data-page="home-v2"]` to avoid breaking other pages. Do NOT override global `:root` variables.

2. **BS date function:** Use `adToBS` from `@edforge/date-utils`, NOT `gregorianToBs`. The function name in the codebase is `adToBS`.

3. **Recharts theme reactivity:** Recharts does not read CSS custom properties. Create a `useV2ChartColors()` hook that reads `resolvedTheme` from `useThemeStore()` and returns the correct hex values. The chart must re-render on theme change.

4. **Count-up for formatted values:** The `useCountUp` hook animates raw numbers. For "NPR 3.5L", parse the numeric portion (3.5), animate it, then reformat. Provide a `parseFormattedValue` utility.

5. **Live dot pulse:** Use `transform: scale()` keyframes, NOT opacity. Scale pulse looks alive; opacity pulse looks cheap.

6. **Skeleton = loaded dimensions:** Every skeleton must exactly match the pixel dimensions of its loaded counterpart. Layout shift is a UX and performance failure.

7. **Error isolation:** Finance error must never prevent academics from rendering. Sections are independent. Academic year failure is the only cascading error (show top-level retry).

8. **Notification badge:** Derived from fetched alert count, never hardcoded. Badge = 0 → hidden.

9. **No full module imports:** The home page must not import `apps/academics/` or `apps/finance/` internal modules. Only import the specific hooks/services from shared packages.

10. **Feature flag consideration:** If the team prefers incremental rollout, add a `?v2=true` query param or feature flag to opt into V2 during development. Otherwise, implement in-place on the `home-landing-dashboard` branch.
