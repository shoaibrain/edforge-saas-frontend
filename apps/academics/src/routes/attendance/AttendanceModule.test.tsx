/// <reference types="@testing-library/jest-dom" />
/**
 * AttendanceModule — entry-level gate tests (Sprint 1 / Ticket 1.3a)
 *
 * Covers the gate that prevents AttendanceDashboard's permanent-skeleton
 * bug when a school has no current academic year. The downstream content
 * component is heavily stubbed because the gate is the only thing under
 * test here.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

// We only care about the gate. Stub everything below it.
vi.mock('@edforge/abac', () => ({
  usePermission: () => true,
}))

vi.mock('../../stores/app.store', () => ({
  useActiveSchoolId: () => 'test-school-id',
}))

vi.mock('../../stores/attendance.store', () => ({
  useAttendanceStore: (selector: (s: any) => any) =>
    selector({
      selectedDate: '2026-06-02',
      selectedSectionId: null,
      setSelectedSectionId: vi.fn(),
    }),
  useAttendanceDateActions: () => ({
    setSelectedDate: vi.fn(),
    goToPreviousDay: vi.fn(),
    goToNextDay: vi.fn(),
    goToToday: vi.fn(),
  }),
}))

const mockUseCurrentAcademicYear = vi.fn()
vi.mock('../../hooks', async () => {
  const actual = (await vi.importActual('../../hooks')) as Record<string, unknown>
  return {
    ...actual,
    useCurrentAcademicYear: (...args: unknown[]) => mockUseCurrentAcademicYear(...args),
    useSections: () => ({ data: undefined, isLoading: false }),
    useSectionRoster: () => ({ data: undefined, isLoading: false }),
    flattenSectionPages: () => [],
  }
})

vi.mock('../../hooks/useAttendance', () => ({
  useAttendanceSummary: () => ({ data: undefined, isLoading: false }),
  useCalendarDate: () => ({ data: undefined }),
  useAttendanceOverview: () => ({ data: undefined, isLoading: false }),
}))

vi.mock('../../hooks/useSectionAttendance', () => ({
  useSectionAttendanceRecords: () => ({ data: undefined }),
  useRecordBulkSectionAttendance: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateSectionAttendance: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('../../hooks/useOfflineAttendance', () => ({
  useOfflineAttendance: () => ({
    saveStatus: 'idle',
    isOnline: true,
    persistLocally: vi.fn(),
    save: vi.fn(),
  }),
}))

vi.mock('./dashboard', () => ({
  AttendanceDashboard: () => <div data-testid="attendance-dashboard" />,
}))

vi.mock('../../components/attendance/DateSelector', () => ({
  DateSelector: () => <div data-testid="date-selector" />,
}))
vi.mock('../../components/attendance/AttendanceGrid', () => ({
  AttendanceGrid: () => <div data-testid="attendance-grid" />,
}))
vi.mock('../../components/attendance/DailySummary', () => ({
  DailySummary: () => <div data-testid="daily-summary" />,
}))

import { AttendanceModule } from './index'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('AttendanceModule — entry-level current-AY gate', () => {
  it('renders skeleton while the current-AY query is loading', () => {
    mockUseCurrentAcademicYear.mockReturnValue({ data: undefined, isLoading: true })
    const { container, queryByText } = render(<AttendanceModule />)
    expect(container.querySelector('.animate-pulse')).not.toBeNull()
    expect(queryByText('No Academic Year Configured')).toBeNull()
  })

  it('renders the shared empty state when no current academic year exists', () => {
    mockUseCurrentAcademicYear.mockReturnValue({ data: undefined, isLoading: false })
    const { getByText, queryByTestId } = render(<AttendanceModule />)
    expect(getByText('No Academic Year Configured')).toBeInTheDocument()
    // Dashboard never mounts → no permanent-skeleton bug.
    expect(queryByTestId('attendance-dashboard')).toBeNull()
  })

  it('mounts the dashboard inner content when a current academic year exists', () => {
    mockUseCurrentAcademicYear.mockReturnValue({
      data: { yearId: 'year-1', name: '2026-2027' },
      isLoading: false,
    })
    const { getByTestId, queryByText } = render(<AttendanceModule />)
    expect(getByTestId('attendance-dashboard')).toBeInTheDocument()
    expect(queryByText('No Academic Year Configured')).toBeNull()
  })
})
