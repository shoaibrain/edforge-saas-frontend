/**
 * useUsers Hooks
 *
 * React Query hooks for user management operations.
 * Follows the query key factory pattern used across the Shell.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  listUsers,
  updateUser,
  changeGlobalRole,
  deleteUser,
  type ListUsersParams,
  type UpdateUserDto,
} from '@/services/users.service'
import type { GlobalRole } from '@edforge/types'

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: ListUsersParams) => [...userKeys.lists(), params] as const,
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

export function useUsers(params: ListUsersParams = {}, enabled = true) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => listUsers(params),
    enabled,
    staleTime: 30 * 1000,
  })
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

export function useChangeGlobalRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: GlobalRole }) =>
      changeGlobalRole(userId, newRole),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      toast.success(`Role changed to ${variables.newRole}`)
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to change role')
    },
  })
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: UpdateUserDto['status'] }) =>
      updateUser(userId, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      toast.success(`User status changed to ${variables.status}`)
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update user status')
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      toast.success('User deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete user')
    },
  })
}
