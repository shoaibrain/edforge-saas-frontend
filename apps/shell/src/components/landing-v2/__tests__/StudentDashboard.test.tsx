import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { StudentDashboard } from '../sections/students/StudentDashboard'

describe('StudentDashboard', () => {
  afterEach(() => cleanup())

  it('renders the dashboard header + student attribution', () => {
    const { getByText } = render(<StudentDashboard />)
    expect(getByText('Recommended For You')).toBeInTheDocument()
    expect(getByText('Jordan · Grade 10')).toBeInTheDocument()
  })

  it('renders the "On track" status tag', () => {
    const { getByText } = render(<StudentDashboard />)
    expect(getByText('On track')).toBeInTheDocument()
  })

  it('renders the weekly focus chart as an accessible SVG', () => {
    const { getByRole } = render(<StudentDashboard />)
    const chart = getByRole('img', { name: /weekly focus/i })
    expect(chart.tagName.toLowerCase()).toBe('svg')
  })

  it('renders 3 recommended task rows with their badges', () => {
    const { getByText } = render(<StudentDashboard />)
    expect(getByText('Practice algebra word problems')).toBeInTheDocument()
    expect(getByText(/Cellular biology/)).toBeInTheDocument()
    expect(getByText('Submit: History essay draft')).toBeInTheDocument()
    expect(getByText('+15 XP')).toBeInTheDocument()
    expect(getByText('Start')).toBeInTheDocument()
    expect(getByText('Open')).toBeInTheDocument()
  })

  it('renders the week label', () => {
    const { getByText } = render(<StudentDashboard />)
    expect(getByText('Week of Apr 15')).toBeInTheDocument()
  })
})
