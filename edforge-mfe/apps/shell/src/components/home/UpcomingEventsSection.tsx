/**
 * Upcoming Events Section
 * 
 * A Notion-inspired calendar-style display of upcoming events,
 * grouped by day with time and event details.
 */

import { motion } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import {
  Calendar,
  Video,
  Users,
  GraduationCap,
  FileText,
  Bell,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import { formatRelativeDate } from '../../lib/greeting'

// ============================================================================
// TYPES
// ============================================================================

export interface UpcomingEvent {
  id: string
  title: string
  date: Date | string
  time: string
  type: 'meeting' | 'deadline' | 'class' | 'event' | 'reminder'
  location?: string
  participants?: number
  platform?: 'google-meet' | 'zoom' | 'teams' | 'in-person'
}

interface EventTypeConfig {
  icon: LucideIcon
  bg: string
  iconColor: string
}

// ============================================================================
// EVENT TYPE STYLING
// ============================================================================

const EVENT_TYPES: Record<UpcomingEvent['type'], EventTypeConfig> = {
  meeting: {
    icon: Video,
    bg: 'bg-violet-500/10 dark:bg-violet-400/15',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  deadline: {
    icon: FileText,
    bg: 'bg-rust-500/10 dark:bg-rust-400/15',
    iconColor: 'text-rust-600 dark:text-rust-400',
  },
  class: {
    icon: GraduationCap,
    bg: 'bg-teal-500/10 dark:bg-cyan-500/15',
    iconColor: 'text-teal-600 dark:text-cyan-400',
  },
  event: {
    icon: Users,
    bg: 'bg-golden-400/15',
    iconColor: 'text-golden-600 dark:text-golden-400',
  },
  reminder: {
    icon: Bell,
    bg: 'bg-aqua-400/15',
    iconColor: 'text-aqua-700 dark:text-aqua-400',
  },
}

// ============================================================================
// MOCK DATA
// ============================================================================

const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)
const dayAfter = new Date(today)
dayAfter.setDate(dayAfter.getDate() + 2)

export const MOCK_UPCOMING_EVENTS: UpcomingEvent[] = [
  {
    id: '1',
    title: 'Staff Weekly Standup',
    date: today,
    time: '9:00 AM',
    type: 'meeting',
    platform: 'google-meet',
    participants: 12,
  },
  {
    id: '2',
    title: 'Parent-Teacher Conference',
    date: today,
    time: '2:00 PM',
    type: 'meeting',
    platform: 'zoom',
    participants: 45,
  },
  {
    id: '3',
    title: 'Grade Submission Deadline',
    date: tomorrow,
    time: '5:00 PM',
    type: 'deadline',
  },
  {
    id: '4',
    title: 'PTA Monthly Meeting',
    date: tomorrow,
    time: '6:00 PM',
    type: 'event',
    location: 'Main Auditorium',
    participants: 80,
  },
  {
    id: '5',
    title: 'Science Fair Setup',
    date: dayAfter,
    time: '10:00 AM',
    type: 'event',
    location: 'Gymnasium',
  },
  {
    id: '6',
    title: 'Department Heads Review',
    date: dayAfter,
    time: '3:00 PM',
    type: 'meeting',
    platform: 'teams',
    participants: 8,
  },
]

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

function getPlatformLabel(platform?: UpcomingEvent['platform']): string {
  switch (platform) {
    case 'google-meet': return 'Google Meet'
    case 'zoom': return 'Zoom'
    case 'teams': return 'Teams'
    case 'in-person': return 'In Person'
    default: return ''
  }
}

// ============================================================================
// EVENT CARD COMPONENT
// ============================================================================

interface EventCardProps {
  event: UpcomingEvent
  index: number
}

function EventCard({ event, index }: EventCardProps) {
  const config = EVENT_TYPES[event.type]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group flex items-start gap-3 p-3 rounded-xl hover:bg-[rgb(var(--interactive-hover))] transition-colors cursor-pointer"
    >
      {/* Event Icon */}
      <div className={`
        w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
        ${config.bg}
      `}>
        <Icon className={`w-4.5 h-4.5 ${config.iconColor}`} />
      </div>

      {/* Event Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-[rgb(var(--text-primary))] text-sm truncate">
            {event.title}
          </h4>
          <span className="text-xs text-[rgb(var(--text-tertiary))] whitespace-nowrap flex-shrink-0">
            {event.time}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-1 text-xs text-[rgb(var(--text-tertiary))]">
          {event.platform && (
            <span className="px-1.5 py-0.5 rounded bg-[rgb(var(--surface-tertiary))]">
              {getPlatformLabel(event.platform)}
            </span>
          )}
          {event.location && (
            <span>{event.location}</span>
          )}
          {event.participants && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {event.participants}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// DAY GROUP COMPONENT
// ============================================================================

interface DayGroupProps {
  dateKey: string
  events: UpcomingEvent[]
  dayIndex: number
}

function DayGroup({ dateKey, events, dayIndex }: DayGroupProps) {
  const date = new Date(dateKey)
  const relativeDate = formatRelativeDate(date)
  const isToday = relativeDate === 'Today'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + dayIndex * 0.1 }}
      className="flex-1 min-w-[280px]"
    >
      {/* Day Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[rgb(var(--border-secondary))]">
        <div className={`
          px-2.5 py-1 rounded-lg text-xs font-semibold
          ${isToday
            ? 'bg-teal-500/15 text-teal-700 dark:bg-cyan-500/20 dark:text-cyan-400'
            : 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))]'
          }
        `}>
          {relativeDate}
        </div>
        <span className="text-xs text-[rgb(var(--text-tertiary))]">
          {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Events List */}
      <div className="space-y-1">
        {events.map((event, index) => (
          <EventCard key={event.id} event={event} index={index} />
        ))}
      </div>
    </motion.div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface UpcomingEventsSectionProps {
  events?: UpcomingEvent[]
  maxDays?: number
}

export function UpcomingEventsSection({
  events = MOCK_UPCOMING_EVENTS,
  maxDays = 3
}: UpcomingEventsSectionProps) {
  const groupedEvents = groupEventsByDay(events)
  const dayGroups = Array.from(groupedEvents.entries()).slice(0, maxDays)

  if (dayGroups.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-8 rounded-2xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] text-center"
      >
        <Calendar className="w-10 h-10 mx-auto mb-3 text-[rgb(var(--text-tertiary))]" />
        <p className="text-[rgb(var(--text-secondary))]">No upcoming events</p>
        <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
          Your schedule is clear for now
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <h2 className="text-sm font-medium text-[rgb(var(--text-secondary))]">
            Upcoming this week
          </h2>
        </div>

        <Link
          to={"/messages/" as any}
          className="flex items-center gap-1 text-xs font-medium text-teal-600 dark:text-cyan-400 hover:underline"
        >
          View all
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Day Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dayGroups.map(([dateKey, dayEvents], dayIndex) => (
          <div
            key={dateKey}
            className="p-4 rounded-2xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))]"
          >
            <DayGroup dateKey={dateKey} events={dayEvents} dayIndex={dayIndex} />
          </div>
        ))}
      </div>
    </motion.div>
  )
}
