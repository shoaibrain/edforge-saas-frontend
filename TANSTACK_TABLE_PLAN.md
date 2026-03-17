# EdForge TanStack Table Implementation Plan

## Enterprise-Grade Data Table & Grid System

---

## 1. Executive Summary

EdForge currently uses a mix of custom inline HTML tables and a basic `DataTable` component with client-side sorting and "Load More" pagination. As data grows, tables become unboundedly long, offering no proper pagination, no server-side sorting, and no advanced features like column visibility, row selection, or virtual scrolling.

This plan introduces a **TanStack Table-powered data table system** in `@edforge/ui` that is:
- **Reusable** across all MFE modules (Academics, Finance, People, etc.)
- **Scalable** with proper pagination, sorting, and filtering
- **Feature-rich** with column visibility, row selection, expansion, and bulk actions
- **Performant** with virtual scrolling for large datasets
- **Accessible** with ARIA attributes and keyboard navigation
- **Internationalized** with externalized UI strings via `@edforge/i18n`
- **Beautiful** with the existing EdForge design system (dark theme, teal accents, CSS variables)

---

## 2. Current State Analysis

### 2.1 Existing Table Components

| Component | Location | Pattern | Issues |
|-----------|----------|---------|--------|
| `DataTable<T>` | `@edforge/ui` | Client-side sort, "Load More" | No pagination UI, no column controls, no row selection |
| `Table` primitives | `@edforge/ui` | Raw HTML wrappers | Low-level, no features |
| Invoices table | `apps/finance` | Inline HTML `<table>` | 40+ rows render at once, no pagination, custom checkbox logic |
| Payments table | `apps/finance` | Inline HTML `<table>` | Same unbounded growth, custom filter UI |
| Student Accounts | `apps/finance` | Inline HTML `<table>` | Expandable rows done manually |
| Fee Structures | `apps/finance` | Inline HTML `<table>` | Small dataset, basic CRUD |
| `StudentTable` | `apps/academics` | Wraps `DataTable` | Load More only, 20 items per page |
| `StaffTable` | `apps/people` | Wraps `DataTable` | Load More only |
| `CourseTable` | `apps/academics` | Wraps `DataTable` | Client-side only |
| `SectionTable` | `apps/academics` | Wraps `DataTable` | Client-side only, custom capacity bars |
| `TeacherTable` | `apps/academics` | Inline HTML `<table>` | Own search/filter, no pagination |
| `EnrollmentTable` | `apps/academics` | Inline HTML `<table>` | Own search/filter, no pagination |
| `GradebookGrid` | `apps/academics` | Custom spreadsheet | Inline editing — stays as-is |

### 2.2 Existing Infrastructure

- **`@tanstack/react-table` v8.20.0** — installed in apps (academics, finance, people, messages), shared as singleton via Module Federation. **NOT** in `@edforge/ui` package.json — must be added as `peerDependency`.
- **`@tanstack/react-query` v5.60.0** — used everywhere for data fetching
- **`@tanstack/react-virtual`** — NOT installed yet (needed for virtual scrolling)
- **Cursor-based pagination** — backend (DynamoDB) returns `{ items, hasMore, lastEvaluatedKey, total? }`
- **Backend supports**: limit, cursor, status filters, search filters via query params
- **Backend does NOT support**: sort parameters (sorting is client-side only)
- **`total` count is OPTIONAL** — DynamoDB does not consistently return total count. `FinancePaginatedResponse<T>` has NO `total` field. Academic DTOs have `total?: number`.

### 2.3 Data Fetching Pattern Differences

| Module | Hook Pattern | Pagination |
|--------|-------------|------------|
| Academics (`useStudents`, `useCourses`, `useSections`) | `useInfiniteQuery` with cursor | Proper cursor-based infinite |
| Finance (`useInvoices`, `useSchoolPayments`, `useStudentAccounts`) | `useQuery` (plain) | Fetches ALL data at once |
| People (`usePaginatedQuery`) | `useInfiniteQuery` wrapper | Cursor-based infinite |

**Critical insight**: Finance hooks use `useQuery` not `useInfiniteQuery`, meaning they currently fetch all items in one API call. Migration to server-side pagination requires either refactoring these hooks or using client-side pagination mode.

### 2.4 Key Problems

1. **Unbounded table growth** — Invoices page renders ALL invoices at once (~50+ rows)
2. **No proper pagination** — Only "Load More" appends rows, making the page longer
3. **Client-side sorting only** — Doesn't scale; only sorts loaded data, not full dataset
4. **Duplicated table logic** — Each module re-implements search, filter, sort, selection
5. **No column management** — Users can't hide/show/reorder columns
6. **No virtual scrolling** — DOM renders every row regardless of viewport
7. **Inconsistent UX** — Finance uses inline tables; Academics uses DataTable wrapper
8. **No error state** — Tables have no way to show network errors or partial failures
9. **No URL state** — Filters, sort, and page are not in URL params (not shareable/bookmarkable)

---

## 3. Target Architecture

### 3.1 Package Structure

```
packages/ui/src/components/data-table/
├── index.ts                        # Barrel exports (including re-export of createColumnHelper)
├── types.ts                        # Core type definitions
├── DataTable.tsx                    # Main composable table component
├── DataTableToolbar.tsx             # Search + filter bar + column visibility + export slot
├── DataTablePagination.tsx          # Page navigation (graceful without total) + page size selector
├── DataTableColumnHeader.tsx        # Sortable column header with indicators
├── DataTableRowActions.tsx          # Row-level action dropdown
├── DataTableFacetedFilter.tsx       # Faceted filter dropdown (e.g., status) with ARIA
├── DataTableViewOptions.tsx         # Column visibility toggle panel
├── DataTableSkeleton.tsx            # Loading skeleton state (initial load)
├── DataTableEmpty.tsx               # Empty state with CTA
├── DataTableError.tsx               # Error state with retry button
├── DataTableBulkActions.tsx         # Bulk action bar (appears on selection)
├── DataTableExpandableRow.tsx       # Expandable row sub-content
├── DataTableLoadingOverlay.tsx      # Subtle overlay for page transitions (isFetching)
├── column-helpers.ts               # Pre-built column factories
└── hooks/
    ├── useDataTable.ts             # Core hook wrapping useReactTable
    ├── useServerPagination.ts      # useInfiniteQuery + slice-based page navigation
    └── useColumnConfig.ts          # Column visibility persistence (localStorage)
```

### 3.2 Component API Design

```tsx
// USAGE EXAMPLE: Invoices Page (after migration)
import {
  DataTable,
  createSelectColumn,
  createActionsColumn,
  createStatusColumn,
  createCurrencyColumn,
} from '@edforge/ui/data-table'
import { createColumnHelper } from '@tanstack/react-table'

const columnHelper = createColumnHelper<Invoice>()

const columns = [
  createSelectColumn<Invoice>(),
  columnHelper.accessor('invoiceNumber', {
    header: 'Invoice #',
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
    enableSorting: true,
  }),
  columnHelper.accessor('studentName', {
    header: 'Student',
    enableSorting: true,
  }),
  createCurrencyColumn<Invoice>('grandTotal', { header: 'Amount' }),
  createStatusColumn<Invoice>('status', { header: 'Status' }),
  createActionsColumn<Invoice>({
    actions: (invoice) => [
      { label: 'View', icon: Eye, onClick: () => navigate(`/invoices/${invoice.id}`) },
      { label: 'Issue', icon: Check, onClick: () => handleIssue(invoice.id),
        hidden: invoice.status !== 'draft' },
      { label: 'Cancel', icon: X, onClick: () => openCancelDialog(invoice.id),
        variant: 'danger', hidden: invoice.status === 'cancelled' },
    ],
  }),
]

function InvoicesPage() {
  const { data, isLoading, error } = useInvoices(schoolId, filters)

  return (
    <DataTable
      columns={columns}
      data={data?.items ?? []}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      // Pagination
      pagination={{ pageSize: 20 }}
      // Features
      enableSorting
      enableColumnVisibility
      enableRowSelection
      isRowSelectable={(row) => row.original.status === 'draft'}
      // Sorting control (ready for server-side)
      onSortingChange={handleSortingChange}
      // Callbacks
      onRowClick={(row) => navigate({ to: `/invoices/${row.id}` })}
      // Toolbar
      searchPlaceholder="Search by invoice # or student..."
      facetedFilters={[
        { columnId: 'status', title: 'Status', options: STATUS_OPTIONS },
      ]}
      toolbarExtra={<ExportButton onClick={handleExport} />}
      // Empty state
      emptyState={{
        icon: <FileText />,
        title: 'No invoices found',
        action: { label: 'Generate Invoice', onClick: openGenerateModal },
      }}
      // Bulk actions
      bulkActions={[
        { label: 'Issue Selected', onClick: handleBulkIssue, variant: 'primary' },
      ]}
    />
  )
}
```

### 3.3 Core Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Pagination model** | Client-side pagination over loaded data. Two modes: `pages` (numbered) and `loadMore`. | Finance hooks use `useQuery` (all data). Academics use `useInfiniteQuery`. Support both. When `total` is unknown, degrade to prev/next navigation. |
| **Sorting** | Client-side initially, server-side ready via `onSortingChange` | Backend doesn't support sort params. Client-side is fine for <500 rows. Controlled `onSortingChange` prop enables server-side upgrade with zero component changes. |
| **State management** | TanStack Table internal state + controlled props | Sorting/pagination/visibility state lives in TanStack Table. Optionally sync with URL via TanStack Router. |
| **Column definitions** | TanStack `createColumnHelper` (re-exported from our barrel) | Type-safe, composable, standard API. |
| **Row identity** | `getRowId` prop (replaces old `keyExtractor`) | TanStack Table native. Default fallback to `row.id` field. |
| **Styling** | Tailwind CSS with EdForge CSS variables | Consistent with existing design system. No new dependencies. |
| **Accessibility** | ARIA roles, keyboard nav, focus management | `role="grid"`, `aria-sort`, `aria-selected`, keyboard row navigation. |
| **i18n** | Externalize all UI strings via optional `labels` prop | Existing codebase uses `@edforge/i18n`. Table strings must be translatable. |
| **Error handling** | `error` + `onRetry` props → `DataTableError` component | Tables must show errors gracefully, not blank screens. |

### 3.4 Pagination Strategy (Detailed)

Since `total` count is **NOT reliably available** from DynamoDB:

**Mode 1: Client-side Paginated (`paginationMode="pages"`, default)**
- All data loaded via `useQuery` (Finance pattern) or fully fetched via `useInfiniteQuery`
- TanStack Table's `getPaginationRowModel` handles client-side slicing
- Page numbers rendered from known data length: `Math.ceil(data.length / pageSize)`
- Show: `< 1 2 3 ... N >` with page size selector
- Show: "Showing 1-20 of 234 results"

**Mode 2: Load More (`paginationMode="loadMore"`)**
- Data fetched page-by-page via `useInfiniteQuery`
- "Load More" button at bottom; data appends
- Client-side pagination over accumulated data (e.g., after loading 60 items, show pages 1-3)
- Show: "Showing 1-20 • Load more available" when `hasMore=true`

**Mode 3: Virtual Scroll (`paginationMode="virtual"`)**
- Fixed-height scrollable container
- `@tanstack/react-virtual` renders only visible rows
- Auto-fetch next page on scroll near bottom (infinite scroll)
- No page navigation UI — just scroll

**Graceful degradation when `total` is unknown:**
- Pagination shows: `< Page 3 >` (no "of N")
- "Next" button disabled only when `hasMore=false`
- When all data is client-side (Mode 1), total IS known from `data.length`

### 3.5 Filter → Pagination Reset Behavior

When any filter or search value changes, pagination **automatically resets to page 1**. This is implemented in the `useDataTable` hook by watching filter state and calling `table.setPageIndex(0)` on change. This prevents the common bug where a user is on page 5, applies a filter that results in only 2 pages, and sees an empty table.

### 3.6 Loading States

| State | Trigger | Visual |
|-------|---------|--------|
| **Initial load** | `isLoading=true`, no data | Full skeleton (column headers + animated rows) |
| **Page transition** | `isFetching=true`, has stale data | Subtle opacity overlay (0.5) over current data + thin progress bar |
| **Load More fetching** | `isFetchingMore=true` | Spinner on Load More button (existing pattern) |
| **Error** | `error` prop set | Error message with retry button, optionally showing stale data |
| **Empty** | Data loaded, 0 results | Empty state with icon + CTA |

---

## 4. Sprint Plan

### Sprint 1: Core DataTable Foundation

**Goal**: Build the core TanStack Table component in `@edforge/ui` that can render data with column headers, rows, sorting, loading skeletons, error states, and empty states. This replaces the rendering layer of the existing `DataTable`.

**Demoable outcome**: A working DataTable component rendered on a test/demo page that displays static data with proper styling matching EdForge design system.

#### Tickets

**S1-T1: Set up test infrastructure for `@edforge/ui`**
- Add `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` to `packages/ui` devDependencies
- Create `vitest.config.ts` in `packages/ui`
- Create `src/test-utils.ts` with `renderTable` helper, `getRows`, `getHeaders` utilities
- Add `"test": "vitest run"` script to `packages/ui/package.json`
- **Validation**: `pnpm --filter @edforge/ui test` runs (no tests yet, but setup works)

**S1-T2: Install dependencies and create module structure**
- Add `@tanstack/react-table` as `peerDependency` in `packages/ui/package.json`
- Add `@tanstack/react-virtual` as `dependency` in `packages/ui/package.json`
- Add `@tanstack/react-virtual` to Module Federation shared config in `packages/config/src/mf-shared.ts`
- Create `packages/ui/src/components/data-table/` directory structure
- Create `types.ts` with core type definitions (`DataTableProps`, `ColumnMeta`, `FacetedFilterOption`, `BulkAction`, `EmptyState`, `PaginationMode`, `DataTableLabels`)
- Create `index.ts` barrel exports (re-export `createColumnHelper` from `@tanstack/react-table`)
- Update `packages/ui/src/index.ts` to export data-table module
- Verify `pnpm build` succeeds for all apps (Module Federation compatibility check)
- **Validation**: `pnpm typecheck` passes; exports are accessible from consuming apps; `pnpm build` succeeds

**S1-T3: Build core `DataTable` component**
- Create `DataTable.tsx` using `useReactTable` from `@tanstack/react-table`
- Support `columns` (TanStack ColumnDef format) and `data` props
- Support `getRowId` prop (replacing old `keyExtractor`; default fallback to `row.id`)
- Render `<table>` with `<thead>`, `<tbody>` using `flexRender`
- Apply EdForge styling: dark surfaces (`surface-primary`, `surface-secondary`, `surface-tertiary`), teal accents, CSS variable colors
- Support `onRowClick` callback
- Support `className` override
- Add `role="grid"` and basic ARIA attributes from the start
- Match existing DataTable visual output (border-radius, spacing, hover states)
- **Validation**: Component renders a table with correct styling; visual comparison with existing DataTable

**S1-T4: Build `DataTableColumnHeader` component**
- Create sortable column header with sort direction indicators (chevron up/down)
- Support `column.getCanSort()`, `column.getIsSorted()`, `column.toggleSorting()`
- Add `aria-sort="ascending|descending|none"` attribute
- Match existing sort indicator styling (teal-500 chevrons)
- Support `meta.align` for right-aligned headers (e.g., Amount columns)
- Support controlled `onSortingChange` prop on DataTable for external sort control (future server-side sorting)
- **Validation**: Clicking a sortable column header toggles sort direction with visual indicator; ARIA sort attribute updates

**S1-T5: Build `DataTableSkeleton` component**
- Create loading skeleton that renders column headers + animated placeholder rows
- Accept `columnCount` and `rowCount` props
- Match existing skeleton styling (`animate-pulse`, variable widths per column)
- Integrate into `DataTable` via `isLoading` prop
- **Validation**: `<DataTable isLoading columns={cols} data={[]} />` shows proper skeleton

**S1-T6: Build `DataTableEmpty` component**
- Create empty state with icon, title, description, and optional CTA button
- Match existing empty state styling from current DataTable
- Integrate into `DataTable` via `emptyState` prop
- **Validation**: `<DataTable data={[]} emptyState={...} />` shows proper empty state

**S1-T7: Build `DataTableError` component**
- Create error state with error message, retry button, and optional stale data display
- Integrate into `DataTable` via `error` and `onRetry` props
- When stale data exists + error: show data with warning banner above table
- When no data + error: show full error state with retry CTA
- **Validation**: `<DataTable error={new Error('Failed')} onRetry={...} />` shows error with retry

**S1-T8: Create `useDataTable` hook**
- Wrap `useReactTable` with EdForge defaults
- Configure default features: `getCoreRowModel`, `getSortedRowModel`
- Accept `onSortingChange` for controlled sorting
- Accept column visibility initial state
- Auto-reset `pageIndex` to 0 when filters change
- Accept `getRowId` and pass through to TanStack Table
- Return table instance + convenience helpers
- **Validation**: Hook creates a valid table instance; `pnpm typecheck` passes

**S1-T9: Write unit tests for core DataTable**
- Test: renders correct number of rows for given data
- Test: renders column headers from column definitions
- Test: shows skeleton when `isLoading=true`
- Test: shows empty state when `data=[]` and `emptyState` provided
- Test: shows error state when `error` prop is set
- Test: calls `onRowClick` when row is clicked
- Test: client-side sorting toggles correctly on header click
- Test: `getRowId` is used for row keys
- **Validation**: All tests pass with `pnpm --filter @edforge/ui test`

---

### Sprint 2: Pagination & Performance

**Goal**: Add proper pagination UI (page numbers, page size selector) and virtual scrolling support. This directly solves the core problem of unbounded table growth.

**Demoable outcome**: Tables show a fixed number of rows per page with navigation controls. Large datasets use virtual scrolling.

#### Tickets

**S2-T1: Build `DataTablePagination` component**
- Create pagination bar with: page info, prev/next buttons, page number buttons
- **When total IS known**: Show "Page 1 of 10", ellipsis buttons `1 2 3 ... 8 9 10`, "Showing 1-20 of 234 results"
- **When total is NOT known**: Show "Page 3" with prev/next only; next disabled when `hasMore=false`
- Page size selector dropdown (10, 20, 50, 100)
- Keyboard accessible (arrow keys navigate pages, Home/End for first/last)
- i18n: Accept `labels` prop for translatable strings ("Showing", "of", "results", "Page", "rows per page")
- EdForge styling: teal active page, surface-secondary background
- **Validation**: Both total-known and total-unknown modes render correctly; page size changes re-paginate

**S2-T2: Integrate client-side pagination into `DataTable`**
- Add `getPaginationRowModel` to `useDataTable`
- Wire `DataTablePagination` into `DataTable` footer
- Support `pagination={{ pageSize: 20 }}` prop
- Support `paginationMode="pages"` (default) and `paginationMode="loadMore"`
- Auto-calculate page count from data length
- **Validation**: DataTable with 100 items shows 5 pages of 20; navigation works

**S2-T3: Build `DataTableLoadingOverlay` component**
- Create subtle loading overlay for page transitions (not initial load)
- Thin teal progress bar at top of table
- Optional reduced opacity (0.6) over table body
- Integrate via `isFetching` prop on DataTable (distinct from `isLoading`)
- **Validation**: Setting `isFetching=true` while data exists shows overlay without replacing content

**S2-T4: Build `useServerPagination` hook**
- Wrap `useInfiniteQuery` (extending the existing `usePaginatedQuery` pattern from People module)
- Flatten all fetched pages into a single array: `allItems = pages.flatMap(p => p.items)`
- Compute page view as a slice: `visibleItems = allItems.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)`
- Determine `hasMore` from latest page's response
- Auto-fetch next page when user navigates to a page boundary that hasn't been fetched yet
- Prefetch adjacent page for instant navigation
- Handle page size changes by resetting to page 0 (cursors remain valid since we slice the flat array)
- Return: `{ data, pageIndex, setPageIndex, pageSize, setPageSize, pageCount, isLoading, isFetching, hasMore, totalLoaded, fetchNextPage }`
- **Validation**: Hook correctly layers page navigation over infinite query; forward/backward navigation works

**S2-T5: Build "Load More" pagination mode**
- Support `paginationMode="loadMore"` in DataTable
- Render "Load More" button at table footer when `hasMore=true`
- Wire with `useInfiniteQuery` pattern (existing apps use this)
- Client-side page navigation over accumulated data
- **Validation**: Backward compatible with existing Load More pattern; data appends on click

**S2-T6: Basic virtual scrolling (fixed-height rows)**
- Integrate `@tanstack/react-virtual` with `DataTable`
- Support `paginationMode="virtual"` with `maxHeight` prop
- Fixed container height with virtualized rows (only visible rows in DOM)
- Overscan of 5 rows for smooth scrolling
- **Validation**: 1000+ rows render with only ~30 DOM nodes in viewport; scrolling is smooth

**S2-T7: Virtual scroll infinite loading**
- When `paginationMode="virtual"` and `hasMore=true`: auto-fetch next page when scrolled within 200px of bottom
- Wire with `useInfiniteQuery` `fetchNextPage`
- Show loading indicator at scroll bottom during fetch
- **Validation**: Scrolling to bottom triggers fetch; new data appears seamlessly

**S2-T8: Write tests for pagination**
- Test: client-side pagination renders correct page slice
- Test: page size change re-paginates and resets to page 0
- Test: pagination component degrades when total is unknown (no page numbers, just prev/next)
- Test: Load More appends rows correctly
- Test: virtual scroll renders limited DOM nodes
- Test: `useServerPagination` calls `fetchNextPage` at boundary
- **Validation**: All tests pass

---

### Sprint 3: Filtering, Search & Column Controls

**Goal**: Add global search, faceted filters, column visibility controls, and a toolbar that composes them together.

**Demoable outcome**: Tables have a toolbar with search, filter dropdowns, and a column visibility menu. Filters visibly narrow results. Changing filters resets pagination to page 1.

#### Tickets

**S3-T1: Build `DataTableToolbar` component**
- Create toolbar container with search input + filter area + view options + extra slot
- Accept `searchPlaceholder`, `searchValue`, `onSearchChange`
- Debounced search (300ms) handled internally
- Show active filter count badge
- "Reset filters" button when filters are active
- `toolbarExtra` slot for custom elements (export button, etc.)
- Responsive: stacks vertically on mobile (<640px)
- EdForge styling: surface-secondary background, rounded-lg, border
- i18n: Translatable strings for "Reset", "filters active"
- **Validation**: Toolbar renders; search triggers with 300ms debounce; mobile layout stacks

**S3-T2: Build `DataTableFacetedFilter` component**
- Create dropdown filter for categorical columns (status, grade, role, gateway, etc.)
- Accept `columnId`, `title`, `options: { label, value, icon?, count? }[]`
- Support multi-select (checkboxes in dropdown)
- Show selected count badge on trigger button
- Search within filter options for long lists (>8 options)
- Wire with TanStack Table `column.setFilterValue`
- ARIA: `role="listbox"`, `aria-multiselectable="true"`, `aria-expanded` on trigger, `aria-checked` on each option
- **Validation**: Selecting filter options updates table; badge shows count; accessible via keyboard/screen reader

**S3-T3: Build `DataTableViewOptions` component**
- Create column visibility toggle panel (dropdown with toggle switches)
- List all hideable columns (skip fixed columns: select, actions, expand)
- Persist visibility state to localStorage via `useColumnConfig` hook
- "Reset to defaults" button
- **Validation**: Toggling a column hides/shows it; state persists across page refreshes

**S3-T4: Build `useColumnConfig` hook**
- Persist column visibility state to localStorage
- Key by table ID (e.g., `edforge-table-invoices-columns`)
- Support default visibility configuration from column definitions
- Reset to defaults function
- **Validation**: Column visibility survives page reload; different tables have independent configs

**S3-T5: Integrate toolbar into `DataTable`**
- Wire `DataTableToolbar` above table when any toolbar prop is provided
- Auto-wire search to TanStack Table global filter (`getFilteredRowModel`)
- Auto-wire faceted filters to column filters
- Auto-reset `pageIndex` to 0 when search or filter values change
- Support custom toolbar via `renderToolbar` prop for advanced override cases
- When filter changes with `isFetching`, show stale data with loading overlay (React Query `placeholderData`)
- **Validation**: Full toolbar → filter → pagination → data flow works end-to-end

**S3-T6: URL state synchronization (optional per table)**
- Create `useTableUrlState` hook that syncs table state (search, filters, sort, page) with URL search params via TanStack Router `useSearch`
- Support opt-in per table via `syncWithUrl={true}` prop
- URL params: `?search=john&status=draft&sort=amount.desc&page=2&pageSize=20`
- Browser back/forward navigates between filter states
- Shareable/bookmarkable table views
- **Validation**: Changing filters updates URL; navigating to URL with params restores table state

**S3-T7: Write tests for filtering and column controls**
- Test: search input filters rows (debounced, 300ms)
- Test: faceted filter narrows results by column value
- Test: column visibility toggle hides/shows column
- Test: column config persists to localStorage
- Test: reset filters clears all filters
- Test: filter change resets pagination to page 1
- **Validation**: All tests pass

---

### Sprint 4: Row Selection, Bulk Actions & Row Expansion

**Goal**: Add row selection with checkboxes, a bulk actions toolbar, and expandable rows for detail views.

**Demoable outcome**: Users can select rows with checkboxes, see a bulk action bar, and expand rows to see sub-content.

#### Tickets

**S4-T1: Add row selection support to `DataTable`**
- Enable `enableRowSelection` prop
- Auto-add checkbox column as first column when enabled (using `createSelectColumn` helper)
- Support "select all" checkbox in header (toggles all on current page)
- Wire with TanStack Table `getRowSelectionRowModel()`
- Support `enableMultiRowSelection` (default true) and single-select mode
- Support `isRowSelectable` predicate (e.g., only draft invoices are selectable)
- Visual: selected rows have tinted background (`bg-teal-500/5`)
- `aria-selected` on selected rows
- **Validation**: Clicking checkboxes selects rows; select-all works; `isRowSelectable` grays out non-matching rows

**S4-T2: Build `DataTableBulkActions` component**
- Create sticky action bar that slides up when rows are selected
- Show selected count: "3 of 42 selected"
- Accept `bulkActions: { label, onClick, icon?, variant?, disabled? }[]`
- "Deselect all" button
- Slide-up animation (CSS transition or Framer Motion if available)
- Callback receives array of selected row original data
- **Validation**: Selecting rows shows bulk bar with correct count; clicking action triggers callback with selected data

**S4-T3: Add row expansion support**
- Enable `enableExpanding` prop
- Auto-add expand trigger column (chevron icon) via `createExpandColumn` helper
- Support `renderSubComponent` prop for expanded content
- Expanded row renders below parent row spanning all columns
- Smooth expand/collapse animation
- Support `allowMultipleExpanded` (default false — only one expanded at a time)
- `aria-expanded` on expandable rows
- **Validation**: Clicking expand icon reveals sub-content; works with Student Accounts tabbed detail pattern

**S4-T4: Build `DataTableRowActions` component**
- Create reusable row action dropdown (three-dot menu)
- Accept `actions: { label, onClick, icon?, variant?, disabled?, hidden? }[]`
- Support dividers between action groups (via `divider: true` separator)
- Click handler receives `row.original` data
- Stop event propagation (don't trigger `onRowClick`)
- Positioned with portal to avoid overflow clipping
- **Validation**: Three-dot icon opens dropdown; clicking action triggers callback; dropdown closes

**S4-T5: Build column definition helpers**
- `createSelectColumn<T>()` — pre-configured checkbox column with select-all header
- `createActionsColumn<T>(config)` — pre-configured actions column with `DataTableRowActions`
- `createExpandColumn<T>()` — pre-configured expand trigger column
- `createDateColumn<T>(accessorKey, opts)` — date formatting with EdForge date utils
- `createCurrencyColumn<T>(accessorKey, opts)` — NPR formatting using `formatNPR`
- `createStatusColumn<T>(accessorKey, opts)` — status badge rendering
- `createAvatarColumn<T>(config)` — avatar + name + subtitle pattern (DiceBear or initials)
- **Validation**: Each helper produces a correct TanStack ColumnDef; renders correctly in DataTable

**S4-T6: Write tests for selection, bulk actions, expansion, and helpers**
- Test: row selection checkbox toggles selection state
- Test: select-all selects all selectable rows (respects `isRowSelectable`)
- Test: bulk actions bar appears on selection with correct count
- Test: bulk action callback receives selected rows' original data
- Test: row expansion renders sub-component
- Test: row actions dropdown opens and triggers callbacks
- Test: all column helpers render correctly
- **Validation**: All tests pass

---

### Sprint 5: Polish, Accessibility & Documentation

**Goal**: Harden the DataTable with keyboard navigation, responsive design, i18n, and a demo page. Prepare for production migration.

**Demoable outcome**: DataTable works with keyboard navigation, responsive layouts, and all features. A demo page showcases all features together.

#### Tickets

**S5-T1: Full accessibility implementation**
- Add `role="grid"` to table, `role="row"`, `role="gridcell"`, `role="columnheader"`
- Verify `aria-sort`, `aria-selected`, `aria-expanded` are all correctly applied (most added in earlier sprints)
- Screen reader announcements for: sort changes, page changes, selection count changes (via `aria-live` region)
- Focus management: focus stays in table after sort/filter actions
- **Validation**: VoiceOver/NVDA announces table structure, sort state, selection state; axe-core audit passes

**S5-T2: Keyboard navigation**
- Tab to table → focus first interactive element (checkbox or first row)
- Arrow keys navigate between rows
- Enter/Space on sortable header toggles sort
- Enter/Space on row triggers `onRowClick` (if set)
- Enter/Space on checkbox toggles selection
- Enter/Space on expand trigger toggles expansion
- Escape closes any open dropdown (row actions, faceted filter, view options)
- Home/End in pagination navigate to first/last page
- **Validation**: Full table interaction possible via keyboard only

**S5-T3: Responsive design**
- Horizontal scroll with sticky first column on narrow viewports (<768px)
- Column auto-hide on mobile (via responsive column visibility config in column meta)
- Pagination simplifies on mobile: prev/next buttons only, no page numbers
- Touch-friendly tap targets (min 44px height for rows and buttons)
- Toolbar stacks vertically on mobile (<640px)
- **Validation**: Table is usable on 375px viewport width; no horizontal overflow issues

**S5-T4: Internationalization (i18n) support**
- Externalize all internal UI strings via `labels` prop on DataTable
- Default English labels
- Strings to externalize: "Showing X-Y of Z results", "Page N", "of", "rows per page", "No results", "Reset filters", "N filters active", "N selected", "Deselect all", "Columns", "Toggle columns", "Load More", "Loading...", "Retry", "Error loading data"
- Consumer can pass translated strings: `<DataTable labels={useTableLabels()} />`
- **Validation**: All UI strings render from `labels` prop; no hardcoded English in component source

**S5-T5: Create demo/showcase page**
- Build a temporary demo route in the shell app (`/dev/data-table-demo`)
- Showcase sections:
  - Basic table with sorting
  - Paginated table with page navigation (with and without total)
  - Table with search and faceted filters
  - Table with row selection and bulk actions
  - Table with expandable rows
  - Virtual scrolling with 1000+ generated rows
  - All column helpers in action
  - Error state demo
  - Loading state demos (initial, page transition, load more)
- **Validation**: Demo page demonstrates all features working together; usable for QA

**S5-T6: Write integration tests and accessibility audit**
- Test: full DataTable with sorting + pagination + filtering works end-to-end
- Test: responsive behavior at different breakpoints (resize simulation)
- Test: axe-core accessibility audit on DataTable with all features enabled
- Test: keyboard navigation flow through table
- **Validation**: All tests pass; zero axe-core violations

---

### Sprint 6: Migration — Finance Module

**Goal**: Migrate all Finance module tables to use the new DataTable. Remove all inline HTML table code from finance routes.

**Demoable outcome**: Finance module (Invoices, Payments, Student Accounts, Fee Structures) uses the new DataTable with pagination, sorting, filtering, and bulk actions.

**Note**: Finance hooks (`useInvoices`, `useSchoolPayments`, `useStudentAccounts`) use `useQuery` (not `useInfiniteQuery`), meaning they fetch all data at once. Migration uses **client-side pagination** mode (data is already fully loaded; TanStack Table paginates in-browser). Server-side pagination can be added later by refactoring these hooks.

#### Tickets

**S6-T1: Migrate Invoices table**
- Replace inline HTML `<table>` in `apps/finance/src/routes/billing/invoices/index.tsx`
- Define invoice columns using TanStack column definitions + helpers (`createSelectColumn`, `createStatusColumn`, `createCurrencyColumn`, `createActionsColumn`)
- Enable row selection with `isRowSelectable: (row) => row.original.status === 'draft'`
- Wire bulk actions (Bulk Issue) via `bulkActions` prop
- Enable sorting on: Invoice #, Student, Amount, Due Date, Status
- Enable faceted filter for Status column
- Enable search for invoice # and student name
- Client-side pagination: 20 rows per page
- Keep existing Generate Invoice modal, Cancel dialog, and Bulk Issue confirm modal
- **Validation**: Invoice table shows 20 rows per page with page navigation; bulk selection works for draft invoices; all existing actions preserved; smoke test all CRUD flows

**S6-T2: Migrate Payments table**
- Replace inline HTML `<table>` in `apps/finance/src/routes/billing/payments/index.tsx`
- Define payment columns with TanStack column definitions
- Enable sorting on: Receipt #, Amount, Date, Status
- Enable faceted filters: Status, Gateway
- Enable search for receipt #, invoice #, student
- Client-side pagination: 20 rows per page
- Row actions via `DataTableRowActions`: View Receipt, Void, Refund (conditional on status)
- Wire existing Export CSV button into `toolbarExtra` slot
- Keep existing Void/Refund dialogs
- **Validation**: Payment table is paginated; filters narrow results; void/refund actions work

**S6-T3: Migrate Student Accounts table**
- Replace inline HTML `<table>` in `apps/finance/src/routes/billing/accounts/index.tsx`
- Enable row expansion via `enableExpanding` + `renderSubComponent`
- Expanded content: tabbed detail view (Ledger, Invoices, Payments tabs) — preserve existing tab components
- Define columns: Student Name, Balance, Total Paid, Last Payment
- Enable search by student name
- Enable sorting on Balance, Total Paid
- Client-side pagination: 20 rows per page
- **Validation**: Row expansion shows tabbed detail view; existing tab content preserved; pagination works

**S6-T4: Migrate Fee Structures table**
- Replace inline HTML in `apps/finance/src/routes/configuration/fee-structures.tsx`
- Define columns: Name, Type, Amount, Frequency, Grade Levels
- Enable sorting on Name, Amount, Type
- Row actions: Edit, Delete
- Small dataset — client-side pagination (10 per page)
- **Validation**: Fee structure CRUD works; table is paginated

**S6-T5: Remove deprecated finance table code**
- Remove `apps/finance/src/components/TableSkeleton.tsx` (replaced by DataTableSkeleton)
- Remove any unused imports and utility functions
- Verify no regressions
- **Validation**: `pnpm typecheck` and `pnpm build` pass; no unused code

**S6-T6: Finance module integration tests**
- Test: Invoices page renders with new DataTable
- Test: Pagination works across invoice pages
- Test: Bulk selection and bulk issue flow
- Test: Payments filters narrow results
- Test: Student Accounts row expansion works
- Test: Fee Structures CRUD through new table
- **Validation**: All tests pass; manual smoke test of all finance routes

---

### Sprint 7: Migration — Academics Module

**Goal**: Migrate all Academics module tables to use the new DataTable.

**Demoable outcome**: Students, Courses, Sections, Teachers, and Enrollment tables use the new DataTable.

#### Tickets

**S7-T1: Migrate `StudentTable`**
- Refactor `apps/academics/src/components/students/StudentTable.tsx`
- Convert `Column<T>[]` to TanStack ColumnDef using helpers (`createAvatarColumn` for student avatar + name)
- Wire with existing `useStudents` (which uses `useInfiniteQuery`) via `useServerPagination` hook
- Enable: sorting (client-side over loaded data), pagination (20/page over accumulated data), column visibility
- Preserve: DiceBear avatars, status badges, row click → drawer
- **Validation**: Student table paginated; existing interactions preserved; Load More → page numbers

**S7-T2: Migrate `CourseTable`**
- Refactor `apps/academics/src/components/curriculum/CourseTable.tsx`
- Convert column definitions to TanStack format
- Enable sorting on Name, Subject, Grade, Type
- Row actions via `DataTableRowActions`
- Client-side pagination (courses are typically <100)
- **Validation**: Course table paginated with sorting; row actions work

**S7-T3: Migrate `SectionTable`**
- Refactor `apps/academics/src/components/scheduling/SectionTable.tsx`
- Preserve capacity bar visualization in custom cell renderer
- Enable sorting on Section, Course, Teacher, Enrollment
- Row actions: View Details, View Roster, Edit, Activate/Deactivate
- **Validation**: Section table shows capacity bars; actions work

**S7-T4: Migrate `TeacherTable`**
- Refactor `apps/academics/src/components/teachers/TeacherTable.tsx`
- Replace inline HTML table + built-in search/filters
- Move search and role/status filters to DataTable toolbar (faceted filters)
- Enable sorting, pagination
- **Validation**: Teacher table uses DataTable; filters moved to toolbar

**S7-T5: Migrate `EnrollmentTable`**
- Refactor `apps/academics/src/components/enrollment/EnrollmentTable.tsx`
- Replace inline HTML table + built-in search/filters
- Move search and grade/status filters to DataTable toolbar
- Row actions: Withdraw, Transfer, No-Show via `DataTableRowActions`
- **Validation**: Enrollment table uses DataTable; actions preserved

**S7-T6: Migrate `SectionRoster`**
- Refactor `apps/academics/src/components/scheduling/SectionRoster.tsx`
- Replace custom sort logic with TanStack sorting
- Preserve add/remove student functionality
- **Validation**: Roster sorting works via column headers; add/remove students works

**S7-T7: Academics module integration tests**
- Test: Students page renders with new DataTable + pagination
- Test: Course table sorting and row actions
- Test: Section table with capacity visualization
- Test: Teacher/Enrollment tables with faceted filters
- **Validation**: All tests pass

---

### Sprint 8: Migration — People Module, Cleanup & Final Polish

**Goal**: Migrate People module, remove ALL legacy DataTable code, performance audit, visual consistency audit.

**Demoable outcome**: All tables across EdForge use the new TanStack DataTable system. Legacy DataTable is fully removed. Consistent UX everywhere.

#### Tickets

**S8-T1: Migrate `StaffTable`**
- Refactor `apps/people/src/components/staff/StaffTable.tsx`
- Convert to TanStack column definitions (use `createAvatarColumn` for staff avatar)
- Wire with existing `usePaginatedQuery` hook via `useServerPagination`
- Enable: sorting, pagination, column visibility
- Faceted filters: Role, Employment Status
- **Validation**: Staff table paginated with filters; existing interactions preserved

**S8-T2: Migrate Messages module tables (if applicable)**
- Audit `apps/messages/` for table usage
- Migrate any table components to new DataTable
- **Validation**: Messages tables use new DataTable or confirmed no tables exist

**S8-T3: Remove ALL legacy DataTable code**
- Remove `packages/ui/src/components/DataTable.tsx` (old DataTable)
- Remove old `Column<T>`, `DataTableProps`, `DataTableEmptyState` type exports from `packages/ui/src/index.ts`
- Remove `apps/people/src/components/ui/DataTable.tsx` (duplicate copy)
- Remove `apps/people/src/hooks/usePaginatedQuery.ts` if fully replaced by `useServerPagination`
- Remove `apps/messages/src/components/ui/Table.tsx` (duplicate copy)
- Update ALL imports across all apps
- Grep for any remaining references to old DataTable
- **Validation**: `pnpm typecheck` and `pnpm build` pass; `grep -r "from.*DataTable" --include="*.tsx" --include="*.ts"` shows only new data-table imports

**S8-T4: Performance audit**
- Profile all migrated tables with React DevTools Profiler
- Ensure no unnecessary re-renders (verify column definitions are memoized with `useMemo`)
- Verify virtual scroll performance with 500+ rows (should maintain 60fps)
- Check bundle size impact: `pnpm build` and compare before/after bundle analysis
- Optimize: `React.memo` on custom cell renderers if re-render hotspots found
- **Validation**: No performance regressions; bundle size delta <15KB gzipped; documented in PR

**S8-T5: Cross-module visual consistency audit**
- Screenshot all tables across Finance, Academics, People
- Verify consistent: border radius, padding, font sizes, colors, hover states, focus rings
- Verify consistent: skeleton loading, empty states, error states, pagination styling
- Verify dark mode compatibility across all tables
- Fix any visual inconsistencies found
- **Validation**: All tables look visually consistent; dark mode works everywhere

**S8-T6: Remove demo page and final cleanup**
- Remove `/dev/data-table-demo` route (or keep behind dev flag)
- Final `pnpm typecheck && pnpm build && pnpm test` across entire monorepo
- Update CLAUDE.md or internal docs if the new DataTable API needs documentation
- **Validation**: Clean build, all tests pass, no dead code

---

## 5. Dependency Graph

```
Sprint 1 (Foundation)
    │
    ├──→ Sprint 2 (Pagination & Performance)
    │        │
    │        └──→ Sprint 3 (Filtering & Column Controls)
    │                 │
    │                 └──→ Sprint 4 (Selection, Bulk Actions & Expansion)
    │                          │
    │                          └──→ Sprint 5 (Polish & Accessibility)
    │                                   │
    │                                   ├──→ Sprint 6 (Finance Migration)
    │                                   │
    │                                   ├──→ Sprint 7 (Academics Migration)  ← can run in parallel with S6
    │                                   │
    │                                   └──→ Sprint 8 (People + Cleanup)     ← depends on S6 + S7
```

Sprints 6 and 7 (migration sprints) can run **in parallel** if multiple developers are available.
Sprint 8 must run **after** S6 and S7 since it removes the legacy DataTable.

---

## 6. Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Backend doesn't support server-side sorting** | Certain | Medium | Design `onSortingChange` prop from Sprint 1. Start with client-side. Add backend sort support as separate backend task. |
| **`total` count unavailable from DynamoDB** | High | Medium | Pagination UI degrades gracefully: prev/next only when total unknown. Documented in S2-T1. |
| **Cursor pagination doesn't support "jump to page 5"** | Certain | Low | `useServerPagination` accumulates fetched data and slices. Sequential navigation only for unfetched pages. Pre-fetch mitigates latency. |
| **Finance hooks use `useQuery` not `useInfiniteQuery`** | Certain | Low | Finance tables use client-side pagination (data already fully loaded). Server-side pagination deferred to future sprint. |
| **Large migration breaks existing features** | Medium | High | Each table migration is an atomic ticket with its own validation. Old DataTable kept alive until Sprint 8. |
| **Bundle size increase** | Low | Low | `@tanstack/react-table` already installed. `@tanstack/react-virtual` is ~5KB gzipped. Monitor with build analysis in S8-T4. |
| **Module Federation hot reload instability** | Medium | Medium | Verify dev server after adding peer dependencies in S1-T2. Add `@tanstack/react-virtual` to MF shared config. |
| **Filter + pagination state desync** | Medium | High | Auto-reset `pageIndex` to 0 on any filter/search change. Implemented in `useDataTable` hook (S1-T8). |
| **GradebookGrid incompatible with DataTable** | Low | None | GradebookGrid is a custom spreadsheet with inline editing. It stays as a custom component — out of scope. |
| **Concurrent filter changes cause stale renders** | Medium | Medium | Use React Query's `placeholderData: keepPreviousData` to show stale data during transitions. Loading overlay (S2-T3) indicates freshness. |
| **`@edforge/ui` has no test infrastructure** | Certain | Medium | First ticket (S1-T1) sets up vitest + testing-library before any component work. |

---

## 7. Files Affected (Summary)

### New Files (~20)
```
packages/ui/src/components/data-table/
  index.ts, types.ts, DataTable.tsx, DataTableToolbar.tsx,
  DataTablePagination.tsx, DataTableColumnHeader.tsx,
  DataTableRowActions.tsx, DataTableFacetedFilter.tsx,
  DataTableViewOptions.tsx, DataTableSkeleton.tsx,
  DataTableEmpty.tsx, DataTableError.tsx,
  DataTableBulkActions.tsx, DataTableExpandableRow.tsx,
  DataTableLoadingOverlay.tsx, column-helpers.ts,
  hooks/useDataTable.ts, hooks/useServerPagination.ts,
  hooks/useColumnConfig.ts
Test files alongside each component
```

### Modified Files
```
packages/ui/src/index.ts                          — add data-table exports
packages/ui/package.json                          — add peerDep + devDeps
packages/config/src/mf-shared.ts                  — add @tanstack/react-virtual to sharing
apps/finance/src/routes/billing/invoices/index.tsx — refactor table
apps/finance/src/routes/billing/payments/index.tsx — refactor table
apps/finance/src/routes/billing/accounts/index.tsx — refactor table
apps/finance/src/routes/configuration/fee-structures.tsx — refactor table
apps/academics/src/components/students/StudentTable.tsx — refactor
apps/academics/src/components/curriculum/CourseTable.tsx — refactor
apps/academics/src/components/scheduling/SectionTable.tsx — refactor
apps/academics/src/components/scheduling/SectionRoster.tsx — refactor
apps/academics/src/components/teachers/TeacherTable.tsx — refactor
apps/academics/src/components/enrollment/EnrollmentTable.tsx — refactor
apps/people/src/components/staff/StaffTable.tsx — refactor
```

### Deleted Files
```
packages/ui/src/components/DataTable.tsx          — replaced by data-table/DataTable.tsx
apps/people/src/components/ui/DataTable.tsx       — duplicate removed
apps/messages/src/components/ui/Table.tsx          — duplicate removed
apps/finance/src/components/TableSkeleton.tsx      — replaced by DataTableSkeleton
```

---

## 8. Success Criteria

1. **No table in EdForge renders more than `pageSize` rows** at any time (default 20)
2. **All tables support sorting** via column header click
3. **All tables show proper pagination** with page numbers (when total known) or prev/next (when unknown)
4. **Finance tables support filtering** by status, gateway, and search
5. **Invoice table supports bulk selection** and bulk issue action
6. **Student Accounts table supports row expansion** with detail tabs
7. **Column visibility** is configurable and persists to localStorage
8. **Performance**: Large tables (500+ rows) render smoothly with virtual scrolling at 60fps
9. **Accessibility**: All tables pass axe-core audit with zero violations
10. **Keyboard**: Full table interaction possible via keyboard only
11. **Consistency**: All tables share the same visual language and interaction patterns
12. **i18n**: All table UI strings are externalizable via `labels` prop
13. **Error handling**: Network errors show error state with retry, not blank screens
14. **Bundle size**: No more than 15KB gzipped added to total bundle
15. **Zero regressions**: All existing functionality preserved after migration
16. **URL state** (optional): Filters and page are synced with URL params where enabled

---

## 9. Ticket Summary

| Sprint | Tickets | Focus |
|--------|---------|-------|
| **Sprint 1** | S1-T1 through S1-T9 (9 tickets) | Core foundation: DataTable, sorting, skeleton, empty, error, tests |
| **Sprint 2** | S2-T1 through S2-T8 (8 tickets) | Pagination (pages + load more + virtual), performance |
| **Sprint 3** | S3-T1 through S3-T7 (7 tickets) | Search, faceted filters, column visibility, URL state |
| **Sprint 4** | S4-T1 through S4-T6 (6 tickets) | Row selection, bulk actions, expansion, column helpers |
| **Sprint 5** | S5-T1 through S5-T6 (6 tickets) | Accessibility, keyboard nav, responsive, i18n, demo page |
| **Sprint 6** | S6-T1 through S6-T6 (6 tickets) | Finance module migration |
| **Sprint 7** | S7-T1 through S7-T7 (7 tickets) | Academics module migration |
| **Sprint 8** | S8-T1 through S8-T6 (6 tickets) | People module, legacy removal, performance audit, polish |
| **Total** | **55 tickets** | |
