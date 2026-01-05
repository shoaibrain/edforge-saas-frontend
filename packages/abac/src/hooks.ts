/**
 * ABAC React Hooks
 *
 * React hooks for permission checking in EdForge components.
 * These hooks require an ABAC context to be provided by the Shell application.
 */

import { createContext, useContext, useMemo } from 'react'
import type { UserIdentity } from '@edforge/types'
import {
  can,
  canAccess,
  getPermissions,
  getSchoolsWithPermission,
  canAccessEntity,
  canCommunicateWith,
  type EntityContext,
} from './engine'
import type { Action, Resource } from './permissions'

// ============================================================================
// ABAC CONTEXT
// ============================================================================

export interface ABACContextValue {
  user: UserIdentity | null
  activeSchoolId: string | null
}

export const ABACContext = createContext<ABACContextValue | null>(null)

function useABACContext(): ABACContextValue {
  const context = useContext(ABACContext)
  if (!context) {
    throw new Error('useABACContext must be used within an ABACProvider')
  }
  return context
}

// ============================================================================
// PERMISSION HOOKS
// ============================================================================

/**
 * Hook to check if current user has permission for an action on a resource.
 * Uses the active school context from ABAC provider.
 */
export function usePermission(
  action: Action,
  resource: Resource,
  schoolIdOverride?: string
): boolean {
  const { user, activeSchoolId } = useABACContext()
  const schoolId = schoolIdOverride ?? activeSchoolId ?? undefined

  return useMemo(
    () => can(user, { action, resource, schoolId }),
    [user, action, resource, schoolId]
  )
}

/**
 * Hook to check if current user can access a resource (view action)
 */
export function useCanAccess(
  resource: Resource,
  schoolIdOverride?: string
): boolean {
  return usePermission('view', resource, schoolIdOverride)
}

/**
 * Hook that returns all permissions for a resource
 */
export function useResourcePermissions(
  resource: Resource,
  schoolIdOverride?: string
): Record<Action, boolean> {
  const { user, activeSchoolId } = useABACContext()
  const schoolId = schoolIdOverride ?? activeSchoolId ?? undefined

  return useMemo(() => {
    const actions: Action[] = [
      'view',
      'create',
      'edit',
      'delete',
      'manage',
      'approve',
      'send',
      'export',
    ]

    return actions.reduce(
      (acc, action) => {
        acc[action] = can(user, { action, resource, schoolId })
        return acc
      },
      {} as Record<Action, boolean>
    )
  }, [user, resource, schoolId])
}

/**
 * Hook for object-level permission check
 */
export function useCanAccessEntity(
  action: Action,
  entity: EntityContext | null
): boolean {
  const { user } = useABACContext()

  return useMemo(() => {
    if (!entity) return false
    return canAccessEntity(user, action, entity)
  }, [user, action, entity])
}

/**
 * Hook to check communication permissions
 */
export function useCanCommunicateWith(
  audience: 'all' | 'parents' | 'teachers' | 'students' | 'staff'
): boolean {
  const { user, activeSchoolId } = useABACContext()

  return useMemo(
    () => canCommunicateWith(user, audience, activeSchoolId ?? undefined),
    [user, audience, activeSchoolId]
  )
}

/**
 * Hook to get schools where user has permission
 */
export function useSchoolsWithPermission(
  action: Action,
  resource: Resource
): string[] {
  const { user } = useABACContext()

  return useMemo(
    () => getSchoolsWithPermission(user, action, resource),
    [user, action, resource]
  )
}

/**
 * Hook to get all permissions the user has for a resource
 */
export function useAllPermissions(
  resource: Resource,
  schoolIdOverride?: string
): Action[] {
  const { user, activeSchoolId } = useABACContext()
  const schoolId = schoolIdOverride ?? activeSchoolId ?? undefined

  return useMemo(
    () => getPermissions(user, resource, schoolId),
    [user, resource, schoolId]
  )
}

// ============================================================================
// IMPERATIVE ACCESS (for non-React contexts)
// ============================================================================

/**
 * Re-export imperative functions for use outside React
 */
export { can, canAccess, getPermissions, getSchoolsWithPermission, canAccessEntity, canCommunicateWith }

