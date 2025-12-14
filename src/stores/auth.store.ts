import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserIdentity, SchoolRole } from '@/types/auth'

// ============================================================================
// MOCK DATA - Replace with real Cognito integration later
// ============================================================================

const MOCK_USERS: Record<string, UserIdentity> = {
  'tenant-admin': {
    id: 'user-001',
    email: 'admin@edforge.com',
    name: 'Sarah Chen',
    globalRole: 'TenantAdmin',
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
    assignments: {
      'school-001': 'Principal',
    },
  },
  'teacher': {
    id: 'user-003',
    email: 'teacher@lincoln.edu',
    name: 'Emily Rodriguez',
    globalRole: 'StandardUser',
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
    assignments: {
      'school-001': 'Accountant',
      'school-002': 'Accountant',
      'school-003': 'Accountant',
    },
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
  
  // Computed
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
      
      get isAuthenticated() {
        return get().token !== null && get().user !== null
      },
      
      loginAs: (mockUserId) => {
        const user = MOCK_USERS[mockUserId]
        if (!user) {
          console.error(`Mock user "${mockUserId}" not found`)
          return
        }
        
        // Generate a fake JWT-like token for testing interceptors
        const fakeToken = `mock-jwt-${user.id}-${Date.now()}`
        
        set({ user, token: fakeToken })
      },
      
      logout: () => {
        set({ user: null, token: null })
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
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)

// Export mock users for the login page
export const mockUserOptions = Object.entries(MOCK_USERS).map(([key, user]) => ({
  id: key,
  name: user.name,
  email: user.email,
  globalRole: user.globalRole,
  schoolCount: Object.keys(user.assignments).length,
}))

