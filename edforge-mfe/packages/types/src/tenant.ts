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

