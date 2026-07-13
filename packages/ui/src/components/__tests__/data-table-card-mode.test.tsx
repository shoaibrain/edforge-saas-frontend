/**
 * DataTable phone card mode — the <table> ↔ card-list branch, area mapping,
 * interaction contract, and phone pagination.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '../data-table/DataTable'
import {
  createSelectColumn,
  createActionsColumn,
} from '../data-table/column-helpers'

const originalMatchMedia = window.matchMedia

function setViewportWidth(width: number) {
  window.matchMedia = ((query: string) => {
    const min = query.match(/\(min-width:\s*(\d+(?:\.\d+)?)px\)/)
    const max = query.match(/\(max-width:\s*(\d+(?:\.\d+)?)px\)/)
    let matches = false
    if (min || max) {
      matches =
        (!min || width >= Number(min[1])) && (!max || width <= Number(max[1]))
    }
    return {
      matches,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }
  }) as typeof window.matchMedia
}

afterEach(() => {
  window.matchMedia = originalMatchMedia
})

interface Person {
  id: string
  name: string
  role: string
  status: string
  lastActive: string
}

const DATA: Person[] = [
  { id: '1', name: 'Aarav Sharma', role: 'Teacher', status: 'Active', lastActive: '2d ago' },
  { id: '2', name: 'Binita Rai', role: 'Principal', status: 'Invited', lastActive: '5h ago' },
]

function buildColumns(onAction: () => void): ColumnDef<Person, unknown>[] {
  return [
    createSelectColumn<Person>(),
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'role', header: 'Role' },
    {
      accessorKey: 'status',
      header: 'Status',
      meta: { mobile: { area: 'trailing' } },
    },
    { accessorKey: 'lastActive', header: 'Last active' },
    createActionsColumn<Person>({
      cell: () => (
        <button type="button" onClick={onAction}>
          Row actions
        </button>
      ),
    }),
  ]
}

describe('DataTable card mode (phone)', () => {
  it('renders cards instead of the table; select column hides; mapping holds', () => {
    setViewportWidth(375)
    render(
      <DataTable
        columns={buildColumns(() => undefined)}
        data={DATA}
        getRowId={(r) => r.id}
        enableRowSelection
      />
    )

    expect(screen.queryByRole('grid')).toBeNull()
    const list = screen.getByTestId('dt-card-list')
    expect(within(list).queryAllByRole('checkbox')).toHaveLength(0)

    // title (name), subtitle (role), trailing (status via meta.mobile),
    // meta line (lastActive with its column label)
    expect(within(list).getByText('Aarav Sharma')).toBeTruthy()
    expect(within(list).getByText('Teacher')).toBeTruthy()
    expect(within(list).getByText('Active')).toBeTruthy()
    expect(within(list).getAllByText('Last active').length).toBeGreaterThan(0)
    expect(within(list).getByText('2d ago')).toBeTruthy()
  })

  it('card tap fires onRowClick; the actions cell does not', () => {
    setViewportWidth(375)
    const onRowClick = vi.fn()
    const onAction = vi.fn()
    render(
      <DataTable
        columns={buildColumns(onAction)}
        data={DATA}
        getRowId={(r) => r.id}
        onRowClick={onRowClick}
      />
    )

    fireEvent.click(screen.getByText('Aarav Sharma'))
    expect(onRowClick).toHaveBeenCalledWith(DATA[0])

    onRowClick.mockClear()
    fireEvent.click(screen.getAllByRole('button', { name: 'Row actions' })[0])
    expect(onAction).toHaveBeenCalled()
    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('phone pagination: Prev/Next only — no page numbers, no page-size select', () => {
    setViewportWidth(375)
    render(
      <DataTable
        columns={buildColumns(() => undefined)}
        data={DATA}
        getRowId={(r) => r.id}
        pagination={{ pageSize: 1 }}
      />
    )

    expect(screen.getByRole('button', { name: /next/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /prev/i })).toBeTruthy()
    // No numbered page buttons, no rows-per-page select
    expect(screen.queryByRole('button', { name: '1' })).toBeNull()
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('desktop renders the <table> (regression guard)', () => {
    setViewportWidth(1280)
    render(
      <DataTable
        columns={buildColumns(() => undefined)}
        data={DATA}
        getRowId={(r) => r.id}
      />
    )
    expect(screen.getByRole('grid')).toBeTruthy()
    expect(screen.queryByTestId('dt-card-list')).toBeNull()
  })
})
