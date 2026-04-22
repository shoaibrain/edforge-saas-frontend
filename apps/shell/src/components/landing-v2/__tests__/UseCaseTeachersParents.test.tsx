import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { UseCaseTeachersParents } from '../sections/teachers/UseCaseTeachersParents'

describe('UseCaseTeachersParents', () => {
  afterEach(() => cleanup())

  it('renders the teachers section heading + eyebrow', () => {
    const { getByRole, getByText } = render(<UseCaseTeachersParents />)
    expect(getByRole('heading', { level: 2 }).textContent).toMatch(
      /Between a teacher and a family/i
    )
    expect(getByText('FOR TEACHERS & FAMILIES')).toBeInTheDocument()
  })

  it('renders 3 feature tabs with the teachers copy', () => {
    const { getAllByRole } = render(<UseCaseTeachersParents />)
    const tabs = getAllByRole('tab')
    expect(tabs).toHaveLength(3)
    expect(tabs[0].textContent).toMatch(/Every family, their own language/i)
    expect(tabs[1].textContent).toMatch(/record of a child/i)
    expect(tabs[2].textContent).toMatch(/message that actually gets sent/i)
  })

  it('clicking a feature advances the active selection', () => {
    const { getAllByRole, getAllByText } = render(<UseCaseTeachersParents />)
    const tabs = getAllByRole('tab')
    fireEvent.click(tabs[2])
    expect(tabs[2].getAttribute('aria-selected')).toBe('true')
    // Title appears in both the tab and the DemoVideo caption
    expect(getAllByText('The message that actually gets sent.').length).toBeGreaterThanOrEqual(1)
  })
})
