/**
 * Students Service
 *
 * API client for searching students via the Academics microservice.
 * Used by the Finance MFE for student lookups during invoice generation.
 */

import { apiGet } from '@edforge/api-client'
import type { StudentFamily } from '@edforge/types'

// Minimal student search result (subset of full StudentResponseDto)
export interface StudentSearchResult {
  studentId: string
  firstName: string
  lastName: string
  fullName: string
  studentNumber?: string
  currentGradeLevel: string
  status: string
}

interface StudentSearchResponse {
  items: StudentSearchResult[]
  hasMore: boolean
  lastEvaluatedKey?: string
}

export async function searchStudents(
  schoolId: string,
  search?: string,
  limit: number = 20,
): Promise<StudentSearchResult[]> {
  const response = await apiGet<StudentSearchResponse | StudentSearchResult[]>(
    '/academics/students',
    {
      schoolId,
      ...(search ? { search } : {}),
      status: 'active',
      limit,
    },
  )
  if (Array.isArray(response)) return response
  return response?.items ?? []
}

/**
 * Family-billing (FB) — resolve a student's family group (or null when the
 * student is unaffiliated) plus the sibling set. Cross-domain read against
 * the academics service, mirroring `searchStudents` above.
 *
 * `schoolId` is REQUIRED by the backend (families.controller.ts throws
 * BadRequestException('Missing required parameter: schoolId') without it).
 * GET /academics/students/:studentId/family?schoolId=
 */
export async function getStudentFamily(
  studentId: string,
  schoolId: string,
): Promise<StudentFamily> {
  return apiGet<StudentFamily>(`/academics/students/${studentId}/family`, {
    schoolId,
  })
}
