import type { ColumnDef, Row } from '@tanstack/react-table'
import { ChevronRight } from 'lucide-react'
import { cn, focusRingInset } from '../../utils'

// ============================================================================
// SELECT (CHECKBOX) COLUMN
// ============================================================================

export function createSelectColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: 'select',
    size: 48,
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          ref={(el) => {
            if (el) {
              el.indeterminate =
                table.getIsSomePageRowsSelected() &&
                !table.getIsAllPageRowsSelected()
            }
          }}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className={`w-4 h-4 rounded border-[rgb(var(--border-primary))] text-[rgb(var(--action-secondary-fg))] ${focusRingInset}`}
          aria-label="Select all rows"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div
        className="flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
          className={`w-4 h-4 rounded border-[rgb(var(--border-primary))] text-[rgb(var(--action-secondary-fg))] disabled:opacity-50 ${focusRingInset}`}
          aria-label="Select row"
        />
      </div>
    ),
    meta: { align: 'center' as const },
  }
}

// ============================================================================
// EXPAND COLUMN
// ============================================================================

export function createExpandColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: 'expand',
    size: 40,
    enableSorting: false,
    enableHiding: false,
    header: () => <span className="sr-only">Expand row</span>,
    cell: ({ row }) => {
      if (!row.getCanExpand()) return null
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            row.toggleExpanded()
          }}
          className="p-1 rounded hover:bg-[rgb(var(--background-secondary))] transition-colors"
          aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
        >
          <ChevronRight
            className={cn(
              'w-4 h-4 text-[rgb(var(--text-tertiary))] transition-transform duration-200',
              row.getIsExpanded() && 'rotate-90'
            )}
          />
        </button>
      )
    },
  }
}

// ============================================================================
// ACTIONS COLUMN
// ============================================================================

interface ActionsColumnConfig<TData> {
  id?: string
  cell: (props: { row: Row<TData> }) => React.ReactNode
  size?: number
}

export function createActionsColumn<TData>(
  config: ActionsColumnConfig<TData>
): ColumnDef<TData, unknown> {
  return {
    id: config.id ?? 'actions',
    size: config.size ?? 80,
    enableSorting: false,
    enableHiding: false,
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()}>
        {config.cell({ row })}
      </div>
    ),
    meta: { align: 'right' as const },
  }
}
