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
  WorkspaceSettings,
  SchoolConfiguration,
  Department,
  AcademicYear,
} from '@edforge/types'
import type { SchoolAssignment } from '@edforge/auth'
import type {
  CreateSchoolDto,
  UpdateSchoolDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
  UpdateAcademicYearStatusDto
} from '@aibrains/shared-types'

// Local types removed - imported from @edforge/types and @aibrains/shared-types

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

// REMOVED LOCAL CreateSchoolRequest/UpdateSchoolRequest in favor of shared types


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

// Helper to map API school format to Frontend School interface
function mapApiSchool(apiSchool: any, tenantId?: string): School {
  return {
    id: apiSchool.schoolId || apiSchool.id,
    tenantId: apiSchool.tenantId || tenantId || '',
    name: apiSchool.name,
    code: apiSchool.schoolCode || apiSchool.code,
    type: apiSchool.schoolType || apiSchool.type,
    status: apiSchool.status || 'setup',
    isActive: apiSchool.status === 'active',
    address: apiSchool.address ? {
      street1: apiSchool.address.street1,
      street2: apiSchool.address.street2,
      city: apiSchool.address.city,
      state: apiSchool.address.state,
      postalCode: apiSchool.address.zipCode || apiSchool.address.postalCode,
      country: apiSchool.address.country,
      wardNumber: apiSchool.address.wardNumber,
      municipality: apiSchool.address.municipality,
      district: apiSchool.address.district,
      province: apiSchool.address.province,
    } : undefined,
    phone: apiSchool.phone,
    email: apiSchool.email,
    calendarSystem: apiSchool.calendarSystem,
    currentAcademicYearId: apiSchool.currentAcademicYearId,
  }
}

interface SchoolResponse {
  items: any[]
  hasMore: boolean
  lastEvaluatedKey?: string
}

export interface SchoolListResponse {
  items: School[]
  hasMore: boolean
  lastEvaluatedKey?: string
}

/**
 * Get all schools for a tenant
 */
export async function getSchools(tenantId: string): Promise<School[]> {
  const response = await apiGet<SchoolResponse>(`/schools`, { tenantId })
  return (response.items || []).map(item => mapApiSchool(item, tenantId))
}

/**
 * Get paginated schools for a tenant
 */
export async function getSchoolsPaginated(
  tenantId: string, 
  params: { limit?: number; cursor?: string } = {}
): Promise<SchoolListResponse> {
  const queryParams: Record<string, string> = { tenantId }
  if (params.limit) queryParams.limit = String(params.limit)
  if (params.cursor) queryParams.cursor = params.cursor
  
  const response = await apiGet<SchoolResponse>(`/schools`, queryParams)
  
  // Handle case where response might not have expected shape
  if (!response || typeof response !== 'object') {
    return { items: [], hasMore: false, lastEvaluatedKey: undefined }
  }
  
  return {
    items: Array.isArray(response.items) 
      ? response.items.map(item => mapApiSchool(item, tenantId)) 
      : [],
    hasMore: response.hasMore ?? false,
    lastEvaluatedKey: response.lastEvaluatedKey,
  }
}

/**
 * Get a single school by ID
 */
export async function getSchool(schoolId: string): Promise<School> {
  const data = await apiGet<any>(`/schools/${schoolId}`)
  return mapApiSchool(data)
}

/**
 * Create a new school
 */
export async function createSchool(data: CreateSchoolDto): Promise<School> {
  return apiPost<School, CreateSchoolDto>('/schools', data)
}

/**
 * Update a school
 * PATCH /schools/{schoolId} - per FRONTEND_INTEGRATION_GUIDE.md
 */
export async function updateSchool(schoolId: string, data: UpdateSchoolDto): Promise<School> {
  return apiPatch<School, UpdateSchoolDto>(`/schools/${schoolId}`, data)
}

/**
 * Transition school status via the state machine endpoint
 * PATCH /schools/{schoolId}/status
 */
export async function transitionSchoolStatus(schoolId: string, status: string): Promise<School> {
  const data = await apiPatch<any>(`/schools/${schoolId}/status`, { status })
  return mapApiSchool(data)
}

/**
 * Delete a school
 * - Setup schools: permanently removed (hard-delete)
 * - Active/suspended schools: transitioned to inactive (soft-delete)
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

/**
 * Confirm workspace settings
 * PATCH /tenants/{tenantId}/settings/confirm
 */
export async function confirmWorkspaceSettings(
  tenantId: string
): Promise<{ confirmed: true; workspaceConfirmedAt: string }> {
  return apiPatch<{ confirmed: true; workspaceConfirmedAt: string }>(
    `/tenants/${tenantId}/settings/confirm`,
    {}
  )
}

/**
 * Complete onboarding flow
 * POST /tenants/{tenantId}/onboarding/complete
 */
export async function completeOnboarding(
  tenantId: string
): Promise<{ completed: true; onboardingCompletedAt: string }> {
  return apiPost<{ completed: true; onboardingCompletedAt: string }>(
    `/tenants/${tenantId}/onboarding/complete`,
    {}
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
// Helper to map API department format to Frontend Department interface
function mapApiDepartment(apiDept: any, tenantId?: string): Department {
  return {
    id: apiDept.departmentId || apiDept.id,
    tenantId: apiDept.tenantId || tenantId || 'unknown',
    scope: apiDept.scope || 'school',
    schoolId: apiDept.schoolId,
    name: apiDept.name,
    code: apiDept.code,
    description: apiDept.description,
    headId: apiDept.headId,
    headName: apiDept.headName,
    parentDepartmentId: apiDept.parentDepartmentId,
    isActive: apiDept.isActive !== undefined ? apiDept.isActive : true,
    budget: apiDept.budget,
    createdAt: apiDept.createdAt || new Date().toISOString(),
    updatedAt: apiDept.updatedAt || new Date().toISOString(),
  }
}

// Helper to map API academic year format to Frontend AcademicYear interface
function mapApiAcademicYear(apiYear: any, schoolId?: string, tenantId?: string): AcademicYear {
  return {
    // API returns 'yearId', fallback to 'academicYearId' or 'id' for compatibility
    id: apiYear.yearId || apiYear.academicYearId || apiYear.id,
    tenantId: apiYear.tenantId || tenantId || '',
    schoolId: apiYear.schoolId || schoolId || '',
    schoolName: apiYear.schoolName,
    name: apiYear.name,
    startDate: apiYear.startDate,
    endDate: apiYear.endDate,
    status: apiYear.status,
    // Map isCurrent to isLocked for backward compatibility
    isLocked: apiYear.isLocked ?? (apiYear.status === 'active' || apiYear.status === 'completed'),
    terms: apiYear.terms || [],
    activatedAt: apiYear.activatedAt,
    completedAt: apiYear.completedAt,
    createdAt: apiYear.createdAt || new Date().toISOString(),
    updatedAt: apiYear.updatedAt || new Date().toISOString(),
  }
}

// ============================================================================
// DEPARTMENT API
// ============================================================================

interface DepartmentResponse {
  items: any[]
  hasMore: boolean
}

/**
 * Get all departments for a school (includes both tenant-scoped and school-scoped)
 * GET /schools/{schoolId}/departments
 */
export async function getDepartments(schoolId: string): Promise<Department[]> {
  const response = await apiGet<DepartmentResponse>(`/schools/${schoolId}/departments`)
  return (response.items || []).map(item => mapApiDepartment(item))
}

/**
 * Get a single department by ID
 * GET /schools/{schoolId}/departments/{departmentId}
 */
export async function getDepartment(schoolId: string, departmentId: string): Promise<Department> {
  const data = await apiGet<any>(`/schools/${schoolId}/departments/${departmentId}`)
  return mapApiDepartment(data)
}

/**
 * Create a new department
 * POST /schools/{schoolId}/departments
 */
export async function createDepartment(
  schoolId: string,
  data: CreateDepartmentDto
): Promise<Department> {
  const result = await apiPost<any, CreateDepartmentDto>(
    `/schools/${schoolId}/departments`,
    data
  )
  return mapApiDepartment(result)
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
  const result = await apiPut<any, UpdateDepartmentDto>(
    `/schools/${schoolId}/departments/${departmentId}`,
    data
  )
  return mapApiDepartment(result)
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

interface AcademicYearResponse {
  items: any[]
  hasMore: boolean
}

/**
 * Get all academic years for a school
 * GET /schools/{schoolId}/academic-years
 */
export async function getAcademicYears(schoolId: string): Promise<AcademicYear[]> {
  const response = await apiGet<AcademicYearResponse>(`/schools/${schoolId}/academic-years`)
  return (response.items || []).map(item => mapApiAcademicYear(item, schoolId))
}

/**
 * Get a single academic year by ID
 * GET /schools/{schoolId}/academic-years/{academicYearId}
 */
export async function getAcademicYear(
  schoolId: string,
  academicYearId: string
): Promise<AcademicYear> {
  const data = await apiGet<any>(`/schools/${schoolId}/academic-years/${academicYearId}`)
  return mapApiAcademicYear(data, schoolId)
}

/**
 * Get the current/active academic year for a school
 * GET /schools/{schoolId}/academic-years/current
 */
export async function getCurrentAcademicYear(schoolId: string): Promise<AcademicYear | null> {
  try {
    const data = await apiGet<any>(`/schools/${schoolId}/academic-years/current`)
    return mapApiAcademicYear(data, schoolId)
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
  const result = await apiPost<any, CreateAcademicYearDto>(
    `/schools/${schoolId}/academic-years`,
    data
  )
  return mapApiAcademicYear(result, schoolId)
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
  const result = await apiPatch<any, UpdateAcademicYearDto>(
    `/schools/${schoolId}/academic-years/${academicYearId}`,
    data
  )
  return mapApiAcademicYear(result, schoolId)
}

/**
 * Update academic year status (planning → active → completed)
 * PUT /schools/{schoolId}/academic-years/{yearId}/status
 * Note: Backend API spec uses PUT method for status updates
 */
export async function updateAcademicYearStatus(
  schoolId: string,
  academicYearId: string,
  data: UpdateAcademicYearStatusDto
): Promise<AcademicYear> {
  const result = await apiPut<any, UpdateAcademicYearStatusDto>(
    `/schools/${schoolId}/academic-years/${academicYearId}/status`,
    data
  )
  return mapApiAcademicYear(result, schoolId)
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
// GRADING PERIOD API
// ============================================================================

interface GradingPeriod {
  id: string
  yearId: string
  schoolId: string
  name: string
  shortName?: string
  termType: 'semester' | 'quarter' | 'trimester' | 'year'
  sequence: number
  startDate: string
  endDate: string
  gradesDueDate?: string
  reportCardDate?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface CreateGradingPeriodDto {
  name: string
  shortName?: string
  termType: 'semester' | 'quarter' | 'trimester' | 'year'
  sequence: number
  startDate: string
  endDate: string
  gradesDueDate?: string
  reportCardDate?: string
}

interface GradingPeriodResponse {
  items: any[]
  hasMore: boolean
}

// Helper to map API grading period format to Frontend interface
function mapApiGradingPeriod(apiPeriod: any): GradingPeriod {
  return {
    id: apiPeriod.termId || apiPeriod.id,
    yearId: apiPeriod.yearId,
    schoolId: apiPeriod.schoolId,
    name: apiPeriod.name,
    shortName: apiPeriod.shortName,
    termType: apiPeriod.termType,
    sequence: apiPeriod.sequence,
    startDate: apiPeriod.startDate,
    endDate: apiPeriod.endDate,
    gradesDueDate: apiPeriod.gradesDueDate,
    reportCardDate: apiPeriod.reportCardDate,
    isActive: apiPeriod.isActive ?? true,
    createdAt: apiPeriod.createdAt || new Date().toISOString(),
    updatedAt: apiPeriod.updatedAt || new Date().toISOString(),
  }
}

/**
 * Get all grading periods for an academic year
 * GET /schools/{schoolId}/academic-years/{yearId}/grading-periods
 */
export async function getGradingPeriods(
  schoolId: string,
  yearId: string
): Promise<GradingPeriod[]> {
  const response = await apiGet<GradingPeriodResponse>(
    `/schools/${schoolId}/academic-years/${yearId}/grading-periods`
  )
  return (response.items || []).map(item => mapApiGradingPeriod(item))
}

/**
 * Create a new grading period
 * POST /schools/{schoolId}/academic-years/{yearId}/grading-periods
 */
export async function createGradingPeriod(
  schoolId: string,
  yearId: string,
  data: CreateGradingPeriodDto
): Promise<GradingPeriod> {
  const result = await apiPost<any, CreateGradingPeriodDto>(
    `/schools/${schoolId}/academic-years/${yearId}/grading-periods`,
    data
  )
  return mapApiGradingPeriod(result)
}

/**
 * Create multiple grading periods at once
 * Calls POST /schools/{schoolId}/academic-years/{yearId}/grading-periods for each period
 */
export async function createGradingPeriods(
  schoolId: string,
  yearId: string,
  periods: CreateGradingPeriodDto[]
): Promise<GradingPeriod[]> {
  const results = await Promise.all(
    periods.map(period => createGradingPeriod(schoolId, yearId, period))
  )
  return results
}

// ============================================================================
// HOLIDAYS API
// ============================================================================

export interface Holiday {
  holidayId: string
  yearId: string
  schoolId: string
  name: string
  date: string
  endDate?: string
  holidayType: 'federal' | 'state' | 'local' | 'school' | 'religious' | 'other'
  affectsStudents: boolean
  affectsStaff: boolean
  createdAt: string
}

export interface CreateHolidayDto {
  name: string
  date: string
  endDate?: string
  holidayType: 'federal' | 'state' | 'local' | 'school' | 'religious' | 'other'
  affectsStudents?: boolean
  affectsStaff?: boolean
}

interface HolidayListResponse {
  items: Holiday[]
  hasMore: boolean
}

/**
 * Get all holidays for an academic year
 * GET /schools/{schoolId}/academic-years/{yearId}/holidays
 */
export async function getHolidays(
  schoolId: string,
  yearId: string
): Promise<Holiday[]> {
  const response = await apiGet<HolidayListResponse>(
    `/schools/${schoolId}/academic-years/${yearId}/holidays`
  )
  return response.items || []
}

/**
 * Create a new holiday
 * POST /schools/{schoolId}/academic-years/{yearId}/holidays
 */
export async function createHoliday(
  schoolId: string,
  yearId: string,
  data: CreateHolidayDto
): Promise<Holiday> {
  return apiPost<Holiday, CreateHolidayDto>(
    `/schools/${schoolId}/academic-years/${yearId}/holidays`,
    data
  )
}

/**
 * Delete a holiday
 * DELETE /schools/{schoolId}/academic-years/{yearId}/holidays/{holidayId}
 */
export async function deleteHoliday(
  schoolId: string,
  yearId: string,
  holidayId: string
): Promise<void> {
  await apiDelete(`/schools/${schoolId}/academic-years/${yearId}/holidays/${holidayId}`)
}

// ============================================================================
// AUDIT LOG
// ============================================================================

export interface AuditLogEntry {
  auditId: string
  schoolId: string
  targetEntity: string
  targetEntityId: string
  action: string
  changes: { field: string; oldValue: any; newValue: any }[]
  changedBy: string
  changedByName?: string
  changedAt: string
  reason?: string
  severity?: 'normal' | 'high'
}

/**
 * Get audit log for a school
 * GET /schools/{schoolId}/audit-log
 */
export async function getAuditLog(
  schoolId: string,
  options: { limit?: number; startDate?: string; endDate?: string; action?: string } = {}
): Promise<{ items: AuditLogEntry[]; hasMore: boolean }> {
  const params: Record<string, string> = {}
  if (options.limit) params.limit = String(options.limit)
  if (options.startDate) params.startDate = options.startDate
  if (options.endDate) params.endDate = options.endDate
  if (options.action) params.action = options.action
  const query = new URLSearchParams(params).toString()
  return apiGet<{ items: AuditLogEntry[]; hasMore: boolean }>(
    `/schools/${schoolId}/audit-log${query ? `?${query}` : ''}`
  )
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
  confirmWorkspaceSettings,
  completeOnboarding,

  // Schools
  getSchools,
  getSchoolsPaginated,
  getSchool,
  createSchool,
  updateSchool,
  transitionSchoolStatus,
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

  // Grading Periods
  getGradingPeriods,
  createGradingPeriod,
  createGradingPeriods,

  // Holidays
  getHolidays,
  createHoliday,
  deleteHoliday,

  // School Years (Legacy)
  getSchoolYears,
  getCurrentSchoolYear,

  // Audit Log
  getAuditLog,
}

// Export types for use in components
export type { GradingPeriod, CreateGradingPeriodDto }

