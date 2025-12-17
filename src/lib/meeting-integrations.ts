/**
 * Meeting Integrations Configuration
 * 
 * Platform configurations for video conferencing integrations:
 * - Google Meet (Google Workspace for Education)
 * - Zoom
 * - Microsoft Teams
 */

// ============================================================================
// TYPES
// ============================================================================

export type MeetingPlatformId = 'google-meet' | 'zoom' | 'microsoft-teams' | 'google-calendar'

export interface MeetingPlatform {
  id: MeetingPlatformId
  name: string
  description: string
  longDescription: string
  color: string
  bgColor: string
  features: string[]
  permissions: string[]
  logoUrl?: string
  category: 'video' | 'calendar'
}

export interface ConnectedIntegration {
  platformId: MeetingPlatformId
  connectedAt: string
  accountEmail: string
  accountName?: string
  status: 'connected' | 'error' | 'expired'
  lastSync?: string
}

export interface ScheduledMeeting {
  id: string
  title: string
  description?: string
  date: string // ISO string for serialization
  startTime: string
  endTime: string
  platformId: MeetingPlatformId
  meetingUrl?: string
  participants: number
  organizer: string
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
}

// ============================================================================
// PLATFORM CONFIGURATIONS
// ============================================================================

export const MEETING_PLATFORMS: Record<MeetingPlatformId, MeetingPlatform> = {
  'google-meet': {
    id: 'google-meet',
    name: 'Google Meet',
    description: 'Video meetings for Google Workspace for Education',
    longDescription: 'Connect Google Meet to schedule and join video meetings directly from EdForge. Perfect for virtual classrooms, parent-teacher conferences, and staff meetings.',
    color: '#00897B',
    bgColor: 'bg-[#00897B]/10 dark:bg-[#00897B]/20',
    category: 'video',
    features: [
      'HD video and audio',
      'Screen sharing',
      'Live captions',
      'Recording (with Workspace)',
      'Breakout rooms',
      'Hand raising & Q&A',
    ],
    permissions: [
      'View your email address',
      'Create and manage meetings',
      'Access your calendar',
    ],
  },
  'zoom': {
    id: 'zoom',
    name: 'Zoom',
    description: 'Enterprise video communications platform',
    longDescription: 'Connect Zoom to leverage powerful video conferencing features including breakout rooms, polling, and advanced webinar capabilities.',
    color: '#2D8CFF',
    bgColor: 'bg-[#2D8CFF]/10 dark:bg-[#2D8CFF]/20',
    category: 'video',
    features: [
      'Breakout rooms',
      'Polling & surveys',
      'Virtual whiteboard',
      'Cloud recording',
      'Waiting room',
      'Virtual backgrounds',
    ],
    permissions: [
      'View your profile',
      'Create and manage meetings',
      'View meeting reports',
    ],
  },
  'microsoft-teams': {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Collaboration hub with video meetings',
    longDescription: 'Connect Microsoft Teams to integrate with your existing Microsoft 365 environment. Ideal for schools already using Microsoft tools.',
    color: '#6264A7',
    bgColor: 'bg-[#6264A7]/10 dark:bg-[#6264A7]/20',
    category: 'video',
    features: [
      'Team channels',
      'File sharing',
      'Whiteboard',
      'Meeting recording',
      'Together mode',
      'Live reactions',
    ],
    permissions: [
      'View your profile',
      'Create and manage meetings',
      'Access your organization',
    ],
  },
  'google-calendar': {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync your school calendar with Google',
    longDescription: 'Connect Google Calendar to automatically sync school events, meetings, and deadlines. Keep everyone on the same schedule.',
    color: '#4285F4',
    bgColor: 'bg-[#4285F4]/10 dark:bg-[#4285F4]/20',
    category: 'calendar',
    features: [
      'Two-way sync',
      'Automatic event creation',
      'Reminders & notifications',
      'Shared calendars',
      'Event attachments',
      'Time zone support',
    ],
    permissions: [
      'View your calendars',
      'Create and edit events',
      'View event details',
    ],
  },
}

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_CONNECTED_INTEGRATIONS: ConnectedIntegration[] = [
  {
    platformId: 'google-meet',
    connectedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    accountEmail: 'admin@lincolnhigh.edu',
    accountName: 'Lincoln High School',
    status: 'connected',
    lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
]

// Create dates for mock data
const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)
const dayAfter = new Date(today)
dayAfter.setDate(dayAfter.getDate() + 2)

export const MOCK_SCHEDULED_MEETINGS: ScheduledMeeting[] = [
  {
    id: 'mtg-001',
    title: 'Staff Weekly Standup',
    description: 'Weekly sync with all department heads',
    date: today.toISOString(),
    startTime: '9:00 AM',
    endTime: '9:30 AM',
    platformId: 'google-meet',
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
    participants: 12,
    organizer: 'Principal Johnson',
    status: 'scheduled',
  },
  {
    id: 'mtg-002',
    title: 'Parent-Teacher Conference',
    description: 'Q4 progress discussion for Grade 10',
    date: today.toISOString(),
    startTime: '2:00 PM',
    endTime: '3:30 PM',
    platformId: 'zoom',
    meetingUrl: 'https://zoom.us/j/123456789',
    participants: 45,
    organizer: 'Ms. Thompson',
    status: 'scheduled',
  },
  {
    id: 'mtg-003',
    title: 'Department Heads Review',
    description: 'Monthly curriculum planning session',
    date: tomorrow.toISOString(),
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    platformId: 'microsoft-teams',
    meetingUrl: 'https://teams.microsoft.com/l/meetup-join/...',
    participants: 8,
    organizer: 'Vice Principal Davis',
    status: 'scheduled',
  },
  {
    id: 'mtg-004',
    title: 'Science Fair Planning',
    description: 'Coordination meeting for upcoming science fair',
    date: dayAfter.toISOString(),
    startTime: '1:00 PM',
    endTime: '2:00 PM',
    platformId: 'google-meet',
    meetingUrl: 'https://meet.google.com/xyz-uvwx-yzz',
    participants: 15,
    organizer: 'Mr. Garcia',
    status: 'scheduled',
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getPlatformById(id: MeetingPlatformId): MeetingPlatform {
  return MEETING_PLATFORMS[id]
}

export function getAvailablePlatforms(): MeetingPlatform[] {
  return Object.values(MEETING_PLATFORMS)
}

export function getVideoPlatforms(): MeetingPlatform[] {
  return Object.values(MEETING_PLATFORMS).filter(p => p.category === 'video')
}

export function getCalendarPlatforms(): MeetingPlatform[] {
  return Object.values(MEETING_PLATFORMS).filter(p => p.category === 'calendar')
}

export function isIntegrationConnected(
  connectedIntegrations: ConnectedIntegration[],
  platformId: MeetingPlatformId
): boolean {
  return connectedIntegrations.some(
    (i) => i.platformId === platformId && i.status === 'connected'
  )
}

export function getConnectedIntegration(
  connectedIntegrations: ConnectedIntegration[],
  platformId: MeetingPlatformId
): ConnectedIntegration | undefined {
  return connectedIntegrations.find((i) => i.platformId === platformId)
}

/**
 * Format the time since last sync
 */
export function formatLastSync(lastSync?: string): string {
  if (!lastSync) return 'Never'
  
  const syncDate = new Date(lastSync)
  const now = new Date()
  const diffMs = now.getTime() - syncDate.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

/**
 * Parse meeting date safely (handles both Date objects and ISO strings)
 */
export function parseMeetingDate(date: string | Date): Date {
  if (date instanceof Date) return date
  return new Date(date)
}
