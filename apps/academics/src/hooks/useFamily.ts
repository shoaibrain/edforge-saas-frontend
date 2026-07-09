/**
 * useFamily — React Query hooks for family (family-billing) data.
 *
 * Query-key factory + queries (student→family, families list, members) +
 * create/update/deactivate/add-member/remove-member mutations. Reads use
 * staleTime + enabled gates; mutations invalidate the relevant keys on
 * success. Mirrors useStudents.ts conventions.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  StudentFamily,
  FamilyResponse,
  FamilyMembersResponse,
  CreateFamilyDto,
  UpdateFamilyDto,
  AddFamilyMemberDto,
} from '@edforge/types'
import {
  getStudentFamily,
  listFamilies,
  getFamilyMembers,
  createFamily,
  updateFamily,
  deactivateFamily,
  addFamilyMember,
  removeFamilyMember,
  parseApiError,
  type FamilyListParams,
  type FamilyListResponse,
} from '../services/academics.service'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const familyKeys = {
  all: ['families'] as const,
  lists: (schoolId: string) => [...familyKeys.all, 'list', schoolId] as const,
  list: (schoolId: string, params?: FamilyListParams) =>
    [...familyKeys.lists(schoolId), params ?? {}] as const,
  members: (schoolId: string, familyId: string) =>
    [...familyKeys.all, 'members', schoolId, familyId] as const,
  studentFamily: (studentId: string) =>
    [...familyKeys.all, 'student', studentId] as const,
}

// ============================================================================
// QUERIES
// ============================================================================

/** The family (and siblings) a student belongs to. */
export function useStudentFamily(
  studentId: string,
  options: { enabled?: boolean } = {},
) {
  return useQuery<StudentFamily, Error>({
    queryKey: familyKeys.studentFamily(studentId),
    queryFn: () => getStudentFamily(studentId),
    enabled: (options.enabled ?? true) && !!studentId,
    staleTime: 60 * 1000,
  })
}

/** Families for a school, optionally filtered by name prefix. */
export function useFamilies(
  schoolId: string,
  params?: FamilyListParams,
  options: { enabled?: boolean } = {},
) {
  return useQuery<FamilyListResponse, Error>({
    queryKey: familyKeys.list(schoolId, params),
    queryFn: () => listFamilies(schoolId, params),
    enabled: (options.enabled ?? true) && !!schoolId,
    staleTime: 60 * 1000,
  })
}

/** Members (students) of a family. */
export function useFamilyMembers(
  schoolId: string,
  familyId: string,
  options: { enabled?: boolean } = {},
) {
  return useQuery<FamilyMembersResponse, Error>({
    queryKey: familyKeys.members(schoolId, familyId),
    queryFn: () => getFamilyMembers(schoolId, familyId),
    enabled: (options.enabled ?? true) && !!schoolId && !!familyId,
    staleTime: 60 * 1000,
  })
}

// ============================================================================
// MUTATIONS
// ============================================================================

export function useCreateFamily(schoolId: string) {
  const queryClient = useQueryClient()
  return useMutation<FamilyResponse, Error, CreateFamilyDto>({
    mutationFn: (data) => createFamily(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.lists(schoolId) })
      toast.success('Family created')
    },
    onError: (error) => {
      toast.error(parseApiError(error).message)
    },
  })
}

export function useUpdateFamily(schoolId: string) {
  const queryClient = useQueryClient()
  return useMutation<
    FamilyResponse,
    Error,
    { familyId: string; data: UpdateFamilyDto }
  >({
    mutationFn: ({ familyId, data }) => updateFamily(schoolId, familyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.lists(schoolId) })
      queryClient.invalidateQueries({ queryKey: familyKeys.all })
      toast.success('Family updated')
    },
    onError: (error) => {
      toast.error(parseApiError(error).message)
    },
  })
}

export function useDeactivateFamily(schoolId: string) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (familyId) => deactivateFamily(schoolId, familyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.lists(schoolId) })
      toast.success('Family removed')
    },
    onError: (error) => {
      toast.error(parseApiError(error).message)
    },
  })
}

export function useAddFamilyMember(schoolId: string) {
  const queryClient = useQueryClient()
  return useMutation<
    void,
    Error,
    { familyId: string; data: AddFamilyMemberDto }
  >({
    mutationFn: ({ familyId, data }) =>
      addFamilyMember(schoolId, familyId, data),
    onSuccess: (_result, { familyId, data }) => {
      queryClient.invalidateQueries({
        queryKey: familyKeys.members(schoolId, familyId),
      })
      queryClient.invalidateQueries({
        queryKey: familyKeys.studentFamily(data.studentId),
      })
      queryClient.invalidateQueries({ queryKey: familyKeys.lists(schoolId) })
      toast.success('Student added to family')
    },
    onError: (error) => {
      toast.error(parseApiError(error).message)
    },
  })
}

export function useRemoveFamilyMember(schoolId: string) {
  const queryClient = useQueryClient()
  return useMutation<
    void,
    Error,
    { familyId: string; studentId: string }
  >({
    mutationFn: ({ familyId, studentId }) =>
      removeFamilyMember(schoolId, familyId, studentId),
    onSuccess: (_result, { familyId, studentId }) => {
      queryClient.invalidateQueries({
        queryKey: familyKeys.members(schoolId, familyId),
      })
      queryClient.invalidateQueries({
        queryKey: familyKeys.studentFamily(studentId),
      })
      queryClient.invalidateQueries({ queryKey: familyKeys.lists(schoolId) })
      toast.success('Student removed from family')
    },
    onError: (error) => {
      toast.error(parseApiError(error).message)
    },
  })
}
