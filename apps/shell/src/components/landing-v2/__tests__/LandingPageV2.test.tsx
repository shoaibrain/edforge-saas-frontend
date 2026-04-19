import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { LandingPageV2 } from '../LandingPageV2'

describe('LandingPageV2 composition', () => {
  afterEach(() => cleanup())

  it('renders every production section in order', () => {
    const { container } = render(<LandingPageV2 />)
    const sectionIds = Array.from(
      container.querySelectorAll('section[id], footer')
    ).map((el) => (el as HTMLElement).id || el.tagName.toLowerCase())

    // Expected order: Hero → district → teachers → students → platform → security → faqs → demo → footer
    const expectedPrefix = [
      'top',
      'use-cases',
      'teachers-parents',
      'students',
      'platform',
      'security',
      'faqs',
      'demo',
      'footer',
    ]

    // Each expected id should appear in the rendered list, in order.
    let idx = 0
    for (const expected of expectedPrefix) {
      const found = sectionIds.indexOf(expected, idx)
      expect(found, `missing section ${expected}`).toBeGreaterThanOrEqual(0)
      idx = found + 1
    }
  })

  it('does NOT render a migration section (skipped per user direction)', () => {
    const { container } = render(<LandingPageV2 />)
    expect(container.querySelector('#migration')).toBeNull()
  })

  it('sets data-surface="landing" on the document element', () => {
    render(<LandingPageV2 />)
    expect(document.documentElement.dataset.surface).toBe('landing')
  })
})
