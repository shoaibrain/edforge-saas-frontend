/**
 * DataTableMoreFilters — unit tests (unified-toolbar "More filters" popover).
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DataTableMoreFilters } from '../DataTableMoreFilters'

describe('DataTableMoreFilters', () => {
  it('renders the trigger with a label', () => {
    render(
      <DataTableMoreFilters label="More filters">
        <div data-testid="secondary" />
      </DataTableMoreFilters>,
    )
    expect(screen.getByRole('button', { name: /more filters/i })).toBeTruthy()
  })

  it('shows an active-count badge when there are active secondary filters', () => {
    render(
      <DataTableMoreFilters label="More filters" activeCount={2}>
        <div />
      </DataTableMoreFilters>,
    )
    const trigger = screen.getByRole('button', { name: /more filters/i })
    expect(trigger.textContent).toContain('2')
  })

  it('reveals the secondary controls when opened', () => {
    render(
      <DataTableMoreFilters label="More filters">
        <div data-testid="secondary">Status</div>
      </DataTableMoreFilters>,
    )
    expect(screen.queryByTestId('secondary')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /more filters/i }))
    expect(screen.getByTestId('secondary')).toBeTruthy()
  })

  it('calls onClear from the footer when filters are active', () => {
    const onClear = vi.fn()
    render(
      <DataTableMoreFilters label="More filters" activeCount={1} onClear={onClear} clearLabel="Clear">
        <div data-testid="secondary" />
      </DataTableMoreFilters>,
    )
    fireEvent.click(screen.getByRole('button', { name: /more filters/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onClear).toHaveBeenCalled()
  })
})
