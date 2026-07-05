import { useMemo } from 'react'
import type { Column } from '@tanstack/react-table'
import { DEFAULT_DATA_TABLE_LABELS } from './labels'
import { FilterSelect, type FilterSelectOption } from './FilterSelect'
import type {
  DataTableColumnMeta,
  DataTableLabels,
  FacetedFilterOption,
} from './types'

interface DataTableFacetedFilterProps<TData> {
  column: Column<TData>
  title: string
  options: FacetedFilterOption[]
  labels?: DataTableLabels
}

/**
 * DataTableFacetedFilter — a client-column facet rendered through the shared
 * {@link FilterSelect}. Feeds it the column's live faceted counts + current
 * selection; selecting writes back via TanStack's `setFilterValue` (so the
 * selection persists per `tableId` alongside the other column filters).
 *
 * This is the multi-select consumer of FilterSelect; the toolbar's status
 * presets are the single-select one. Both share one trigger + listbox so every
 * facet across every table reads identically.
 */
export function DataTableFacetedFilter<TData>({
  column,
  title,
  options,
  labels,
}: DataTableFacetedFilterProps<TData>) {
  const resolvedLabels = labels ?? DEFAULT_DATA_TABLE_LABELS
  const selectedValues = (column.getFilterValue() as string[] | undefined) ?? []

  const meta = column.columnDef.meta as DataTableColumnMeta | undefined

  // Live per-value counts driven by TanStack's faceted unique values. Map keys
  // are the underlying cell values — coerced to string to match option values.
  const facetedCounts = useMemo(() => {
    const map = column.getFacetedUniqueValues?.()
    const result = new Map<string, number>()
    if (!map) return result
    map.forEach((count, value) => {
      if (Array.isArray(value)) {
        // Array-valued cells (e.g. gradeLevels: ['G9','G10']) contribute one
        // count to each member so the dropdown count matches what users see.
        value.forEach((v) => {
          const k = String(v)
          result.set(k, (result.get(k) ?? 0) + count)
        })
        return
      }
      result.set(String(value), count)
    })
    return result
  }, [column])

  const filterSelectOptions: FilterSelectOption[] = options.map((option) => ({
    value: option.value,
    label: meta?.facetLabelMap ? meta.facetLabelMap(option.value) : option.label,
    count: facetedCounts.get(option.value) ?? 0,
    tone: option.tone,
  }))

  return (
    <FilterSelect
      label={title}
      options={filterSelectOptions}
      value={selectedValues}
      onChange={(next) => column.setFilterValue(next.length > 0 ? next : undefined)}
      labels={resolvedLabels}
    />
  )
}
