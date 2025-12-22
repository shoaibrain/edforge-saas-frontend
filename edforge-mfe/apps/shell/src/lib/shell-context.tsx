/**
 * Shell Context Provider
 *
 * Provides global context to all federated modules including:
 * - Authentication state
 * - Tenant context
 * - Active school selection
 * - ABAC permissions
 */

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { ABACContext, type ABACContextValue } from '@edforge/abac'
import type { UserIdentity, Tenant, School, SchoolYear } from '@edforge/types'
import { useAuthStore } from '../stores/auth.store'
import { useAppStore } from '../stores/app.store'

// ============================================================================
// SHELL CONTEXT TYPES
// ============================================================================

export interface ShellContextValue {
  // Authentication
  user: UserIdentity | null
  isAuthenticated: boolean
  login: (userId: string) => void
  logout: () => void

  // Tenant
  tenant: Tenant | null
  tenantId: string | null

  // School Context
  activeSchoolId: string | null
  activeSchool: School | null
  setActiveSchool: (schoolId: string) => void
  availableSchools: School[]

  // School Year
  activeSchoolYear: SchoolYear | null

  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // Navigation
  navigate: (path: string) => void
}

const ShellContext = createContext<ShellContextValue | null>(null)

// ============================================================================
// MOCK DATA (Replace with API calls in production)
// ============================================================================

const MOCK_TENANT: Tenant = {
  id: 'demo-district',
  name: 'Demo School District',
  subdomain: 'demo',
  schools: ['school-1', 'school-2', 'school-3'],
  activeSchoolYear: '2024-2025',
  features: {
    edfiEnabled: true,
    googleWorkspaceEnabled: true,
    microsoftEnabled: false,
    advancedAnalytics: true,
  },
}

const MOCK_SCHOOLS: School[] = [
  {
    id: 'school-001',
    tenantId: 'demo-district',
    name: 'Lincoln High School',
    code: 'LHS',
    type: 'high',
    isActive: true,
  },
  {
    id: 'school-002',
    tenantId: 'demo-district',
    name: 'Washington Elementary',
    code: 'WES',
    type: 'elementary',
    isActive: true,
  },
  {
    id: 'school-003',
    tenantId: 'demo-district',
    name: 'Jefferson Middle School',
    code: 'JMS',
    type: 'middle',
    isActive: true,
  },
]

const MOCK_SCHOOL_YEAR: SchoolYear = {
  id: 'sy-2024-2025',
  name: '2024-2025',
  startDate: '2024-08-15',
  endDate: '2025-06-15',
  isCurrent: true,
  terms: [
    { id: 'fall', name: 'Fall Semester', startDate: '2024-08-15', endDate: '2024-12-20', type: 'semester' },
    { id: 'spring', name: 'Spring Semester', startDate: '2025-01-06', endDate: '2025-06-15', type: 'semester' },
  ],
}

// ============================================================================
// SHELL CONTEXT PROVIDER
// ============================================================================

interface ShellProviderProps {
  children: ReactNode
}

export function ShellProvider({ children }: ShellProviderProps) {
  // Auth store - isAuthenticated is now a proper state property for reactivity
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const loginAs = useAuthStore((s) => s.loginAs)
  const logout = useAuthStore((s) => s.logout)

  // App store
  const {
    activeSchoolId,
    setActiveSchoolId,
    sidebarCollapsed,
    toggleSidebar,
  } = useAppStore()
  
  // Theme (using 'system' as default for now)
  const theme: 'light' | 'dark' | 'system' = 'system'
  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    // Will be handled by theme store
    console.log('Setting theme:', newTheme)
  }

  // Compute active school from user assignments
  const availableSchools = useMemo(() => {
    if (!user) return []
    const assignedSchoolIds = Object.keys(user.assignments)
    return MOCK_SCHOOLS.filter((s) => assignedSchoolIds.includes(s.id))
  }, [user])

  const activeSchool = useMemo(() => {
    if (!activeSchoolId) return null
    return availableSchools.find((s) => s.id === activeSchoolId) || null
  }, [activeSchoolId, availableSchools])

  // Auto-select first school if none selected
  useEffect(() => {
    if (user && !activeSchoolId && availableSchools.length > 0) {
      setActiveSchoolId(availableSchools[0].id)
    }
  }, [user, activeSchoolId, availableSchools, setActiveSchoolId])

  // Simple navigate function (will be replaced with proper router in production)
  const navigate = (path: string) => {
    // For now, just log the navigation - in production this would use the router
    console.log(`Navigating to: ${path}`)
    // Trigger a custom event that modules can listen to
    window.dispatchEvent(new CustomEvent('shell:navigate', { detail: { path } }))
  }

  // Shell context value
  const shellValue: ShellContextValue = useMemo(
    () => ({
      user,
      isAuthenticated,
      login: (userId: string) => loginAs(userId as 'tenant-admin' | 'principal' | 'teacher' | 'accountant' | 'student' | 'parent'),
      logout,
      tenant: MOCK_TENANT,
      tenantId: MOCK_TENANT.id,
      activeSchoolId,
      activeSchool,
      setActiveSchool: setActiveSchoolId,
      availableSchools,
      activeSchoolYear: MOCK_SCHOOL_YEAR,
      theme,
      setTheme,
      sidebarCollapsed,
      toggleSidebar,
      navigate,
    }),
    [
      user,
      isAuthenticated,
      loginAs,
      logout,
      activeSchoolId,
      activeSchool,
      setActiveSchoolId,
      availableSchools,
      theme,
      setTheme,
      sidebarCollapsed,
      toggleSidebar,
    ]
  )

  // ABAC context value
  const abacValue: ABACContextValue = useMemo(
    () => ({
      user,
      activeSchoolId,
    }),
    [user, activeSchoolId]
  )

  return (
    <ShellContext.Provider value={shellValue}>
      <ABACContext.Provider value={abacValue}>
        {children}
      </ABACContext.Provider>
    </ShellContext.Provider>
  )
}

// ============================================================================
// HOOKS
// ============================================================================

export function useShell(): ShellContextValue {
  const context = useContext(ShellContext)
  if (!context) {
    throw new Error('useShell must be used within a ShellProvider')
  }
  return context
}

export function useTenant() {
  const { tenant, tenantId } = useShell()
  return { tenant, tenantId }
}

export function useActiveSchool() {
  const { activeSchool, activeSchoolId, setActiveSchool, availableSchools } = useShell()
  return { activeSchool, activeSchoolId, setActiveSchool, availableSchools }
}

export function useSchoolYear() {
  const { activeSchoolYear } = useShell()
  return activeSchoolYear
}

