/**
 * Tenant Service
 * 
 * API client for tenant-related operations.
 * Communicates with the Tenant API backend.
 */

import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from '../lib/api'
import type { 
  Tenant, 
  School, 
  SchoolYear,
  SchoolAddress,
  Term,
} from '@edforge/types'
import type { SchoolAssignment } from '@edforge/auth'

// ============================================================================
// LOCAL TYPES (Defined here until @edforge/types is rebuilt)
// ============================================================================

export interface WorkspaceSettings {
  tenantId: string
  regional: {
    defaultTimezone: string
    defaultLocale: string
    defaultDateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
    defaultTimeFormat: '12h' | '24h'
    defaultWeekStartsOn: 'sunday' | 'monday'
  }
  calendar: {
    defaultAcademicYearStart: string
    defaultAcademicYearEnd: string
    defaultTermStructure: 'semester' | 'trimester' | 'quarter'
  }
  branding: {
    organizationName: string
    logoUrl?: string
    primaryColor?: string
    accentColor?: string
  }
  policies: {
    defaultGradingScale: 'letter' | 'percentage' | 'points' | 'custom'
    defaultAttendancePolicy: 'daily' | 'period' | 'both'
  }
  isLocked: boolean
  lockReason?: string
  createdAt: string
  updatedAt: string
}

export interface OperatingHours {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  isOpen: boolean
  openTime?: string
  closeTime?: string
}

export interface SchoolConfiguration {
  schoolId: string
  identity: {
    displayName: string
    shortCode: string
    schoolType: 'elementary' | 'middle' | 'high' | 'k12' | 'other'
    logoUrl?: string
    website?: string
  }
  location: {
    address: SchoolAddress
    timezone?: string
    phone?: string
    email?: string
    fax?: string
  }
  operations: {
    operatingHours: OperatingHours[]
    gradeLevels: string[]
    capacity?: number
  }
  academic: {
    gradingScale: 'letter' | 'percentage' | 'points' | 'custom'
    customGradingScale?: {
      grades: { letter: string; minPercentage: number; maxPercentage: number; gpaPoints: number }[]
    }
    reportCardFormat: 'standard' | 'narrative' | 'standards-based'
    termStructure: 'semester' | 'trimester' | 'quarter' | 'custom'
  }
  attendance: {
    policy: 'daily' | 'period' | 'both'
    tardyThresholdMinutes: number
    excusedAbsenceTypes: string[]
    unexcusedAbsenceTypes: string[]
  }
  inheritsFromWorkspace: boolean
  createdAt: string
  updatedAt: string
}

export type DepartmentScope = 'tenant' | 'school'

export interface Department {
  id: string
  tenantId: string
  scope: DepartmentScope
  schoolId?: string
  name: string
  code: string
  description?: string
  headId?: string
  headName?: string
  parentDepartmentId?: string
  isActive: boolean
  budget?: {
    fiscalYear: string
    allocatedAmount: number
    spentAmount: number
    currency: string
  }
  createdAt: string
  updatedAt: string
}

export interface CreateDepartmentDto {
  name: string
  code: string
  scope: DepartmentScope
  schoolId?: string
  description?: string
  headId?: string
  parentDepartmentId?: string
}

export interface UpdateDepartmentDto {
  name?: string
  code?: string
  description?: string
  headId?: string
  parentDepartmentId?: string
  isActive?: boolean
}

export type AcademicYearStatus = 'planning' | 'active' | 'completed'

export interface AcademicYear {
  id: string
  tenantId: string
  schoolId: string
  schoolName?: string
  name: string
  startDate: string
  endDate: string
  status: AcademicYearStatus
  terms: Term[]
  isLocked: boolean
  activatedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateAcademicYearDto {
  schoolId: string
  name: string
  startDate: string
  endDate: string
  terms?: Omit<Term, 'id'>[]
}

export interface UpdateAcademicYearDto {
  name?: string
  startDate?: string
  endDate?: string
  terms?: Term[]
}

export interface UpdateAcademicYearStatusDto {
  status: AcademicYearStatus
  confirmTransition?: boolean
}

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
// SCHOOL YEAR API (Legacy - kept for backward compatibility)
// ============================================================================

/**
 * Get school years for a tenant
 * @deprecated Use getAcademicYears instead
 */
export async function getSchoolYears(tenantId: string): Promise<SchoolYear[]> {
  return apiGet<SchoolYear[]>(`/school-years`, { tenantId })
}

/**
 * Get the current/active school year
 * @deprecated Use getCurrentAcademicYear instead
 */
export async function getCurrentSchoolYear(tenantId: string): Promise<SchoolYear | null> {
  const years = await getSchoolYears(tenantId)
  return years.find(y => y.isCurrent) ?? null
}

// ============================================================================
// WORKSPACE SETTINGS API
// ============================================================================

/**
 * Get workspace settings for a tenant
 * GET /tenants/{tenantId}/settings
 */
export async function getWorkspaceSettings(tenantId: string): Promise<WorkspaceSettings> {
  return apiGet<WorkspaceSettings>(`/tenants/${tenantId}/settings`)
}

/**
 * Update workspace settings
 * PATCH /tenants/{tenantId}/settings
 */
export async function updateWorkspaceSettings(
  tenantId: string,
  data: Partial<WorkspaceSettings>
): Promise<WorkspaceSettings> {
  return apiPatch<WorkspaceSettings, Partial<WorkspaceSettings>>(
    `/tenants/${tenantId}/settings`,
    data
  )
}

// ============================================================================
// SCHOOL CONFIGURATION API
// ============================================================================

/**
 * Get school configuration
 * GET /schools/{schoolId}/configuration
 */
export async function getSchoolConfiguration(schoolId: string): Promise<SchoolConfiguration> {
  return apiGet<SchoolConfiguration>(`/schools/${schoolId}/configuration`)
}

/**
 * Update school configuration
 * PATCH /schools/{schoolId}/configuration
 */
export async function updateSchoolConfiguration(
  schoolId: string,
  data: Partial<SchoolConfiguration>
): Promise<SchoolConfiguration> {
  return apiPatch<SchoolConfiguration, Partial<SchoolConfiguration>>(
    `/schools/${schoolId}/configuration`,
    data
  )
}

// ============================================================================
// DEPARTMENT API
// ============================================================================

/**
 * Get all departments for a school (includes both tenant-scoped and school-scoped)
 * GET /schools/{schoolId}/departments
 */
export async function getDepartments(schoolId: string): Promise<Department[]> {
  return apiGet<Department[]>(`/schools/${schoolId}/departments`)
}

/**
 * Get a single department by ID
 * GET /schools/{schoolId}/departments/{departmentId}
 */
export async function getDepartment(schoolId: string, departmentId: string): Promise<Department> {
  return apiGet<Department>(`/schools/${schoolId}/departments/${departmentId}`)
}

/**
 * Create a new department
 * POST /schools/{schoolId}/departments
 */
export async function createDepartment(
  schoolId: string,
  data: CreateDepartmentDto
): Promise<Department> {
  return apiPost<Department, CreateDepartmentDto>(
    `/schools/${schoolId}/departments`,
    data
  )
}

/**
 * Update a department
 * PATCH /schools/{schoolId}/departments/{departmentId}
 */
export async function updateDepartment(
  schoolId: string,
  departmentId: string,
  data: UpdateDepartmentDto
): Promise<Department> {
  return apiPatch<Department, UpdateDepartmentDto>(
    `/schools/${schoolId}/departments/${departmentId}`,
    data
  )
}

/**
 * Delete a department
 * DELETE /schools/{schoolId}/departments/{departmentId}
 */
export async function deleteDepartment(schoolId: string, departmentId: string): Promise<void> {
  return apiDelete<void>(`/schools/${schoolId}/departments/${departmentId}`)
}

// ============================================================================
// ACADEMIC YEAR API
// ============================================================================

/**
 * Get all academic years for a school
 * GET /schools/{schoolId}/academic-years
 */
export async function getAcademicYears(schoolId: string): Promise<AcademicYear[]> {
  return apiGet<AcademicYear[]>(`/schools/${schoolId}/academic-years`)
}

/**
 * Get a single academic year by ID
 * GET /schools/{schoolId}/academic-years/{academicYearId}
 */
export async function getAcademicYear(
  schoolId: string,
  academicYearId: string
): Promise<AcademicYear> {
  return apiGet<AcademicYear>(`/schools/${schoolId}/academic-years/${academicYearId}`)
}

/**
 * Get the current/active academic year for a school
 * GET /schools/{schoolId}/academic-years/current
 */
export async function getCurrentAcademicYear(schoolId: string): Promise<AcademicYear | null> {
  try {
    return await apiGet<AcademicYear>(`/schools/${schoolId}/academic-years/current`)
  } catch {
    // No active academic year
    return null
  }
}

/**
 * Create a new academic year
 * POST /schools/{schoolId}/academic-years
 */
export async function createAcademicYear(
  schoolId: string,
  data: CreateAcademicYearDto
): Promise<AcademicYear> {
  return apiPost<AcademicYear, CreateAcademicYearDto>(
    `/schools/${schoolId}/academic-years`,
    { ...data, schoolId }
  )
}

/**
 * Update an academic year
 * PATCH /schools/{schoolId}/academic-years/{academicYearId}
 */
export async function updateAcademicYear(
  schoolId: string,
  academicYearId: string,
  data: UpdateAcademicYearDto
): Promise<AcademicYear> {
  return apiPatch<AcademicYear, UpdateAcademicYearDto>(
    `/schools/${schoolId}/academic-years/${academicYearId}`,
    data
  )
}

/**
 * Update academic year status (planning → active → completed)
 * PATCH /schools/{schoolId}/academic-years/{academicYearId}/status
 */
export async function updateAcademicYearStatus(
  schoolId: string,
  academicYearId: string,
  data: UpdateAcademicYearStatusDto
): Promise<AcademicYear> {
  return apiPatch<AcademicYear, UpdateAcademicYearStatusDto>(
    `/schools/${schoolId}/academic-years/${academicYearId}/status`,
    data
  )
}

/**
 * Delete an academic year (only allowed if status is 'planning')
 * DELETE /schools/{schoolId}/academic-years/{academicYearId}
 */
export async function deleteAcademicYear(
  schoolId: string,
  academicYearId: string
): Promise<void> {
  return apiDelete<void>(`/schools/${schoolId}/academic-years/${academicYearId}`)
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

  // Workspace Settings
  getWorkspaceSettings,
  updateWorkspaceSettings,

  // Schools
  getSchools,
  getSchool,
  createSchool,
  updateSchool,
  deleteSchool,

  // School Configuration
  getSchoolConfiguration,
  updateSchoolConfiguration,

  // Departments
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,

  // Academic Years
  getAcademicYears,
  getAcademicYear,
  getCurrentAcademicYear,
  createAcademicYear,
  updateAcademicYear,
  updateAcademicYearStatus,
  deleteAcademicYear,

  // School Years (Legacy)
  getSchoolYears,
  getCurrentSchoolYear,
}

