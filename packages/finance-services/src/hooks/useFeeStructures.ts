/**
 * useFeeStructures — TanStack Query hooks for fee structure CRUD
 *
 * Admin-only hooks for configuring school fee types.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateFeeStructureDto, UpdateFeeStructureDto } from '@edforge/types'
import {
  getFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
} from '../services/fee-structures.service'
import { useFinancePaginatedQuery } from './useFinancePaginatedQuery'

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const feeStructureKeys = {
  all: ['feeStructures'] as const,
  list: (schoolId: string) => [...feeStructureKeys.all, 'list', schoolId] as const,
  detail: (schoolId: string, id: string) =>
    [...feeStructureKeys.list(schoolId), id] as const,
}

// ============================================================================
// QUERIES
// ============================================================================

/** First page only — prefer useFeeStructuresInfinite for tables with load-more. */
export function useFeeStructures(schoolId: string) {
  return useQuery({
    queryKey: feeStructureKeys.list(schoolId),
    queryFn: async () => {
      const response = await getFeeStructures(schoolId, { limit: 50 })
      return response.items
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useFeeStructuresInfinite(schoolId: string) {
  return useFinancePaginatedQuery({
    queryKey: [...feeStructureKeys.list(schoolId), 'infinite'] as const,
    queryFn: (params) => getFeeStructures(schoolId, params),
    filters: {},
    limit: 50,
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
}

// ============================================================================
// MUTATIONS
// ============================================================================

export function useCreateFeeStructure(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateFeeStructureDto) =>
      createFeeStructure(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feeStructureKeys.all })
    },
  })
}

export function useUpdateFeeStructure(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFeeStructureDto }) =>
      updateFeeStructure(schoolId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feeStructureKeys.all })
    },
  })
}

export function useDeleteFeeStructure(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteFeeStructure(schoolId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feeStructureKeys.all })
    },
  })
}
