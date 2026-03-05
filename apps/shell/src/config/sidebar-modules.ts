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
  // [MVP-PARKED] MessageCircleMore,
  Layers,
  ShieldCheck,
  // [MVP-PARKED] Link2,
  School,
  // [MVP-PARKED] HandCoins,
  UsersRound,
  CreditCard,
  Wallet,
  // [MVP-PARKED] Receipt,
  // [MVP-PARKED] Zap,
  // [MVP-PARKED] Landmark,
  // [MVP-PARKED] Database,
  // [MVP-PARKED] TriangleAlert,
  // [MVP-PARKED] ClipboardList,
  type LucideIcon,
  BrickWallShield,
  Calendars,
  ClipboardPlus,
  // [MVP-PARKED] Megaphone,
  // [MVP-PARKED] Mail,
  // [MVP-PARKED] TrendingUp,
  // [MVP-PARKED] PieChart,
  // [MVP-PARKED] LineChart,
  // Home, — removed with Dashboard links in Sprint 1.4
  // [MVP-PARKED] Video,
  BookOpen,
  Calendar,
  FileText,
  Baby,
  Building2,
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
  // [MVP-PARKED] | 'messages'
  // [MVP-PARKED] | 'analytics'
  | 'parent-portal'
  | 'student-portal'
  // [MVP-PARKED] | 'special-programs'
  // [MVP-PARKED] | 'edfi'

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
        // [MVP-PARKED] Special Programs
        // {
        //   id: 'special-programs',
        //   label: 'Special Programs',
        //   icon: ShieldCheck,
        //   href: '/special-programs',
        //   permission: { action: 'view', resource: 'special-programs' },
        // },
        // [/MVP-PARKED]
        {
          id: 'people',
          label: 'People & HR',
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
        // [MVP-PARKED] Messages, Analytics, State Reporting
        // {
        //   id: 'messages',
        //   label: 'Messages',
        //   icon: MessageCircleMore,
        //   href: '/messages',
        //   permission: { action: 'view', resource: 'communications' },
        // },
        // {
        //   id: 'analytics',
        //   label: 'Analytics',
        //   icon: BarChart3,
        //   href: '/analytics',
        //   permission: { action: 'view', resource: 'analytics' },
        // },
        // {
        //   id: 'edfi',
        //   label: 'State Reporting',
        //   icon: Database,
        //   href: '/edfi',
        //   permission: { action: 'view', resource: 'edfi' },
        //   tenantRoles: ['TenantAdmin'],
        // },
        // [/MVP-PARKED]
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
        {
          id: 'my-assignments',
          label: 'Assignments',
          icon: FileText,
          href: '/student-portal/assignments',
          permission: { action: 'view', resource: 'student-portal:assignments' },
        },
      ],
    },
    {
      id: 'resources',
      label: 'RESOURCES',
      items: [
        {
          id: 'curriculum',
          label: 'Curriculum',
          icon: BookOpen,
          href: '/student-portal/curriculum',
          permission: { action: 'view', resource: 'courses' },
        },
        {
          id: 'calendar',
          label: 'School Calendar',
          icon: Calendars,
          href: '/student-portal/calendar',
          permission: { action: 'view', resource: 'calendar' },
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
      id: 'school',
      label: 'SCHOOL',
      items: [
        {
          id: 'calendar',
          label: 'School Calendar',
          icon: Calendars,
          href: '/parent-portal/calendar',
          permission: { action: 'view', resource: 'calendar' },
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
          label: 'Preferences & Notifications',
          icon: Layers,
          href: '/settings/preferences',
          permission: { action: 'view', resource: 'settings' },
        },
        // [MVP-PARKED] Notifications merged into Preferences page
        // {
        //   id: 'notifications',
        //   label: 'Notifications',
        //   icon: MessageCircleMore,
        //   href: '/settings/notifications',
        //   permission: { action: 'view', resource: 'settings' },
        // },
        // [/MVP-PARKED]
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
        // Fee Structures and Payment Gateways moved to Finance module (/finance/configuration/*)
        // [MVP-PARKED] Billing, Integrations, Import/Export — not needed for MVP pilot schools
        // {
        //   id: 'billing',
        //   label: 'Billing',
        //   icon: CreditCard,
        //   href: '/settings/billing',
        //   permission: { action: 'manage', resource: 'settings:tenant' },
        //   tenantRoles: ['TenantAdmin'],
        // },
        // {
        //   id: 'integrations',
        //   label: 'Integrations',
        //   icon: Zap,
        //   href: '/settings/integrations',
        //   permission: { action: 'manage', resource: 'settings:tenant' },
        //   tenantRoles: ['TenantAdmin'],
        // },
        // {
        //   id: 'import-export',
        //   label: 'Import/Export',
        //   icon: Database,
        //   href: '/settings/import-export',
        //   permission: { action: 'manage', resource: 'settings:tenant' },
        //   tenantRoles: ['TenantAdmin'],
        // },
        // [/MVP-PARKED]
      ],
    },
    // [MVP-PARKED] Danger Zone — non-functional for MVP
    // {
    //   id: 'danger',
    //   items: [
    //     {
    //       id: 'danger-zone',
    //       label: 'Danger Zone',
    //       icon: TriangleAlert,
    //       href: '/settings/danger-zone',
    //       variant: 'danger',
    //       permission: { action: 'manage', resource: 'settings:tenant' },
    //       tenantRoles: ['TenantAdmin'],
    //     },
    //   ],
    // },
    // [/MVP-PARKED]
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
        { id: 'billing-overview', label: 'Billing', icon: CreditCard, href: '/finance/billing', permission: { action: 'view', resource: 'billing' }, requiresActiveSchool: true },
        { id: 'invoices', label: 'Invoices', icon: FileText, href: '/finance/billing/invoices', permission: { action: 'view', resource: 'billing' }, requiresActiveSchool: true },
        { id: 'payments', label: 'Payments', icon: Wallet, href: '/finance/billing/payments', permission: { action: 'view', resource: 'billing' }, requiresActiveSchool: true },
        { id: 'student-accounts', label: 'Student Accounts', icon: UsersRound, href: '/finance/billing/accounts', permission: { action: 'view', resource: 'billing' }, requiresActiveSchool: true },
        { id: 'reports', label: 'Reports', icon: Layers, href: '/finance/dashboard', permission: { action: 'view', resource: 'billing' }, requiresActiveSchool: true },
      ],
    },
    {
      id: 'configuration',
      label: 'CONFIGURATION',
      items: [
        { id: 'fee-structures', label: 'Fee Structures', icon: CreditCard, href: '/finance/configuration/fee-structures', permission: { action: 'manage', resource: 'billing' }, requiresActiveSchool: true },
        { id: 'payment-gateways', label: 'Payment Gateways', icon: Wallet, href: '/finance/configuration/payment-gateways', permission: { action: 'manage', resource: 'billing' }, requiresActiveSchool: true },
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
  title: 'People & HR',
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
        {
          // HR Admin: Tabbed view for Compensation (Payroll/Contracts) & Development (PD/Reviews)
          id: 'hr-admin',
          label: 'HR Admin',
          icon: BrickWallShield,
          href: '/people/hr',
          permission: { action: 'view', resource: 'hr' },
          requiresActiveSchool: true,
        },
      ],
    },
  ],
}

// [MVP-PARKED] Analytics module config
// const analyticsModule: ModuleConfig = {
//   id: 'analytics',
//   title: 'Analytics',
//   icon: BarChart3,
//   backTo: { path: '/home', label: 'Back to Home' },
//   groups: [
//     {
//       id: 'overview',
//       items: [
//         { id: 'analytics-home', label: 'Overview', icon: GalleryVerticalEnd, href: '/analytics', permission: { action: 'view', resource: 'analytics' } },
//       ],
//     },
//     {
//       id: 'insights',
//       label: 'INSIGHTS',
//       items: [
//         { id: 'academic-analytics', label: 'Academic Performance', icon: GraduationCap, href: '/analytics/academic', permission: { action: 'view', resource: 'analytics:academic' }, requiresActiveSchool: true },
//         { id: 'attendance-analytics', label: 'Attendance', icon: ClipboardPlus, href: '/analytics/attendance', permission: { action: 'view', resource: 'analytics:attendance' }, requiresActiveSchool: true },
//         { id: 'financial-analytics', label: 'Financial', icon: DollarSign, href: '/analytics/financial', permission: { action: 'view', resource: 'analytics:financial' }, requiresActiveSchool: true },
//         { id: 'enrollment-analytics', label: 'Enrollment Trends', icon: TrendingUp, href: '/analytics/enrollment', permission: { action: 'view', resource: 'enrollment' }, requiresActiveSchool: true },
//       ],
//     },
//     {
//       id: 'reports',
//       label: 'REPORTS',
//       items: [
//         { id: 'comparisons', label: 'Comparative Analysis', icon: LineChart, href: '/analytics/comparisons', permission: { action: 'view', resource: 'analytics' }, requiresActiveSchool: true },
//         { id: 'custom-reports', label: 'Custom Reports', icon: PieChart, href: '/analytics/custom', permission: { action: 'view', resource: 'reports:finance' }, requiresActiveSchool: true },
//       ],
//     },
//   ],
// }
// [/MVP-PARKED]

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
        {
          id: 'my-assignments',
          label: 'Assignments',
          icon: FileText,
          href: '/student-portal/assignments',
          permission: { action: 'view', resource: 'student-portal:assignments' },
        },
      ],
    },
    // [MVP-PARKED] Communication group (Messages module parked)
    // {
    //   id: 'communication', label: 'COMMUNICATION',
    //   items: [
    //     { id: 'messages-portal', label: 'Messages', icon: Mail, href: '/communications/messages', permission: { action: 'view', resource: 'messages' } },
    //     { id: 'announcements-portal', label: 'Announcements', icon: Megaphone, href: '/communications/announcements', permission: { action: 'view', resource: 'announcements' } },
    //   ],
    // },
    // [/MVP-PARKED]
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
    // [MVP-PARKED] Communication group (Messages module parked)
    // {
    //   id: 'communication', label: 'COMMUNICATION',
    //   items: [
    //     { id: 'messages-portal', label: 'Messages', icon: Mail, href: '/communications/messages', permission: { action: 'view', resource: 'messages' } },
    //     { id: 'announcements-portal', label: 'Announcements', icon: Megaphone, href: '/communications/announcements', permission: { action: 'view', resource: 'announcements' } },
    //   ],
    // },
    // [/MVP-PARKED]
  ],
}

// ============================================================================
// MODULE REGISTRY
// ============================================================================


// [MVP-PARKED] Messages module config
// const messagesModule: ModuleConfig = {
//   id: 'messages', title: 'Messages', icon: MessageCircleMore,
//   backTo: { path: '/home', label: 'Back to Home' },
//   groups: [
//     { id: 'overview', items: [{ id: 'messages-home', label: 'Overview', icon: GalleryVerticalEnd, href: '/messages', permission: { action: 'view', resource: 'communications' } }] },
//     { id: 'communication', label: 'COMMUNICATION', items: [
//       { id: 'inbox', label: 'Inbox', icon: Mail, href: '/messages/inbox', badge: 12, permission: { action: 'view', resource: 'communications' } },
//       { id: 'announcements', label: 'Announcements', icon: Megaphone, href: '/messages/announcements', permission: { action: 'view', resource: 'announcements' } },
//     ]},
//     { id: 'tools', label: 'TOOLS', items: [
//       { id: 'meetings', label: 'Meetings', icon: Video, href: '/messages/meetings', permission: { action: 'view', resource: 'communications' } },
//     ]},
//   ],
// }
// [/MVP-PARKED]

// [MVP-PARKED] Ed-Fi module config
// const edfiModule: ModuleConfig = {
//   id: 'edfi', title: 'State Reporting', icon: Database,
//   backTo: { path: '/home', label: 'Back to Home' },
//   groups: [
//     { id: 'overview', items: [{ id: 'edfi-home', label: 'Sync Dashboard', icon: GalleryVerticalEnd, href: '/edfi', permission: { action: 'view', resource: 'edfi' } }] },
//     { id: 'configuration', label: 'CONFIGURATION', items: [
//       { id: 'edfi-connections', label: 'Connections', icon: Link2, href: '/edfi/connections', permission: { action: 'view', resource: 'edfi:connections' }, tenantRoles: ['TenantAdmin'] },
//       { id: 'edfi-mapping', label: 'Descriptor Mapping', icon: Layers, href: '/edfi/mapping', permission: { action: 'view', resource: 'edfi:mapping' }, tenantRoles: ['TenantAdmin'] },
//     ]},
//     { id: 'monitoring', label: 'MONITORING', items: [
//       { id: 'edfi-errors', label: 'Error Aggregator', icon: TriangleAlert, href: '/edfi/errors', permission: { action: 'view', resource: 'edfi:sync' } },
//     ]},
//   ],
// }
// [/MVP-PARKED]

// [MVP-PARKED] Special Programs module config
// const specialProgramsModule: ModuleConfig = {
//   id: 'special-programs', title: 'Special Programs', icon: ShieldCheck,
//   backTo: { path: '/home', label: 'Back to Home' },
//   groups: [
//     { id: 'overview', items: [{ id: 'special-programs-home', label: 'Overview', icon: GalleryVerticalEnd, href: '/special-programs', permission: { action: 'view', resource: 'special-programs' } }] },
//     { id: 'special-education', label: 'SPECIAL EDUCATION', items: [
//       { id: 'ieps', label: 'IEPs', icon: FileText, href: '/special-programs/ieps', permission: { action: 'view', resource: 'special-programs:ieps' }, requiresActiveSchool: true },
//       { id: 'iep-meetings', label: 'IEP Meetings', icon: Calendar, href: '/special-programs/ieps/meetings', permission: { action: 'view', resource: 'special-programs:ieps' }, requiresActiveSchool: true },
//       { id: 'iep-goals', label: 'Goals & Objectives', icon: TrendingUp, href: '/special-programs/ieps/goals', permission: { action: 'view', resource: 'special-programs:ieps' }, requiresActiveSchool: true },
//     ]},
//     { id: 'accommodations', label: 'ACCOMMODATIONS', items: [
//       { id: '504-plans', label: '504 Plans', icon: ShieldCheck, href: '/special-programs/504-plans', permission: { action: 'view', resource: 'special-programs:504' }, requiresActiveSchool: true },
//       { id: 'accommodations', label: 'Accommodations', icon: Settings, href: '/special-programs/accommodations', permission: { action: 'view', resource: 'special-programs:504' }, requiresActiveSchool: true },
//       { id: 'accessibility', label: 'Accessibility Services', icon: Zap, href: '/special-programs/accessibility', permission: { action: 'view', resource: 'special-programs:504' }, requiresActiveSchool: true },
//     ]},
//     { id: 'support', label: 'SUPPORT SERVICES', items: [
//       { id: 'counseling', label: 'Counseling', icon: Users, href: '/special-programs/counseling', permission: { action: 'view', resource: 'special-programs' }, requiresActiveSchool: true },
//       { id: 'interventions', label: 'Interventions', icon: TrendingUp, href: '/special-programs/interventions', permission: { action: 'view', resource: 'special-programs' }, requiresActiveSchool: true },
//     ]},
//   ],
// }
// [/MVP-PARKED]

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
  // [MVP-PARKED] messages: messagesModule,
  // [MVP-PARKED] analytics: analyticsModule,
  'student-portal': studentPortalModule,
  'parent-portal': parentPortalModule,
  // [MVP-PARKED] 'special-programs': specialProgramsModule,
  // [MVP-PARKED] edfi: edfiModule,
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
  // [MVP-PARKED] if (pathname.startsWith('/messages')) return 'messages'
  // [MVP-PARKED] if (pathname.startsWith('/analytics')) return 'analytics'
  if (pathname.startsWith('/student-portal')) return 'student-portal'
  if (pathname.startsWith('/parent-portal')) return 'parent-portal'
  // [MVP-PARKED] if (pathname.startsWith('/special-programs')) return 'special-programs'
  // [MVP-PARKED] if (pathname.startsWith('/edfi')) return 'edfi'
  return 'home'
}

/**
 * Check if a module ID represents a home module variant.
 * Used to determine if we're on a "home" context even with role-specific modules.
 */
export function isHomeModule(moduleId: SidebarModule): boolean {
  return moduleId === 'home' || moduleId === 'home-student' || moduleId === 'home-parent'
}

