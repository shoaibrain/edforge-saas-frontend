/**
 * DataTable phone card mode (< 640px).
 *
 * The table's row model renders as a card "ledger" list — one logical source
 * (same useDataTable state, toolbar, pagination); only the presentation in
 * the scroll area branches. Column placement comes from `meta.mobile.area`
 * with a derived default (see resolveCardAreas), so most tables need zero
 * configuration.
 *
 * Phone trade-offs, by design:
 * - `select` column hides → bulk selection (and the SelectionContextBar) is
 *   a desktop/tablet affordance for now.
 * - Sorting rides `defaultSort`; a View-menu sort entry is the follow-up seam.
 */

import { type KeyboardEvent, type ReactNode } from 'react'
import { flexRender } from '@tanstack/react-table'
import type { Cell, Row } from '@tanstack/react-table'
import { cn, focusRingInset } from '../../utils'
import type { DataTableColumnMeta } from './types'

interface CardAreas<TData> {
  title?: Cell<TData, unknown>
  subtitle?: Cell<TData, unknown>
  trailing: Cell<TData, unknown>[]
  meta: Cell<TData, unknown>[]
  actions?: Cell<TData, unknown>
}

function columnMeta<TData>(cell: Cell<TData, unknown>) {
  return cell.column.columnDef.meta as DataTableColumnMeta | undefined
}

/**
 * Map a row's visible cells onto card areas. Explicit `meta.mobile.area`
 * wins; the remainder is derived from registry order + alignment.
 */
export function resolveCardAreas<TData>(
  cells: Cell<TData, unknown>[]
): CardAreas<TData> {
  const areas: CardAreas<TData> = { trailing: [], meta: [] }
  const unassigned: Cell<TData, unknown>[] = []

  for (const cell of cells) {
    const id = cell.column.id
    if (id === 'select' || id === 'expand') continue
    if (id === 'actions') {
      areas.actions = cell
      continue
    }

    const explicit = columnMeta(cell)?.mobile?.area
    if (explicit === 'hidden') continue
    if (explicit === 'title' && !areas.title) {
      areas.title = cell
      continue
    }
    if (explicit === 'subtitle' && !areas.subtitle) {
      areas.subtitle = cell
      continue
    }
    if (explicit === 'trailing') {
      areas.trailing.push(cell)
      continue
    }
    if (explicit === 'meta') {
      areas.meta.push(cell)
      continue
    }
    unassigned.push(cell)
  }

  for (const cell of unassigned) {
    if (columnMeta(cell)?.align === 'right') {
      if (areas.trailing.length === 0) areas.trailing.push(cell)
      else areas.meta.push(cell)
      continue
    }
    if (!areas.title) {
      areas.title = cell
      continue
    }
    if (!areas.subtitle) {
      areas.subtitle = cell
      continue
    }
    areas.meta.push(cell)
  }

  return areas
}

function cellLabel<TData>(cell: Cell<TData, unknown>): string {
  const header = cell.column.columnDef.header
  return typeof header === 'string' ? header : cell.column.id
}

function renderCell<TData>(cell: Cell<TData, unknown>): ReactNode {
  return flexRender(cell.column.columnDef.cell, cell.getContext())
}

function DataTableCard<TData>({
  row,
  onRowClick,
  enableExpanding,
  renderSubComponent,
}: {
  row: Row<TData>
  onRowClick?: (row: TData) => void
  enableExpanding: boolean
  renderSubComponent?: (props: { row: Row<TData> }) => ReactNode
}) {
  const areas = resolveCardAreas(row.getVisibleCells())
  const isSelected = row.getIsSelected()
  const isExpanded = enableExpanding && row.getIsExpanded()
  const canExpand = enableExpanding && !!renderSubComponent
  const isInteractive = typeof onRowClick === 'function' || canExpand

  const activate = () => {
    if (onRowClick) onRowClick(row.original)
    else if (canExpand) row.toggleExpanded()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isInteractive) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      activate()
    }
  }

  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? activate : undefined}
      onKeyDown={handleKeyDown}
      data-state={isSelected ? 'selected' : undefined}
      aria-selected={isSelected || undefined}
      aria-expanded={canExpand ? isExpanded : undefined}
      className={cn(
        'border-b border-[rgb(var(--border-secondary)/0.7)] last:border-b-0 px-4 py-3',
        isSelected && 'bg-[var(--mint-soft)] border-l-2 border-l-[var(--mint-border)]',
        isInteractive && [
          'cursor-pointer',
          focusRingInset,
          'active:bg-[rgb(var(--action-primary-bg)/0.06)]',
        ]
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {areas.title && (
            <div className="text-sm font-medium text-[rgb(var(--text-primary))]">
              {renderCell(areas.title)}
            </div>
          )}
          {areas.subtitle && (
            <div className="mt-0.5 text-xs text-[rgb(var(--text-secondary))]">
              {renderCell(areas.subtitle)}
            </div>
          )}
        </div>

        {areas.trailing.length > 0 && (
          <div className="flex flex-col items-end gap-1 text-right flex-shrink-0">
            {areas.trailing.map((cell) => (
              <div key={cell.id} className="text-sm text-[rgb(var(--text-primary))]">
                {renderCell(cell)}
              </div>
            ))}
          </div>
        )}

        {areas.actions && (
          <div
            className="flex-shrink-0 -mr-1"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {renderCell(areas.actions)}
          </div>
        )}
      </div>

      {areas.meta.length > 0 && (
        <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          {areas.meta.map((cell) => (
            <div key={cell.id} className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-2xs uppercase tracking-wider text-[rgb(var(--text-tertiary))] flex-shrink-0">
                {cellLabel(cell)}
              </span>
              <span className="text-xs text-[rgb(var(--text-primary))] min-w-0">
                {renderCell(cell)}
              </span>
            </div>
          ))}
        </div>
      )}

      {isExpanded && renderSubComponent && (
        <div className="mt-3 border-t border-[rgb(var(--border-secondary)/0.7)] pt-3">
          {renderSubComponent({ row })}
        </div>
      )}
    </div>
  )
}

export function DataTableCardList<TData>({
  rows,
  onRowClick,
  enableExpanding,
  renderSubComponent,
  isFetching,
}: {
  rows: Row<TData>[]
  onRowClick?: (row: TData) => void
  enableExpanding: boolean
  renderSubComponent?: (props: { row: Row<TData> }) => ReactNode
  isFetching?: boolean
}) {
  return (
    <div
      data-testid="dt-card-list"
      className={cn(isFetching && 'opacity-60 transition-opacity')}
    >
      {rows.map((row) => (
        <DataTableCard
          key={row.id}
          row={row}
          onRowClick={onRowClick}
          enableExpanding={enableExpanding}
          renderSubComponent={renderSubComponent}
        />
      ))}
    </div>
  )
}
