/**
 * StaffStatusBadge Component
 *
 * Displays employment status using the shared StatusBadge primitive.
 * Uses i18n for status labels via the 'people' namespace.
 */

import type { EmploymentStatus } from '@aibrains/shared-types'
import { useTranslation } from '@edforge/i18n'
import { StatusBadge, type StatusTone } from '@edforge/ui'

// Map snake_case EmploymentStatus to camelCase i18n keys
const STATUS_I18N_KEY: Record<string, string> = {
  on_leave: 'onLeave',
}

/** Get the i18n key for a status (handles snake_case → camelCase mapping) */
export function getStatusI18nKey(status: string): string {
  return STATUS_I18N_KEY[status] || status
}

const STATUS_TONE: Record<EmploymentStatus, StatusTone> = {
  active: 'success',
  on_leave: 'warning',
  suspended: 'warning',
  terminated: 'danger',
  retired: 'neutral',
  resigned: 'neutral',
}

export function StaffStatusBadge({ status }: { status: EmploymentStatus }) {
  const { t } = useTranslation('people')
  const tone = STATUS_TONE[status] ?? 'success'
  const label = t(`employmentStatus.${getStatusI18nKey(status)}`, { defaultValue: status })

  return <StatusBadge tone={tone}>{label}</StatusBadge>
}
