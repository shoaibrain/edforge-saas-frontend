import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { UseCaseDistrict } from '../sections/district/UseCaseDistrict'

describe('UseCaseDistrict', () => {
  afterEach(() => cleanup())

  it('renders the School Leaders section heading and lede', () => {
    const { getByRole, getByText } = render(<UseCaseDistrict />)
    const heading = getByRole('heading', { level: 2 })
    expect(heading.textContent).toMatch(/Lead from/i)
    expect(getByText(/Effective school systems share three traits/i)).toBeInTheDocument()
  })

  it('renders 3 feature tabs with the School Leaders copy', () => {
    const { getAllByRole } = render(<UseCaseDistrict />)
    const tabs = getAllByRole('tab')
    expect(tabs).toHaveLength(3)
    expect(tabs[0].textContent).toMatch(/single source of truth/i)
    expect(tabs[1].textContent).toMatch(/Real-time visibility/i)
    expect(tabs[2].textContent).toMatch(/Decisions that reach/i)
  })

  it('clicking a feature updates the active tab and caption', () => {
    const { getAllByRole, getAllByText } = render(<UseCaseDistrict />)
    const tabs = getAllByRole('tab')
    fireEvent.click(tabs[2])
    expect(tabs[2].getAttribute('aria-selected')).toBe('true')
    // Title appears in both the tab and the DemoVideo caption
    expect(getAllByText('Decisions that reach the classroom.').length).toBeGreaterThanOrEqual(1)
  })
})
