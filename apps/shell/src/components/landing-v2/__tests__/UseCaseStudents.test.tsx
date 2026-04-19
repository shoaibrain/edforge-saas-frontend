import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { UseCaseStudents } from '../sections/students/UseCaseStudents'

describe('UseCaseStudents', () => {
  afterEach(() => cleanup())

  it('renders the students section heading + eyebrow', () => {
    const { getByRole, getByText } = render(<UseCaseStudents />)
    expect(getByRole('heading', { level: 2 }).textContent).toMatch(
      /A portal students actually/i
    )
    expect(getByText('FOR STUDENTS')).toBeInTheDocument()
  })

  it('renders 4 feature tabs with the students copy', () => {
    const { getAllByRole } = render(<UseCaseStudents />)
    const tabs = getAllByRole('tab')
    expect(tabs).toHaveLength(4)
    expect(tabs[0].textContent).toMatch(/All your courses/i)
    expect(tabs[1].textContent).toMatch(/Earn as you learn/i)
    expect(tabs[2].textContent).toMatch(/Grades you can understand/i)
    expect(tabs[3].textContent).toMatch(/Know what to focus on/i)
  })

  it('clicking a feature advances the active selection', () => {
    const { getAllByRole, getByText } = render(<UseCaseStudents />)
    const tabs = getAllByRole('tab')
    fireEvent.click(tabs[1])
    expect(tabs[1].getAttribute('aria-selected')).toBe('true')
    expect(getByText('Earn as you learn')).toBeInTheDocument()
  })
})
