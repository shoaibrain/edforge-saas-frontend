/**
 * Staff Service
 *
 * API client for staff/teacher lookups.
 * Used primarily by the Section form's teacher selector.
 *
 * FALLBACK STRATEGY:
 * The Ed-Fi Staff endpoint (`GET /schools/{schoolId}/staff`) may return empty
 * if the backend hasn't yet created Staff records. In that case, we fall back
 * to the Identity/Users endpoint (`GET /users`) which has the actual tenant
 * users, and normalize their shape to be compatible with our staff interfaces.
 *
 * Once the backend implements proper Staff <-> User linking, the fallback
 * can be removed.
 */

import { apiGet } from '../lib/api'
import type { StaffResponseDto, StaffListResponseDto } from '@edforge/shared-types'

// Re-export types for convenience
export type { StaffResponseDto, StaffListResponseDto } from '@edforge/shared-types'

// ============================================================================
// USER FALLBACK TYPES
// ============================================================================

/**
 * Shape returned by the Identity/Users service (`GET /users`).
 * Different from the Ed-Fi StaffResponseDto.
 */
interface UserResponseDto {
  userId: string
  email: string
  firstName: string
  lastName: string
  middleName?: string
  displayName?: string
  phone?: string
  globalRole: string
  status: string
  createdAt: string
  updatedAt: string
}

interface UserListResponseDto {
  items: UserResponseDto[]
  hasMore: boolean
  lastEvaluatedKey?: string
}

/**
 * Normalize a UserResponseDto into a partial StaffResponseDto shape
 * so that the Section form can use it in the teacher dropdown.
 */
function userToStaffShape(user: UserResponseDto): StaffResponseDto {
  return {
    staffId: user.userId,
    staffUniqueId: user.userId,
    tenantId: '',
    firstName: user.firstName,
    lastSurname: user.lastName,
    middleName: user.middleName,
    email: user.email,
    phone: user.phone,
    primarySchoolId: '',
    role: 'teacher' as any,
    employmentType: 'full_time' as any,
    employmentStatus: 'active' as any,
    hireDate: user.createdAt,
    status: user.status === 'active' ? 'active' as any : 'pending' as any,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

// ============================================================================
// STAFF OPERATIONS
// ============================================================================

/**
 * Get staff assigned to a school.
 *
 * Tries `GET /schools/{schoolId}/staff` first (Ed-Fi Staff).
 * If that returns empty, falls back to `GET /users` (Identity Users)
 * and normalizes the shape.
 *
 * GET /schools/:schoolId/staff  →  fallback → GET /users
 */
export async function getSchoolStaff(
  schoolId: string
): Promise<StaffListResponseDto> {
  try {
    const staffResult = await apiGet<StaffListResponseDto | { items: any[] }>(
      `/schools/${schoolId}/staff`
    )
    const items = Array.isArray(staffResult) ? staffResult : (staffResult?.items ?? [])

    if (items.length > 0) {
      return Array.isArray(staffResult)
        ? { items: staffResult, hasMore: false, total: staffResult.length } as any
        : staffResult as StaffListResponseDto
    }
  } catch {
    // Staff endpoint failed — fall through to users fallback
  }

  // Fallback: fetch from /users and normalize
  try {
    const usersResult = await apiGet<UserListResponseDto>('/users')
    const users = usersResult?.items ?? []
    const staffItems = users
      .filter((u) => u.status === 'active' || u.status === 'pending')
      .map(userToStaffShape)

    return {
      items: staffItems,
      hasMore: false,
      total: staffItems.length,
    } as StaffListResponseDto
  } catch {
    // Both endpoints failed — return empty
    return { items: [], hasMore: false, total: 0 } as StaffListResponseDto
  }
}

/**
 * Search staff by name
 * GET /staff/search/:term
 */
export async function searchStaff(
  term: string
): Promise<StaffListResponseDto> {
  return apiGet<StaffListResponseDto>(`/staff/search/${encodeURIComponent(term)}`)
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
