/**
 * Platform Logo Component
 * 
 * Renders logos for meeting platforms using simple colored icons.
 */

import React from 'react'
import { Video, Calendar } from 'lucide-react'
import type { MeetingPlatformId } from '../../lib/meeting-integrations'

interface PlatformLogoProps {
  platformId: MeetingPlatformId
  size?: number
  className?: string
}

const platformColors: Record<MeetingPlatformId, string> = {
  'google-meet': '#00897B',
  'zoom': '#2D8CFF',
  'microsoft-teams': '#6264A7',
  'google-calendar': '#4285F4',
}

export function PlatformLogo({ platformId, size = 24, className = '' }: PlatformLogoProps) {
  const color = platformColors[platformId]
  const isCalendar = platformId === 'google-calendar'
  const Icon = isCalendar ? Calendar : Video
  
  return (
    <Icon
      style={{ color, width: size, height: size }}
      className={className}
    />
  )
}

/**
 * Get platform brand color
 */
export function getPlatformColor(platformId: MeetingPlatformId): string {
  return platformColors[platformId]
}

