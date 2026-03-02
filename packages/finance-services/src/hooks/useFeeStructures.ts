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

export function useFeeStructures(schoolId: string) {
  return useQuery({
    queryKey: feeStructureKeys.list(schoolId),
    queryFn: () => getFeeStructures(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000, // 5 min — fee structures change rarely
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
      queryClient.invalidateQueries({ queryKey: feeStructureKeys.list(schoolId) })
    },
  })
}

export function useUpdateFeeStructure(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFeeStructureDto }) =>
      updateFeeStructure(schoolId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feeStructureKeys.list(schoolId) })
    },
  })
}

export function useDeleteFeeStructure(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteFeeStructure(schoolId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feeStructureKeys.list(schoolId) })
    },
  })
}
