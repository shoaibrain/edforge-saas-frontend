import { Fragment } from 'react'
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react'
import { Download } from 'lucide-react'
import type { Cell, Table } from '@tanstack/react-table'
import { cn, focusRingInset } from '../../utils'
import { DEFAULT_DATA_TABLE_LABELS } from './labels'
import type {
  DataTableExportFormat,
  DataTableExportOptions,
  DataTableLabels,
} from './types'

interface DataTableExportProps<TData> {
  table: Table<TData>
  options: DataTableExportOptions
  labels?: DataTableLabels
}

export function DataTableExport<TData>({
  table,
  options,
  labels,
}: DataTableExportProps<TData>) {
  const resolvedLabels = labels ?? DEFAULT_DATA_TABLE_LABELS
  const formats = options.formats?.length ? options.formats : (['csv'] as DataTableExportFormat[])

  const handleExport = (format: DataTableExportFormat, close: () => void) => {
    if (format === 'csv') {
      const csv = buildCsv(table)
      downloadBlob(csv, `${options.filename}.csv`, 'text/csv;charset=utf-8;')
    }
    close()
  }

  return (
    <Popover className="relative">
      <PopoverButton
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors',
          'border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-secondary))]',
          focusRingInset
        )}
        aria-label={resolvedLabels.export}
        title={resolvedLabels.export}
      >
        <Download className="w-3.5 h-3.5" />
        {resolvedLabels.export}
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
        <PopoverPanel className="absolute ef-inset-inline-end-0 z-50 mt-1 w-44 origin-top-right rounded-xl bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary)/0.35)] shadow-popover focus:outline-none overflow-hidden">
          {({ close }) => (
            <div className="py-1">
              {formats.map((format) => {
                const disabled = format === 'xlsx'
                return (
                  <button
                    key={format}
                    type="button"
                    onClick={() => !disabled && handleExport(format, close)}
                    disabled={disabled}
                    title={disabled ? resolvedLabels.xlsxUnavailable : undefined}
                    className={cn(
                      'block w-full px-3 py-2 text-start text-sm transition-colors',
                      'text-[rgb(var(--text-primary))]',
                      disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-[rgb(var(--background-secondary))]',
                      focusRingInset
                    )}
                  >
                    {resolvedLabels.exportFormat(format)}
                  </button>
                )
              })}
            </div>
          )}
        </PopoverPanel>
      </Transition>
    </Popover>
  )
}

// ============================================================================
// CSV BUILDER — uses filtered + sorted rows + currently visible columns
// ============================================================================

function buildCsv<TData>(table: Table<TData>): string {
  const visible = table
    .getVisibleLeafColumns()
    .filter((col) => col.id !== 'select' && col.id !== 'expand' && col.id !== 'actions')

  const headerRow = visible
    .map((col) => csvCell(headerLabel(col.id, col.columnDef.header)))
    .join(',')

  const dataRows = table.getFilteredRowModel().rows.map((row) =>
    row
      .getVisibleCells()
      .filter((cell) =>
        visible.some((c) => c.id === cell.column.id)
      )
      .map((cell) => csvCell(stringifyCell(cell)))
      .join(',')
  )

  return [headerRow, ...dataRows].join('\n')
}

function headerLabel(id: string, header: unknown): string {
  if (typeof header === 'string') return header
  return id
}

function stringifyCell<TData>(cell: Cell<TData, unknown>): string {
  const value = cell.getValue()
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (value instanceof Date) return value.toISOString()
  // Arrays / objects: best-effort JSON. Cells rendering custom React content
  // can still be exported by setting an explicit accessor that returns a
  // primitive — recommended for any column you want to round-trip.
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function csvCell(input: string): string {
  if (input == null) return ''
  const needsQuote = /[",\n\r]/.test(input)
  const escaped = input.replace(/"/g, '""')
  return needsQuote ? `"${escaped}"` : escaped
}

function downloadBlob(content: string, filename: string, mime: string): void {
  if (typeof window === 'undefined') return
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
