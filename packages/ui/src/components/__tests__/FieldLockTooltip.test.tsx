import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { FieldLockTooltip } from '../FieldLockTooltip'

describe('FieldLockTooltip', () => {
  afterEach(cleanup)

  it('renders a lock icon with a default aria-label', () => {
    const { getByRole } = render(<FieldLockTooltip />)
    const wrapper = getByRole('img')
    expect(wrapper.getAttribute('aria-label')).toMatch(/locked: immutable/i)
  })

  it('uses the provided reason in the aria-label', () => {
    const { getByRole } = render(
      <FieldLockTooltip reason="Locked during active academic year" />,
    )
    const wrapper = getByRole('img')
    expect(wrapper.getAttribute('aria-label')).toBe(
      'Locked: Locked during active academic year',
    )
  })

  it('is keyboard-focusable', () => {
    const { getByRole } = render(<FieldLockTooltip />)
    const wrapper = getByRole('img')
    expect(wrapper.getAttribute('tabindex')).toBe('0')
  })
})
