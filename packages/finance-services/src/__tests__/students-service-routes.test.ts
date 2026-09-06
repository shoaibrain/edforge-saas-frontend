import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Route-shape guard for the students service.
 *
 * Both calls here are CROSS-DOMAIN reads against the academics microservice
 * (finance MFE consumes them for student lookup + family-billing). They pin
 * the exact path so a refactor can't silently rewrite the URL — a wrong path
 * produces 403 SigV4 (API GW falls through to IAM auth when no route matches).
 *
 * If you change a URL here, change the backend route + API GW spec in the
 * same PR (the three-way route handoff), or this test should fail.
 */

vi.mock('@edforge/api-client', () => ({
  apiGet: vi.fn(() => Promise.resolve({})),
}))

import { apiGet } from '@edforge/api-client'
import { searchStudents, getStudentFamily } from '../services/students.service'

const mockApiGet = vi.mocked(apiGet)

const SCHOOL = 'sch-1'
const STUDENT = 'stu-1'

describe('students.service route shapes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('searchStudents → GET /academics/students', async () => {
    mockApiGet.mockResolvedValue({ items: [], hasMore: false })
    await searchStudents(SCHOOL, 'ann')
    expect(mockApiGet).toHaveBeenCalledWith('/academics/students', {
      schoolId: SCHOOL,
      search: 'ann',
      status: 'active',
      limit: 20,
    })
  })

  it('getStudentFamily → GET /academics/students/:studentId/family?schoolId=', async () => {
    mockApiGet.mockResolvedValue({ family: null, siblings: [] })
    await getStudentFamily(STUDENT, SCHOOL)
    expect(mockApiGet).toHaveBeenCalledWith(
      `/academics/students/${STUDENT}/family`,
      { schoolId: SCHOOL },
    )
  })
})
