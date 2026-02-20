/**
 * School Service
 *
 * API client for school-level context data: academic years, terms/grading periods.
 * Used by section forms and scheduling page to populate selectors.
 */

import { apiGet, apiPut } from '../lib/api'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Academic year response from the Identity service
 */
export interface AcademicYearResponseDto {
  yearId: string
  schoolId: string
  name: string
  startDate: string
  endDate: string
  isCurrent: boolean
  status: 'planning' | 'active' | 'completed' | 'archived'
  createdAt: string
  updatedAt: string
}

/**
 * Grading period / term response
 */
export interface GradingPeriodResponseDto {
  periodId: string
  yearId: string
  schoolId: string
  name: string
  periodType: 'semester' | 'trimester' | 'quarter' | 'term' | 'full_year'
  startDate: string
  endDate: string
  sequence: number
  isCurrent: boolean
  gradesDueDate?: string
  reportCardDate?: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// ACADEMIC YEAR OPERATIONS
// ============================================================================

/**
 * List academic years for a school
 * GET /schools/:schoolId/academic-years
 *
 * The backend may return either a raw array or a paginated object
 * with an `items` property. We normalize to a plain array.
 */
export async function getAcademicYears(
  schoolId: string
): Promise<AcademicYearResponseDto[]> {
  const raw = await apiGet<AcademicYearResponseDto[] | { items: AcademicYearResponseDto[] }>(
    `/schools/${schoolId}/academic-years`
  )
  return Array.isArray(raw) ? raw : (raw?.items ?? [])
}

/**
 * Get the current academic year for a school
 * GET /schools/:schoolId/academic-years/current
 */
export async function getCurrentAcademicYear(
  schoolId: string
): Promise<AcademicYearResponseDto> {
  return apiGet<AcademicYearResponseDto>(
    `/schools/${schoolId}/academic-years/current`
  )
}

/**
 * Get grading periods (terms) for an academic year
 * GET /schools/:schoolId/academic-years/:yearId/grading-periods
 *
 * Same normalization as getAcademicYears — handles both array and paginated shapes.
 */
export async function getGradingPeriods(
  schoolId: string,
  yearId: string
): Promise<GradingPeriodResponseDto[]> {
  const raw = await apiGet<GradingPeriodResponseDto[] | { items: GradingPeriodResponseDto[] }>(
    `/schools/${schoolId}/academic-years/${yearId}/grading-periods`
  )
  return Array.isArray(raw) ? raw : (raw?.items ?? [])
}

// ============================================================================
// ACADEMIC YEAR MUTATIONS
// ============================================================================

/**
 * Set an academic year as the current year for a school.
 * Backend clears `isCurrent` from any previously-current year atomically.
 * PUT /schools/:schoolId/academic-years/:yearId/set-current
 */
export async function setCurrentAcademicYear(
  schoolId: string,
  yearId: string
): Promise<AcademicYearResponseDto> {
  return apiPut<AcademicYearResponseDto>(
    `/schools/${schoolId}/academic-years/${yearId}/set-current`
  )
}

/**
 * Update the status of an academic year
 * PUT /schools/:schoolId/academic-years/:yearId/status
 */
export async function updateAcademicYearStatus(
  schoolId: string,
  yearId: string,
  status: AcademicYearResponseDto['status']
): Promise<AcademicYearResponseDto> {
  return apiPut<AcademicYearResponseDto>(
    `/schools/${schoolId}/academic-years/${yearId}/status`,
    { status }
  )
}

// ============================================================================
// EXPORTED SERVICE OBJECT
// ============================================================================

export const schoolService = {
  getAcademicYears,
  getCurrentAcademicYear,
  getGradingPeriods,
  setCurrentAcademicYear,
  updateAcademicYearStatus,
}
