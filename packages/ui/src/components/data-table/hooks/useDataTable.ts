import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
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
import type { PaginationConfig } from '../types'

interface UseDataTableOptions<TData> {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  getRowId?: (row: TData, index: number) => string

  // Features
  enableSorting?: boolean
  enableColumnFilters?: boolean
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean)
  enableExpanding?: boolean

  // Controlled state
  onSortingChange?: OnChangeFn<SortingState>
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>

  // Column visibility
  initialColumnVisibility?: VisibilityState

  // Pagination
  pagination?: PaginationConfig
}

export function useDataTable<TData>(
  options: UseDataTableOptions<TData>
): Table<TData> {
  const {
    data,
    columns,
    getRowId,
    enableSorting = false,
    enableColumnFilters = false,
    enableRowSelection = false,
    enableExpanding = false,
    onSortingChange: controlledOnSortingChange,
    rowSelection: controlledRowSelection,
    onRowSelectionChange: controlledOnRowSelectionChange,
    initialColumnVisibility = {},
    pagination,
  } = options

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>(initialColumnVisibility)
  const [expanded, setExpanded] = useState<ExpandedState>({})

  // Internal row selection state (used when not controlled)
  const [internalRowSelection, setInternalRowSelection] =
    useState<RowSelectionState>({})

  const rowSelection = controlledRowSelection ?? internalRowSelection
  const onRowSelectionChange =
    controlledOnRowSelectionChange ?? setInternalRowSelection

  const pageSize = pagination?.pageSize ?? 20

  const table = useReactTable({
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
    },
    onSortingChange: controlledOnSortingChange ?? setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange,
    onExpandedChange: setExpanded,

    // Row models
    getCoreRowModel: getCoreRowModel(),
    ...(enableSorting && { getSortedRowModel: getSortedRowModel() }),
    ...(enableColumnFilters && {
      getFilteredRowModel: getFilteredRowModel(),
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

    // Pagination defaults
    initialState: {
      pagination: {
        pageSize,
        pageIndex: 0,
      },
    },

    // Global filter for search
    enableGlobalFilter: true,
  })

  return table
}
