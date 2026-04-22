import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { Hero } from '../sections/hero/Hero'

describe('Hero', () => {
  afterEach(() => cleanup())

  it('renders the h1 with the hero heading', () => {
    const { getByRole } = render(<Hero />)
    const h1 = getByRole('heading', { level: 1 })
    expect(h1.textContent).toMatch(/Well-run/i)
    expect(h1.textContent).toMatch(/that idea/i)
  })

  it('links the scroll-down chip to #stage', () => {
    const { container } = render(<Hero />)
    const link = Array.from(container.querySelectorAll('a')).find((a) =>
      (a.textContent ?? '').includes('See Edforge')
    )
    expect(link?.getAttribute('href')).toBe('#stage')
  })

  it('uses the hero-heading id for aria-labelledby linkage', () => {
    const { getByRole, container } = render(<Hero />)
    const section = container.querySelector('section#top')
    expect(section?.getAttribute('aria-labelledby')).toBe('hero-heading')
    expect(getByRole('heading', { level: 1 }).id).toBe('hero-heading')
  })

  it('renders the stage wrapper', () => {
    const { container } = render(<Hero />)
    expect(container.querySelector('#stage')).not.toBeNull()
  })
})
