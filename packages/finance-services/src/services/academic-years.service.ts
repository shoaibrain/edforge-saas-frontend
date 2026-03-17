/**
 * Academic Years Service
 *
 * API client for fetching academic years from the Identity microservice.
 * Used by finance forms (invoice generation) to populate academic year dropdowns.
 */

import { apiGet } from '@edforge/api-client'

export interface AcademicYearOption {
  yearId: string
  name: string
  status: 'planning' | 'active' | 'completed' | 'archived'
  isCurrent: boolean
  startDate: string
  endDate: string
}

interface AcademicYearsResponse {
  items: AcademicYearOption[]
  hasMore: boolean
  lastEvaluatedKey?: string
}

export async function getAcademicYears(
  schoolId: string,
): Promise<AcademicYearOption[]> {
  const response = await apiGet<AcademicYearsResponse | AcademicYearOption[]>(
    `/schools/${schoolId}/academic-years`,
    { limit: 50 },
  )
  if (Array.isArray(response)) return response
  return response?.items ?? []
}

export async function getCurrentAcademicYear(
  schoolId: string,
): Promise<AcademicYearOption | null> {
  try {
    return await apiGet<AcademicYearOption>(
      `/schools/${schoolId}/academic-years/current`,
    )
  } catch {
    return null
  }
}
