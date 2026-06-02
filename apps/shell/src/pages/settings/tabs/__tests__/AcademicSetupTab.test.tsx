/// <reference types="@testing-library/jest-dom" />
/**
 * AcademicSetupTab — Set-as-Current UI tests
 * (academic-year-current-flag-bug follow-up to Sprint 2).
 *
 * Sprint 2 originally added `isCurrent`-aware UI to `school-academic-years.tsx`,
 * but that file is orphaned — no production route renders it. The actual
 * `/settings/organization/schools/:id?tab=academic-setup` view is rendered
 * by THIS component (mounted from `school-detail.tsx`). These tests pin the
 * UI to the correct component so the bug class can't recur.
 *
 * Scope:
 *  - drift callout when `status='active' && !isCurrent` and no AY is current
 *  - "Current" pill on a designated current AY
 *  - "Not current" pill on an active-but-undesignated AY
 *  - "Set as Current" button hidden when already current / completed
 *  - mutation fires with confirm = true
 *  - mutation suppressed when operator cancels confirm
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

const mockGetAcademicYears = vi.fn()
const mockSetCurrentAcademicYear = vi.fn()

vi.mock('@/services/tenant.service', () => ({
  tenantService: {
    getAcademicYears: (...a: unknown[]) => mockGetAcademicYears(...a),
    setCurrentAcademicYear: (...a: unknown[]) => mockSetCurrentAcademicYear(...a),
    createAcademicYear: vi.fn(),
    updateAcademicYear: vi.fn(),
    updateAcademicYearStatus: vi.fn(),
    createGradingPeriods: vi.fn(),
  },
}))

vi.mock('@edforge/ui', () => ({
  DateInput: () => null,
}))

vi.mock('@/hooks/useCalendar', () => ({
  useAcademicSessions: () => ({ data: { items: [] } }),
  useCalendarStats: () => ({ data: { totalDays: 0 } }),
  useCalendarDates: () => ({ data: [] }),
  useUpdateCalendarDate: () => ({ mutate: vi.fn(), isPending: false }),
  useGenerateCalendar: () => ({ mutate: vi.fn(), isPending: false }),
  useLocaleHolidays: () => ({ data: [] }),
  useCreateAcademicSession: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/hooks/useBellSchedules', () => ({
  useBellSchedules: () => ({ data: { items: [] } }),
  useCreateBellSchedule: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/hooks/useLocaleDefaults', () => ({
  useLocaleDefaults: () => ({
    calendarSystem: 'gregorian',
    isNepal: false,
    timezone: 'UTC',
    weekStart: 'sunday',
  }),
}))

vi.mock('@/utils/localeDefaults', () => ({
  dayToIndex: (d: string) => ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].indexOf(d),
}))

vi.mock('@edforge/date-utils', () => ({
  adToBS: () => '2083/01/01',
  BS_MONTH_NAMES_EN: [
    'Baisakh','Jestha','Ashadh','Shrawan','Bhadra','Ashwin',
    'Kartik','Mangsir','Poush','Magh','Falgun','Chaitra',
  ],
}))

vi.mock('@/components/calendar/event-types', () => ({
  EVENT_TYPE_COLORS: {},
  OPERATOR_SELECTABLE_TYPES: [],
  INSTRUCTIONAL_TYPES: [],
  DAY_TYPE_LEGEND_CHIPS: [],
}))

vi.mock('@/components/calendar/BlocksPanel', () => ({
  BlocksPanel: () => null,
}))

vi.mock('@/components/calendar/single-day-curated-options', () => ({
  CURATED_OPTIONS_FOR_DROPDOWN: [],
  decodeCalendarEvent: () => null,
  encodeCuratedOption: () => null,
  getCuratedMeta: () => null,
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import AcademicSetupTab from '../AcademicSetupTab'

// ----------------------------------------------------------------------------
// Test harness
// ----------------------------------------------------------------------------

function renderTab(seededYears: unknown[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  // Pre-populate the AY cache so the wizard renders the test data
  // immediately (no async race against the mocked fetch).
  queryClient.setQueryData(['academicYears', 'school-1'], seededYears)
  // Also stub the fetcher so any refetch lands real data, not undefined
  // (React Query warns on undefined query results).
  mockGetAcademicYears.mockResolvedValue(seededYears)
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <AcademicSetupTab
        schoolId="school-1"
        school={{
          id: 'school-1',
          tenantId: 't-1',
          name: 'Test School',
          code: 'TS',
          status: 'active',
          isActive: true,
          calendarSystem: 'gregorian',
        }}
      />
    </QueryClientProvider>
  )
  // The wizard auto-advances to the first incomplete step. With a seeded
  // year, the 'years' step is marked complete and the wizard jumps to
  // 'sessions'. Click the sidebar "Academic Years" entry to navigate back
  // — that's the step under test here.
  fireEvent.click(utils.getByText('Academic Years'))
  return utils
}

function ay(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'year-1',
    yearId: 'year-1',
    tenantId: 't-1',
    schoolId: 'school-1',
    name: 'AY 2026',
    startDate: '2026-08-15',
    endDate: '2027-06-15',
    status: 'active',
    isCurrent: true,
    isLocked: true,
    terms: [],
    ...overrides,
  }
}

beforeEach(() => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe('AcademicSetupTab — drift callout', () => {
  it('renders the drift callout when an AY is active but no AY is current', () => {
    const { getByText } = renderTab([
      ay({ yearId: 'a', name: 'AY 2026', status: 'active', isCurrent: false }),
    ])
    expect(
      getByText(/"AY 2026" is active but no year is designated as current/i),
    ).toBeInTheDocument()
  })

  it('does NOT render the drift callout when a designated current AY exists', () => {
    const { queryByText } = renderTab([
      ay({ yearId: 'a', name: 'AY 2026', status: 'active', isCurrent: true }),
    ])
    expect(
      queryByText(/is active but no year is designated as current/i),
    ).toBeNull()
  })
})

describe('AcademicSetupTab — per-AY pills', () => {
  it('renders the "Current" pill on the designated current AY', () => {
    const { getAllByText } = renderTab([
      ay({ yearId: 'a', name: 'AY 2026', status: 'active', isCurrent: true }),
    ])
    expect(getAllByText('Current').length).toBeGreaterThanOrEqual(1)
  })

  it('renders the "Not current" pill on an active-but-undesignated AY', () => {
    const { getAllByText } = renderTab([
      ay({ yearId: 'a', name: 'AY 2026', status: 'active', isCurrent: false }),
    ])
    expect(getAllByText('Not current').length).toBeGreaterThanOrEqual(1)
  })

  it('does NOT render the "Not current" pill on a planning AY', () => {
    const { queryByText } = renderTab([
      ay({ yearId: 'a', name: 'AY 2026', status: 'planning', isCurrent: false }),
    ])
    expect(queryByText('Not current')).toBeNull()
  })
})

describe('AcademicSetupTab — Set-as-Current button', () => {
  it('renders the button on a planning AY when no AY is current', () => {
    const { getAllByText } = renderTab([
      ay({ yearId: 'a', name: 'AY 2027', status: 'planning', isCurrent: false }),
    ])
    expect(getAllByText('Set as Current').length).toBeGreaterThanOrEqual(1)
  })

  it('does NOT render the button on the AY already current', () => {
    const { queryByText } = renderTab([
      ay({ yearId: 'a', name: 'AY 2026', status: 'active', isCurrent: true }),
    ])
    expect(queryByText('Set as Current')).toBeNull()
  })

  it('does NOT render the button on a completed AY', () => {
    const { queryByText } = renderTab([
      ay({ yearId: 'a', name: 'AY 2023', status: 'completed', isCurrent: false }),
    ])
    expect(queryByText('Set as Current')).toBeNull()
  })

  it('fires setCurrentAcademicYear with the correct yearId on confirm', async () => {
    mockSetCurrentAcademicYear.mockResolvedValue(
      ay({ yearId: 'a', name: 'AY 2026', status: 'active', isCurrent: true }),
    )
    const { getAllByText } = renderTab([
      ay({ yearId: 'a', name: 'AY 2026', status: 'active', isCurrent: false }),
    ])
    // Drift callout renders one button; the row may render another. Click the
    // first occurrence and assert the mutation argument carries the yearId.
    const buttons = getAllByText('Set as Current')
    fireEvent.click(buttons[0])
    expect(window.confirm).toHaveBeenCalled()
    await waitFor(() =>
      expect(mockSetCurrentAcademicYear).toHaveBeenCalledWith('school-1', 'a'),
    )
  })

  it('does NOT fire the mutation when the operator cancels confirm', () => {
    ;(window.confirm as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce(false)
    const { getAllByText } = renderTab([
      ay({ yearId: 'b', name: 'AY 2027', status: 'planning', isCurrent: false }),
    ])
    fireEvent.click(getAllByText('Set as Current')[0])
    expect(mockSetCurrentAcademicYear).not.toHaveBeenCalled()
  })
})
