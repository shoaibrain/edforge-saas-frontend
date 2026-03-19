// Core component
export { DataTable } from './DataTable'

// Sub-components
export { DataTableColumnHeader } from './DataTableColumnHeader'
export { DataTablePagination } from './DataTablePagination'
export { DataTableToolbar } from './DataTableToolbar'
export { DataTableFacetedFilter } from './DataTableFacetedFilter'
export { DataTableViewOptions } from './DataTableViewOptions'
export { DataTableRowActions } from './DataTableRowActions'
export { DataTableSkeleton } from './DataTableSkeleton'
export { DataTableEmpty } from './DataTableEmpty'

// Column helpers
export {
  createSelectColumn,
  createExpandColumn,
  createActionsColumn,
} from './column-helpers'

// Hooks
export { useDataTable } from './hooks/useDataTable'

// Types
export type {
  DataTableProps,
  DataTableEmptyStateConfig,
  DataTableColumnMeta,
  FacetedFilterOption,
  FacetedFilterConfig,
  BulkAction,
  RowAction,
  PaginationConfig,
} from './types'

// Re-export TanStack Table utilities for convenience
export { createColumnHelper } from '@tanstack/react-table'
export type { ColumnDef, Row, Table, CellContext, HeaderContext } from '@tanstack/react-table'
