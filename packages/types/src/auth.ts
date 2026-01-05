/**
 * User Identity and Auth Types
 * Based on AWS Cognito custom attributes for ABAC
 *
 * EdForge supports a multi-tenant EMIS where users can have different roles
 * across different schools. The ABAC system uses these types to determine
 * what actions a user can perform in each school context.
 */

export type GlobalRole = 'TenantAdmin' | 'StandardUser'

/**
 * School-level roles that determine permissions within a specific school.
 * Each role has a distinct set of permissions defined in the ABAC matrix.
 */
export type SchoolRole =
  | 'Principal'
  | 'Teacher'
  | 'Accountant'
  | 'Staff'
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
      return 'administrator'
    case 'Teacher':
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
  /** For demo/mock mode */
  mockUserId?: string
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

