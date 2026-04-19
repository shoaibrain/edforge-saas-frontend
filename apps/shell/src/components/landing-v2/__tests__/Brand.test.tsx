import { describe, it, expect } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { EdforgeLogo } from '../components/Brand'

describe('EdforgeLogo', () => {
  it('renders an accessible SVG with an img role and default label', () => {
    const { getByRole } = render(<EdforgeLogo />)
    const svg = getByRole('img', { name: 'Edforge' })
    expect(svg).toBeInTheDocument()
    cleanup()
  })

  it('uses a custom label when provided', () => {
    const { getByRole } = render(<EdforgeLogo label="Edforge Technologies" />)
    expect(getByRole('img', { name: 'Edforge Technologies' })).toBeInTheDocument()
    cleanup()
  })

  it('renders the wordmark and sub-mark text', () => {
    const { getByText } = render(<EdforgeLogo />)
    expect(getByText('Edforge')).toBeInTheDocument()
    expect(getByText('Technologies')).toBeInTheDocument()
    cleanup()
  })

  it.each([16, 34, 64])('does not crash at size %i', (size) => {
    const { unmount } = render(<EdforgeLogo size={size} />)
    unmount()
  })
})
