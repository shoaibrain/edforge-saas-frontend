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
    bg: 'rgb(var(--accent-enrollment)/0.12)',
    color: 'rgb(var(--accent-enrollment))',
  },
  inactive: {
    label: 'Inactive',
    bg: 'rgb(var(--text-tertiary)/0.12)',
    color: 'rgb(var(--text-tertiary))',
  },
  pending: {
    label: 'Pending',
    bg: 'rgb(var(--accent-attendance)/0.12)',
    color: 'rgb(var(--accent-attendance))',
  },
  graduated: {
    label: 'Graduated',
    bg: 'rgb(var(--accent-academics)/0.12)',
    color: 'rgb(var(--accent-academics))',
  },
  transferred: {
    label: 'Transferred',
    bg: 'rgb(var(--accent-attendance)/0.12)',
    color: 'rgb(var(--accent-attendance))',
  },
  withdrawn: {
    label: 'Withdrawn',
    bg: 'rgb(var(--accent-finance)/0.12)',
    color: 'rgb(var(--accent-finance))',
  },
  suspended: {
    label: 'Suspended',
    bg: 'rgb(var(--accent-attendance)/0.12)',
    color: 'rgb(var(--accent-attendance))',
  },
}

export function StudentStatusBadge({ status }: StudentStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.inactive

  return (
    <span
      // allow-presentation-style: per-status badge bg/text from the status config map
      className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-[10px]"
      style={{ background: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  )
}
