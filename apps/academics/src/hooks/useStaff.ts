/**
 * useStaff Hooks
 *
 * React Query hooks for staff/teacher data fetching.
 * Used by the Section form teacher selector and the Teachers directory.
 *
 * Staff records use the Ed-Fi StaffResponseDto shape with `lastSurname`
 * as the surname field.
 */

import { useQuery } from '@tanstack/react-query'
import {
  getSchoolStaff,
  searchStaff,
  type StaffResponseDto,
  type StaffListResponseDto,
} from '../services/staff.service'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const staffKeys = {
  all: ['staff'] as const,
  schoolStaff: (schoolId: string) => [...staffKeys.all, 'school', schoolId] as const,
  search: (term: string) => [...staffKeys.all, 'search', term] as const,
}

// ============================================================================
// SCHOOL STAFF
// ============================================================================

/**
 * Hook to fetch all staff assigned to a school.
 * Used to populate the teacher selector dropdown.
 */
export function useSchoolStaff(schoolId: string, enabled = true) {
  return useQuery<StaffListResponseDto, Error>({
    queryKey: staffKeys.schoolStaff(schoolId),
    queryFn: () => getSchoolStaff(schoolId),
    enabled: enabled && !!schoolId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

/**
 * Helper to extract staff array from paginated response.
 * Handles both paginated objects and raw arrays.
 */
export function flattenStaffData(
  data: StaffListResponseDto | undefined
): StaffResponseDto[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  return data.items ?? []
}

/**
 * Helper to get a staff display name.
 * Uses the Ed-Fi `lastSurname` field for the surname.
 */
export function getStaffDisplayName(staff: StaffResponseDto): string {
  const first = staff.firstName || ''
  const middle = staff.middleName || ''
  const last = staff.lastSurname || ''

  const parts = [first]
  if (middle) parts.push(middle)
  if (last) parts.push(last)
  return parts.join(' ').trim() || staff.email || 'Unknown'
}

// ============================================================================
// STAFF SEARCH
// ============================================================================

/**
 * Hook to search staff by name (for autocomplete).
 * Only queries when the search term is >= 2 characters.
 */
export function useStaffSearch(term: string, enabled = true) {
  return useQuery<StaffListResponseDto, Error>({
    queryKey: staffKeys.search(term),
    queryFn: () => searchStaff(term),
    enabled: enabled && term.length >= 2,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  })
}
