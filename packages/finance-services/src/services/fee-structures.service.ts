/**
 * Fee Structures Service
 *
 * API client for school fee structure CRUD operations.
 * Admin-only: configures what fees a school charges.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@edforge/api-client'
import type {
  FeeStructure,
  CreateFeeStructureDto,
  UpdateFeeStructureDto,
} from '@edforge/types'
import type { FinanceListQueryParams } from '../types/pagination'
import type { FinancePaginatedResponse } from './invoices.service'
import { normalizeFinanceListResponse } from '../utils/normalize-finance-list-response'

/**
 * Get fee structures for a school (cursor-paginated).
 */
export async function getFeeStructures(
  schoolId: string,
  params?: FinanceListQueryParams,
): Promise<FinancePaginatedResponse<FeeStructure>> {
  const response = await apiGet<FinancePaginatedResponse<FeeStructure> | FeeStructure[]>(
    `/finance/schools/${schoolId}/fee-structures`,
    params as Record<string, unknown>,
  )
  return normalizeFinanceListResponse(response)
}

export async function getFeeStructure(
  schoolId: string,
  feeStructureId: string,
): Promise<FeeStructure> {
  return apiGet<FeeStructure>(
    `/finance/schools/${schoolId}/fee-structures/${feeStructureId}`,
  )
}

export async function createFeeStructure(
  schoolId: string,
  data: CreateFeeStructureDto,
): Promise<FeeStructure> {
  return apiPost<FeeStructure, CreateFeeStructureDto>(
    `/finance/schools/${schoolId}/fee-structures`,
    data,
  )
}

export async function updateFeeStructure(
  schoolId: string,
  feeStructureId: string,
  data: UpdateFeeStructureDto,
): Promise<FeeStructure> {
  return apiPut<FeeStructure, UpdateFeeStructureDto>(
    `/finance/schools/${schoolId}/fee-structures/${feeStructureId}`,
    data,
  )
}

export async function deleteFeeStructure(
  schoolId: string,
  feeStructureId: string,
): Promise<void> {
  return apiDelete<void>(
    `/finance/schools/${schoolId}/fee-structures/${feeStructureId}`,
  )
}

export const feeStructuresService = {
  getFeeStructures,
  getFeeStructure,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
}
