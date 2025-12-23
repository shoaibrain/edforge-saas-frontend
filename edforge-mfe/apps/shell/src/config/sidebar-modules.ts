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
  MessageCircleMore,
  User,
  SlidersHorizontal,

  BellDot,
  Component,
  Landmark,
  Layers,
  ShieldCheck,
  Link2,
  School,
  HandCoins,
  UsersRound,
  CreditCard,
  Zap,
  Database,
  TriangleAlert,
  MapPinHouse,
  ClipboardList,
  BarChart3,
  type LucideIcon,
  BrickWallShield,
  Calendars,
  Atom,
  BanknoteArrowDown,
  BanknoteArrowUp,
  ChartNoAxesCombined,
  ClipboardPlus,
  UserStar,
  // New imports for Analytics
  Megaphone,
  Mail,
  TrendingUp,
  PieChart,
  LineChart,
  // Parent Portal
  Home,
  // Meeting Hub
  Video,

  // Student Portal
  BookOpen,
  Calendar,
  FileText,
  // Additional icons
  Baby,
  CheckCircle,
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
  | 'messages'
  | 'analytics'
  | 'parent-portal'
  | 'student-portal'
  | 'special-programs'

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
          id: 'finance',
          label: 'Finance',
          icon: HandCoins,
          href: '/finance',
          permission: { action: 'view', resource: 'billing' },
        },
        {
          id: 'people',
          label: 'People & HR',
          icon: UsersRound,
          href: '/people',
          permission: { action: 'view', resource: 'staff' },
        },
        {
          id: 'messages',
          label: 'Messages',
          icon: MessageCircleMore,
          href: '/messages',
          permission: { action: 'view', resource: 'communications' },
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: BarChart3,
          href: '/analytics',
          permission: { action: 'view', resource: 'analytics' },
        },
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
          href: '/academics/curriculum',
          permission: { action: 'view', resource: 'curriculum' },
        },
        {
          id: 'calendar',
          label: 'School Calendar',
          icon: Calendars,
          href: '/academics/schoolcalendar',
          permission: { action: 'view', resource: 'calendar' },
        },
      ],
    },
    {
      id: 'communication',
      label: 'COMMUNICATION',
      items: [
        {
          id: 'messages',
          label: 'Messages',
          icon: Mail,
          href: '/messages',
          permission: { action: 'view', resource: 'messages' },
        },
        {
          id: 'announcements',
          label: 'Announcements',
          icon: Megaphone,
          href: '/messages/announcements',
          permission: { action: 'view', resource: 'announcements' },
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
          href: '/academics/schoolcalendar',
          permission: { action: 'view', resource: 'calendar' },
        },
      ],
    },
    {
      id: 'communication',
      label: 'COMMUNICATION',
      items: [
        {
          id: 'messages',
          label: 'Messages',
          icon: Mail,
          href: '/messages',
          permission: { action: 'view', resource: 'messages' },
        },
        {
          id: 'announcements',
          label: 'Announcements',
          icon: Megaphone,
          href: '/messages/announcements',
          permission: { action: 'view', resource: 'announcements' },
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
// SETTINGS MODULE - Account and workspace settings
// ============================================================================

const settingsModule: ModuleConfig = {
  id: 'settings',
  title: 'Settings',
  icon: Settings,
  backTo: { path: '/home', label: 'Back to Home' },
  groups: [
    {
      id: 'overview',
      items: [
        {
          id: 'settings-home',
          label: 'Overview',
          icon: GalleryVerticalEnd,
          href: '/settings',
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
          icon: User,
          href: '/settings/account',
          // No permission needed - all users can access their own profile
        },
        {
          id: 'preferences',
          label: 'Preferences',
          icon: SlidersHorizontal,
          href: '/settings/preferences',
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: BellDot,
          href: '/settings/notifications',
        },
        {
          id: 'security',
          label: 'Security',
          icon: ShieldCheck,
          href: '/settings/security',
        },
        {
          id: 'connections',
          label: 'Connections',
          icon: Link2,
          href: '/settings/connections',
        },
      ],
    },
    {
      id: 'workspace',
      label: 'WORKSPACE',
      items: [
        {
          id: 'general',
          label: 'General Settings',
          icon: Settings,
          href: '/settings/general',
          permission: { action: 'view', resource: 'settings' },
        },
        {
          id: 'system-access-policy',
          label: 'Access Policy',
          icon: BrickWallShield,
          href: '/settings/people',
          permission: { action: 'view', resource: 'staff' },
        },
        {
          id: 'schools',
          label: 'Schools',
          icon: School,
          href: '/settings/schools',
          permission: { action: 'view', resource: 'settings:school' },
        },
        {
          id: 'billing',
          label: 'Billing',
          icon: CreditCard,
          href: '/settings/billing',
          permission: { action: 'manage', resource: 'settings:tenant' },
          tenantRoles: ['TenantAdmin'],
        },
        {
          id: 'integrations',
          label: 'Integrations',
          icon: Zap,
          href: '/settings/integrations',
          permission: { action: 'manage', resource: 'settings:tenant' },
          tenantRoles: ['TenantAdmin'],
        },
        {
          id: 'data',
          label: 'Import/Export',
          icon: Database,
          href: '/settings/data',
          permission: { action: 'manage', resource: 'settings:tenant' },
          tenantRoles: ['TenantAdmin'],
        },
      ],
    },
    {
      id: 'danger',
      items: [
        {
          id: 'danger-zone',
          label: 'Danger Zone',
          icon: TriangleAlert,
          href: '/settings/danger',
          variant: 'danger',
        },
      ],
    },
  ],
}

// ============================================================================
// ACADEMICS MODULE - Academic management
// ============================================================================

const academicsModule: ModuleConfig = {
  id: 'academics',
  title: 'Academics',
  icon: GraduationCap,
  backTo: { path: '/home', label: 'Back to Home' },
  groups: [
    {
      id: 'overview',
      items: [
        {
          id: 'academics-home',
          label: 'Overview',
          icon: GalleryVerticalEnd,
          href: '/academics',
          permission: { action: 'view', resource: 'students' },
        },
      ],
    },
    {
      id: 'students',
      label: 'STUDENTS',
      items: [
        {
          id: 'students-directory',
          label: 'Student Directory',
          icon: UsersRound,
          href: '/academics/students',
          permission: { action: 'view', resource: 'students' },
          requiresActiveSchool: true,
        },
        {
          id: 'enrollment',
          label: 'Enrollment',
          icon: Atom,
          href: '/academics/students/enrollment',
          permission: { action: 'view', resource: 'curriculum' },
          requiresActiveSchool: true,
        },
        {
          id: 'student-profiles',
          label: 'Student Profiles',
          icon: User,
          href: '/academics/students/profiles',
          permission: { action: 'view', resource: 'students' },
          requiresActiveSchool: true,
        },
      ],
    },
    {
      id: 'classes',
      label: 'CLASSES & SCHEDULING',
      items: [
        {
          id: 'classrooms',
          label: 'Classrooms',
          icon: MapPinHouse,
          href: '/academics/classrooms',
          permission: { action: 'view', resource: 'classes' },
          requiresActiveSchool: true,
        },
        {
          id: 'schedules',
          label: 'Class Schedules',
          icon: Calendar,
          href: '/academics/schedules',
          permission: { action: 'view', resource: 'classes' },
          requiresActiveSchool: true,
        },
        {
          id: 'timetables',
          label: 'Timetables',
          icon: Calendar,
          href: '/academics/timetables',
          permission: { action: 'view', resource: 'classes' },
          requiresActiveSchool: true,
        },
      ],
    },
    {
      id: 'curriculum',
      label: 'CURRICULUM',
      items: [
        {
          id: 'grade-levels',
          label: 'Grade Levels',
          icon: Layers,
          href: '/academics/grade-levels',
          permission: { action: 'view', resource: 'students' },
          requiresActiveSchool: true,
        },
        {
          id: 'courses',
          label: 'Courses',
          icon: BookOpen,
          href: '/academics/courses',
          permission: { action: 'view', resource: 'curriculum' },
          requiresActiveSchool: true,
        },
        {
          id: 'standards',
          label: 'Standards',
          icon: ClipboardList,
          href: '/academics/standards',
          permission: { action: 'view', resource: 'curriculum' },
          requiresActiveSchool: true,
        },
      ],
    },
    {
      id: 'assessment',
      label: 'ASSESSMENT',
      items: [
        {
          id: 'gradebooks',
          label: 'Gradebooks',
          icon: GraduationCap,
          href: '/academics/gradebooks',
          permission: { action: 'view', resource: 'grades' },
          requiresActiveSchool: true,
        },
        {
          id: 'assessments',
          label: 'Assessments',
          icon: FileText,
          href: '/academics/assessments',
          permission: { action: 'view', resource: 'assessments' },
          requiresActiveSchool: true,
        },
        {
          id: 'exams',
          label: 'Exams',
          icon: FileText,
          href: '/academics/exams',
          permission: { action: 'view', resource: 'assessments' },
          requiresActiveSchool: true,
        },
      ],
    },
    {
      id: 'tracking',
      label: 'TRACKING',
      items: [
        {
          id: 'attendance',
          label: 'Student Attendance',
          icon: ClipboardPlus,
          href: '/academics/attendance',
          permission: { action: 'view', resource: 'attendance' },
          requiresActiveSchool: true,
        },
        {
          id: 'academic-calendar',
          label: 'Academic Calendar',
          icon: Calendars,
          href: '/academics/calendar',
          permission: { action: 'view', resource: 'curriculum' },
          requiresActiveSchool: true,
        },
      ],
    },

  ],
}

// ============================================================================
// FINANCE MODULE - Financial management
// ============================================================================

const financeModule: ModuleConfig = {
  id: 'finance',
  title: 'Finance & Billing',
  icon: DollarSign,
  backTo: { path: '/home', label: 'Back to Home' },
  groups: [
    {
      id: 'overview',
      items: [
        {
          id: 'finance-home',
          label: 'Overview',
          icon: GalleryVerticalEnd,
          // TODO: Refactor for the path and page and routing /hr instead of /finance
          href: '/finance',
          permission: { action: 'view', resource: 'billing' },
        },
      ],
    },

    {
      id: 'accounting',
      label: 'ACCOUNTING',
      items: [
        {
          id: 'general-ledger',
          label: 'General Ledger',
          icon: Landmark,
          href: '/finance/accounting/general-ledger',
          permission: { action: 'view', resource: 'billing' },
          requiresActiveSchool: true,
        },
        {
          id: 'accounts-payable',
          label: 'Accounts Payable',
          icon: BanknoteArrowDown,
          href: '/finance/accounting/accounts-payable',
          permission: { action: 'view', resource: 'billing' },
          requiresActiveSchool: true,
        },
        {
          id: 'accounts-receivable',
          label: 'Accounts Receivable',
          icon: BanknoteArrowUp,
          href: '/finance/accounting/accounts-receivable',
          permission: { action: 'view', resource: 'billing' },
          requiresActiveSchool: true,
        },
      ],
    },
    {
      id: 'billing',
      label: 'BILLING',
      items: [
        {
          id: 'tuition-fees',
          label: 'Tuition & Fees',
          icon: BanknoteArrowUp,
          href: '/finance/billing/tuition-fees',
          permission: { action: 'view', resource: 'billing' },
          requiresActiveSchool: true,
        },
        {
          id: 'fee-structures',
          label: 'Fee Structures',
          icon: Layers,
          href: '/finance/billing/fee-structures',
          permission: { action: 'view', resource: 'billing' },
          requiresActiveSchool: true,
        },
        {
          id: 'collections',
          label: 'Collections',
          icon: CreditCard,
          href: '/finance/billing/collections',
          permission: { action: 'view', resource: 'billing' },
          requiresActiveSchool: true,
        },
      ],
    },
    {
      id: 'expenses',
      label: 'EXPENSES',
      items: [
        {
          id: 'expense-tracking',
          label: 'Expense Tracking',
          icon: ClipboardList,
          href: '/finance/expenses',
          permission: { action: 'view', resource: 'expenses' },
          requiresActiveSchool: true,
        },
        {
          id: 'approvals',
          label: 'Approvals',
          icon: CheckCircle,
          href: '/finance/expenses/approvals',
          permission: { action: 'view', resource: 'expenses' },
          requiresActiveSchool: true,
        },
        {
          id: 'budgets',
          label: 'Budgets',
          icon: BarChart3,
          href: '/finance/expenses/budgets',
          permission: { action: 'view', resource: 'expenses' },
          requiresActiveSchool: true,
        },
      ],
    },
    {
      id: 'reports',
      label: 'REPORTS',
      items: [
        {
          id: 'financial-reports',
          label: 'Financial Reports',
          icon: BarChart3,
          href: '/finance/reports',
          permission: { action: 'view', resource: 'reports:finance' },
          requiresActiveSchool: true,
        },
        {
          id: 'audit-trail',
          label: 'Audit Trail',
          icon: Database,
          href: '/finance/reports/audit-trail',
          permission: { action: 'view', resource: 'reports:finance' },
          requiresActiveSchool: true,
        },
      ],
    },
  ],
}

// ============================================================================
// PEOPLE MODULE - Staff and user management
// ============================================================================

const peopleModule: ModuleConfig = {
  id: 'people',
  title: 'People & HR',
  icon: Users,
  backTo: { path: '/home', label: 'Back to Home' },
  groups: [
    {
      id: 'overview',
      items: [
        {
          id: 'people-home',
          label: 'Overview',
          icon: Users,
          href: '/people',
          permission: { action: 'view', resource: 'staff' },
        },
      ],
    },
    {
      id: 'staff',
      label: 'STAFF',
      items: [
        {
          id: 'staff-directory',
          label: 'Staff Directory',
          icon: UsersRound,
          href: '/people/staff',
          permission: { action: 'view', resource: 'staff' },
          requiresActiveSchool: true,
        },
        {
          id: 'department',
          label: 'Department',
          icon: Component,
          href: '/people/department',
          permission: { action: 'view', resource: 'staff' },
          requiresActiveSchool: true,
        },
        //TODO: Complete the implementation for routing and navigation
        {
          id: 'parents',
          label: 'Parents',
          icon: UserStar,
          href: '/people/parents',
          permission: { action: 'view', resource: 'staff' },
          requiresActiveSchool: true,
        },
      ],
    },
    {
      id: 'human-resources',
      label: 'HUMAN RESOURCES',
      items: [
        {
          id: 'payroll',
          label: 'Payroll',
          icon: BanknoteArrowDown,
          href: '/people/hr/payroll',
          permission: { action: 'view', resource: 'payroll' },
          requiresActiveSchool: true,
        },
        {
          id: 'contracts',
          label: 'Contracts',
          icon: FileText,
          href: '/people/hr/contracts',
          permission: { action: 'view', resource: 'staff' },
          requiresActiveSchool: true,
        },
        {
          id: 'professional-development',
          label: 'Professional Development',
          icon: GraduationCap,
          href: '/people/hr/professional-development',
          permission: { action: 'view', resource: 'staff' },
          requiresActiveSchool: true,
        },
        {
          id: 'performance-reviews',
          label: 'Performance Reviews',
          icon: BarChart3,
          href: '/people/hr/performance-reviews',
          permission: { action: 'view', resource: 'staff' },
          requiresActiveSchool: true,
        },
        {
          id: 'staff-attendance',
          label: 'Staff Attendance',
          icon: ClipboardPlus,
          href: '/people/hr/attendance',
          permission: { action: 'view', resource: 'attendance' },
          requiresActiveSchool: true,
        },
      ],
    },
    {
      id: 'tasks',
      label: 'TASKS & DUTIES',
      items: [
        {
          id: 'staff-tasks',
          label: 'Staff Tasks',
          icon: ClipboardList,
          href: '/people/tasks',
          permission: { action: 'view', resource: 'staff:assignments' },
          requiresActiveSchool: true,
        },
        {
          id: 'duty-assignments',
          label: 'Duty Assignments',
          icon: ClipboardList,
          href: '/people/tasks/assignments',
          permission: { action: 'view', resource: 'staff:assignments' },
          requiresActiveSchool: true,
        },
      ],
    },
    {
      id: 'parents',
      label: 'PARENTS & GUARDIANS',
      items: [
        {
          id: 'parents-directory',
          label: 'Parent Directory',
          icon: UserStar,
          href: '/people/parents',
          permission: { action: 'view', resource: 'staff' },
          requiresActiveSchool: true,
        },
        {
          id: 'reporting',
          label: 'Reporting',
          icon: ChartNoAxesCombined,
          href: '/people/reporting',
          permission: { action: 'view', resource: 'attendance' },
          requiresActiveSchool: true,
        },
      ],
    },
  ],
}

// ============================================================================

// ============================================================================
// ANALYTICS MODULE - Data insights and reports
// ============================================================================

const analyticsModule: ModuleConfig = {
  id: 'analytics',
  title: 'Analytics',
  icon: BarChart3,
  backTo: { path: '/home', label: 'Back to Home' },
  groups: [
    {
      id: 'overview',
      items: [
        {
          id: 'analytics-home',
          label: 'Overview',
          icon: GalleryVerticalEnd,
          href: '/analytics',
          permission: { action: 'view', resource: 'analytics' },
        },
      ],
    },
    {
      id: 'insights',
      label: 'INSIGHTS',
      items: [
        {
          id: 'academic-analytics',
          label: 'Academic Performance',
          icon: GraduationCap,
          href: '/analytics/academic',
          permission: { action: 'view', resource: 'analytics:academic' },
          requiresActiveSchool: true,
        },
        {
          id: 'attendance-analytics',
          label: 'Attendance',
          icon: ClipboardPlus,
          href: '/analytics/attendance',
          permission: { action: 'view', resource: 'analytics:attendance' },
          requiresActiveSchool: true,
        },
        {
          id: 'financial-analytics',
          label: 'Financial',
          icon: DollarSign,
          href: '/analytics/financial',
          permission: { action: 'view', resource: 'analytics:financial' },
          requiresActiveSchool: true,
        },
        {
          id: 'enrollment-analytics',
          label: 'Enrollment Trends',
          icon: TrendingUp,
          href: '/analytics/enrollment',
          permission: { action: 'view', resource: 'enrollment' },
          requiresActiveSchool: true,
        },
      ],
    },
    {
      id: 'reports',
      label: 'REPORTS',
      items: [
        {
          id: 'comparisons',
          label: 'Comparative Analysis',
          icon: LineChart,
          href: '/analytics/comparisons',
          permission: { action: 'view', resource: 'analytics' },
          requiresActiveSchool: true,
        },
        {
          id: 'custom-reports',
          label: 'Custom Reports',
          icon: PieChart,
          href: '/analytics/custom',
          permission: { action: 'view', resource: 'reports:finance' },
          requiresActiveSchool: true,
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
      id: 'overview',
      items: [
        {
          id: 'portal-home',
          label: 'Dashboard',
          icon: Home,
          href: '/student-portal',
          permission: { action: 'view', resource: 'student-portal' },
        },
      ],
    },
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
      id: 'communication',
      label: 'COMMUNICATION',
      items: [
        {
          id: 'messages-portal',
          label: 'Messages',
          icon: Mail,
          href: '/communications/messages',
          permission: { action: 'view', resource: 'messages' },
        },
        {
          id: 'announcements-portal',
          label: 'Announcements',
          icon: Megaphone,
          href: '/communications/announcements',
          permission: { action: 'view', resource: 'announcements' },
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
      id: 'overview',
      items: [
        {
          id: 'portal-home',
          label: 'Dashboard',
          icon: Home,
          href: '/parent-portal',
          permission: { action: 'view', resource: 'parent-portal' },
        },
      ],
    },
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
    {
      id: 'communication',
      label: 'COMMUNICATION',
      items: [
        {
          id: 'messages-portal',
          label: 'Messages',
          icon: Mail,
          href: '/communications/messages',
          permission: { action: 'view', resource: 'messages' },
        },
        {
          id: 'announcements-portal',
          label: 'Announcements',
          icon: Megaphone,
          href: '/communications/announcements',
          permission: { action: 'view', resource: 'announcements' },
        },
      ],
    },
  ],
}

// ============================================================================
// MODULE REGISTRY
// ============================================================================


// ============================================================================
// MESSAGES MODULE - Communication hub
// ============================================================================

const messagesModule: ModuleConfig = {
  id: 'messages',
  title: 'Messages',
  icon: MessageCircleMore,
  backTo: { path: '/home', label: 'Back to Home' },
  groups: [
    {
      id: 'overview',
      items: [
        {
          id: 'messages-home',
          label: 'Overview',
          icon: GalleryVerticalEnd,
          href: '/messages',
          permission: { action: 'view', resource: 'communications' },
        },
      ],
    },
    {
      id: 'communication',
      label: 'COMMUNICATION',
      items: [
        {
          id: 'inbox',
          label: 'Inbox',
          icon: Mail,
          href: '/messages/inbox',
          badge: 12, // Mock badge count
          permission: { action: 'view', resource: 'communications' },
        },
        {
          id: 'announcements',
          label: 'Announcements',
          icon: Megaphone,
          href: '/messages/announcements',
          permission: { action: 'view', resource: 'announcements' },
        },
      ],
    },
    {
      id: 'tools',
      label: 'TOOLS',
      items: [
        {
          id: 'meetings',
          label: 'Meetings',
          icon: Video,
          href: '/messages/meetings',
          permission: { action: 'view', resource: 'communications' },
        },
        // Note: Integrations moved to Settings module for proper one-time configuration
      ],
    },
  ],
}

// ============================================================================
// SPECIAL PROGRAMS MODULE - Special education and accommodations
// ============================================================================

const specialProgramsModule: ModuleConfig = {
  id: 'special-programs',
  title: 'Special Programs',
  icon: ShieldCheck,
  backTo: { path: '/home', label: 'Back to Home' },
  groups: [
    {
      id: 'overview',
      items: [
        {
          id: 'special-programs-home',
          label: 'Overview',
          icon: GalleryVerticalEnd,
          href: '/special-programs',
          permission: { action: 'view', resource: 'special-programs' },
        },
      ],
    },
    {
      id: 'special-education',
      label: 'SPECIAL EDUCATION',
      items: [
        {
          id: 'ieps',
          label: 'IEPs',
          icon: FileText,
          href: '/special-programs/ieps',
          permission: { action: 'view', resource: 'special-programs:ieps' },
          requiresActiveSchool: true,
        },
        {
          id: 'iep-meetings',
          label: 'IEP Meetings',
          icon: Calendar,
          href: '/special-programs/ieps/meetings',
          permission: { action: 'view', resource: 'special-programs:ieps' },
          requiresActiveSchool: true,
        },
        {
          id: 'iep-goals',
          label: 'Goals & Objectives',
          icon: TrendingUp,
          href: '/special-programs/ieps/goals',
          permission: { action: 'view', resource: 'special-programs:ieps' },
          requiresActiveSchool: true,
        },
      ],
    },
    {
      id: 'accommodations',
      label: 'ACCOMMODATIONS',
      items: [
        {
          id: '504-plans',
          label: '504 Plans',
          icon: ShieldCheck,
          href: '/special-programs/504-plans',
          permission: { action: 'view', resource: 'special-programs:504' },
          requiresActiveSchool: true,
        },
        {
          id: 'accommodations',
          label: 'Accommodations',
          icon: Settings,
          href: '/special-programs/accommodations',
          permission: { action: 'view', resource: 'special-programs:504' },
          requiresActiveSchool: true,
        },
        {
          id: 'accessibility',
          label: 'Accessibility Services',
          icon: Zap,
          href: '/special-programs/accessibility',
          permission: { action: 'view', resource: 'special-programs:504' },
          requiresActiveSchool: true,
        },
      ],
    },
    {
      id: 'support',
      label: 'SUPPORT SERVICES',
      items: [
        {
          id: 'counseling',
          label: 'Counseling',
          icon: Users,
          href: '/special-programs/counseling',
          permission: { action: 'view', resource: 'special-programs' },
          requiresActiveSchool: true,
        },
        {
          id: 'interventions',
          label: 'Interventions',
          icon: TrendingUp,
          href: '/special-programs/interventions',
          permission: { action: 'view', resource: 'special-programs' },
          requiresActiveSchool: true,
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
  messages: messagesModule,
  analytics: analyticsModule,
  'student-portal': studentPortalModule,
  'parent-portal': parentPortalModule,
  'special-programs': specialProgramsModule,
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
  if (pathname.startsWith('/messages')) return 'messages'
  if (pathname.startsWith('/analytics')) return 'analytics'
  if (pathname.startsWith('/student-portal')) return 'student-portal'
  if (pathname.startsWith('/parent-portal')) return 'parent-portal'
  if (pathname.startsWith('/special-programs')) return 'special-programs'
  return 'home'
}

/**
 * Check if a module ID represents a home module variant.
 * Used to determine if we're on a "home" context even with role-specific modules.
 */
export function isHomeModule(moduleId: SidebarModule): boolean {
  return moduleId === 'home' || moduleId === 'home-student' || moduleId === 'home-parent'
}

