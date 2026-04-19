import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { DistrictDashboard } from '../sections/district/DistrictDashboard'

describe('DistrictDashboard', () => {
  afterEach(() => cleanup())

  it('renders the District Overview header', () => {
    const { getByText } = render(<DistrictDashboard />)
    expect(getByText('District Overview')).toBeInTheDocument()
    expect(getByText('Real-time performance metrics')).toBeInTheDocument()
  })

  it('renders 3 stat cards with values + labels', () => {
    const { getByText } = render(<DistrictDashboard />)
    expect(getByText('Total students')).toBeInTheDocument()
    expect(getByText('45,231')).toBeInTheDocument()
    expect(getByText('Total staff')).toBeInTheDocument()
    expect(getByText('3,402')).toBeInTheDocument()
    expect(getByText('Avg attendance')).toBeInTheDocument()
    expect(getByText('94.2%')).toBeInTheDocument()
  })

  it('renders a status tag for 12 schools', () => {
    const { getByText } = render(<DistrictDashboard />)
    expect(getByText('12 schools')).toBeInTheDocument()
    expect(getByText('Live')).toBeInTheDocument()
  })

  it('renders the financial performance chart as an accessible SVG', () => {
    const { getByRole } = render(<DistrictDashboard />)
    const chart = getByRole('img', { name: /financial performance/i })
    expect(chart.tagName.toLowerCase()).toBe('svg')
  })

  it('renders the action items block with 3 items', () => {
    const { getByText } = render(<DistrictDashboard />)
    expect(getByText('Action items')).toBeInTheDocument()
    expect(getByText('Budget variance')).toBeInTheDocument()
    expect(getByText('New enrollments')).toBeInTheDocument()
    expect(getByText('Attendance up')).toBeInTheDocument()
  })
})
