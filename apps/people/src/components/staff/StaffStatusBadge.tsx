/**
 * StaffStatusBadge Component
 *
 * Displays employment status with appropriate color coding.
 * Follows the StudentStatusBadge pattern from the academics app.
 */

import type { EmploymentStatus } from '@aibrains/shared-types'

const statusConfig: Record<
  EmploymentStatus,
  { label: string; bgColor: string; textColor: string }
> = {
  active: {
    label: 'Active',
    bgColor: 'bg-emerald-100 dark:bg-emerald-500/20',
    textColor: 'text-emerald-700 dark:text-emerald-400',
  },
  on_leave: {
    label: 'On Leave',
    bgColor: 'bg-yellow-100 dark:bg-yellow-500/20',
    textColor: 'text-yellow-700 dark:text-yellow-400',
  },
  suspended: {
    label: 'Suspended',
    bgColor: 'bg-orange-100 dark:bg-orange-500/20',
    textColor: 'text-orange-700 dark:text-orange-400',
  },
  terminated: {
    label: 'Terminated',
    bgColor: 'bg-red-100 dark:bg-red-500/20',
    textColor: 'text-red-700 dark:text-red-400',
  },
  retired: {
    label: 'Retired',
    bgColor: 'bg-slate-100 dark:bg-slate-500/20',
    textColor: 'text-slate-600 dark:text-slate-400',
  },
  resigned: {
    label: 'Resigned',
    bgColor: 'bg-slate-100 dark:bg-slate-500/20',
    textColor: 'text-slate-600 dark:text-slate-400',
  },
}

export function StaffStatusBadge({ status }: { status: EmploymentStatus }) {
  const config = statusConfig[status] || statusConfig.active

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
    >
      {config.label}
    </span>
  )
}
