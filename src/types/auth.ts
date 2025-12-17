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
 * 
 * - Principal: Full administrative access to school operations
 * - Teacher: Academic management (grades, attendance, curriculum)
 * - Accountant: Financial operations (billing, payroll, fees)
 * - Staff: General staff with limited administrative access
 * - Student: Enrolled student with access to own academic data
 * - Parent: Guardian with access to linked children's data
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
      return 'administrator' // Staff see admin-like navigation
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
  /** Map of SchoolID → Role within that school */
  assignments: Record<string, SchoolRole>
  /** 
   * Optional: IDs of children for Parent users.
   * Used to fetch and display linked student data.
   * Will be populated from backend when integrating with real auth.
   */
  childrenIds?: string[]
}

/**
 * Auth state stored in zustand
 */
export interface AuthState {
  user: UserIdentity | null
  token: string | null
  isAuthenticated: boolean
}

