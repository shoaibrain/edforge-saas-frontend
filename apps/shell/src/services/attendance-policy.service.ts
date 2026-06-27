/**
 * Attendance Policy Service — Attendance Domain epic (Story 4).
 *
 * Read-only client for the academics attendance-policy resolver. The WRITE
 * path (setting a per-school attendance mode) reuses the existing
 * `tenantService.updateSchoolConfiguration` PATCH on the identity service —
 * there is no dedicated write endpoint here.
 *
 * Backend route: `GET /academics/attendance/policy?schoolId=` →
 * `AttendancePolicyResponseDto` (resolver: school override → tenant default →
 * archetype default → platform).
 */

import { apiGet } from '../lib/api'
import type { AttendancePolicyResponseDto } from '@aibrains/shared-types'

/**
 * Resolve the effective attendance policy for a school.
 * GET /academics/attendance/policy?schoolId=
 */
export async function getSchoolAttendancePolicy(
  schoolId: string,
): Promise<AttendancePolicyResponseDto> {
  return apiGet<AttendancePolicyResponseDto>('/academics/attendance/policy', { schoolId })
}
