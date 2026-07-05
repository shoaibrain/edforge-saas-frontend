import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type ExpandedState,
  type RowSelectionState,
  type ColumnDef,
  type OnChangeFn,
  type Row,
  type Table,
} from '@tanstack/react-table'
import type { DataTableDensity, PaginationConfig } from '../types'
import {
  readPersistedTableState,
  usePersistTableState,
} from './useTablePersistence'

interface UseDataTableOptions<TData> {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  getRowId?: (row: TData, index: number) => string

  // Features
  enableSorting?: boolean
  enableColumnFilters?: boolean
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean)
  enableExpanding?: boolean
  enableFaceted?: boolean

  // Controlled state
  onSortingChange?: OnChangeFn<SortingState>
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>

  // Column visibility
  initialColumnVisibility?: VisibilityState

  // Pagination
  pagination?: PaginationConfig

  // Persistence + initial values
  tableId?: string
  defaultSort?: SortingState
  initialDensity?: DataTableDensity
}

export interface UseDataTableResult<TData> {
  table: Table<TData>
  density: DataTableDensity
  setDensity: (next: DataTableDensity) => void
}

export function useDataTable<TData>(
  options: UseDataTableOptions<TData>
): UseDataTableResult<TData> {
  const {
    data,
    columns,
    getRowId,
    enableSorting = false,
    enableColumnFilters = false,
    enableRowSelection = false,
    enableExpanding = false,
    enableFaceted = false,
    onSortingChange: controlledOnSortingChange,
    rowSelection: controlledRowSelection,
    onRowSelectionChange: controlledOnRowSelectionChange,
    initialColumnVisibility = {},
    pagination,
    tableId,
    defaultSort,
    initialDensity = 'comfortable',
  } = options

  // Read persisted state once on mount. We deliberately drop changes if the
  // tableId changes mid-life (very rare; would mean the same component is
  // being repurposed for a different table).
  const persisted = useMemo(
    () => readPersistedTableState(tableId),
    [tableId]
  )

  const [sorting, setSorting] = useState<SortingState>(
    persisted?.sorting ?? defaultSort ?? []
  )
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    persisted?.columnFilters ?? []
  )
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    persisted?.columnVisibility ?? initialColumnVisibility
  )
  const [expanded, setExpanded] = useState<ExpandedState>({})
  // Search text is controlled here so it can persist per tableId (survives
  // reload / route re-entry) alongside the column filters.
  const [globalFilter, setGlobalFilter] = useState<string>(
    persisted?.globalFilter ?? ''
  )
  const [density, setDensity] = useState<DataTableDensity>(
    persisted?.density ?? initialDensity
  )

  // Internal row selection state (used when not controlled)
  const [internalRowSelection, setInternalRowSelection] =
    useState<RowSelectionState>({})

  const rowSelection = controlledRowSelection ?? internalRowSelection
  const onRowSelectionChange =
    controlledOnRowSelectionChange ?? setInternalRowSelection

  const initialPageSize =
    persisted?.pageSize ?? pagination?.pageSize ?? 20

  const [pageState, setPageState] = useState<{ pageIndex: number; pageSize: number }>(
    () => ({ pageIndex: 0, pageSize: initialPageSize })
  )

  const table = useReactTable<TData>({
    data,
    columns,
    getRowId,
    defaultColumn: { size: 200, minSize: 80 },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      expanded,
      globalFilter,
      ...(pagination && { pagination: pageState }),
    },
    onGlobalFilterChange: (updater) => {
      setGlobalFilter((prev) =>
        typeof updater === 'function' ? (updater(prev) as string) : (updater as string)
      )
      // Searching snaps back to the first page, matching column-filter changes.
      if (pagination) {
        setPageState((p) => ({ ...p, pageIndex: 0 }))
      }
    },
    onSortingChange: controlledOnSortingChange ?? setSorting,
    onColumnFiltersChange: (updater) => {
      // Filter/search changes always snap pagination back to the first page;
      // sorting and selection are deliberately left alone.
      setColumnFilters((prev) =>
        typeof updater === 'function' ? updater(prev) : updater
      )
      if (pagination) {
        setPageState((p) => ({ ...p, pageIndex: 0 }))
      }
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange,
    onExpandedChange: setExpanded,
    ...(pagination && {
      onPaginationChange: (updater) => {
        setPageState((prev) =>
          typeof updater === 'function' ? updater(prev) : updater
        )
      },
    }),

    // Row models
    getCoreRowModel: getCoreRowModel(),
    ...(enableSorting && { getSortedRowModel: getSortedRowModel() }),
    ...(enableColumnFilters && {
      getFilteredRowModel: getFilteredRowModel(),
    }),
    ...(enableFaceted && {
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues(),
    }),
    ...(pagination && { getPaginationRowModel: getPaginationRowModel() }),
    ...(enableExpanding && { getExpandedRowModel: getExpandedRowModel() }),

    // Feature flags
    enableSorting,
    enableColumnFilters,
    enableRowSelection,
    enableExpanding,
    // When using renderSubComponent (no subRows), always allow expand
    ...(enableExpanding && { getRowCanExpand: () => true }),
    enableMultiRowSelection: true,

    // Pagination defaults (used when state.pagination is absent)
    initialState: {
      pagination: {
        pageSize: initialPageSize,
        pageIndex: 0,
      },
    },

    // Global filter for search
    enableGlobalFilter: true,
  })

  // Debounced write of the slice of state we care to persist.
  usePersistTableState(tableId, {
    density,
    columnVisibility,
    pageSize: pageState.pageSize,
    columnFilters,
    sorting,
    globalFilter,
  })

  return { table, density, setDensity }
}
