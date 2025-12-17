/**
 * ABAC (Attribute-Based Access Control) Engine
 * Determines what actions a user can perform based on their role in a school context.
 * 
 * Features:
 * - Role-based permission mapping per school
 * - Object-level permission checks for entity access
 * - React hooks for UI permission gating
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
  | 'send'       // For communications
  | 'export'     // For reports

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
  | 'assessments'
  | 'gradebook'
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
  // Communications
  | 'communications'
  | 'announcements'
  | 'messages'
  | 'notifications'
  // Analytics
  | 'analytics'
  | 'analytics:academic'
  | 'analytics:financial'
  | 'analytics:attendance'
  // Student Portal - resources for student self-service
  | 'student-portal'
  | 'student-portal:grades'
  | 'student-portal:attendance'
  | 'student-portal:schedule'
  | 'student-portal:assignments'
  // Parent Portal - resources for parent access to children's data
  | 'parent-portal'
  | 'parent-portal:grades'
  | 'parent-portal:attendance'
  | 'parent-portal:fees'
  | 'parent-portal:schedule'
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
    assessments: ['view', 'create', 'edit', 'delete', 'manage'],
    gradebook: ['view', 'create', 'edit', 'manage', 'approve'],
    guardians: ['view', 'create', 'edit', 'delete', 'manage'],
    parents: ['view', 'create', 'edit', 'delete', 'manage'],
    departments: ['view', 'create', 'edit', 'delete', 'manage'],
    billing: ['view', 'approve'],
    payroll: ['view', 'approve'],
    expenses: ['view', 'create', 'approve'],
    tuition: ['view', 'create', 'edit', 'manage'],
    'reports:finance': ['view', 'export'],
    staff: ['view', 'create', 'edit', 'manage'],
    'staff:assignments': ['view', 'create', 'edit', 'delete'],
    // Communications
    communications: ['view', 'create', 'edit', 'delete', 'manage'],
    announcements: ['view', 'create', 'edit', 'delete', 'send', 'approve'],
    messages: ['view', 'create', 'send'],
    notifications: ['view', 'create', 'manage'],
    // Analytics
    analytics: ['view', 'export'],
    'analytics:academic': ['view', 'export'],
    'analytics:financial': ['view', 'export'],
    'analytics:attendance': ['view', 'export'],
    // Student Portal - Principals can manage student portal
    'student-portal': ['view', 'manage'],
    'student-portal:grades': ['view', 'manage'],
    'student-portal:attendance': ['view', 'manage'],
    'student-portal:schedule': ['view', 'manage'],
    'student-portal:assignments': ['view', 'manage'],
    // Parent Portal
    'parent-portal': ['view', 'manage'],
    'parent-portal:grades': ['view'],
    'parent-portal:attendance': ['view'],
    'parent-portal:fees': ['view'],
    'parent-portal:schedule': ['view'],
    // Settings
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
    assessments: ['view', 'create', 'edit'],
    gradebook: ['view', 'create', 'edit'],
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
    // Communications
    communications: ['view'],
    announcements: ['view'],
    messages: ['view', 'create', 'send'],
    notifications: ['view'],
    // Analytics
    analytics: ['view'],
    'analytics:academic': ['view'],
    'analytics:financial': [],
    'analytics:attendance': ['view'],
    // Student Portal - Teachers can view student data
    'student-portal': ['view'],
    'student-portal:grades': ['view'],
    'student-portal:attendance': ['view'],
    'student-portal:schedule': ['view'],
    'student-portal:assignments': ['view'],
    // Parent Portal
    'parent-portal': [],
    'parent-portal:grades': [],
    'parent-portal:attendance': [],
    'parent-portal:fees': [],
    'parent-portal:schedule': [],
    // Settings
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
    assessments: [],
    gradebook: [],
    guardians: ['view'],
    parents: ['view'],
    departments: ['view'],
    billing: ['view', 'create', 'edit', 'manage'],
    payroll: ['view', 'create', 'edit', 'manage'],
    expenses: ['view', 'create', 'edit', 'approve'],
    tuition: ['view', 'create', 'edit', 'manage'],
    'reports:finance': ['view', 'create', 'export'],
    staff: ['view'],
    'staff:assignments': [],
    // Communications
    communications: ['view'],
    announcements: ['view'],
    messages: ['view', 'create', 'send'],
    notifications: ['view'],
    // Analytics
    analytics: ['view'],
    'analytics:academic': [],
    'analytics:financial': ['view', 'export'],
    'analytics:attendance': [],
    // Student Portal - No access
    'student-portal': [],
    'student-portal:grades': [],
    'student-portal:attendance': [],
    'student-portal:schedule': [],
    'student-portal:assignments': [],
    // Parent Portal - Fee management only
    'parent-portal': [],
    'parent-portal:grades': [],
    'parent-portal:attendance': [],
    'parent-portal:fees': ['view', 'manage'],
    'parent-portal:schedule': [],
    // Settings
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
    assessments: [],
    gradebook: [],
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
    // Communications
    communications: ['view'],
    announcements: ['view'],
    messages: ['view', 'create', 'send'],
    notifications: ['view'],
    // Analytics
    analytics: [],
    'analytics:academic': [],
    'analytics:financial': [],
    'analytics:attendance': [],
    // Student Portal
    'student-portal': [],
    'student-portal:grades': [],
    'student-portal:attendance': [],
    'student-portal:schedule': [],
    'student-portal:assignments': [],
    // Parent Portal
    'parent-portal': [],
    'parent-portal:grades': [],
    'parent-portal:attendance': [],
    'parent-portal:fees': [],
    'parent-portal:schedule': [],
    // Settings
    settings: [],
    'settings:school': [],
    'settings:tenant': [],
  },

  // ==========================================================================
  // STUDENT ROLE
  // Students have view-only access to their own academic data.
  // They can view their grades, attendance, schedule, and assignments.
  // Students can send messages to teachers but cannot access administrative functions.
  // ==========================================================================
  Student: {
    dashboard: ['view'],
    students: [], // Cannot view other students
    teachers: ['view'], // Can see their teachers
    grades: [], // No direct access to grades resource (use student-portal)
    gradelevels: ['view'],
    curriculum: ['view'], // Can view curriculum/syllabus
    classes: ['view'], // Can view their enrolled classes
    classrooms: ['view'],
    calendar: ['view'], // Can view school calendar
    attendance: [], // No direct access (use student-portal)
    enrollment: [], // Cannot access enrollment
    assessments: ['view'], // Can view assessments/assignments
    gradebook: [], // No direct gradebook access
    guardians: [], // Cannot view guardians
    parents: [], // Cannot view parents
    departments: ['view'],
    billing: [],
    payroll: [],
    expenses: [],
    tuition: [],
    'reports:finance': [],
    staff: [],
    'staff:assignments': [],
    // Communications - Students can view announcements and message teachers
    communications: ['view'],
    announcements: ['view'],
    messages: ['view', 'create', 'send'],
    notifications: ['view'],
    // Analytics - Limited to own academic analytics
    analytics: [],
    'analytics:academic': [],
    'analytics:financial': [],
    'analytics:attendance': [],
    // Student Portal - Full access to own academic data
    'student-portal': ['view'],
    'student-portal:grades': ['view'],
    'student-portal:attendance': ['view'],
    'student-portal:schedule': ['view'],
    'student-portal:assignments': ['view'],
    // Parent Portal - Not accessible
    'parent-portal': [],
    'parent-portal:grades': [],
    'parent-portal:attendance': [],
    'parent-portal:fees': [],
    'parent-portal:schedule': [],
    // Settings - Can view own profile settings only
    settings: ['view'],
    'settings:school': [],
    'settings:tenant': [],
  },

  // ==========================================================================
  // PARENT ROLE
  // Parents have view access to their linked children's academic data.
  // They can view grades, attendance, schedules, and pay fees.
  // Parents can communicate with teachers and staff.
  // ==========================================================================
  Parent: {
    dashboard: ['view'],
    students: [], // Cannot view all students (only via parent-portal for their children)
    teachers: ['view'], // Can see teachers
    grades: [], // No direct access (use parent-portal)
    gradelevels: ['view'],
    curriculum: ['view'], // Can view curriculum
    classes: [], // No direct class access
    classrooms: [],
    calendar: ['view'], // Can view school calendar
    attendance: [], // No direct access (use parent-portal)
    enrollment: [], // Cannot access enrollment
    assessments: ['view'], // Can view children's assessments
    gradebook: [], // No direct gradebook access
    guardians: [], // Cannot view other guardians
    parents: [], // Cannot view other parents
    departments: ['view'],
    billing: [], // No direct billing (use parent-portal:fees)
    payroll: [],
    expenses: [],
    tuition: [],
    'reports:finance': [],
    staff: [],
    'staff:assignments': [],
    // Communications - Parents can communicate with school
    communications: ['view'],
    announcements: ['view'],
    messages: ['view', 'create', 'send'],
    notifications: ['view'],
    // Analytics - No access
    analytics: [],
    'analytics:academic': [],
    'analytics:financial': [],
    'analytics:attendance': [],
    // Student Portal - Not accessible (parents use parent-portal)
    'student-portal': [],
    'student-portal:grades': [],
    'student-portal:attendance': [],
    'student-portal:schedule': [],
    'student-portal:assignments': [],
    // Parent Portal - Full access to children's data
    'parent-portal': ['view'],
    'parent-portal:grades': ['view'],
    'parent-portal:attendance': ['view'],
    'parent-portal:fees': ['view', 'create'], // Can view and pay fees
    'parent-portal:schedule': ['view'],
    // Settings - Can view own profile settings only
    settings: ['view'],
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
  
  const actions: Action[] = ['view', 'create', 'edit', 'delete', 'manage', 'approve', 'send', 'export']
  
  return actions.reduce((acc, action) => {
    acc[action] = can(user, { action, resource, schoolId })
    return acc
  }, {} as Record<Action, boolean>)
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
 * Hook for object-level permission check
 */
export function useCanAccessEntity(
  action: Action,
  entity: EntityContext | null
): boolean {
  const user = useAuthStore((s) => s.user)
  
  if (!entity) return false
  return canAccessEntity(user, action, entity)
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

  // Principal and Teachers can communicate with parents
  if (audience === 'parents') {
    return role === 'Teacher' || role === 'Accountant'
  }

  // Teachers can communicate with students
  if (role === 'Teacher' && audience === 'students') return true

  return false
}

/**
 * Hook to check communication permissions
 */
export function useCanCommunicateWith(
  audience: 'all' | 'parents' | 'teachers' | 'students' | 'staff'
): boolean {
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  
  return canCommunicateWith(user, audience, activeSchoolId ?? undefined)
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

/**
 * Hook to get schools where user has permission
 */
export function useSchoolsWithPermission(
  action: Action,
  resource: Resource
): string[] {
  const user = useAuthStore((s) => s.user)
  return getSchoolsWithPermission(user, action, resource)
}
