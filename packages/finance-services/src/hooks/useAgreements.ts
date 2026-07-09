/**
 * useAgreements — TanStack Query hooks for family-billing agreements.
 *
 * Query-key factory + cursor-infinite list + detail/versions queries +
 * create/activate/cancel mutations. Reads use staleTime + enabled gates
 * (no polling — agreements change on operator action, not on a clock).
 * Mutations invalidate the agreement cache on success.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  Agreement,
  AgreementVersion,
  AgreementStatus,
  CreateAgreementDto,
  ActivateAgreementDto,
  CancelAgreementDto,
} from '@edforge/types'
import {
  getAgreements,
  getAgreement,
  getAgreementVersions,
  createAgreement,
  activateAgreement,
  cancelAgreement,
} from '../services/agreements.service'
import type { AgreementListParams } from '../services/agreements.service'
import { useFinancePaginatedQuery } from './useFinancePaginatedQuery'

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const agreementKeys = {
  all: ['agreements'] as const,
  lists: (schoolId: string) => [...agreementKeys.all, 'list', schoolId] as const,
  list: (schoolId: string, status?: AgreementStatus) =>
    [...agreementKeys.lists(schoolId), status ?? 'all'] as const,
  detail: (schoolId: string, agreementId: string) =>
    [...agreementKeys.all, 'detail', schoolId, agreementId] as const,
  versions: (schoolId: string, agreementId: string) =>
    [...agreementKeys.all, 'versions', schoolId, agreementId] as const,
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Cursor-paginated agreements list, optionally filtered by status.
 * Returns the standard finance infinite-list result shape.
 */
export function useAgreements(
  schoolId: string,
  filters?: { status?: AgreementStatus },
  options: { enabled?: boolean } = {},
) {
  return useFinancePaginatedQuery<Agreement, { status?: AgreementStatus }>({
    queryKey: agreementKeys.list(schoolId, filters?.status),
    queryFn: (params) =>
      getAgreements(schoolId, params as AgreementListParams),
    filters: filters ?? {},
    limit: 50,
    enabled: (options.enabled ?? true) && !!schoolId,
  })
}

export function useAgreement(schoolId: string, agreementId: string) {
  return useQuery<Agreement>({
    queryKey: agreementKeys.detail(schoolId, agreementId),
    queryFn: () => getAgreement(schoolId, agreementId),
    enabled: !!schoolId && !!agreementId,
    staleTime: 30 * 1000,
  })
}

export function useAgreementVersions(schoolId: string, agreementId: string) {
  return useQuery<AgreementVersion[]>({
    queryKey: agreementKeys.versions(schoolId, agreementId),
    queryFn: () => getAgreementVersions(schoolId, agreementId),
    enabled: !!schoolId && !!agreementId,
    staleTime: 30 * 1000,
  })
}

// ============================================================================
// MUTATIONS
// ============================================================================

export function useCreateAgreement(schoolId: string) {
  const queryClient = useQueryClient()
  return useMutation<Agreement, Error, CreateAgreementDto>({
    mutationFn: (data) => createAgreement(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agreementKeys.lists(schoolId) })
    },
  })
}

/**
 * Activate a draft agreement version. On success invalidates lists + the
 * specific agreement detail/versions. The 409 conflict codes
 * (`CONFLICTING_OPEN_INVOICES`, `AGREEMENT_OVERLAP`) surface as the mutation
 * error for the UI to branch on.
 */
export function useActivateAgreement(schoolId: string) {
  const queryClient = useQueryClient()
  return useMutation<
    Agreement,
    Error,
    { agreementId: string; data: ActivateAgreementDto }
  >({
    mutationFn: ({ agreementId, data }) =>
      activateAgreement(schoolId, agreementId, data),
    onSuccess: (_result, { agreementId }) => {
      queryClient.invalidateQueries({ queryKey: agreementKeys.lists(schoolId) })
      queryClient.invalidateQueries({
        queryKey: agreementKeys.detail(schoolId, agreementId),
      })
      queryClient.invalidateQueries({
        queryKey: agreementKeys.versions(schoolId, agreementId),
      })
    },
  })
}

export function useCancelAgreement(schoolId: string) {
  const queryClient = useQueryClient()
  return useMutation<
    Agreement,
    Error,
    { agreementId: string; data: CancelAgreementDto }
  >({
    mutationFn: ({ agreementId, data }) =>
      cancelAgreement(schoolId, agreementId, data),
    onSuccess: (_result, { agreementId }) => {
      queryClient.invalidateQueries({ queryKey: agreementKeys.lists(schoolId) })
      queryClient.invalidateQueries({
        queryKey: agreementKeys.detail(schoolId, agreementId),
      })
      queryClient.invalidateQueries({
        queryKey: agreementKeys.versions(schoolId, agreementId),
      })
    },
  })
}
