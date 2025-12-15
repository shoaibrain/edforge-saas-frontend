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

export type SidebarModule = 'home' | 'settings' | 'academics' | 'finance' | 'people'

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
          icon: GraduationCap,
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
          id: '',
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
          href: '/academics/attendance',
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
          href: '/academics/attendance',
          permission: { action: 'view', resource: 'attendance' },
          requiresActiveSchool: true,
        },
                {
          id: 'reporting',
          label: 'Reporting',
          icon: ChartNoAxesCombined,
          href: '/academics/attendance',
          permission: { action: 'view', resource: 'attendance' },
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
  settings: settingsModule,
  academics: academicsModule,
  finance: financeModule,
  people: peopleModule,
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
  return 'home'
}

