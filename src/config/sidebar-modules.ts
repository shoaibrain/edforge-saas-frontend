/**
 * Sidebar Module Configuration
 * 
 * Defines navigation items for each module/context with ABAC permissions.
 * The sidebar dynamically renders items based on the active module and user permissions.
 */

import {
  GraduationCap,
  DollarSign,
  Users,
  Settings,
  User,
  SlidersHorizontal,
  ContactRound,
  BellDot,
  Component,
  Landmark,
  View,
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
  ChartNoAxesGantt,
  BanknoteArrowDown,
  BanknoteArrowUp,
  ChartNoAxesCombined,
  ClipboardPlus,
  UserStar,
  // New imports for Communications & Analytics
  MessageSquare,
  Megaphone,
  Mail,
  Send,
  Inbox,
  TrendingUp,
  PieChart,
  LineChart,
  // Parent Portal
  Home,
} from 'lucide-react'
import type { Action, Resource } from '@/lib/abac'
import type { GlobalRole } from '@/types/auth'

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

export type SidebarModule = 'home' | 'settings' | 'academics' | 'finance' | 'people' | 'communications' | 'analytics' | 'parent-portal'

// ============================================================================
// HOME MODULE - Main dashboard navigation
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
          id: 'human-resource',
          label: 'Financials',
          icon: HandCoins,
          href: '/finance',
          permission: { action: 'view', resource: 'billing' },
        },
        {
          id: 'people',
          label: 'My People',
          icon: UsersRound,
          href: '/people',
          permission: { action: 'view', resource: 'staff' },
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: BarChart3,
          href: '/analytics',
          permission: { action: 'view', resource: 'analytics' },
        },
        {
          id: 'communications',
          label: 'Communications',
          icon: MessageSquare,
          href: '/communications',
          permission: { action: 'view', resource: 'communications' },
        },
        {
          id: 'parent-portal',
          label: 'Parent Portal',
          icon: Home,
          href: '/parent-portal',
          permission: { action: 'view', resource: 'parent-portal' },
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
          icon: View,
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
          href: '/settings?tab=account',
          // No permission needed - all users can access their own profile
        },
        {
          id: 'preferences',
          label: 'Preferences',
          icon: SlidersHorizontal,
          href: '/settings?tab=preferences',
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: BellDot,
          href: '/settings?tab=notifications',
        },
        {
          id: 'security',
          label: 'Security',
          icon: ShieldCheck,
          href: '/settings?tab=security',
        },
        {
          id: 'connections',
          label: 'Connections',
          icon: Link2,
          href: '/settings?tab=connections',
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
          href: '/settings?tab=general',
          permission: { action: 'view', resource: 'settings' },
        },
        {
          id: 'system-access-policy',
          label: 'Access Policy',
          icon: BrickWallShield,
          href: '/settings?tab=people',
          permission: { action: 'view', resource: 'staff' },
        },
        {
          id: 'schools',
          label: 'Schools',
          icon: School,
          href: '/settings?tab=schools',
          permission: { action: 'view', resource: 'settings:school' },
        },
        {
          id: 'billing',
          label: 'Billing',
          icon: CreditCard,
          href: '/settings?tab=billing',
          permission: { action: 'manage', resource: 'settings:tenant' },
          tenantRoles: ['TenantAdmin'],
        },
        {
          id: 'integrations',
          label: 'Integrations',
          icon: Zap,
          href: '/settings?tab=integrations',
          permission: { action: 'manage', resource: 'settings:tenant' },
          tenantRoles: ['TenantAdmin'],
        },
        {
          id: 'data',
          label: 'Import/Export',
          icon: Database,
          href: '/settings?tab=data',
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
          href: '/settings?tab=danger',
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
          icon: GraduationCap,
          href: '/academics',
          permission: { action: 'view', resource: 'students' },
        },
      ],
    },
    {
      id: 'management',
      label: 'MANAGEMENT',
      items: [
        {
          id: 'students',
          label: 'Students',
          icon: UsersRound,
          href: '/academics/students',
          permission: { action: 'view', resource: 'students' },
          requiresActiveSchool: true,
        },
        // TODO: review and complete the implementation.
        // For Enrollment
        // Review and make sure all the routing, navigation and pages implementation is complete. 
        {
          id: 'enrollment',
          label: 'Enrollment',
          icon: Atom,
          href: '/academics/enrollment',
          permission: { action: 'view', resource: 'curriculum' },
          requiresActiveSchool: true,
        },
        //TODO: Review this url and application path and make sure the 
        // routing and navigation is correctly and completly implemented.
        {
          id: 'teachers',
          label: 'Teachers',
          icon: ContactRound,
          href: '/academics/teachers',
          permission: { action: 'view', resource: 'students' },
          requiresActiveSchool: true,
        },
        {
          id: 'gradelevels',
          label: 'Grade Levels',
          icon: Layers,
          href: '/academics/gradelevels',
          permission: { action: 'view', resource: 'students' },
          requiresActiveSchool: true,
        },
        // TODO: Implement routing and navigation
        {
          id: 'classrooms',
          label: 'Classrooms',
          icon: MapPinHouse,
          href: '/academics/classrooms',
          permission: { action: 'view', resource: 'classes' },
          requiresActiveSchool: true,
        },
        {
          id: 'curriculum',
          label: 'Curriculum',
          icon: ClipboardList,
          href: '/academics/curriculum',
          permission: { action: 'view', resource: 'curriculum' },
          requiresActiveSchool: true,
        },
        {
          id: 'gradebook',
          label: 'Gradebook',
          icon: GraduationCap,
          href: '/academics/grades',
          permission: { action: 'view', resource: 'grades' },
          requiresActiveSchool: true,
        },
        // TODO: review and complete the implementation.
        // this is the page for user to view, manage the academic calendars for each academic year
        // that will apply to their school in edforge. here, user should be able to securely and effectively 
        // manage and ogranize their school academic calendar - like academic year window, terms.
        // Review and make sure all the routing, navigation and pages implementation is complete. 
        {
          id: 'school-calendar',
          label: 'School Calendar',
          icon: Calendars,
          href: '/academics/schoolcalendar',
          permission: { action: 'view', resource: 'curriculum' },
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
          label: 'Attendance',
          icon: ClipboardPlus,
          href: '/academics/attendance',
          permission: { action: 'view', resource: 'attendance' },
          requiresActiveSchool: true,
        },
                {
          id: 'reporting',
          label: 'Reporting',
          icon: ChartNoAxesCombined,
          href: '/academics/reporting',
          permission: { action: 'view', resource: 'attendance' },
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
  title: 'Finance',
  icon: DollarSign,
  backTo: { path: '/home', label: 'Back to Home' },
  groups: [
    {
      id: 'overview',
      items: [
        {
          id: 'finance-home',
          label: 'Overview',
          icon: ChartNoAxesGantt,
          // TODO: Refactor for the path and page and routing /hr instead of /finance
          href: '/finance',
          permission: { action: 'view', resource: 'billing' },
        },
      ],
    },

    {
      id: 'management',
      label: 'MANAGEMENT',
      items: [
        // TODO: Refactor and compelte the implementation for /hr
        {
          id: 'financials',
          label: 'Financials',
          icon: Landmark,
          href: '/finance/financials',
          permission: { action: 'view', resource: 'billing' },
          requiresActiveSchool: true,
        },
        // TODO /hr from /finance
        {
          id: 'payroll',
          label: 'Payroll',
          icon: BanknoteArrowDown,
          href: '/finance/payroll',
          permission: { action: 'view', resource: 'payroll' },
          requiresActiveSchool: true,
        },
        // TODO: Complete the implementation routing and pages navigation
        {
          id: 'tuitionsandfees',
          label: 'Tuition Fees',
          icon: BanknoteArrowUp,
          href: '/finance/tuitionandfees',
          permission: { action: 'view', resource: 'payroll' },
          requiresActiveSchool: true,
        },
        {
          id: 'expenses',
          label: 'Expenses',
          icon: ClipboardList,
          href: '/finance/expenses',
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
          id: 'finance-reports',
          label: 'Reports',
          icon: BarChart3,
          href: '/finance/reports',
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
  title: 'People',
  icon: Users,
  backTo: { path: '/home', label: 'Back to Home' },
  groups: [
    {
      id: 'overview',
      items: [
        {
          id: 'people-home',
          label: 'My People',
          icon: Users,
          href: '/people',
          permission: { action: 'view', resource: 'staff' },
        },
      ],
    },
    {
      id: 'management',
      label: 'MANAGEMENT',
      items: [
        {
          id: 'staff',
          label: 'Colleague',
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
        {
          id: 'assignments',
          label: 'Assignments',
          icon: ClipboardList,
          href: '/people/assignments',
          permission: { action: 'view', resource: 'staff:assignments' },
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
          label: 'Attendance',
          icon: ClipboardPlus,
          href: '/people/attendance',
          permission: { action: 'view', resource: 'attendance' },
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
// COMMUNICATIONS MODULE - Messaging and announcements
// ============================================================================

const communicationsModule: ModuleConfig = {
  id: 'communications',
  title: 'Communications',
  icon: MessageSquare,
  backTo: { path: '/home', label: 'Back to Home' },
  groups: [
    {
      id: 'overview',
      items: [
        {
          id: 'communications-home',
          label: 'Overview',
          icon: MessageSquare,
          href: '/communications',
          permission: { action: 'view', resource: 'communications' },
        },
      ],
    },
    {
      id: 'channels',
      label: 'CHANNELS',
      items: [
        {
          id: 'announcements',
          label: 'Announcements',
          icon: Megaphone,
          href: '/communications/announcements',
          permission: { action: 'view', resource: 'announcements' },
          requiresActiveSchool: true,
        },
        {
          id: 'messages',
          label: 'Messages',
          icon: Mail,
          href: '/communications/messages',
          permission: { action: 'view', resource: 'messages' },
          requiresActiveSchool: true,
        },
        {
          id: 'inbox',
          label: 'Inbox',
          icon: Inbox,
          href: '/communications/inbox',
          permission: { action: 'view', resource: 'messages' },
          requiresActiveSchool: true,
        },
        {
          id: 'sent',
          label: 'Sent',
          icon: Send,
          href: '/communications/sent',
          permission: { action: 'view', resource: 'messages' },
          requiresActiveSchool: true,
        },
      ],
    },
    {
      id: 'notifications',
      label: 'NOTIFICATIONS',
      items: [
        {
          id: 'notifications-list',
          label: 'Notifications',
          icon: BellDot,
          href: '/communications/notifications',
          permission: { action: 'view', resource: 'notifications' },
        },
      ],
    },
  ],
}

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
          icon: BarChart3,
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
// PARENT PORTAL MODULE - For parents/guardians
// ============================================================================

const parentPortalModule: ModuleConfig = {
  id: 'parent-portal',
  title: 'Parent Portal',
  icon: Home,
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
          permission: { action: 'view', resource: 'parent-portal' },
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

export const SIDEBAR_MODULES: Record<SidebarModule, ModuleConfig> = {
  home: homeModule,
  settings: settingsModule,
  academics: academicsModule,
  finance: financeModule,
  people: peopleModule,
  communications: communicationsModule,
  analytics: analyticsModule,
  'parent-portal': parentPortalModule,
}

/**
 * Get module config by ID
 */
export function getModuleConfig(moduleId: SidebarModule): ModuleConfig {
  return SIDEBAR_MODULES[moduleId]
}

/**
 * Detect which module should be active based on pathname
 */
export function detectModuleFromPath(pathname: string): SidebarModule {
  if (pathname.startsWith('/settings')) return 'settings'
  if (pathname.startsWith('/academics')) return 'academics'
  if (pathname.startsWith('/finance')) return 'finance'
  if (pathname.startsWith('/people')) return 'people'
  if (pathname.startsWith('/communications')) return 'communications'
  if (pathname.startsWith('/analytics')) return 'analytics'
  if (pathname.startsWith('/parent-portal')) return 'parent-portal'
  return 'home'
}

