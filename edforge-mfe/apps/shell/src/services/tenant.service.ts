/**
 * Tenant Service
 * 
 * API client for tenant-related operations.
 * Communicates with the Tenant API backend.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api'
import type { Tenant, School, SchoolYear } from '@edforge/types'
import type { SchoolAssignment } from '@edforge/auth'

// ============================================================================
// TYPES
// ============================================================================

export interface UserProfile {
  id: string
  email: string
  name?: string
  tenantId: string
  tenantName: string
  globalRole: 'TenantAdmin' | 'StandardUser'
  assignments: SchoolAssignment[]
  createdAt: string
  updatedAt: string
}

export interface CreateSchoolRequest {
  name: string
  code: string
  type?: 'elementary' | 'middle' | 'high' | 'k12' | 'other'
  address?: {
    street1: string
    street2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  phone?: string
  email?: string
}

export interface UpdateSchoolRequest extends Partial<CreateSchoolRequest> {
  isActive?: boolean
}

// ============================================================================
// USER API
// ============================================================================

/**
 * Get the current authenticated user's profile
 * Includes tenant info and school assignments
 */
export async function getCurrentUser(): Promise<UserProfile> {
  return apiGet<UserProfile>('/users/me')
}

/**
 * Get user's school assignments
 */
export async function getUserAssignments(userId: string): Promise<SchoolAssignment[]> {
  return apiGet<SchoolAssignment[]>(`/users/${userId}/assignments`)
}

// ============================================================================
// TENANT API
// ============================================================================

/**
 * Get tenant by ID
 */
export async function getTenant(tenantId: string): Promise<Tenant> {
  return apiGet<Tenant>(`/tenants/${tenantId}`)
}

/**
 * Update tenant settings
 */
export async function updateTenant(tenantId: string, data: Partial<Tenant>): Promise<Tenant> {
  return apiPut<Tenant, Partial<Tenant>>(`/tenants/${tenantId}`, data)
}

// ============================================================================
// SCHOOL API
// ============================================================================

/**
 * Get all schools for a tenant
 */
export async function getSchools(tenantId: string): Promise<School[]> {
  return apiGet<School[]>(`/schools`, { tenantId })
}

/**
 * Get a single school by ID
 */
export async function getSchool(schoolId: string): Promise<School> {
  return apiGet<School>(`/schools/${schoolId}`)
}

/**
 * Create a new school
 */
export async function createSchool(data: CreateSchoolRequest): Promise<School> {
  return apiPost<School, CreateSchoolRequest>('/schools', data)
}

/**
 * Update a school
 */
export async function updateSchool(schoolId: string, data: UpdateSchoolRequest): Promise<School> {
  return apiPut<School, UpdateSchoolRequest>(`/schools/${schoolId}`, data)
}

/**
 * Delete a school (soft delete - sets isActive to false)
 */
export async function deleteSchool(schoolId: string): Promise<void> {
  return apiDelete<void>(`/schools/${schoolId}`)
}

// ============================================================================
// SCHOOL YEAR API
// ============================================================================

/**
 * Get school years for a tenant
 */
export async function getSchoolYears(tenantId: string): Promise<SchoolYear[]> {
  return apiGet<SchoolYear[]>(`/school-years`, { tenantId })
}

/**
 * Get the current/active school year
 */
export async function getCurrentSchoolYear(tenantId: string): Promise<SchoolYear | null> {
  const years = await getSchoolYears(tenantId)
  return years.find(y => y.isCurrent) ?? null
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const tenantService = {
  // User
  getCurrentUser,
  getUserAssignments,

  // Tenant
  getTenant,
  updateTenant,

  // Schools
  getSchools,
  getSchool,
  createSchool,
  updateSchool,
  deleteSchool,

  // School Years
  getSchoolYears,
  getCurrentSchoolYear,
}

