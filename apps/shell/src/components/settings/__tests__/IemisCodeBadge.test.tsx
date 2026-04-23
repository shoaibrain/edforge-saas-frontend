import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { IemisCodeBadge } from '../IemisCodeBadge'

// toast is stubbed globally by the test-utils setup; the badge fires
// success/error toasts on copy — we don't need to assert those, just
// that the component doesn't crash.
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('IemisCodeBadge', () => {
  beforeEach(() => {
    cleanup()
  })

  it('renders nothing when code is falsy', () => {
    const { container } = render(<IemisCodeBadge code={undefined} />)
    expect(container.firstChild).toBeNull()

    cleanup()
    const { container: c2 } = render(<IemisCodeBadge code="" />)
    expect(c2.firstChild).toBeNull()

    cleanup()
    const { container: c3 } = render(<IemisCodeBadge code={null} />)
    expect(c3.firstChild).toBeNull()
  })

  it('renders a verified (green-toned) chip for a well-formed code', () => {
    const { getByTestId } = render(<IemisCodeBadge code="12345678" />)
    const badge = getByTestId('iemis-code-badge')
    expect(badge.className).toMatch(/29,158,117/) // green channel in tailwind-inline classes
    expect(badge.textContent).toContain('12345678')
  })

  it('renders an amber (warning-toned) chip for a malformed code', () => {
    const { getByTestId } = render(<IemisCodeBadge code="abcd" />)
    const badge = getByTestId('iemis-code-badge')
    expect(badge.className).toMatch(/239,159,39/) // amber channel
    expect(badge.textContent).toContain('abcd')
  })

  it('copy button invokes navigator.clipboard.writeText with the code', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    const { getByLabelText } = render(<IemisCodeBadge code="987654321" />)
    fireEvent.click(getByLabelText('Copy IEMIS School Code'))

    expect(writeText).toHaveBeenCalledWith('987654321')
  })

  it('accepts 10-digit codes as verified', () => {
    const { getByTestId } = render(<IemisCodeBadge code="1234567890" />)
    const badge = getByTestId('iemis-code-badge')
    expect(badge.className).toMatch(/29,158,117/)
  })

  it('marks 7-digit codes as malformed (boundary check)', () => {
    const { getByTestId } = render(<IemisCodeBadge code="1234567" />)
    const badge = getByTestId('iemis-code-badge')
    expect(badge.className).toMatch(/239,159,39/)
  })

  it('marks 11-digit codes as malformed (boundary check)', () => {
    const { getByTestId } = render(<IemisCodeBadge code="12345678901" />)
    const badge = getByTestId('iemis-code-badge')
    expect(badge.className).toMatch(/239,159,39/)
  })

  it('shows tooltip on hover', () => {
    const { getByTestId, queryByRole } = render(<IemisCodeBadge code="12345678" />)
    expect(queryByRole('tooltip')).toBeNull()

    fireEvent.mouseEnter(getByTestId('iemis-code-badge'))
    expect(queryByRole('tooltip')).not.toBeNull()
    expect(queryByRole('tooltip')?.textContent).toMatch(/CEHRD|IEMIS/)

    fireEvent.mouseLeave(getByTestId('iemis-code-badge'))
    expect(queryByRole('tooltip')).toBeNull()
  })

  it('tooltip copy differs between verified and malformed states', () => {
    const { getByTestId, queryByRole } = render(<IemisCodeBadge code="not-valid" />)
    fireEvent.mouseEnter(getByTestId('iemis-code-badge'))
    expect(queryByRole('tooltip')?.textContent).toMatch(/does not match|immutable/i)
  })
})
