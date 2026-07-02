import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { DataTable } from '../DataTable'
import type { ColumnDef } from '@tanstack/react-table'

interface Row {
  id: string
  name: string
}

const columns: ColumnDef<Row, unknown>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
]

const data: Row[] = [
  { id: 'r1', name: 'Row 1' },
  { id: 'r2', name: 'Row 2' },
]

afterEach(cleanup)

describe('DataTableToolbar — responsive layout', () => {
  it('establishes a container-query context on the toolbar row', () => {
    const { container } = render(
      <DataTable<Row> columns={columns} data={data} searchPlaceholder="Search" />,
    )
    // The toolbar root opts into container queries so controls collapse based on
    // the toolbar's own width (not the viewport).
    expect(container.querySelector('[class*="@container"]')).toBeTruthy()
  })

  it('folds the density control into a single "View" menu', () => {
    const { getByText, queryByLabelText, getByLabelText } = render(
      <DataTable<Row>
        columns={columns}
        data={data}
        searchPlaceholder="Search"
        enableColumnVisibility
        enableDensityToggle
        density="comfortable"
      />,
    )
    // Density is NOT an always-visible inline control anymore…
    expect(queryByLabelText('Row density')).toBeNull()
    // …it lives inside the "View" menu.
    fireEvent.click(getByText('View'))
    expect(getByLabelText('Row density')).toBeTruthy()
    expect(getByLabelText('Comfortable')).toBeTruthy()
  })

  it('renders secondary controls behind a single "More filters" overflow', () => {
    const { getAllByText, getByText, queryByText } = render(
      <DataTable<Row>
        columns={columns}
        data={data}
        searchPlaceholder="Search"
        overflowFilters={<div>Status control</div>}
        overflowLabel="More filters"
      />,
    )
    // Exactly one overflow trigger; its content is hidden until opened.
    expect(getAllByText('More filters')).toHaveLength(1)
    expect(queryByText('Status control')).toBeNull()
    fireEvent.click(getByText('More filters'))
    expect(getByText('Status control')).toBeTruthy()
  })

  it('foldFacets keeps the first facet inline and moves the rest into "More filters"', () => {
    const facetCols: ColumnDef<Row, unknown>[] = [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: 'Name' },
      { id: 'type', accessorKey: 'name', header: 'Type', enableColumnFilter: true },
      { id: 'term', accessorKey: 'name', header: 'Term', enableColumnFilter: true },
    ]
    const { getByText, getByLabelText, queryByLabelText } = render(
      <DataTable<Row>
        columns={facetCols}
        data={data}
        searchPlaceholder="Search"
        foldFacets
        facets={[
          { columnId: 'type', title: 'Type', options: [{ label: 'Final', value: 'final' }] },
          { columnId: 'term', title: 'Term', options: [{ label: 'Term 1', value: 't1' }] },
        ]}
      />,
    )
    // First facet trigger inline; the second is folded behind "More filters".
    expect(getByLabelText('Type filter')).toBeTruthy()
    expect(queryByLabelText('Term filter')).toBeNull()
    fireEvent.click(getByText('More filters'))
    expect(getByLabelText('Term filter')).toBeTruthy()
  })

  it('shows the primary filter and offers the overflow fold target', () => {
    const { getByText, getAllByText } = render(
      <DataTable<Row>
        columns={columns}
        data={data}
        searchPlaceholder="Search"
        primaryFilter={<div>Grade control</div>}
        overflowLabel="More filters"
      />,
    )
    // Primary filter renders inline (the folded panel copy stays unmounted while
    // the popover is closed).
    expect(getByText('Grade control')).toBeTruthy()
    // A single overflow trigger exists to absorb it on narrow widths.
    expect(getAllByText('More filters')).toHaveLength(1)
  })
})
