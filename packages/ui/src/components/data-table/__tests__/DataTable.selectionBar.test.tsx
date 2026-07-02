import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { DataTable } from '../DataTable'
import { SelectionContextBar } from '../../header-zone/SelectionContextBar'
import type { ColumnDef } from '@tanstack/react-table'

afterEach(cleanup)

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

describe('DataTable — ⑨ selectionBar swap', () => {
  it('morphs the toolbar into the selection bar in place when rows are selected', () => {
    const { getByRole, queryByPlaceholderText } = render(
      <DataTable<Row>
        columns={columns}
        data={data}
        getRowId={(r) => r.id}
        enableRowSelection
        searchPlaceholder="Search"
        rowSelection={{ r1: true, r2: true }}
        onRowSelectionChange={() => {}}
        selectionBar={
          <SelectionContextBar selectedCount={2} onClear={vi.fn()} actions={[]} />
        }
      />,
    )
    // The selection bar owns the toolbar footprint…
    expect(getByRole('toolbar', { name: 'Selection actions' })).toBeTruthy()
    // …replacing the default toolbar contents (same footprint, no stacking).
    expect(queryByPlaceholderText('Search')).toBeNull()
  })

  it('keeps the default toolbar and no floating pill when nothing is selected', () => {
    const { getByPlaceholderText, queryByRole } = render(
      <DataTable<Row>
        columns={columns}
        data={data}
        getRowId={(r) => r.id}
        enableRowSelection
        searchPlaceholder="Search"
        rowSelection={{}}
        onRowSelectionChange={() => {}}
        selectionBar={
          <SelectionContextBar selectedCount={0} onClear={vi.fn()} actions={[]} />
        }
      />,
    )
    expect(getByPlaceholderText('Search')).toBeTruthy()
    expect(queryByRole('toolbar', { name: 'Selection actions' })).toBeNull()
  })

  it('suppresses the legacy floating pill when selectionBar is provided alongside bulkActions', () => {
    const { queryByText } = render(
      <DataTable<Row>
        columns={columns}
        data={data}
        getRowId={(r) => r.id}
        enableRowSelection
        searchPlaceholder="Search"
        rowSelection={{ r1: true }}
        onRowSelectionChange={() => {}}
        bulkActions={[{ id: 'x', label: 'Legacy pill action', onRun: vi.fn() }]}
        selectionBar={
          <SelectionContextBar selectedCount={1} onClear={vi.fn()} actions={[]} />
        }
      />,
    )
    expect(queryByText('Legacy pill action')).toBeNull()
  })
})
