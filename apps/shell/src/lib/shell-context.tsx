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

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient, useIsFetching } from '@tanstack/react-query'
import { ABACContext, type ABACContextValue } from '@edforge/abac'
import type { UserIdentity, Tenant, School, SchoolYear, WorkspaceSettings, SchoolConfiguration } from '@edforge/types'
import type { ResolvedSettings } from '@edforge/config/resolved-settings'
import { useAuthStore, type AuthStore } from '../stores/auth.store'
import { useAppStore, getSchoolSessionOwner, setSchoolSessionOwner } from '../stores/app.store'
import { tenantService } from '../services/tenant.service'
import { useResolvedSettings } from '../hooks/useResolvedSettings'
import { broadcastSchoolChange } from '@edforge/config/school-context-channel'
import { queryMatchesSchool } from './school-queries'

// ============================================================================
// SHELL CONTEXT TYPES
// ============================================================================

export interface ShellContextValue {
  // Authentication
  user: UserIdentity | null
  isAuthenticated: boolean
  isLoading: boolean
  /**
   * True until identity, assignments, schools, and the active-school
   * resolution have all settled. ProtectedLayout holds a full-screen
   * loading state while this is true so role/school-derived UI never
   * paints with unresolved context.
   */
  isBootstrapping: boolean
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
  workspaceSettingsError: boolean
  workspaceIsLocked: boolean
  workspaceLockReason: string | null
  workspaceLockHolders: NonNullable<WorkspaceSettings['lockHolders']>
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
  const {
    data: userProfile,
    isLoading: isUserProfileLoading,
    isError: isUserProfileError,
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => tenantService.getCurrentUser(),
    enabled: isAuthenticated && !!user,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Track if we've already synced profile data for this userProfile
  const lastSyncedAssignmentsRef = useRef<string | null>(null)
  const lastSyncedNameRef = useRef<string | null>(null)

  // True once the fetched profile has been merged into the auth store —
  // the bootstrap gate must not open on the paint where /users/me has
  // resolved but user.assignments is still the empty login placeholder.
  const [profileSynced, setProfileSynced] = useState(false)

  // Update user with fetched profile — merges name fields + assignments
  useEffect(() => {
    if (!userProfile || !user) return
    setProfileSynced(true)

    const assignmentsKey = userProfile.assignments
      ? JSON.stringify(userProfile.assignments.map(a => `${a.schoolId}:${a.role}`).sort())
      : null

    // Derive proper name from API profile (API returns firstName, lastName, displayName)
    const profileName = userProfile.displayName
      || (userProfile.firstName && userProfile.lastName
          ? `${userProfile.firstName} ${userProfile.lastName}`
          : undefined)
      || userProfile.name

    const profileDisplayName = userProfile.displayName
      || userProfile.firstName
      || undefined

    const nameKey = `${profileName ?? ''}:${profileDisplayName ?? ''}`
    const assignmentsChanged = assignmentsKey && assignmentsKey !== lastSyncedAssignmentsRef.current
    const nameChanged = nameKey !== lastSyncedNameRef.current && (profileName || profileDisplayName)

    if (assignmentsChanged || nameChanged) {
      lastSyncedAssignmentsRef.current = assignmentsKey
      lastSyncedNameRef.current = nameKey

      // Merge API profile name data into user identity
      const mergedUser = {
        ...user,
        ...(profileName ? { name: profileName } : {}),
        ...(profileDisplayName ? { displayName: profileDisplayName } : {}),
      }

      setUser(mergedUser, userProfile.assignments)
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

  // Fetch workspace settings for the tenant.
  // The admin endpoint also carries lock/onboarding state used by settings UIs.
  const isTenantAdmin = user?.globalRole === 'TenantAdmin'
  const {
    data: workspaceSettingsData,
    isError: isWorkspaceSettingsError,
    isSuccess: isWorkspaceSettingsSuccess,
  } = useQuery({
    queryKey: ['workspaceSettings', user?.tenantId],
    queryFn: () => tenantService.getWorkspaceSettings(user!.tenantId),
    enabled: isAuthenticated && !!user?.tenantId && isTenantAdmin,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Non-admins can't call the admin endpoint, but regional display settings
  // (currency, calendar, locale) must still resolve for them — otherwise
  // parents/students render SYSTEM_DEFAULTS (USD) forever. The read-only
  // /tenants/my/settings endpoint serves the same regional block to any
  // authenticated tenant user.
  const {
    data: myRegionalSettingsData,
    isError: isMyRegionalSettingsError,
    isSuccess: isMyRegionalSettingsSuccess,
  } = useQuery({
    queryKey: ['myWorkspaceSettings', user?.tenantId],
    queryFn: () => tenantService.getMyWorkspaceSettings(),
    enabled: isAuthenticated && !!user?.tenantId && !isTenantAdmin,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // The role-appropriate settings query has settled (success or error —
  // errors degrade to defaults, they must not hold the gate).
  const settingsSettled = !user?.tenantId
    ? true
    : isTenantAdmin
      ? isWorkspaceSettingsSuccess || isWorkspaceSettingsError
      : isMyRegionalSettingsSuccess || isMyRegionalSettingsError

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
  const effectiveWorkspaceSettings = workspaceSettingsData?.regional ?? myRegionalSettingsData?.regional ?? null
  const effectiveSchoolConfiguration = (schoolConfigurationData as SchoolConfiguration) ?? null
  const effectiveLockHolders = workspaceSettingsData?.lockHolders ?? []

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
  // Sprint A.12: thread tenant archetype + country through the channel so
  // MFEs (e.g., Staff Wizard in apps/people) can render region-aware forms
  // without coupling to apps/shell's React context.
  const tenantArchetype = effectiveTenant?.archetype ?? null
  const tenantCountry = effectiveTenant?.country ?? null
  useEffect(() => {
    broadcastSchoolChange(
      activeSchoolId,
      activeSchool?.status ?? null,
      resolvedSettings,
      tenantId,
      tenantArchetype,
      tenantCountry,
    )
  }, [activeSchoolId, activeSchool?.status, resolvedSettings, tenantId, tenantArchetype, tenantCountry])

  // Per-tab session owner, mirrored into React state so setting it
  // re-renders (sessionStorage itself is not reactive).
  const [sessionOwner, setSessionOwner] = useState<string | null>(getSchoolSessionOwner)

  // Active-school resolution.
  //
  // Same-tab reload (session marker matches this user + persisted school
  // still valid): keep the working context. Anything else — fresh login,
  // new tab, logout→login, another user's residue — resolves fresh:
  //   server default (Settings → Preferences) → last explicitly-chosen
  //   school → first of the (name-sorted) list.
  //
  // Invariant: whenever availableSchools is non-empty and the context is
  // fresh, this effect sets a valid school in the same pass — the
  // bootstrap gate (schoolPending) waits on it.
  useEffect(() => {
    if (!user || isUserProfileLoading || isSchoolsLoading) return
    if (availableSchools.length === 0) return

    const isValid = (id: string | null | undefined): id is string =>
      !!id && availableSchools.some((s) => s.id === id)

    if (getSchoolSessionOwner() === user.id && isValid(activeSchoolId)) {
      setSessionOwner(user.id)
      return
    }

    const preferredId = userProfile?.defaultSchoolId
    const lastUsed = localStorage.getItem(`edforge-active-school-${user.id}`)
    const next = isValid(preferredId)
      ? preferredId
      : isValid(lastUsed)
        ? lastUsed
        : availableSchools[0].id

    setSchoolSessionOwner(user.id)
    setSessionOwner(user.id)
    setActiveSchoolId(next, { silent: true })
  }, [user, activeSchoolId, availableSchools, isUserProfileLoading, isSchoolsLoading, userProfile, setActiveSchoolId])

  // Explicit school switch: the only path that records "last used".
  // Auto-select must not write it, or the default would overwrite the
  // user's actual last choice.
  const setActiveSchool = useCallback(
    (schoolId: string) => {
      const userId = useAuthStore.getState().user?.id
      if (userId) {
        try {
          localStorage.setItem(`edforge-active-school-${userId}`, schoolId)
        } catch {
          // ignore
        }
      }
      setActiveSchoolId(schoolId)
    },
    [setActiveSchoolId]
  )

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

    // 1. Cancel any in-flight requests for the old school
    if (prevId) {
      queryClient.cancelQueries({ predicate: queryMatchesSchool(prevId) })
      // 2. Remove stale cache for the old school
      queryClient.removeQueries({ predicate: queryMatchesSchool(prevId) })
    }

    // 3. If switching to a real school, invalidate existing cache (force refetch)
    if (activeSchoolId) {
      queryClient.invalidateQueries({ predicate: queryMatchesSchool(activeSchoolId) })
    }
  }, [activeSchoolId, queryClient])

  // ============================================================================
  // TRANSITION SETTLE SIGNAL
  // Clear the transition flag when the new school's queries settle — scoped
  // to school-matching queries only, so an unrelated slow query elsewhere
  // can't hold the overlay open. A fetch must have been OBSERVED before a
  // zero count clears (guards the paint before invalidation-triggered
  // refetches register); if none appears shortly after the switch, there is
  // nothing to wait for and the overlay clears immediately.
  // ============================================================================

  const isSchoolTransitioning = useAppStore((s) => s.isSchoolTransitioning)
  const schoolFetchCount = useIsFetching({
    predicate: activeSchoolId ? queryMatchesSchool(activeSchoolId) : () => false,
  })
  const hasSeenSchoolFetchRef = useRef(false)

  useEffect(() => {
    if (!isSchoolTransitioning) return
    hasSeenSchoolFetchRef.current = false
    const timer = setTimeout(() => {
      if (!hasSeenSchoolFetchRef.current) {
        setSchoolTransitioning(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [isSchoolTransitioning, setSchoolTransitioning])

  useEffect(() => {
    if (!isSchoolTransitioning) return
    if (schoolFetchCount > 0) {
      hasSeenSchoolFetchRef.current = true
      return
    }
    if (hasSeenSchoolFetchRef.current) {
      setSchoolTransitioning(false)
    }
  }, [schoolFetchCount, isSchoolTransitioning, setSchoolTransitioning])

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

  // Bootstrap readiness — see ShellContextValue.isBootstrapping.
  // profileSettled: assignments merged into the auth store (or the profile
  // fetch failed — degrade rather than hang).
  // schoolResolved: this tab's session owner resolved a school that is
  // still valid; anything else keeps the gate up through re-resolution.
  // A user with zero available schools is ready with activeSchoolId null.
  // The tenant query is retry:false, so errors settle isTenantLoading and
  // the gate never hangs on it (403 for non-admins is expected).
  // settingsSettled: regional settings (currency/calendar/locale) have
  // resolved before any page — or MFE — paints money. Guarantees the shell's
  // settings-ful broadcast precedes every remote's synchronous
  // getSchoolContext() read, so no surface first-paints in SYSTEM_DEFAULTS
  // (USD). Settles on error too (retry:false) — never hangs the gate.
  const profileSettled = profileSynced || isUserProfileError
  const schoolResolved =
    !!activeSchoolId &&
    availableSchools.some((s) => s.id === activeSchoolId) &&
    sessionOwner === user?.id
  const schoolPending = availableSchools.length > 0 && !schoolResolved
  const isBootstrapping =
    isAuthLoading ||
    (isAuthenticated &&
      (isUserProfileLoading ||
        !profileSettled ||
        isSchoolsLoading ||
        isTenantLoading ||
        !settingsSettled ||
        schoolPending))

  // ============================================================================
  // CONTEXT VALUES
  // ============================================================================

  const shellValue: ShellContextValue = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      isBootstrapping,
      logout,
      tenant: effectiveTenant,
      tenantId: user?.tenantId ?? effectiveTenant?.id ?? null,
      tenantName,
      tenantTier,
      activeSchoolId,
      activeSchool,
      setActiveSchool,
      availableSchools,
      activeSchoolYear: effectiveSchoolYear,
      workspaceSettings: effectiveWorkspaceSettings,
      workspaceSettingsError: isWorkspaceSettingsError,
      workspaceIsLocked: workspaceSettingsData?.isLocked ?? false,
      workspaceLockReason: workspaceSettingsData?.lockReason ?? null,
      workspaceLockHolders: effectiveLockHolders,
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
      isBootstrapping,
      logout,
      effectiveTenant,
      tenantName,
      tenantTier,
      activeSchoolId,
      activeSchool,
      setActiveSchool,
      availableSchools,
      effectiveSchoolYear,
      effectiveWorkspaceSettings,
      isWorkspaceSettingsError,
      workspaceSettingsData?.isLocked,
      workspaceSettingsData?.lockReason,
      effectiveLockHolders,
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
  return {
    tenant,
    tenantId,
    tenantName,
    tenantTier,
    archetype: tenant?.archetype ?? null,
    country: tenant?.country ?? null,
    createdAt: tenant?.createdAt ?? null,
  }
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
