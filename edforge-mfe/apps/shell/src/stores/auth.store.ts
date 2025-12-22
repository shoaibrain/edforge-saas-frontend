import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserIdentity, SchoolRole, RoleCategory } from '@edforge/types'
import { getRoleCategory } from '@edforge/types'

// ============================================================================
// MOCK DATA - Replace with real Cognito integration later
// 
// These mock users represent the different user personas in EdForge EMIS:
// - TenantAdmin: District-level administrator with access to all schools
// - Principal: School administrator with full school-level permissions
// - Teacher: Educator with academic management permissions
// - Accountant: Financial staff with billing/payroll permissions
// - Student: Enrolled student viewing their own academic data
// - Parent: Guardian viewing linked children's academic data
// 
// TODO: Replace with AWS Cognito integration for production
// ============================================================================

const MOCK_USERS: Record<string, UserIdentity> = {
  'tenant-admin': {
    id: 'user-001',
    email: 'admin@edforge.com',
    name: 'Sarah Chen',
    globalRole: 'TenantAdmin',
    tenantId: 'tenant-001',
    assignments: {
      'school-001': 'Principal',
      'school-002': 'Principal',
      'school-003': 'Principal',
    },
  },
  'principal': {
    id: 'user-002',
    email: 'principal@lincoln.edu',
    name: 'James Wilson',
    globalRole: 'StandardUser',
    tenantId: 'tenant-001',
    assignments: {
      'school-001': 'Principal',
    },
  },
  'teacher': {
    id: 'user-003',
    email: 'teacher@lincoln.edu',
    name: 'Emily Rodriguez',
    globalRole: 'StandardUser',
    tenantId: 'tenant-001',
    assignments: {
      'school-001': 'Teacher',
      'school-002': 'Teacher',
    },
  },
  'accountant': {
    id: 'user-004',
    email: 'finance@edforge.com',
    name: 'Michael Park',
    globalRole: 'StandardUser',
    tenantId: 'tenant-001',
    assignments: {
      'school-001': 'Accountant',
      'school-002': 'Accountant',
      'school-003': 'Accountant',
    },
  },
  'student': {
    id: 'user-005',
    email: 'alex.chen@student.lincoln.edu',
    name: 'Alex Chen',
    globalRole: 'StandardUser',
    tenantId: 'tenant-001',
    assignments: {
      'school-001': 'Student',
    },
  },
  'parent': {
    id: 'user-006',
    email: 'robert.thompson@email.com',
    name: 'Robert Thompson',
    globalRole: 'StandardUser',
    tenantId: 'tenant-001',
    assignments: {
      // Parent has children at Lincoln High (Emma) and Washington Elementary (Lucas)
      'school-001': 'Parent',
      'school-002': 'Parent',
    },
    // Links to student records - will be used to fetch children's data
    childrenIds: ['STU-0001', 'STU-0002'],
  },
}

// Mock school metadata for display purposes
export const MOCK_SCHOOLS: Record<string, { name: string; code: string }> = {
  'school-001': { name: 'Lincoln High School', code: 'LHS' },
  'school-002': { name: 'Washington Elementary', code: 'WES' },
  'school-003': { name: 'Jefferson Middle School', code: 'JMS' },
}

// ============================================================================
// STORE DEFINITION
// ============================================================================

interface AuthStore {
  user: UserIdentity | null
  token: string | null
  
  // Computed - stored as state property for reactivity
  isAuthenticated: boolean
  
  // Actions
  loginAs: (mockUserId: keyof typeof MOCK_USERS) => void
  logout: () => void
  
  // Helpers
  getUserSchools: () => string[]
  getUserRoleInSchool: (schoolId: string) => SchoolRole | null
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false, // Stored as state property for reactivity
      
      loginAs: (mockUserId) => {
        const user = MOCK_USERS[mockUserId]
        if (!user) {
          console.error(`Mock user "${mockUserId}" not found`)
          return
        }
        
        // Generate a fake JWT-like token for testing interceptors
        const fakeToken = `mock-jwt-${user.id}-${Date.now()}`
        
        set({ user, token: fakeToken, isAuthenticated: true })
      },
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },
      
      getUserSchools: () => {
        const { user } = get()
        if (!user) return []
        return Object.keys(user.assignments)
      },
      
      getUserRoleInSchool: (schoolId) => {
        const { user } = get()
        if (!user) return null
        return user.assignments[schoolId] ?? null
      },
    }),
    {
      name: 'edforge-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)

// ============================================================================
// MOCK USER OPTIONS FOR LOGIN PAGE
// ============================================================================

/**
 * Get the primary role for a user (first assignment's role).
 * Used for display purposes on the login page.
 */
function getPrimaryRole(user: UserIdentity): SchoolRole {
  const assignments = Object.values(user.assignments)
  return assignments[0] ?? 'Staff'
}

/**
 * Export mock users for the login page with enhanced metadata.
 * Includes role category for visual differentiation in the UI.
 */
export const mockUserOptions = Object.entries(MOCK_USERS).map(([key, user]) => {
  const primaryRole = getPrimaryRole(user)
  const roleCategory = getRoleCategory(primaryRole)
  
  return {
    id: key,
    name: user.name,
    email: user.email,
    globalRole: user.globalRole,
    primaryRole,
    roleCategory,
    schoolCount: Object.keys(user.assignments).length,
    childrenCount: user.childrenIds?.length ?? 0,
  }
})

/**
 * Helper to get role category for the current user in a specific school.
 * Used by navigation and UI components to determine what to render.
 */
export function getUserRoleCategory(
  user: UserIdentity | null,
  schoolId: string | null
): RoleCategory | null {
  if (!user || !schoolId) return null
  const role = user.assignments[schoolId]
  if (!role) return null
  return getRoleCategory(role)
}

