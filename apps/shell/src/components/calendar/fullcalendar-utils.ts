/**
 * FullCalendar Utilities
 *
 * Transforms CalendarDateResponseDto -> FullCalendar EventInput[].
 * Uses CSS class names (not inline styles) for dark mode support.
 * Color definitions live in fullcalendar-theme.css.
 *
 * Sprint S2.8 — event-type taxonomy consolidated into
 * `./event-types.ts`. Everything in this file now derives from there.
 */

import type { EventInput } from '@fullcalendar/core'
import type { CalendarDateResponseDto } from '@aibrains/shared-types'
import {
  ALL_EVENT_TYPES,
  type CalendarEventType,
  LEGEND_ITEMS,
  EVENT_TYPE_LABELS,
} from './event-types'

// Re-export for backward compatibility — callers that import from
// fullcalendar-utils keep working; new code should import from event-types directly.
export { ALL_EVENT_TYPES, LEGEND_ITEMS }
export type { CalendarEventType }

// ============================================================================
// EVENT TYPE HELPERS
// ============================================================================

// Event types that act as a generic "the school is open today" baseline.
// When a CalendarDate row carries one of these alongside a more specific
// event (e.g. exam_window, school_program, holiday), the specific one
// should win the visual treatment. This avoids the Sprint S1 bug where
// auto-synced exam_window events appended onto an existing instructional_day
// row rendered green (instructional) instead of orange (exam) because
// `calendarEvents[0]` was the underlying instructional_day.
const BASELINE_EVENT_TYPES = new Set<string>(['instructional_day', 'non_instructional_day'])

export function getPrimaryEventType(calendarDate: CalendarDateResponseDto): string {
  if (calendarDate.isWeekend) return '__weekend__'
  const events = calendarDate.calendarEvents ?? []
  if (events.length > 0) {
    // Prefer the first non-baseline event so a specific overlay
    // (exam_window, school_program, holiday, etc.) wins the cell color.
    const specific = events.find(e => !BASELINE_EVENT_TYPES.has(e.eventType))
    if (specific) return specific.eventType
    return events[0].eventType
  }
  if (calendarDate.isInstructionalDay) return 'instructional_day'
  return 'non_instructional_day'
}

export function getEventTypeLabel(eventType: string): string {
  return (EVENT_TYPE_LABELS as Record<string, string>)[eventType] || eventType.replace(/_/g, ' ')
}

export function getEventLabel(calendarDate: CalendarDateResponseDto): string | null {
  const events = calendarDate.calendarEvents ?? []
  if (events.length === 0) return null
  // Mirror getPrimaryEventType — prefer the specific event over the
  // instructional baseline so the rendered label matches the rendered color.
  const specific = events.find(e => !BASELINE_EVENT_TYPES.has(e.eventType))
  const evt = specific ?? events[0]
  if (evt.description) return evt.description
  return evt.eventType.replace(/_/g, ' ')
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
