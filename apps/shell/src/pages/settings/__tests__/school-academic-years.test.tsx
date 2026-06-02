/// <reference types="@testing-library/jest-dom" />
/**
 * SchoolAcademicYearsPage — isCurrent UI tests (Sprint 2 / Tickets 2.3-2.5).
 *
 * Covers the new derivations and controls:
 *   - 2.3: "Current Academic Year" panel binds to `isCurrent`, not `status`.
 *   - 2.4: "Set as Current" button renders only for non-current,
 *          non-completed AYs and only when an operator clicks confirm.
 *   - 2.5: "Active, not current" pill renders only when status='active'
 *          AND isCurrent=false. The drift callout renders the button
 *          inline so the operator can self-recover.
 *
 * The full create/edit/activate modal flows aren't under test here — only
 * the new isCurrent surfacing and the set-current mutation wiring.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

const mockGetAcademicYears = vi.fn()
const mockSetCurrentAcademicYear = vi.fn()
const mockGetSchool = vi.fn()

vi.mock('@/services/tenant.service', () => ({
  tenantService: {
    getSchool: (...a: unknown[]) => mockGetSchool(...a),
    getAcademicYears: (...a: unknown[]) => mockGetAcademicYears(...a),
    setCurrentAcademicYear: (...a: unknown[]) => mockSetCurrentAcademicYear(...a),
    // Other mutations not exercised by these tests:
    createAcademicYear: vi.fn(),
    updateAcademicYear: vi.fn(),
    updateAcademicYearStatus: vi.fn(),
    createGradingPeriods: vi.fn(),
  },
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({ tenantId: 'tenant-1' }),
}))

vi.mock('@edforge/ui', () => ({
  Button: ({ children, onClick, disabled, title }: any) => (
    <button onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  ),
  DateInput: () => null,
}))

vi.mock('@/components/common/TenantDate', () => ({
  TenantDateRange: ({ start, end }: { start: string; end: string }) => (
    <span>{`${start} - ${end}`}</span>
  ),
}))

vi.mock('@/components/settings/SettingsShared', () => ({
  SettingsSection: ({ title, children }: any) => (
    <section data-testid={`section-${String(title)}`}>{children}</section>
  ),
  SettingsAlert: () => null,
  staggerChildren: {},
  fadeInUp: {},
}))

vi.mock('@edforge/date-utils', () => ({
  adToBS: () => '2083/01/01',
  formatBSDate: () => '2083/01/01',
}))

import SchoolAcademicYearsPage from '../school-academic-years'

// ----------------------------------------------------------------------------
// Test harness
// ----------------------------------------------------------------------------

function renderPage(seededYears?: unknown[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  // Pre-populate the query cache so the page renders the test data
  // immediately, bypassing the dev-only mock-fallback fork at L716. Without
  // this seed, React Query's first render returns `data: undefined`, the
  // page falls back to its built-in mock array (which has `name: '2024-2025'`),
  // and our findByText('AY 2026') races against the slower async resolution.
  if (seededYears) {
    queryClient.setQueryData(['academicYears', 'school-1'], seededYears)
  }
  queryClient.setQueryData(['school', 'school-1'], { calendarSystem: 'gregorian' })
  return render(
    <QueryClientProvider client={queryClient}>
      <SchoolAcademicYearsPage schoolId="school-1" />
    </QueryClientProvider>
  )
}

function ay(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 'year-1',
    tenantId: 'tenant-1',
    schoolId: 'school-1',
    name: '2026-2027',
    startDate: '2026-08-15',
    endDate: '2027-06-15',
    status: 'active',
    isCurrent: true,
    isLocked: true,
    terms: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  mockGetSchool.mockResolvedValue({ calendarSystem: 'gregorian' })
  // Stub confirm globally — defaults to clicking OK.
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe('SchoolAcademicYearsPage — Ticket 2.3 (panel binds to isCurrent)', () => {
  it('renders the Current Academic Year panel for the AY flagged isCurrent=true', () => {
    const { getByTestId, getAllByText } = renderPage([
      ay({ id: 'a', name: 'AY 2026', status: 'active', isCurrent: true }),
      ay({ id: 'b', name: 'AY 2027', status: 'planning', isCurrent: false }),
    ])
    expect(getByTestId('section-Current Academic Year')).toBeInTheDocument()
    // AY 2026 appears in both the "Current" panel and the timeline.
    expect(getAllByText('AY 2026').length).toBeGreaterThanOrEqual(1)
  })

  it('does NOT label the active-but-not-current AY as "Current"', () => {
    const { getByText, queryByTestId } = renderPage([
      ay({ id: 'a', name: 'AY 2026', status: 'active', isCurrent: false }),
    ])
    // Drift callout renders instead of the Current Academic Year section.
    expect(getByText(/is active but no year is designated as current/i)).toBeInTheDocument()
    expect(queryByTestId('section-Current Academic Year')).toBeNull()
  })
})

describe('SchoolAcademicYearsPage — Ticket 2.5 (drift callout + pills)', () => {
  it('renders the drift callout when an AY is active but no AY is current', () => {
    const { getByText } = renderPage([
      ay({ id: 'a', name: 'AY 2026', status: 'active', isCurrent: false }),
      ay({ id: 'b', name: 'AY 2027', status: 'planning', isCurrent: false }),
    ])
    expect(
      getByText(/Academic year "AY 2026" is active but no year is designated as current/i)
    ).toBeInTheDocument()
  })

  it('does NOT render the drift callout when a current AY exists', () => {
    const { queryByText, getAllByText } = renderPage([
      ay({ id: 'a', name: 'AY 2026', status: 'active', isCurrent: true }),
    ])
    expect(getAllByText('AY 2026').length).toBeGreaterThanOrEqual(1)
    expect(queryByText(/is active but no year is designated as current/i)).toBeNull()
  })

  it('renders the "Active, not current" pill in the timeline for drifted AYs', () => {
    const { getAllByText } = renderPage([
      ay({ id: 'a', name: 'AY 2026', status: 'active', isCurrent: false }),
    ])
    const pills = getAllByText('Active, not current')
    expect(pills.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the "Current" pill in the timeline for the designated current AY', () => {
    const { getAllByText } = renderPage([
      ay({ id: 'a', name: 'AY 2026', status: 'active', isCurrent: true }),
    ])
    const currentPills = getAllByText('Current')
    expect(currentPills.length).toBeGreaterThanOrEqual(1)
  })
})

describe('SchoolAcademicYearsPage — Ticket 2.4 (Set-as-Current mutation)', () => {
  it('calls setCurrentAcademicYear from the drift callout button', async () => {
    mockSetCurrentAcademicYear.mockResolvedValue(
      ay({ id: 'a', name: 'AY 2026', status: 'active', isCurrent: true })
    )
    // Stub the refetch the mutation's onSuccess triggers (queryClient
    // .invalidateQueries on ['academicYears', 'school-1']). Without this
    // the refetch yields `undefined` and React Query logs a noisy warning.
    mockGetAcademicYears.mockResolvedValue([
      ay({ id: 'a', name: 'AY 2026', status: 'active', isCurrent: true }),
    ])

    const { getAllByText } = renderPage([
      ay({ id: 'a', name: 'AY 2026', status: 'active', isCurrent: false }),
    ])
    // The drift callout renders one "Set as Current" button. There's also one
    // for any planning AY if present — here there's only the callout's button.
    const buttons = getAllByText('Set as Current')
    fireEvent.click(buttons[0])
    expect(window.confirm).toHaveBeenCalled()
    // React Query v5 enqueues the mutationFn in a microtask; the assertion
    // must wait for the queue to drain.
    await waitFor(() =>
      expect(mockSetCurrentAcademicYear).toHaveBeenCalledWith('school-1', 'a')
    )
  })

  it('renders a "Set as Current" button on planning AYs that are not current', () => {
    const { getAllByText } = renderPage([
      ay({ id: 'a', name: 'AY 2026', status: 'active', isCurrent: true }),
      ay({ id: 'b', name: 'AY 2027', status: 'planning', isCurrent: false }),
    ])
    const buttons = getAllByText('Set as Current')
    // The planning row exposes the button; the active+current row hides it.
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('does NOT render a "Set as Current" button on the AY that is already current', () => {
    const { queryByText, getAllByText } = renderPage([
      ay({ id: 'a', name: 'AY 2026', status: 'active', isCurrent: true }),
    ])
    expect(getAllByText('AY 2026').length).toBeGreaterThanOrEqual(1)
    // No drift callout, no planning AY → no Set-as-Current button anywhere.
    expect(queryByText('Set as Current')).toBeNull()
  })

  it('does NOT fire the mutation when the operator cancels the confirm dialog', () => {
    ;(window.confirm as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce(false)

    const { getAllByText } = renderPage([
      ay({ id: 'b', name: 'AY 2027', status: 'planning', isCurrent: false }),
    ])
    const buttons = getAllByText('Set as Current')
    fireEvent.click(buttons[0])
    expect(mockSetCurrentAcademicYear).not.toHaveBeenCalled()
  })
})
