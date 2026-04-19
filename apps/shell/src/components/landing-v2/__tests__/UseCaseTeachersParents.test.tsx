import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { UseCaseTeachersParents } from '../sections/teachers/UseCaseTeachersParents'

describe('UseCaseTeachersParents', () => {
  afterEach(() => cleanup())

  it('renders the teachers section heading + eyebrow', () => {
    const { getByRole, getByText } = render(<UseCaseTeachersParents />)
    expect(getByRole('heading', { level: 2 }).textContent).toMatch(
      /Teachers and parents/i
    )
    expect(getByText('FOR TEACHERS & PARENTS')).toBeInTheDocument()
  })

  it('renders 4 feature tabs with the teachers copy', () => {
    const { getAllByRole } = render(<UseCaseTeachersParents />)
    const tabs = getAllByRole('tab')
    expect(tabs).toHaveLength(4)
    expect(tabs[0].textContent).toMatch(/Your class, organized/i)
    expect(tabs[1].textContent).toMatch(/Messages that reach families/i)
    expect(tabs[2].textContent).toMatch(/Student progress, visualized/i)
    expect(tabs[3].textContent).toMatch(/Parents stay involved/i)
  })

  it('clicking a feature advances the active selection', () => {
    const { getAllByRole, getByText } = render(<UseCaseTeachersParents />)
    const tabs = getAllByRole('tab')
    fireEvent.click(tabs[3])
    expect(tabs[3].getAttribute('aria-selected')).toBe('true')
    expect(getByText('Parents stay involved')).toBeInTheDocument()
  })
})
