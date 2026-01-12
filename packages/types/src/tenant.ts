/**
 * Tenant and School Types
 * Multi-tenant configuration for EdForge EMIS
 */

/**
 * Represents a tenant (district/organization) in the multi-tenant system
 */
export interface Tenant {
  id: string
  name: string
  subdomain: string
  /** List of school IDs belonging to this tenant */
  schools: string[]
  /** Active school year for this tenant */
  activeSchoolYear: string
  /** Tenant-level feature flags */
  features?: TenantFeatures
  /** Custom branding */
  branding?: TenantBranding
  /** Integration configurations */
  integrations?: TenantIntegrations
}

/**
 * Feature flags that can be enabled/disabled per tenant
 */
export interface TenantFeatures {
  edfiEnabled?: boolean
  googleWorkspaceEnabled?: boolean
  microsoftEnabled?: boolean
  smsNotifications?: boolean
  advancedAnalytics?: boolean
}

/**
 * Custom branding per tenant
 */
export interface TenantBranding {
  logoUrl?: string
  primaryColor?: string
  accentColor?: string
  faviconUrl?: string
}

/**
 * Integration configurations per tenant
 */
export interface TenantIntegrations {
  edfi?: {
    odsUrl: string
    apiVersion: string
    schoolYear: string
  }
  google?: {
    domain: string
    adminEmail: string
  }
  microsoft?: {
    tenantId: string
  }
}

/**
 * Represents a school within a tenant
 */
export interface School {
  id: string
  tenantId: string
  name: string
  code: string
  address?: SchoolAddress
  phone?: string
  email?: string
  type?: 'elementary' | 'middle' | 'high' | 'k12' | 'other'
  /** Active status */
  isActive: boolean
}

/**
 * School address structure
 */
export interface SchoolAddress {
  street1: string
  street2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

/**
 * School year configuration
 */
export interface SchoolYear {
  id: string
  name: string // e.g., "2024-2025"
  startDate: string
  endDate: string
  isCurrent: boolean
  terms?: Term[]
}

/**
 * Academic term within a school year
 */
export interface Term {
  id: string
  name: string // e.g., "Fall Semester", "Q1"
  startDate: string
  endDate: string
  type: 'semester' | 'trimester' | 'quarter' | 'custom'
}

// ============================================================================
// WORKSPACE SETTINGS (Tenant-Level Configuration)
// ============================================================================

/**
 * Tenant-level workspace settings that apply organization-wide
 * Schools can override these settings at the school level
 */
export interface WorkspaceSettings {
  tenantId: string
  /** Regional settings */
  regional: {
    defaultTimezone: string
    defaultLocale: string
    defaultDateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
    defaultTimeFormat: '12h' | '24h'
    defaultWeekStartsOn: 'sunday' | 'monday'
  }
  /** Academic calendar defaults */
  calendar: {
    defaultAcademicYearStart: string // e.g., "08-15" (month-day)
    defaultAcademicYearEnd: string   // e.g., "06-15"
    defaultTermStructure: 'semester' | 'trimester' | 'quarter'
  }
  /** Organization branding */
  branding: {
    organizationName: string
    logoUrl?: string
    primaryColor?: string
    accentColor?: string
  }
  /** Policy defaults */
  policies: {
    defaultGradingScale: 'letter' | 'percentage' | 'points' | 'custom'
    defaultAttendancePolicy: 'daily' | 'period' | 'both'
  }
  /** Lock status - prevents changes when academic year is active */
  isLocked: boolean
  lockReason?: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// SCHOOL CONFIGURATION
// ============================================================================

/**
 * Operating hours for a school on a specific day
 */
export interface OperatingHours {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = Sunday
  isOpen: boolean
  openTime?: string  // e.g., "08:00"
  closeTime?: string // e.g., "15:30"
}

/**
 * School-specific configuration that can override workspace defaults
 */
export interface SchoolConfiguration {
  schoolId: string
  /** Identity */
  identity: {
    displayName: string
    shortCode: string
    schoolType: 'elementary' | 'middle' | 'high' | 'k12' | 'other'
    logoUrl?: string
    website?: string
  }
  /** Location & Contact */
  location: {
    address: SchoolAddress
    timezone?: string // Override workspace timezone if different
    phone?: string
    email?: string
    fax?: string
  }
  /** Operations */
  operations: {
    operatingHours: OperatingHours[]
    gradeLevels: string[] // e.g., ["K", "1", "2"] or ["9", "10", "11", "12"]
    capacity?: number
  }
  /** Academic settings */
  academic: {
    gradingScale: 'letter' | 'percentage' | 'points' | 'custom'
    customGradingScale?: {
      grades: { letter: string; minPercentage: number; maxPercentage: number; gpaPoints: number }[]
    }
    reportCardFormat: 'standard' | 'narrative' | 'standards-based'
    termStructure: 'semester' | 'trimester' | 'quarter' | 'custom'
  }
  /** Attendance settings */
  attendance: {
    policy: 'daily' | 'period' | 'both'
    tardyThresholdMinutes: number
    excusedAbsenceTypes: string[]
    unexcusedAbsenceTypes: string[]
  }
  /** Whether this configuration inherits from workspace or is customized */
  inheritsFromWorkspace: boolean
  createdAt: string
  updatedAt: string
}

// ============================================================================
// DEPARTMENTS
// ============================================================================

/**
 * Department scope determines visibility and resource management
 */
export type DepartmentScope = 'tenant' | 'school'

/**
 * Department entity supporting both tenant-level and school-level departments
 */
export interface Department {
  id: string
  tenantId: string
  /** Scope determines if department is shared across all schools or school-specific */
  scope: DepartmentScope
  /** Only set if scope is 'school' */
  schoolId?: string
  /** Department details */
  name: string
  code: string
  description?: string
  /** Head of department (user ID) */
  headId?: string
  headName?: string
  /** Hierarchical structure support */
  parentDepartmentId?: string
  /** Status */
  isActive: boolean
  /** Budget information (optional) */
  budget?: {
    fiscalYear: string
    allocatedAmount: number
    spentAmount: number
    currency: string
  }
  createdAt: string
  updatedAt: string
}

/**
 * Create department request
 */
export interface CreateDepartmentDto {
  name: string
  code: string
  scope: DepartmentScope
  schoolId?: string
  description?: string
  headId?: string
  parentDepartmentId?: string
}

/**
 * Update department request
 */
export interface UpdateDepartmentDto {
  name?: string
  code?: string
  description?: string
  headId?: string
  parentDepartmentId?: string
  isActive?: boolean
}

// ============================================================================
// ACADEMIC YEARS (Enhanced)
// ============================================================================

/**
 * Academic year status with strict lifecycle transitions
 */
export type AcademicYearStatus = 'planning' | 'active' | 'completed'

/**
 * Enhanced academic year with school association and status management
 */
export interface AcademicYear {
  id: string
  tenantId: string
  schoolId: string
  schoolName?: string
  /** Display name e.g., "2024-2025" */
  name: string
  /** Temporal boundaries */
  startDate: string
  endDate: string
  /** Current status */
  status: AcademicYearStatus
  /** Terms/grading periods within this academic year */
  terms: Term[]
  /** Lock flag - active/completed years have certain fields locked */
  isLocked: boolean
  /** When the year was activated (status changed to 'active') */
  activatedAt?: string
  /** When the year was completed */
  completedAt?: string
  createdAt: string
  updatedAt: string
}

/**
 * Create academic year request
 */
export interface CreateAcademicYearDto {
  schoolId: string
  name: string
  startDate: string
  endDate: string
  terms?: Omit<Term, 'id'>[]
}

/**
 * Update academic year request
 * Note: startDate/endDate cannot be changed once status is 'active'
 */
export interface UpdateAcademicYearDto {
  name?: string
  startDate?: string
  endDate?: string
  terms?: Term[]
}

/**
 * Status transition request with validation
 */
export interface UpdateAcademicYearStatusDto {
  status: AcademicYearStatus
  /** Required confirmation for irreversible transitions */
  confirmTransition?: boolean
}

// ============================================================================
// RBAC / ACCESS MANAGEMENT TYPES
// ============================================================================

/**
 * Role template provided by EdForge system
 */
export interface SystemRole {
  id: string
  name: string
  description: string
  category: 'administrator' | 'educator' | 'staff' | 'student' | 'parent'
  permissions: RolePermission[]
  isSystemRole: true
}

/**
 * Custom role created by tenant
 */
export interface CustomRole {
  id: string
  tenantId: string
  name: string
  description: string
  baseRoleId?: string // If based on a system role template
  permissions: RolePermission[]
  isSystemRole: false
  createdAt: string
  updatedAt: string
  createdBy: string
}

/**
 * Permission entry for a role
 */
export interface RolePermission {
  resource: string
  actions: ('view' | 'create' | 'edit' | 'delete' | 'manage' | 'approve' | 'send' | 'export')[]
}

/**
 * User role assignment to a school
 */
export interface UserRoleAssignment {
  id: string
  userId: string
  userName: string
  userEmail: string
  schoolId: string
  schoolName: string
  roleId: string
  roleName: string
  isCustomRole: boolean
  assignedAt: string
  assignedBy: string
}

/**
 * Access audit log entry
 */
export interface AccessAuditEntry {
  id: string
  timestamp: string
  userId: string
  userName: string
  action: 'role_assigned' | 'role_removed' | 'permission_changed' | 'custom_role_created'
  targetUserId?: string
  targetUserName?: string
  details: Record<string, unknown>
}
