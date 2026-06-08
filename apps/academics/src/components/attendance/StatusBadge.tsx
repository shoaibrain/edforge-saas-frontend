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
    bg: 'bg-[rgb(var(--state-success-bg)/0.18)]',
    text: 'text-[rgb(var(--state-success-fg))]',
    dot: 'bg-[rgb(var(--state-success-fg))]',
  },
  absent: {
    label: 'Absent',
    shortLabel: 'A',
    bg: 'bg-[rgb(var(--state-danger-bg)/0.18)]',
    text: 'text-[rgb(var(--state-danger-fg))]',
    dot: 'bg-[rgb(var(--state-danger-fg))]',
  },
  late: {
    label: 'Late',
    shortLabel: 'L',
    bg: 'bg-[rgb(var(--state-warning-bg)/0.18)]',
    text: 'text-[rgb(var(--state-warning-fg))]',
    dot: 'bg-[rgb(var(--state-warning-fg))]',
  },
  excused: {
    label: 'Excused',
    shortLabel: 'E',
    bg: 'bg-[rgb(var(--state-info-bg)/0.18)]',
    text: 'text-[rgb(var(--state-info-fg))]',
    dot: 'bg-[rgb(var(--state-info-fg))]',
  },
  half_day: {
    label: 'Half Day',
    shortLabel: 'H',
    bg: 'bg-[rgb(var(--state-info-bg)/0.18)]',
    text: 'text-[rgb(var(--state-info-fg))]',
    dot: 'bg-[rgb(var(--state-info-fg))]',
  },
  early_departure: {
    label: 'Early Dep.',
    shortLabel: 'ED',
    bg: 'bg-[rgb(var(--state-warning-bg)/0.18)]',
    text: 'text-[rgb(var(--state-warning-fg))]',
    dot: 'bg-[rgb(var(--state-warning-fg))]',
  },
  remote: {
    label: 'Remote',
    shortLabel: 'R',
    bg: 'bg-[rgb(var(--state-info-bg)/0.18)]',
    text: 'text-[rgb(var(--state-info-fg))]',
    dot: 'bg-[rgb(var(--state-info-fg))]',
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
