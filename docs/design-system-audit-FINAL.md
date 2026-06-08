# EdForge Design System Audit — FINAL

**Date:** 2026-06-08  
**Scope:** `edforge-saas-frontend` presentation layer only (`apps/`, `packages/ui/`, `packages/theme/`)  
**Benchmark:** Google for Education operator quality, with Apple HIG restraint and motion discipline  
**Supersedes:** `design-system-audit-2026-06-07.md`

## 0. Executive summary

The starting audit was directionally right: EdForge has a viable shared-token foundation, but the UI bypasses that foundation at page/component consumption points. The current repo contains **more presentation debt than the starting audit reported**:

| Area | Starting audit | Re-audit result | What changed |
|---|---:|---:|---|
| `bg/text-white|black` in `apps/` | 278 | **306 apps-only**, **327 apps + packages/ui** | Starting count is stale/undercounted. |
| `bg/text-gray|slate-*` | 218 | **400** | Starting count excluded current pages/components. |
| Requested arbitrary Tailwind size/spacing regex | 906 | **994** | The false-negative noted by the brief is confirmed; current count is higher. |
| Inline `style={{ ... }}` color/presentation styles | “0 inline style colors” | **2,146** style blocks; **1,913** targeted presentation blocks | The starting audit contradicted itself; current tree has extensive inline presentation styles. |
| Focus-ring coverage | ~26 missing | Required primitives still incomplete | `Button`/`Dropdown` hardcode teal; `FilterTabs`, `Accordion`, `AttendanceHeatmap`, Table/DataTable rows lack semantic focus coverage. |
| WCAG token failures | 2 key failures | Key failures confirmed, plus contextual misuse pairs | Border tokens and white-on-accent action colors are the primary fixes. |

Conclusion: this is not an architecture rewrite. It is a **discipline and governance project**: Stream 0 test/manifest infrastructure first, then one People pilot through primitives/tokens/page sweep, then fan-out.

## 1. Commands and corrected counts

All commands were run from the frontend repo root.

### 1.1 Hardcoded white/black utilities

Command:

```bash
rg -n -o --no-heading '\b(bg|text)-(white|black)(?:/[0-9]+)?\b' apps packages/ui | wc -l
```

Result: **327** total.

Scope split:

```bash
rg -n -o --no-heading '\b(bg|text)-(white|black)(?:/[0-9]+)?\b' apps | wc -l
# 306
rg -n -o --no-heading '\b(bg|text)-(white|black)(?:/[0-9]+)?\b' packages/ui | wc -l
# 21
```

Top offenders:

| Count | File |
|---:|---|
| 23 | `apps/shell/src/pages/settings/tabs/AcademicSetupTab.tsx` |
| 13 | `apps/academics/src/routes/classrooms/$sectionId.tsx` |
| 11 | `apps/shell/src/components/modals/AssignUserModal.tsx` |
| 9 | `apps/shell/src/pages/settings/school-academic-years.tsx` |
| 8 | `apps/academics/src/lib/classroom-colors.ts` |
| 6 | `apps/academics/src/components/students/iemis/IemisImport.tsx` |
| 6 | `apps/academics/src/components/attendance/AttendanceRow.tsx` |
| 5 | `apps/shell/src/pages/settings/tabs/StructureTab.tsx` |
| 5 | `apps/shell/src/pages/settings/tabs/ConfigurationTab.tsx` |
| 5 | `apps/shell/src/pages/settings/school-bell-schedule.tsx` |
| 5 | `apps/shell/src/components/payments/PaymentForm.tsx` |
| 5 | `apps/messages/src/routes/index.tsx` |
| 4 | `packages/ui/src/components/Skeleton.tsx` |
| 4 | `apps/shell/src/components/meetings/ConnectionWizard.tsx` |
| 4 | `apps/finance/src/routes/billing/payments/index.tsx` |
| 4 | `apps/finance/src/routes/billing/invoices/index.tsx` |
| 4 | `apps/academics/src/components/overview/ActivityFeedWidget.tsx` |
| 4 | `apps/academics/src/components/grades/FinalizationWizard.tsx` |
| 3 | `packages/ui/src/components/LanguageSwitcher.tsx` |
| 3 | `packages/ui/src/components/data-table/DataTable.tsx` |

Representative hits:

- `packages/ui/src/components/data-table/DataTablePagination.tsx:117` — `bg-teal-600 text-white`
- `packages/ui/src/components/data-table/DataTableEmpty.tsx:34` — `bg-teal-500 text-white ... focus:ring-teal-500/20`
- `packages/ui/src/components/Tooltip.tsx:126` — `bg-slate-900 text-white`
- `packages/ui/src/components/Skeleton.tsx:94` — `bg-white dark:bg-slate-900`
- `packages/ui/src/components/Modal.tsx:144` — `bg-black/50`
- `packages/ui/src/components/Button.tsx:12` — `bg-teal-600 text-white`

### 1.2 Requested hardcoded color categories

Command:

```bash
for token in 'bg-white' 'text-white' 'bg-black' 'text-black' \
  'bg-gray-[0-9]{2,3}' 'text-gray-[0-9]{2,3}' \
  'bg-slate-[0-9]{2,3}' 'text-slate-[0-9]{2,3}' \
  'text-indigo-[0-9]{2,3}' 'text-emerald-[0-9]{2,3}' \
  'bg-indigo-[0-9]{2,3}' 'bg-emerald-[0-9]{2,3}'; do
  rg -n -o --no-heading "\\b${token}(?:/[0-9]+)?\\b" apps packages/ui | wc -l
done
```

| Pattern | Count |
|---|---:|
| `bg-white` | 38 |
| `text-white` | 228 |
| `bg-black` | 61 |
| `text-black` | 0 |
| `bg-gray-*` | 80 |
| `text-gray-*` | 121 |
| `bg-slate-*` | 100 |
| `text-slate-*` | 99 |
| `text-indigo-*` | 72 |
| `text-emerald-*` | 295 |
| `bg-indigo-*` | 48 |
| `bg-emerald-*` | 176 |

Gray/slate `bg|text` total:

```bash
rg -n -o --no-heading '\b(bg|text)-(gray|slate)-[0-9]{2,3}(?:/[0-9]+)?\b' apps packages/ui | wc -l
# 400
```

Top gray/slate offenders:

| Count | File |
|---:|---|
| 31 | `apps/shell/src/components/modals/AssignUserModal.tsx` |
| 29 | `apps/academics/src/routes/grades/report-card.tsx` |
| 27 | `apps/analytics/src/components/TimeSeriesChart.tsx` |
| 16 | `apps/shell/src/components/payments/InvoiceStatusBadge.tsx` |
| 16 | `apps/finance/src/components/StatusBadge.tsx` |
| 12 | `apps/analytics/src/components/AdoptionReportCard.tsx` |
| 12 | `apps/academics/src/components/teachers/TeacherTable.tsx` |
| 10 | `packages/ui/src/components/Skeleton.tsx` |
| 10 | `apps/people/src/components/staff/LeaveManagement.tsx` |
| 10 | `apps/academics/src/components/students/profile/OverviewTab.tsx` |

Broad semantic-bypass sweep:

```bash
rg -n -o --no-heading '\b(bg|text|border|ring|from|to|via|hover:bg|hover:text|dark:bg|dark:text|dark:border|focus:ring)-(white|black|gray|slate|zinc|neutral|stone|indigo|emerald|red|green|blue|yellow|orange|purple|pink|rose|teal|cyan)-[0-9]{2,3}(?:/[0-9]+)?\b|\b(bg|text|border|ring|hover:bg|hover:text|dark:bg|dark:text)-(white|black)(?:/[0-9]+)?\b' apps packages/ui | wc -l
# 4995
```

This broader number is not the cleanup target by itself; it identifies the manifest surface for Stream 0 lint warnings.

### 1.3 Arbitrary Tailwind values

Command:

```bash
rg -n -o --no-heading '\b(p|m|px|py|mx|my|gap|w|h|text|leading|top|left|right|bottom)-\[[0-9]+(px|rem|em)\]' apps packages/ui | wc -l
```

Result: **994**.

Scope split:

```bash
rg -n -o --no-heading '\b(p|m|px|py|mx|my|gap|w|h|text|leading|top|left|right|bottom)-\[[0-9]+(px|rem|em)\]' apps | wc -l
# 947
rg -n -o --no-heading '\b(p|m|px|py|mx|my|gap|w|h|text|leading|top|left|right|bottom)-\[[0-9]+(px|rem|em)\]' packages/ui | wc -l
# 47
```

Top offenders:

| Count | File |
|---:|---|
| 151 | `apps/shell/src/pages/settings/tabs/AcademicSetupTab.tsx` |
| 36 | `apps/shell/src/components/home/AttendanceBySectionCard.tsx` |
| 33 | `apps/academics/src/components/students/StudentQuickProfile.tsx` |
| 26 | `apps/shell/src/pages/settings/tabs/ConfigurationTab.tsx` |
| 26 | `apps/shell/src/pages/settings/school-bell-schedule.tsx` |
| 26 | `apps/academics/src/components/overview-v2/AcademicsHealthCard.tsx` |
| 23 | `apps/finance/src/components/overview-v2/BillingHealthCard.tsx` |
| 20 | `apps/academics/src/components/reports/GovernmentReportsExport.tsx` |
| 19 | `apps/people/src/routes/staff/detail.tsx` |
| 15 | `apps/shell/src/components/calendar/BlocksPanel.tsx` |
| 15 | `apps/finance/src/components/overview-v2/CollectionPerformanceCard.tsx` |
| 14 | `apps/shell/src/components/home/GettingStartedGuide.tsx` |
| 14 | `apps/finance/src/components/overview-v2/InvoiceStatusCard.tsx` |
| 13 | `apps/shell/src/pages/settings/school-detail.tsx` |
| 12 | `apps/shell/src/components/layout/SchoolSwitcher.tsx` |
| 12 | `apps/academics/src/routes/students/index.tsx` |
| 12 | `apps/academics/src/components/overview-v2/AtRiskStudentsCard.tsx` |
| 11 | `packages/ui/src/components/WeekTimetable.tsx` |
| 11 | `apps/academics/src/routes/enrollment/index.tsx` |
| 10 | `apps/shell/src/components/layout/Header.tsx` |

Representative hits:

- `packages/ui/src/components/FilterTabs.tsx:40` — `text-[12px]`
- `packages/ui/src/components/FilterTabs.tsx:49` — `text-[10px]`
- `packages/ui/src/components/WeekTimetable.tsx:171` — `text-[9px]`
- `apps/special-programs/src/components/ModuleOverviewPage.tsx:174` — `w-[180px] h-[140px]`

### 1.4 Inline styles

Commands:

```bash
rg -n -o --no-heading 'style=\{\{' apps packages/ui | wc -l
# 2146

rg -l 'style=\{\{' apps packages/ui | wc -l
# 206
```

Parser result for `style={{ ... }}` blocks containing color/background/padding/margin/gap/fontSize/boxShadow:

```bash
node --input-type=module <<'NODE'
// Parsed each style block and tested presentation props.
NODE
# total style blocks 2146
# targeted presentation style blocks 1913
```

Top targeted inline-style files:

| Count | File |
|---:|---|
| 91 | `apps/academics/src/routes/grades/overview.tsx` |
| 86 | `apps/academics/src/routes/attendance/dashboard.tsx` |
| 77 | `apps/academics/src/components/students/CSVImport.tsx` |
| 77 | `apps/people/src/routes/overview.tsx` |
| 51 | `apps/academics/src/components/reports/GovernmentReportsExport.tsx` |
| 38 | `apps/shell/src/components/layout/ForgotPasswordPage.tsx` |
| 38 | `apps/people/src/routes/hr/index.tsx` |
| 37 | `apps/finance/src/components/overview-v2/BillingHealthCard.tsx` |
| 37 | `apps/academics/src/components/overview-v2/AcademicsHealthCard.tsx` |
| 34 | `apps/academics/src/routes/students/index.tsx` |
| 34 | `apps/academics/src/components/students/registration/RegistrationWizard.tsx` |
| 33 | `apps/shell/src/components/home/AttendanceBySectionCard.tsx` |
| 33 | `apps/shell/src/components/landing-v2/preview/TokenGallery.tsx` |
| 32 | `apps/shell/src/components/layout/LoginPage.tsx` |
| 32 | `apps/people/src/routes/staff.tsx` |
| 28 | `apps/finance/src/components/overview-v2/CollectionPerformanceCard.tsx` |
| 27 | `apps/academics/src/routes/classrooms/index.tsx` |
| 27 | `apps/shell/src/components/landing/Navbar.tsx` |
| 27 | `apps/people/src/components/staff/CreateUserModal.tsx` |
| 25 | `apps/academics/src/components/students/StudentQuickProfile.tsx` |

Resolved contradiction: **the claim of zero inline style colors is false**. Examples:

- `packages/ui/src/components/FilterTabs.tsx:41` — active tab `background` and `color`
- `packages/ui/src/components/V2AlertItem.tsx:68` — `padding`, `background`, `borderColor`
- `packages/ui/src/components/WeekTimetable.tsx:123` — dynamic `background`
- `apps/people/src/components/staff/StaffTable.tsx:79` onwards — inline flex gaps, font sizes, colors, badge backgrounds

## 2. WCAG contrast baseline

Tooling:

```bash
npm install --prefix "/tmp/wcag-contrast-check" wcag-contrast
node --input-type=module <script parsing packages/theme/src/base.css>
```

The script computes semantic token pairs in both themes. Some exhaustive failures are expected misuse pairs, such as `text-inverted` on normal surfaces. The actionable failures are below.

| Pair | Light | Dark | Required | Verdict |
|---|---:|---:|---:|---|
| `border-primary` on `surface-primary` | 1.35 | 2.05 | 3.0 UI | Fail |
| `border-secondary` on `surface-primary` | 1.09 | 1.56 | 3.0 UI | Fail |
| `border-tertiary` on `surface-primary` | 1.64 | missing dark override | 3.0 UI | Fail / missing |
| `text-tertiary` on `surface-tertiary` | 4.36 light | pass dark | 4.5 text | Fail light contextual pair |
| white text on `brand-secondary` | 3.73 light | 1.72 dark | 4.5 text | Fail |
| white text on `brand-primary` | pass light | 3.73 dark | 4.5 text | Fail dark |
| white text on `brand-accent` | 2.25 | 2.25 | 4.5 text | Fail |
| `interactive-focus` on `surface-elevated` | pass light | 2.50 dark | 3.0 UI | Fail dark |

Stream 0 should codify the supported contrast matrix. Stream 2 should fix the token values or the foreground-token contract, not rely on page-by-page exceptions.

## 3. Focus-ring coverage

Commands:

```bash
rg -l 'focus-visible|focus:ring|focus:outline|focus:' packages/ui/src/components --glob '*.{tsx,ts}' | wc -l
# 14

rg -l 'onClick|<button|<a\b|role="button"|role="tab"|tabIndex=\{0\}|MenuButton' packages/ui/src/components --glob '*.{tsx,ts}' | wc -l
# 26
```

Required primitive assessment:

| Primitive | Current evidence | Status |
|---|---|---|
| `Button` | `packages/ui/src/components/Button.tsx:7` uses `focus-visible:ring-teal-500` | Has focus, but hardcoded color |
| `Tag` | `HTMLAttributes<HTMLSpanElement>` allows interactive use; no focus semantics | Missing for clickable usage |
| Card-as-link | `Card` accepts `HTMLAttributes<HTMLDivElement>`; no conditional focus styles for `onClick`/link usage | Missing |
| `TableRow` | `packages/ui/src/components/Table.tsx:52-65` hardcodes slate hover/selected, no focus-visible | Missing |
| `DataTable` row | `packages/ui/src/components/data-table/DataTable.tsx:300-304` adds click cursor/onClick, no focus-visible row state | Missing |
| `FilterTabs` | `packages/ui/src/components/FilterTabs.tsx:35-55` button tabs with inline style, no focus-visible | Missing |
| `Accordion` | `packages/ui/src/components/Accordion.tsx:142-173` button trigger via inline styles, no focus-visible | Missing |
| `Dropdown` | `packages/ui/src/components/Dropdown.tsx:37-41` uses `focus:ring-teal-500/30` | Has focus, hardcoded color |
| `AttendanceHeatmap` nav | `packages/ui/src/components/AttendanceHeatmap.tsx:108-131` nav buttons no focus-visible | Missing |
| `AttendanceHeatmap` grid cells | `tabIndex={0}` grid cells no focus-visible | Missing |

## 4. Blast-radius tables

### 4.1 Tailwind v4 alias strategy PoC

Temporary isolated PoC:

```bash
mkdir -p "/tmp/edforge-tailwind-alias-poc"
npm install --prefix "/tmp/edforge-tailwind-alias-poc" tailwindcss @tailwindcss/cli
printf '@import "tailwindcss"; @theme { --color-background-primary: rgb(251 249 245); --color-surface-primary: var(--color-background-primary); }' > "/tmp/edforge-tailwind-alias-poc/input.css"
printf '<div class="bg-surface-primary text-[13px]"></div>' > "/tmp/edforge-tailwind-alias-poc/content.html"
"/tmp/edforge-tailwind-alias-poc/node_modules/.bin/tailwindcss" -i "/tmp/edforge-tailwind-alias-poc/input.css" -o "/tmp/edforge-tailwind-alias-poc/output.css" --content "/tmp/edforge-tailwind-alias-poc/content.html"
rg -n --no-heading 'bg-surface-primary|--color-surface-primary|var\(--color-surface-primary\)' "/tmp/edforge-tailwind-alias-poc/output.css"
```

Result:

```css
--color-surface-primary: var(--color-background-primary);
.bg-surface-primary { background-color: var(--color-surface-primary); }
```

Conclusion: Tailwind v4 `@theme` can emit utilities backed by CSS-var aliases. However, **repo-scoped rebuild remains Stream 0 work** before any edit to `packages/theme/src/base.css`.

### 4.2 `StaffTable` callers

Command:

```bash
rg StaffTable apps packages --glob '*.{ts,tsx}'
```

| File | Role | Risk |
|---|---|---|
| `apps/people/src/components/staff/StaffTable.tsx` | Definition | High visual density; extensive inline styling in cells/actions |
| `apps/people/src/components/staff/index.ts:9` | Re-export | Low |
| `apps/people/src/routes/staff.tsx:36` | Import | Medium |
| `apps/people/src/routes/staff.tsx:599` | Only rendered caller found | High workflow importance; People pilot smoke required |

Observation: the table already consumes `TanstackDataTable`, so the risky work is not a ground-up table rewrite. The first PR should normalize cell/action presentation and focus states while preserving columns, row click behavior, and actions.

### 4.3 FullCalendar and third-party styles

Commands:

```bash
rg -n 'fullcalendar|flatpickr' apps --glob '**/*.{ts,tsx,css,scss}'
```

| Touchpoint | Evidence | Risk |
|---|---|---|
| `apps/shell/src/components/calendar/SchoolFullCalendar.tsx:14-17` | FullCalendar package imports | Runtime component |
| `apps/shell/src/components/calendar/SchoolFullCalendar.tsx:32` | Imports `../../styles/fullcalendar-theme.css` | CSS collision entry |
| `apps/shell/src/styles/fullcalendar-theme.css` | Extensive variable overrides, hardcoded event colors, print overrides, required `!important` comments | High specificity risk |
| `apps/shell/src/components/calendar/event-types.ts:15-20` | Documents manual sync with CSS | Taxonomy drift risk |
| `apps/shell/src/components/calendar/fullcalendar-utils.ts:6` | Color definitions delegated to CSS | Medium |
| `apps/shell/src/hooks/useFullCalendarEvents.ts:16-17` | Event assembly | Medium |
| `apps/shell/src/pages/settings/tabs/AcademicSetupTab.tsx:1614` | Duplicate primary-event logic comment | Refactor risk |
| flatpickr | No files found | None currently |

Headless UI touchpoints:

- `packages/ui/src/components/Modal.tsx`
- `packages/ui/src/components/Drawer.tsx`
- `packages/ui/src/components/Dropdown.tsx`
- `packages/ui/src/components/LanguageSwitcher.tsx`
- `packages/ui/src/components/data-table/DataTableViewOptions.tsx`
- `packages/ui/src/components/data-table/DataTableRowActions.tsx`
- `packages/ui/src/components/data-table/DataTableFacetedFilter.tsx`
- app-local modal/dropdown/drawer components in shell, people, messages, academics

FullCalendar should be isolated to its own PR because it intentionally uses specificity and `!important` to override third-party inline/default styles.

### 4.4 Component duplication and promotion candidates

| Pattern | Evidence | Promotion target |
|---|---|---|
| Page headers | `FinancePageHeader`, `SettingsPageHeader`, `PageHeaderWithMenu`, many `h1 text-2xl font-bold` blocks | `packages/ui` `PageHeader` + `Heading` |
| Section cards | `ConfigurationTab` local `SectionCard`, `StaffDrawer`, `StudentDrawer`, `GradeLevelDrawer` | `packages/ui` `SectionCard` |
| Module overview pages | Local copies in `people`, `messages`, `analytics`, `special-programs`, `shell` | Shared overview/page layout primitive after People pilot |
| Filter tabs | `packages/ui` has `FilterTabs`; finance accounts has inline `TabButton` | Tokenized shared `FilterTabs` |
| Layout rhythm | Repeated `p-6 space-y-6`, `rounded-2xl border`, arbitrary spacing | `Container`, `Stack`, `Inline` |
| Typography | Repeated `text-2xl font-bold`, `text-[10px]`, `text-[11px]` | `Heading`, `Text`, caption scale |

## 5. Visual reference gallery

Reference notes are stored in `docs/design-system/references/reference-gallery.md`. Authenticated Google Admin/Classroom screenshots were not available in this environment, so the gallery uses public official documentation, public product/marketing references, and clearly marked proxy references. Stream 0 visual-regression work should capture EdForge’s own before/after screenshots; it should not depend on authenticated third-party screenshots.

Design-language synthesis:

- **Google Admin / ChromeOS Admin:** low-chrome operator density, thin dividers, filter-first tables, restrained blue/teal action color, flat cards, low-shadow hierarchy.
- **Google Classroom:** approachable cards and rosters, top-level tabs, status color used for meaning only, gradebook cells use color as a secondary signal rather than decoration.
- **Google Forms:** clear sectioning, strong input focus states, inline validation/error copy, minimal motion.
- **edu.google marketing:** generous white space, Google Sans-like rhythm, rounded product frames, soft backgrounds.
- **Apple HIG / School Manager / Classroom:** semantic color, adaptive materials, restrained controls, purposeful motion with reduced-motion support, dense lists balanced by clear selected states.

## 6. What changes versus the starting audit

1. Counts are corrected and higher in every major category.
2. Inline styles are elevated to a primary remediation stream, not a footnote.
3. Stream 0 is mandatory before token changes: visual regression, contrast baseline, focus baseline, ESLint manifests, and repo-scoped alias proof.
4. People becomes the full end-to-end pilot before academics/finance/shell fan-out.
5. `StaffTable` is scoped as a People-pilot table presentation cleanup with one caller, not a broad table rewrite.
6. FullCalendar is isolated as a third-party styling risk.
7. Token work is gated behind explicit review before touching `packages/theme/src/base.css`.

## 7. Recommended next document

Use `docs/design-system-sprint-plan-FINAL.md` as the executable stream plan. It converts the starting week-based sprint plan into independently shippable vertical slices with PR-size limits and stop-the-line gates.
