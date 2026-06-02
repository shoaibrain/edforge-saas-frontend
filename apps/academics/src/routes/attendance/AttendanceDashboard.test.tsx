/// <reference types="@testing-library/jest-dom" />
/**
 * AttendanceDashboard — defensive-default cleanup tests (Sprint 1 / Ticket 1.3b)
 *
 * Covers the post-1.3a contract: parent guarantees a non-empty
 * `academicYearId` so `isLoading = queryLoading` (no more
 * `|| !queryEnabled`). If a future caller passes an empty `academicYearId`
 * by mistake, the dashboard must render no-data states instead of
 * skeleton-forever.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

vi.mock('@edforge/abac', () => ({
  usePermission: () => false,
}))

const mockUseAttendanceOverview = vi.fn()

vi.mock('../../hooks/useAttendance', () => ({
  useAttendanceOverview: (args: unknown) => mockUseAttendanceOverview(args),
}))

vi.mock('../../components/attendance/StudentAttendanceModal', () => ({
  StudentAttendanceModal: () => null,
}))

import { AttendanceDashboard } from './dashboard'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('AttendanceDashboard — Ticket 1.3b dead-default cleanup', () => {
  /**
   * Regression test for the "skeleton forever" bug. Before 1.3b, the
   * component derived `isLoading = queryLoading || !queryEnabled`. When
   * `academicYearId` arrived as `''` (the original bug from a missing
   * current AY), `queryEnabled=false` → `isLoading=true` permanently →
   * skeletons rendered until the tab closed. After 1.3b,
   * `isLoading = queryLoading`, so the component renders the no-data path
   * instead of looping the loader.
   *
   * We assert this by checking that the empty-academicYearId render does
   * NOT contain the React Query loading-state DOM (which would render
   * SkeletonStrip + multiple SkeletonCard nodes pre-fix).
   */
  it('does NOT loop skeletons when academicYearId is empty (the original bug)', () => {
    mockUseAttendanceOverview.mockReturnValue({
      data: undefined,
      isLoading: false, // disabled query → not loading
      error: undefined,
    })
    const { container } = render(
      <AttendanceDashboard
        schoolId="school-1"
        academicYearId=""
        currentDate="2026-06-02"
      />
    )
    // Pre-fix: 5+ skeleton blocks render with the distinctive grey rgba
    // background. Post-fix: that block is absent because `isLoading=false`.
    const skeletonHeights = Array.from(
      container.querySelectorAll('[style*="background: rgba(255,255,255,0.04)"]')
    )
    expect(skeletonHeights.length).toBe(0)
  })

  it('renders the error card when the query errors', () => {
    mockUseAttendanceOverview.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('boom'),
    })
    const { getByText } = render(
      <AttendanceDashboard
        schoolId="school-1"
        academicYearId="year-1"
        currentDate="2026-06-02"
      />
    )
    expect(getByText('Failed to load attendance overview')).toBeInTheDocument()
  })

  it('renders the data path when the query returns a payload', () => {
    mockUseAttendanceOverview.mockReturnValue({
      data: {
        todaySummary: { totalStudents: 100, totalRecorded: 95, present: 90, absent: 5 },
        periodAverages: { last7Days: 92, last30Days: 90 },
        atRiskStudents: [],
        totalAtRiskCount: 0,
      },
      isLoading: false,
      error: undefined,
    })
    const { container } = render(
      <AttendanceDashboard
        schoolId="school-1"
        academicYearId="year-1"
        currentDate="2026-06-02"
      />
    )
    expect(container.textContent).toContain('100')
  })
})
