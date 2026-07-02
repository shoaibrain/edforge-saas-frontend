/// <reference types="@testing-library/jest-dom" />
/**
 * AttendanceModule — entry-level gate + single-dashboard smoke tests.
 *
 * Covers the current-AY gate (which prevents the permanent-skeleton bug when a
 * school has no current academic year) and that, once past the gate, the
 * redesigned single dashboard mounts and surfaces its load-failure state. The
 * dashboard's per-widget maths are unit-tested separately in
 * components/attendance/dashboard/__tests__/coverage.test.ts.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'

// ----------------------------------------------------------------------------
// Mocks — everything below the module is stubbed; the gate + dashboard shell are
// the units under test.
// ----------------------------------------------------------------------------

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

const mockUseAttendanceOverview = vi.fn(() => ({ data: undefined, isLoading: false, error: undefined }))
vi.mock('../../hooks/useAttendance', () => ({
  useAttendanceOverview: (...args: unknown[]) => mockUseAttendanceOverview(...args),
  useAttendancePolicy: () => ({ data: undefined }),
  useAttendanceStudentTrends: () => ({ data: {} }),
  useCalendarDate: () => ({ data: undefined }),
  usePresenceLocks: () => ({ data: undefined }),
  useExportIemisAttendance: () => ({ mutate: vi.fn(), isPending: false, data: undefined, isError: false }),
}))

vi.mock('../../hooks/useSectionAttendance', () => ({
  useSectionAttendanceRecords: () => ({ data: undefined }),
  useRecordBulkSectionAttendance: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
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

// Keep the BS-calendar date UI + heavy roster grid out of these smoke tests.
vi.mock('../../components/attendance/DateSelector', () => ({
  DateSelector: () => <div data-testid="date-selector" />,
}))
vi.mock('../../components/attendance/AttendanceGrid', () => ({
  AttendanceGrid: () => <div data-testid="attendance-grid" />,
}))

import { AttendanceModule } from './index'

const OVERVIEW = {
  todaySummary: { totalStudents: 100, totalRecorded: 50, attendanceRate: 87, byGradeLevel: {} },
  sectionCompletion: {
    totalSections: 2,
    sectionsWithAttendance: 1,
    sections: [
      { sectionId: 's1', sectionNumber: 'A', courseName: 'Math', studentCount: 20, recordedCount: 20, isComplete: true },
      { sectionId: 's2', sectionNumber: 'B', courseName: 'Science', studentCount: 20, recordedCount: 0, isComplete: false },
    ],
  },
  trend: [{ date: '2026-06-01', attendanceRate: 90 }],
  periodAverages: { last7Days: 88, last30Days: 85, academicYear: 60 },
  atRiskStudents: [],
  totalAtRiskCount: 0,
  absenceBreakdown: { unexcused: 0, excused: 0, late: 0, halfDay: 0, remote: 0 },
  dayOfWeekPattern: {},
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  mockUseAttendanceOverview.mockReturnValue({ data: undefined, isLoading: false, error: undefined })
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
    const { getByText } = render(<AttendanceModule />)
    expect(getByText('No Academic Year Configured')).toBeInTheDocument()
  })
})

describe('AttendanceModule — single dashboard', () => {
  it('mounts the dashboard (Sections to record) when a current AY exists', () => {
    mockUseCurrentAcademicYear.mockReturnValue({
      data: { yearId: 'year-1', name: '2026-2027' },
      isLoading: false,
    })
    mockUseAttendanceOverview.mockReturnValue({ data: OVERVIEW, isLoading: false, error: undefined })
    const { getByText, queryByText } = render(<AttendanceModule />)
    // The operational core renders, and no legacy sub-tabs remain.
    expect(getByText('Sections to record')).toBeInTheDocument()
    expect(queryByText('Daily Entry')).toBeNull()
    expect(queryByText('IEMIS Export')).toBeNull()
  })

  it('renders the load-failure card when the overview query errors', () => {
    mockUseCurrentAcademicYear.mockReturnValue({
      data: { yearId: 'year-1', name: '2026-2027' },
      isLoading: false,
    })
    mockUseAttendanceOverview.mockReturnValue({ data: undefined, isLoading: false, error: new Error('boom') })
    const { getByText } = render(<AttendanceModule />)
    expect(getByText('Failed to load attendance overview')).toBeInTheDocument()
  })
})
