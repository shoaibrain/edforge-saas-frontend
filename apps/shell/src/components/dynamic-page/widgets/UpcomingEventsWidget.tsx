/**
 * UpcomingEventsWidget
 *
 * A Notion-inspired calendar widget with customization menu.
 * Features:
 * - Notion-style vertical list view grouped by day
 * - Timeline aesthetic
 * - Role-specific mock events
 * - Options menu
 *
 * COMING_SOON: Calendar integration, meeting/conferencing tools, and collaboration
 * features are not yet available. This widget displays mock data behind a
 * ComingSoonOverlay. Remove the overlay and connect to real calendar APIs
 * when these features ship.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'

import {
  Video,
  Users,
  Calendar as CalendarIcon,
  MapPin,
  Calendar,
} from 'lucide-react'
import { ComingSoonOverlay, ComingSoonBadge } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import { formatRelativeDate } from '../../../lib/greeting'
import { WidgetSection } from '../WidgetSection'
import { useDynamicPage } from '../DynamicPageContext'
import { useAuthStore, getUserRoleCategory } from '../../../stores/auth.store'
import { useAppStore } from '../../../stores/app.store'

// ============================================================================
// TYPES
// ============================================================================

export interface UpcomingEvent {
  id: string
  title: string
  date: Date | string
  time: string
  endTime?: string
  type: 'meeting' | 'deadline' | 'class' | 'event' | 'reminder'
  location?: string
  participants?: number
  platform?: 'google-meet' | 'zoom' | 'teams' | 'in-person'
  calendar?: string
  isAllDay?: boolean
  hasConferencing?: boolean
}

type IncludeDays = 3 | 7 | 14

interface EventFilters {
  calendars: Set<string>
  includeDays: IncludeDays
  showAllDay: boolean
  showWithoutParticipants: boolean
  showWithoutConferencing: boolean
}

// ============================================================================
// MOCK DATA
// ============================================================================

const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)
const dayAfter = new Date(today)
dayAfter.setDate(dayAfter.getDate() + 2)

// Admin events
const ADMIN_EVENTS: UpcomingEvent[] = [
  {
    id: 'a1',
    title: 'Staff Weekly Standup',
    date: today,
    time: '9:00 AM',
    endTime: '10:00 AM',
    type: 'meeting',
    platform: 'google-meet',
    participants: 12,
    calendar: 'School',
    hasConferencing: true,
  },
  {
    id: 'a2',
    title: 'Board of Directors Review',
    date: today,
    time: '2:00 PM',
    endTime: '3:30 PM',
    type: 'meeting',
    platform: 'zoom',
    participants: 8,
    calendar: 'School',
    hasConferencing: true,
  },
  {
    id: 'a3',
    title: 'Budget Planning Session',
    date: tomorrow,
    time: '10:00 AM',
    endTime: '11:30 AM',
    type: 'meeting',
    location: 'Conference Room A',
    participants: 5,
    calendar: 'School',
  },
  {
    id: 'a4',
    title: 'District Leadership Meeting',
    date: tomorrow,
    time: '3:00 PM',
    endTime: '4:00 PM',
    type: 'meeting',
    platform: 'teams',
    participants: 15,
    calendar: 'School',
    hasConferencing: true,
  },
  {
    id: 'a5',
    title: 'Quarterly Report Due',
    date: dayAfter,
    time: '5:00 PM',
    type: 'deadline',
    calendar: 'Personal',
  },
]

// Teacher events
const TEACHER_EVENTS: UpcomingEvent[] = [
  {
    id: 't1',
    title: 'Math Class - Period 1',
    date: today,
    time: '8:30 AM',
    endTime: '9:20 AM',
    type: 'class',
    location: 'Room 204',
    calendar: 'School',
  },
  {
    id: 't2',
    title: 'Parent-Teacher Conference',
    date: today,
    time: '3:30 PM',
    endTime: '4:00 PM',
    type: 'meeting',
    platform: 'zoom',
    participants: 2,
    calendar: 'School',
    hasConferencing: true,
  },
  {
    id: 't3',
    title: 'Grade Submission Deadline',
    date: tomorrow,
    time: '5:00 PM',
    type: 'deadline',
    calendar: 'School',
  },
  {
    id: 't4',
    title: 'Department Meeting',
    date: tomorrow,
    time: '2:00 PM',
    endTime: '3:00 PM',
    type: 'meeting',
    location: 'Staff Lounge',
    participants: 8,
    calendar: 'School',
  },
  {
    id: 't5',
    title: 'Science Fair Prep',
    date: dayAfter,
    time: '10:00 AM',
    endTime: '12:00 PM',
    type: 'event',
    location: 'Gymnasium',
    calendar: 'School',
  },
]

// Student events
const STUDENT_EVENTS: UpcomingEvent[] = [
  {
    id: 's1',
    title: 'History Class',
    date: today,
    time: '9:00 AM',
    endTime: '9:50 AM',
    type: 'class',
    location: 'Room 101',
    calendar: 'School',
  },
  {
    id: 's2',
    title: 'Math Homework Due',
    date: today,
    time: '11:59 PM',
    type: 'deadline',
    calendar: 'School',
  },
  {
    id: 's3',
    title: 'Chess Club Meeting',
    date: tomorrow,
    time: '3:30 PM',
    endTime: '4:30 PM',
    type: 'event',
    location: 'Library',
    participants: 12,
    calendar: 'Personal',
  },
  {
    id: 's4',
    title: 'Science Project Due',
    date: dayAfter,
    time: '9:00 AM',
    type: 'deadline',
    calendar: 'School',
  },
]

// Parent events
const PARENT_EVENTS: UpcomingEvent[] = [
  {
    id: 'p1',
    title: 'Parent-Teacher Meeting',
    date: today,
    time: '3:30 PM',
    endTime: '4:00 PM',
    type: 'meeting',
    platform: 'zoom',
    participants: 2,
    calendar: 'School',
    hasConferencing: true,
  },
  {
    id: 'p2',
    title: 'PTA Monthly Meeting',
    date: tomorrow,
    time: '6:00 PM',
    endTime: '8:00 PM',
    type: 'event',
    location: 'Main Auditorium',
    participants: 80,
    calendar: 'School',
  },
  {
    id: 'p3',
    title: 'School Play - Spring Musical',
    date: dayAfter,
    time: '7:00 PM',
    type: 'event',
    location: 'School Theater',
    calendar: 'School',
  },
]

// Re-export mock events to satisfy barrel file
export const MOCK_UPCOMING_EVENTS = ADMIN_EVENTS

function getEventsForRole(roleCategory?: string): UpcomingEvent[] {
  switch (roleCategory) {
    case 'administrator': return ADMIN_EVENTS
    case 'educator': return TEACHER_EVENTS
    case 'student': return STUDENT_EVENTS
    case 'parent': return PARENT_EVENTS
    default: return ADMIN_EVENTS
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parseEventDate(date: Date | string): Date {
  if (date instanceof Date) return date
  return new Date(date)
}

function groupEventsByDay(events: UpcomingEvent[]): Map<string, UpcomingEvent[]> {
  const grouped = new Map<string, UpcomingEvent[]>()

  events.forEach((event) => {
    const eventDate = parseEventDate(event.date)
    const dateKey = eventDate.toDateString()
    const existing = grouped.get(dateKey) || []
    grouped.set(dateKey, [...existing, event])
  })

  return grouped
}

function filterEvents(events: UpcomingEvent[], filters: EventFilters): UpcomingEvent[] {
  const now = new Date()
  const maxDate = new Date(now)
  maxDate.setDate(maxDate.getDate() + filters.includeDays)

  return events.filter((event) => {
    const eventDate = parseEventDate(event.date)
    if (eventDate > maxDate) return false
    if (event.calendar && !filters.calendars.has(event.calendar)) return false
    if (!filters.showAllDay && event.isAllDay) return false
    if (!filters.showWithoutParticipants && !event.participants) return false
    if (!filters.showWithoutConferencing && !event.hasConferencing && !event.location) return false
    return true
  })
}

// ============================================================================
// COMPONENTS
// ============================================================================

// --- Empty State ---
function EmptyState() {
  const { t } = useTranslation('dashboard')
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 py-6 px-4 text-[rgb(var(--text-tertiary))]">
      <CalendarIcon className="w-8 h-8 opacity-20" />
      <div>
        <h4 className="text-sm font-medium text-[rgb(var(--text-secondary))]">{t('noUpcomingEvents')}</h4>
        <p className="text-xs">{t('enjoyFreeTime')}</p>
      </div>
    </motion.div>
  )
}

// --- Event List Item ---

function EventItem({ event }: { event: UpcomingEvent }) {
  return (
    <div className="group flex items-start gap-4 py-1.5 px-2 -mx-2 rounded-lg hover:bg-[rgb(var(--surface-hover))] transition-colors cursor-pointer">
      {/* Time Column */}
      <div className="w-16 flex-shrink-0 text-right pt-0.5">
        <div className="text-sm font-medium text-[rgb(var(--text-secondary))]">{event.time}</div>
        {event.endTime && (
          <div className="text-xs text-[rgb(var(--text-tertiary))]">{event.endTime}</div>
        )}
      </div>

      {/* Vertical Line Marker */}
      <div className={`w-1 h-full min-h-[2.5rem] rounded-full flex-shrink-0 ${event.type === 'meeting' ? 'bg-violet-400' :
        event.type === 'deadline' ? 'bg-rose-400' :
          event.type === 'class' ? 'bg-teal-400' :
            'bg-[rgb(var(--brand-primary))]'
        }`} />

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <h4 className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">{event.title}</h4>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-[rgb(var(--text-tertiary))]">
          {event.platform && (
            <span className="flex items-center gap-1">
              <Video className="w-3 h-3" />
              {event.platform}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {event.location}
            </span>
          )}
          {event.participants && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {event.participants}
            </span>
          )}
        </div>
      </div>

      {/* Join/Action Button (Visible on Hover) */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        {event.hasConferencing && (
          <button className="px-2 py-1 text-xs bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-secondary))] rounded shadow-sm text-[rgb(var(--text-primary))]">
            Join
          </button>
        )}
      </div>
    </div>
  )
}

// --- Main Widget Rendering ---

export function UpcomingEventsWidget({ events: propEvents, maxDays = 3 }: { events?: UpcomingEvent[]; maxDays?: number }) {
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  // COMING_SOON: Re-enable toggleWidget and setFilters when calendar features ship
  const _dynPage = useDynamicPage()
  void _dynPage
  const { t, i18n } = useTranslation('dashboard')
  const roleCategory = getUserRoleCategory(user, activeSchoolId)
  const events = propEvents || getEventsForRole(roleCategory ?? undefined)
  const calendars = Array.from(new Set(events.map(e => e.calendar).filter(Boolean) as string[]))
  const locale = i18n.language === 'ne' ? 'ne-NP' : 'en-US'

  const [filters] = useState<EventFilters>({
    calendars: new Set(calendars),
    includeDays: 3,
    showAllDay: true,
    showWithoutParticipants: true,
    showWithoutConferencing: true,
  })

  const filteredEvents = filterEvents(events, filters)
  const groupedEvents = groupEventsByDay(filteredEvents)
  const dayGroups = Array.from(groupedEvents.entries()).slice(0, maxDays)

  return (
    <WidgetSection
      widgetId="upcoming-events"
      label={t('upcomingEvents')}
      overflowVisible={true}
      icon={Calendar}
      // COMING_SOON: Replace header actions with badge until calendar features ship
      headerActions={<ComingSoonBadge size="sm" />}
    >
      {/* COMING_SOON: Wrap mock events in overlay — remove when real calendar API is connected */}
      <ComingSoonOverlay>
        {dayGroups.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6 pl-2">
            {dayGroups.map(([dateKey, dayEvents]) => {
              const date = new Date(dateKey)
              const isToday = new Date().toDateString() === date.toDateString()
              const relativeDate = formatRelativeDate(date, t)

              return (
                <div key={dateKey} className="flex gap-4">
                  {/* Left Column: Date */}
                  <div className="w-24 flex-shrink-0 pt-2">
                    <div className={`text-sm font-semibold ${isToday ? 'text-rose-500' : 'text-[rgb(var(--text-secondary))]'}`}>
                      {relativeDate === t('today') || relativeDate === t('tomorrow') ? relativeDate : date.toLocaleDateString(locale, { weekday: 'short' })}
                    </div>
                    <div className="text-xs text-[rgb(var(--text-tertiary))]">
                      {date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>

                  {/* Right Column: Events */}
                  <div className="flex-1 space-y-2 border-l border-[rgb(var(--border-secondary))] pl-4 py-1">
                    {dayEvents.map(event => (
                      <EventItem key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ComingSoonOverlay>
    </WidgetSection>
  )
}
