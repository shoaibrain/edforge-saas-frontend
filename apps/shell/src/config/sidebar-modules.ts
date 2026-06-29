/**
 * Sidebar Module Configuration
 * 
 * Defines navigation items for each module/context with ABAC permissions.
 * The sidebar dynamically renders items based on the active module and user permissions.
 * 
 * Role-Based Navigation:
 * - Administrators (TenantAdmin, Principal, Staff, Accountant) see the full admin navigation
 * - Teachers see educator-focused navigation
 * - Students see student portal navigation (grades, schedule, assignments)
 * - Parents see parent portal navigation (children's data, fees)
 * 
 * The home module is dynamically selected based on the user's role in their active school.
 */

import {
  GraduationCap,
  DollarSign,
  GalleryVerticalEnd,
  Users,
  Settings,
  Layers,
  ShieldCheck,
  School,
  UsersRound,
  CreditCard,
  Wallet,
  type LucideIcon,
  BrickWallShield,
  Calendars,
  ClipboardPlus,
  ClipboardList,
  BookOpen,
  Calendar,
  Baby,
  Building2,
  Bug,
  BarChart3,
} from 'lucide-react'
import type { Action, Resource } from '@edforge/abac'
import type { GlobalRole, RoleCategory, SchoolRole } from '@edforge/types'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface NavItemPermission {
  action: Action
  resource: Resource
}

export interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  href?: string
  onClick?: () => void

  // ABAC Security
  permission?: NavItemPermission

  // Multi-tenant visibility - only show for these global roles
  tenantRoles?: GlobalRole[]

  // School-specific visibility - requires an active school context
  requiresActiveSchool?: boolean

  // Badge for notifications/counts
  badge?: number | string

  // Variant for styling (e.g., danger for delete actions)
  variant?: 'default' | 'danger'
}

export interface NavItemGroup {
  id: string
  label?: string  // Group header like "ACCOUNT", "WORKSPACE"
  items: NavItem[]
}

export interface ModuleConfig {
  id: SidebarModule
  title: string
  icon?: LucideIcon
  backTo?: { path: string; label: string }  // For non-home modules
  groups: NavItemGroup[]
}

export type SidebarModule =
  | 'home'
  | 'home-student'
  | 'home-parent'
  | 'settings'
  | 'academics'
  | 'finance'
  | 'people'
  | 'analytics'
  | 'parent-portal'
  | 'student-portal'

// ============================================================================
// HOME MODULE - Admin/Staff/Teacher dashboard navigation
// This is the default home module for administrative and educator roles.
// Students and Parents have their own tailored home modules below.
// ============================================================================

const homeModule: ModuleConfig = {
  id: 'home',
  title: 'Home',
  groups: [
    {
      id: 'main',
      items: [
        {
          id: 'academics',
          label: 'Academics',
          icon: School,
          href: '/academics',
          permission: { action: 'view', resource: 'students' },
        },
        {
          id: 'people',
          label: 'People',
          icon: UsersRound,
          href: '/people',
          permission: { action: 'view', resource: 'staff' },
        },
        {
          id: 'finance',
          label: 'Finance',
          icon: DollarSign,
          href: '/finance',
          permission: { action: 'view', resource: 'billing' },
        },
        // Analytics is PARKED (backend 403) — hidden from nav. The /analytics
        // route renders a placeholder. See docs/deferred/parked-mfes.md.
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          href: '/settings',
          permission: { action: 'view', resource: 'settings' },
        },
      ],
    },
  ],
}

// ============================================================================
// STUDENT HOME MODULE - Student-specific dashboard navigation
// Students see their own academic data: grades, schedule, assignments
// ============================================================================

const studentHomeModule: ModuleConfig = {
  id: 'home-student',
  title: 'My Portal',
  groups: [
    {
      id: 'academics',
      label: 'MY ACADEMICS',
      items: [
        {
          id: 'my-grades',
          label: 'My Grades',
          icon: GraduationCap,
          href: '/student-portal/grades',
          permission: { action: 'view', resource: 'student-portal:grades' },
        },
        {
          id: 'my-attendance',
          label: 'My Attendance',
          icon: ClipboardPlus,
          href: '/student-portal/attendance',
          permission: { action: 'view', resource: 'student-portal:attendance' },
        },
        {
          id: 'my-schedule',
          label: 'My Schedule',
          icon: Calendar,
          href: '/student-portal/schedule',
          permission: { action: 'view', resource: 'student-portal:schedule' },
        },
      ],
    },
    {
      id: 'account',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          href: '/settings',
          permission: { action: 'view', resource: 'settings' },
        },
      ],
    },
  ],
}

// ============================================================================
// PARENT HOME MODULE - Parent-specific dashboard navigation
// Parents see their children's academic data, fees, and school communications
// ============================================================================

const parentHomeModule: ModuleConfig = {
  id: 'home-parent',
  title: 'Family Portal',
  groups: [
    {
      id: 'children',
      label: 'MY CHILDREN',
      items: [
        {
          id: 'children-overview',
          label: 'Overview',
          icon: Baby,
          href: '/parent-portal',
          permission: { action: 'view', resource: 'parent-portal' },
        },
        {
          id: 'children-grades',
          label: 'Grades',
          icon: GraduationCap,
          href: '/parent-portal/grades',
          permission: { action: 'view', resource: 'parent-portal:grades' },
        },
        {
          id: 'children-attendance',
          label: 'Attendance',
          icon: ClipboardPlus,
          href: '/parent-portal/attendance',
          permission: { action: 'view', resource: 'parent-portal:attendance' },
        },
        {
          id: 'children-schedule',
          label: 'Schedule',
          icon: Calendar,
          href: '/parent-portal/schedule',
          permission: { action: 'view', resource: 'parent-portal:schedule' },
        },
      ],
    },
    {
      id: 'payments',
      label: 'PAYMENTS',
      items: [
        {
          id: 'fees',
          label: 'Fee Payments',
          icon: CreditCard,
          href: '/parent-portal/fees',
          permission: { action: 'view', resource: 'parent-portal:fees' },
        },
      ],
    },
    {
      id: 'account',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          href: '/settings',
          permission: { action: 'view', resource: 'settings' },
        },
      ],
    },
  ],
}

// ============================================================================
// SETTINGS MODULE - System Administration (Consolidated: 12 → 4 items)
// Design: User preferences moved to avatar dropdown; system config remains here
// Note: My Account, Preferences, Notifications, Security → Avatar dropdown menu
// ============================================================================

const settingsModule: ModuleConfig = {
  id: 'settings',
  title: 'Settings',
  icon: Settings,
  backTo: { path: '/home', label: 'Back to Home' },
  groups: [
    {
      id: 'main',
      items: [
        {
          id: 'settings-home',
          label: 'Overview',
          icon: GalleryVerticalEnd,
          href: '/settings',
          permission: { action: 'view', resource: 'settings' },
        },
      ],
    },
    {
      id: 'account',
      label: 'ACCOUNT',
      items: [
        {
          id: 'my-account',
          label: 'My Account',
          icon: Users,
          href: '/settings/account',
          permission: { action: 'view', resource: 'settings' },
        },
        {
          id: 'preferences',
          label: 'Preferences',
          icon: Layers,
          href: '/settings/preferences',
          permission: { action: 'view', resource: 'settings' },
        },
        {
          id: 'security',
          label: 'Security',
          icon: ShieldCheck,
          href: '/settings/security',
          permission: { action: 'view', resource: 'settings' },
        },
      ],
    },
    {
      id: 'workspace',
      label: 'WORKSPACE',
      items: [
        {
          id: 'workspace-settings',
          label: 'Workspace Settings',
          icon: Settings,
          href: '/settings/workspace',
          permission: { action: 'view', resource: 'settings:tenant' },
        },
        {
          id: 'organization',
          label: 'Organization',
          icon: Building2,
          href: '/settings/organization',
          permission: { action: 'view', resource: 'education-organizations' },
        },
        {
          id: 'rbac-security',
          label: 'RBAC Security',
          icon: BrickWallShield,
          href: '/settings/security-policies',
          permission: { action: 'manage', resource: 'settings' },
        },
        {
          id: 'auth-debug',
          label: 'Auth Debug',
          icon: Bug,
          href: '/settings/auth-debug',
          permission: { action: 'manage', resource: 'settings' },
          tenantRoles: ['TenantAdmin'],
        },
      ],
    },
  ],
}

// ============================================================================
// ACADEMICS MODULE - Academic management (Consolidated: 15 → 5 items)
// Design: Workflow-oriented grouping with tabs/sub-views within pages
// ============================================================================

const academicsModule: ModuleConfig = {
  id: 'academics',
  title: 'Academics',
  icon: GraduationCap,
  backTo: { path: '/home', label: 'Back to Home' },
  groups: [
    {
      id: 'main',
      items: [
        {
          id: 'academics-home',
          label: 'Overview',
          icon: GalleryVerticalEnd,
          href: '/academics',
          permission: { action: 'view', resource: 'students' },
        },
        {
          // Students: Directory main view; Enrollment/Profiles/Families as tabs
          id: 'students',
          label: 'Students',
          icon: UsersRound,
          href: '/academics/students',
          permission: { action: 'view', resource: 'students' },
          requiresActiveSchool: true,
        },
        {
          // Classrooms: Consolidated Scheduling + Grades + Attendance
          id: 'classrooms',
          label: 'Classrooms',
          icon: School,
          href: '/academics/classrooms',
          permission: { action: 'view', resource: 'classes' },
          requiresActiveSchool: true,
        },
        {
          // Curriculum: Courses main view; Grade Levels/Standards in "Configure"
          id: 'curriculum',
          label: 'Curriculum',
          icon: BookOpen,
          href: '/academics/curriculum',
          permission: { action: 'view', resource: 'courses' },
          requiresActiveSchool: true,
        },
        {
          // Exams: school + academic-year scoped exam management (term exams,
          // scores, result cards). School-scoped, not per-section.
          id: 'exams',
          label: 'Exams',
          icon: ClipboardList,
          href: '/academics/exams',
          permission: { action: 'view', resource: 'assessments' },
          requiresActiveSchool: true,
        },
      ],
    },
  ],
}

const financeModule: ModuleConfig = {
  id: 'finance',
  title: 'Finance',
  icon: DollarSign,
  backTo: { path: '/home', label: 'Back to Home' },
  groups: [
    {
      id: 'main',
      items: [
        { id: 'finance-home', label: 'Overview', icon: GalleryVerticalEnd, href: '/finance', permission: { action: 'view', resource: 'billing' } },
      ],
    },
    {
      id: 'billing',
      label: 'BILLING',
      items: [
        { id: 'invoices', label: 'Invoices', icon: CreditCard, href: '/finance/invoices', permission: { action: 'view', resource: 'billing' }, requiresActiveSchool: true },
        { id: 'student-accounts', label: 'Student Accounts', icon: UsersRound, href: '/finance/accounts', permission: { action: 'view', resource: 'billing' }, requiresActiveSchool: true },
        { id: 'payments', label: 'Payments', icon: Wallet, href: '/finance/payments', permission: { action: 'view', resource: 'billing' }, requiresActiveSchool: true },
      ],
    },
    {
      id: 'configuration',
      label: 'CONFIGURATION',
      items: [
        { id: 'fee-structures', label: 'Fee Structures', icon: CreditCard, href: '/finance/configuration/fee-structures', permission: { action: 'manage', resource: 'billing' }, requiresActiveSchool: true },
      ],
    },
  ],
}

// ============================================================================
// PEOPLE MODULE - Staff and user management (Consolidated: 10 → 2 items)
// Design: Departments as filter, Tasks moved to Dashboard, HR as tabbed view
// ============================================================================

const peopleModule: ModuleConfig = {
  id: 'people',
  title: 'People',
  icon: Users,
  backTo: { path: '/home', label: 'Back to Home' },
  groups: [
    {
      id: 'main',
      items: [
        {
          id: 'people-home',
          label: 'Overview',
          icon: GalleryVerticalEnd,
          href: '/people',
          permission: { action: 'view', resource: 'staff' },
        },
        {
          // Staff Directory: Departments as filter, Attendance as tab
          id: 'staff-directory',
          label: 'Staff Directory',
          icon: UsersRound,
          href: '/people/staff',
          permission: { action: 'view', resource: 'staff' },
          requiresActiveSchool: true,
        },
        // HR Admin nav intentionally omitted — HR administration (payroll,
        // reviews, contracts) is out of scope for V1 and ships in a later
        // release. Don't surface a non-shippable placeholder in the nav.
      ],
    },
  ],
}

// ============================================================================
// ANALYTICS MODULE - Tenant adoption insights, dashboards, exports
// ============================================================================

const analyticsModule: ModuleConfig = {
  id: 'analytics',
  title: 'Analytics',
  icon: BarChart3,
  backTo: { path: '/home', label: 'Back to Home' },
  groups: [
    {
      id: 'main',
      items: [
        {
          id: 'analytics-overview',
          label: 'Overview',
          icon: GalleryVerticalEnd,
          href: '/analytics',
          permission: { action: 'view', resource: 'analytics' },
        },
        {
          id: 'analytics-dashboard',
          label: 'Adoption Dashboard',
          icon: BarChart3,
          href: '/analytics/dashboard',
          permission: { action: 'view', resource: 'analytics' },
        },
      ],
    },
  ],
}

// ============================================================================
// STUDENT PORTAL MODULE - For navigating from sub-pages back to student home
// ============================================================================

const studentPortalModule: ModuleConfig = {
  id: 'student-portal',
  title: 'Student Portal',
  icon: GraduationCap,
  backTo: { path: '/home', label: 'Back to Home' },
  groups: [
    {
      id: 'academics',
      label: 'MY ACADEMICS',
      items: [
        {
          id: 'my-grades',
          label: 'My Grades',
          icon: GraduationCap,
          href: '/student-portal/grades',
          permission: { action: 'view', resource: 'student-portal:grades' },
        },
        {
          id: 'my-attendance',
          label: 'My Attendance',
          icon: ClipboardPlus,
          href: '/student-portal/attendance',
          permission: { action: 'view', resource: 'student-portal:attendance' },
        },
        {
          id: 'my-schedule',
          label: 'My Schedule',
          icon: Calendar,
          href: '/student-portal/schedule',
          permission: { action: 'view', resource: 'student-portal:schedule' },
        },
      ],
    },
  ],
}

// ============================================================================
// PARENT PORTAL MODULE - For navigating from sub-pages back to parent home
// ============================================================================

const parentPortalModule: ModuleConfig = {
  id: 'parent-portal',
  title: 'Family Portal',
  icon: Baby,
  backTo: { path: '/home', label: 'Back to Home' },
  groups: [
    {
      id: 'children',
      label: 'MY CHILDREN',
      items: [
        {
          id: 'view-grades',
          label: 'Grades',
          icon: GraduationCap,
          href: '/parent-portal/grades',
          permission: { action: 'view', resource: 'parent-portal:grades' },
        },
        {
          id: 'view-attendance',
          label: 'Attendance',
          icon: ClipboardPlus,
          href: '/parent-portal/attendance',
          permission: { action: 'view', resource: 'parent-portal:attendance' },
        },
        {
          id: 'view-schedule',
          label: 'Schedule',
          icon: Calendars,
          href: '/parent-portal/schedule',
          permission: { action: 'view', resource: 'parent-portal:schedule' },
        },
      ],
    },
    {
      id: 'payments',
      label: 'PAYMENTS',
      items: [
        {
          id: 'fees',
          label: 'Fee Payments',
          icon: CreditCard,
          href: '/parent-portal/fees',
          permission: { action: 'view', resource: 'parent-portal:fees' },
        },
      ],
    },
  ],
}

// ============================================================================
// MODULE REGISTRY
// ============================================================================

export const SIDEBAR_MODULES: Record<SidebarModule, ModuleConfig> = {
  home: homeModule,
  'home-student': studentHomeModule,
  'home-parent': parentHomeModule,
  settings: settingsModule,
  academics: academicsModule,
  finance: financeModule,
  people: peopleModule,
  analytics: analyticsModule,
  'student-portal': studentPortalModule,
  'parent-portal': parentPortalModule,
}


/**
 * Get module config by ID
 */
export function getModuleConfig(moduleId: SidebarModule): ModuleConfig {
  return SIDEBAR_MODULES[moduleId]
}

/**
 * Get the appropriate home module based on user role category.
 * This enables role-based navigation where different user types
 * see different sidebar items on the home page.
 * 
 * @param roleCategory - The user's role category in their active school
 * @returns The module ID for the appropriate home experience
 */
export function getHomeModuleForRole(roleCategory: RoleCategory | null): SidebarModule {
  switch (roleCategory) {
    case 'student':
      return 'home-student'
    case 'parent':
      return 'home-parent'
    case 'administrator':
    case 'educator':
    default:
      return 'home'
  }
}

/**
 * Get the home module for a specific school role.
 * Convenience wrapper around getHomeModuleForRole.
 * 
 * @param schoolRole - The user's role in a specific school
 * @returns The module ID for the appropriate home experience
 */
export function getHomeModuleForSchoolRole(schoolRole: SchoolRole | null): SidebarModule {
  if (!schoolRole) return 'home'

  switch (schoolRole) {
    case 'Student':
      return 'home-student'
    case 'Parent':
      return 'home-parent'
    default:
      return 'home'
  }
}

/**
 * Detect which module should be active based on pathname.
 * Note: This returns the base module ID. For home routes,
 * the actual module to use depends on the user's role.
 */
export function detectModuleFromPath(pathname: string): SidebarModule {
  if (pathname.startsWith('/settings')) return 'settings'
  if (pathname.startsWith('/academics')) return 'academics'
  if (pathname.startsWith('/finance')) return 'finance'
  if (pathname.startsWith('/people')) return 'people'
  if (pathname.startsWith('/analytics')) return 'analytics'
  if (pathname.startsWith('/student-portal')) return 'student-portal'
  if (pathname.startsWith('/parent-portal')) return 'parent-portal'
  return 'home'
}

/**
 * Check if a module ID represents a home module variant.
 * Used to determine if we're on a "home" context even with role-specific modules.
 */
export function isHomeModule(moduleId: SidebarModule): boolean {
  return moduleId === 'home' || moduleId === 'home-student' || moduleId === 'home-parent'
}
