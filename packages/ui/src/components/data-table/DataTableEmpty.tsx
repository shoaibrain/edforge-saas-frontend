import { X } from 'lucide-react'
import type { DataTableEmptyStateConfig, DataTableLabels } from './types'
import { DEFAULT_DATA_TABLE_LABELS } from './labels'
import { cn, focusRing } from '../../utils'

interface DataTableEmptyProps {
  config: DataTableEmptyStateConfig
  className?: string
  /** Render without the card chrome (border/shadow/bg) — for nesting inside an
   *  existing card so a persistent toolbar stays above the empty body. */
  bare?: boolean
  /** When set, swaps the primary CTA for a "Clear filters" shortcut. The
   *  consumer wires this to the same logic as the toolbar's `Clear (N)`. */
  onClearFilters?: () => void
  labels?: DataTableLabels
}

export function DataTableEmpty({
  config,
  className,
  bare = false,
  onClearFilters,
  labels,
}: DataTableEmptyProps) {
  const resolvedLabels = labels ?? DEFAULT_DATA_TABLE_LABELS
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        !bare &&
          'rounded-xl border border-[rgb(var(--border-primary)/0.5)] shadow-[0_1px_3px_0_rgb(0_0_0/0.08),0_1px_2px_-1px_rgb(0_0_0/0.08)] bg-[rgb(var(--background-primary))]',
        className
      )}
    >
      {config.icon && (
        <div className="mb-4 text-[rgb(var(--text-tertiary))]">
          {config.icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-[rgb(var(--text-primary))] mb-2">
        {config.title}
      </h3>
      {config.description && (
        <p className="text-[rgb(var(--text-secondary))] mb-6 max-w-sm">
          {config.description}
        </p>
      )}
      {onClearFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg',
            'border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))]',
            'hover:bg-[rgb(var(--background-secondary))] transition-colors',
            focusRing
          )}
        >
          <X className="w-3.5 h-3.5" />
          {resolvedLabels.clearFilters}
        </button>
      ) : (
        config.action && (
          <button
            type="button"
            onClick={config.action.onClick}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] rounded-lg hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors',
              focusRing
            )}
          >
            {config.action.label}
          </button>
        )
      )}
    </div>
  )
}
