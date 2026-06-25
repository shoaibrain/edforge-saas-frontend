/**
 * User Identity and Auth Types
 * Based on AWS Cognito custom attributes for ABAC
 *
 * EdForge supports a multi-tenant EMIS where users can have different roles
 * across different schools. The ABAC system uses these types to determine
 * what actions a user can perform in each school context.
 */

export type GlobalRole = 'TenantAdmin' | 'TenantUser'

/**
 * School-level roles that determine permissions within a specific school.
 * Each role has a distinct set of permissions defined in the ABAC matrix.
 */
export type SchoolRole =
  | 'Principal'
  | 'VicePrincipal'
  | 'Teacher'
  | 'Accountant'
  | 'Staff'
  | 'Counselor'
  | 'Nurse'
  | 'Student'
  | 'Parent'

/**
 * Categorizes school roles for UI/UX differentiation.
 * Used to determine which home module and navigation to show.
 */
export type RoleCategory = 'administrator' | 'educator' | 'student' | 'parent'

/**
 * Maps SchoolRole to its category for navigation purposes
 */
export function getRoleCategory(role: SchoolRole): RoleCategory {
  switch (role) {
    case 'Principal':
    case 'VicePrincipal':
      return 'administrator'
    case 'Teacher':
    case 'Counselor':
    case 'Nurse':
      return 'educator'
    case 'Accountant':
    case 'Staff':
      return 'administrator'
    case 'Student':
      return 'student'
    case 'Parent':
      return 'parent'
  }
}

/**
 * Represents a user's identity with their global role and per-school assignments
 */
export interface UserIdentity {
  id: string
  email: string
  name: string
  /** User's preferred display name (e.g. first name) */
  displayName?: string
  globalRole: GlobalRole
  tenantId: string
  /** Map of SchoolID → Role within that school */
  assignments: Record<string, SchoolRole>
  /**
   * Optional: IDs of children for Parent users.
   * Used to fetch and display linked student data.
   */
  childrenIds?: string[]
  /** Avatar URL */
  avatarUrl?: string
}

/**
 * Canonical, user-facing labels for the account-level global role.
 * "Member" (not "Staff"/"User"/"Standard User") avoids colliding with the
 * school-scoped `Staff` role and reads cleanly to a non-technical operator.
 */
export const GLOBAL_ROLE_LABELS: Record<GlobalRole, string> = {
  TenantAdmin: 'Admin',
  TenantUser: 'Member',
}

/**
 * Canonical, user-facing labels for school-scoped roles.
 */
export const SCHOOL_ROLE_LABELS: Record<SchoolRole, string> = {
  Principal: 'Principal',
  VicePrincipal: 'Vice Principal',
  Teacher: 'Teacher',
  Accountant: 'Accountant',
  Counselor: 'Counselor',
  Nurse: 'Nurse',
  Staff: 'Staff',
  Student: 'Student',
  Parent: 'Parent',
}

/**
 * The role label to show a user. Prefers the school-scoped role for the active
 * school (the persona that matches what they can actually do on this screen),
 * and falls back to the account-level global role. Never surfaces a raw enum
 * token like "TenantUser" to the UI.
 */
export function getDisplayRole(
  user: Pick<UserIdentity, 'globalRole' | 'assignments'> | null,
  activeSchoolId?: string | null,
): string {
  if (!user) return ''
  const schoolRole = activeSchoolId ? user.assignments?.[activeSchoolId] : undefined
  if (schoolRole && SCHOOL_ROLE_LABELS[schoolRole]) return SCHOOL_ROLE_LABELS[schoolRole]
  return GLOBAL_ROLE_LABELS[user.globalRole] ?? user.globalRole
}

/**
 * Auth state stored in zustand
 */
export interface AuthState {
  user: UserIdentity | null
  token: string | null
  isAuthenticated: boolean
}

/**
 * Login credentials for authentication
 */
export interface LoginCredentials {
  email: string
  password?: string
}

/**
 * Result of an authentication attempt
 */
export interface AuthResult {
  success: boolean
  user?: UserIdentity
  token?: string
  refreshToken?: string
  expiresAt?: number
  error?: string
}

/**
 * Auth Provider interface - abstraction for different auth implementations
 * (Mock, Cognito, Auth0, etc.)
 */
export interface AuthProvider {
  // Core auth operations
  login(credentials: LoginCredentials): Promise<AuthResult>
  logout(): Promise<void>
  refreshToken(): Promise<string>

  // User context
  getUser(): UserIdentity | null
  getToken(): string | null
  isAuthenticated(): boolean

  // Multi-tenant
  getTenantId(): string | null
  getSchoolAssignments(): Record<string, SchoolRole>

  // Events
  onAuthStateChange(callback: (user: UserIdentity | null) => void): () => void
}

