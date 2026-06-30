/**
 * StudentStatusBadge Component — V2
 *
 * Displays student enrollment status as a V2-styled pill badge
 * with semantic colors using inline styles for theme compatibility.
 */

import type { StudentStatus } from '@aibrains/shared-types'
import { useAcademicsI18n } from '../../lib/i18n'

interface StudentStatusBadgeProps {
  status: StudentStatus
}

const statusConfig: Record<
  StudentStatus,
  { labelKey: string; bg: string; color: string }
> = {
  active: {
    labelKey: 'status.active',
    bg: 'rgb(var(--accent-enrollment)/0.12)',
    color: 'rgb(var(--accent-enrollment))',
  },
  inactive: {
    labelKey: 'status.inactive',
    bg: 'rgb(var(--text-tertiary)/0.12)',
    color: 'rgb(var(--text-tertiary))',
  },
  pending: {
    labelKey: 'status.pending',
    bg: 'rgb(var(--accent-attendance)/0.12)',
    color: 'rgb(var(--accent-attendance))',
  },
  graduated: {
    labelKey: 'status.graduated',
    bg: 'rgb(var(--accent-academics)/0.12)',
    color: 'rgb(var(--accent-academics))',
  },
  transferred: {
    labelKey: 'status.transferred',
    bg: 'rgb(var(--accent-attendance)/0.12)',
    color: 'rgb(var(--accent-attendance))',
  },
  withdrawn: {
    labelKey: 'status.withdrawn',
    bg: 'rgb(var(--accent-finance)/0.12)',
    color: 'rgb(var(--accent-finance))',
  },
  suspended: {
    labelKey: 'status.suspended',
    bg: 'rgb(var(--accent-attendance)/0.12)',
    color: 'rgb(var(--accent-attendance))',
  },
}

export function StudentStatusBadge({ status }: StudentStatusBadgeProps) {
  const { t } = useAcademicsI18n()
  const config = statusConfig[status] || statusConfig.inactive

  return (
    <span
      // allow-presentation-style: per-status badge bg/text from the status config map
      className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-[10px]"
      style={{ background: config.bg, color: config.color }}
    >
      {t(config.labelKey)}
    </span>
  )
}
