/**
 * Integration tests for the Government Reports export page.
 *
 * Renders the real component through its real React Query hooks + a
 * QueryClientProvider, mocking only the *service* layer (HTTP) + the
 * cross-cutting deps it can't run headless (router navigate, the active-school
 * zustand selector, sonner toast). This exercises the actual gate logic,
 * query/mutation wiring, and operator interactions — the things pure-helper
 * tests can't reach.
 *
 * Coverage:
 *  1. emisSchoolCode gate — no IEMIS code → guidance, not the generate form.
 *  2. Eligible render — active-school header, academic-year dropdown defaulted
 *     to the current BS year, and a history row with status + download action.
 *  3. Generate → calls createReportingSnapshot with the selected template/year.
 *  4. Download → calls getReportingSnapshotDownload for that snapshot.
 *  5. Mark verified → transitions a submitted snapshot to 'verified'.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type * as TanstackRouter from '@tanstack/react-router'

const { SCHOOL_ID } = vi.hoisted(() => ({
  SCHOOL_ID: '3c28654f-c623-449b-8211-67c729784d37',
}))

// --- Mocks: cross-cutting deps the page needs but the test can't run live ---
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof TanstackRouter>()),
  useNavigate: () => vi.fn(),
}))

vi.mock('../../../stores/app.store', () => ({
  useActiveSchoolId: () => SCHOOL_ID,
  useActiveSchoolStatus: () => 'active',
}))

// --- Mocks: the service (HTTP) layer ---
vi.mock('../../../services/government-reports.service', () => ({
  listReportingSnapshots: vi.fn(),
  createReportingSnapshot: vi.fn(),
  preflightReportingSnapshot: vi.fn(),
  getReportingSnapshot: vi.fn(),
  getReportingSnapshotDownload: vi.fn(),
  transitionReportingSnapshot: vi.fn(),
}))

vi.mock('../../../services/school.service', () => ({
  getSchoolProfile: vi.fn(),
  getAcademicYears: vi.fn(),
  getCurrentAcademicYear: vi.fn(),
  getGradingPeriods: vi.fn(),
  setCurrentAcademicYear: vi.fn(),
  updateAcademicYearStatus: vi.fn(),
}))

import { GovernmentReportsExport } from '../GovernmentReportsExport'
import {
  createReportingSnapshot,
  getReportingSnapshot,
  getReportingSnapshotDownload,
  listReportingSnapshots,
  transitionReportingSnapshot,
} from '../../../services/government-reports.service'
import { getAcademicYears, getSchoolProfile } from '../../../services/school.service'
import type {
  ReportingSnapshot,
  ReportingSnapshotStatus,
  ReportingTemplateId,
} from '../government-reports.types'

const ELIGIBLE_SCHOOL = {
  schoolId: SCHOOL_ID,
  name: 'Shree Saraswati',
  schoolCode: 'SCH001',
  emisSchoolCode: '12345',
  schoolType: 'private',
  status: 'active',
}

const YEAR_2083 = {
  yearId: 'year-2083',
  schoolId: SCHOOL_ID,
  name: '2083',
  startDate: '2026-04-14',
  endDate: '2027-04-13',
  isCurrent: true,
  status: 'active' as const,
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
}

function makeSnapshot(overrides: Partial<ReportingSnapshot> = {}): ReportingSnapshot {
  return {
    snapshotId: 'snap-1',
    schoolId: SCHOOL_ID,
    templateId: 'IEMIS_NPL_CEHRD_FLASH_I' as ReportingTemplateId,
    academicYearBs: '2083',
    status: 'generated' as ReportingSnapshotStatus,
    s3Key: `tenant=t/school=${SCHOOL_ID}/snap-1.csv`,
    rowCount: 42,
    generatedAt: '2026-06-01T00:00:00.000Z',
    schemaVersion: 'v1',
    createdAt: '2026-06-01T00:00:00.000Z',
    createdBy: 'u',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  }
}

function renderPage(ui: ReactNode = <GovernmentReportsExport />) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('GovernmentReportsExport (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSchoolProfile).mockResolvedValue(ELIGIBLE_SCHOOL as never)
    vi.mocked(getAcademicYears).mockResolvedValue([YEAR_2083] as never)
    vi.mocked(listReportingSnapshots).mockResolvedValue({ snapshots: [], count: 0 })
    vi.mocked(getReportingSnapshot).mockImplementation((id: string) =>
      Promise.resolve(makeSnapshot({ snapshotId: id, status: 'generated' })),
    )
  })

  it('gates on emisSchoolCode — shows guidance, not the generate form', async () => {
    vi.mocked(getSchoolProfile).mockResolvedValue({
      ...ELIGIBLE_SCHOOL,
      emisSchoolCode: undefined,
    } as never)

    renderPage()

    expect(await screen.findByText(/no IEMIS code yet/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Generate report/i })).toBeNull()
  })

  it('renders the form, active-school header, year dropdown default, and history row', async () => {
    vi.mocked(listReportingSnapshots).mockResolvedValue({
      snapshots: [makeSnapshot({ status: 'generated' })],
      count: 1,
    })

    renderPage()

    // Active-school context in the header
    expect(await screen.findByText('Shree Saraswati')).toBeTruthy()
    expect(screen.getByText(/IEMIS 12345/)).toBeTruthy()
    // Academic-year dropdown populated + defaulted to the current year
    expect(await screen.findByText('2083 · current')).toBeTruthy()
    // History row with status + download action
    expect(await screen.findByText('Ready')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Download CSV' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Generate report/i })).toBeTruthy()
  })

  it('Generate calls createReportingSnapshot with the selected template + year', async () => {
    vi.mocked(createReportingSnapshot).mockResolvedValue(makeSnapshot({ status: 'generated' }))

    renderPage()

    // Wait until the year has defaulted (Generate becomes enabled)
    await screen.findByText('2083 · current')
    fireEvent.click(screen.getByRole('button', { name: /Generate report/i }))

    await waitFor(() =>
      expect(vi.mocked(createReportingSnapshot)).toHaveBeenCalledWith({
        templateId: 'IEMIS_NPL_CEHRD_FLASH_I',
        academicYearBs: '2083',
        schoolId: SCHOOL_ID,
      }),
    )
  })

  it('Download mints a presigned URL for the snapshot', async () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    vi.mocked(listReportingSnapshots).mockResolvedValue({
      snapshots: [makeSnapshot({ snapshotId: 'snap-1', status: 'generated' })],
      count: 1,
    })
    vi.mocked(getReportingSnapshotDownload).mockResolvedValue({
      url: 'https://s3.example/presigned?sig=x',
      fileName: 'IEMIS_NPL_CEHRD_FLASH_I_2083.csv',
      s3Key: 'k',
      expiresInSeconds: 600,
      expiresAt: '2026-06-01T00:10:00.000Z',
    })

    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Download CSV' }))

    await waitFor(() =>
      expect(vi.mocked(getReportingSnapshotDownload)).toHaveBeenCalledWith('snap-1', SCHOOL_ID),
    )
  })

  it('Mark verified transitions a submitted snapshot to verified', async () => {
    vi.mocked(listReportingSnapshots).mockResolvedValue({
      snapshots: [makeSnapshot({ snapshotId: 'snap-2', status: 'submitted' })],
      count: 1,
    })
    vi.mocked(transitionReportingSnapshot).mockResolvedValue(
      makeSnapshot({ snapshotId: 'snap-2', status: 'verified' }),
    )

    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Mark verified' }))

    await waitFor(() =>
      expect(vi.mocked(transitionReportingSnapshot)).toHaveBeenCalledWith(
        'snap-2',
        SCHOOL_ID,
        'verified',
      ),
    )
  })
})
