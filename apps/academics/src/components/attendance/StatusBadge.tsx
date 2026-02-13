/**
 * StatusBadge Component
 *
 * Reusable color-coded badge for attendance status display.
 */

import type { AttendanceStatus } from '../../services/academics.service'

interface StatusBadgeProps {
  status: AttendanceStatus
  variant?: 'full' | 'compact'
}

const statusConfig: Record<
  AttendanceStatus,
  { label: string; shortLabel: string; bg: string; text: string; dot: string }
> = {
  present: {
    label: 'Present',
    shortLabel: 'P',
    bg: 'bg-emerald-100 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  absent: {
    label: 'Absent',
    shortLabel: 'A',
    bg: 'bg-red-100 dark:bg-red-500/20',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
  },
  late: {
    label: 'Late',
    shortLabel: 'L',
    bg: 'bg-amber-100 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  excused: {
    label: 'Excused',
    shortLabel: 'E',
    bg: 'bg-blue-100 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  half_day: {
    label: 'Half Day',
    shortLabel: 'H',
    bg: 'bg-purple-100 dark:bg-purple-500/20',
    text: 'text-purple-700 dark:text-purple-400',
    dot: 'bg-purple-500',
  },
  early_departure: {
    label: 'Early Dep.',
    shortLabel: 'ED',
    bg: 'bg-orange-100 dark:bg-orange-500/20',
    text: 'text-orange-700 dark:text-orange-400',
    dot: 'bg-orange-500',
  },
  remote: {
    label: 'Remote',
    shortLabel: 'R',
    bg: 'bg-indigo-100 dark:bg-indigo-500/20',
    text: 'text-indigo-700 dark:text-indigo-400',
    dot: 'bg-indigo-500',
  },
}

export function StatusBadge({ status, variant = 'full' }: StatusBadgeProps) {
  const config = statusConfig[status]
  if (!config) return null

  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${config.bg} ${config.text}`}
        title={config.label}
      >
        {config.shortLabel}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

export { statusConfig }
