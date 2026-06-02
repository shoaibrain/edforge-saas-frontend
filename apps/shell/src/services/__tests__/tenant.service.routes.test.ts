/**
 * Route-shape guard for tenant.service.ts.
 *
 * Per the CLAUDE.md / memory rule "pin frontend service URLs with guard
 * tests" (PR #93 incident): any `*.service.ts` URL string is asserted
 * against the actual backend route here. If a refactor invents a path,
 * this test fails immediately rather than waiting for a 403/404 in prod.
 *
 * Backend routes are defined in `server/lib/tenant-api-prod.json` and the
 * NestJS controllers under `server/application/microservices/identity`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}))

import { apiPatch } from '../../lib/api'
import { patchSchoolGradeLevels } from '../tenant.service'

describe('tenant.service route shapes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(apiPatch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'school-1',
      enabledGradeLevels: ['PG', 'NUR', '1'],
    })
  })

  describe('patchSchoolGradeLevels', () => {
    it('PATCHes /schools/:id/grade-levels with the dto verbatim', async () => {
      await patchSchoolGradeLevels('school-abc', {
        enabledGradeLevels: ['PG', 'NUR', '1', '2'],
      })

      expect(apiPatch).toHaveBeenCalledTimes(1)
      const [url, body] = (apiPatch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(url).toBe('/schools/school-abc/grade-levels')
      expect(body).toEqual({ enabledGradeLevels: ['PG', 'NUR', '1', '2'] })
    })

    it('passes optional gradeLevelLabels through unchanged', async () => {
      await patchSchoolGradeLevels('school-abc', {
        enabledGradeLevels: ['PG'],
        gradeLevelLabels: { PG: { 'ne-NP': 'पीजी' } },
      })

      const [, body] = (apiPatch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(body).toEqual({
        enabledGradeLevels: ['PG'],
        gradeLevelLabels: { PG: { 'ne-NP': 'पीजी' } },
      })
    })

    it('URL-encodes nothing — schoolId is a raw UUID/path segment', async () => {
      await patchSchoolGradeLevels('21aea5da-511f-4dfa-a6f2-6971f63a719f', {
        enabledGradeLevels: ['1'],
      })
      const [url] = (apiPatch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(url).toBe('/schools/21aea5da-511f-4dfa-a6f2-6971f63a719f/grade-levels')
    })
  })
})
