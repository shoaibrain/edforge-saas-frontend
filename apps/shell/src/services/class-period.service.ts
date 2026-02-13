/**
 * Class Period Service
 *
 * API service functions for ClassPeriod CRUD operations.
 * ClassPeriod represents a time block within a school day (Ed-Fi aligned).
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api'
import type {
  ClassPeriodResponseDto,
  ClassPeriodListResponseDto,
  CreateClassPeriodDto,
  UpdateClassPeriodDto,
} from '@aibrains/shared-types'

// ============================================================================
// CLASS PERIOD CRUD
// ============================================================================

export async function getClassPeriods(schoolId: string): Promise<ClassPeriodListResponseDto> {
  return apiGet<ClassPeriodListResponseDto>(`/schools/${schoolId}/class-periods`)
}

export async function getClassPeriod(schoolId: string, periodId: string): Promise<ClassPeriodResponseDto> {
  return apiGet<ClassPeriodResponseDto>(`/schools/${schoolId}/class-periods/${periodId}`)
}

export async function createClassPeriod(
  schoolId: string,
  data: CreateClassPeriodDto
): Promise<ClassPeriodResponseDto> {
  return apiPost<ClassPeriodResponseDto, CreateClassPeriodDto>(
    `/schools/${schoolId}/class-periods`,
    data
  )
}

export async function updateClassPeriod(
  schoolId: string,
  periodId: string,
  data: UpdateClassPeriodDto
): Promise<ClassPeriodResponseDto> {
  return apiPatch<ClassPeriodResponseDto, UpdateClassPeriodDto>(
    `/schools/${schoolId}/class-periods/${periodId}`,
    data
  )
}

export async function deleteClassPeriod(
  schoolId: string,
  periodId: string
): Promise<void> {
  return apiDelete<void>(`/schools/${schoolId}/class-periods/${periodId}`)
}

// ============================================================================
// CONVENIENCE EXPORT
// ============================================================================

export const classPeriodService = {
  getClassPeriods,
  getClassPeriod,
  createClassPeriod,
  updateClassPeriod,
  deleteClassPeriod,
}
