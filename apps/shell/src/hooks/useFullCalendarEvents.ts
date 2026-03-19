/**
 * useFullCalendarEvents Hook
 *
 * Wraps useCalendarDates and transforms the response into
 * FullCalendar EventInput[] format. Uses date-range params
 * to support FullCalendar's datesSet callback.
 * Supports client-side filtering by event type.
 */

import { useMemo } from 'react'
import { useCalendarDates } from './useCalendar'
import {
  getPrimaryEventType,
  transformCalendarDates,
  transformCalendarDatesToBgEvents,
} from '../components/calendar/fullcalendar-utils'
import type { EventInput } from '@fullcalendar/core'
import type { CalendarDateResponseDto } from '@aibrains/shared-types'

interface DateRange {
  start: string // YYYY-MM-DD
  end: string   // YYYY-MM-DD
}

interface UseFullCalendarEventsResult {
  events: EventInput[]
  bgEvents: EventInput[]
  rawDates: CalendarDateResponseDto[]
  isLoading: boolean
  isEmpty: boolean
}

export function useFullCalendarEvents(
  schoolId: string,
  academicYearId: string,
  dateRange: DateRange | null,
  activeTypes?: Set<string>,
): UseFullCalendarEventsResult {
  const { data, isLoading } = useCalendarDates(
    schoolId,
    {
      academicYearId,
      startDate: dateRange?.start,
      endDate: dateRange?.end,
      limit: 400,
    },
    !!academicYearId && !!dateRange,
  )

  const rawDates = data?.items || []

  // Filter raw dates by active event types if provided
  const filteredDates = useMemo(() => {
    if (!activeTypes) return rawDates
    return rawDates.filter(cd => {
      const eventType = getPrimaryEventType(cd)
      // Weekend is a pseudo-type; check if it's in active types
      if (eventType === '__weekend__') return activeTypes.has('__weekend__')
      return activeTypes.has(eventType)
    })
  }, [rawDates, activeTypes])

  const events = useMemo(
    () => transformCalendarDates(filteredDates),
    [filteredDates],
  )

  const bgEvents = useMemo(
    () => transformCalendarDatesToBgEvents(filteredDates),
    [filteredDates],
  )

  return {
    events,
    bgEvents,
    rawDates,
    isLoading,
    isEmpty: !isLoading && rawDates.length === 0,
  }
}
