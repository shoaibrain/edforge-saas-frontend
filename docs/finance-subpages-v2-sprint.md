# Finance Sub-Pages V2 Sprint Plan

> **Module**: Finance (`apps/finance`)
> **Target**: Upgrade Invoices, Student Accounts, Payments, and Fee Structures pages to V2 design system
> **Date**: 2026-03-20
> **Branch**: `dev`

---

## 1. Audit Findings Summary

### Invoices Page (`routes/billing/invoices/index.tsx`)
Currently functional with TanStack DataTable, row selection, bulk issue, cancel dialog, and generate invoice modal. Missing V2 page header (icon square + subtitle strip), KPI tiles above the table, info banner for overdue alerts, and V2 status chips with dot indicators. Uses `formatDateDual()` for BS dates correctly. Column renderers are basic — no student grade/stream display. Filter is a plain `<select>` instead of V2 chip-style filters. No CSV export button in filter strip.

### Student Accounts Page (`routes/billing/accounts/index.tsx`)
Has expandable rows with tabbed detail (Ledger/Invoices/Payments) working correctly. DiceBear avatars use `adventurer` style with correct seed logic (`getAvatarUrl`). Missing V2 page header, KPI tiles, and info banner. Balance colors (red/green) are correct. Tab button styling uses hardcoded `bg-teal-600` instead of V2 tokens. No search/filter strip beyond the DataTable's built-in search.

### Payments Page (`routes/billing/payments/index.tsx`)
Functional with void/refund dialogs, gateway/status filters, CSV export via kebab menu, and receipt link. Missing V2 page header, KPI tiles, and info banner. Uses `formatDate()` (single date) instead of `formatDateDual()` for BS dates. Gateway display uses `capitalize` CSS instead of `formatGatewayLabel()`. Actions menu is a custom dropdown — should remain as-is.

### Fee Structures Page (`routes/configuration/fee-structures.tsx` + `components/configuration/FeeStructureList.tsx`)
CRUD operations work via modals (FeeStructureForm). Delete confirmation dialog is custom-styled and functional. **Bug #2**: Grade levels column uses `<GraduationCap>` lucide icon (graduation cap, not eye icon per screenshots — but the icon is rendered inline with each grade chip at 2.5x2.5 size, creating visual noise). The fix should remove the icon entirely and use clean chip-style rendering. Missing V2 page header, KPI tiles, filter chips (All/Active/Inactive), and info banner about auto-apply. Type column is plain text instead of colored chips.

---

## 2. Shared Component API Contracts

### `FinancePageHeader`
```typescript
interface FinancePageHeaderProps {
  icon: LucideIcon
  title: string
  subtitle: string
  /** Module accent hex color for the icon square background */
  accentColor: string
  /** Icon stroke color */
  iconColor: string
  /** Right-side action buttons */
  actions?: React.ReactNode
}
```

### `FinanceInfoBanner`
```typescript
interface FinanceInfoBannerProps {
  /** Banner variant controls background/border colors */
  variant: 'info' | 'warning' | 'danger' | 'success'
  /** Main message text */
  message: string
  /** Optional subtitle below the message */
  subtitle?: string
  /** Optional CTA button */
  action?: { label: string; onClick: () => void }
  /** Whether the banner can be dismissed */
  dismissible?: boolean
}
```
Color map:
- `info`: bg `rgba(55,138,221,0.06)`, border `rgba(55,138,221,0.12)`, icon `#378ADD`
- `warning`: bg `rgba(239,159,39,0.06)`, border `rgba(239,159,39,0.12)`, icon `#EF9F27`
- `danger`: bg `rgba(226,75,74,0.06)`, border `rgba(226,75,74,0.12)`, icon `#E24B4A`
- `success`: bg `rgba(29,158,117,0.06)`, border `rgba(29,158,117,0.12)`, icon `#1D9E75`

### `FinanceStatusChip`
```typescript
interface FinanceStatusChipProps {
  /** Status key — normalized internally */
  status: string
  /** Optional size variant */
  size?: 'xs' | 'sm'
}
```
Status color mapping (dot + text):
- `paid` / `completed`: `#1D9E75`
- `issued` / `processing`: `#378ADD`
- `overdue` / `failed`: `#E24B4A`
- `draft`: `var(--v2-text-hint)`
- `partially_paid` / `partially_refunded`: `#EF9F27`
- `cancelled` / `written_off`: `var(--v2-text-ghost)`
- `refunded`: `#EF9F27`
- `pending`: `#EF9F27`
- `debit`: `#E24B4A` (ledger entry type)
- `credit`: `#1D9E75` (ledger entry type)

### `FeeTypeChip`
```typescript
interface FeeTypeChipProps {
  type: string
}
```
Color mapping:
- `admission`: `#378ADD`
- `lab`: `#7F77DD`
- `transport`: `#EF9F27`
- `tuition`: `#1D9E75`
- `exam`: `#D85A30`
- `library` / `hostel` / `uniform` / `miscellaneous` / `custom`: `var(--v2-text-hint)`

### `FinanceFilterChips`
```typescript
interface FinanceFilterChipsProps {
  options: Array<{ label: string; value: string }>
  value: string
  onChange: (value: string) => void
  /** Module accent color for active chip */
  accentColor: string
}
```

### `ExportCsvButton`
```typescript
interface ExportCsvButtonProps {
  onClick: () => void
  isExporting: boolean
}
```

---

## 3. Task List in Dependency Order

### Phase 0 — Audit (Complete)
- [x] Read all four page source files
- [x] Read FeeStructureList component (identified grade icon issue)
- [x] Read StatusBadge, StatCard, useCountUp, formatNPRCompact, formatGradeLabel
- [x] Read HTML prototypes for design reference
- [x] Verified `formatGradeLabel()` exists in `@edforge/types` (academics-utils.ts) — accepts string, returns "Grade N" for numeric

### Phase 1 — Shared Components
*Must complete before any page upgrade.*
1. Create `FinancePageHeader` component
2. Create `FinanceInfoBanner` component
3. Create `FinanceStatusChip` component (replaces `StatusBadge` on finance pages) — must include `debit`/`credit` entries for ledger tab
4. Create `FeeTypeChip` component
5. Create `FinanceFilterChips` component
6. Create `ExportCsvButton` component
7. Build validation

**NOTE**: Do NOT create a custom KPI tile component. Reuse `StatCard` from `@edforge/ui` (already includes count-up, skeleton, error states). Follow the pattern in `overview.tsx` lines 273-322. Wrap KPI grids with `WidgetErrorBoundaryV2` from `@edforge/ui`.

### Phase 2 — Invoices Page
*Depends on Phase 1.*
1. Add page header with amber accent
2. Add overdue info banner (danger variant)
3. Add KPI tiles using `StatCard` from `@edforge/ui` (4-col grid, `grid-cols-2 lg:grid-cols-4`): Total Invoiced, Collected, Outstanding, Overdue. KPI values derived from `useInvoices` hook data via `useMemo`.
4. Replace StatusBadge with FinanceStatusChip
5. Replace status `<select>` with FinanceFilterChips
6. Add Export CSV button to filter strip
7. Add dual date (BS) display in Due Date column
8. Add overdue day indicator text
9. Build validation

### Phase 3 — Student Accounts Page
*Depends on Phase 1.*
1. Add page header with teal accent
2. Add info banner (info variant)
3. Add KPI tiles using `StatCard` (4-col grid, `grid-cols-2 lg:grid-cols-4`): Total Students, Outstanding Balance, Fully Paid, Overdue Students. Values derived from `useStudentAccounts` via `useMemo`.
4. Replace StatusBadge with FinanceStatusChip in expanded row tabs — **including `entry.entryType` values (`debit`/`credit`) in the Ledger tab**
5. Replace hardcoded `bg-teal-600` in TabButton active state with V2 accent color (`var(--v2-brand-primary)`). TabButton styling is NOT part of the sacred AccountDetail preservation scope.
6. Preserve DiceBear avatar logic (DO NOT CHANGE)
7. Preserve row expansion mechanism (DO NOT CHANGE)
8. Build validation

### Phase 4 — Payments Page
*Depends on Phase 1.*
1. Add page header with teal accent
2. Add KPI tiles using `StatCard` (4-col grid): Total Collected, Completed, Partial Refunds, Cancelled. Values derived from `useSchoolPayments` via `useMemo`.
3. Replace StatusBadge with FinanceStatusChip
4. Replace status/gateway `<select>` with FinanceFilterChips
5. Add Export CSV button to filter strip (move from kebab menu)
6. Use `formatGatewayLabel()` for gateway display
7. Use `formatDateDual()` for payment dates
8. Preserve void/refund dialog flows (DO NOT CHANGE)
9. Build validation

### Phase 5 — Fee Structures Page
*Depends on Phase 1.*
1. Add page header with purple accent
2. Add info banner about auto-apply on enrollment
3. Add KPI tiles: Total Structures, Auto-Apply, Fee Types, Max Fee
4. Add filter chips: All / Active / Inactive
5. **Fix grade levels column**: Remove GraduationCap icon, use clean chip rendering with `formatGradeLabel()` from `@edforge/types`. Sort grades with `gradeSort()` before rendering: `gradeLevels.sort(gradeSort).map(g => formatGradeLabel(g))`. Import both from `@edforge/types`.
6. Replace plain text type column with `FeeTypeChip`
7. Enhance name column with active dot indicator and auto-apply text
8. Format amount column with `formatNPRCompact()` + frequency hint
9. Preserve delete confirmation dialog (DO NOT CHANGE)
10. Preserve FeeStructureForm modal (DO NOT CHANGE)
11. Build validation

### Phase 6 — Polish
*Depends on Phases 2-5.*
1. Loading states (skeleton rows) for all tables
2. `WidgetErrorBoundaryV2` (from `@edforge/ui`) wrapping KPI tile groups — follow pattern in `overview.tsx` lines 256-264
3. Empty state for filtered tables
4. Responsive breakpoints: Use `grid-cols-2 lg:grid-cols-4` for KPI grids (same pattern as Finance Overview). Do NOT use container queries. Use `flex-wrap` for filter strips. Add `md:grid-cols-2` as intermediate step.
5. Recalculate `maxHeight` values for all four DataTable instances to account for added header (~44px), banner (~40px), and KPI tiles (~120px). Increase subtracted rem value from 15rem to ~28rem.
6. Light theme validation — audit all non-sacred components for hardcoded Tailwind `dark:` classes. New components must use `var(--v2-*)` tokens exclusively. Existing action button colors (green Issue, red Cancel) may retain Tailwind dark variants if they align with the shell's theme switching mechanism.
7. Visual cohesion check against Finance Overview
8. `prefers-reduced-motion` disables all animations

---

## 4. Risk Register

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | FinanceStatusChip receives inconsistent status strings across pages | Medium | Normalize status input with `.toLowerCase().replace(/ /g, '_')` before lookup |
| 2 | Adding KPI tiles above DataTable could shift scroll position or break virtualization | Low | DataTable uses `maxHeight` CSS, not virtualization. KPI tiles are outside the table container. No risk. |
| 3 | Row selection state lost on re-render from KPI tile addition | Low | `rowSelection` is controlled state in `useState`, independent of DOM above the table |
| 4 | TanStack Table v8 expansion API assumptions | Low | Confirmed: project uses v8.20.0. `createExpandColumn()` from `@edforge/ui` handles `row.getIsExpanded()` and `row.toggleExpanded()` correctly |
| 5 | `formatGradeLabel()` input type mismatch | Medium | FeeStructure.gradeLevels is `string[]` (e.g., `['9', '10', '12']`). `formatGradeLabel()` accepts `string`. Compatible. |
| 6 | `formatNPRCompact()` receives string instead of number | Low | All data hooks return `amount` as `number`. `formatNPRCompact()` expects `number`. Compatible. |
| 7 | Delete confirmation dialog accidentally replaced | High | Dialog is in `fee-structures.tsx` (DeleteConfirmDialog). Sprint only modifies `FeeStructureList.tsx` column renderers. Dialog code untouched. |
| 8 | DiceBear avatar logic changed | High | `getAvatarUrl()` in accounts page must not be modified. Student Accounts upgrade only adds header/KPIs above the table. |
| 9 | Light theme hardcoded dark values | Medium | Use V2 CSS custom properties (`var(--v2-*)`) for all new components. Avoid `rgba(255,255,255,*)` in component styles. |
| 10 | Responsive breakpoints conflict with shell grid | Low | Content pane has no fixed width. Use CSS container queries or viewport breakpoints that work within the grid. |
| 11 | Import path for `formatGradeLabel` | Low | Located in `@edforge/types` (academics-utils.ts). Must verify it's exported from package index. |

---

## 5. Known Bug Fix Tracking

| Bug # | Description | Status | Fix Location |
|-------|-------------|--------|-------------|
| 2 | Grade levels column shows GraduationCap icons instead of clean chips | **In scope** | `FeeStructureList.tsx` — replace cell renderer |
| 3 | `formatRelativeDate` timezone handling with naive ISO strings | **In scope** | `finance-utils.ts` — already fixed (normalizes to UTC) |
| 5 | Drawer `position:absolute` inside content-pane | **Out of scope** | This sprint does not touch drawer CSS |

---

## 6. Preservation Log

The following must NOT be changed during this sprint:

### Sacred Components
- **DiceBear avatar logic** (`getAvatarUrl()` in accounts page) — seed, style (`adventurer`), variant, URL params, background colors
- **Row selection state** — `rowSelection` / `setRowSelection` in Invoices page
- **Row expansion mechanism** — `createExpandColumn()`, `renderSubComponent` in Student Accounts
- **AccountDetail component** — tabbed detail (Ledger/Invoices/Payments) with AnimatePresence
- **Add Fee Structure modal** (`FeeStructureForm`) — form fields, validation, submit handlers
- **Delete confirmation dialog** (`DeleteConfirmDialog` in fee-structures.tsx) — UI, handlers, escape/backdrop behavior
- **Record Payment form** (`routes/billing/payments/record.tsx`) — entire page untouched
- **Generate Invoice modal** (`GenerateInvoiceModal` in invoices page) — form fields, fee structure selection, total calculation
- **Bulk Issue Confirmation modal** — count display, confirm/cancel flow
- **Cancel Invoice dialog** — reason input, confirm/cancel flow
- **Void Payment dialog** — payment detail display, reason input
- **Refund Payment dialog** — amount validation, partial refund support

### Routing
All routes must remain unchanged:
- `/` — Overview
- `/invoices` — Invoice list
- `/invoices/$invoiceId` — Invoice detail
- `/invoices/bulk-generate` — Bulk generate
- `/payments` — Payments list
- `/payments/record` — Record payment
- `/accounts` — Student accounts
- `/configuration/fee-structures` — Fee structures
- `/configuration/payment-gateways` — Payment gateways

### API Calls & Data Hooks
All hook signatures must remain unchanged:
- `useInvoices(schoolId, filters)` — returns `{ items: Invoice[] }`
- `useStudentAccounts(schoolId)` — returns `StudentAccount[]`
- `useSchoolPayments(schoolId, filters)` — returns `Payment[]`
- `useFeeStructures(schoolId)` — returns `FeeStructure[]`
- `useGenerateInvoice()`, `useIssueInvoice()`, `useCancelInvoice()`, `useBulkIssueInvoices()`
- `useCreateFeeStructure()`, `useUpdateFeeStructure()`, `useDeleteFeeStructure()`
- `useVoidPayment()`, `useCreateRefund()`
- `useExportPaymentsCsv()`
- `useStudentLedger()`, `useAcademicYears()`
- `useDashboardSummary()` / `useFinanceOverviewV2()`

### TanStack Table
- Never rebuild table instances — only modify `cell` renderers in column definitions
- `TanstackDataTable` component API unchanged
- `createSelectColumn()`, `createExpandColumn()`, `createActionsColumn()` unchanged

---

## 7. Definition of Done per Phase

### Phase 1 — Shared Components
- All 6 components created in `apps/finance/src/components/shared/`
- Each component uses V2 design tokens exclusively
- TypeScript interfaces exported
- Build passes with no type errors

### Phase 2 — Invoices Page
- Page header with amber icon square renders correctly
- 4 KPI tiles with `useCountUp` animation
- FinanceStatusChip replaces StatusBadge
- Filter chips replace `<select>` dropdown
- Export CSV button in filter strip
- BS dates shown as second line in Due Date column
- No regressions: row selection, bulk issue, cancel, generate all work
- Build passes

### Phase 3 — Student Accounts Page
- Page header with teal icon square
- 4 KPI tiles with count-up
- FinanceStatusChip in expanded tabs
- DiceBear avatars unchanged
- Row expansion works identically
- Build passes

### Phase 4 — Payments Page
- Page header with teal icon square
- 4 KPI tiles with count-up
- FinanceStatusChip replaces StatusBadge
- Filter chips for status/gateway
- Export CSV in filter strip
- `formatGatewayLabel()` used for gateway display
- `formatDateDual()` for payment dates
- Void/refund dialogs unchanged
- Build passes

### Phase 5 — Fee Structures Page
- Page header with purple icon square
- Info banner about auto-apply
- 4 KPI tiles with purple accent
- Filter chips: All/Active/Inactive
- **Grade levels column shows clean chips (no icons)**
- FeeTypeChip renders with correct colors
- Name column shows active dot + auto-apply indicator
- Delete dialog unchanged
- FeeStructureForm modal unchanged
- Build passes

### Phase 6 — Polish
- Skeleton loaders on all 4 pages
- SectionErrorBoundary on KPI groups
- Empty state with "Clear filters" button
- Responsive at ≤1024px and ≤768px
- Light theme works on all 4 pages
- Visual cohesion with Finance Overview
- `prefers-reduced-motion` disables animations
- Build passes
