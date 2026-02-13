/**
 * useScheduleResources Hooks (Sprint 3 - Task 3.12)
 *
 * React Query hooks for cross-service Identity resources
 * (ClassPeriods & Locations) used when creating/editing sections.
 */

import { useQuery } from '@tanstack/react-query'
import {
  getClassPeriods,
  getLocations,
  type ClassPeriodListResponseDto,
  type LocationListResponseDto,
} from '../services/academics.service'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const scheduleResourceKeys = {
  classPeriods: (schoolId: string) => ['class-periods', schoolId] as const,
  locations: (schoolId: string) => ['locations', schoolId] as const,
}

// ============================================================================
// CLASS PERIODS (from Identity service)
// ============================================================================

export function useSchoolClassPeriods(schoolId: string, enabled = true) {
  return useQuery<ClassPeriodListResponseDto, Error>({
    queryKey: scheduleResourceKeys.classPeriods(schoolId),
    queryFn: () => getClassPeriods(schoolId),
    enabled: enabled && !!schoolId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

// ============================================================================
// LOCATIONS (from Identity service)
// ============================================================================

export function useSchoolLocations(schoolId: string, enabled = true) {
  return useQuery<LocationListResponseDto, Error>({
    queryKey: scheduleResourceKeys.locations(schoolId),
    queryFn: () => getLocations(schoolId),
    enabled: enabled && !!schoolId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
