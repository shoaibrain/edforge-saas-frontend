/**
 * useAcademicYears — TanStack Query hooks for academic year selection
 *
 * Fetches academic years from the Identity service for use in finance forms.
 * Filters to only planning/active years (relevant for new invoices).
 */

import { useQuery } from '@tanstack/react-query'
import { getAcademicYears, getCurrentAcademicYear } from '../services/academic-years.service'

export const academicYearKeys = {
  all: ['academicYears'] as const,
  list: (schoolId: string) => [...academicYearKeys.all, 'list', schoolId] as const,
  current: (schoolId: string) => [...academicYearKeys.all, 'current', schoolId] as const,
}

export function useAcademicYears(schoolId: string) {
  return useQuery({
    queryKey: academicYearKeys.list(schoolId),
    queryFn: () => getAcademicYears(schoolId),
    enabled: !!schoolId,
    staleTime: 10 * 60 * 1000, // 10 minutes — academic years rarely change
  })
}

export function useCurrentAcademicYear(schoolId: string) {
  return useQuery({
    queryKey: academicYearKeys.current(schoolId),
    queryFn: () => getCurrentAcademicYear(schoolId),
    enabled: !!schoolId,
    staleTime: 10 * 60 * 1000,
  })
}
