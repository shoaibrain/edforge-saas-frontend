/**
 * Scheduled Meetings List Component
 * 
 * Displays a list of upcoming and past meetings with
 * platform info, time, and quick join actions.
 */

import { motion } from 'framer-motion'
import {
  Video,
  Clock,
  Users,
  ExternalLink,
  Calendar,
  MoreHorizontal,
  Play,
  ChevronRight,
} from 'lucide-react'
import { useIntegrationsStore } from '../../stores/integrations.store'
import {
  MEETING_PLATFORMS,
  parseMeetingDate,
  type ScheduledMeeting,
} from '../../lib/meeting-integrations'
import { formatRelativeDate } from '../../lib/greeting'
import { PlatformLogo } from './PlatformLogo'

// ============================================================================
// MEETING ROW COMPONENT
// ============================================================================

interface MeetingRowProps {
  meeting: ScheduledMeeting
  index: number
}

function MeetingRow({ meeting, index }: MeetingRowProps) {
  const platform = MEETING_PLATFORMS[meeting.platformId]
  const meetingDate = parseMeetingDate(meeting.date)
  const relativeDate = formatRelativeDate(meetingDate)
  const isToday = relativeDate === 'Today'
  
  // Check if meeting is happening now (simplified check)
  const now = new Date()
  const isInProgress = meeting.status === 'in-progress' || (
    isToday && 
    meetingDate.toDateString() === now.toDateString()
  )
  
  const handleJoin = () => {
    if (meeting.meetingUrl) {
      window.open(meeting.meetingUrl, '_blank')
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`
        group flex items-center gap-4 p-4 rounded-xl
        bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))]
        hover:border-[rgb(var(--border-tertiary))] hover:shadow-md
        transition-all duration-200
        ${isInProgress ? 'ring-2 ring-aqua-500/20 dark:ring-aqua-400/20' : ''}
      `}
    >
      {/* Platform Logo */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${platform.bgColor}`}>
        <PlatformLogo platformId={meeting.platformId} size={28} />
      </div>
      
      {/* Meeting Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-[rgb(var(--text-primary))] truncate">
            {meeting.title}
          </h4>
          {isInProgress && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-aqua-400/15 text-aqua-700 dark:text-aqua-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-aqua-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3 text-sm text-[rgb(var(--text-secondary))]">
          {/* Date/Time */}
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span className={isToday ? 'font-medium text-[rgb(var(--action-secondary-fg))]' : ''}>
              {relativeDate}
            </span>
            <span className="text-[rgb(var(--text-tertiary))]">
              {meeting.startTime}
            </span>
          </span>
          
          {/* Participants */}
          <span className="flex items-center gap-1 text-[rgb(var(--text-tertiary))]">
            <Users className="w-3.5 h-3.5" />
            {meeting.participants}
          </span>
          
          {/* Platform */}
          <span className="hidden sm:flex items-center gap-1 text-[rgb(var(--text-tertiary))]">
            <Video className="w-3.5 h-3.5" />
            {platform.name}
          </span>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2">
        {meeting.meetingUrl && (
          <button
            onClick={handleJoin}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm
              transition-colors
              ${isInProgress
                ? 'bg-aqua-500 hover:bg-aqua-600 text-[rgb(var(--action-primary-fg))]'
                : 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--interactive-hover))]'
              }
            `}
          >
            {isInProgress ? (
              <>
                <Play className="w-4 h-4" />
                Join now
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4" />
                Join
              </>
            )}
          </button>
        )}
        
        <button className="p-2 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--interactive-hover))] transition-colors opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState() {
  return (
    <div className="py-12 text-center">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-[rgb(var(--surface-tertiary))] flex items-center justify-center mb-4">
        <Calendar className="w-8 h-8 text-[rgb(var(--text-tertiary))]" />
      </div>
      <h3 className="font-medium text-[rgb(var(--text-primary))] mb-1">
        No upcoming meetings
      </h3>
      <p className="text-sm text-[rgb(var(--text-secondary))]">
        Schedule a meeting to get started
      </p>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface ScheduledMeetingsListProps {
  meetings?: ScheduledMeeting[]
  maxItems?: number
  showHeader?: boolean
  compact?: boolean
}

export function ScheduledMeetingsList({
  meetings: propMeetings,
  maxItems,
  showHeader = true,
  compact = false,
}: ScheduledMeetingsListProps) {
  const { scheduledMeetings } = useIntegrationsStore()
  
  // Use prop meetings or store meetings
  const allMeetings = propMeetings || scheduledMeetings
  
  // Sort by date (upcoming first)
  const sortedMeetings = [...allMeetings]
    .filter((m) => m.status === 'scheduled' || m.status === 'in-progress')
    .sort((a, b) => parseMeetingDate(a.date).getTime() - parseMeetingDate(b.date).getTime())
  
  // Limit items if specified
  const displayMeetings = maxItems ? sortedMeetings.slice(0, maxItems) : sortedMeetings
  
  if (displayMeetings.length === 0) {
    return <EmptyState />
  }
  
  return (
    <div>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
            <h2 className="text-sm font-medium text-[rgb(var(--text-secondary))]">
              Scheduled Meetings
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[rgb(var(--surface-tertiary))] text-xs text-[rgb(var(--text-tertiary))]">
              {sortedMeetings.length}
            </span>
          </div>
          
          {maxItems && sortedMeetings.length > maxItems && (
            <button className="flex items-center gap-1 text-xs font-medium text-[rgb(var(--action-secondary-fg))] hover:underline">
              View all
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
      
      <div className={compact ? 'space-y-2' : 'space-y-3'}>
        {displayMeetings.map((meeting, index) => (
          <MeetingRow key={meeting.id} meeting={meeting} index={index} />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

interface MeetingRowCompactProps {
  meeting: ScheduledMeeting
}

export function MeetingRowCompact({ meeting }: MeetingRowCompactProps) {
  const platform = MEETING_PLATFORMS[meeting.platformId]
  const meetingDate = parseMeetingDate(meeting.date)
  const relativeDate = formatRelativeDate(meetingDate)
  const isToday = relativeDate === 'Today'
  
  const handleJoin = () => {
    if (meeting.meetingUrl) {
      window.open(meeting.meetingUrl, '_blank')
    }
  }
  
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-[rgb(var(--interactive-hover))] transition-colors group">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${platform.bgColor}`}>
        <PlatformLogo platformId={meeting.platformId} size={20} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
          {meeting.title}
        </p>
        <p className="text-xs text-[rgb(var(--text-tertiary))]">
          <span className={isToday ? 'text-[rgb(var(--action-secondary-fg))]' : ''}>
            {relativeDate}
          </span>
          {' · '}{meeting.startTime}
        </p>
      </div>
      
      {meeting.meetingUrl && (
        <button
          onClick={handleJoin}
          className="p-2 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--action-secondary-fg))] dark:hover:text-[rgb(var(--action-secondary-fg))] hover:bg-[rgb(var(--state-info-bg)/0.18)] dark:hover:bg-[rgb(var(--state-info-bg)/0.18)] transition-colors opacity-0 group-hover:opacity-100"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

