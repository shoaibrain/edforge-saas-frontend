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
}

const SIZES = { sm: 24, md: 32, lg: 40 }

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return (parts[0]?.[0] || '?').toUpperCase()
}

function getInitialsBgColor(name: string): string {
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export function UserAvatar({ userId, userName, role = 'student', size = 'md', className = '' }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false)
  const px = SIZES[size]
  const avatarUrl = role === 'staff'
    ? getStaffAvatar(userName, { size: px })
    : getStudentAvatar(userId, { size: px })
  const initials = getInitials(userName)
  const bgColor = getInitialsBgColor(userName)

  if (imgError || !avatarUrl) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full text-white font-medium flex-shrink-0 ${bgColor} ${className}`}
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
