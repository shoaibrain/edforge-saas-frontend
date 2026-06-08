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
    bgColor: 'bg-[rgb(var(--state-success-bg)/0.18)]',
    textColor: 'text-[rgb(var(--state-success-fg))]',
  },
  on_leave: {
    bgColor: 'bg-[rgb(var(--state-warning-bg)/0.18)]',
    textColor: 'text-[rgb(var(--state-warning-fg))]',
  },
  suspended: {
    bgColor: 'bg-[rgb(var(--state-warning-bg)/0.18)]',
    textColor: 'text-[rgb(var(--state-warning-fg))]',
  },
  terminated: {
    bgColor: 'bg-[rgb(var(--state-danger-bg)/0.18)]',
    textColor: 'text-[rgb(var(--state-danger-fg))]',
  },
  retired: {
    bgColor: 'bg-[rgb(var(--background-tertiary))]',
    textColor: 'text-[rgb(var(--text-tertiary))]',
  },
  resigned: {
    bgColor: 'bg-[rgb(var(--background-tertiary))]',
    textColor: 'text-[rgb(var(--text-tertiary))]',
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
