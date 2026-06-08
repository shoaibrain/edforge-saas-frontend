import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, within } from '@testing-library/react'
import { Footer } from '../sections/footer/Footer'
import { FOOTER } from '../landing.strings'

describe('Footer', () => {
  afterEach(() => cleanup())

  it('renders the logo + tagline + legal entity', () => {
    const { getByText, getByRole } = render(<Footer />)
    expect(getByRole('img', { name: 'Edforge' })).toBeInTheDocument()
    expect(getByText(FOOTER.tagline)).toBeInTheDocument()
    expect(getByText(FOOTER.legalEntity)).toBeInTheDocument()
  })

  it('renders 4 link-column navs with their column labels as aria-label', () => {
    const { getByRole } = render(<Footer />)
    for (const col of FOOTER.columns) {
      const nav = getByRole('navigation', { name: col.heading })
      expect(nav).toBeInTheDocument()
    }
  })

  it('renders every link in every column with the configured href', () => {
    const { getByRole } = render(<Footer />)
    for (const col of FOOTER.columns) {
      const nav = getByRole('navigation', { name: col.heading })
      for (const link of col.items) {
        const a = within(nav).getByRole('link', { name: link.label })
        expect(a.getAttribute('href')).toBe(link.href)
      }
    }
  })

  it('renders the legal row with Terms / Privacy / Security / Accessibility', () => {
    const { getByRole } = render(<Footer />)
    const legalNav = getByRole('navigation', { name: 'Legal' })
    expect(legalNav).toBeInTheDocument()
    for (const link of FOOTER.legalLinks) {
      expect(
        legalNav.querySelector(`a[href="${link.href}"]`)?.textContent
      ).toBe(link.label)
    }
  })

  it('renders the copyright line', () => {
    const { getByText } = render(<Footer />)
    expect(getByText(FOOTER.copyright)).toBeInTheDocument()
  })

  it('uses the contentinfo landmark role', () => {
    const { getByRole } = render(<Footer />)
    expect(getByRole('contentinfo')).toBeInTheDocument()
  })
})
