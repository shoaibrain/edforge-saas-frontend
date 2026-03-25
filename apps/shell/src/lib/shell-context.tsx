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
import { useQuery, useQueryClient, useIsFetching } from '@tanstack/react-query'
import { ABACContext, type ABACContextValue } from '@edforge/abac'
import type { UserIdentity, Tenant, School, SchoolYear, WorkspaceSettings, SchoolConfiguration } from '@edforge/types'
import type { ResolvedSettings } from '@edforge/config/resolved-settings'
import { useAuthStore, type AuthStore } from '../stores/auth.store'
import { useAppStore } from '../stores/app.store'
import { tenantService } from '../services/tenant.service'
import { useResolvedSettings } from '../hooks/useResolvedSettings'
import { broadcastSchoolChange } from '@edforge/config/school-context-channel'

// ============================================================================
// SHELL CONTEXT TYPES
// ============================================================================

export interface ShellContextValue {
  // Authentication
  user: UserIdentity | null
  isAuthenticated: boolean
  isLoading: boolean
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

  // Workspace Settings
  workspaceSettings: WorkspaceSettings['regional'] | null
  workspaceConfirmedAt: string | null
  onboardingCompletedAt: string | null
  schoolConfiguration: SchoolConfiguration | null
  resolvedSettings: ResolvedSettings

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
// SHELL CONTEXT PROVIDER
// ============================================================================

interface ShellProviderProps {
  children: ReactNode
}

export function ShellProvider({ children }: ShellProviderProps) {
  // Auth store
  const user = useAuthStore((s: AuthStore) => s.user)
  const isAuthenticated = useAuthStore((s: AuthStore) => s.isAuthenticated)
  const isAuthLoading = useAuthStore((s: AuthStore) => s.isLoading)
  const initializeAuth = useAuthStore((s: AuthStore) => s.initializeAuth)
  const logout = useAuthStore((s: AuthStore) => s.logout)
  const setUser = useAuthStore((s: AuthStore) => s.setUser)
  const tenantName = useAuthStore((s: AuthStore) => s.tenantName)
  const tenantTier = useAuthStore((s: AuthStore) => s.tenantTier)

  // App store
  const {
    activeSchoolId,
    setActiveSchoolId,
    setActiveSchoolStatus,
    setSchoolTransitioning,
    sidebarCollapsed,
    toggleSidebar,
  } = useAppStore()

  const queryClient = useQueryClient()

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
  const lastSyncedAssignmentsRef = useRef<string | null>(null)

  // Update user with fetched assignments — only when assignments actually change
  useEffect(() => {
    if (!userProfile || !user) return

    const assignmentsKey = userProfile.assignments
      ? JSON.stringify(userProfile.assignments.map(a => `${a.schoolId}:${a.role}`).sort())
      : null

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

  // Fetch current academic year for the active school
  const { data: schoolYear } = useQuery({
    queryKey: ['currentAcademicYear', activeSchoolId],
    queryFn: async () => {
      const year = await tenantService.getCurrentAcademicYear(activeSchoolId!)
      if (!year) return null
      return {
        id: year.id,
        name: year.name,
        startDate: year.startDate,
        endDate: year.endDate,
        isCurrent: year.status === 'active',
        terms: year.terms,
      } satisfies SchoolYear
    },
    enabled: isAuthenticated && !!activeSchoolId,
    retry: false,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })

  // Fetch workspace settings for the tenant
  const { data: workspaceSettingsData } = useQuery({
    queryKey: ['workspaceSettings', user?.tenantId],
    queryFn: () => tenantService.getWorkspaceSettings(user!.tenantId),
    enabled: isAuthenticated && !!user?.tenantId,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch school configuration when active school changes
  const { data: schoolConfigurationData } = useQuery({
    queryKey: ['schoolConfiguration', activeSchoolId],
    queryFn: () => tenantService.getSchoolConfiguration(activeSchoolId!),
    enabled: isAuthenticated && !!activeSchoolId,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // ============================================================================
  // COMPUTED VALUES — no mock fallbacks; null when API data is unavailable
  // ============================================================================

  const effectiveTenant = tenant ?? null
  const effectiveSchools = schools ?? []
  const effectiveSchoolYear = schoolYear ?? null
  const effectiveWorkspaceSettings = workspaceSettingsData?.regional ?? null
  const effectiveSchoolConfiguration = (schoolConfigurationData as SchoolConfiguration) ?? null

  // Filter schools user has access to based on assignments
  const availableSchools = useMemo(() => {
    if (!user) return []

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

  // Compute resolved settings from the precedence chain
  const resolvedSettings = useResolvedSettings({
    workspaceSettings: effectiveWorkspaceSettings,
    activeSchool,
    schoolConfiguration: effectiveSchoolConfiguration,
  })

  // Broadcast resolved settings to MFEs whenever they change
  const tenantId = user?.tenantId ?? effectiveTenant?.id ?? null
  useEffect(() => {
    broadcastSchoolChange(
      activeSchoolId,
      activeSchool?.status ?? null,
      resolvedSettings,
      tenantId,
    )
  }, [activeSchoolId, activeSchool?.status, resolvedSettings, tenantId])

  // Consolidated auto-select: restore from localStorage or pick first available
  useEffect(() => {
    if (!user || availableSchools.length === 0) return
    if (activeSchoolId && availableSchools.some((s) => s.id === activeSchoolId)) return

    // Try to restore user's last-used school
    const savedId = localStorage.getItem(`edforge-active-school-${user.id}`)
    if (savedId && availableSchools.some((s) => s.id === savedId)) {
      setActiveSchoolId(savedId)
    } else {
      setActiveSchoolId(availableSchools[0].id)
    }
  }, [user, activeSchoolId, availableSchools, setActiveSchoolId])

  // Persist school selection to localStorage for restore on next login
  useEffect(() => {
    if (activeSchoolId && user?.id) {
      localStorage.setItem(`edforge-active-school-${user.id}`, activeSchoolId)
    }
  }, [activeSchoolId, user?.id])

  // Sync activeSchoolStatus to cookie store so MFEs can read it
  useEffect(() => {
    setActiveSchoolStatus(activeSchool?.status ?? null)
  }, [activeSchool?.status, setActiveSchoolStatus])

  // ============================================================================
  // CACHE INVALIDATION ON SCHOOL CHANGE
  // Cancels in-flight queries for old school, removes their cache, and
  // invalidates any existing cache for the new school to force refetch.
  // ============================================================================

  const prevSchoolIdRef = useRef<string | null>(activeSchoolId)

  useEffect(() => {
    const prevId = prevSchoolIdRef.current
    prevSchoolIdRef.current = activeSchoolId

    // Skip on initial mount or when school hasn't actually changed
    if (prevId === activeSchoolId) return

    // Deep-search predicate: finds schoolId at any position in the query key
    // array, or inside a filter/params object.
    const matchesSchool = (schoolId: string) => (query: { queryKey: readonly unknown[] }) => {
      return query.queryKey.some((segment) => {
        if (typeof segment === 'string' && segment === schoolId) return true
        if (typeof segment === 'object' && segment !== null) {
          const obj = segment as Record<string, unknown>
          if (obj.schoolId === schoolId) return true
        }
        return false
      })
    }

    // 1. Cancel any in-flight requests for the old school
    if (prevId) {
      queryClient.cancelQueries({ predicate: matchesSchool(prevId) })
      // 2. Remove stale cache for the old school
      queryClient.removeQueries({ predicate: matchesSchool(prevId) })
    }

    // 3. If switching to a real school, invalidate existing cache (force refetch)
    if (activeSchoolId) {
      queryClient.invalidateQueries({ predicate: matchesSchool(activeSchoolId) })
    }
  }, [activeSchoolId, queryClient])

  // Clear the transition flag once all queries have settled
  const fetchingCount = useIsFetching()

  useEffect(() => {
    if (fetchingCount === 0) {
      setSchoolTransitioning(false)
    }
  }, [fetchingCount, setSchoolTransitioning])

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
      workspaceSettings: effectiveWorkspaceSettings,
      workspaceConfirmedAt: workspaceSettingsData?.workspaceConfirmedAt ?? null,
      onboardingCompletedAt: workspaceSettingsData?.onboardingCompletedAt ?? null,
      schoolConfiguration: effectiveSchoolConfiguration,
      resolvedSettings,
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
      logout,
      effectiveTenant,
      tenantName,
      tenantTier,
      activeSchoolId,
      activeSchool,
      setActiveSchoolId,
      availableSchools,
      effectiveSchoolYear,
      effectiveWorkspaceSettings,
      workspaceSettingsData?.workspaceConfirmedAt,
      workspaceSettingsData?.onboardingCompletedAt,
      effectiveSchoolConfiguration,
      resolvedSettings,
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

export function useWorkspaceSettings() {
  const { workspaceSettings } = useShell()
  return workspaceSettings
}

export function useSchoolConfiguration() {
  const { schoolConfiguration } = useShell()
  return schoolConfiguration
}

export function useSettings() {
  const { resolvedSettings } = useShell()
  return resolvedSettings
}
