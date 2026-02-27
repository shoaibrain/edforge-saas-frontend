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

  // Helpers
  getUserSchools: () => string[]
  getUserRoleInSchool: (schoolId: string) => SchoolRole | null
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
