import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SectionCard } from '../layout/SectionCard'

describe('SectionCard', () => {
  it('renders title, description, and children', () => {
    render(
      <SectionCard title="Attendance" description="Today by section">
        Table content
      </SectionCard>
    )

    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Attendance')
    expect(screen.getByText('Today by section')).toBeTruthy()
    expect(screen.getByText('Table content')).toBeTruthy()
  })

  it('renders optional actions', () => {
    render(
      <SectionCard title="Billing" actions={<button type="button">Export</button>}>
        Finance content
      </SectionCard>
    )

    expect(screen.getByRole('button', { name: 'Export' })).toBeTruthy()
  })
})
