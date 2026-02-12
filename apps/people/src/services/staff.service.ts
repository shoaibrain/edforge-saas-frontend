/**
 * Staff Service
 *
 * Service for staff management with full CRUD, assignments,
 * employment history, credentials, and leave operations.
 * Uses types from @aibrains/shared-types (single source of truth).
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api'
import type {
  CreateStaffDto,
  CreateStaffWithUserDto,
  UpdateStaffDto,
  StaffResponseDto,
  StaffListResponseDto,
  StaffFilterDto,
  StaffWithUserResponseDto,
  AssignStaffToSchoolDto,
  UpdateStaffAssignmentDto,
  StaffAssignmentResponseDto,
  UpdateEmploymentStatusDto,
  EmploymentHistoryResponseDto,
  CreateCredentialDto,
  UpdateCredentialDto,
  CredentialResponseDto,
  CreateLeaveRequestDto,
  LeaveRequestResponseDto,
  ApproveLeaveDto,
  RejectLeaveDto,
  CancelLeaveDto,
} from '@aibrains/shared-types'

// Re-export types for convenience
export type {
  StaffResponseDto,
  StaffListResponseDto,
  StaffFilterDto,
  CreateStaffDto,
  CreateStaffWithUserDto,
  UpdateStaffDto,
  StaffWithUserResponseDto,
  AssignStaffToSchoolDto,
  UpdateStaffAssignmentDto,
  StaffAssignmentResponseDto,
  UpdateEmploymentStatusDto,
  EmploymentHistoryResponseDto,
  CreateCredentialDto,
  UpdateCredentialDto,
  CredentialResponseDto,
  CreateLeaveRequestDto,
  LeaveRequestResponseDto,
  ApproveLeaveDto,
  RejectLeaveDto,
  CancelLeaveDto,
} from '@aibrains/shared-types'

// ============================================================================
// STAFF CRUD
// ============================================================================

/**
 * Create a new staff member
 * POST /staff
 */
export async function createStaff(data: CreateStaffDto): Promise<StaffResponseDto> {
  return apiPost<StaffResponseDto>('/staff', data)
}

/**
 * Create staff member with linked user account (atomic)
 * POST /staff/with-user
 */
export async function createStaffWithUser(
  data: CreateStaffWithUserDto,
): Promise<StaffWithUserResponseDto> {
  return apiPost<StaffWithUserResponseDto>('/staff/with-user', data)
}

/**
 * Get a staff member by ID
 * GET /staff/:staffId
 */
export async function getStaff(staffId: string): Promise<StaffResponseDto> {
  return apiGet<StaffResponseDto>(`/staff/${staffId}`)
}

/**
 * Update a staff member
 * PATCH /staff/:staffId
 */
export async function updateStaff(
  staffId: string,
  data: UpdateStaffDto,
): Promise<StaffResponseDto> {
  return apiPatch<StaffResponseDto>(`/staff/${staffId}`, data)
}

/**
 * Delete a staff member (soft delete)
 * DELETE /staff/:staffId
 */
export async function deleteStaff(staffId: string): Promise<void> {
  return apiDelete(`/staff/${staffId}`)
}

/**
 * List staff with optional filters and pagination
 * GET /staff
 */
export async function listStaff(
  filters?: Partial<StaffFilterDto>,
): Promise<StaffListResponseDto> {
  const params: Record<string, unknown> = {}
  if (filters?.limit) params.limit = filters.limit
  if (filters?.cursor) params.cursor = filters.cursor
  if (filters?.search) params.search = filters.search
  if (filters?.schoolId) params.schoolId = filters.schoolId
  if (filters?.role) params.role = filters.role
  if (filters?.employmentStatus) params.employmentStatus = filters.employmentStatus
  if (filters?.department) params.department = filters.department

  return apiGet<StaffListResponseDto>('/staff', params)
}

/**
 * Search staff by term (name, email)
 * GET /staff/search/:term
 */
export async function searchStaff(term: string): Promise<StaffListResponseDto> {
  return apiGet<StaffListResponseDto>(`/staff/search/${encodeURIComponent(term)}`)
}

/**
 * Get staff by email
 * GET /staff/by-email
 */
export async function getStaffByEmail(email: string): Promise<StaffResponseDto> {
  return apiGet<StaffResponseDto>('/staff/by-email', { email })
}

// ============================================================================
// STAFF ASSIGNMENTS
// ============================================================================

/**
 * Get all school assignments for a staff member
 * GET /staff/:staffId/assignments
 */
export async function getStaffAssignments(
  staffId: string,
): Promise<StaffAssignmentResponseDto[]> {
  const response = await apiGet<{ items: StaffAssignmentResponseDto[] }>(
    `/staff/${staffId}/assignments`,
  )
  return response.items ?? []
}

/**
 * Create a school assignment for a staff member
 * POST /staff/:staffId/assignments
 */
export async function createAssignment(
  staffId: string,
  data: AssignStaffToSchoolDto,
): Promise<StaffAssignmentResponseDto> {
  return apiPost<StaffAssignmentResponseDto>(`/staff/${staffId}/assignments`, data)
}

/**
 * Update a staff school assignment
 * PATCH /staff/:staffId/assignments/:assignmentId
 */
export async function updateAssignment(
  staffId: string,
  assignmentId: string,
  data: UpdateStaffAssignmentDto,
): Promise<StaffAssignmentResponseDto> {
  return apiPatch<StaffAssignmentResponseDto>(
    `/staff/${staffId}/assignments/${assignmentId}`,
    data,
  )
}

/**
 * Remove a staff school assignment
 * DELETE /staff/:staffId/assignments/:assignmentId
 */
export async function removeAssignment(
  staffId: string,
  assignmentId: string,
): Promise<void> {
  return apiDelete(`/staff/${staffId}/assignments/${assignmentId}`)
}

// ============================================================================
// EMPLOYMENT HISTORY
// ============================================================================

/**
 * Update employment status (creates history entry)
 * POST /staff/:staffId/employment-status
 */
export async function updateEmploymentStatus(
  staffId: string,
  data: UpdateEmploymentStatusDto,
): Promise<StaffResponseDto> {
  return apiPost<StaffResponseDto>(`/staff/${staffId}/employment-status`, data)
}

/**
 * Get employment history for a staff member
 * GET /staff/:staffId/employment-history
 */
export async function getEmploymentHistory(
  staffId: string,
): Promise<EmploymentHistoryResponseDto[]> {
  const response = await apiGet<{ items: EmploymentHistoryResponseDto[] }>(
    `/staff/${staffId}/employment-history`,
  )
  return response.items ?? []
}

// ============================================================================
// CREDENTIALS (existing backend)
// ============================================================================

/**
 * Get staff credentials
 * GET /staff/:staffId/credentials
 */
export async function getStaffCredentials(staffId: string): Promise<CredentialResponseDto[]> {
  const response = await apiGet<{ items: CredentialResponseDto[] }>(`/staff/${staffId}/credentials`)
  return response.items ?? []
}

/**
 * Add a credential to a staff member
 * POST /staff/:staffId/credentials
 */
export async function addCredential(
  staffId: string,
  data: CreateCredentialDto,
): Promise<CredentialResponseDto> {
  return apiPost<CredentialResponseDto>(`/staff/${staffId}/credentials`, data)
}

/**
 * Update a staff credential
 * PATCH /staff/:staffId/credentials/:credentialId
 */
export async function updateCredential(
  staffId: string,
  credentialId: string,
  data: UpdateCredentialDto,
): Promise<CredentialResponseDto> {
  return apiPatch<CredentialResponseDto>(`/staff/${staffId}/credentials/${credentialId}`, data)
}

/**
 * Delete a staff credential
 * DELETE /staff/:staffId/credentials/:credentialId
 */
export async function deleteCredential(
  staffId: string,
  credentialId: string,
): Promise<void> {
  return apiDelete(`/staff/${staffId}/credentials/${credentialId}`)
}

// ============================================================================
// LEAVE (existing backend — routes: /staff/:staffId/leave)
// ============================================================================

/**
 * Get leave requests for a staff member
 * GET /staff/:staffId/leave
 */
export async function getLeaveRequests(staffId: string): Promise<LeaveRequestResponseDto[]> {
  const response = await apiGet<{ items: LeaveRequestResponseDto[] }>(`/staff/${staffId}/leave`)
  return response.items ?? []
}

/**
 * Create a leave request
 * POST /staff/:staffId/leave
 */
export async function createLeaveRequest(
  staffId: string,
  data: CreateLeaveRequestDto,
): Promise<LeaveRequestResponseDto> {
  return apiPost<LeaveRequestResponseDto>(`/staff/${staffId}/leave`, data)
}

/**
 * Approve a leave request
 * PATCH /staff/:staffId/leave/:leaveId/approve
 */
export async function approveLeaveRequest(
  staffId: string,
  leaveId: string,
  data: ApproveLeaveDto,
): Promise<LeaveRequestResponseDto> {
  return apiPatch<LeaveRequestResponseDto>(`/staff/${staffId}/leave/${leaveId}/approve`, data)
}

/**
 * Reject a leave request
 * PATCH /staff/:staffId/leave/:leaveId/reject
 */
export async function rejectLeaveRequest(
  staffId: string,
  leaveId: string,
  data: RejectLeaveDto,
): Promise<LeaveRequestResponseDto> {
  return apiPatch<LeaveRequestResponseDto>(`/staff/${staffId}/leave/${leaveId}/reject`, data)
}

/**
 * Cancel a leave request
 * PATCH /staff/:staffId/leave/:leaveId/cancel
 */
export async function cancelLeaveRequest(
  staffId: string,
  leaveId: string,
  data: CancelLeaveDto,
): Promise<LeaveRequestResponseDto> {
  return apiPatch<LeaveRequestResponseDto>(`/staff/${staffId}/leave/${leaveId}/cancel`, data)
}

// ============================================================================
// EXPORTED SERVICE OBJECT
// ============================================================================

export const staffService = {
  // Staff CRUD
  createStaff,
  createStaffWithUser,
  getStaff,
  updateStaff,
  deleteStaff,
  listStaff,
  searchStaff,
  getStaffByEmail,
  // Assignments
  getStaffAssignments,
  createAssignment,
  updateAssignment,
  removeAssignment,
  // Employment History
  updateEmploymentStatus,
  getEmploymentHistory,
  // Credentials
  getStaffCredentials,
  addCredential,
  updateCredential,
  deleteCredential,
  // Leave
  getLeaveRequests,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
}
