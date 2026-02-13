/**
 * StudentStatusBadge Component
 *
 * Displays student enrollment status with appropriate color coding.
 */

import type { StudentStatus } from '@aibrains/shared-types'

interface StudentStatusBadgeProps {
  status: StudentStatus
}

const statusConfig: Record<
  StudentStatus,
  { label: string; bgColor: string; textColor: string }
> = {
  active: {
    label: 'Active',
    bgColor: 'bg-emerald-100 dark:bg-emerald-500/20',
    textColor: 'text-emerald-700 dark:text-emerald-400',
  },
  inactive: {
    label: 'Inactive',
    bgColor: 'bg-slate-100 dark:bg-slate-500/20',
    textColor: 'text-slate-600 dark:text-slate-400',
  },
  graduated: {
    label: 'Graduated',
    bgColor: 'bg-blue-100 dark:bg-blue-500/20',
    textColor: 'text-blue-700 dark:text-blue-400',
  },
  transferred: {
    label: 'Transferred',
    bgColor: 'bg-amber-100 dark:bg-amber-500/20',
    textColor: 'text-amber-700 dark:text-amber-400',
  },
  withdrawn: {
    label: 'Withdrawn',
    bgColor: 'bg-red-100 dark:bg-red-500/20',
    textColor: 'text-red-700 dark:text-red-400',
  },
  suspended: {
    label: 'Suspended',
    bgColor: 'bg-orange-100 dark:bg-orange-500/20',
    textColor: 'text-orange-700 dark:text-orange-400',
  },
}

export function StudentStatusBadge({ status }: StudentStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.inactive

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
    >
      {config.label}
    </span>
  )
}
