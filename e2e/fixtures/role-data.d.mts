/** Hand-written types for role-data.mjs (plain ESM shared with node scripts). */
import type { Cookie, Page } from '@playwright/test'

export type E2ERole =
  | 'TenantAdmin'
  | 'Principal'
  | 'VicePrincipal'
  | 'Teacher'
  | 'Accountant'
  | 'Staff'
  | 'Counselor'
  | 'Nurse'
  | 'Student'
  | 'Parent'

export interface E2ETenant {
  tenantId: string
  tenantName: string
  tenantTier: string
  subdomain: string
  archetype: string
  country: string
  schoolId: string
  schoolName: string
  academicYearId: string
  academicYearName: string
}

export interface E2EUser {
  id: string
  email: string
  name: string
  displayName: string
  firstName: string
  lastName: string
  tenantId: string
  globalRole: 'TenantAdmin' | 'StandardUser'
  assignments: Record<string, string>
  childrenIds?: string[]
}

export declare const E2E_TENANT: E2ETenant
export declare const SCHOOL_ROLES: readonly E2ERole[]
export declare const E2E_ROLES: readonly E2ERole[]
export declare const ROLE_USERS: Record<E2ERole, E2EUser>
export declare function roleSlug(role: E2ERole): string
export declare function buildAuthCookieValue(role: E2ERole): string
export declare function buildAppCookieValue(opts?: { theme?: string }): string
export declare function cookiesForRole(
  role: E2ERole,
  baseURL: string,
  opts?: { theme?: string },
): Parameters<ReturnType<Page['context']>['addCookies']>[0]
export declare function storageStateForRole(
  role: E2ERole,
  baseURL?: string,
  opts?: { theme?: string },
): { cookies: Cookie[]; origins: never[] }
export declare function roleSwitchSnippet(role: E2ERole): string
