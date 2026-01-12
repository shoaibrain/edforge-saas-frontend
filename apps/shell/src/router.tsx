/**
 * Shell Router Configuration
 * 
 * TanStack Router setup following the monolith pattern.
 * Uses proper layout routes with Outlet for nested routing.
 */

import { Suspense, useState, useEffect } from 'react'
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { ShellProvider } from './lib/shell-context'
import { AppShell } from './components/layout/AppShell'
import { LoadingScreen } from './components/layout/LoadingScreen'
// Pages
import { LoginPage } from './components/layout/LoginPage'
import { useThemeStore } from './stores/theme.store'
import { useAuthStore } from './stores/auth.store'
import { isAuthenticated } from '@edforge/auth'

import HomePage from './pages/HomePage'
import SettingsPage from './pages/SettingsPage'
import AuthDebugPage from './pages/AuthDebugPage'
import {
  AccountPage,
  SecurityPage,
  NotificationsPage,
  PreferencesPage,
  WorkspaceSettingsPage,
  SchoolsSettingsPage,
  SchoolDetailPage,
  RBACSecurityPage,
  IntegrationsSettingsPage,
  BillingSettingsPage,
  PeopleSettingsPage,
  DangerZonePage,
} from './pages/settings'
import { loadRemote } from '@module-federation/enhanced/runtime'
import React from 'react'

const AcademicsModule = React.lazy(async () => {
  const module = await loadRemote<{ default: React.ComponentType }>('academics/AcademicsModule')
  if (!module) throw new Error('Failed to load Academics remote')
  return module
})
const FinanceModule = React.lazy(async () => {
  const module = await loadRemote<{ default: React.ComponentType }>('finance/FinanceModule')
  if (!module) throw new Error('Failed to load Finance remote')
  return module
})
const SpecialProgramsModule = React.lazy(async () => {
  const module = await loadRemote<{ default: React.ComponentType }>('special-programs/SpecialProgramsModule')
  if (!module) throw new Error('Failed to load Special Programs remote')
  return module
})
const PeopleModule = React.lazy(async () => {
  const module = await loadRemote<{ default: React.ComponentType }>('people/PeopleModule')
  if (!module) throw new Error('Failed to load People remote')
  return module
})
const MessagesModule = React.lazy(async () => {
  const module = await loadRemote<{ default: React.ComponentType }>('messages/MessagesModule')
  if (!module) throw new Error('Failed to load Messages remote')
  return module
})
const AnalyticsModule = React.lazy(async () => {
  const module = await loadRemote<{ default: React.ComponentType }>('analytics/AnalyticsModule')
  if (!module) throw new Error('Failed to load Analytics remote')
  return module
})
const EdFiModule = React.lazy(async () => {
  const module = await loadRemote<{ default: React.ComponentType }>('edfi/EdFiModule')
  if (!module) throw new Error('Failed to load Ed-Fi remote')
  return module
})

// ============================================================================
// THEME SYNC COMPONENT
// ============================================================================

function ThemeSync() {
  const { theme, setTheme } = useThemeStore()

  useEffect(() => {
    // Re-apply theme on mount to ensure it's synced
    setTheme(theme)
  }, [])

  return null
}

// ============================================================================
// ROOT LAYOUT
// ============================================================================

function RootLayout() {
  return (
    <ShellProvider>
      <ThemeSync />
      <Suspense fallback={<LoadingScreen />}>
        <Outlet />
      </Suspense>
    </ShellProvider>
  )
}

// ============================================================================
// PROTECTED LAYOUT
// ============================================================================

function ProtectedLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

// ============================================================================
// ROOT ROUTE
// ============================================================================

const rootRoute = createRootRoute({
  component: RootLayout,
})

// ============================================================================
// LOGIN ROUTE
// ============================================================================

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

// ============================================================================
// OAUTH CALLBACK HANDLER
// Detects OAuth params and waits for Amplify to process them
// ============================================================================

function hasOAuthParams(): boolean {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  return params.has('code') || params.has('error')
}

function OAuthCallbackHandler() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const processCallback = async () => {
      // Check for OAuth error from Cognito
      const params = new URLSearchParams(window.location.search)
      const oauthError = params.get('error')
      if (oauthError) {
        console.error('[OAuth] Error from Cognito:', oauthError)
        setError(`Authentication error: ${oauthError}`)
        setIsProcessing(false)
        setTimeout(() => navigate({ to: '/login', replace: true }), 2000)
        return
      }

      try {
        console.log('[OAuth] Processing callback, waiting for Amplify...')

        // Wait for Amplify to process the OAuth callback
        // This may take a moment as it exchanges the code for tokens
        const maxAttempts = 20
        let attempt = 0

        while (attempt < maxAttempts) {
          const authenticated = await isAuthenticated()
          if (authenticated) {
            console.log('[OAuth] Authentication successful, initializing store...')
            // Initialize auth store with user data
            await useAuthStore.getState().initializeAuth()

            // Clear the URL params and navigate to home
            window.history.replaceState({}, '', '/home')
            navigate({ to: '/home', replace: true })
            return
          }
          // Wait and retry - Amplify needs time to exchange the code
          await new Promise(resolve => setTimeout(resolve, 300))
          attempt++
        }

        // Auth failed after retries
        console.error('[OAuth] Authentication timed out after', maxAttempts, 'attempts')
        setError('Authentication timed out. Please try again.')
        setIsProcessing(false)
        setTimeout(() => navigate({ to: '/login', replace: true }), 2000)
      } catch (err) {
        console.error('[OAuth] Error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setIsProcessing(false)
        setTimeout(() => navigate({ to: '/login', replace: true }), 2000)
      }
    }

    processCallback()
  }, [navigate])

  return <LoadingScreen message={error || (isProcessing ? "Completing sign in..." : "Redirecting...")} />
}

// ============================================================================
// INDEX ROUTE - Handles OAuth callback OR redirects based on auth state
// ============================================================================

function IndexPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)
  const user = useAuthStore((s) => s.user)

  // Check for OAuth params (do not use early return before hooks)
  const isOAuthCallback = hasOAuthParams()

  useEffect(() => {
    // Don't redirect if we are processing OAuth callback or still loading
    if (isOAuthCallback || isLoading) {
      return
    }

    if (isAuthenticated && user) {
      navigate({ to: '/home', replace: true })
    } else {
      navigate({ to: '/login', replace: true })
    }
  }, [isAuthenticated, isLoading, user, navigate, isOAuthCallback])

  if (isOAuthCallback) {
    return <OAuthCallbackHandler />
  }

  return <LoadingScreen message="Loading..." />
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
})

// Keep the /auth/callback route as a fallback
const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback',
  component: OAuthCallbackHandler,
})

// ============================================================================
// PROTECTED ROUTE - Wraps all authenticated routes
// ============================================================================

const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_protected',
  beforeLoad: async () => {
    const initialState = useAuthStore.getState()

    // If auth is still loading, wait for it to complete
    if (initialState.isLoading) {
      await new Promise<void>((resolve) => {
        const unsubscribe = useAuthStore.subscribe((currentState: { isLoading: boolean }) => {
          if (!currentState.isLoading) {
            unsubscribe()
            resolve()
          }
        })
        // Timeout after 10 seconds to prevent infinite wait
        setTimeout(() => {
          unsubscribe()
          resolve()
        }, 10000)
      })
    }

    // Re-check after loading completes
    const state = useAuthStore.getState()

    if (!state.isAuthenticated || !state.user) {
      throw redirect({ to: '/login' })
    }
  },
  component: ProtectedLayout,
})


// ============================================================================
// HOME ROUTE
// ============================================================================

const homeRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/home',
  component: HomePage,
})

// ============================================================================
// SETTINGS ROUTES
// ============================================================================

const settingsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/settings',
  component: SettingsPage,
})

const settingsIndexRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/',
  component: () => null, // SettingsPage handles overview
})

const settingsAccountRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/account',
  component: AccountPage,
})

const settingsPreferencesRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/preferences',
  component: PreferencesPage,
})

const settingsSecurityRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/security',
  component: SecurityPage,
})

const settingsNotificationsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/notifications',
  component: NotificationsPage,
})

const settingsGeneralRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/general',
  component: PreferencesPage, // General maps to Preferences (legacy)
})

const settingsWorkspaceRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/workspace',
  component: WorkspaceSettingsPage,
})

const settingsAccessRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/access',
  component: PeopleSettingsPage, // Legacy route
})

const settingsSecurityPoliciesRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/security-policies',
  component: RBACSecurityPage,
})

const settingsSchoolsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/schools',
  component: SchoolsSettingsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    create: search.create as string | undefined,
  }),
})

const settingsSchoolDetailRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/schools/$schoolId',
  component: SchoolDetailPage,
})

const settingsBillingRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/billing',
  component: BillingSettingsPage,
})

const settingsIntegrationsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/integrations',
  component: IntegrationsSettingsPage,
})

const settingsImportExportRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/import-export',
  component: IntegrationsSettingsPage, // Import/Export as part of Integrations
})

const settingsDangerZoneRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/danger-zone',
  component: DangerZonePage,
})

// ============================================================================
// ACADEMICS ROUTES
// ============================================================================

const academicsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/academics/$', // Splat route
  component: () => (
    <Suspense fallback={<LoadingScreen />}>
      <AcademicsModule />
    </Suspense>
  ),
})



// ============================================================================
// FINANCE ROUTES
// ============================================================================

const financeRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/finance/$', // Splat route
  component: () => (
    <Suspense fallback={<LoadingScreen />}>
      <FinanceModule />
    </Suspense>
  ),
})




// ============================================================================
// PEOPLE ROUTES
// ============================================================================

const peopleRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/people/$',
  component: () => (
    <Suspense fallback={<LoadingScreen />}>
      <PeopleModule />
    </Suspense>
  ),
})

// ============================================================================
// MESSAGES ROUTES
// ============================================================================

const messagesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/messages/$',
  component: () => (
    <Suspense fallback={<LoadingScreen />}>
      <MessagesModule />
    </Suspense>
  ),
})

// ============================================================================
// ANALYTICS ROUTES
// ============================================================================

const analyticsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/analytics/$',
  component: () => (
    <Suspense fallback={<LoadingScreen />}>
      <AnalyticsModule />
    </Suspense>
  ),
})

// ============================================================================
// ED-FI / STATE REPORTING ROUTES
// ============================================================================

const edfiRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/edfi/$',
  component: () => (
    <Suspense fallback={<LoadingScreen />}>
      <EdFiModule />
    </Suspense>
  ),
})

// ============================================================================
// AUTH DEBUG ROUTE
// ============================================================================

const authDebugRoute2 = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/auth-debug',
  component: AuthDebugPage,
})

// ============================================================================
// PORTAL ROUTES
// ============================================================================

const studentPortalRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/student-portal',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Student Portal</h1><p className="text-gray-500 mt-2">Student portal coming soon...</p></div>,
})

const parentPortalRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/parent-portal',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Parent Portal</h1><p className="text-gray-500 mt-2">Parent portal coming soon...</p></div>,
})

// ============================================================================
// SPECIAL PROGRAMS ROUTES
// ============================================================================

const specialProgramsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/special-programs/$',
  component: () => (
    <Suspense fallback={<LoadingScreen />}>
      <SpecialProgramsModule />
    </Suspense>
  ),
})

// ============================================================================
// ROUTE TREE
// ============================================================================

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  authCallbackRoute,
  protectedRoute.addChildren([
    homeRoute,
    settingsRoute.addChildren([
      settingsIndexRoute,
      settingsAccountRoute,
      settingsPreferencesRoute,
      settingsSecurityRoute,
      settingsNotificationsRoute,
      settingsGeneralRoute,
      settingsWorkspaceRoute,
      settingsAccessRoute,
      settingsSecurityPoliciesRoute,
      settingsSchoolsRoute,
      settingsSchoolDetailRoute,
      settingsBillingRoute,
      settingsIntegrationsRoute,
      settingsImportExportRoute,
      settingsDangerZoneRoute,
    ]),
    academicsRoute,
    financeRoute,
    peopleRoute,
    messagesRoute,
    analyticsRoute,
    edfiRoute,
    specialProgramsRoute,
    studentPortalRoute,
    parentPortalRoute,
    authDebugRoute2,
  ]),
])

// ============================================================================
// CREATE ROUTER
// ============================================================================

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

// Type registration for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
