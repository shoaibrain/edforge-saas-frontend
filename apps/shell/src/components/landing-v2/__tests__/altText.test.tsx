import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { LandingPageV2 } from '../LandingPageV2'

/**
 * Alt-text / accessibility invariants (S7-T14).
 *
 * Rules we enforce across the rendered landing:
 *   - No <img> in landing-v2 (we use SVG + <video> + CSS backgrounds only).
 *     If this ever grows an <img>, every one MUST have an alt attribute.
 *   - Every <svg> with role="img" has an accessible name (aria-label).
 *   - Every <video> has an aria-label.
 *   - Decorative SVGs have aria-hidden="true".
 */
describe('Landing alt-text invariants', () => {
  afterEach(() => cleanup())

  it('renders no <img> elements (all imagery is SVG or video)', () => {
    const { container } = render(<LandingPageV2 />)
    const imgs = container.querySelectorAll('img')
    expect(imgs.length).toBe(0)
  })

  it('every role="img" SVG has an accessible name', () => {
    const { container } = render(<LandingPageV2 />)
    const svgs = container.querySelectorAll('svg[role="img"]')
    for (const svg of svgs) {
      const hasName =
        svg.getAttribute('aria-label') !== null ||
        svg.getAttribute('aria-labelledby') !== null ||
        svg.querySelector('title') !== null
      expect(hasName, `SVG with role=img lacks an accessible name`).toBe(true)
    }
  })

  it('every <video> has an aria-label', () => {
    const { container } = render(<LandingPageV2 />)
    const videos = container.querySelectorAll('video')
    for (const v of videos) {
      expect(v.getAttribute('aria-label')).toBeTruthy()
    }
  })

  it('every <video> is muted + playsInline (autoplay policy compliance)', () => {
    const { container } = render(<LandingPageV2 />)
    const videos = container.querySelectorAll('video')
    for (const v of videos) {
      expect(v.muted, 'video must be muted for autoplay').toBe(true)
      expect(v.playsInline, 'video must be playsInline for iOS Safari').toBe(true)
    }
  })
})
