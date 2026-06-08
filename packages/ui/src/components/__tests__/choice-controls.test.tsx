import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Checkbox, Field, RadioGroup, Switch } from '../forms'

describe('choice form controls', () => {
  it('toggles Checkbox with label association', () => {
    render(<Checkbox label="Enable notifications" />)

    const checkbox = screen.getByRole('checkbox', { name: 'Enable notifications' }) as HTMLInputElement
    expect(checkbox.checked).toBe(false)
    fireEvent.click(screen.getByText('Enable notifications'))
    expect(checkbox.checked).toBe(true)
  })

  it('supports Field wiring for invalid checkboxes', () => {
    render(
      <Field label="Terms" error="You must accept terms">
        <Checkbox />
      </Field>
    )

    const checkbox = screen.getByRole('checkbox', { name: /Terms/ })
    expect(checkbox.getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByRole('alert').textContent).toBe('You must accept terms')
  })

  it('selects RadioGroup options', () => {
    function Harness() {
      const [value, setValue] = useState('high')
      return (
        <RadioGroup
          name="school-type"
          value={value}
          onChange={setValue}
          options={[
            { value: 'elementary', label: 'Elementary' },
            { value: 'high', label: 'High School' },
          ]}
        />
      )
    }

    render(<Harness />)
    fireEvent.click(screen.getByRole('radio', { name: 'Elementary' }))
    expect((screen.getByRole('radio', { name: 'Elementary' }) as HTMLInputElement).checked).toBe(true)
  })

  it('toggles Switch state', () => {
    function Harness() {
      const [checked, setChecked] = useState(false)
      return <Switch checked={checked} onChange={setChecked} label="Auto-sync calendars" />
    }

    render(<Harness />)
    const toggle = screen.getByRole('switch', { name: 'Auto-sync calendars' })
    expect(toggle.getAttribute('aria-checked')).toBe('false')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-checked')).toBe('true')
  })
})
