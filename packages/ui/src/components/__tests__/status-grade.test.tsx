import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { GradeRangeField, StatusBadge, type SelectOption } from '../../index'

describe('StatusBadge', () => {
  it('renders tone styling, a dot, and content', () => {
    render(
      <StatusBadge tone="success" dot>
        Paid
      </StatusBadge>
    )

    const badge = screen.getByText('Paid')
    expect(badge.className).toContain('--state-success-bg')
    expect(badge.className).toContain('--state-success-fg')
    // the leading dot is decorative
    expect(badge.querySelector('[aria-hidden="true"]')).toBeTruthy()
  })

  it('defaults to the neutral tone', () => {
    render(<StatusBadge>Draft</StatusBadge>)
    expect(screen.getByText('Draft').className).toContain('--background-tertiary')
  })
})

const gradeOptions: SelectOption[] = [
  { value: 'PK', label: 'PK' },
  { value: 'K', label: 'K' },
  { value: '12', label: '12' },
]

function GradeRangeHarness({ error }: { error?: string }) {
  const [from, setFrom] = useState<string | null>('K')
  const [to, setTo] = useState<string | null>('12')
  return (
    <GradeRangeField
      label="Grade range"
      options={gradeOptions}
      fromValue={from}
      toValue={to}
      onFromChange={setFrom}
      onToChange={setTo}
      error={error}
    />
  )
}

describe('GradeRangeField', () => {
  it('exposes two named selects under one labelled group', () => {
    render(<GradeRangeHarness />)

    expect(screen.getByRole('group', { name: 'Grade range' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'From grade' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'To grade' })).toBeTruthy()
  })

  it('updates the from value via the listbox', async () => {
    const user = userEvent.setup()
    render(<GradeRangeHarness />)

    await user.click(screen.getByRole('button', { name: 'From grade' }))
    await user.click(await screen.findByRole('option', { name: 'PK' }))
    expect(screen.getByRole('button', { name: 'From grade' }).textContent).toContain('PK')
  })

  it('renders a shared error region as an alert', () => {
    render(<GradeRangeHarness error="Pick a valid range" />)
    expect(screen.getByRole('alert').textContent).toBe('Pick a valid range')
  })
})
