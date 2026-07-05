/**
 * FilterSelect — the shared unified-toolbar facet control. Replaces the
 * always-mounted status preset row with one quiet `label · value` trigger +
 * listbox. These tests lock the contract: trigger grammar, multi/single
 * select, faceted counts, zero-count dimming, keyboard, and focus return.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import { useState } from 'react'
import { FilterSelect, type FilterSelectOption } from '../FilterSelect'

const OPTIONS: FilterSelectOption[] = [
  { value: 'completed', label: 'Completed', count: 12, tone: 'success' },
  { value: 'pending', label: 'Pending', count: 0, tone: 'warning' },
  { value: 'failed', label: 'Failed', count: 0, tone: 'danger' },
  { value: 'cancelled', label: 'Cancelled', count: 3, tone: 'neutral' },
  { value: 'refunded', label: 'Refunded', count: 1, tone: 'info' },
]

function Harness({
  multiple = true,
  initial = [],
  onChangeSpy,
}: {
  multiple?: boolean
  initial?: string[]
  onChangeSpy?: (v: string[]) => void
}) {
  const [value, setValue] = useState<string[]>(initial)
  return (
    <FilterSelect
      label="Status"
      options={OPTIONS}
      value={value}
      multiple={multiple}
      onChange={(next) => {
        setValue(next)
        onChangeSpy?.(next)
      }}
    />
  )
}

afterEach(cleanup)

const trigger = () => screen.getByRole('button', { name: 'Status filter' })

describe('FilterSelect — trigger grammar', () => {
  it('reads "Status · All" when nothing is selected', () => {
    render(<Harness />)
    const t = trigger()
    expect(t.textContent).toContain('Status')
    expect(t.textContent).toContain('All')
    // No clear affordance while empty.
    expect(within(t).queryByLabelText('Clear filter')).toBeNull()
  })

  it('reads the single selected label and exposes an inline clear', () => {
    render(<Harness initial={['completed']} />)
    const t = trigger()
    expect(t.textContent).toContain('Completed')
    expect(within(t).getByLabelText('Clear filter')).toBeTruthy()
  })

  it('collapses multi-selection to "<first> +N"', () => {
    render(<Harness initial={['completed', 'refunded']} />)
    expect(trigger().textContent).toContain('Completed +1')
  })
})

describe('FilterSelect — menu', () => {
  it('opens a role=listbox with tone dot + label + tabular count per option', () => {
    render(<Harness />)
    fireEvent.click(trigger())
    const listbox = screen.getByRole('listbox', { name: /filter by status/i })
    expect(listbox).toBeTruthy()
    const options = within(listbox).getAllByRole('option')
    expect(options).toHaveLength(5)
    const completed = within(listbox).getByRole('option', { name: /Completed/ })
    expect(completed.textContent).toContain('12')
  })

  it('keeps zero-count options listed but dimmed (never hidden)', () => {
    render(<Harness />)
    fireEvent.click(trigger())
    const failed = screen.getByRole('option', { name: /Failed/ })
    // Still present…
    expect(failed).toBeTruthy()
    // …and visually dimmed.
    expect(failed.className).toContain('opacity-40')
  })

  it('multi-select toggles values and keeps the menu open', () => {
    const onChangeSpy = vi.fn()
    render(<Harness onChangeSpy={onChangeSpy} />)
    fireEvent.click(trigger())
    fireEvent.click(screen.getByRole('option', { name: /Completed/ }))
    expect(onChangeSpy).toHaveBeenLastCalledWith(['completed'])
    // Menu is still open — second pick accumulates.
    fireEvent.click(screen.getByRole('option', { name: /Cancelled/ }))
    expect(onChangeSpy).toHaveBeenLastCalledWith(['completed', 'cancelled'])
    expect(screen.queryByRole('listbox')).toBeTruthy()
  })

  it('single-select replaces the value and closes the menu', () => {
    const onChangeSpy = vi.fn()
    render(<Harness multiple={false} onChangeSpy={onChangeSpy} />)
    fireEvent.click(trigger())
    fireEvent.click(screen.getByRole('option', { name: /Completed/ }))
    expect(onChangeSpy).toHaveBeenLastCalledWith(['completed'])
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('footer Clear resets the selection', () => {
    const onChangeSpy = vi.fn()
    render(<Harness initial={['completed']} onChangeSpy={onChangeSpy} />)
    fireEvent.click(trigger())
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onChangeSpy).toHaveBeenLastCalledWith([])
  })
})

describe('FilterSelect — clear + keyboard', () => {
  it('inline ✕ clears without reopening', () => {
    const onChangeSpy = vi.fn()
    render(<Harness initial={['completed']} onChangeSpy={onChangeSpy} />)
    fireEvent.click(within(trigger()).getByLabelText('Clear filter'))
    expect(onChangeSpy).toHaveBeenLastCalledWith([])
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('focuses an option on open and moves focus with ArrowDown', () => {
    render(<Harness />)
    fireEvent.click(trigger())
    const options = screen.getAllByRole('option')
    expect(document.activeElement).toBe(options[0])
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'ArrowDown' })
    expect(document.activeElement).toBe(options[1])
  })

  it('Escape closes the menu and returns focus to the trigger', () => {
    render(<Harness />)
    const t = trigger()
    fireEvent.click(t)
    expect(screen.getByRole('listbox')).toBeTruthy()
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(document.activeElement).toBe(t)
  })
})
