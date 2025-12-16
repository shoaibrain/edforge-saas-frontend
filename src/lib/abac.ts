/**
 * ABAC (Attribute-Based Access Control) Engine
 * Determines what actions a user can perform based on their role in a school context.
 */

import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import type { UserIdentity, SchoolRole } from '@/types/auth'

// ============================================================================
// ACTION & RESOURCE DEFINITIONS
// ============================================================================

export type Action =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'manage'
  | 'approve'

export type Resource =
  // Dashboard
  | 'dashboard'
  // Academics
  | 'students'
  | 'teachers'
  | 'grades'
  | 'gradelevels'
  | 'curriculum'
  | 'classes'
  | 'classrooms'
  | 'calendar'
  | 'attendance'
  | 'enrollment'
  // People
  | 'guardians'
  | 'parents'
  | 'departments'
  // Finance
  | 'billing'
  | 'payroll'
  | 'expenses'
  | 'tuition'
  | 'reports:finance'
  // Staff
  | 'staff'
  | 'staff:assignments'
  // Settings
  | 'settings'
  | 'settings:school'
  | 'settings:tenant'

// ============================================================================
// ROLE → PERMISSION MAPPING
// ============================================================================

type PermissionMap = Record<SchoolRole, Record<Resource, Action[]>>

/**
 * Defines what actions each role can perform on each resource.
 * TenantAdmin gets all permissions via globalRole check.
 */
const ROLE_PERMISSIONS: PermissionMap = {
  Principal: {
    dashboard: ['view'],
    students: ['view', 'create', 'edit', 'delete', 'manage'],
    teachers: ['view', 'create', 'edit', 'delete', 'manage'],
    grades: ['view', 'create', 'edit', 'approve'],
    gradelevels: ['view', 'create', 'edit', 'delete', 'manage'],
    curriculum: ['view', 'create', 'edit', 'manage'],
    classes: ['view', 'create', 'edit', 'delete', 'manage'],
    classrooms: ['view', 'create', 'edit', 'delete', 'manage'],
    calendar: ['view', 'create', 'edit', 'manage'],
    attendance: ['view', 'create', 'edit', 'manage'],
    enrollment: ['view', 'create', 'edit', 'delete', 'manage', 'approve'],
    guardians: ['view', 'create', 'edit', 'delete', 'manage'],
    parents: ['view', 'create', 'edit', 'delete', 'manage'],
    departments: ['view', 'create', 'edit', 'delete', 'manage'],
    billing: ['view', 'approve'],
    payroll: ['view', 'approve'],
    expenses: ['view', 'create', 'approve'],
    tuition: ['view', 'create', 'edit', 'manage'],
    'reports:finance': ['view'],
    staff: ['view', 'create', 'edit', 'manage'],
    'staff:assignments': ['view', 'create', 'edit', 'delete'],
    settings: ['view', 'edit'],
    'settings:school': ['view', 'edit', 'manage'],
    'settings:tenant': ['view'],
  },
  Teacher: {
    dashboard: ['view'],
    students: ['view'],
    teachers: ['view'],
    grades: ['view', 'create', 'edit'],
    gradelevels: ['view'],
    curriculum: ['view'],
    classes: ['view'],
    classrooms: ['view'],
    calendar: ['view'],
    attendance: ['view', 'create', 'edit'],
    enrollment: ['view'],
    guardians: ['view'],
    parents: ['view'],
    departments: ['view'],
    billing: [],
    payroll: [],
    expenses: [],
    tuition: [],
    'reports:finance': [],
    staff: ['view'],
    'staff:assignments': [],
    settings: ['view'],
    'settings:school': [],
    'settings:tenant': [],
  },
  Accountant: {
    dashboard: ['view'],
    students: ['view'],
    teachers: ['view'],
    grades: [],
    gradelevels: [],
    curriculum: [],
    classes: [],
    classrooms: [],
    calendar: ['view'],
    attendance: [],
    enrollment: ['view'],
    guardians: ['view'],
    parents: ['view'],
    departments: ['view'],
    billing: ['view', 'create', 'edit', 'manage'],
    payroll: ['view', 'create', 'edit', 'manage'],
    expenses: ['view', 'create', 'edit', 'approve'],
    tuition: ['view', 'create', 'edit', 'manage'],
    'reports:finance': ['view', 'create'],
    staff: ['view'],
    'staff:assignments': [],
    settings: ['view'],
    'settings:school': [],
    'settings:tenant': [],
  },
  Staff: {
    dashboard: ['view'],
    students: ['view'],
    teachers: ['view'],
    grades: [],
    gradelevels: ['view'],
    curriculum: [],
    classes: ['view'],
    classrooms: ['view'],
    calendar: ['view'],
    attendance: ['view'],
    enrollment: ['view'],
    guardians: ['view'],
    parents: ['view'],
    departments: ['view'],
    billing: [],
    payroll: [],
    expenses: [],
    tuition: [],
    'reports:finance': [],
    staff: ['view'],
    'staff:assignments': [],
    settings: [],
    'settings:school': [],
    'settings:tenant': [],
  },
}

// ============================================================================
// CORE PERMISSION CHECK
// ============================================================================

export interface PermissionContext {
  action: Action
  resource: Resource
  schoolId?: string
}

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

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * Hook to check if current user has permission for an action on a resource.
 * Uses the active school context from app store.
 */
export function usePermission(
  action: Action,
  resource: Resource,
  schoolIdOverride?: string
): boolean {
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  
  const schoolId = schoolIdOverride ?? activeSchoolId ?? undefined
  
  return can(user, { action, resource, schoolId })
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
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  
  const schoolId = schoolIdOverride ?? activeSchoolId ?? undefined
  
  const actions: Action[] = ['view', 'create', 'edit', 'delete', 'manage', 'approve']
  
  return actions.reduce((acc, action) => {
    acc[action] = can(user, { action, resource, schoolId })
    return acc
  }, {} as Record<Action, boolean>)
}
