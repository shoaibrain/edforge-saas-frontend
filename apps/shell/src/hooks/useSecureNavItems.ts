/**
 * Secure Navigation Items Hook
 *
 * Filters navigation items based on ABAC permissions, tenant roles,
 * and school context requirements.
 *
 * The filter itself is pure (lib/nav-filter.ts) so non-hook callers — the
 * mobile tab derivation, the nav drawer's module map, unit tests — run the
 * exact same RBAC path as the rendered sidebar.
 */

import { useMemo } from 'react'
import { useAuthStore } from '../stores/auth.store'
import { useAppStore } from '../stores/app.store'
import {
  filterNavItems,
  filterNavGroups,
  isNavItemVisible,
} from '../lib/nav-filter'
import type { NavItem, NavItemGroup } from '../config/sidebar-modules'

export { filterNavItems, filterNavGroups, isNavItemVisible }

/**
 * Hook to filter navigation items based on user permissions.
 * Returns only items the current user is allowed to see.
 */
export function useSecureNavItems(items: NavItem[]): NavItem[] {
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)

  return useMemo(
    () => filterNavItems(items, user, activeSchoolId),
    [items, user, activeSchoolId]
  )
}

/**
 * Hook to filter an entire group structure, removing empty groups
 */
export function useSecureNavGroups(groups: NavItemGroup[]): NavItemGroup[] {
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)

  return useMemo(
    () => filterNavGroups(groups, user, activeSchoolId),
    [groups, user, activeSchoolId]
  )
}

/**
 * Hook to check if a single nav item should be visible
 */
export function useCanSeeNavItem(item: NavItem): boolean {
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)

  return useMemo(
    () => (user ? isNavItemVisible(item, user, activeSchoolId) : false),
    [item, user, activeSchoolId]
  )
}
