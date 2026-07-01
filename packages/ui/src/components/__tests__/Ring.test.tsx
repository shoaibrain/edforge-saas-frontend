/**
 * Ring — shared donut-ring primitive tests (S1).
 */
import { describe, expect, it, afterEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Ring } from '../Ring'

function mockReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('reduce') ? reduce : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  }))
}

describe('Ring', () => {
  afterEach(() => vi.restoreAllMocks())

  it('clamps percentage into [0,100] and reflects it in the progress dashoffset', () => {
    mockReducedMotion(true) // snap to value immediately (no mount animation)
    const { container } = render(<Ring percentage={50} size={42} strokeWidth={4} label="Readiness 50%" />)
    const circles = container.querySelectorAll('circle')
    expect(circles).toHaveLength(2)
    const progress = circles[1]
    const dashArray = Number(progress.getAttribute('stroke-dasharray'))
    const dashOffset = Number(progress.getAttribute('stroke-dashoffset'))
    // 50% → offset is half the circumference (advanced from the empty full-offset).
    expect(dashOffset).toBeCloseTo(dashArray * 0.5, 1)
    expect(dashOffset).toBeLessThan(dashArray)
  })

  it('is exposed as an image with a label when one is provided', () => {
    mockReducedMotion(true)
    const { getByRole } = render(<Ring percentage={80} label="80 percent" />)
    expect(getByRole('img', { name: '80 percent' })).toBeTruthy()
  })

  it('is decorative (aria-hidden) when no label is given', () => {
    mockReducedMotion(true)
    const { container } = render(<Ring percentage={80} />)
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('disables the sweep transition under prefers-reduced-motion', () => {
    mockReducedMotion(true)
    const { container } = render(<Ring percentage={60} label="x" />)
    const progress = container.querySelectorAll('circle')[1] as SVGCircleElement
    expect(progress.style.transition).toBe('none')
  })
})
