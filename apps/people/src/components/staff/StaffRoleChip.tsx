/**
 * StaffRoleChip — V2 Role Chip
 *
 * Displays staff role with V2 color-coded chip styling.
 * Role color mappings match the People module V2 prototype.
 */

import type { StaffRole } from '@aibrains/shared-types'
import { useTranslation } from '@edforge/i18n'
import { getRoleI18nKey } from './StaffRoleBadge'

const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
  teacher: { bg: 'rgba(29,158,117,0.10)', color: '#1D9E75' },
  principal: { bg: 'rgba(127,119,221,0.10)', color: '#7F77DD' },
  vice_principal: { bg: 'rgba(127,119,221,0.10)', color: '#7F77DD' },
  admin_staff: { bg: 'rgba(55,138,221,0.10)', color: '#378ADD' },
  support_staff: { bg: 'rgba(216,90,48,0.10)', color: '#D85A30' },
}

const DEFAULT_STYLE = { bg: 'rgba(255,255,255,0.06)', color: 'var(--v2-text-hint, #7a8099)' }

export function StaffRoleChip({ role }: { role: StaffRole }) {
  const { t } = useTranslation('people')
  const label = t(`roles.${getRoleI18nKey(role)}`, { defaultValue: role })
  const style = ROLE_STYLES[role] || DEFAULT_STYLE

  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 500,
        padding: '2px 8px',
        borderRadius: 7,
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        background: style.bg,
        color: style.color,
      }}
    >
      {label}
    </span>
  )
}
