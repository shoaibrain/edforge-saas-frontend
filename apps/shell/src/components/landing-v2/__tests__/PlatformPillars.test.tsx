import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { PlatformPillars } from '../sections/pillars/PlatformPillars'
import { PLATFORM_PILLARS } from '../landing.strings'

describe('PlatformPillars', () => {
  afterEach(() => cleanup())

  it('renders the section heading + eyebrow', () => {
    const { getByRole, getByText } = render(<PlatformPillars />)
    expect(getByRole('heading', { level: 2 }).textContent).toMatch(
      /Six modules/i
    )
    expect(getByText('HOW IT ALL CONNECTS')).toBeInTheDocument()
  })

  it('renders 6 pillar cards (one per module) as <a> elements', () => {
    const { getAllByRole } = render(<PlatformPillars />)
    const links = getAllByRole('link')
    expect(links).toHaveLength(6)
  })

  it('applies the [7, 5, 5, 7, 6, 6] colSpan pattern to the cards', () => {
    const { getAllByRole } = render(<PlatformPillars />)
    const links = getAllByRole('link') as HTMLElement[]
    const expected = PLATFORM_PILLARS.cards.map((c) => c.colSpan)
    links.forEach((link, i) => {
      expect(link.style.gridColumn).toBe(`span ${expected[i]}`)
    })
  })

  it('each card renders the module title from landing.strings', () => {
    const { getByText } = render(<PlatformPillars />)
    for (const card of PLATFORM_PILLARS.cards) {
      expect(getByText(card.title)).toBeInTheDocument()
    }
  })

  it('aria-labelledby linkage between section and heading', () => {
    const { container, getByRole } = render(<PlatformPillars />)
    const section = container.querySelector('section#platform')
    expect(section?.getAttribute('aria-labelledby')).toBe('platform-heading')
    expect(getByRole('heading', { level: 2 }).id).toBe('platform-heading')
  })
})
