/**
 * User Identity and Auth Types
 * Based on AWS Cognito custom attributes for ABAC
 */

export type GlobalRole = 'TenantAdmin' | 'StandardUser'

export type SchoolRole = 'Principal' | 'Teacher' | 'Accountant' | 'Staff'

/**
 * Represents a user's identity with their global role and per-school assignments
 */
export interface UserIdentity {
  id: string
  email: string
  name: string
  globalRole: GlobalRole
  /** Map of SchoolID → Role within that school */
  assignments: Record<string, SchoolRole>
}

/**
 * Auth state stored in zustand
 */
export interface AuthState {
  user: UserIdentity | null
  token: string | null
  isAuthenticated: boolean
}

