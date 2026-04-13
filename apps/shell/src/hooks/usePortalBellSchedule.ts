/**
 * usePortalBellSchedule — Shell-local hook for bell schedule data
 *
 * Returns the school's bell schedules with embedded class periods.
 * ABAC: authenticated-only (no permission guard on endpoint).
 *
 * Backend response shape matches BellScheduleResponseDto from
 * @aibrains/shared-types (bell-schedule.schema.ts). Key fields:
 *   - bellScheduleId, bellScheduleName, isDefault, startTime, endTime
 *   - classPeriods[]: { classPeriodName, periodNumber, periodType, startTime, endTime, dayOfWeek[] }
 *   - periodType enum: instructional | homeroom | lunch | recess | passing | assembly | advisory | study_hall | extracurricular
 *
 * The schedule page joins sections → bell schedule periods via periodId / periodNumber.
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'

export const portalBellScheduleKeys = {
  all: ['portal-bell-schedules'] as const,
  lists: () => [...portalBellScheduleKeys.all, 'list'] as const,
  list: (schoolId: string) =>
    [...portalBellScheduleKeys.lists(), schoolId] as const,
}

// ============================================================================
// TYPES — aligned with BellScheduleResponseDto from shared-types
// ============================================================================

/** Period type enum matching backend periodTypeSchema */
export type PeriodType =
  | 'instructional'
  | 'homeroom'
  | 'lunch'
  | 'recess'
  | 'passing'
  | 'assembly'
  | 'advisory'
  | 'study_hall'
  | 'extracurricular'

export interface BellSchedulePeriod {
  classPeriodName: string
  periodNumber: number
  periodType: PeriodType
  startTime: string   // HH:MM
  endTime: string     // HH:MM
  durationMinutes: number
  isAcademic: boolean
  /** Optional day-of-week restrictions for rotating schedules */
  dayOfWeek?: string[]
  description?: string
}

export interface BellSchedule {
  bellScheduleId: string
  schoolId: string
  bellScheduleName: string
  alternateDayName?: string
  dayType: string
  classPeriods: BellSchedulePeriod[]
  startTime?: string  // Overall day start HH:MM
  endTime?: string    // Overall day end HH:MM
  isDefault: boolean
  isActive: boolean
  periodCount: number
  instructionalPeriodCount: number
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Fetches bell schedules for a school.
 *
 * The backend returns a paginated response { items: BellSchedule[], total }.
 * We extract the items array. The default bell schedule (isDefault: true)
 * is the one the schedule page uses for the week timetable.
 */
export function usePortalBellSchedule(schoolId: string) {
  return useQuery({
    queryKey: portalBellScheduleKeys.list(schoolId),
    queryFn: async () => {
      // Bell schedules live on the identity service at /schools/:schoolId/bell-schedules
      // (NOT /academics/bell-schedules). schoolId is a path param, not a query param.
      const res = await apiGet<{ items: BellSchedule[] } | BellSchedule[]>(
        `/schools/${schoolId}/bell-schedules`
      )
      // Backend may return { items: [...] } or raw array
      return Array.isArray(res) ? res : res.items ?? []
    },
    enabled: !!schoolId,
    staleTime: 30 * 60 * 1000,
  })
}
