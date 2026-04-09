/**
 * StudentStatusBadge Component — V2
 *
 * Displays student enrollment status as a V2-styled pill badge
 * with semantic colors using inline styles for theme compatibility.
 */

import type { StudentStatus } from '@aibrains/shared-types'

interface StudentStatusBadgeProps {
  status: StudentStatus
}

const statusConfig: Record<
  StudentStatus,
  { label: string; bg: string; color: string }
> = {
  active: {
    label: 'Active',
    bg: 'rgba(29, 158, 117, 0.12)',
    color: '#1D9E75',
  },
  inactive: {
    label: 'Inactive',
    bg: 'rgba(154, 160, 184, 0.12)',
    color: '#9aa0b8',
  },
  pending: {
    label: 'Pending',
    bg: 'rgba(239, 159, 39, 0.12)',
    color: '#EF9F27',
  },
  graduated: {
    label: 'Graduated',
    bg: 'rgba(55, 138, 221, 0.12)',
    color: '#378ADD',
  },
  transferred: {
    label: 'Transferred',
    bg: 'rgba(239, 159, 39, 0.12)',
    color: '#EF9F27',
  },
  withdrawn: {
    label: 'Withdrawn',
    bg: 'rgba(226, 75, 74, 0.12)',
    color: '#E24B4A',
  },
  suspended: {
    label: 'Suspended',
    bg: 'rgba(239, 159, 39, 0.12)',
    color: '#EF9F27',
  },
}

export function StudentStatusBadge({ status }: StudentStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.inactive

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 text-[11px] font-medium"
      style={{
        borderRadius: 10,
        background: config.bg,
        color: config.color,
      }}
    >
      {config.label}
    </span>
  )
}
