import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageHeader } from '../layout/PageHeader'

describe('PageHeader', () => {
  it('renders title and description', () => {
    render(<PageHeader title="People" description="Manage staff and guardians" />)

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('People')
    expect(screen.getByText('Manage staff and guardians')).toBeTruthy()
  })

  it('renders optional breadcrumbs and actions', () => {
    render(
      <PageHeader
        title="Finance"
        breadcrumbs={<span>Home / Finance</span>}
        actions={<button type="button">Export</button>}
      />
    )

    expect(screen.getByText('Home / Finance')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Export' })).toBeTruthy()
  })
})
