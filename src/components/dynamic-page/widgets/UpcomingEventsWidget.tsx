/**
 * UpcomingEventsWidget
 * 
 * A Notion-inspired calendar widget with customization menu.
 * Features:
 * - Notion-style vertical list view grouped by day
 * - Timeline aesthetic
 * - Role-specific mock events
 * - Options menu
 */

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import {
  Video,
  Users,

  Plus,
  MoreHorizontal,
  ArrowUpRight,
  ChevronRight,
  Check,
  Calendar as CalendarIcon,
  MapPin,
  Calendar,
} from 'lucide-react'
import { formatRelativeDate } from '@/lib/greeting'
import { WidgetSection } from '../WidgetSection'
import { useDynamicPage } from '../DynamicPageContext'
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

// --- Toggle Switch ---
function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-[rgb(var(--brand-primary))]' : 'bg-[rgb(var(--border-primary))]'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} style={{ marginTop: '2px' }} />
    </button>
  )
}

// --- Empty State ---
function EmptyState() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 py-6 px-4 text-[rgb(var(--text-tertiary))]">
      <CalendarIcon className="w-8 h-8 opacity-20" />
      <div>
        <h4 className="text-sm font-medium text-[rgb(var(--text-secondary))]">No upcoming events</h4>
        <p className="text-xs">Enjoy your free time!</p>
      </div>
    </motion.div>
  )
}

// --- Options Menu ---
function EventsOptionsMenu({
  calendars,
  filters,
  onUpdateFilters,
  onHideWidget,
}: {
  calendars: string[]
  filters: EventFilters
  onUpdateFilters: (updates: Partial<EventFilters>) => void
  onHideWidget?: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState<'calendars' | 'days' | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setActiveSubmenu(null)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-tertiary))] transition-colors ${isOpen ? 'bg-[rgb(var(--surface-tertiary))]' : ''}`}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            className="absolute right-0 top-full mt-2 z-50 w-64 bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-primary))] rounded-xl shadow-xl overflow-hidden"
          >
            {activeSubmenu === null ? (
              <>
                <button onClick={() => setActiveSubmenu('calendars')} className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-[rgb(var(--surface-hover))]">
                  <span>Calendars</span>
                  <ChevronRight className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                </button>
                <button onClick={() => setActiveSubmenu('days')} className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-[rgb(var(--surface-hover))]">
                  <span>Include events</span>
                  <div className="flex items-center gap-1 text-[rgb(var(--text-tertiary))]">
                    <span>{filters.includeDays} days</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
                <div className="border-t border-[rgb(var(--border-secondary))] my-1" />
                <div className="px-3 py-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">All-day events</span>
                    <ToggleSwitch checked={filters.showAllDay} onChange={() => onUpdateFilters({ showAllDay: !filters.showAllDay })} />
                  </div>
                </div>
                <div className="border-t border-[rgb(var(--border-secondary))] my-1" />
                <button onClick={() => { onHideWidget?.(); setIsOpen(false) }} className="w-full text-left px-3 py-2 text-sm hover:bg-[rgb(var(--surface-hover))]">Hide from Home</button>
              </>
            ) : (
              <div>
                <button onClick={() => setActiveSubmenu(null)} className="flex items-center px-3 py-2 text-sm font-medium border-b border-[rgb(var(--border-secondary))] w-full hover:bg-[rgb(var(--surface-hover))]">
                  <ChevronRight className="w-4 h-4 rotate-180 mr-2" />
                  Back
                </button>
                {activeSubmenu === 'calendars' && calendars.map(cal => (
                  <button key={cal} onClick={() => {
                    const newSet = new Set(filters.calendars)
                    if (newSet.has(cal)) newSet.delete(cal)
                    else newSet.add(cal)
                    onUpdateFilters({ calendars: newSet })
                  }} className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-[rgb(var(--surface-hover))]">
                    <span>{cal}</span>
                    {filters.calendars.has(cal) && <Check className="w-4 h-4 text-[rgb(var(--brand-primary))]" />}
                  </button>
                ))}
                {activeSubmenu === 'days' && [3, 7, 14].map(d => (
                  <button key={d} onClick={() => { onUpdateFilters({ includeDays: d as IncludeDays }); setIsOpen(false) }} className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-[rgb(var(--surface-hover))]">
                    <span>{d} days</span>
                    {filters.includeDays === d && <Check className="w-4 h-4 text-[rgb(var(--brand-primary))]" />}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function EventsHeaderActions({
  calendars,
  filters,
  onUpdateFilters,
  onAddEvent,
  onExpand,
  onHideWidget,
}: {
  calendars: string[]
  filters: EventFilters
  onUpdateFilters: (updates: Partial<EventFilters>) => void
  onAddEvent?: () => void
  onExpand?: () => void
  onHideWidget?: () => void
}) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={onExpand} className="p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-tertiary))] transition-colors">
        <ArrowUpRight className="w-4 h-4" />
      </button>
      <EventsOptionsMenu calendars={calendars} filters={filters} onUpdateFilters={onUpdateFilters} onHideWidget={onHideWidget} />
      <button onClick={onAddEvent} className="p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-tertiary))] transition-colors">
        <Plus className="w-4 h-4" />
      </button>
    </div>
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
  const { toggleWidget } = useDynamicPage() // Hook into dynamic page context
  const roleCategory = getUserRoleCategory(user, activeSchoolId)
  const events = propEvents || getEventsForRole(roleCategory ?? undefined)
  const calendars = Array.from(new Set(events.map(e => e.calendar).filter(Boolean) as string[]))

  const [filters, setFilters] = useState<EventFilters>({
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
      label="Upcoming events"
      overflowVisible={true}
      icon={Calendar}
      headerActions={
        <div className="flex items-center gap-1">
          <EventsHeaderActions
            calendars={calendars}
            filters={filters}
            onUpdateFilters={(u) => setFilters(p => ({ ...p, ...u }))}
            onHideWidget={() => toggleWidget('upcoming-events')}
            onAddEvent={() => console.log('add')}
            onExpand={() => console.log('expand')}
          />
        </div>
      }
    >
      {dayGroups.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6 pl-2">
          {dayGroups.map(([dateKey, dayEvents]) => {
            const date = new Date(dateKey)
            const isToday = new Date().toDateString() === date.toDateString()
            const relativeDate = formatRelativeDate(date)

            return (
              <div key={dateKey} className="flex gap-4">
                {/* Left Column: Date */}
                <div className="w-24 flex-shrink-0 pt-2">
                  <div className={`text-sm font-semibold ${isToday ? 'text-rose-500' : 'text-[rgb(var(--text-secondary))]'}`}>
                    {relativeDate === 'Today' || relativeDate === 'Tomorrow' ? relativeDate : date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-xs text-[rgb(var(--text-tertiary))]">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
    </WidgetSection>
  )
}
