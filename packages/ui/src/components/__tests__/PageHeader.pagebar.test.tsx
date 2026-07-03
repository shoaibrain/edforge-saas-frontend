/**
 * PageHeader pagebar mode — unit tests.
 *
 * Pagebar mode renders right-aligned actions (+ optional breadcrumbs) and NO
 * <h1> — no year chip / date (the app is always scoped to the current academic
 * year). Titled mode is unchanged (still exactly one <h1>).
 */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageHeader } from '../layout/PageHeader'

describe('PageHeader pagebar mode', () => {
  it('renders zero <h1> in pagebar mode', () => {
    render(<PageHeader mode="pagebar" actions={[{ label: 'Enroll student', primary: true }]} />)
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })

  it('still renders exactly one <h1> in titled mode (back-compat)', () => {
    render(<PageHeader title="Students" description="Roster" />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Students')
  })

  it('renders no year chip or date in pagebar mode', () => {
    render(<PageHeader mode="pagebar" actions={[{ label: 'Create Exam', primary: true }]} />)
    expect(screen.queryByText('Academic Year')).toBeNull()
    expect(screen.queryByText(/\d{4}/)).toBeNull()
  })

  it('renders right-aligned actions with the primary action styled distinctly', () => {
    render(
      <PageHeader
        mode="pagebar"
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

  it('applies the shared focusRing to actions', () => {
    render(<PageHeader mode="pagebar" actions={[{ label: 'Create Exam', primary: true }]} />)
    expect(screen.getByRole('button', { name: 'Create Exam' }).className).toContain('focus-visible:ring-2')
  })

  it('renders breadcrumbs when provided', () => {
    render(<PageHeader mode="pagebar" breadcrumbs={<span>Academics / Students</span>} />)
    expect(screen.getByText('Academics / Students')).toBeTruthy()
  })

  it('renders nothing when it has neither breadcrumbs, actions, nor attention', () => {
    const { container } = render(<PageHeader mode="pagebar" />)
    expect(container.firstChild).toBeNull()
  })

  it('mounts the attention slot on the left, balanced against the actions row', () => {
    render(
      <PageHeader
        mode="pagebar"
        attention={<button type="button">2 need attention</button>}
        actions={[{ label: 'Enroll student', primary: true }]}
      />,
    )
    const attention = screen.getByText('2 need attention')
    const action = screen.getByText('Enroll student')
    expect(attention).toBeTruthy()
    expect(action).toBeTruthy()
    // Same row: both live under the justify-between container.
    const row = attention.closest('.justify-between')
    expect(row).toBeTruthy()
    expect(row!.contains(action)).toBe(true)
  })

  it('renders the attention slot even with no actions', () => {
    render(<PageHeader mode="pagebar" attention={<span>All clear</span>} />)
    expect(screen.getByText('All clear')).toBeTruthy()
  })
})
