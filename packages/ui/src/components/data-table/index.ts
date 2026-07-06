// Core component
export { DataTable } from './DataTable'

// Sub-components
export { DataTableColumnHeader } from './DataTableColumnHeader'
export { DataTablePagination } from './DataTablePagination'
export { DataTableToolbar } from './DataTableToolbar'
export { ToolbarSearch, type ToolbarSearchProps } from './ToolbarSearch'
export { DataTableFacetedFilter } from './DataTableFacetedFilter'
export {
  FilterSelect,
  type FilterSelectProps,
  type FilterSelectOption,
} from './FilterSelect'
export { DataTableViewOptions } from './DataTableViewOptions'
export { DataTableRowActions } from './DataTableRowActions'
export { DataTableSkeleton } from './DataTableSkeleton'
export { DataTableEmpty } from './DataTableEmpty'
export { DataTableDensityToggle } from './DataTableDensityToggle'
export { DataTableExport } from './DataTableExport'
export { TablePresetTabs, type TablePreset, type TablePresetTabsProps } from './TablePresetTabs'
export { TableBulkBar, type TableBulkBarProps } from './TableBulkBar'
export { DataTableMoreFilters, type DataTableMoreFiltersProps } from './DataTableMoreFilters'
export {
  DEFAULT_DATA_TABLE_LABELS,
  resolveDataTableLabels,
} from './labels'

// Column helpers
export {
  createSelectColumn,
  createExpandColumn,
  createActionsColumn,
} from './column-helpers'

// Hooks
export { useDataTable } from './hooks/useDataTable'
export { useDataTableLabels } from './useDataTableLabels'
export {
  readPersistedTableState,
  usePersistTableState,
  clearPersistedTableState,
} from './hooks/useTablePersistence'

// Types
export type {
  DataTableProps,
  DataTableEmptyStateConfig,
  DataTableColumnMeta,
  DataTableDensity,
  DataTableExportOptions,
  DataTableExportFormat,
  DataTableLabels,
  DataTableLabelsInput,
  FacetedFilterOption,
  FacetedFilterConfig,
  BulkAction,
  RowAction,
  PaginationConfig,
  ServerPaginationConfig,
} from './types'

// Re-export TanStack Table utilities for convenience
export { createColumnHelper } from '@tanstack/react-table'
export type { ColumnDef, Row, Table, CellContext, HeaderContext } from '@tanstack/react-table'
