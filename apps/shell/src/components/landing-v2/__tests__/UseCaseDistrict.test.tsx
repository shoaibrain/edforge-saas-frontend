import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { UseCaseDistrict } from '../sections/district/UseCaseDistrict'

describe('UseCaseDistrict', () => {
  afterEach(() => cleanup())

  it('renders the District section heading and lede', () => {
    const { getByRole, getByText } = render(<UseCaseDistrict />)
    const heading = getByRole('heading', { level: 2 })
    expect(heading.textContent).toMatch(/Run your district from/i)
    expect(getByText(/Budget, staffing, enrollment/i)).toBeInTheDocument()
  })

  it('renders 4 feature tabs with the District copy', () => {
    const { getAllByRole } = render(<UseCaseDistrict />)
    const tabs = getAllByRole('tab')
    expect(tabs).toHaveLength(4)
    expect(tabs[0].textContent).toMatch(/Budget clarity/i)
    expect(tabs[1].textContent).toMatch(/Every campus/i)
    expect(tabs[2].textContent).toMatch(/Know your workforce/i)
    expect(tabs[3].textContent).toMatch(/Board-ready/i)
  })

  it('clicking a feature updates the active tab and caption', () => {
    const { getAllByRole, getByText } = render(<UseCaseDistrict />)
    const tabs = getAllByRole('tab')
    fireEvent.click(tabs[2])
    expect(tabs[2].getAttribute('aria-selected')).toBe('true')
    // DemoVideo caption badge mirrors the active feature title
    expect(getByText('Know your workforce')).toBeInTheDocument()
  })
})
