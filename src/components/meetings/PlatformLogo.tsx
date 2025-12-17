/**
 * Platform Logo Component
 * 
 * Renders official SVG logos for meeting platforms.
 */

import type { MeetingPlatformId } from '@/lib/meeting-integrations'
import GoogleMeetLogo from '@/assets/google_meet.svg'
import ZoomLogo from '@/assets/zoom.svg'
import TeamsLogo from '@/assets/teams.svg'
import GoogleCalendarLogo from '@/assets/google_calendar.svg'

interface PlatformLogoProps {
  platformId: MeetingPlatformId
  size?: number
  className?: string
}

export function PlatformLogo({ platformId, size = 24, className = '' }: PlatformLogoProps) {
  const logoMap: Record<MeetingPlatformId, string> = {
    'google-meet': GoogleMeetLogo,
    'zoom': ZoomLogo,
    'microsoft-teams': TeamsLogo,
    'google-calendar': GoogleCalendarLogo,
  }
  
  const logo = logoMap[platformId]
  
  return (
    <img 
      src={logo} 
      alt={platformId} 
      width={size} 
      height={size} 
      className={className}
      style={{ width: size, height: size }}
    />
  )
}

/**
 * Get platform brand color
 */
export function getPlatformColor(platformId: MeetingPlatformId): string {
  const colors: Record<MeetingPlatformId, string> = {
    'google-meet': '#00897B',
    'zoom': '#2D8CFF',
    'microsoft-teams': '#6264A7',
    'google-calendar': '#4285F4',
  }
  return colors[platformId]
}
