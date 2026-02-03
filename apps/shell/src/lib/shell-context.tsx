/**
 * Shell Context Provider
 *
 * Provides global context to all federated modules including:
 * - Authentication state
 * - Tenant context
 * - Active school selection
 * - ABAC permissions
 * 
 * Integrates with AWS Cognito and backend APIs for real data.
 */

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ABACContext, type ABACContextValue } from '@edforge/abac'
import type { UserIdentity, Tenant, School, SchoolYear } from '@edforge/types'
import { useAuthStore, type AuthStore } from '../stores/auth.store'
import { useAppStore } from '../stores/app.store'
import { tenantService } from '../services/tenant.service'

// ============================================================================
// SHELL CONTEXT TYPES
// ============================================================================

export interface ShellContextValue {
  // Authentication
  user: UserIdentity | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (userId: string) => void
  logout: () => Promise<void>

  // Tenant
  tenant: Tenant | null
  tenantId: string | null
  tenantName: string | null
  tenantTier: string | null

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
// MOCK DATA (Fallback for development when API is unavailable)
// ============================================================================

const MOCK_TENANT: Tenant = {
  id: 'demo-district',
  name: 'Demo School District',
  subdomain: 'demo',
  schools: ['school-001', 'school-002', 'school-003'],
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
  // Auth store - with proper type annotations
  const user = useAuthStore((s: AuthStore) => s.user)
  const isAuthenticated = useAuthStore((s: AuthStore) => s.isAuthenticated)
  const isAuthLoading = useAuthStore((s: AuthStore) => s.isLoading)
  const initializeAuth = useAuthStore((s: AuthStore) => s.initializeAuth)
  const loginAsMock = useAuthStore((s: AuthStore) => s.loginAsMock)
  const logout = useAuthStore((s: AuthStore) => s.logout)
  const setUser = useAuthStore((s: AuthStore) => s.setUser)
  const tenantName = useAuthStore((s: AuthStore) => s.tenantName)
  const tenantTier = useAuthStore((s: AuthStore) => s.tenantTier)

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
    console.log('Setting theme:', newTheme)
  }

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // ============================================================================
  // API QUERIES - Fetch real data when authenticated
  // ============================================================================

  // Fetch user profile with school assignments
  const { data: userProfile, isLoading: isUserProfileLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => tenantService.getCurrentUser(),
    enabled: isAuthenticated && !!user,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Track if we've already synced assignments for this userProfile
  // This prevents infinite loops when setUser updates the user object
  const lastSyncedAssignmentsRef = useRef<string | null>(null)

  // Update user with fetched assignments - only when assignments actually change
  useEffect(() => {
    if (!userProfile || !user) return

    // Create a stable key from the assignments to detect actual changes
    const assignmentsKey = userProfile.assignments
      ? JSON.stringify(userProfile.assignments.map(a => `${a.schoolId}:${a.role}`).sort())
      : null

    // Only update if assignments have actually changed
    if (assignmentsKey && assignmentsKey !== lastSyncedAssignmentsRef.current) {
      lastSyncedAssignmentsRef.current = assignmentsKey
      setUser(user, userProfile.assignments)
    }
  }, [userProfile, setUser]) // Intentionally exclude 'user' to prevent infinite loop

  // Fetch tenant data
  const { data: tenant, isLoading: isTenantLoading } = useQuery({
    queryKey: ['tenant', user?.tenantId],
    queryFn: () => tenantService.getTenant(user!.tenantId),
    enabled: isAuthenticated && !!user?.tenantId,
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  // Fetch schools for the tenant
  const { data: schools, isLoading: isSchoolsLoading } = useQuery({
    queryKey: ['schools', user?.tenantId],
    queryFn: () => tenantService.getSchools(user!.tenantId),
    enabled: isAuthenticated && !!user?.tenantId,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch current school year
  const { data: schoolYear } = useQuery({
    queryKey: ['currentSchoolYear', user?.tenantId],
    queryFn: () => tenantService.getCurrentSchoolYear(user!.tenantId),
    enabled: isAuthenticated && !!user?.tenantId,
    retry: false,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  // Use API data or fallback to mock data for development
  const effectiveTenant = tenant ?? (isAuthenticated ? MOCK_TENANT : null)
  const effectiveSchools = schools ?? (isAuthenticated ? MOCK_SCHOOLS : [])
  const effectiveSchoolYear = schoolYear ?? (isAuthenticated ? MOCK_SCHOOL_YEAR : null)

  // Filter schools user has access to based on assignments
  const availableSchools = useMemo(() => {
    if (!user) return []

    // Ensure effectiveSchools is always an array
    const schoolsList = Array.isArray(effectiveSchools) ? effectiveSchools : []

    // TenantAdmin has access to all schools
    if (user.globalRole === 'TenantAdmin') {
      return schoolsList
    }

    // StandardUser only sees assigned schools
    const assignedSchoolIds = Object.keys(user.assignments)
    return schoolsList.filter((s) => assignedSchoolIds.includes(s.id))
  }, [user, effectiveSchools])

  const activeSchool = useMemo(() => {
    if (!activeSchoolId) return null
    return availableSchools.find((s) => s.id === activeSchoolId) ?? null
  }, [activeSchoolId, availableSchools])

  // Auto-select first school if none selected
  useEffect(() => {
    if (user && !activeSchoolId && availableSchools.length > 0) {
      setActiveSchoolId(availableSchools[0].id)
    }
  }, [user, activeSchoolId, availableSchools, setActiveSchoolId])

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  const navigate = (path: string) => {
    console.log(`Navigating to: ${path}`)
    window.dispatchEvent(new CustomEvent('shell:navigate', { detail: { path } }))
  }

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  const isLoading = isAuthLoading || (isAuthenticated && (isUserProfileLoading || isTenantLoading || isSchoolsLoading))

  // ============================================================================
  // CONTEXT VALUES
  // ============================================================================

  const shellValue: ShellContextValue = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login: (userId: string) => loginAsMock(userId),
      logout,
      tenant: effectiveTenant,
      tenantId: user?.tenantId ?? effectiveTenant?.id ?? null,
      tenantName,
      tenantTier,
      activeSchoolId,
      activeSchool,
      setActiveSchool: setActiveSchoolId,
      availableSchools,
      activeSchoolYear: effectiveSchoolYear,
      theme,
      setTheme,
      sidebarCollapsed,
      toggleSidebar,
      navigate,
    }),
    [
      user,
      isAuthenticated,
      isLoading,
      loginAsMock,
      logout,
      effectiveTenant,
      tenantName,
      tenantTier,
      activeSchoolId,
      activeSchool,
      setActiveSchoolId,
      availableSchools,
      effectiveSchoolYear,
      theme,
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
  const { tenant, tenantId, tenantName, tenantTier } = useShell()
  return { tenant, tenantId, tenantName, tenantTier }
}

export function useActiveSchool() {
  const { activeSchool, activeSchoolId, setActiveSchool, availableSchools } = useShell()
  return { activeSchool, activeSchoolId, setActiveSchool, availableSchools }
}

export function useSchoolYear() {
  const { activeSchoolYear } = useShell()
  return activeSchoolYear
}
