import type { Column } from '@tanstack/react-table'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { cn, focusRingInset } from '../../utils'
import type { DataTableColumnMeta } from './types'

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
  className?: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const meta = column.columnDef.meta as DataTableColumnMeta | undefined
  const align = meta?.align ?? 'left'

  if (!column.getCanSort()) {
    return (
      <div
        className={cn(
          'text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider',
          align === 'right' && 'text-right',
          align === 'center' && 'text-center',
          className
        )}
      >
        {title}
      </div>
    )
  }

  const sorted = column.getIsSorted()

  return (
    <button
      type="button"
      onClick={() => column.toggleSorting()}
      className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider',
        'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]',
        'transition-colors select-none cursor-pointer',
        focusRingInset,
        align === 'right' && 'ml-auto flex-row-reverse',
        align === 'center' && 'mx-auto',
        className
      )}
      aria-sort={
        sorted === 'asc'
          ? 'ascending'
          : sorted === 'desc'
            ? 'descending'
            : 'none'
      }
    >
      <span>{title}</span>
      {sorted === 'asc' ? (
        <ArrowUp className="h-3.5 w-3.5 text-[rgb(var(--action-secondary-fg))]" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="h-3.5 w-3.5 text-[rgb(var(--action-secondary-fg))]" />
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
      )}
    </button>
  )
}
