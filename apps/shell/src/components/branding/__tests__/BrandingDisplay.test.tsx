/**
 * Sprint M2.4 — BrandingDisplay snapshot/rendering test.
 *
 * Three cases:
 *   1. Full branding — every field set, every asset URL present.
 *   2. Partial branding — only formalName + color palette set.
 *   3. Null branding — empty-state UI renders.
 *
 * Also asserts a11y essentials: color swatches have ARIA labels with
 * hex codes; logo `<img>` has alt text.
 */

import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@edforge/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
  }),
}))

import { BrandingDisplay } from '../BrandingDisplay'
import type { BrandingResponse } from '@edforge/identity-services'

function makeFullResponse(): BrandingResponse {
  return {
    branding: {
      formalName: 'Saraswati Higher Secondary School',
      tagline: 'Knowledge is the greatest wealth',
      panNumber: '301234567',
      vatNumber: '600123456',
      phone: '+977-1-5550000',
      email: 'info@saraswati.edu.np',
      addressLines: ['Lalitpur Ward 14', 'Kupondol Heights', 'Lalitpur, Nepal'],
      colorPalette: { primary: '#1D9E75', accent: '#378ADD' },
      logoS3Key: 'tenants/t/schools/s/logo.png',
      principalSignatureS3Key: 'tenants/t/schools/s/signature.png',
      letterheadBackgroundS3Key: 'tenants/t/schools/s/letterhead.pdf',
      brandingVersionId: 'a1b2c3d4-1234-5678-90ab-cdef01234567',
    },
    urls: {
      logo: 'https://example.s3.amazonaws.com/signed/logo.png',
      principalSignature: 'https://example.s3.amazonaws.com/signed/sig.png',
      letterheadBackground: 'https://example.s3.amazonaws.com/signed/letterhead.pdf',
    },
  }
}

describe('BrandingDisplay (M2.4)', () => {
  it('renders the full payload — name, palette, assets, version', () => {
    const data = makeFullResponse()
    render(<BrandingDisplay data={data} />)

    // Identity
    expect(screen.getByText('Saraswati Higher Secondary School')).toBeInTheDocument()
    expect(screen.getByText('Knowledge is the greatest wealth')).toBeInTheDocument()
    expect(screen.getByText('301234567')).toBeInTheDocument()
    expect(screen.getByText('600123456')).toBeInTheDocument()

    // Contact
    expect(screen.getByText('+977-1-5550000')).toBeInTheDocument()
    expect(screen.getByText('info@saraswati.edu.np')).toBeInTheDocument()
    expect(screen.getByText('Lalitpur Ward 14')).toBeInTheDocument()

    // Color palette — hex appears as both text + the swatch's aria-label.
    expect(screen.getAllByText('#1D9E75').length).toBeGreaterThan(0)
    expect(screen.getAllByText('#378ADD').length).toBeGreaterThan(0)

    // Assets — logo + signature should render as <img>; letterhead (PDF) as link.
    const images = screen.getAllByRole('img')
    // Color swatches also use role=img — count includes them. At minimum we have
    // the 2 swatches + 2 photo assets = 4 (PDF letterhead is a link, not img).
    expect(images.length).toBeGreaterThanOrEqual(4)

    // Version
    expect(screen.getByText(/a1b2c3d4-1234-5678/)).toBeInTheDocument()
  })

  it('renders gracefully with partial branding (em-dashes for missing fields)', () => {
    const data: BrandingResponse = {
      branding: {
        formalName: 'Test School',
        colorPalette: { primary: '#FF0000', accent: '#00FF00' },
        // tagline / panNumber / vatNumber / phone / email / addresses / assets all unset
      },
      // urls absent — no asset previews
    }
    render(<BrandingDisplay data={data} />)
    expect(screen.getByText('Test School')).toBeInTheDocument()

    // Missing fields render em-dashes (the Field component's empty branch).
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)

    // Color palette still renders.
    expect(screen.getAllByText('#FF0000').length).toBeGreaterThan(0)

    // Asset slots show their empty placeholders (no <img> for missing URLs).
    expect(screen.getByText('emptyField.logo')).toBeInTheDocument()
    expect(screen.getByText('emptyField.principalSignature')).toBeInTheDocument()
    expect(screen.getByText('emptyField.letterheadBackground')).toBeInTheDocument()
  })

  it('renders the empty-state when branding is null', () => {
    render(<BrandingDisplay data={{ branding: null }} />)
    expect(screen.getByText('empty.title')).toBeInTheDocument()
    expect(screen.getByText('empty.description')).toBeInTheDocument()

    // No sections render in the null case.
    expect(screen.queryByText('sections.identity')).not.toBeInTheDocument()
    expect(screen.queryByText('sections.assets')).not.toBeInTheDocument()
  })

  it('a11y: color swatches expose hex in aria-label', () => {
    const data = makeFullResponse()
    render(<BrandingDisplay data={data} />)

    // The swatch divs have role="img" with `${label} ${hex}` aria-labels.
    const primarySwatch = screen.getByRole('img', { name: /fields\.primaryColor #1D9E75/i })
    expect(primarySwatch).toBeInTheDocument()
    const accentSwatch = screen.getByRole('img', { name: /fields\.accentColor #378ADD/i })
    expect(accentSwatch).toBeInTheDocument()
  })

  it('a11y: logo <img> has alt text derived from the i18n field label', () => {
    const data = makeFullResponse()
    render(<BrandingDisplay data={data} />)
    const logoImg = screen.getByRole('img', { name: 'fields.logo' })
    expect(logoImg.tagName.toLowerCase()).toBe('img')
    expect(logoImg).toHaveAttribute('src', 'https://example.s3.amazonaws.com/signed/logo.png')
  })

  it('renders the letterhead PDF as a link, not as an <img>', () => {
    const data = makeFullResponse()
    render(<BrandingDisplay data={data} />)
    // The component detects .pdf extensions and renders an anchor with
    // the text "PDF" instead of an <img> (which would broken-image).
    const pdfLink = screen.getByRole('link', { name: 'PDF' })
    expect(pdfLink).toHaveAttribute(
      'href',
      'https://example.s3.amazonaws.com/signed/letterhead.pdf',
    )
  })
})
