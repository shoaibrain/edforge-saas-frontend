/**
 * TableBulkBar — the bulk-action bar that swaps into the unified toolbar's row
 * when rows are selected. Designed to occupy the same footprint as the toolbar
 * (min-h-9) so the swap causes no layout shift.
 *
 * Reuses the shared `BulkAction<T>` contract already used by list pages
 * (supports both `onClick`/`onRun` and `variant`/`tone` aliases).
 */
import { forwardRef, type HTMLAttributes } from 'react'
import { X } from 'lucide-react'
import { cn, focusRing } from '../../utils'
import type { BulkAction } from './types'

export interface TableBulkBarProps<TData> extends HTMLAttributes<HTMLDivElement> {
  /** Number of selected rows. */
  count: number
  /** The selected row objects, passed to each action's handler. */
  selectedRows: TData[]
  onClear: () => void
  actions: BulkAction<TData>[]
  /** Label builders (i18n). Sensible English defaults apply. */
  selectedLabel?: (count: number) => string
  clearLabel?: string
}

function resolveVariant<TData>(action: BulkAction<TData>): 'primary' | 'danger' | 'outline' {
  if (action.variant) return action.variant
  if (action.tone === 'critical') return 'danger'
  if (action.tone === 'primary') return 'primary'
  return 'outline'
}

const VARIANT_CLASS: Record<'primary' | 'danger' | 'outline', string> = {
  primary:
    'bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] hover:bg-[rgb(var(--action-primary-bg-hover))]',
  danger:
    'bg-[rgb(var(--action-danger-bg))] text-[rgb(var(--action-danger-fg))] hover:opacity-90',
  outline:
    'border border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-tertiary))]',
}

function TableBulkBarInner<TData>(
  {
    className,
    count,
    selectedRows,
    onClear,
    actions,
    selectedLabel = (n) => `${n} selected`,
    clearLabel = 'Clear selection',
    ...props
  }: TableBulkBarProps<TData>,
  ref: React.Ref<HTMLDivElement>,
) {
  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label={selectedLabel(count)}
      className={cn('flex min-h-9 flex-wrap items-center gap-x-3 gap-y-2', className)}
      {...props}
    >
      <span className="text-sm font-medium tabular-nums text-[rgb(var(--text-primary))]">
        {selectedLabel(count)}
      </span>
      <button
        type="button"
        onClick={onClear}
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
          'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-tertiary))] hover:text-[rgb(var(--text-primary))]',
          focusRing,
        )}
      >
        <X className="h-3.5 w-3.5" />
        {clearLabel}
      </button>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {actions.map((action, i) => (
          <button
            key={action.id ?? `${action.label}-${i}`}
            type="button"
            disabled={action.disabled}
            onClick={() => (action.onClick ?? action.onRun)?.(selectedRows)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors disabled:opacity-50',
              focusRing,
              VARIANT_CLASS[resolveVariant(action)],
            )}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Generic forwardRef wrapper preserving the `<TData>` type parameter. */
export const TableBulkBar = forwardRef(TableBulkBarInner) as <TData>(
  props: TableBulkBarProps<TData> & { ref?: React.Ref<HTMLDivElement> },
) => ReturnType<typeof TableBulkBarInner>
