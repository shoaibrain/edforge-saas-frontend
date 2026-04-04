/**
 * FullCalendar Utilities
 *
 * Transforms CalendarDateResponseDto -> FullCalendar EventInput[].
 * Uses CSS class names (not inline styles) for dark mode support.
 * Color definitions live in fullcalendar-theme.css.
 */

import type { EventInput } from '@fullcalendar/core'
import type { CalendarDateResponseDto } from '@aibrains/shared-types'

// ============================================================================
// EVENT TYPES
// ============================================================================

export const ALL_EVENT_TYPES = [
  'instructional_day',
  'holiday',
  'teacher_only',
  'break',
  'non_instructional_day',
  'student_holiday',
  'early_release',
  'late_start',
  'make_up_day',
  'weather_day',
  'testing_day',
  'conference_day',
  'graduation',
  'in_service',
] as const

export type CalendarEventType = (typeof ALL_EVENT_TYPES)[number]

// ============================================================================
// LEGEND CONFIG (used by school-calendar page legend)
// ============================================================================

export const LEGEND_ITEMS: { type: string; label: string }[] = [
  { type: 'instructional_day', label: 'Instructional' },
  { type: 'holiday', label: 'Holiday' },
  { type: 'teacher_only', label: 'Teacher Only' },
  { type: 'break', label: 'Break' },
  { type: 'non_instructional_day', label: 'Non-Instructional' },
  { type: 'student_holiday', label: 'Student Holiday' },
  { type: 'early_release', label: 'Early Release' },
  { type: 'late_start', label: 'Late Start' },
  { type: 'make_up_day', label: 'Make-up Day' },
  { type: 'weather_day', label: 'Weather Day' },
  { type: 'testing_day', label: 'Testing Day' },
  { type: 'conference_day', label: 'Conference' },
  { type: 'graduation', label: 'Graduation' },
  { type: 'in_service', label: 'In-Service' },
]

// ============================================================================
// EVENT TYPE HELPERS
// ============================================================================

export function getPrimaryEventType(calendarDate: CalendarDateResponseDto): string {
  if (calendarDate.isWeekend) return '__weekend__'
  if (calendarDate.calendarEvents?.length > 0) {
    return calendarDate.calendarEvents[0].eventType
  }
  if (calendarDate.isInstructionalDay) return 'instructional_day'
  return 'non_instructional_day'
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  instructional_day: 'Instructional Day',
  holiday: 'Holiday',
  teacher_only: 'Teacher Only',
  break: 'Break',
  non_instructional_day: 'Non-Instructional',
  student_holiday: 'Student Holiday',
  early_release: 'Early Release',
  late_start: 'Late Start',
  make_up_day: 'Make-up Day',
  weather_day: 'Weather Day',
  testing_day: 'Testing Day',
  conference_day: 'Conference',
  graduation: 'Graduation',
  in_service: 'In-Service',
}

export function getEventTypeLabel(eventType: string): string {
  return EVENT_TYPE_LABELS[eventType] || eventType.replace(/_/g, ' ')
}

export function getEventLabel(calendarDate: CalendarDateResponseDto): string | null {
  if (calendarDate.calendarEvents?.length > 0) {
    const evt = calendarDate.calendarEvents[0]
    if (evt.description) return evt.description
    return evt.eventType.replace(/_/g, ' ')
  }
  return null
}

function cssClass(eventType: string): string {
  return `fc-evt-${eventType.replace(/__/g, '')}`
}

function bgCssClass(eventType: string): string {
  return `fc-bg-${eventType.replace(/__/g, '')}`
}

// ============================================================================
// FOREGROUND EVENT TRANSFORMER
// ============================================================================

export function calendarDateToFCEvent(cd: CalendarDateResponseDto): EventInput | null {
  const hasExplicitEvent = cd.calendarEvents?.length > 0
  const eventType = getPrimaryEventType(cd)

  // Plain instructional days and weekends only need background coloring
  if (!hasExplicitEvent && (eventType === 'instructional_day' || eventType === '__weekend__')) {
    return null
  }

  const label = getEventLabel(cd)

  return {
    id: cd.date,
    start: cd.date,
    allDay: true,
    title: label || eventType.replace(/_/g, ' '),
    classNames: [cssClass(eventType)],
    extendedProps: {
      calendarDate: cd,
      eventType,
      isInstructional: cd.isInstructionalDay,
      isWeekend: cd.isWeekend,
      bellScheduleName: cd.bellScheduleName,
    },
  }
}

export function transformCalendarDates(dates: CalendarDateResponseDto[]): EventInput[] {
  return dates.map(calendarDateToFCEvent).filter((e): e is EventInput => e !== null)
}

// ============================================================================
// BACKGROUND EVENTS (day-level coloring)
// ============================================================================

export function calendarDateToBgEvent(cd: CalendarDateResponseDto): EventInput {
  const eventType = getPrimaryEventType(cd)

  return {
    id: `bg-${cd.date}`,
    start: cd.date,
    allDay: true,
    display: 'background',
    classNames: [bgCssClass(eventType)],
    extendedProps: { eventType },
  }
}

export function transformCalendarDatesToBgEvents(dates: CalendarDateResponseDto[]): EventInput[] {
  return dates.map(calendarDateToBgEvent)
}
