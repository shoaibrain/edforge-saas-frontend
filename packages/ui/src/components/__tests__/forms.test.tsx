import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Field, Input, Textarea } from '../forms'

describe('form primitives', () => {
  it('wires Field label, helper text, and Input ARIA attributes', () => {
    render(
      <Field label="School name" helperText="Use the public institution name." required>
        <Input placeholder="Sunrise Academy" />
      </Field>
    )

    const input = screen.getByRole('textbox', { name: /School name/ })
    expect(input.getAttribute('placeholder')).toBe('Sunrise Academy')
    expect(input.getAttribute('aria-describedby')).toContain('helper')
    expect(screen.getByText('Use the public institution name.')).toBeTruthy()
  })

  it('prioritizes errors over helper text and marks controls invalid', () => {
    render(
      <Field label="School code" helperText="Two to ten characters." error="School code is required">
        <Input />
      </Field>
    )

    const input = screen.getByRole('textbox', { name: /School code/ })
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-describedby')).toContain('error')
    expect(screen.queryByText('Two to ten characters.')).toBeNull()
    expect(screen.getByRole('alert').textContent).toBe('School code is required')
  })

  it('passes disabled and read-only state from Field to Input', () => {
    render(
      <Field label="IEMIS code" disabled readOnly lockedReason="Locked after school creation.">
        <Input />
      </Field>
    )

    const input = screen.getByRole('textbox', { name: /IEMIS code/ })
    expect((input as HTMLInputElement).disabled).toBe(true)
    expect(input.hasAttribute('readonly')).toBe(true)
    expect(screen.getByText('Locked after school creation.')).toBeTruthy()
  })

  it('renders Textarea character count and preserves label wiring', () => {
    render(
      <Field label="Description">
        <Textarea maxLength={20} showCharacterCount defaultValue="Initial" />
      </Field>
    )

    const textarea = screen.getByRole('textbox', { name: /Description/ })
    expect(screen.getByText('7/20')).toBeTruthy()

    fireEvent.change(textarea, { target: { value: 'Updated value' } })
    expect(screen.getByText('13/20')).toBeTruthy()
  })
})
