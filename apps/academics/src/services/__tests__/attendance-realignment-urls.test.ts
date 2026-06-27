/**
 * Service-URL guard for the attendance-realignment endpoints. Pins the exact
 * apiGet/apiPost URLs against the live backend routes so a refactor can't silently
 * invent a wrong path (a past PR shipped 3 invented URLs that 403'd in prod).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../lib/api', () => ({
  api: {},
  apiGet: vi.fn().mockResolvedValue({}),
  apiPost: vi.fn().mockResolvedValue({}),
  apiPatch: vi.fn().mockResolvedValue({}),
  apiDelete: vi.fn().mockResolvedValue({}),
}))

import { apiGet, apiPost } from '../../lib/api'
import { getAttendancePolicy, getPresenceLocks, exportIemisAttendance } from '../academics.service'

const get = apiGet as unknown as ReturnType<typeof vi.fn>
const post = apiPost as unknown as ReturnType<typeof vi.fn>

describe('attendance realignment service URLs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getAttendancePolicy → GET /academics/attendance/policy?schoolId', async () => {
    await getAttendancePolicy('sch-1')
    expect(get).toHaveBeenCalledWith('/academics/attendance/policy', { schoolId: 'sch-1' })
  })

  it('getPresenceLocks → GET /academics/attendance/presence-locks?schoolId&date', async () => {
    await getPresenceLocks('sch-1', '2026-06-15')
    expect(get).toHaveBeenCalledWith('/academics/attendance/presence-locks', {
      schoolId: 'sch-1',
      date: '2026-06-15',
    })
  })

  it('exportIemisAttendance → POST /academics/attendance/iemis-export with query params (empty body)', async () => {
    await exportIemisAttendance('sch-1', '2026-06', 'ay-1')
    expect(post).toHaveBeenCalledTimes(1)
    const url = post.mock.calls[0][0] as string
    expect(url.startsWith('/academics/attendance/iemis-export?')).toBe(true)
    expect(url).toContain('schoolId=sch-1')
    expect(url).toContain('yearMonth=2026-06')
    expect(url).toContain('academicYearId=ay-1')
    // POST body stays undefined (query-param-only POST)
    expect(post.mock.calls[0][1]).toBeUndefined()
  })
})
