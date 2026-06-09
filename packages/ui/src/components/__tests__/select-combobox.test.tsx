import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Combobox, Select, type SelectOption } from '../forms'

const schoolOptions: SelectOption[] = [
  { value: 'elementary', label: 'Elementary' },
  { value: 'middle', label: 'Middle', disabled: true },
  { value: 'high', label: 'High School', description: 'Grades 9–12' },
]

function SelectHarness() {
  const [value, setValue] = useState<string | null>(null)
  return (
    <Select
      label="School type"
      value={value}
      onChange={setValue}
      options={schoolOptions}
      placeholder="Choose a school type"
    />
  )
}

function ComboboxHarness() {
  const [value, setValue] = useState<string | null>(null)
  return (
    <Combobox
      label="Parent district"
      value={value}
      onChange={setValue}
      options={[
        { value: 'north', label: 'North District' },
        { value: 'south', label: 'South District' },
      ]}
      placeholder="Search districts"
    />
  )
}

describe('Select', () => {
  it('opens with keyboard/mouse and selects an enabled option', async () => {
    const user = userEvent.setup()
    render(<SelectHarness />)

    const trigger = screen.getByRole('button', { name: /School type/ })
    await user.click(trigger)
    await user.click(await screen.findByRole('option', { name: /High School/ }))

    expect(trigger.textContent).toContain('High School')
  })

  it('sizes the dropdown panel to its content, not the trigger width', async () => {
    // Guards the narrow-trigger truncation bug: a fit-content trigger (e.g. the
    // wizard "Address Type" select) must not clip option labels. The panel grows
    // to fit content (w-max) while staying at least as wide as the trigger
    // (min-w-[var(--button-width)], the Headless UI v2 anchor var) — never a
    // plain w-full that locks to a narrow trigger.
    const user = userEvent.setup()
    render(<SelectHarness />)

    await user.click(screen.getByRole('button', { name: /School type/ }))
    const panel = screen.getByRole('listbox')
    expect(panel.className).toContain('w-max')
    expect(panel.className).toContain('min-w-[var(--button-width)]')
    expect(panel.className.split(/\s+/)).not.toContain('w-full')
  })

  it('applies className to the control wrapper even without a label', () => {
    // Label-less Selects (aria-labelled filters/action menus) must still honor
    // className for sizing — the no-label branch previously dropped it.
    render(
      <Select
        aria-label="Filter"
        className="w-44"
        value={null}
        onChange={() => undefined}
        options={schoolOptions}
      />
    )
    const trigger = screen.getByRole('button', { name: /Filter/ })
    expect(trigger.parentElement?.className).toContain('w-44')
  })

  it('renders invalid field state and error message', () => {
    render(
      <Select
        label="Calendar system"
        value={null}
        onChange={() => undefined}
        options={[]}
        error="Calendar system is required"
      />
    )

    const trigger = screen.getByRole('button', { name: /Calendar system/ })
    expect(trigger.getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByRole('alert').textContent).toBe('Calendar system is required')
  })
})

describe('Combobox', () => {
  it('filters options and selects the matching result', async () => {
    const user = userEvent.setup()
    render(<ComboboxHarness />)

    const input = screen.getByRole('combobox', { name: /Parent district/ })
    await user.type(input, 'South')
    await user.click(await screen.findByRole('option', { name: /South District/ }))

    expect((input as HTMLInputElement).value).toBe('South District')
  })

  it('renders an empty filtered state', async () => {
    const user = userEvent.setup()
    render(<ComboboxHarness />)

    await user.type(screen.getByRole('combobox', { name: /Parent district/ }), 'zzz')
    expect(await screen.findByText('No options match that search.')).toBeTruthy()
  })
})
