/// <reference types="@testing-library/jest-dom" />
/**
 * GradingPolicyList — empty-state gate tests (Sprint 1 / Ticket 1.2)
 *
 * Covers the contract that GradingPolicyList renders the shared empty state
 * when the school has no current academic year, instead of crashing or
 * showing an undefined-policies error. The full PolicyCard render path is
 * not exercised here — that's covered by Ticket 1.6's dedicated tests.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

vi.mock('@edforge/abac', () => ({
  useResourcePermissions: () => ({ view: true, create: true, edit: true, delete: false }),
}))

vi.mock('../../stores/app.store', () => ({
  useActiveSchoolId: () => 'test-school-id',
}))

const mockUseCurrentAcademicYear = vi.fn()
const mockUseGradingPolicies = vi.fn()

vi.mock('../../hooks/useSchool', () => ({
  useCurrentAcademicYear: (...args: unknown[]) => mockUseCurrentAcademicYear(...args),
}))

vi.mock('../../hooks/useGrades', () => ({
  useGradingPolicies: (...args: unknown[]) => mockUseGradingPolicies(...args),
}))

// GradingPolicyForm pulls in a lot of unrelated wiring; stub it.
vi.mock('./GradingPolicyForm', () => ({
  GradingPolicyForm: () => <div data-testid="grading-policy-form" />,
}))

import { GradingPolicyList } from './GradingPolicyList'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('GradingPolicyList — empty-state gate', () => {
  it('renders skeleton while currentYear is loading', () => {
    mockUseCurrentAcademicYear.mockReturnValue({ data: undefined, isLoading: true })
    mockUseGradingPolicies.mockReturnValue({ data: undefined, isLoading: false })

    const { container, queryByText } = render(<GradingPolicyList />)
    expect(container.querySelector('.animate-pulse')).not.toBeNull()
    expect(queryByText('No Academic Year Configured')).toBeNull()
  })

  it('renders the shared empty state when no current academic year exists', () => {
    mockUseCurrentAcademicYear.mockReturnValue({ data: undefined, isLoading: false })
    mockUseGradingPolicies.mockReturnValue({ data: [], isLoading: false })

    const { getByText } = render(<GradingPolicyList />)
    expect(getByText('No Academic Year Configured')).toBeInTheDocument()
  })

  it('renders the policies list section header when a current academic year exists', () => {
    mockUseCurrentAcademicYear.mockReturnValue({
      data: { yearId: 'year-1', name: '2026-2027' },
      isLoading: false,
    })
    mockUseGradingPolicies.mockReturnValue({ data: [], isLoading: false })

    const { getByText, queryByText } = render(<GradingPolicyList />)
    expect(getByText('Grading Policies')).toBeInTheDocument()
    expect(queryByText('No Academic Year Configured')).toBeNull()
  })
})
