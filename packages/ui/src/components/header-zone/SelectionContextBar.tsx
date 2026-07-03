/**
 * SelectionContextBar — the state-aware selection layer for table toolbars.
 *
 * Renders in the toolbar's footprint when rows are selected (the host swaps it
 * in place — same height, zero layout shift). The intelligence lives in the
 * action list the page computes from the selected rows + the user's role:
 *
 * - `applicableIds` smaller than the selection → a count chip ("Send reminder
 *   · 3"); the confirm handler receives exactly those ids, never the raw
 *   selection.
 * - `applicableIds` empty → visible but disabled, with a plain-language
 *   `disabledReason` in the tooltip.
 * - `locked` (role lacks permission) → visible with a lock glyph + reason
 *   (discoverability, not hidden).
 *
 * Single-select renders the `peek` strip (avatar + name + key stat) in place
 * of the count. Esc (while mounted) and ✕ clear the selection. The actions row
 * scrolls horizontally rather than wrapping. Heavy surfaces (drawer/modal) are
 * the page's concern — this bar only invokes `onAction(applicableIds)`.
 */

import { useEffect, useMemo, type ReactNode } from 'react'
import { Lock, X } from 'lucide-react'
import { cn, focusRing } from '../../utils'

export interface SelectionAction {
  id: string
  label: string
  icon?: ReactNode
  /** Ids of the selected rows this action can apply to. */
  applicableIds: string[]
  /** The signed-in role lacks permission — render with a lock, don't hide. */
  locked?: boolean
  /** Tooltip when locked (e.g. "Requires Admin"). */
  lockedReason?: string
  /** Plain-language tooltip when nothing in the selection qualifies. */
  disabledReason?: string
  danger?: boolean
  onAction?: (applicableIds: string[]) => void
}

export interface SelectionContextBarLabels {
  selected: (count: number) => string
  selectAll: (total: number) => string
  clear: string
}

const FALLBACK_LABELS: SelectionContextBarLabels = {
  selected: (count) => `${count} selected`,
  selectAll: (total) => `Select all ${total}`,
  clear: 'Clear selection',
}

export interface SelectionContextBarProps {
  selectedCount: number
  /** Total selectable rows — enables the "Select all N" affordance. */
  totalCount?: number
  onClear: () => void
  onSelectAll?: () => void
  actions: SelectionAction[]
  /** Single-select peek strip (avatar + name + one key stat line). */
  peek?: ReactNode
  labels?: Partial<SelectionContextBarLabels>
  className?: string
  'aria-label'?: string
}

export function SelectionContextBar({
  selectedCount,
  totalCount,
  onClear,
  onSelectAll,
  actions,
  peek,
  labels: labelOverrides,
  className,
  'aria-label': ariaLabel,
}: SelectionContextBarProps) {
  const labels = useMemo(
    () => ({ ...FALLBACK_LABELS, ...labelOverrides }),
    [labelOverrides],
  )

  // Esc clears the selection while the bar is mounted (the bar only exists
  // when a selection does).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClear()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClear])

  return (
    <div
      role="toolbar"
      aria-label={ariaLabel ?? 'Selection actions'}
      className={cn(
        'flex min-h-9 items-center gap-3 rounded-lg border-l-2 border-l-[rgb(var(--border-focus))] bg-gradient-to-r from-[rgb(var(--state-success-bg)/0.35)] to-transparent px-3 py-1.5',
        className,
      )}
    >
      {/* Left: clear + count / peek */}
      <div className="flex min-w-0 shrink-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onClear}
          aria-label={labels.clear}
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[rgb(var(--border-primary)/0.4)] bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-tertiary))] transition-colors hover:text-[rgb(var(--text-primary))]',
            focusRing,
          )}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        {selectedCount === 1 && peek ? (
          <div className="flex min-w-0 items-center gap-2">{peek}</div>
        ) : (
          <span className="whitespace-nowrap text-sm font-semibold tabular-nums text-[rgb(var(--text-primary))]">
            {labels.selected(selectedCount)}
          </span>
        )}
        {/* Polite announcement so screen readers track the selection size. */}
        <span className="sr-only" aria-live="polite">
          {labels.selected(selectedCount)}
        </span>
      </div>

      {/* Middle: actions — horizontal scroll, never wraps */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
        {actions.map((action) => {
          const applicable = action.applicableIds.length
          const off = action.locked || applicable === 0
          const showCount = !off && applicable < selectedCount
          const title = action.locked
            ? action.lockedReason
            : applicable === 0
              ? action.disabledReason
              : showCount
                ? `${action.label} · ${applicable}/${selectedCount}`
                : undefined
          return (
            <button
              key={action.id}
              type="button"
              aria-disabled={off || undefined}
              title={title}
              onClick={() => {
                if (off) return
                action.onAction?.(action.applicableIds)
              }}
              className={cn(
                'inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 text-xs font-medium transition-colors',
                focusRing,
                action.danger
                  ? 'border-[rgb(var(--state-danger-fg)/0.35)] bg-[rgb(var(--background-secondary))] text-[rgb(var(--state-danger-fg))]'
                  : 'border-[rgb(var(--border-primary)/0.4)] bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-secondary))]',
                off ? 'cursor-not-allowed opacity-45' : 'hover:bg-[rgb(var(--background-tertiary))]',
              )}
            >
              {action.icon}
              {action.label}
              {showCount ? (
                <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-[rgb(var(--state-success-bg)/0.5)] px-1.5 text-2xs font-bold tabular-nums text-[rgb(var(--state-success-fg))]">
                  {applicable}
                </span>
              ) : null}
              {action.locked ? (
                <Lock className="h-3 w-3 text-[rgb(var(--text-tertiary))]" aria-hidden="true" />
              ) : null}
            </button>
          )
        })}
      </div>

      {/* Right: select-all */}
      {onSelectAll && totalCount != null && selectedCount < totalCount ? (
        <button
          type="button"
          onClick={onSelectAll}
          className={cn(
            'hidden shrink-0 whitespace-nowrap text-xs font-medium text-[rgb(var(--state-success-fg))] hover:underline sm:inline',
            focusRing,
          )}
        >
          {labels.selectAll(totalCount)}
        </button>
      ) : null}
    </div>
  )
}
