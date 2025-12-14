/**
 * Sidebar Module Configuration
 * 
 * Defines navigation items for each module/context with ABAC permissions.
 * The sidebar dynamically renders items based on the active module and user permissions.
 */

import {
  Home,
  GraduationCap,
  DollarSign,
  Users,
  Settings,
  User,
  Palette,
  Bell,
  Shield,
  Link2,
  Building2,
  CreditCard,
  Zap,
  Database,
  Trash2,
  BookOpen,
  Calendar,
  ClipboardList,
  BarChart3,
  type LucideIcon,
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
          id: 'home',
          label: 'Home',
          icon: Home,
          href: '/home',
          permission: { action: 'view', resource: 'dashboard' },
        },
        {
          id: 'academics',
          label: 'Academics',
          icon: GraduationCap,
          href: '/academics',
          permission: { action: 'view', resource: 'students' },
        },
        {
          id: 'finance',
          label: 'Finance',
          icon: DollarSign,
          href: '/finance',
          permission: { action: 'view', resource: 'billing' },
        },
        {
          id: 'people',
          label: 'People',
          icon: Users,
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
          icon: Palette,
          href: '/settings?tab=preferences',
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          href: '/settings?tab=notifications',
        },
        {
          id: 'security',
          label: 'Security',
          icon: Shield,
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
          label: 'General',
          icon: Settings,
          href: '/settings?tab=general',
          permission: { action: 'view', resource: 'settings' },
        },
        {
          id: 'people-settings',
          label: 'People',
          icon: Users,
          href: '/settings?tab=people',
          permission: { action: 'view', resource: 'staff' },
        },
        {
          id: 'schools',
          label: 'Schools',
          icon: Building2,
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
          id: 'delete-account',
          label: 'Delete Account',
          icon: Trash2,
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
          icon: Users,
          href: '/academics/students',
          permission: { action: 'view', resource: 'students' },
          requiresActiveSchool: true,
        },
        {
          id: 'classes',
          label: 'Classes',
          icon: BookOpen,
          href: '/academics/classes',
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
      ],
    },
    {
      id: 'tracking',
      label: 'TRACKING',
      items: [
        {
          id: 'attendance',
          label: 'Attendance',
          icon: Calendar,
          href: '/academics/attendance',
          permission: { action: 'view', resource: 'attendance' },
          requiresActiveSchool: true,
        },
        {
          id: 'grades',
          label: 'Grades',
          icon: BarChart3,
          href: '/academics/grades',
          permission: { action: 'view', resource: 'grades' },
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
          icon: DollarSign,
          href: '/finance',
          permission: { action: 'view', resource: 'billing' },
        },
      ],
    },
    {
      id: 'management',
      label: 'MANAGEMENT',
      items: [
        {
          id: 'billing',
          label: 'Billing',
          icon: CreditCard,
          href: '/finance/billing',
          permission: { action: 'view', resource: 'billing' },
          requiresActiveSchool: true,
        },
        {
          id: 'payroll',
          label: 'Payroll',
          icon: Users,
          href: '/finance/payroll',
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
          label: 'All People',
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
          label: 'Staff',
          icon: User,
          href: '/people/staff',
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

