/**
 * Bell Schedule Service
 *
 * API service functions for BellSchedule CRUD operations.
 * BellSchedule defines class period times for specific day types (Ed-Fi aligned).
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api'
import type {
  BellScheduleResponseDto,
  BellScheduleListResponseDto,
  CreateBellScheduleDto,
  UpdateBellScheduleDto,
} from '@aibrains/shared-types'

// ============================================================================
// BELL SCHEDULE CRUD
// ============================================================================

export async function getBellSchedules(schoolId: string): Promise<BellScheduleListResponseDto> {
  return apiGet<BellScheduleListResponseDto>(`/schools/${schoolId}/bell-schedules`)
}

export async function getBellSchedule(schoolId: string, bellScheduleId: string): Promise<BellScheduleResponseDto> {
  return apiGet<BellScheduleResponseDto>(`/schools/${schoolId}/bell-schedules/${bellScheduleId}`)
}

export async function createBellSchedule(
  schoolId: string,
  data: CreateBellScheduleDto
): Promise<BellScheduleResponseDto> {
  return apiPost<BellScheduleResponseDto, CreateBellScheduleDto>(
    `/schools/${schoolId}/bell-schedules`,
    data
  )
}

export async function updateBellSchedule(
  schoolId: string,
  bellScheduleId: string,
  data: UpdateBellScheduleDto
): Promise<BellScheduleResponseDto> {
  return apiPatch<BellScheduleResponseDto, UpdateBellScheduleDto>(
    `/schools/${schoolId}/bell-schedules/${bellScheduleId}`,
    data
  )
}

export async function deleteBellSchedule(
  schoolId: string,
  bellScheduleId: string
): Promise<void> {
  return apiDelete<void>(`/schools/${schoolId}/bell-schedules/${bellScheduleId}`)
}

export async function setDefaultBellSchedule(
  schoolId: string,
  bellScheduleId: string
): Promise<BellScheduleResponseDto> {
  return apiPost<BellScheduleResponseDto, Record<string, never>>(
    `/schools/${schoolId}/bell-schedules/${bellScheduleId}/set-default`,
    {}
  )
}

// ============================================================================
// CONVENIENCE EXPORT
// ============================================================================

export const bellScheduleService = {
  getBellSchedules,
  getBellSchedule,
  createBellSchedule,
  updateBellSchedule,
  deleteBellSchedule,
  setDefaultBellSchedule,
}
