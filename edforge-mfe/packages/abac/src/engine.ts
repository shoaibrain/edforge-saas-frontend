/**
 * ABAC Engine
 *
 * Core permission checking functions for the EdForge EMIS platform.
 */

import type { UserIdentity } from '@edforge/types'
import { ROLE_PERMISSIONS, type Action, type Resource } from './permissions'

// ============================================================================
// PERMISSION CONTEXT
// ============================================================================

export interface PermissionContext {
  action: Action
  resource: Resource
  schoolId?: string
}

// ============================================================================
// CORE PERMISSION CHECK
// ============================================================================

/**
 * Core permission check function.
 * Returns true if the user can perform the action on the resource.
 */
export function can(
  user: UserIdentity | null,
  context: PermissionContext
): boolean {
  if (!user) return false

  const { action, resource, schoolId } = context

  // TenantAdmin has full access to everything
  if (user.globalRole === 'TenantAdmin') {
    return true
  }

  // For StandardUsers, we need a school context
  const targetSchoolId = schoolId
  if (!targetSchoolId) {
    // No school context - can only check if user has ANY school with permission
    return Object.entries(user.assignments).some(([, role]) => {
      const permissions = ROLE_PERMISSIONS[role]?.[resource] ?? []
      return permissions.includes(action)
    })
  }

  // Get user's role in the target school
  const role = user.assignments[targetSchoolId]
  if (!role) return false

  // Check if the role has the required permission
  const permissions = ROLE_PERMISSIONS[role]?.[resource] ?? []
  return permissions.includes(action)
}

/**
 * Check if user can access a resource (any action)
 */
export function canAccess(
  user: UserIdentity | null,
  resource: Resource,
  schoolId?: string
): boolean {
  return can(user, { action: 'view', resource, schoolId })
}

/**
 * Get all permissions a user has for a specific resource
 */
export function getPermissions(
  user: UserIdentity | null,
  resource: Resource,
  schoolId?: string
): Action[] {
  if (!user) return []

  if (user.globalRole === 'TenantAdmin') {
    // TenantAdmin has all actions
    return ['view', 'create', 'edit', 'delete', 'manage', 'approve', 'send', 'export']
  }

  const targetSchoolId = schoolId
  if (!targetSchoolId) {
    // Aggregate permissions across all schools
    const allPermissions = new Set<Action>()
    Object.values(user.assignments).forEach((role) => {
      const permissions = ROLE_PERMISSIONS[role]?.[resource] ?? []
      permissions.forEach((p) => allPermissions.add(p))
    })
    return Array.from(allPermissions)
  }

  const role = user.assignments[targetSchoolId]
  if (!role) return []

  return ROLE_PERMISSIONS[role]?.[resource] ?? []
}

/**
 * Get all schools where user has a specific permission
 */
export function getSchoolsWithPermission(
  user: UserIdentity | null,
  action: Action,
  resource: Resource
): string[] {
  if (!user) return []

  if (user.globalRole === 'TenantAdmin') {
    // Return all assigned schools for TenantAdmin
    return Object.keys(user.assignments)
  }

  return Object.entries(user.assignments)
    .filter(([, role]) => {
      const permissions = ROLE_PERMISSIONS[role]?.[resource] ?? []
      return permissions.includes(action)
    })
    .map(([schoolId]) => schoolId)
}

// ============================================================================
// OBJECT-LEVEL PERMISSION CHECKS
// ============================================================================

/**
 * Entity metadata for object-level permission checks
 */
export interface EntityContext {
  entityId: string
  entityType: 'student' | 'teacher' | 'staff' | 'parent' | 'classroom' | 'class'
  ownerSchoolId: string
  /** For students/classes assigned to specific teachers */
  assignedTeacherId?: string
  /** For students with specific guardian relationships */
  guardianIds?: string[]
}

/**
 * Check if user can access a specific entity.
 * This enables row-level security by verifying:
 * 1. User has general resource permission
 * 2. User belongs to the entity's school
 * 3. For teachers: entity is in their assigned classes (optional)
 */
export function canAccessEntity(
  user: UserIdentity | null,
  action: Action,
  entity: EntityContext
): boolean {
  if (!user) return false

  // TenantAdmin has full access
  if (user.globalRole === 'TenantAdmin') return true

  // Map entity type to resource
  const resourceMap: Record<EntityContext['entityType'], Resource> = {
    student: 'students',
    teacher: 'teachers',
    staff: 'staff',
    parent: 'parents',
    classroom: 'classrooms',
    class: 'classes',
  }

  const resource = resourceMap[entity.entityType]

  // Check basic permission for the resource in entity's school
  if (!can(user, { action, resource, schoolId: entity.ownerSchoolId })) {
    return false
  }

  // Get user's role in the entity's school
  const userRole = user.assignments[entity.ownerSchoolId]
  if (!userRole) return false

  // Teachers have restricted access to only their assigned students/classes
  if (userRole === 'Teacher' && entity.assignedTeacherId) {
    // For view action, teachers can see all students in their school
    if (action === 'view') return true
    // For edit actions, they need to be assigned
    return entity.assignedTeacherId === user.id
  }

  return true
}

/**
 * Check if user can send communications to specific audiences
 */
export function canCommunicateWith(
  user: UserIdentity | null,
  audience: 'all' | 'parents' | 'teachers' | 'students' | 'staff',
  schoolId?: string
): boolean {
  if (!user) return false
  if (user.globalRole === 'TenantAdmin') return true

  const targetSchoolId = schoolId
  if (!targetSchoolId) return false

  const role = user.assignments[targetSchoolId]
  if (!role) return false

  // Only Principal can send to all
  if (audience === 'all') {
    return role === 'Principal'
  }

  // Principal can communicate with all groups
  if (role === 'Principal') return true

  // Teachers and Accountants can communicate with parents
  if (audience === 'parents') {
    return role === 'Teacher' || role === 'Accountant'
  }

  // Teachers can communicate with students
  if (role === 'Teacher' && audience === 'students') return true

  return false
}

