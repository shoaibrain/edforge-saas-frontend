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
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { ShellProvider } from './lib/shell-context'
import { AppShell } from './components/layout/AppShell'
import { LoadingScreen } from './components/layout/LoadingScreen'
import { NotFound } from './components/layout/NotFound'
// Pages
import { LoginPage } from './components/layout/LoginPage'
import { ForgotPasswordPage } from './components/layout/ForgotPasswordPage'
import { useThemeStore } from './stores/theme.store'
import { useAuthStore } from './stores/auth.store'
import { isAuthenticated } from '@edforge/auth'
import { useLocaleEffect, useTranslation } from '@edforge/i18n'
import { useOnboardingRequired } from './hooks/useOnboardingRequired'

// Landing Pages (public)
import { PublicLayout } from './components/landing/PublicLayout'
import { PublicErrorBoundary } from './components/landing/PublicErrorBoundary'
import AboutPage from './components/landing/pages/AboutPage'
import ContactPage from './components/landing/pages/ContactPage'
import PrivacyPage from './components/landing/pages/PrivacyPage'
import TermsPage from './components/landing/pages/TermsPage'
import SecurityLandingPage from './components/landing/pages/SecurityPage'
import AccessibilityPage from './components/landing/pages/AccessibilityPage'
import { LandingPreviewPage, LandingPageV2 } from './components/landing-v2'

import HomePage from './pages/HomePage'
import SettingsPage from './pages/SettingsPage'
import { AuthDebugPage } from './pages/settings'
import StudentPortalLayout from './pages/student-portal/StudentPortalLayout'
import StudentGradesPage from './pages/student-portal/StudentGradesPage'
import StudentAttendancePage from './pages/student-portal/StudentAttendancePage'
import StudentSchedulePage from './pages/student-portal/StudentSchedulePage'
import StudentHomePage from './pages/student-portal/StudentHomePage'
import ParentPortalLayout from './pages/parent-portal/ParentPortalLayout'
import ParentOverviewPage from './pages/parent-portal/ParentOverviewPage'
import ParentGradesPage from './pages/parent-portal/ParentGradesPage'
import ParentAttendancePage from './pages/parent-portal/ParentAttendancePage'
import ParentSchedulePage from './pages/parent-portal/ParentSchedulePage'
import FeePaymentPage from './pages/parent-portal/FeePaymentPage'
import PaymentCallbackPage from './pages/payments/callback'
import DesignSystemDevPage from './pages/dev/design-system'
import {
  AccountPage,
  SecurityPage,
  PreferencesPage,
  WorkspaceSettingsPage,
  SchoolDetailPage,
  SchoolCreatePage,
  OrganizationSettingsPage,
  EducationOrgDetailPage,
  RBACSecurityPage,
  PeopleSettingsPage,
  BrandingSettingsPage,
} from './pages/settings'
import { loadRemote } from '@module-federation/enhanced/runtime'
import React, { lazy } from 'react'
import { handleChunkLoadError } from './lib/chunk-error-handler'

async function loadRemoteWithRetry(
  remotePath: string,
  maxRetries = 1
): Promise<{ default: React.ComponentType }> {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const module = await loadRemote<{ default: React.ComponentType }>(remotePath)
      if (!module) throw new Error(`Failed to load remote: ${remotePath}`)
      return module
    } catch (error) {
      lastError = error
      if (attempt < maxRetries) {
        console.warn(`[MFE] Retrying ${remotePath} (${maxRetries - attempt} retries left)...`)
        await new Promise(r => setTimeout(r, 1000))
      }
    }
  }
  // If reload was initiated, return a never-resolving promise so Suspense
  // keeps showing the loading screen instead of flashing an error UI.
  if (handleChunkLoadError(lastError)) {
    return new Promise(() => {})
  }
  throw lastError
}

const AcademicsModule = React.lazy(() =>
  loadRemoteWithRetry('academics/AcademicsModule')
)
const FinanceModule = React.lazy(() =>
  loadRemoteWithRetry('finance/FinanceModule')
)
const PeopleModule = React.lazy(() =>
  loadRemoteWithRetry('people/PeopleModule')
)
const AnalyticsModule = React.lazy(() =>
  loadRemoteWithRetry('analytics/AnalyticsModule')
)

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
  // Sync <html lang> attribute and Devanagari font loading with i18n locale
  useLocaleEffect()

  return (
    <ShellProvider>
      <ThemeSync />
      <Toaster position="bottom-right" richColors closeButton />
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
  const { onboardingRequired, isLoading: onboardingLoading } = useOnboardingRequired()
  const navigate = useNavigate()

  useEffect(() => {
    if (!onboardingLoading && onboardingRequired) {
      navigate({ to: '/onboarding', replace: true })
    }
  }, [onboardingRequired, onboardingLoading, navigate])

  if (onboardingLoading || onboardingRequired) {
    return <LoadingScreen message="Loading..." />
  }

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
  notFoundComponent: NotFound,
})

// ============================================================================
// LOGIN ROUTE
// ============================================================================

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: ForgotPasswordPage,
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
  const isAuthenticatedState = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)
  const user = useAuthStore((s) => s.user)

  // Check for OAuth params (do not use early return before hooks)
  const isOAuthCallback = hasOAuthParams()

  useEffect(() => {
    // Don't redirect if we are processing OAuth callback or still loading
    if (isOAuthCallback || isLoading) {
      return
    }

    // If authenticated, redirect to home. Otherwise show landing page.
    if (isAuthenticatedState && user) {
      navigate({ to: '/home', replace: true })
    }
    // Unauthenticated users see the landing page (no redirect to /login)
  }, [isAuthenticatedState, isLoading, user, navigate, isOAuthCallback])

  if (isOAuthCallback) {
    return <OAuthCallbackHandler />
  }

  // Unauthenticated visitors land on the V2 marketing page.
  if (!isLoading && !isAuthenticatedState) {
    return <LandingPageV2 />
  }

  return <LoadingScreen message="Loading..." />
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
})

// ============================================================================
// PUBLIC ROUTES - Landing page sub-pages (about, contact, etc.)
// ============================================================================

const publicRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_public',
  component: PublicLayout,
  errorComponent: PublicErrorBoundary,
})

const aboutRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/about',
  component: AboutPage,
})

const contactRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/contact',
  component: ContactPage,
})

const privacyRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/privacy',
  component: PrivacyPage,
})

const termsRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/terms',
  component: TermsPage,
})

const securityLandingRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/security',
  component: SecurityLandingPage,
})

// /legal/accessibility — stub linked from the landing-v2 footer.
// Real copy is a marketing/legal follow-up; the stub exists so the footer
// link resolves without a 404.
const legalAccessibilityRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/legal/accessibility',
  component: AccessibilityPage,
})

// Keep the /auth/callback route as a fallback
const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback',
  component: OAuthCallbackHandler,
})

// ============================================================================
// LANDING V2 PREVIEW ROUTE — always-on developer preview, unauthenticated.
// Build-out scratch surface; not linked from product UI.
// ============================================================================

const landingV2PreviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/_landing-preview',
  component: LandingPreviewPage,
})

// ============================================================================
// ONBOARDING ROUTE — child of rootRoute (no AppShell wrapper)
// ============================================================================

const OnboardingPage = lazy(() => import('./pages/OnboardingPage'))

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',
  beforeLoad: async () => {
    // Same auth guard as protectedRoute
    const initialState = useAuthStore.getState()

    if (initialState.isLoading) {
      await new Promise<void>((resolve) => {
        const unsubscribe = useAuthStore.subscribe((currentState: { isLoading: boolean }) => {
          if (!currentState.isLoading) {
            unsubscribe()
            resolve()
          }
        })
        setTimeout(() => {
          unsubscribe()
          resolve()
        }, 10000)
      })
    }

    const state = useAuthStore.getState()
    if (!state.isAuthenticated || !state.user) {
      throw redirect({ to: '/login' })
    }
  },
  component: () => (
    <Suspense fallback={<LoadingScreen />}>
      <OnboardingPage />
    </Suspense>
  ),
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

const devDesignSystemRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/dev/design-system',
  component: DesignSystemDevPage,
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
  beforeLoad: () => {
    throw redirect({ to: '/settings/preferences' })
  },
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

const settingsAuthDebugRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/auth-debug',
  component: AuthDebugPage,
})

// Sprint M2 — Branding read. M3 will extend the same route into a
// read-or-edit toggle UI (no new route, no new page-shell breadcrumb
// breakage). Permission gate lives inside the page (mirrors
// settings/security-policies pattern, not the route `beforeLoad`
// short-circuit pattern used by /notifications).
const settingsBrandingRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/branding',
  component: BrandingSettingsPage,
})

const settingsOrganizationRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/organization',
  component: OrganizationSettingsPage,
})

const settingsEdOrgDetailRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/organization/$orgType/$orgId',
  component: EducationOrgDetailPage,
})

// New: School detail under organization hierarchy
const settingsOrgSchoolDetailRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/organization/schools/$schoolId',
  component: SchoolDetailPage,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string | undefined),
  }),
})

// New: School creation under organization hierarchy
const settingsOrgSchoolCreateRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/organization/schools/new',
  component: SchoolCreatePage,
  validateSearch: (search: Record<string, unknown>) => ({
    leaId: search.leaId as string | undefined,
  }),
})


// ============================================================================
// REMOTE MODULE ERROR COMPONENT
// ============================================================================

function RemoteModuleError({ error, reset }: ErrorComponentProps) {
  const isDeploymentError = error && (
    error.name === 'ChunkLoadError' ||
    error.message.toLowerCase().includes('loading chunk') ||
    error.message.includes("Unexpected token '<'")
  )

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">
          {isDeploymentError ? 'New version available' : 'Something went wrong'}
        </h2>
        <p className="text-sm text-[rgb(var(--text-secondary))] mb-6">
          {isDeploymentError
            ? 'A new version of EdForge has been deployed. Please reload the page to get the latest version.'
            : 'We encountered an unexpected error loading this module.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white font-medium text-sm transition-colors"
          >
            Reload Page
          </button>
          {!isDeploymentError && (
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgb(var(--surface-tertiary))] hover:bg-[rgb(var(--interactive-hover))] text-[rgb(var(--text-primary))] font-medium text-sm border border-[rgb(var(--border-primary))] transition-colors"
            >
              Try Again
            </button>
          )}
          <a
            href="/home"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgb(var(--surface-tertiary))] hover:bg-[rgb(var(--interactive-hover))] text-[rgb(var(--text-primary))] font-medium text-sm border border-[rgb(var(--border-primary))] transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ACADEMICS ROUTES
// ============================================================================

const academicsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/academics/$', // Splat route
  errorComponent: RemoteModuleError,
  component: () => (
    <Suspense fallback={<LoadingScreen />}>
      <AcademicsModule />
    </Suspense>
  ),
})

const financeRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/finance/$',
  errorComponent: RemoteModuleError,
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
  errorComponent: RemoteModuleError,
  component: () => (
    <Suspense fallback={<LoadingScreen />}>
      <PeopleModule />
    </Suspense>
  ),
})

const analyticsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/analytics/$',
  errorComponent: RemoteModuleError,
  component: () => (
    <Suspense fallback={<LoadingScreen />}>
      <AnalyticsModule />
    </Suspense>
  ),
})


// ============================================================================
// PORTAL ERROR COMPONENT
// ============================================================================

function PortalPageError({ error, reset }: ErrorComponentProps) {
  const { t } = useTranslation('errors')

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">
          {t('generic')}
        </h2>
        <p className="text-sm text-[rgb(var(--text-secondary))] mb-6">
          {t('genericDescription')}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white font-medium text-sm transition-colors"
          >
            {t('tryAgain', { ns: 'common' })}
          </button>
          <a
            href="/home"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgb(var(--surface-tertiary))] hover:bg-[rgb(var(--interactive-hover))] text-[rgb(var(--text-primary))] font-medium text-sm border border-[rgb(var(--border-primary))] transition-colors"
          >
            {t('goHome', { ns: 'common' })}
          </a>
        </div>
        {import.meta.env.DEV && error && (
          <details className="mt-6 text-left p-4 rounded-xl bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))]">
            <summary className="text-xs text-[rgb(var(--text-tertiary))] cursor-pointer">{t('developerInfo')}</summary>
            <pre className="mt-2 p-3 rounded-lg bg-[rgb(var(--surface-secondary))] text-xs text-red-500 font-mono overflow-x-auto max-h-40">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// PORTAL ROUTES
// ============================================================================

const studentPortalRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/student-portal',
  component: StudentPortalLayout,
})

const studentPortalIndexRoute = createRoute({
  getParentRoute: () => studentPortalRoute,
  path: '/',
  component: StudentHomePage, // Scope exception §1.0: replaced redirect with home page
  errorComponent: PortalPageError,
})

const studentPortalGradesRoute = createRoute({
  getParentRoute: () => studentPortalRoute,
  path: '/grades',
  component: StudentGradesPage,
  errorComponent: PortalPageError,
})

const studentPortalAttendanceRoute = createRoute({
  getParentRoute: () => studentPortalRoute,
  path: '/attendance',
  component: StudentAttendancePage,
  errorComponent: PortalPageError,
})

const studentPortalScheduleRoute = createRoute({
  getParentRoute: () => studentPortalRoute,
  path: '/schedule',
  component: StudentSchedulePage,
  errorComponent: PortalPageError,
})


const parentPortalRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/parent-portal',
  component: ParentPortalLayout,
})

const parentPortalIndexRoute = createRoute({
  getParentRoute: () => parentPortalRoute,
  path: '/',
  component: ParentOverviewPage,
  errorComponent: PortalPageError,
})

const parentPortalGradesRoute = createRoute({
  getParentRoute: () => parentPortalRoute,
  path: '/grades',
  component: ParentGradesPage,
  errorComponent: PortalPageError,
})

const parentPortalAttendanceRoute = createRoute({
  getParentRoute: () => parentPortalRoute,
  path: '/attendance',
  component: ParentAttendancePage,
  errorComponent: PortalPageError,
})

const parentPortalScheduleRoute = createRoute({
  getParentRoute: () => parentPortalRoute,
  path: '/schedule',
  component: ParentSchedulePage,
  errorComponent: PortalPageError,
})

const parentPortalFeesRoute = createRoute({
  getParentRoute: () => parentPortalRoute,
  path: '/fees',
  component: FeePaymentPage,
  errorComponent: PortalPageError,
})


// ============================================================================
// PAYMENT ROUTES (callback + receipt)
// ============================================================================

const paymentCallbackRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/payments/callback',
  component: PaymentCallbackPage,
  errorComponent: PortalPageError,
})

// Sprint M1.5-FU.2 moved the receipt page into Finance MFE at
// `/finance/payments/$paymentId/receipt`. The shell-side route + page +
// component artifacts (paymentReceiptRoute, ReceiptPage,
// PaymentReceiptRouteComponent, the local PaymentReceipt component, and
// the shell-side `usePaymentReceipt` re-export) were left behind by that
// sprint as dead code. Sprint M1.5-FU.7 closeout housekeeping (2026-05-27)
// removes them: anyone navigating to the bare shell path now hits
// MfeNotFoundBoundary (M0.5) cleanly. No prod callers remain — the Finance
// eye-icon and per-row Download both target the in-MFE route.

// ============================================================================
// ROUTE TREE
// ============================================================================

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  forgotPasswordRoute,
  authCallbackRoute,
  landingV2PreviewRoute,
  onboardingRoute,
  publicRoute.addChildren([
    aboutRoute,
    contactRoute,
    privacyRoute,
    termsRoute,
    securityLandingRoute,
    legalAccessibilityRoute,
  ]),
  protectedRoute.addChildren([
    homeRoute,
    devDesignSystemRoute,
    settingsRoute.addChildren([
      settingsIndexRoute,
      settingsAccountRoute,
      settingsPreferencesRoute,
      settingsSecurityRoute,
      settingsNotificationsRoute,
      settingsGeneralRoute,
      settingsWorkspaceRoute,
      settingsOrganizationRoute,
      settingsOrgSchoolDetailRoute,
      settingsOrgSchoolCreateRoute,
      settingsEdOrgDetailRoute,
      settingsAccessRoute,
      settingsSecurityPoliciesRoute,
      settingsAuthDebugRoute,
      settingsBrandingRoute,
    ]),
    academicsRoute,
    financeRoute,
    peopleRoute,
    analyticsRoute,
    paymentCallbackRoute,
    studentPortalRoute.addChildren([
      studentPortalIndexRoute,
      studentPortalGradesRoute,
      studentPortalAttendanceRoute,
      studentPortalScheduleRoute,
    ]),
    parentPortalRoute.addChildren([
      parentPortalIndexRoute,
      parentPortalGradesRoute,
      parentPortalAttendanceRoute,
      parentPortalScheduleRoute,
      parentPortalFeesRoute,
    ]),
  ]),
])

// ============================================================================
// CREATE ROUTER
// ============================================================================

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultNotFoundComponent: NotFound,
})

// Type registration for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
