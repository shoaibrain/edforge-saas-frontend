/**
 * StaffStatusBadge Component
 *
 * Displays employment status with appropriate color coding.
 * Uses i18n for status labels via the 'people' namespace.
 */

import type { EmploymentStatus } from '@aibrains/shared-types'
import { useTranslation } from '@edforge/i18n'

// Map snake_case EmploymentStatus to camelCase i18n keys
const STATUS_I18N_KEY: Record<string, string> = {
  on_leave: 'onLeave',
}

/** Get the i18n key for a status (handles snake_case → camelCase mapping) */
export function getStatusI18nKey(status: string): string {
  return STATUS_I18N_KEY[status] || status
}

const statusStyles: Record<
  EmploymentStatus,
  { bgColor: string; textColor: string }
> = {
  active: {
    bgColor: 'bg-emerald-100 dark:bg-emerald-500/20',
    textColor: 'text-emerald-700 dark:text-emerald-400',
  },
  on_leave: {
    bgColor: 'bg-yellow-100 dark:bg-yellow-500/20',
    textColor: 'text-yellow-700 dark:text-yellow-400',
  },
  suspended: {
    bgColor: 'bg-orange-100 dark:bg-orange-500/20',
    textColor: 'text-orange-700 dark:text-orange-400',
  },
  terminated: {
    bgColor: 'bg-red-100 dark:bg-red-500/20',
    textColor: 'text-red-700 dark:text-red-400',
  },
  retired: {
    bgColor: 'bg-slate-100 dark:bg-slate-500/20',
    textColor: 'text-slate-600 dark:text-slate-400',
  },
  resigned: {
    bgColor: 'bg-slate-100 dark:bg-slate-500/20',
    textColor: 'text-slate-600 dark:text-slate-400',
  },
}

export function StaffStatusBadge({ status }: { status: EmploymentStatus }) {
  const { t } = useTranslation('people')
  const style = statusStyles[status] || statusStyles.active
  const label = t(`employmentStatus.${getStatusI18nKey(status)}`, { defaultValue: status })

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bgColor} ${style.textColor}`}
    >
      {label}
    </span>
  )
}
