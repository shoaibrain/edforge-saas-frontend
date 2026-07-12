/**
 * Pure RBAC nav filtering — the single filter path behind the desktop
 * sidebar, the phone tab bar, the L2 pill row, and the nav drawer
 * (hooks/useSecureNavItems.ts wraps these with store subscriptions).
 *
 * Deliberately dependency-light (abac + types + registry only) so unit tests
 * can run the real can() matrix without pulling in store side effects.
 */

import { can } from '@edforge/abac'
import type { UserIdentity } from '@edforge/types'
import type { NavItem, NavItemGroup } from '../config/sidebar-modules'

export function isNavItemVisible(
  item: NavItem,
  user: UserIdentity,
  activeSchoolId: string | null
): boolean {
  // Check ABAC permission
  if (item.permission) {
    const hasPermission = can(user, {
      action: item.permission.action,
      resource: item.permission.resource,
      schoolId: activeSchoolId ?? undefined,
    })
    if (!hasPermission) return false
  }

  // Check tenant role visibility
  if (item.tenantRoles && item.tenantRoles.length > 0) {
    if (!item.tenantRoles.includes(user.globalRole)) {
      return false
    }
  }

  // Check school context requirement
  if (item.requiresActiveSchool && !activeSchoolId) {
    return false
  }

  return true
}

/**
 * Pure filter for a flat item list. Returns only items the user may see.
 */
export function filterNavItems(
  items: NavItem[],
  user: UserIdentity | null,
  activeSchoolId: string | null
): NavItem[] {
  if (!user) return []
  return items.filter((item) => isNavItemVisible(item, user, activeSchoolId))
}

/**
 * Pure filter for a group structure. Removes empty groups.
 */
export function filterNavGroups(
  groups: NavItemGroup[],
  user: UserIdentity | null,
  activeSchoolId: string | null
): NavItemGroup[] {
  if (!user) return []
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => isNavItemVisible(item, user, activeSchoolId)),
    }))
    .filter((group) => group.items.length > 0)
}
