/**
 * tenant.service academic-year mapping + route-shape guard.
 *
 * Sprint 2 / Tickets 2.1 + 2.2 (academic-year-current-flag-bug).
 *
 * Covers:
 *   - `mapApiAcademicYear` preserves the `isCurrent` flag end-to-end.
 *     Previously the field was discarded (a stale "Map isCurrent to
 *     isLocked" comment claimed it mapped to a different concept,
 *     but didn't). The downstream school-academic-years UI then read
 *     `status === 'active'` as a proxy for "current", which silently
 *     diverged from the backend whenever the two fell out of sync.
 *   - `setCurrentAcademicYear` PUTs the right URL with no body.
 *     Backend route registered in server/lib/tenant-api-prod.json:2440.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}))

import { apiGet, apiPut } from '../../lib/api'
import {
  getAcademicYears,
  setCurrentAcademicYear,
} from '../tenant.service'

describe('mapApiAcademicYear — Ticket 2.1 isCurrent pass-through', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('preserves isCurrent=true from the API payload', async () => {
    ;(apiGet as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [
        {
          yearId: 'year-1',
          tenantId: 't-1',
          schoolId: 's-1',
          name: '2026-2027',
          startDate: '2026-08-15',
          endDate: '2027-06-15',
          status: 'active',
          isCurrent: true,
          isLocked: true,
          terms: [],
        },
      ],
    })

    const years = await getAcademicYears('s-1')
    expect(years).toHaveLength(1)
    expect(years[0].isCurrent).toBe(true)
    // Lock follows lifecycle stage independently:
    expect(years[0].isLocked).toBe(true)
  })

  it('preserves isCurrent=false from the API payload', async () => {
    ;(apiGet as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [
        {
          yearId: 'year-2',
          tenantId: 't-1',
          schoolId: 's-1',
          name: '2027-2028',
          startDate: '2027-08-15',
          endDate: '2028-06-15',
          status: 'active',
          isCurrent: false,
          terms: [],
        },
      ],
    })

    const years = await getAcademicYears('s-1')
    expect(years[0].isCurrent).toBe(false)
  })

  it('defaults isCurrent to false when the API omits the field (defensive)', async () => {
    ;(apiGet as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [
        {
          yearId: 'year-3',
          tenantId: 't-1',
          schoolId: 's-1',
          name: '2025-2026',
          startDate: '2025-08-15',
          endDate: '2026-06-15',
          status: 'completed',
          terms: [],
        },
      ],
    })

    const years = await getAcademicYears('s-1')
    expect(years[0].isCurrent).toBe(false)
  })

  it('does NOT infer isCurrent from status=active (the original bug)', async () => {
    // This was the source of Bug A: the UI was deriving "current" from
    // `status === 'active'` because the mapper threw away the real flag.
    // After 2.1, the mapper reads the real `isCurrent` field, so the
    // mapped object reflects the backend truth even when status='active'.
    ;(apiGet as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [
        {
          yearId: 'year-4',
          tenantId: 't-1',
          schoolId: 's-1',
          name: '2026-2027',
          startDate: '2026-08-15',
          endDate: '2027-06-15',
          status: 'active',
          isCurrent: false,
          terms: [],
        },
      ],
    })

    const years = await getAcademicYears('s-1')
    expect(years[0].status).toBe('active')
    expect(years[0].isCurrent).toBe(false)
  })
})

describe('setCurrentAcademicYear — Ticket 2.2 route-shape guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(apiPut as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      yearId: 'year-1',
      schoolId: 'school-1',
      name: '2026-2027',
      startDate: '2026-08-15',
      endDate: '2027-06-15',
      status: 'active',
      isCurrent: true,
    })
  })

  it('PUTs /schools/:schoolId/academic-years/:yearId/set-current', async () => {
    await setCurrentAcademicYear('school-1', 'year-1')

    expect(apiPut).toHaveBeenCalledTimes(1)
    const [url] = (apiPut as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe('/schools/school-1/academic-years/year-1/set-current')
  })

  it('returns the mapped AcademicYear with isCurrent=true on success', async () => {
    const result = await setCurrentAcademicYear('school-1', 'year-1')
    expect(result.id).toBe('year-1')
    expect(result.isCurrent).toBe(true)
  })
})
