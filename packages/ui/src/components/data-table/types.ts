import type { ReactNode } from 'react'
import type {
  ColumnDef,
  SortingState,
  OnChangeFn,
  Row,
  RowSelectionState,
  VisibilityState,
} from '@tanstack/react-table'

// ============================================================================
// COLUMN META
// ============================================================================

export interface DataTableColumnMeta {
  /** Alignment for header and cell content */
  align?: 'left' | 'center' | 'right'
  /** Whether this column should be hideable in view options (alias: hideable) */
  enableHiding?: boolean
  /** Convenience alias of enableHiding, matching the prototype API. */
  hideable?: boolean
  /** Filter variant for toolbar integration */
  filterVariant?: 'text' | 'select' | 'multi-select'
  /** Pin column to the left while the body scrolls horizontally. */
  sticky?: boolean
  /** Extra className applied to the matching `<th>` and `<td>`. */
  className?: string
  /** Display label for a faceted filter option whose raw value is an id/enum. */
  facetLabelMap?: (value: unknown) => string
}

// ============================================================================
// DENSITY
// ============================================================================

export type DataTableDensity = 'comfortable' | 'compact'

// ============================================================================
// EMPTY STATE
// ============================================================================

export interface DataTableEmptyStateConfig {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

// ============================================================================
// FACETED FILTER
// ============================================================================

export interface FacetedFilterOption {
  label: string
  value: string
  icon?: ReactNode
}

export interface FacetedFilterConfig {
  columnId: string
  title: string
  options: FacetedFilterOption[]
}

// ============================================================================
// BULK ACTIONS
// ============================================================================

export interface BulkAction<TData> {
  /** Stable id (used for React keys + analytics). Optional for back-compat. */
  id?: string
  label: string
  /** Primary handler; `onRun` is accepted as an alias to match the prototype. */
  onClick?: (selectedRows: TData[]) => void
  onRun?: (selectedRows: TData[]) => void
  icon?: ReactNode
  /** Stylistic variant. `tone: 'critical'` from the prototype maps to 'danger'. */
  variant?: 'primary' | 'danger' | 'outline'
  tone?: 'critical' | 'primary' | 'outline'
  disabled?: boolean
}

// ============================================================================
// ROW ACTIONS
// ============================================================================

export interface RowAction<TData> {
  label: string
  onClick: (row: TData) => void
  icon?: ReactNode
  variant?: 'default' | 'danger'
  hidden?: boolean
  disabled?: boolean
  divider?: boolean
}

// ============================================================================
// PAGINATION
// ============================================================================

export interface PaginationConfig {
  pageSize?: number
  pageSizeOptions?: number[]
}

/**
 * Server-side pagination hook for tables whose `data` is a growing window
 * (e.g. a `useInfiniteQuery` result) rather than the complete row set.
 *
 * When supplied, the pagination footer's Next button:
 *   - remains enabled while the client table has more pages OR the server
 *     reports `hasMore=true`
 *   - triggers `onLoadMore()` when the user runs past the last loaded page
 *     and `hasMore=true`, then advances the client pageIndex once the new
 *     rows are in
 *
 * The `Showing X-Y of Z+` label uses `serverTotalHint` (when the server
 * reports an upper bound) or displays a "+" suffix on the loaded count to
 * signal "more exist, not shown yet".
 */
export interface ServerPaginationConfig {
  hasMore: boolean
  isFetching?: boolean
  onLoadMore: () => void
  /** Optional hint from the server for the total known count. */
  serverTotalHint?: number
}

// ============================================================================
// EXPORT OPTIONS
// ============================================================================

export type DataTableExportFormat = 'csv' | 'xlsx'

export interface DataTableExportOptions {
  /** Filename stem (no extension). */
  filename: string
  /** Formats to offer. Defaults to ['csv']. XLSX is reserved for follow-up. */
  formats?: DataTableExportFormat[]
}

// ============================================================================
// MAIN DATA TABLE PROPS
// ============================================================================

export interface DataTableProps<TData> {
  /** TanStack Table column definitions */
  columns: ColumnDef<TData, unknown>[]
  /** Data array to display */
  data: TData[]
  /** Unique row ID extractor — defaults to row index */
  getRowId?: (row: TData, index: number) => string

  // -- Loading & Error States --
  /** Show loading skeleton (initial load) */
  isLoading?: boolean
  /** Show loading overlay (refetching / page transition) */
  isFetching?: boolean
  /** Error object to display */
  error?: Error | null
  /** Retry callback for error state */
  onRetry?: () => void

  // -- Empty State --
  emptyState?: DataTableEmptyStateConfig

  // -- Pagination --
  pagination?: PaginationConfig
  /** Total row count (if known from server) — enables "Page X of Y" display */
  totalCount?: number
  /**
   * Optional server-pagination adapter. Set alongside `pagination` when the
   * component is driving a `useInfiniteQuery`-style data source. See the
   * `ServerPaginationConfig` docstring for Next-button semantics.
   */
  serverPagination?: ServerPaginationConfig
  /** Convenience alias for `pagination.pageSizeOptions`; matches the prototype. */
  pageSizes?: number[]

  // -- Sorting --
  enableSorting?: boolean
  /** Controlled sorting change handler (for server-side sorting) */
  onSortingChange?: OnChangeFn<SortingState>
  /** Initial sort state. Persisted state takes precedence when `tableId` is set. */
  defaultSort?: SortingState

  // -- Filtering --
  enableColumnFilters?: boolean

  // -- Column Visibility --
  enableColumnVisibility?: boolean
  /** Table ID for persisting column visibility / density / page size / filters. */
  tableId?: string
  /** Initial column visibility state */
  initialColumnVisibility?: VisibilityState

  // -- Row Selection --
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean)
  /** Controlled selection state */
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>

  // -- Row Expansion --
  enableExpanding?: boolean
  /** Content to render when a row is expanded */
  renderSubComponent?: (props: { row: Row<TData> }) => ReactNode

  // -- Row Click --
  onRowClick?: (row: TData) => void

  // -- Toolbar --
  searchPlaceholder?: string
  /** Faceted filters. `facets` is the prototype name; `facetedFilters` kept for back-compat. */
  facetedFilters?: FacetedFilterConfig[]
  facets?: FacetedFilterConfig[]
  /** Extra element rendered at the START (left) of the toolbar — e.g. filter chips. */
  toolbarStart?: ReactNode
  /** Extra element to render in the toolbar right cluster.
   *  Alias: `rightToolbarSlot` (prototype name). */
  toolbarExtra?: ReactNode
  rightToolbarSlot?: ReactNode

  // -- Density --
  /** Initial density. Persisted state takes precedence when `tableId` is set. */
  density?: DataTableDensity
  /** Show the toolbar density toggle. Defaults to true when bulkActions/facets exist. */
  enableDensityToggle?: boolean

  // -- Bulk Actions --
  bulkActions?: BulkAction<TData>[]

  // -- Export --
  /** Surfaces a built-in Export button in the toolbar right cluster. */
  exportOptions?: DataTableExportOptions

  // -- Styling --
  className?: string
  /** Maximum height for the table container. Enables internal vertical scrolling with sticky headers.
   *  Accepts any CSS height value, e.g. "calc(100vh - 14rem)" or "600px". */
  maxHeight?: string
}
