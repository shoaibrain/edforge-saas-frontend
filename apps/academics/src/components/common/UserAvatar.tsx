/**
 * UserAvatar Component
 *
 * Unified avatar component with DiceBear integration and initials fallback.
 * Students use 'avataaars' style, staff use 'lorelei' style.
 */

import { useState } from 'react'
import { getStudentAvatar, getStaffAvatar } from '../../lib/avatar'

interface UserAvatarProps {
  userId: string
  userName: string
  role?: 'student' | 'staff'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /**
   * Explicit avatar seed. Overrides the role-default seed (student → userId,
   * staff → userName). Use a collision-resistant value for guardians, whose
   * `guardianId` is optional and whose names repeat within an archetype
   * (e.g. `${guardianId ?? firstName + '|' + lastName + '|' + relationship}`).
   */
  seed?: string
}

const SIZES = { sm: 24, md: 32, lg: 40 }

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return (parts[0]?.[0] || '?').toUpperCase()
}

function getInitialsBgColor(name: string): string {
  const colors = [
    'bg-[rgb(var(--state-info-fg))]',
    'bg-[rgb(var(--state-success-fg))]',
    'bg-[rgb(var(--state-warning-fg))]',
    'bg-[rgb(var(--state-danger-fg))]',
    'bg-[rgb(var(--action-primary-bg))]',
    'bg-[rgb(var(--action-secondary-fg))]',
    'bg-[rgb(var(--state-info-fg))]',
    'bg-[rgb(var(--state-success-fg))]',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export function UserAvatar({ userId, userName, role = 'student', size = 'md', className = '', seed }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false)
  const px = SIZES[size]
  const avatarUrl = role === 'staff'
    ? getStaffAvatar(seed ?? userName, { size: px })
    : getStudentAvatar(seed ?? userId, { size: px })
  const initials = getInitials(userName)
  const bgColor = getInitialsBgColor(userName)

  if (imgError || !avatarUrl) {
    return (
      <div
        // allow-presentation-style: avatar font-size scales with the px size prop
        className={`inline-flex items-center justify-center rounded-full text-[rgb(var(--action-primary-fg))] font-medium flex-shrink-0 ${bgColor} ${className}`}
        style={{ width: px, height: px, fontSize: px * 0.4 }}
        aria-label={userName}
      >
        {initials}
      </div>
    )
  }

  return (
    <img
      src={avatarUrl}
      alt={userName}
      className={`rounded-full flex-shrink-0 ${className}`}
      style={{ width: px, height: px }}
      onError={() => setImgError(true)}
    />
  )
}
