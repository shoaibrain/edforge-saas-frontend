/**
 * PageHeader `greeting` mode — the Home dashboard variant. Renders the greeting
 * + actions with NO <h1>, and leaves the existing titled/pagebar modes intact.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { PageHeader } from '../layout/PageHeader'

afterEach(() => cleanup())

describe('PageHeader greeting mode', () => {
  it('renders the greeting and actions with no <h1>', () => {
    render(
      <PageHeader
        mode="greeting"
        greeting="Good morning, Shoaib"
        actions={[{ label: 'Enroll student' }, { label: 'Record payment', primary: true }]}
      />,
    )
    expect(screen.getByText(/good morning, shoaib/i)).toBeTruthy()
    expect(document.querySelector('h1')).toBeNull()
    expect(screen.getByRole('button', { name: 'Enroll student' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Record payment' })).toBeTruthy()
  })

  it('shows a waving-hand emoji by default and hides it when wave={false}', () => {
    const { rerender } = render(<PageHeader mode="greeting" greeting="Hi" />)
    expect(screen.getByRole('img', { name: /waving hand/i })).toBeTruthy()
    rerender(<PageHeader mode="greeting" greeting="Hi" wave={false} />)
    expect(screen.queryByRole('img', { name: /waving hand/i })).toBeNull()
  })

  it('keeps titled mode rendering exactly one <h1> (back-compat)', () => {
    render(<PageHeader title="Settings" description="Manage your workspace" />)
    expect(document.querySelectorAll('h1')).toHaveLength(1)
  })

  it('keeps pagebar mode free of any <h1> (actions only)', () => {
    render(<PageHeader mode="pagebar" actions={[{ label: 'New', primary: true }]} />)
    expect(screen.getByRole('button', { name: 'New' })).toBeTruthy()
    expect(document.querySelector('h1')).toBeNull()
  })

  it('renders no year chip or date in pagebar mode', () => {
    render(<PageHeader mode="pagebar" actions={[{ label: 'New' }]} />)
    expect(screen.queryByText(/academic year/i)).toBeNull()
    expect(document.querySelector('h1')).toBeNull()
  })
})
