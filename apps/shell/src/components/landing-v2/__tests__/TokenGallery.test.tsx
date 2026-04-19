import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TokenGallery } from '../preview/TokenGallery'

describe('TokenGallery', () => {
  it('renders grouped color swatches + typography + radii + shadows', () => {
    const { getByRole, getAllByRole, getByText } = render(<TokenGallery />)
    // Top-level heading
    expect(getByRole('heading', { level: 1 }).textContent).toMatch(/Landing V2/i)
    // At least one heading per major group (colors, typography, radii, shadows)
    const sectionHeadings = getAllByRole('heading', { level: 2 })
    expect(sectionHeadings.length).toBeGreaterThanOrEqual(4)
    // Spot-check some tokens are present as text
    expect(getByText('--lp-primary')).toBeInTheDocument()
    expect(getByText('--lp-bg')).toBeInTheDocument()
    expect(getByText('--lp-ink')).toBeInTheDocument()
  })
})
