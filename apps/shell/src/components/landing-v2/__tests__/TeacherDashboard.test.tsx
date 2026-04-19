import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { TeacherDashboard } from '../sections/teachers/TeacherDashboard'

describe('TeacherDashboard', () => {
  afterEach(() => cleanup())

  it('renders the dashboard header + classroom attribution', () => {
    const { getByText } = render(<TeacherDashboard />)
    expect(getByText('Parent Engagement Dashboard')).toBeInTheDocument()
    expect(getByText('Ms. Chen · Room 214')).toBeInTheDocument()
  })

  it('renders the two engagement stat cards with values', () => {
    const { getByText } = render(<TeacherDashboard />)
    expect(getByText('Parent Participation')).toBeInTheDocument()
    expect(getByText('92%')).toBeInTheDocument()
    expect(getByText('24 of 26 parents actively engaged')).toBeInTheDocument()
    expect(getByText('Response Rate')).toBeInTheDocument()
    expect(getByText('4.2')).toBeInTheDocument()
    expect(getByText('hrs')).toBeInTheDocument()
  })

  it('renders the recent parent contact list with 3 family rows', () => {
    const { getByText } = render(<TeacherDashboard />)
    expect(getByText('Recent parent contact')).toBeInTheDocument()
    expect(getByText('Rivera family')).toBeInTheDocument()
    expect(getByText(/O.Brien family/)).toBeInTheDocument() // curly apostrophe
    expect(getByText('Patel family')).toBeInTheDocument()
  })

  it('each contact row has a status label', () => {
    const { getByText } = render(<TeacherDashboard />)
    expect(getByText('Replied')).toBeInTheDocument()
    expect(getByText('Scheduled')).toBeInTheDocument()
    expect(getByText('Open')).toBeInTheDocument()
  })
})
