/**
 * ABAC (Attribute-Based Access Control) Permission Definitions
 *
 * Defines what actions each role can perform on each resource.
 */

import type { SchoolRole } from '@edforge/types'

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
  | 'send'
  | 'export'

export type Resource =
  // Dashboard
  | 'dashboard'
  // Academics
  | 'students'
  | 'teachers'
  | 'grades'
  | 'gradelevels'
  | 'classes'
  | 'classrooms'
  | 'calendar'
  | 'attendance'
  | 'enrollment'
  | 'assessments'
  | 'gradebook'
  | 'scheduling'
  | 'courses'
  | 'standards'
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
  // Human Resources
  | 'hr'
  | 'hr:payroll'
  | 'hr:contracts'
  | 'hr:professional-dev'
  | 'hr:performance-reviews'
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
  // Student Portal
  | 'student-portal'
  | 'student-portal:grades'
  | 'student-portal:attendance'
  | 'student-portal:schedule'
  | 'student-portal:assignments'
  // Parent Portal
  | 'parent-portal'
  | 'parent-portal:grades'
  | 'parent-portal:attendance'
  | 'parent-portal:fees'
  | 'parent-portal:schedule'
  // Settings
  | 'settings'
  | 'settings:school'
  | 'settings:tenant'
  // Ed-Fi
  | 'edfi'
  | 'edfi:connections'
  | 'edfi:mapping'
  | 'edfi:sync'
  // Integrations
  | 'integrations'
  | 'integrations:google'
  | 'integrations:microsoft'
  // Special Programs
  | 'special-programs'
  | 'special-programs:ieps'
  | 'special-programs:504'
  // Education Organizations (Sprint 1A)
  | 'education-organizations'
  // Employment History (Sprint 1A)
  | 'employment-history'

// ============================================================================
// ROLE → PERMISSION MAPPING
// ============================================================================

type PermissionMap = Record<SchoolRole, Partial<Record<Resource, Action[]>>>

/**
 * Defines what actions each role can perform on each resource.
 * TenantAdmin gets all permissions via globalRole check.
 */
export const ROLE_PERMISSIONS: PermissionMap = {
  Principal: {
    dashboard: ['view'],
    students: ['view', 'create', 'edit', 'delete', 'manage'],
    teachers: ['view', 'create', 'edit', 'delete', 'manage'],
    grades: ['view', 'create', 'edit', 'approve'],
    gradelevels: ['view', 'create', 'edit', 'delete', 'manage'],
    classes: ['view', 'create', 'edit', 'delete', 'manage'],
    classrooms: ['view', 'create', 'edit', 'delete', 'manage'],
    calendar: ['view', 'create', 'edit', 'manage'],
    attendance: ['view', 'create', 'edit', 'manage'],
    enrollment: ['view', 'create', 'edit', 'delete', 'manage', 'approve'],
    assessments: ['view', 'create', 'edit', 'delete', 'manage'],
    gradebook: ['view', 'create', 'edit', 'manage', 'approve'],
    scheduling: ['view', 'create', 'edit', 'delete', 'manage'],
    courses: ['view', 'create', 'edit', 'delete', 'manage'],
    standards: ['view', 'create', 'edit', 'delete', 'manage'],
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
    hr: ['view', 'manage'],
    'hr:payroll': ['view', 'create', 'edit', 'approve'],
    'hr:contracts': ['view', 'create', 'edit', 'delete', 'manage'],
    'hr:professional-dev': ['view', 'create', 'edit', 'manage'],
    'hr:performance-reviews': ['view', 'create', 'edit', 'approve'],
    communications: ['view', 'create', 'edit', 'delete', 'manage'],
    announcements: ['view', 'create', 'edit', 'delete', 'send', 'approve'],
    messages: ['view', 'create', 'send'],
    notifications: ['view', 'create', 'manage'],
    analytics: ['view', 'export'],
    'analytics:academic': ['view', 'export'],
    'analytics:financial': ['view', 'export'],
    'analytics:attendance': ['view', 'export'],
    'student-portal': ['view', 'manage'],
    'student-portal:grades': ['view', 'manage'],
    'student-portal:attendance': ['view', 'manage'],
    'student-portal:schedule': ['view', 'manage'],
    'student-portal:assignments': ['view', 'manage'],
    'parent-portal': ['view', 'manage'],
    'parent-portal:grades': ['view'],
    'parent-portal:attendance': ['view'],
    'parent-portal:fees': ['view'],
    'parent-portal:schedule': ['view'],
    settings: ['view', 'edit'],
    'settings:school': ['view', 'edit', 'manage'],
    'settings:tenant': ['view'],
    edfi: ['view', 'manage'],
    'edfi:connections': ['view', 'create', 'edit', 'delete'],
    'edfi:mapping': ['view', 'edit'],
    'edfi:sync': ['view', 'manage'],
    integrations: ['view', 'manage'],
    'integrations:google': ['view', 'manage'],
    'integrations:microsoft': ['view', 'manage'],
    'special-programs': ['view', 'manage'],
    'special-programs:ieps': ['view', 'create', 'edit', 'delete', 'manage'],
    'special-programs:504': ['view', 'create', 'edit', 'delete', 'manage'],
    'education-organizations': ['view', 'create', 'edit', 'delete', 'manage'],
    'employment-history': ['view'],
  },
  VicePrincipal: {
    dashboard: ['view'],
    students: ['view', 'edit'],
    teachers: ['view', 'edit'],
    grades: ['view', 'edit'],
    gradelevels: ['view', 'edit'],
    classes: ['view', 'edit'],
    classrooms: ['view', 'edit'],
    calendar: ['view', 'edit'],
    attendance: ['view', 'create', 'edit', 'manage'],
    enrollment: ['view', 'edit'],
    assessments: ['view', 'edit'],
    gradebook: ['view', 'edit'],
    scheduling: ['view', 'edit'],
    courses: ['view', 'edit'],
    standards: ['view', 'edit'],
    guardians: ['view', 'edit'],
    parents: ['view', 'edit'],
    departments: ['view', 'edit'],
    staff: ['view'],
    'staff:assignments': ['view', 'create', 'edit'],
    hr: ['view'],
    communications: ['view', 'create', 'edit'],
    announcements: ['view', 'create', 'edit', 'send'],
    messages: ['view', 'create', 'send'],
    notifications: ['view', 'create'],
    analytics: ['view', 'export'],
    'analytics:academic': ['view', 'export'],
    'analytics:attendance': ['view', 'export'],
    settings: ['view'],
    'special-programs': ['view', 'manage'],
    'special-programs:ieps': ['view', 'edit'],
    'special-programs:504': ['view', 'edit'],
    'education-organizations': ['view'],
    'employment-history': ['view'],
  },
  Teacher: {
    dashboard: ['view'],
    students: ['view'],
    teachers: ['view'],
    grades: ['view', 'create', 'edit'],
    gradelevels: ['view'],
    classes: ['view'],
    classrooms: ['view'],
    calendar: ['view'],
    attendance: ['view', 'create', 'edit'],
    enrollment: ['view'],
    assessments: ['view', 'create', 'edit'],
    gradebook: ['view', 'create', 'edit'],
    scheduling: ['view'],
    courses: ['view'],
    standards: ['view'],
    guardians: ['view'],
    parents: ['view'],
    departments: ['view'],
    staff: ['view'],
    communications: ['view'],
    announcements: ['view'],
    messages: ['view', 'create', 'send'],
    notifications: ['view'],
    analytics: ['view'],
    'analytics:academic': ['view'],
    'analytics:attendance': ['view'],
    'student-portal': ['view'],
    'student-portal:grades': ['view'],
    'student-portal:attendance': ['view'],
    'student-portal:schedule': ['view'],
    'student-portal:assignments': ['view'],
    settings: ['view'],
    'special-programs': ['view'],
    'education-organizations': ['view'],
  },
  Accountant: {
    dashboard: ['view'],
    students: ['view'],
    teachers: ['view'],
    calendar: ['view'],
    enrollment: ['view'],
    guardians: ['view'],
    parents: ['view'],
    departments: ['view'],
    billing: ['view', 'create', 'edit', 'manage'],
    payroll: ['view', 'create', 'edit', 'manage'],
    expenses: ['view', 'create', 'edit', 'approve'],
    tuition: ['view', 'create', 'edit', 'manage'],
    'reports:finance': ['view', 'create', 'export'],
    staff: ['view'],
    hr: ['view'],
    'hr:payroll': ['view', 'create', 'edit', 'manage'],
    communications: ['view'],
    announcements: ['view'],
    messages: ['view', 'create', 'send'],
    notifications: ['view'],
    analytics: ['view'],
    'analytics:financial': ['view', 'export'],
    'parent-portal:fees': ['view', 'manage'],
    settings: ['view'],
    'special-programs': ['view'],
  },
  Counselor: {
    dashboard: ['view'],
    students: ['view'],
    teachers: ['view'],
    calendar: ['view'],
    attendance: ['view'],
    enrollment: ['view'],
    guardians: ['view'],
    parents: ['view'],
    departments: ['view'],
    staff: ['view'],
    communications: ['view'],
    announcements: ['view'],
    messages: ['view', 'create', 'send'],
    notifications: ['view'],
    scheduling: ['view'],
    'special-programs': ['view', 'create', 'edit', 'delete', 'manage'],
    'special-programs:ieps': ['view', 'create', 'edit', 'delete', 'manage'],
    'special-programs:504': ['view', 'create', 'edit', 'delete', 'manage'],
    'education-organizations': ['view'],
  },
  Nurse: {
    dashboard: ['view'],
    students: ['view'],
    teachers: ['view'],
    calendar: ['view'],
    attendance: ['view'],
    guardians: ['view'],
    parents: ['view'],
    departments: ['view'],
    staff: ['view'],
    communications: ['view'],
    announcements: ['view'],
    messages: ['view', 'create', 'send'],
    notifications: ['view'],
    'special-programs': ['view'],
    'education-organizations': ['view'],
  },
  Staff: {
    dashboard: ['view'],
    students: ['view'],
    teachers: ['view'],
    gradelevels: ['view'],
    classes: ['view'],
    classrooms: ['view'],
    calendar: ['view'],
    attendance: ['view'],
    enrollment: ['view'],
    guardians: ['view'],
    parents: ['view'],
    departments: ['view'],
    staff: ['view'],
    communications: ['view'],
    announcements: ['view'],
    messages: ['view', 'create', 'send'],
    notifications: ['view'],
    'special-programs': ['view'],
    'education-organizations': ['view'],
    'employment-history': ['view'],
  },
  Student: {
    dashboard: ['view'],
    students: ['view'],
    courses: ['view'],
    calendar: ['view'],
    grades: ['view'],
    attendance: ['view'],
    scheduling: ['view'],
    enrollment: ['view'],
    'student-portal': ['view'],
    'student-portal:grades': ['view'],
    'student-portal:attendance': ['view'],
    'student-portal:schedule': ['view'],
    'student-portal:assignments': ['view'],
    settings: ['view'],
  },
  Parent: {
    dashboard: ['view'],
    students: ['view'],
    courses: ['view'],
    calendar: ['view'],
    grades: ['view'],
    attendance: ['view'],
    scheduling: ['view'],
    enrollment: ['view'],
    'parent-portal': ['view'],
    'parent-portal:grades': ['view'],
    'parent-portal:attendance': ['view'],
    'parent-portal:fees': ['view', 'create'],
    'parent-portal:schedule': ['view'],
    settings: ['view'],
  },
}

