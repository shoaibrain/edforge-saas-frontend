/**
 * Add New Dropdown Options Configuration
 * 
 * Centralized configuration for all "Add New" actions available in the header dropdown.
 * Supports context awareness, keyboard shortcuts, and ABAC permissions.
 */

import {
  Users,
  GraduationCap,
  User,
  Heart,
  Mail,
  Building2,
  Layers,
  BookOpen,
  CalendarDays,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react'
import type { Action, Resource } from '@edforge/abac'

// ============================================================================
// TYPES
// ============================================================================

export type AddNewCategory = 'people' | 'academic' | 'administrative'

export type AddNewActionType = 
  | 'quick-add-person'
  | 'wizard'
  | 'invite'
  | 'modal'

export interface AddNewOption {
  /** Unique identifier */
  id: string
  /** Display label */
  label: string
  /** Short description */
  description: string
  /** Icon component */
  icon: LucideIcon
  /** Icon background color class */
  iconBg: string
  /** Icon color class */
  iconColor: string
  /** Category for grouping */
  category: AddNewCategory
  /** Type of action to perform */
  actionType: AddNewActionType
  /** Optional keyboard shortcut */
  shortcut?: string
  /** Routes where this option should be highlighted */
  highlightOnRoutes?: string[]
  /** ABAC permission required */
  permission?: { action: Action; resource: Resource }
  /** Whether this requires an active school context */
  requiresActiveSchool?: boolean
  /** Order within category (lower = first) */
  order: number
  /** Additional data to pass to the action */
  actionData?: Record<string, unknown>
}

export interface AddNewCategoryInfo {
  id: AddNewCategory
  label: string
  order: number
}

// ============================================================================
// CATEGORIES
// ============================================================================

export const ADD_NEW_CATEGORIES: Record<AddNewCategory, { label: string; order: number }> = {
  people: { label: 'People', order: 1 },
  academic: { label: 'Academic', order: 2 },
  administrative: { label: 'Administrative', order: 3 },
}

// ============================================================================
// OPTIONS
// ============================================================================

export const ADD_NEW_OPTIONS: AddNewOption[] = [
  // ============ PEOPLE ============
  {
    id: 'new-student',
    label: 'New Student',
    description: 'Enroll a new student',
    icon: GraduationCap,
    iconBg: 'bg-golden-400/20',
    iconColor: 'text-golden-600 dark:text-golden-400',
    category: 'people',
    actionType: 'quick-add-person',
    shortcut: 'S',
    highlightOnRoutes: ['/people', '/academics'],
    permission: { action: 'create', resource: 'students' },
    requiresActiveSchool: true,
    order: 1,
    actionData: { personType: 'student' },
  },
  {
    id: 'new-teacher',
    label: 'New Teacher',
    description: 'Add a teacher',
    icon: User,
    iconBg: 'bg-teal-500/20',
    iconColor: 'text-teal-600 dark:text-cyan-400',
    category: 'people',
    actionType: 'quick-add-person',
    shortcut: 'T',
    highlightOnRoutes: ['/people'],
    permission: { action: 'create', resource: 'staff' },
    requiresActiveSchool: true,
    order: 2,
    actionData: { personType: 'teacher' },
  },
  {
    id: 'new-staff',
    label: 'New Staff',
    description: 'Add staff member',
    icon: Users,
    iconBg: 'bg-aqua-400/20',
    iconColor: 'text-aqua-700 dark:text-aqua-400',
    category: 'people',
    actionType: 'quick-add-person',
    highlightOnRoutes: ['/people'],
    permission: { action: 'create', resource: 'staff' },
    requiresActiveSchool: true,
    order: 3,
    actionData: { personType: 'staff' },
  },
  {
    id: 'new-guardian',
    label: 'New Guardian',
    description: 'Add parent or guardian',
    icon: Heart,
    iconBg: 'bg-rust-400/20',
    iconColor: 'text-rust-600 dark:text-rust-400',
    category: 'people',
    actionType: 'quick-add-person',
    highlightOnRoutes: ['/people'],
    permission: { action: 'create', resource: 'staff' },
    requiresActiveSchool: true,
    order: 4,
    actionData: { personType: 'guardian' },
  },
  {
    id: 'invite-team',
    label: 'Invite Team',
    description: 'Send email invitations',
    icon: Mail,
    iconBg: 'bg-vanilla-400/20',
    iconColor: 'text-vanilla-700 dark:text-vanilla-500',
    category: 'people',
    actionType: 'invite',
    shortcut: 'I',
    highlightOnRoutes: ['/people', '/settings'],
    permission: { action: 'create', resource: 'staff' },
    requiresActiveSchool: true,
    order: 5,
  },

  // ============ ACADEMIC ============
  {
    id: 'new-classroom',
    label: 'New Classroom',
    description: 'Create a classroom',
    icon: Building2,
    iconBg: 'bg-caramel-400/20',
    iconColor: 'text-caramel-600 dark:text-caramel-400',
    category: 'academic',
    actionType: 'modal',
    highlightOnRoutes: ['/academics/classes'],
    permission: { action: 'create', resource: 'classes' },
    requiresActiveSchool: true,
    order: 1,
  },
  {
    id: 'new-grade-level',
    label: 'New Grade Level',
    description: 'Add grade level',
    icon: Layers,
    iconBg: 'bg-aqua-400/20',
    iconColor: 'text-aqua-700 dark:text-aqua-400',
    category: 'academic',
    actionType: 'modal',
    highlightOnRoutes: ['/academics/gradelevels'],
    permission: { action: 'manage', resource: 'classes' },
    requiresActiveSchool: true,
    order: 2,
  },
  {
    id: 'new-subject',
    label: 'New Subject',
    description: 'Add a subject',
    icon: BookOpen,
    iconBg: 'bg-teal-500/20',
    iconColor: 'text-teal-600 dark:text-cyan-400',
    category: 'academic',
    actionType: 'modal',
    highlightOnRoutes: ['/academics'],
    permission: { action: 'manage', resource: 'classes' },
    requiresActiveSchool: true,
    order: 3,
  },

  // ============ ADMINISTRATIVE ============
  {
    id: 'new-academic-year',
    label: 'Academic Year',
    description: 'Create academic year',
    icon: CalendarDays,
    iconBg: 'bg-vanilla-400/20',
    iconColor: 'text-vanilla-700 dark:text-vanilla-500',
    category: 'administrative',
    actionType: 'modal',
    permission: { action: 'manage', resource: 'settings' },
    requiresActiveSchool: true,
    order: 1,
  },
  {
    id: 'new-department',
    label: 'Department',
    description: 'Add department',
    icon: ClipboardList,
    iconBg: 'bg-teal-500/20',
    iconColor: 'text-teal-600 dark:text-cyan-400',
    category: 'administrative',
    actionType: 'modal',
    permission: { action: 'manage', resource: 'settings' },
    requiresActiveSchool: true,
    order: 2,
  },
]

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get options grouped by category
 */
export function getOptionsGroupedByCategory(options: AddNewOption[]): Map<AddNewCategory, AddNewOption[]> {
  const grouped = new Map<AddNewCategory, AddNewOption[]>()
  
  // Initialize categories in order
  Object.entries(ADD_NEW_CATEGORIES)
    .sort((a, b) => a[1].order - b[1].order)
    .forEach(([key]) => {
      grouped.set(key as AddNewCategory, [])
    })

  // Group options
  options.forEach((option) => {
    const categoryOptions = grouped.get(option.category) || []
    categoryOptions.push(option)
    grouped.set(option.category, categoryOptions)
  })

  // Sort options within each category
  grouped.forEach((options, category) => {
    grouped.set(
      category,
      options.sort((a, b) => a.order - b.order)
    )
  })

  return grouped
}

/**
 * Filter options by permission (client-side check)
 */
export function filterOptionsByPermission(
  options: AddNewOption[],
  checkPermission: (action: Action, resource: Resource) => boolean
): AddNewOption[] {
  return options.filter((option) => {
    if (!option.permission) return true
    return checkPermission(option.permission.action, option.permission.resource)
  })
}

/**
 * Get options highlighted for current route
 */
export function getHighlightedOptions(
  options: AddNewOption[],
  currentPath: string
): AddNewOption[] {
  return options.filter((option) => {
    if (!option.highlightOnRoutes) return false
    return option.highlightOnRoutes.some((route) => currentPath.startsWith(route))
  })
}

/**
 * Get context-aware options for current route
 * Returns highlighted options first, then all other options
 */
export function getContextAwareOptions(
  options: AddNewOption[],
  currentPath: string
): {
  highlighted: AddNewOption[]
  other: AddNewOption[]
} {
  const highlighted = getHighlightedOptions(options, currentPath)
  const highlightedIds = new Set(highlighted.map((o) => o.id))
  const other = options.filter((o) => !highlightedIds.has(o.id))

  return { highlighted, other }
}

