/**
 * UpcomingEventsWidget
 * 
 * A Notion-inspired calendar widget with customization menu.
 * Features:
 * - Notion-style options dropdown with toggles and submenus
 * - Inline empty state matching Notion's design
 * - Role-specific mock events for testing
 * - Full light/dark mode support using CSS custom properties
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
  ArrowUpRight,
  ChevronRight,
  EyeOff,
  HelpCircle,
  Check,
  Circle,
  type LucideIcon,
} from 'lucide-react'
import { formatRelativeDate } from '@/lib/greeting'
import { WidgetSection } from '../WidgetSection'
import { useAuthStore, getUserRoleCategory } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'

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
  isAllDay?: boolean
  hasConferencing?: boolean
}

interface EventTypeConfig {
  icon: LucideIcon
  bg: string
  iconColor: string
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
// EVENT TYPE STYLING
// ============================================================================

const EVENT_TYPES: Record<UpcomingEvent['type'], EventTypeConfig> = {
  meeting: {
    icon: Video,
    bg: 'bg-violet-100 dark:bg-violet-500/20',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  deadline: {
    icon: FileText,
    bg: 'bg-rose-100 dark:bg-rose-500/20',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  class: {
    icon: GraduationCap,
    bg: 'bg-teal-100 dark:bg-teal-500/20',
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
  event: {
    icon: Users,
    bg: 'bg-amber-100 dark:bg-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  reminder: {
    icon: Bell,
    bg: 'bg-cyan-100 dark:bg-cyan-500/20',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
}

// ============================================================================
// ROLE-SPECIFIC MOCK DATA
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
    type: 'class',
    location: 'Room 204',
    calendar: 'School',
  },
  {
    id: 't2',
    title: 'Parent-Teacher Conference',
    date: today,
    time: '3:30 PM',
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

// Default events (for unknown roles)
export const MOCK_UPCOMING_EVENTS: UpcomingEvent[] = ADMIN_EVENTS

// Get events based on user role
function getEventsForRole(roleCategory?: string): UpcomingEvent[] {
  switch (roleCategory) {
    case 'administrator':
      return ADMIN_EVENTS
    case 'educator':
      return TEACHER_EVENTS
    case 'student':
      return STUDENT_EVENTS
    case 'parent':
      return PARENT_EVENTS
    default:
      return ADMIN_EVENTS
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

function getPlatformLabel(platform?: UpcomingEvent['platform']): string {
  switch (platform) {
    case 'google-meet': return 'Google Meet'
    case 'zoom': return 'Zoom'
    case 'teams': return 'Teams'
    case 'in-person': return 'In Person'
    default: return ''
  }
}

function filterEvents(events: UpcomingEvent[], filters: EventFilters): UpcomingEvent[] {
  const now = new Date()
  const maxDate = new Date(now)
  maxDate.setDate(maxDate.getDate() + filters.includeDays)
  
  return events.filter((event) => {
    const eventDate = parseEventDate(event.date)
    
    // Filter by date range
    if (eventDate > maxDate) return false
    
    // Filter by calendar
    if (event.calendar && !filters.calendars.has(event.calendar)) {
      return false
    }
    
    // Filter all-day events
    if (!filters.showAllDay && event.isAllDay) {
      return false
    }
    
    // Filter events without participants
    if (!filters.showWithoutParticipants && !event.participants) {
      return false
    }
    
    // Filter events without conferencing
    if (!filters.showWithoutConferencing && !event.hasConferencing && !event.location) {
      return false
    }
    
    return true
  })
}

// ============================================================================
// iOS-STYLE TOGGLE SWITCH
// ============================================================================

interface ToggleSwitchProps {
  checked: boolean
  onChange: () => void
  disabled?: boolean
}

function ToggleSwitch({ checked, onChange, disabled }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`
        relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full 
        transition-colors duration-200 ease-in-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand-primary))] focus-visible:ring-offset-2
        ${checked 
          ? 'bg-[rgb(var(--brand-primary))]' 
          : 'bg-[rgb(var(--border-primary))]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-4 w-4 transform rounded-full 
          bg-white shadow-sm ring-0 transition duration-200 ease-in-out
          ${checked ? 'translate-x-4' : 'translate-x-0.5'}
        `}
        style={{ marginTop: '2px' }}
      />
    </button>
  )
}

// ============================================================================
// NOTION-STYLE OPTIONS MENU
// ============================================================================

interface EventsOptionsMenuProps {
  calendars: string[]
  filters: EventFilters
  onUpdateFilters: (updates: Partial<EventFilters>) => void
  onHideWidget?: () => void
}

function EventsOptionsMenu({
  calendars,
  filters,
  onUpdateFilters,
  onHideWidget,
}: EventsOptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState<'calendars' | 'days' | null>(null)
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
        setActiveSubmenu(null)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleToggleCalendar = (calendar: string) => {
    const newCalendars = new Set(filters.calendars)
    if (newCalendars.has(calendar)) {
      newCalendars.delete(calendar)
    } else {
      newCalendars.add(calendar)
    }
    onUpdateFilters({ calendars: newCalendars })
  }
  
  const daysOptions: IncludeDays[] = [3, 7, 14]
  
  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => {
          setIsOpen(!isOpen)
          setActiveSubmenu(null)
        }}
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
              w-64
              bg-[rgb(var(--surface-secondary))]
              border border-[rgb(var(--border-primary))]
              rounded-xl shadow-xl
              overflow-hidden
            `}
          >
            {/* Main Menu */}
            {activeSubmenu === null && (
              <>
                {/* Calendars Row */}
                <button
                  onClick={() => setActiveSubmenu('calendars')}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[rgb(var(--interactive-hover))] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                    <span className="text-sm text-[rgb(var(--text-primary))]">Calendars</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                </button>
                
                {/* Include Events Row */}
                <button
                  onClick={() => setActiveSubmenu('days')}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[rgb(var(--interactive-hover))] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 text-[rgb(var(--text-tertiary))] text-xs font-medium flex items-center justify-center">↕</span>
                    <span className="text-sm text-[rgb(var(--text-primary))]">Include events</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-[rgb(var(--text-tertiary))]">{filters.includeDays} days</span>
                    <ChevronRight className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                  </div>
                </button>
                
                {/* Divider */}
                <div className="border-t border-[rgb(var(--border-secondary))] my-1" />
                
                {/* Toggle Options */}
                <div className="px-3 py-2 space-y-2">
                  {/* All-day events */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Circle className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                      <span className="text-sm text-[rgb(var(--text-primary))]">All-day events</span>
                    </div>
                    <ToggleSwitch
                      checked={filters.showAllDay}
                      onChange={() => onUpdateFilters({ showAllDay: !filters.showAllDay })}
                    />
                  </div>
                  
                  {/* Events without participants */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                      <span className="text-sm text-[rgb(var(--text-primary))] truncate">Events without participants</span>
                    </div>
                    <ToggleSwitch
                      checked={filters.showWithoutParticipants}
                      onChange={() => onUpdateFilters({ showWithoutParticipants: !filters.showWithoutParticipants })}
                    />
                  </div>
                  
                  {/* Events without conferencing */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                      <span className="text-sm text-[rgb(var(--text-primary))] truncate">Events without conf...</span>
                    </div>
                    <ToggleSwitch
                      checked={filters.showWithoutConferencing}
                      onChange={() => onUpdateFilters({ showWithoutConferencing: !filters.showWithoutConferencing })}
                    />
                  </div>
                </div>
                
                {/* Divider */}
                <div className="border-t border-[rgb(var(--border-secondary))] my-1" />
                
                {/* Hide from Home */}
                <button
                  onClick={() => {
                    onHideWidget?.()
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[rgb(var(--interactive-hover))] transition-colors"
                >
                  <EyeOff className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                  <span className="text-sm text-[rgb(var(--text-primary))]">Hide from Home</span>
                </button>
                
                {/* Learn more */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[rgb(var(--interactive-hover))] transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                  <span className="text-sm text-[rgb(var(--text-primary))]">Learn more</span>
                </button>
              </>
            )}
            
            {/* Calendars Submenu */}
            {activeSubmenu === 'calendars' && (
              <>
                <button
                  onClick={() => setActiveSubmenu(null)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[rgb(var(--interactive-hover))] transition-colors border-b border-[rgb(var(--border-secondary))]"
                >
                  <ChevronRight className="w-4 h-4 text-[rgb(var(--text-tertiary))] rotate-180" />
                  <span className="text-sm font-medium text-[rgb(var(--text-primary))]">Calendars</span>
                </button>
                <div className="p-2">
                  {calendars.map((calendar) => (
                    <button
                      key={calendar}
                      onClick={() => handleToggleCalendar(calendar)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[rgb(var(--interactive-hover))] transition-colors"
                    >
                      <div className={`
                        w-4 h-4 rounded flex items-center justify-center border transition-colors
                        ${filters.calendars.has(calendar)
                          ? 'bg-[rgb(var(--brand-primary))] border-[rgb(var(--brand-primary))]'
                          : 'border-[rgb(var(--border-primary))]'
                        }
                      `}>
                        {filters.calendars.has(calendar) && (
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        )}
                      </div>
                      <span className="text-sm text-[rgb(var(--text-primary))]">{calendar}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            
            {/* Days Submenu */}
            {activeSubmenu === 'days' && (
              <>
                <button
                  onClick={() => setActiveSubmenu(null)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[rgb(var(--interactive-hover))] transition-colors border-b border-[rgb(var(--border-secondary))]"
                >
                  <ChevronRight className="w-4 h-4 text-[rgb(var(--text-tertiary))] rotate-180" />
                  <span className="text-sm font-medium text-[rgb(var(--text-primary))]">Include events</span>
                </button>
                <div className="p-2">
                  {daysOptions.map((days) => (
                    <button
                      key={days}
                      onClick={() => {
                        onUpdateFilters({ includeDays: days })
                        setActiveSubmenu(null)
                      }}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[rgb(var(--interactive-hover))] transition-colors"
                    >
                      <span className="text-sm text-[rgb(var(--text-primary))]">{days} days</span>
                      {filters.includeDays === days && (
                        <Check className="w-4 h-4 text-[rgb(var(--brand-primary))]" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// NOTION-STYLE EMPTY STATE
// ============================================================================

function EmptyState() {
  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric' 
  })
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 py-4"
    >
      <span className="text-sm font-medium text-rose-500">
        Today {formattedDate.split(',')[1]?.trim()}
      </span>
      <div className="w-px h-4 bg-[rgb(var(--border-primary))]" />
      <span className="text-sm text-[rgb(var(--text-tertiary))]">
        No more events
      </span>
    </motion.div>
  )
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
        <Icon className={`w-4 h-4 ${config.iconColor}`} />
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
            ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' 
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
// HEADER ACTIONS (Notion-style)
// ============================================================================

interface EventsHeaderActionsProps {
  calendars: string[]
  filters: EventFilters
  onUpdateFilters: (updates: Partial<EventFilters>) => void
  onAddEvent?: () => void
  onExpand?: () => void
  onHideWidget?: () => void
}

function EventsHeaderActions({
  calendars,
  filters,
  onUpdateFilters,
  onAddEvent,
  onExpand,
  onHideWidget,
}: EventsHeaderActionsProps) {
  return (
    <div className="flex items-center gap-1">
      {/* Expand button */}
      <button
        onClick={onExpand}
        className="p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-tertiary))] transition-colors"
        title="Expand"
      >
        <ArrowUpRight className="w-4 h-4" />
      </button>
      
      {/* Options menu */}
      <EventsOptionsMenu
        calendars={calendars}
        filters={filters}
        onUpdateFilters={onUpdateFilters}
        onHideWidget={onHideWidget}
      />
      
      {/* Add event button */}
      <button
        onClick={onAddEvent}
        className="p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-tertiary))] transition-colors"
        title="Add event"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
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
  events: propEvents,
  maxDays = 3 
}: UpcomingEventsWidgetProps) {
  // Get user role to determine which events to show
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  
  // Get role category from active school
  const roleCategory = getUserRoleCategory(user, activeSchoolId)
  
  // Use role-specific events if no events provided
  const events = propEvents || getEventsForRole(roleCategory ?? undefined)
  
  // Extract unique calendars from events
  const calendars = Array.from(new Set(events.map(e => e.calendar).filter(Boolean) as string[]))
  
  // State for filters
  const [filters, setFilters] = useState<EventFilters>({
    calendars: new Set(calendars),
    includeDays: 3,
    showAllDay: true,
    showWithoutParticipants: true,
    showWithoutConferencing: true,
  })
  
  const handleUpdateFilters = (updates: Partial<EventFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }))
  }
  
  // Filter events
  const filteredEvents = filterEvents(events, filters)
  const groupedEvents = groupEventsByDay(filteredEvents)
  const dayGroups = Array.from(groupedEvents.entries()).slice(0, maxDays)
  
  const handleAddEvent = () => {
    // TODO: Open add event modal
    console.log('Add event clicked')
  }
  
  const handleExpand = () => {
    // TODO: Navigate to calendar page or open full view
    console.log('Expand clicked')
  }
  
  const handleHideWidget = () => {
    // TODO: Hide widget from preferences
    console.log('Hide widget clicked')
  }
  
  const headerActions = (
    <EventsHeaderActions
      calendars={calendars}
      filters={filters}
      onUpdateFilters={handleUpdateFilters}
      onAddEvent={handleAddEvent}
      onExpand={handleExpand}
      onHideWidget={handleHideWidget}
    />
  )
  
  // Empty state - Notion style
  if (dayGroups.length === 0) {
    return (
      <WidgetSection
        widgetId="upcoming-events"
        label="Upcoming events"
        headerActions={headerActions}
        animationDelay={0.3}
      >
        <EmptyState />
      </WidgetSection>
    )
  }
  
  return (
    <WidgetSection
      widgetId="upcoming-events"
      label="Upcoming events"
      headerActions={(
        <div className="flex items-center gap-1">
          {headerActions}
          <Link
            to="/communications"
            className="flex items-center gap-1 ml-2 px-2 py-1 text-xs font-medium text-[rgb(var(--brand-primary))] hover:underline rounded-lg hover:bg-[rgb(var(--surface-tertiary))] transition-colors"
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
