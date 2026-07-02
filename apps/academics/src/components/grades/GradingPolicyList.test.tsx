/// <reference types="@testing-library/jest-dom" />
/**
 * GradingPolicyList — empty-state gate tests (Sprint 1 / Ticket 1.2)
 * plus PolicyCard presentation tests (Classrooms EPIC Phase C).
 *
 * Covers the contract that GradingPolicyList renders the shared empty state
 * when the school has no current academic year, instead of crashing or
 * showing an undefined-policies error, and that PolicyCard renders the
 * design-handoff shape: GPA points on grade-scale chips (failing bands
 * danger-tinted), category-weight progress bars, and the scheme /
 * minimum-passing / rounding meta row.
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

// ----------------------------------------------------------------------------
// PolicyCard (Phase C presentation)
// ----------------------------------------------------------------------------

// Response-shaped fixture; note `letterGrades` (post-D.1.1 name), NOT the old
// `gradingScale`. NG is a terminal fail despite isPassing being irrelevant.
const mockPolicy = {
  policyId: 'policy-1',
  schoolId: 'test-school-id',
  policyName: 'Standard A-F',
  gpaScale: '4.0' as const,
  schemeType: 'letter_gpa' as const,
  letterGrades: [
    { letter: 'A', minPercentage: 90, maxPercentage: 100, gpaPoints: 4, isPassing: true },
    { letter: 'B', minPercentage: 80, maxPercentage: 89, gpaPoints: 3.2, isPassing: true },
    { letter: 'F', minPercentage: 0, maxPercentage: 39, gpaPoints: 0, isPassing: false, isTerminalFail: true },
  ],
  categoryWeights: [
    { categoryId: 'cat-1', categoryName: 'Homework', weight: 40 },
    { categoryId: 'cat-2', categoryName: 'Exams', weight: 60 },
  ],
  roundingRule: 'nearest' as const,
  minimumPassingGrade: 40,
  isDefault: true,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function renderWithPolicy() {
  mockUseCurrentAcademicYear.mockReturnValue({
    data: { yearId: 'year-1', name: '2026-2027' },
    isLoading: false,
  })
  mockUseGradingPolicies.mockReturnValue({ data: [mockPolicy], isLoading: false })
  return render(<GradingPolicyList />)
}

describe('PolicyCard — Phase C presentation', () => {
  it('renders GPA points on each grade-scale chip', () => {
    const { getByText } = renderWithPolicy()
    expect(getByText('A · 90–100% · 4 GPA')).toBeInTheDocument()
    expect(getByText('B · 80–89% · 3.2 GPA')).toBeInTheDocument()
    expect(getByText('F · 0–39% · 0 GPA')).toBeInTheDocument()
  })

  it('tints failing/terminal-fail chips with danger tokens and leaves passing chips neutral', () => {
    const { getByText } = renderWithPolicy()
    const failChip = getByText('F · 0–39% · 0 GPA')
    expect(failChip.className).toContain('text-[rgb(var(--state-danger-fg))]')
    expect(failChip.className).toContain('bg-[rgb(var(--state-danger-bg)/0.18)]')
    const passChip = getByText('A · 90–100% · 4 GPA')
    expect(passChip.className).not.toContain('state-danger')
  })

  it('renders one progress bar per category weight with the weight as its value', () => {
    const { getAllByRole } = renderWithPolicy()
    const bars = getAllByRole('progressbar')
    expect(bars).toHaveLength(2)
    expect(bars[0]).toHaveAttribute('aria-valuenow', '40')
    expect(bars[0]).toHaveAttribute('aria-label', 'Homework weight: 40%')
    expect(bars[1]).toHaveAttribute('aria-valuenow', '60')
    expect(bars[1]).toHaveAttribute('aria-label', 'Exams weight: 60%')
  })

  it('renders the scheme / minimum passing / rounding meta row', () => {
    const { getByText } = renderWithPolicy()
    expect(getByText('Scheme')).toBeInTheDocument()
    expect(getByText('Letter + GPA · 4.0')).toBeInTheDocument()
    expect(getByText('Minimum passing')).toBeInTheDocument()
    expect(getByText('40%')).toBeInTheDocument()
    expect(getByText('Rounding')).toBeInTheDocument()
    expect(getByText('Round to Nearest')).toBeInTheDocument()
  })

  it('keeps the default badge and edit affordance', () => {
    const { getByText, getByLabelText } = renderWithPolicy()
    expect(getByText('Default')).toBeInTheDocument()
    expect(getByLabelText('Edit policy')).toBeInTheDocument()
  })
})
