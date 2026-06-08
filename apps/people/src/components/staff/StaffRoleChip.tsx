/**
 * StaffRoleChip — role chip
 *
 * Displays a staff role using the shared StatusBadge primitive. Leadership
 * roles (principal / vice-principal) read as `info`; everyone else is neutral.
 * (The earlier per-role hex palette is intentionally retired — a documented
 * education category palette is a later design-system follow-up.)
 */

import type { StaffRole } from '@aibrains/shared-types'
import { useTranslation } from '@edforge/i18n'
import { StatusBadge } from '@edforge/ui'
import { getRoleI18nKey } from './StaffRoleBadge'

const LEADERSHIP_ROLES: Set<StaffRole> = new Set(['principal', 'vice_principal'])

export function StaffRoleChip({ role }: { role: StaffRole }) {
  const { t } = useTranslation('people')
  const label = t(`roles.${getRoleI18nKey(role)}`, { defaultValue: role })

  return (
    <StatusBadge tone={LEADERSHIP_ROLES.has(role) ? 'info' : 'neutral'}>{label}</StatusBadge>
  )
}
