/**
 * Staff Service
 *
 * API client for staff/teacher lookups.
 * Used primarily by the Section form's teacher selector and the Teachers directory.
 *
 * The backend bridges User → Staff automatically: when a User is assigned to a
 * school with a staffRole, a linked Staff record is created. This service
 * calls the Ed-Fi Staff endpoints directly.
 */

import { apiGet } from '../lib/api'
import type { StaffResponseDto, StaffListResponseDto } from '@edforge/shared-types'

// Re-export types for convenience
export type { StaffResponseDto, StaffListResponseDto } from '@edforge/shared-types'

// ============================================================================
// STAFF OPERATIONS
// ============================================================================

/**
 * Get staff assigned to a school.
 *
 * GET /schools/:schoolId/staff
 *
 * Returns Ed-Fi StaffResponseDto records linked to the school.
 */
export async function getSchoolStaff(
  schoolId: string
): Promise<StaffListResponseDto> {
  const result = await apiGet<StaffListResponseDto | StaffResponseDto[]>(
    `/schools/${schoolId}/staff`
  )

  // Handle both array and paginated response shapes
  if (Array.isArray(result)) {
    return {
      items: result,
      hasMore: false,
    } as StaffListResponseDto
  }

  return result as StaffListResponseDto
}

/**
 * Search staff by name
 * GET /staff/search/:term
 */
export async function searchStaff(
  term: string
): Promise<StaffListResponseDto> {
  const result = await apiGet<StaffListResponseDto | StaffResponseDto[]>(
    `/staff/search/${encodeURIComponent(term)}`
  )

  // Handle both array and paginated response shapes
  if (Array.isArray(result)) {
    return {
      items: result,
      hasMore: false,
    } as StaffListResponseDto
  }

  return result as StaffListResponseDto
}

/**
 * Get a single staff member by ID
 * GET /staff/:staffId
 */
export async function getStaffMember(
  staffId: string
): Promise<StaffResponseDto> {
  return apiGet<StaffResponseDto>(`/staff/${staffId}`)
}

// ============================================================================
// EXPORTED SERVICE OBJECT
// ============================================================================

export const staffService = {
  getSchoolStaff,
  searchStaff,
  getStaffMember,
}
