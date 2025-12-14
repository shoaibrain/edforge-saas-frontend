/**
 * Secure Navigation Items Hook
 * 
 * Filters navigation items based on ABAC permissions, tenant roles,
 * and school context requirements.
 */

import { useMemo } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { can } from '@/lib/abac'
import type { NavItem, NavItemGroup } from '@/config/sidebar-modules'

/**
 * Hook to filter navigation items based on user permissions.
 * Returns only items the current user is allowed to see.
 */
export function useSecureNavItems(items: NavItem[]): NavItem[] {
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)

  return useMemo(() => {
    if (!user) return []

    return items.filter((item) => {
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
    })
  }, [items, user, activeSchoolId])
}

/**
 * Hook to filter an entire group structure, removing empty groups
 */
export function useSecureNavGroups(groups: NavItemGroup[]): NavItemGroup[] {
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)

  return useMemo(() => {
    if (!user) return []

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
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
        }),
      }))
      .filter((group) => group.items.length > 0) // Remove empty groups
  }, [groups, user, activeSchoolId])
}

/**
 * Hook to check if a single nav item should be visible
 */
export function useCanSeeNavItem(item: NavItem): boolean {
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)

  return useMemo(() => {
    if (!user) return false

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
  }, [item, user, activeSchoolId])
}

