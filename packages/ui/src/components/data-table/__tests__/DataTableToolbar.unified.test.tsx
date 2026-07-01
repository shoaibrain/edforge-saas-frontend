/**
 * Unified TableToolbar building blocks — unit tests (S1).
 *
 * The unified toolbar docks status presets (TablePresetTabs) and swaps in a
 * bulk-action bar (TableBulkBar) on selection with the same footprint. These
 * are the toolbar's new, config-driven pieces; the existing DataTable data
 * wiring is covered by DataTable.pagination.test.tsx and stays intact.
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TablePresetTabs } from '../TablePresetTabs'
import { TableBulkBar } from '../TableBulkBar'
import type { BulkAction } from '../types'

const presets = [
  { value: 'all', label: 'All', count: 255 },
  { value: 'active', label: 'Active', count: 235 },
  { value: 'atrisk', label: 'At-risk', count: 20 },
  { value: 'pending', label: 'Pending', count: 0 },
]

describe('TablePresetTabs', () => {
  it('renders the docked status presets from the presets config', () => {
    render(<TablePresetTabs presets={presets} active="all" onChange={() => {}} />)
    expect(screen.getAllByRole('tab')).toHaveLength(4)
    expect(screen.getByRole('tablist', { name: 'Status presets' })).toBeTruthy()
  })

  it('marks the active preset and shows per-preset counts', () => {
    render(<TablePresetTabs presets={presets} active="atrisk" onChange={() => {}} />)
    const active = screen.getByRole('tab', { name: /At-risk/ })
    expect(active.getAttribute('aria-selected')).toBe('true')
    expect(active.getAttribute('tabindex')).toBe('0')
    expect(screen.getByRole('tab', { name: /All/ }).getAttribute('tabindex')).toBe('-1')
    expect(active.textContent).toContain('20')
  })

  it('calls onChange with the clicked preset value', () => {
    const onChange = vi.fn()
    render(<TablePresetTabs presets={presets} active="all" onChange={onChange} />)
    fireEvent.click(screen.getByRole('tab', { name: /Active/ }))
    expect(onChange).toHaveBeenCalledWith('active')
  })

  it('supports roving keyboard navigation across presets', () => {
    render(<TablePresetTabs presets={presets} active="all" onChange={() => {}} />)
    const tabs = screen.getAllByRole('tab')
    tabs[0].focus()
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' })
    expect(document.activeElement).toBe(tabs[1])
    fireEvent.keyDown(tabs[1], { key: 'End' })
    expect(document.activeElement).toBe(tabs[3])
  })
})

describe('TableBulkBar', () => {
  interface Row {
    id: string
  }
  const rows: Row[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  const actions: BulkAction<Row>[] = [
    { id: 'archive', label: 'Archive', tone: 'critical', onRun: vi.fn() },
  ]

  it('renders the selection summary and bulk actions', () => {
    render(<TableBulkBar count={3} selectedRows={rows} onClear={() => {}} actions={actions} />)
    expect(screen.getByText('3 selected')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Archive' })).toBeTruthy()
  })

  it('occupies the same min-height footprint as the toolbar (no layout shift)', () => {
    render(<TableBulkBar count={2} selectedRows={rows} onClear={() => {}} actions={actions} />)
    expect(screen.getByRole('toolbar').className).toContain('min-h-9')
  })

  it('clears the selection and runs an action with the selected rows', () => {
    const onClear = vi.fn()
    const onRun = vi.fn()
    render(
      <TableBulkBar
        count={3}
        selectedRows={rows}
        onClear={onClear}
        actions={[{ id: 'archive', label: 'Archive', tone: 'critical', onRun }]}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /clear selection/i }))
    expect(onClear).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }))
    expect(onRun).toHaveBeenCalledWith(rows)
  })
})
