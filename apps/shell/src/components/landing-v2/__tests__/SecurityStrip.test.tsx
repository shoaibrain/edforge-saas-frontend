import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { SecurityStrip } from '../sections/security/SecurityStrip'
import { SECURITY_STRIP } from '../landing.strings'

describe('SecurityStrip', () => {
  afterEach(() => cleanup())

  it('renders the heading + lede from the copy catalog', () => {
    const { getByRole, getByText } = render(<SecurityStrip />)
    expect(getByRole('heading', { level: 2 }).textContent).toMatch(
      /Student data is/i
    )
    expect(getByText(SECURITY_STRIP.lede)).toBeInTheDocument()
  })

  it('renders 3 privacy promise cards', () => {
    const { getByText } = render(<SecurityStrip />)
    for (const p of SECURITY_STRIP.promises) {
      expect(getByText(p.title)).toBeInTheDocument()
      expect(getByText(p.description)).toBeInTheDocument()
    }
  })

  it('renders every compliance framework name', () => {
    const { getByText } = render(<SecurityStrip />)
    for (const name of SECURITY_STRIP.frameworks) {
      expect(getByText(name)).toBeInTheDocument()
    }
  })

  it('renders the CTA link pointing to the configured href', () => {
    const { getByRole } = render(<SecurityStrip />)
    const link = getByRole('link', { name: new RegExp(SECURITY_STRIP.cta, 'i') })
    expect(link.getAttribute('href')).toBe(SECURITY_STRIP.ctaHref)
  })

  it('aria-labelledby links section → heading', () => {
    const { container, getByRole } = render(<SecurityStrip />)
    const section = container.querySelector('section#security')
    expect(section?.getAttribute('aria-labelledby')).toBe('security-heading')
    expect(getByRole('heading', { level: 2 }).id).toBe('security-heading')
  })
})
