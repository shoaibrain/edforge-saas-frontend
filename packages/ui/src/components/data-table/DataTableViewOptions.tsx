import { Fragment } from 'react'
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react'
import { SlidersHorizontal, Rows3, AlignJustify } from 'lucide-react'
import type { Table } from '@tanstack/react-table'
import { cn, focusRingInset } from '../../utils'
import { DEFAULT_DATA_TABLE_LABELS } from './labels'
import type { DataTableDensity, DataTableLabels } from './types'

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
  labels?: DataTableLabels
  /** Row density (folded into this menu when a toggle is enabled). */
  density?: DataTableDensity
  onDensityChange?: (next: DataTableDensity) => void
  enableDensityToggle?: boolean
}

/**
 * The toolbar's single "View" menu — table-display controls (row density +
 * column visibility) consolidated behind one trigger. Folding density in here
 * (instead of a separate always-visible toggle) keeps the toolbar's right
 * cluster to two controls and reads cleaner at every width.
 */
export function DataTableViewOptions<TData>({
  table,
  labels,
  density,
  onDensityChange,
  enableDensityToggle,
}: DataTableViewOptionsProps<TData>) {
  const resolvedLabels = labels ?? DEFAULT_DATA_TABLE_LABELS
  const columns = table.getAllColumns().filter((col) => col.getCanHide())

  const showDensity = !!(enableDensityToggle && density && onDensityChange)
  const showColumns = columns.length > 0
  if (!showDensity && !showColumns) return null

  return (
    <Popover className="relative">
      <PopoverButton className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-secondary))] transition-colors">
        <SlidersHorizontal className="w-3.5 h-3.5" />
        {resolvedLabels.viewOptions}
      </PopoverButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <PopoverPanel className="absolute right-0 z-50 mt-1 w-52 origin-top-right rounded-xl bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary)/0.35)] shadow-lg focus:outline-none overflow-hidden">
          {showDensity && (
            <div className="px-3 py-2.5 border-b border-[rgb(var(--border-secondary))]">
              <span className="text-xs font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                {resolvedLabels.rowDensity}
              </span>
              <div role="group" aria-label={resolvedLabels.rowDensity} className="mt-2 grid grid-cols-2 gap-1">
                <DensityOption
                  active={density === 'comfortable'}
                  onClick={() => onDensityChange?.('comfortable')}
                  label={resolvedLabels.comfortableDensity}
                  title={resolvedLabels.comfortableDensityTitle}
                >
                  <Rows3 className="w-3.5 h-3.5" />
                </DensityOption>
                <DensityOption
                  active={density === 'compact'}
                  onClick={() => onDensityChange?.('compact')}
                  label={resolvedLabels.compactDensity}
                  title={resolvedLabels.compactDensityTitle}
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </DensityOption>
              </div>
            </div>
          )}

          {showColumns && (
            <>
              <div className="px-3 py-2 border-b border-[rgb(var(--border-secondary))]">
                <span className="text-xs font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                  {resolvedLabels.toggleColumns}
                </span>
              </div>
              <div className="py-1 max-h-64 overflow-y-auto">
                {columns.map((column) => (
                  <label
                    key={column.id}
                    className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-[rgb(var(--background-secondary))] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                      className={`w-3.5 h-3.5 rounded border-[rgb(var(--border-primary))] text-[rgb(var(--action-secondary-fg))] mr-2.5 ${focusRingInset}`}
                    />
                    <span className="text-[rgb(var(--text-primary))] capitalize">
                      {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                    </span>
                  </label>
                ))}
              </div>
            </>
          )}
        </PopoverPanel>
      </Transition>
    </Popover>
  )
}

function DensityOption({
  active,
  onClick,
  label,
  title,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors',
        focusRingInset,
        active
          ? 'border-[var(--mint-border)] bg-[var(--mint-soft)] text-[rgb(var(--text-primary))]'
          : 'border-[rgb(var(--border-primary)/0.35)] bg-transparent text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-secondary))]',
      )}
    >
      {children}
      {label}
    </button>
  )
}
