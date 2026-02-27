/**
 * StaffRoleBadge Component
 *
 * Displays staff role with color coding.
 * Leadership roles (principal, vice_principal) are highlighted.
 * Uses i18n for role labels via the 'people' namespace.
 */

import type { StaffRole } from '@aibrains/shared-types'
import { useTranslation } from '@edforge/i18n'

// Map snake_case StaffRole values to camelCase i18n keys
const ROLE_I18N_KEY: Record<string, string> = {
  vice_principal: 'vicePrincipal',
  admin_staff: 'adminStaff',
  support_staff: 'supportStaff',
  it_staff: 'itStaff',
}

/** Get the i18n key for a role (handles snake_case → camelCase mapping) */
export function getRoleI18nKey(role: string): string {
  return ROLE_I18N_KEY[role] || role
}

const LEADERSHIP_ROLES: Set<StaffRole> = new Set(['principal', 'vice_principal'])

export function StaffRoleBadge({ role }: { role: StaffRole }) {
  const { t } = useTranslation('people')
  const label = t(`roles.${getRoleI18nKey(role)}`, { defaultValue: role })
  const isLeadership = LEADERSHIP_ROLES.has(role)
  const style = isLeadership
    ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300'
    : 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300'

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  )
}

/** Get the human-readable label for a staff role (hook-free, for use outside React components) */
export function getRoleLabel(role: StaffRole): string {
  // Static fallback for non-component contexts; components should use t() directly
  const ROLE_LABELS: Record<StaffRole, string> = {
    teacher: 'Teacher',
    principal: 'Principal',
    vice_principal: 'Vice Principal',
    counselor: 'Counselor',
    librarian: 'Librarian',
    nurse: 'Nurse',
    admin_staff: 'Admin Staff',
    support_staff: 'Support Staff',
    it_staff: 'IT Staff',
    substitute: 'Substitute',
    contractor: 'Contractor',
  }
  return ROLE_LABELS[role] || role
}
