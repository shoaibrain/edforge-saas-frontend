/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { AdoptionReportV25 } from '../services/analytics.service'
import { AdoptionReportCard } from './AdoptionReportCard'

const baseReport: AdoptionReportV25 = {
  tenantId: 'test-tenant',
  weekKey: '2026-W16',
  weekStartsOn: 'sunday',
  inGracePeriod: false,
  perMetric: {
    teacherLoginCadence: { value: 0.4, threshold: 0.3, status: 'PASS' },
    attendanceCoverage: { value: 0.2, threshold: 0.5, status: 'FAIL' },
    gradeSubmissionCadence: { value: 0.5, threshold: 0.4, status: 'PASS' },
    adminActivity: { value: 1, threshold: 1, status: 'PASS' },
    parentPortalReach: { value: 0.05, threshold: 0.05, status: 'PASS' },
    studentPortalReach: { value: 0.05, threshold: 0.1, status: 'PARTIAL' },
  },
  overall: 'PARTIAL',
}

describe('AdoptionReportCard', () => {
  it('renders the week range from weekKey + sunday-start', () => {
    render(<AdoptionReportCard report={baseReport} />)
    // ISO 2026-W16 = Apr 13–19 (Mon-start). Sunday-start shifts back one day → Apr 12–18.
    expect(screen.getByText(/Apr 12/)).toBeInTheDocument()
    expect(screen.getByText(/Apr 18/)).toBeInTheDocument()
  })

  it('renders all six metric labels', () => {
    render(<AdoptionReportCard report={baseReport} />)
    expect(screen.getByText('Teacher login cadence')).toBeInTheDocument()
    expect(screen.getByText('Attendance coverage')).toBeInTheDocument()
    expect(screen.getByText('Grade submission cadence')).toBeInTheDocument()
    expect(screen.getByText('Admin activity')).toBeInTheDocument()
    expect(screen.getByText('Parent portal reach')).toBeInTheDocument()
    expect(screen.getByText('Student portal reach')).toBeInTheDocument()
  })

  it('shows holiday callout when holidaysExcluded > 0', () => {
    const withHolidays: AdoptionReportV25 ={ ...baseReport, holidaysExcluded: 2 }
    render(<AdoptionReportCard report={withHolidays} />)
    expect(screen.getByText(/2 holidays this week/)).toBeInTheDocument()
  })

  it('shows grace-period callout when inGracePeriod is true', () => {
    const inGrace: AdoptionReportV25 ={ ...baseReport, inGracePeriod: true }
    render(<AdoptionReportCard report={inGrace} />)
    expect(screen.getByText(/onboarding grace period/)).toBeInTheDocument()
  })

  it('renders skeleton when isLoading', () => {
    const { container } = render(<AdoptionReportCard isLoading />)
    expect(container.querySelectorAll('[class*="animate-pulse"], [class*="skeleton"]').length).toBeGreaterThan(0)
  })

  it('renders error state with retry button when onRetry given', () => {
    const onRetry = () => {}
    render(<AdoptionReportCard error={new Error('timeout')} onRetry={onRetry} />)
    expect(screen.getByText(/Could not load adoption report/)).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })
})
