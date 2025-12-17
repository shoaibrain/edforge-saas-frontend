/**
 * UpcomingEventsWidget
 * 
 * A Notion-inspired calendar widget with customization menu.
 * Displays upcoming events grouped by day with action buttons.
 */

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import {
  Calendar,
  Video,
  Users,
  GraduationCap,
  FileText,
  Bell,
  ArrowRight,
  Plus,
  MoreHorizontal,
  Maximize2,
  Check,
  type LucideIcon,
} from 'lucide-react'
import { formatRelativeDate } from '@/lib/greeting'
import { WidgetSection, HeaderActionButton } from '../WidgetSection'

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
  calendar?: string
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
    calendar: 'School',
  },
  {
    id: '2',
    title: 'Parent-Teacher Conference',
    date: today,
    time: '2:00 PM',
    type: 'meeting',
    platform: 'zoom',
    participants: 45,
    calendar: 'School',
  },
  {
    id: '3',
    title: 'Grade Submission Deadline',
    date: tomorrow,
    time: '5:00 PM',
    type: 'deadline',
    calendar: 'Personal',
  },
  {
    id: '4',
    title: 'PTA Monthly Meeting',
    date: tomorrow,
    time: '6:00 PM',
    type: 'event',
    location: 'Main Auditorium',
    participants: 80,
    calendar: 'School',
  },
  {
    id: '5',
    title: 'Science Fair Setup',
    date: dayAfter,
    time: '10:00 AM',
    type: 'event',
    location: 'Gymnasium',
    calendar: 'School',
  },
  {
    id: '6',
    title: 'Department Heads Review',
    date: dayAfter,
    time: '3:00 PM',
    type: 'meeting',
    platform: 'teams',
    participants: 8,
    calendar: 'School',
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
// OPTIONS MENU
// ============================================================================

interface EventsOptionsMenuProps {
  calendars: string[]
  selectedCalendars: Set<string>
  onToggleCalendar: (calendar: string) => void
  includeWeekends: boolean
  onToggleWeekends: () => void
}

function EventsOptionsMenu({
  calendars,
  selectedCalendars,
  onToggleCalendar,
  includeWeekends,
  onToggleWeekends,
}: EventsOptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          p-1.5 rounded-lg
          text-[rgb(var(--text-tertiary))]
          hover:text-[rgb(var(--text-secondary))]
          hover:bg-[rgb(var(--surface-tertiary))]
          transition-colors
          ${isOpen ? 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))]' : ''}
        `}
        title="Options"
        aria-label="Calendar options"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute right-0 top-full mt-2 z-50
              w-56 
              bg-[rgb(var(--surface-primary))]
              border border-[rgb(var(--border-primary))]
              rounded-xl shadow-lg
            `}
          >
            {/* Calendars Section */}
            <div className="p-2">
              <div className="px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                Calendars
              </div>
              {calendars.map((calendar) => (
                <button
                  key={calendar}
                  onClick={() => onToggleCalendar(calendar)}
                  className={`
                    w-full flex items-center gap-2 px-2 py-1.5 rounded-lg
                    text-sm text-[rgb(var(--text-primary))]
                    hover:bg-[rgb(var(--interactive-hover))]
                    transition-colors text-left
                  `}
                >
                  <div className={`
                    w-4 h-4 rounded flex items-center justify-center
                    border transition-colors
                    ${selectedCalendars.has(calendar)
                      ? 'bg-brand-500 border-brand-500 text-white'
                      : 'border-[rgb(var(--border-secondary))]'}
                  `}>
                    {selectedCalendars.has(calendar) && (
                      <Check className="w-3 h-3" strokeWidth={3} />
                    )}
                  </div>
                  {calendar}
                </button>
              ))}
            </div>
            
            {/* Divider */}
            <div className="border-t border-[rgb(var(--border-secondary))]" />
            
            {/* Include Events Section */}
            <div className="p-2">
              <div className="px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                Include events
              </div>
              <button
                onClick={onToggleWeekends}
                className={`
                  w-full flex items-center gap-2 px-2 py-1.5 rounded-lg
                  text-sm text-[rgb(var(--text-primary))]
                  hover:bg-[rgb(var(--interactive-hover))]
                  transition-colors text-left
                `}
              >
                <div className={`
                  w-4 h-4 rounded flex items-center justify-center
                  border transition-colors
                  ${includeWeekends
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'border-[rgb(var(--border-secondary))]'}
                `}>
                  {includeWeekends && (
                    <Check className="w-3 h-3" strokeWidth={3} />
                  )}
                </div>
                Weekends
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// HEADER ACTIONS
// ============================================================================

interface EventsHeaderActionsProps {
  calendars: string[]
  selectedCalendars: Set<string>
  onToggleCalendar: (calendar: string) => void
  includeWeekends: boolean
  onToggleWeekends: () => void
  onAddEvent?: () => void
  onExpand?: () => void
}

function EventsHeaderActions({
  calendars,
  selectedCalendars,
  onToggleCalendar,
  includeWeekends,
  onToggleWeekends,
  onAddEvent,
  onExpand,
}: EventsHeaderActionsProps) {
  return (
    <>
      <HeaderActionButton
        icon={Plus}
        label="Add event"
        onClick={onAddEvent}
      />
      <HeaderActionButton
        icon={Maximize2}
        label="Expand"
        onClick={onExpand}
      />
      <EventsOptionsMenu
        calendars={calendars}
        selectedCalendars={selectedCalendars}
        onToggleCalendar={onToggleCalendar}
        includeWeekends={includeWeekends}
        onToggleWeekends={onToggleWeekends}
      />
    </>
  )
}

// ============================================================================
// MAIN WIDGET COMPONENT
// ============================================================================

interface UpcomingEventsWidgetProps {
  events?: UpcomingEvent[]
  maxDays?: number
}

export function UpcomingEventsWidget({ 
  events = MOCK_UPCOMING_EVENTS,
  maxDays = 3 
}: UpcomingEventsWidgetProps) {
  // Extract unique calendars from events
  const calendars = Array.from(new Set(events.map(e => e.calendar).filter(Boolean) as string[]))
  
  // State for filtering
  const [selectedCalendars, setSelectedCalendars] = useState<Set<string>>(new Set(calendars))
  const [includeWeekends, setIncludeWeekends] = useState(true)
  
  // Filter events
  const filteredEvents = events.filter((event) => {
    // Filter by calendar
    if (event.calendar && !selectedCalendars.has(event.calendar)) {
      return false
    }
    
    // Filter weekends
    if (!includeWeekends) {
      const eventDate = parseEventDate(event.date)
      const day = eventDate.getDay()
      if (day === 0 || day === 6) return false
    }
    
    return true
  })
  
  const groupedEvents = groupEventsByDay(filteredEvents)
  const dayGroups = Array.from(groupedEvents.entries()).slice(0, maxDays)
  
  const handleToggleCalendar = (calendar: string) => {
    setSelectedCalendars((prev) => {
      const next = new Set(prev)
      if (next.has(calendar)) {
        next.delete(calendar)
      } else {
        next.add(calendar)
      }
      return next
    })
  }
  
  const handleAddEvent = () => {
    // TODO: Open add event modal
    console.log('Add event clicked')
  }
  
  const handleExpand = () => {
    // TODO: Navigate to calendar page or open full view
    console.log('Expand clicked')
  }
  
  const headerActions = (
    <EventsHeaderActions
      calendars={calendars}
      selectedCalendars={selectedCalendars}
      onToggleCalendar={handleToggleCalendar}
      includeWeekends={includeWeekends}
      onToggleWeekends={() => setIncludeWeekends(!includeWeekends)}
      onAddEvent={handleAddEvent}
      onExpand={handleExpand}
    />
  )
  
  // Empty state
  if (dayGroups.length === 0) {
    return (
      <WidgetSection
        widgetId="upcoming-events"
        label="Upcoming this week"
        headerActions={headerActions}
        animationDelay={0.3}
      >
        <div className="p-8 rounded-2xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] text-center">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-[rgb(var(--text-tertiary))]" />
          <p className="text-[rgb(var(--text-secondary))]">No upcoming events</p>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
            Your schedule is clear for now
          </p>
        </div>
      </WidgetSection>
    )
  }
  
  return (
    <WidgetSection
      widgetId="upcoming-events"
      label="Upcoming this week"
      headerActions={(
        <div className="flex items-center gap-1">
          {headerActions}
          <Link
            to="/communications"
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-teal-600 dark:text-cyan-400 hover:underline rounded-lg hover:bg-[rgb(var(--surface-tertiary))] transition-colors"
          >
            View all
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
      animationDelay={0.3}
    >
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
    </WidgetSection>
  )
}

