/**
 * StaffRoleBadge Component
 *
 * Displays staff role with color coding.
 * Leadership roles (principal, vice_principal) are highlighted.
 */

import type { StaffRole } from '@aibrains/shared-types'

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

const LEADERSHIP_ROLES: Set<StaffRole> = new Set(['principal', 'vice_principal'])

export function StaffRoleBadge({ role }: { role: StaffRole }) {
  const label = ROLE_LABELS[role] || role
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

/** Get the human-readable label for a staff role */
export function getRoleLabel(role: StaffRole): string {
  return ROLE_LABELS[role] || role
}
