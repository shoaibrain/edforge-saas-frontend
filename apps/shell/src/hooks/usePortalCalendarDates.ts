/**
 * usePortalCalendarDates — Shell-local hook for calendar dates
 *
 * Returns holiday and event data for heatmap overlay.
 * Follows the portal hook pattern from usePortalStudentGrades.ts.
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'

export const portalCalendarKeys = {
  all: ['portal-calendar-dates'] as const,
  list: (schoolId: string, yearId: string, month?: string) =>
    [...portalCalendarKeys.all, schoolId, yearId, month].filter(Boolean) as string[],
}

export interface CalendarDate {
  id: string
  date: string
  eventType: string
  name?: string
  description?: string
  isInstructionalDay: boolean
  isHoliday: boolean
}

export interface CalendarDateListResponse {
  items: CalendarDate[]
  total: number
}

export function usePortalCalendarDates(
  schoolId: string,
  yearId: string,
  options?: { month?: string; startDate?: string; endDate?: string }
) {
  return useQuery({
    queryKey: portalCalendarKeys.list(schoolId, yearId, options?.month),
    queryFn: () =>
      // Calendar dates live on the identity service at /schools/:schoolId/calendar-dates
      apiGet<CalendarDateListResponse>(
        `/schools/${schoolId}/calendar-dates`,
        {
          academicYearId: yearId,
          ...(options?.month && { month: options.month }),
          ...(options?.startDate && { startDate: options.startDate }),
          ...(options?.endDate && { endDate: options.endDate }),
        }
      ),
    enabled: !!schoolId && !!yearId,
    staleTime: 5 * 60 * 1000,
  })
}
