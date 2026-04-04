/**
 * Staff React Query Hooks
 *
 * Query and mutation hooks for staff management,
 * built on top of staffService.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'
import type {
  StaffResponseDto,
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
import { staffService } from '../services/staff.service'
import { usePaginatedQuery, type PaginatedResponse } from './usePaginatedQuery'

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const staffKeys = {
  all: ['staff'] as const,
  lists: () => [...staffKeys.all, 'list'] as const,
  list: (filters?: Partial<StaffFilterDto>) =>
    [...staffKeys.lists(), { ...filters }] as const,
  details: () => [...staffKeys.all, 'detail'] as const,
  detail: (id: string) => [...staffKeys.details(), id] as const,
  assignments: (id: string) =>
    [...staffKeys.all, 'assignments', id] as const,
  history: (id: string) =>
    [...staffKeys.all, 'history', id] as const,
  credentials: (id: string) =>
    [...staffKeys.all, 'credentials', id] as const,
  leave: (id: string) =>
    [...staffKeys.all, 'leave', id] as const,
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Paginated staff list with cursor-based pagination
 */
export function useStaffList(filters?: Partial<Omit<StaffFilterDto, 'limit' | 'cursor'>>) {
  return usePaginatedQuery<StaffResponseDto>({
    queryKey: [...staffKeys.list(filters)],
    queryFn: async ({ limit, cursor }) => {
      const response = await staffService.listStaff({
        ...filters,
        limit,
        cursor,
      })
      return {
        items: response.items,
        lastEvaluatedKey: response.lastEvaluatedKey,
        hasMore: response.hasMore,
      } as PaginatedResponse<StaffResponseDto>
    },
    limit: 20,
  })
}

/**
 * Get a single staff member by ID
 */
export function useStaffDetail(
  staffId: string | undefined,
  options?: Partial<UseQueryOptions<StaffResponseDto>>,
) {
  return useQuery({
    queryKey: staffKeys.detail(staffId!),
    queryFn: () => staffService.getStaff(staffId!),
    enabled: !!staffId,
    staleTime: 30_000,
    ...options,
  })
}

/**
 * Get staff school assignments
 */
export function useStaffAssignments(staffId: string | undefined) {
  return useQuery({
    queryKey: staffKeys.assignments(staffId!),
    queryFn: () => staffService.getStaffAssignments(staffId!),
    enabled: !!staffId,
    staleTime: 30_000,
  })
}

/**
 * Get staff employment history
 */
export function useStaffEmploymentHistory(staffId: string | undefined) {
  return useQuery<EmploymentHistoryResponseDto[]>({
    queryKey: staffKeys.history(staffId!),
    queryFn: () => staffService.getEmploymentHistory(staffId!),
    enabled: !!staffId,
    staleTime: 60_000,
  })
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a staff member (without user account)
 */
export function useCreateStaff() {
  const queryClient = useQueryClient()

  return useMutation<StaffResponseDto, Error, CreateStaffDto>({
    mutationFn: (data) => staffService.createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() })
    },
  })
}

/**
 * Create a staff member with linked user account (atomic)
 */
export function useCreateStaffWithUser() {
  const queryClient = useQueryClient()

  return useMutation<StaffWithUserResponseDto, Error, CreateStaffWithUserDto>({
    mutationFn: (data) => staffService.createStaffWithUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

/**
 * Update a staff member
 */
export function useUpdateStaff() {
  const queryClient = useQueryClient()

  return useMutation<
    StaffResponseDto,
    Error,
    { staffId: string; data: UpdateStaffDto }
  >({
    mutationFn: ({ staffId, data }) => staffService.updateStaff(staffId, data),
    onSuccess: (_, { staffId }) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(staffId) })
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() })
    },
  })
}

/**
 * Delete a staff member (soft delete)
 */
export function useDeleteStaff() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (staffId) => staffService.deleteStaff(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() })
    },
  })
}

/**
 * Create a staff school assignment
 */
export function useCreateAssignment() {
  const queryClient = useQueryClient()

  return useMutation<
    StaffAssignmentResponseDto,
    Error,
    { staffId: string; data: AssignStaffToSchoolDto }
  >({
    mutationFn: ({ staffId, data }) =>
      staffService.createAssignment(staffId, data),
    onSuccess: (_, { staffId }) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.assignments(staffId) })
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(staffId) })
    },
  })
}

/**
 * Update a staff school assignment
 */
export function useUpdateAssignment() {
  const queryClient = useQueryClient()

  return useMutation<
    StaffAssignmentResponseDto,
    Error,
    { staffId: string; assignmentId: string; data: UpdateStaffAssignmentDto }
  >({
    mutationFn: ({ staffId, assignmentId, data }) =>
      staffService.updateAssignment(staffId, assignmentId, data),
    onSuccess: (_, { staffId }) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.assignments(staffId) })
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(staffId) })
    },
  })
}

/**
 * Remove a staff school assignment
 */
export function useRemoveAssignment() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { staffId: string; assignmentId: string }>({
    mutationFn: ({ staffId, assignmentId }) =>
      staffService.removeAssignment(staffId, assignmentId),
    onSuccess: (_, { staffId }) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.assignments(staffId) })
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(staffId) })
    },
  })
}

/**
 * Update staff employment status
 */
export function useUpdateEmploymentStatus() {
  const queryClient = useQueryClient()

  return useMutation<
    StaffResponseDto,
    Error,
    { staffId: string; data: UpdateEmploymentStatusDto }
  >({
    mutationFn: ({ staffId, data }) =>
      staffService.updateEmploymentStatus(staffId, data),
    onSuccess: (_, { staffId }) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(staffId) })
      queryClient.invalidateQueries({ queryKey: staffKeys.history(staffId) })
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() })
    },
  })
}

// ============================================================================
// CREDENTIAL HOOKS
// ============================================================================

/**
 * Get staff credentials
 */
export function useStaffCredentials(staffId: string | undefined) {
  return useQuery<CredentialResponseDto[]>({
    queryKey: staffKeys.credentials(staffId!),
    queryFn: () => staffService.getStaffCredentials(staffId!),
    enabled: !!staffId,
    staleTime: 30_000,
  })
}

/**
 * Create a credential
 */
export function useCreateCredential() {
  const queryClient = useQueryClient()

  return useMutation<
    CredentialResponseDto,
    Error,
    { staffId: string; data: CreateCredentialDto }
  >({
    mutationFn: ({ staffId, data }) =>
      staffService.addCredential(staffId, data),
    onSuccess: (_, { staffId }) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.credentials(staffId) })
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(staffId) })
    },
  })
}

/**
 * Update a credential
 */
export function useUpdateCredential() {
  const queryClient = useQueryClient()

  return useMutation<
    CredentialResponseDto,
    Error,
    { staffId: string; credentialId: string; data: UpdateCredentialDto }
  >({
    mutationFn: ({ staffId, credentialId, data }) =>
      staffService.updateCredential(staffId, credentialId, data),
    onSuccess: (_, { staffId }) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.credentials(staffId) })
    },
  })
}

/**
 * Delete a credential
 */
export function useDeleteCredential() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { staffId: string; credentialId: string }>({
    mutationFn: ({ staffId, credentialId }) =>
      staffService.deleteCredential(staffId, credentialId),
    onSuccess: (_, { staffId }) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.credentials(staffId) })
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(staffId) })
    },
  })
}

// ============================================================================
// LEAVE HOOKS
// ============================================================================

/**
 * Get staff leave requests
 */
export function useStaffLeaveRequests(staffId: string | undefined) {
  return useQuery<LeaveRequestResponseDto[]>({
    queryKey: staffKeys.leave(staffId!),
    queryFn: () => staffService.getLeaveRequests(staffId!),
    enabled: !!staffId,
    staleTime: 30_000,
  })
}

/**
 * Create a leave request
 */
export function useCreateLeaveRequest() {
  const queryClient = useQueryClient()

  return useMutation<
    LeaveRequestResponseDto,
    Error,
    { staffId: string; data: CreateLeaveRequestDto }
  >({
    mutationFn: ({ staffId, data }) =>
      staffService.createLeaveRequest(staffId, data),
    onSuccess: (_, { staffId }) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.leave(staffId) })
    },
  })
}

/**
 * Approve a leave request
 */
export function useApproveLeave() {
  const queryClient = useQueryClient()

  return useMutation<
    LeaveRequestResponseDto,
    Error,
    { staffId: string; leaveId: string; data: ApproveLeaveDto }
  >({
    mutationFn: ({ staffId, leaveId, data }) =>
      staffService.approveLeaveRequest(staffId, leaveId, data),
    onSuccess: (_, { staffId }) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.leave(staffId) })
    },
  })
}

/**
 * Reject a leave request
 */
export function useRejectLeave() {
  const queryClient = useQueryClient()

  return useMutation<
    LeaveRequestResponseDto,
    Error,
    { staffId: string; leaveId: string; data: RejectLeaveDto }
  >({
    mutationFn: ({ staffId, leaveId, data }) =>
      staffService.rejectLeaveRequest(staffId, leaveId, data),
    onSuccess: (_, { staffId }) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.leave(staffId) })
    },
  })
}

/**
 * Cancel a leave request
 */
export function useCancelLeave() {
  const queryClient = useQueryClient()

  return useMutation<
    LeaveRequestResponseDto,
    Error,
    { staffId: string; leaveId: string; data: CancelLeaveDto }
  >({
    mutationFn: ({ staffId, leaveId, data }) =>
      staffService.cancelLeaveRequest(staffId, leaveId, data),
    onSuccess: (_, { staffId }) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.leave(staffId) })
    },
  })
}
