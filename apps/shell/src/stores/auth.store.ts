/**
 * Auth Store
 * 
 * Zustand store for authentication state management.
 * Integrates with AWS Cognito via @edforge/auth package.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserIdentity, SchoolRole, RoleCategory } from '@edforge/types'
import { getRoleCategory } from '@edforge/types'
import {
  getIdTokenPayload,
  isAuthenticated as checkIsAuthenticated,
  logout as amplifyLogout,
  subscribeToAuthChanges,
  mapCognitoToUserIdentity,
  type CognitoIdTokenPayload,
  type SchoolAssignment,
} from '@edforge/auth'

// ============================================================================
// TYPES
// ============================================================================

export interface AuthStore {
  user: UserIdentity | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Tenant info from Cognito claims
  tenantName: string | null
  tenantTier: string | null

  // Actions
  initializeAuth: () => Promise<void>
  setUser: (user: UserIdentity, assignments?: SchoolAssignment[]) => void
  logout: () => Promise<void>
  setError: (error: string | null) => void

  // Dev mode - will be removed in production
  loginAsMock: (mockUserId: string) => void

  // Helpers
  getUserSchools: () => string[]
  getUserRoleInSchool: (schoolId: string) => SchoolRole | null
}

// ============================================================================
// MOCK DATA - For development/demo purposes only
// Will be removed once backend is fully integrated
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
      'school-001': 'Parent',
      'school-002': 'Parent',
    },
    childrenIds: ['STU-0001', 'STU-0002'],
  },
}

// Mock school metadata - will be replaced by API data
export const MOCK_SCHOOLS: Record<string, { name: string; code: string }> = {
  'school-001': { name: 'Lincoln High School', code: 'LHS' },
  'school-002': { name: 'Washington Elementary', code: 'WES' },
  'school-003': { name: 'Jefferson Middle School', code: 'JMS' },
}

// ============================================================================
// STORE DEFINITION
// ============================================================================

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false, // Start as false, will be set to true when initializeAuth is called
      error: null,
      tenantName: null,
      tenantTier: null,

      /**
       * Initialize authentication state on app load
       * Checks if user is already authenticated with Cognito
       * Includes debouncing to prevent concurrent initializations
       */
      initializeAuth: async () => {
        const currentState = get()

        // Check if session was invalidated by a 401 error
        // This flag persists until user explicitly clicks login button
        const sessionInvalidated = sessionStorage.getItem('edforge-session-invalidated')

        if (sessionInvalidated === 'true') {
          // Do NOT clear the flag here - it's cleared when user clicks login
          set({ isLoading: false })
          return
        }

        // Prevent multiple concurrent initializations
        if (currentState.isLoading) {
          return
        }

        try {
          set({ isLoading: true, error: null })

          // Check if user is authenticated with Cognito
          const authenticated = await checkIsAuthenticated()

          if (!authenticated) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              tenantName: null,
              tenantTier: null,
            })
            return
          }

          // Get the ID token payload with user claims
          const payload = await getIdTokenPayload()

          if (!payload) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: 'Failed to get user information',
            })
            return
          }

          // Extract tenant info from Cognito claims
          const tenantName = payload['custom:tenantName']
          const tenantTier = payload['custom:tenantTier']

          // For now, create user with empty assignments
          // Shell context will fetch assignments from API
          const user = mapCognitoToUserIdentity(payload as CognitoIdTokenPayload, [])

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            tenantName,
            tenantTier,
            error: null,
          })

          console.log('[Auth] Initialization successful for user:', user.email)
        } catch (error) {
          console.error('[Auth] Initialization failed:', error)
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Authentication failed',
          })
        }
      },

      /**
       * Set the authenticated user with school assignments
       * Called after fetching assignments from the API
       */
      setUser: (user, assignments) => {
        if (assignments && assignments.length > 0) {
          // Update user with fetched assignments
          const updatedAssignments = assignments.reduce((acc, { schoolId, role }) => {
            acc[schoolId] = role
            return acc
          }, {} as Record<string, SchoolRole>)

          set({
            user: { ...user, assignments: updatedAssignments },
            isAuthenticated: true,
          })
        } else {
          set({ user, isAuthenticated: true })
        }
      },

      /**
       * Logout the current user
       * Clears local state and signs out from Cognito
       */
      logout: async () => {
        try {
          await amplifyLogout()
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            tenantName: null,
            tenantTier: null,
            error: null,
          })
        }
      },

      setError: (error) => {
        set({ error })
      },

      /**
       * DEV MODE: Login as a mock user
       * This will be removed in production
       */
      loginAsMock: (mockUserId) => {
        const user = MOCK_USERS[mockUserId]
        if (!user) {
          console.error(`Mock user "${mockUserId}" not found`)
          set({ error: `Mock user "${mockUserId}" not found` })
          return
        }

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          tenantName: 'Demo District',
          tenantTier: 'PROFESSIONAL',
          error: null,
        })
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
      storage: {
        getItem: (name) => {
          if (typeof document === 'undefined') return null
          const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
          if (match) {
            const cookieVal = decodeURIComponent(match[2])
            try {
              return JSON.parse(cookieVal)
            } catch {
              return cookieVal
            }
          }
          return null
        },
        setItem: (name, value) => {
          if (typeof document === 'undefined') return
          document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}; path=/; max-age=86400; SameSite=Lax`
        },
        removeItem: (name) => {
          if (typeof document === 'undefined') return
          document.cookie = `${name}=; path=/; max-age=0`
        },
      },
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        tenantName: state.tenantName,
        tenantTier: state.tenantTier,
      }) as unknown as AuthStore,
    }
  )
)

// ============================================================================
// AUTH EVENT LISTENER
// ============================================================================

// Subscribe to Amplify auth events and update store accordingly
if (typeof window !== 'undefined') {
  subscribeToAuthChanges((event) => {
    const store = useAuthStore.getState()

    switch (event) {
      case 'signedIn':
        // Re-initialize auth to fetch user data
        store.initializeAuth()
        break
      case 'signedOut':
        // Clear the store
        useAuthStore.setState({
          user: null,
          isAuthenticated: false,
          tenantName: null,
          tenantTier: null,
        })
        break
      case 'tokenRefresh_failure':
        // Token refresh failed, logout the user
        store.logout()
        break
    }
  })
}

// ============================================================================
// HELPER EXPORTS
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
 * Export mock users for the login page (dev mode only)
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
