/**
 * Class Period React Query Hooks
 *
 * Provides data fetching and mutation hooks for ClassPeriod CRUD.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getClassPeriods,
  getClassPeriod,
  createClassPeriod,
  updateClassPeriod,
  deleteClassPeriod,
} from '../services/class-period.service'
import type {
  ClassPeriodListResponseDto,
  ClassPeriodResponseDto,
  CreateClassPeriodDto,
  UpdateClassPeriodDto,
} from '@aibrains/shared-types'

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const classPeriodKeys = {
  all: ['class-periods'] as const,
  list: (schoolId: string) => [...classPeriodKeys.all, 'list', schoolId] as const,
  detail: (schoolId: string, periodId: string) =>
    [...classPeriodKeys.list(schoolId), periodId] as const,
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

export function useClassPeriods(schoolId: string, enabled = true) {
  return useQuery<ClassPeriodListResponseDto, Error>({
    queryKey: classPeriodKeys.list(schoolId),
    queryFn: () => getClassPeriods(schoolId),
    enabled: enabled && !!schoolId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useClassPeriod(schoolId: string, periodId: string, enabled = true) {
  return useQuery<ClassPeriodResponseDto, Error>({
    queryKey: classPeriodKeys.detail(schoolId, periodId),
    queryFn: () => getClassPeriod(schoolId, periodId),
    enabled: enabled && !!schoolId && !!periodId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

export function useCreateClassPeriod(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateClassPeriodDto) => createClassPeriod(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classPeriodKeys.list(schoolId) })
      toast.success('Class period created')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create class period')
    },
  })
}

export function useUpdateClassPeriod(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ periodId, data }: { periodId: string; data: UpdateClassPeriodDto }) =>
      updateClassPeriod(schoolId, periodId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classPeriodKeys.list(schoolId) })
      toast.success('Class period updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update class period')
    },
  })
}

export function useDeleteClassPeriod(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (periodId: string) => deleteClassPeriod(schoolId, periodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classPeriodKeys.list(schoolId) })
      toast.success('Class period deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete class period')
    },
  })
}
