/**
 * PageHeader pagebar mode — unit tests (S1).
 *
 * Pagebar mode renders a year switcher + date + actions and NO <h1>. Titled
 * mode is unchanged (still exactly one <h1>) so existing consumers keep working.
 */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageHeader } from '../layout/PageHeader'

describe('PageHeader pagebar mode', () => {
  it('renders zero <h1> in pagebar mode', () => {
    render(
      <PageHeader
        mode="pagebar"
        year="2083"
        date="Tuesday, Jun 30"
        actions={[{ label: 'Enroll student', primary: true }]}
      />,
    )
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })

  it('still renders exactly one <h1> in titled mode (back-compat)', () => {
    render(<PageHeader title="Students" description="Roster" />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Students')
  })

  it('renders the year switcher chip and date in pagebar mode', () => {
    render(<PageHeader mode="pagebar" year="2083" date="Tuesday, Jun 30" onYearClick={() => {}} />)
    expect(screen.getByText('2083')).toBeTruthy()
    expect(screen.getByText('Academic Year')).toBeTruthy()
    expect(screen.getByText('Tuesday, Jun 30')).toBeTruthy()
    // year chip is a switcher button when onYearClick is provided
    expect(screen.getByRole('button', { name: /academic year/i })).toBeTruthy()
  })

  it('renders right-aligned actions with the primary action styled distinctly', () => {
    render(
      <PageHeader
        mode="pagebar"
        year="2083"
        actions={[
          { label: 'Govt. Reports' },
          { label: 'Enroll student', primary: true },
        ]}
      />,
    )
    const primary = screen.getByRole('button', { name: 'Enroll student' })
    expect(primary.className).toContain('action-primary-bg')
    const secondary = screen.getByRole('button', { name: 'Govt. Reports' })
    expect(secondary.className).not.toContain('action-primary-bg')
  })

  it('applies the shared focusRing to the year switcher and actions', () => {
    render(
      <PageHeader
        mode="pagebar"
        year="2083"
        onYearClick={() => {}}
        actions={[{ label: 'Create Exam', primary: true }]}
      />,
    )
    expect(screen.getByRole('button', { name: /academic year/i }).className).toContain('focus-visible:ring-2')
    expect(screen.getByRole('button', { name: 'Create Exam' }).className).toContain('focus-visible:ring-2')
  })
})
