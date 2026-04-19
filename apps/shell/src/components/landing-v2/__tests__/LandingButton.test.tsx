import { describe, it, expect, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { LandingButton } from '../components/LandingButton'

describe('LandingButton', () => {
  it('renders a <button> by default with the primary variant class', () => {
    const { getByRole } = render(<LandingButton>Click me</LandingButton>)
    const btn = getByRole('button', { name: 'Click me' })
    expect(btn.tagName).toBe('BUTTON')
    expect(btn.className).toMatch(/lp-btn--primary/)
    cleanup()
  })

  it.each(['primary', 'ghost', 'dark', 'light'] as const)(
    'applies the %s variant class',
    (variant) => {
      const { getByRole } = render(
        <LandingButton variant={variant}>{variant}</LandingButton>
      )
      expect(getByRole('button').className).toMatch(new RegExp(`lp-btn--${variant}`))
      cleanup()
    }
  )

  it('fires onClick when clicked', () => {
    const onClick = vi.fn()
    const { getByRole } = render(
      <LandingButton onClick={onClick}>go</LandingButton>
    )
    fireEvent.click(getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
    cleanup()
  })

  it('renders as <a> when as="a" and href are provided', () => {
    const { getByRole } = render(
      <LandingButton as="a" href="#use-cases">
        Explore
      </LandingButton>
    )
    const link = getByRole('link', { name: 'Explore' })
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toBe('#use-cases')
    cleanup()
  })

  it('has type="button" by default (prevents accidental form submit)', () => {
    const { getByRole } = render(<LandingButton>x</LandingButton>)
    expect(getByRole('button').getAttribute('type')).toBe('button')
    cleanup()
  })

  it.each(['sm', 'md', 'lg'] as const)('applies the %s size', (size) => {
    const { getByRole } = render(<LandingButton size={size}>x</LandingButton>)
    expect(getByRole('button').className).toMatch(/px-\d|py-\d|text-/)
    cleanup()
  })
})
