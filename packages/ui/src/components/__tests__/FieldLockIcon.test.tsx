import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { FieldLockIcon } from '../FieldLockIcon'

describe('FieldLockIcon', () => {
  afterEach(cleanup)

  it('renders with the given reason as aria-label', () => {
    const { getByRole } = render(
      <FieldLockIcon reason="Locked during active academic year" />,
    )
    expect(getByRole('img').getAttribute('aria-label')).toBe(
      'Locked: Locked during active academic year',
    )
  })

  it('appends detail when provided', () => {
    const { getByRole } = render(
      <FieldLockIcon
        reason="Locked during active academic year"
        detail="Milos · 2083-84"
      />,
    )
    expect(getByRole('img').getAttribute('aria-label')).toBe(
      'Locked: Locked during active academic year — Milos · 2083-84',
    )
  })

  it('is keyboard-focusable', () => {
    const { getByRole } = render(<FieldLockIcon reason="Immutable" />)
    expect(getByRole('img').getAttribute('tabindex')).toBe('0')
  })
})
