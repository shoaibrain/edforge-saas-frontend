/**
 * Location Service
 *
 * API service functions for Location/Room CRUD operations.
 * Location represents a physical space within a school (Ed-Fi aligned).
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api'
import type {
  LocationResponseDto,
  LocationListResponseDto,
  CreateLocationDto,
  UpdateLocationDto,
} from '@aibrains/shared-types'

// ============================================================================
// LOCATION CRUD
// ============================================================================

export async function getLocations(schoolId: string): Promise<LocationListResponseDto> {
  return apiGet<LocationListResponseDto>(`/schools/${schoolId}/locations`)
}

export async function getLocation(schoolId: string, locationId: string): Promise<LocationResponseDto> {
  return apiGet<LocationResponseDto>(`/schools/${schoolId}/locations/${locationId}`)
}

export async function createLocation(
  schoolId: string,
  data: CreateLocationDto
): Promise<LocationResponseDto> {
  return apiPost<LocationResponseDto, CreateLocationDto>(
    `/schools/${schoolId}/locations`,
    data
  )
}

export async function updateLocation(
  schoolId: string,
  locationId: string,
  data: UpdateLocationDto
): Promise<LocationResponseDto> {
  return apiPatch<LocationResponseDto, UpdateLocationDto>(
    `/schools/${schoolId}/locations/${locationId}`,
    data
  )
}

export async function deleteLocation(
  schoolId: string,
  locationId: string
): Promise<void> {
  return apiDelete<void>(`/schools/${schoolId}/locations/${locationId}`)
}

// ============================================================================
// CONVENIENCE EXPORT
// ============================================================================

export const locationService = {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
}
