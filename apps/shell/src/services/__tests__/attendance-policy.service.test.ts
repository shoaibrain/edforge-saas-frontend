/**
 * Route-shape guard for attendance-policy.service.ts.
 *
 * Per the "pin frontend service URLs with guard tests" rule: assert the read
 * helper calls the exact backend route the academics resolver serves
 * (`GET /academics/attendance/policy?schoolId=`). A refactor that invents a
 * path fails here instead of 403/404-ing in prod.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}))

import { apiGet } from '../../lib/api'
import { getSchoolAttendancePolicy } from '../attendance-policy.service'

describe('attendance-policy.service route shapes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(apiGet as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      schoolId: 's1',
      effectiveMode: 'daily_presence',
      modeSource: 'archetype',
      countingPolicy: { granularPresenceThresholdPct: 50 },
      countingSource: 'archetype',
    })
  })

  it('GETs /academics/attendance/policy with schoolId as a query param', async () => {
    await getSchoolAttendancePolicy('s1')

    expect(apiGet).toHaveBeenCalledTimes(1)
    const [url, params] = (apiGet as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe('/academics/attendance/policy')
    expect(params).toEqual({ schoolId: 's1' })
  })

  it('returns the resolver payload unchanged', async () => {
    const result = await getSchoolAttendancePolicy('s1')
    expect(result.effectiveMode).toBe('daily_presence')
    expect(result.modeSource).toBe('archetype')
  })
})
