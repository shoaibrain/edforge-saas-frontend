/**
 * Fee Structures Service
 *
 * API client for school fee structure CRUD operations.
 * Admin-only: configures what fees a school charges.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api'
import type {
  FeeStructure,
  CreateFeeStructureDto,
  UpdateFeeStructureDto,
} from '@edforge/types'

/**
 * Get all fee structures for a school.
 */
export async function getFeeStructures(schoolId: string): Promise<FeeStructure[]> {
  return apiGet<FeeStructure[]>(`/finance/schools/${schoolId}/fee-structures`)
}

/**
 * Get a single fee structure by ID.
 */
export async function getFeeStructure(
  schoolId: string,
  feeStructureId: string
): Promise<FeeStructure> {
  return apiGet<FeeStructure>(`/finance/schools/${schoolId}/fee-structures/${feeStructureId}`)
}

/**
 * Create a new fee structure.
 */
export async function createFeeStructure(
  schoolId: string,
  data: CreateFeeStructureDto
): Promise<FeeStructure> {
  return apiPost<FeeStructure, CreateFeeStructureDto>(
    `/finance/schools/${schoolId}/fee-structures`,
    data
  )
}

/**
 * Update an existing fee structure.
 */
export async function updateFeeStructure(
  schoolId: string,
  feeStructureId: string,
  data: UpdateFeeStructureDto
): Promise<FeeStructure> {
  return apiPut<FeeStructure, UpdateFeeStructureDto>(
    `/finance/schools/${schoolId}/fee-structures/${feeStructureId}`,
    data
  )
}

/**
 * Delete a fee structure.
 */
export async function deleteFeeStructure(
  schoolId: string,
  feeStructureId: string
): Promise<void> {
  return apiDelete<void>(`/finance/schools/${schoolId}/fee-structures/${feeStructureId}`)
}

export const feeStructuresService = {
  getFeeStructures,
  getFeeStructure,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
}
