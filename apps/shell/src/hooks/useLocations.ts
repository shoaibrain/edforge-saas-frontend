/**
 * Location React Query Hooks
 *
 * Provides data fetching and mutation hooks for Location/Room CRUD.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { extractApiErrorMessage } from '@edforge/api-client'
import {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../services/location.service'
import type {
  LocationListResponseDto,
  LocationResponseDto,
  CreateLocationDto,
  UpdateLocationDto,
} from '@aibrains/shared-types'

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const locationKeys = {
  all: ['locations'] as const,
  list: (schoolId: string) => [...locationKeys.all, 'list', schoolId] as const,
  detail: (schoolId: string, locationId: string) =>
    [...locationKeys.list(schoolId), locationId] as const,
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

export function useLocations(schoolId: string, enabled = true) {
  return useQuery<LocationListResponseDto, Error>({
    queryKey: locationKeys.list(schoolId),
    queryFn: () => getLocations(schoolId),
    enabled: enabled && !!schoolId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useLocation(schoolId: string, locationId: string, enabled = true) {
  return useQuery<LocationResponseDto, Error>({
    queryKey: locationKeys.detail(schoolId, locationId),
    queryFn: () => getLocation(schoolId, locationId),
    enabled: enabled && !!schoolId && !!locationId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

export function useCreateLocation(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateLocationDto) => createLocation(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.list(schoolId) })
      toast.success('Location created')
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error))
    },
  })
}

export function useUpdateLocation(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ locationId, data }: { locationId: string; data: UpdateLocationDto }) =>
      updateLocation(schoolId, locationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.list(schoolId) })
      toast.success('Location updated')
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error))
    },
  })
}

export function useDeleteLocation(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (locationId: string) => deleteLocation(schoolId, locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.list(schoolId) })
      toast.success('Location deleted')
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error))
    },
  })
}
