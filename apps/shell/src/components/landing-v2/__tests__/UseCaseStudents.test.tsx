import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { UseCaseStudents } from '../sections/students/UseCaseStudents'

describe('UseCaseStudents', () => {
  afterEach(() => cleanup())

  it('renders the students section heading + eyebrow', () => {
    const { getByRole, getByText } = render(<UseCaseStudents />)
    expect(getByRole('heading', { level: 2 }).textContent).toMatch(
      /A school tool that respects/i
    )
    expect(getByText('FOR STUDENTS')).toBeInTheDocument()
  })

  it('renders 3 feature tabs with the students copy', () => {
    const { getAllByRole } = render(<UseCaseStudents />)
    const tabs = getAllByRole('tab')
    expect(tabs).toHaveLength(3)
    expect(tabs[0].textContent).toMatch(/Their learning, in their view/i)
    expect(tabs[1].textContent).toMatch(/Help that teaches/i)
    expect(tabs[2].textContent).toMatch(/Safe by default/i)
  })

  it('clicking a feature advances the active selection', () => {
    const { getAllByRole, getAllByText } = render(<UseCaseStudents />)
    const tabs = getAllByRole('tab')
    fireEvent.click(tabs[1])
    expect(tabs[1].getAttribute('aria-selected')).toBe('true')
    // Title appears in both the tab and the DemoVideo caption
    expect(getAllByText('Help that teaches, not solves.').length).toBeGreaterThanOrEqual(1)
  })
})
