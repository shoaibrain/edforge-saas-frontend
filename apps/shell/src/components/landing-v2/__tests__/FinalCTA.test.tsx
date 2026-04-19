import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { FinalCTA } from '../sections/cta/FinalCTA'
import { FINAL_CTA } from '../landing.strings'

describe('FinalCTA', () => {
  afterEach(() => cleanup())

  it('renders the closing heading + lede', () => {
    const { getByRole, getByText } = render(<FinalCTA />)
    expect(getByRole('heading', { level: 2 }).textContent).toMatch(/forge something/i)
    expect(getByText(FINAL_CTA.lede)).toBeInTheDocument()
  })

  it('renders the CTA link pointing to the mailto target from strings', () => {
    const { getByRole } = render(<FinalCTA />)
    const link = getByRole('link', { name: new RegExp(FINAL_CTA.cta, 'i') })
    expect(link.getAttribute('href')).toBe(FINAL_CTA.ctaHref)
    expect(link.getAttribute('href')).toMatch(/^mailto:/)
  })

  it('aria-labelledby wires section → heading', () => {
    const { container, getByRole } = render(<FinalCTA />)
    const section = container.querySelector('section#demo')
    expect(section?.getAttribute('aria-labelledby')).toBe('final-cta-heading')
    expect(getByRole('heading', { level: 2 }).id).toBe('final-cta-heading')
  })
})
