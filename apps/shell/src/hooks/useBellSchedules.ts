/**
 * Bell Schedule React Query Hooks
 *
 * Provides data fetching and mutation hooks for BellSchedule CRUD.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { extractApiErrorMessage } from '@edforge/api-client'
import {
  getBellSchedules,
  getBellSchedule,
  createBellSchedule,
  updateBellSchedule,
  deleteBellSchedule,
  setDefaultBellSchedule,
} from '../services/bell-schedule.service'
import type {
  BellScheduleListResponseDto,
  BellScheduleResponseDto,
  CreateBellScheduleDto,
  UpdateBellScheduleDto,
} from '@aibrains/shared-types'

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const bellScheduleKeys = {
  all: ['bell-schedules'] as const,
  list: (schoolId: string) => [...bellScheduleKeys.all, 'list', schoolId] as const,
  detail: (schoolId: string, bellScheduleId: string) =>
    [...bellScheduleKeys.list(schoolId), bellScheduleId] as const,
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

export function useBellSchedules(schoolId: string, enabled = true) {
  return useQuery<BellScheduleListResponseDto, Error>({
    queryKey: bellScheduleKeys.list(schoolId),
    queryFn: () => getBellSchedules(schoolId),
    enabled: enabled && !!schoolId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useBellSchedule(schoolId: string, bellScheduleId: string, enabled = true) {
  return useQuery<BellScheduleResponseDto, Error>({
    queryKey: bellScheduleKeys.detail(schoolId, bellScheduleId),
    queryFn: () => getBellSchedule(schoolId, bellScheduleId),
    enabled: enabled && !!schoolId && !!bellScheduleId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

export function useCreateBellSchedule(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBellScheduleDto) => createBellSchedule(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bellScheduleKeys.list(schoolId) })
      toast.success('Bell schedule created')
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error))
    },
  })
}

export function useUpdateBellSchedule(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bellScheduleId, data }: { bellScheduleId: string; data: UpdateBellScheduleDto }) =>
      updateBellSchedule(schoolId, bellScheduleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bellScheduleKeys.list(schoolId) })
      toast.success('Bell schedule updated')
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error))
    },
  })
}

export function useDeleteBellSchedule(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (bellScheduleId: string) => deleteBellSchedule(schoolId, bellScheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bellScheduleKeys.list(schoolId) })
      toast.success('Bell schedule deleted')
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error))
    },
  })
}

export function useSetDefaultBellSchedule(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (bellScheduleId: string) => setDefaultBellSchedule(schoolId, bellScheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bellScheduleKeys.list(schoolId) })
      toast.success('Default bell schedule updated')
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error))
    },
  })
}
