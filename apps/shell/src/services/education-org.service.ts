/**
 * Education Organization Service
 *
 * API service functions for EdOrg CRUD operations.
 * Follows the same pattern as tenant.service.ts using apiGet/apiPost/apiPut/apiPatch/apiDelete.
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '../lib/api'
import type {
  CreateStateEducationAgencyDto,
  SeaResponseDto,
  CreateLocalEducationAgencyDto,
  UpdateLocalEducationAgencyDto,
  LeaResponseDto,
  LeaListResponseDto,
  LeaFilterDto,
  CreateEducationServiceCenterDto,
  UpdateEducationServiceCenterDto,
  EscResponseDto,
  EscListResponseDto,
  EscFilterDto,
  OrganizationHierarchyResponseDto,
} from '@aibrains/shared-types'

// ============================================================================
// SEA (State Education Agency) — Singleton per tenant
// ============================================================================

export async function getStateEducationAgency(): Promise<SeaResponseDto | null> {
  try {
    return await apiGet<SeaResponseDto>('/education-organizations/sea')
  } catch (error: any) {
    if (error?.response?.status === 404) return null
    throw error
  }
}

export async function createOrUpdateStateEducationAgency(
  data: CreateStateEducationAgencyDto
): Promise<SeaResponseDto> {
  return apiPut<SeaResponseDto, CreateStateEducationAgencyDto>(
    '/education-organizations/sea',
    data
  )
}

// ============================================================================
// LEA (Local Education Agency / School District)
// ============================================================================

export async function getLocalEducationAgencies(
  filters?: Partial<LeaFilterDto>
): Promise<LeaListResponseDto> {
  return apiGet<LeaListResponseDto>('/education-organizations/leas', filters as Record<string, unknown>)
}

export async function getLocalEducationAgency(id: string): Promise<LeaResponseDto> {
  return apiGet<LeaResponseDto>(`/education-organizations/leas/${id}`)
}

export async function createLocalEducationAgency(
  data: CreateLocalEducationAgencyDto
): Promise<LeaResponseDto> {
  return apiPost<LeaResponseDto, CreateLocalEducationAgencyDto>(
    '/education-organizations/leas',
    data
  )
}

export async function updateLocalEducationAgency(
  id: string,
  data: UpdateLocalEducationAgencyDto
): Promise<LeaResponseDto> {
  return apiPatch<LeaResponseDto, UpdateLocalEducationAgencyDto>(
    `/education-organizations/leas/${id}`,
    data
  )
}

export async function deleteLocalEducationAgency(id: string): Promise<void> {
  return apiDelete<void>(`/education-organizations/leas/${id}`)
}

// ============================================================================
// ESC (Education Service Center)
// ============================================================================

export async function getEducationServiceCenters(
  filters?: Partial<EscFilterDto>
): Promise<EscListResponseDto> {
  return apiGet<EscListResponseDto>('/education-organizations/escs', filters as Record<string, unknown>)
}

export async function getEducationServiceCenter(id: string): Promise<EscResponseDto> {
  return apiGet<EscResponseDto>(`/education-organizations/escs/${id}`)
}

export async function createEducationServiceCenter(
  data: CreateEducationServiceCenterDto
): Promise<EscResponseDto> {
  return apiPost<EscResponseDto, CreateEducationServiceCenterDto>(
    '/education-organizations/escs',
    data
  )
}

export async function updateEducationServiceCenter(
  id: string,
  data: UpdateEducationServiceCenterDto
): Promise<EscResponseDto> {
  return apiPatch<EscResponseDto, UpdateEducationServiceCenterDto>(
    `/education-organizations/escs/${id}`,
    data
  )
}

export async function deleteEducationServiceCenter(id: string): Promise<void> {
  return apiDelete<void>(`/education-organizations/escs/${id}`)
}

// ============================================================================
// Hierarchy
// ============================================================================

export async function getOrganizationHierarchy(
  depth?: number,
  parentId?: string
): Promise<OrganizationHierarchyResponseDto> {
  const params: Record<string, unknown> = {}
  if (depth !== undefined) params.depth = depth
  if (parentId) params.parentId = parentId
  return apiGet<OrganizationHierarchyResponseDto>(
    '/education-organizations/hierarchy',
    params
  )
}
