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
  useParams,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { ShellProvider } from './lib/shell-context'
import { AppShell } from './components/layout/AppShell'
import { LoadingScreen } from './components/layout/LoadingScreen'
import { NotFound } from './components/layout/NotFound'
import { ComingSoon } from './components/layout/ComingSoon'
// Pages
import { LoginPage } from './components/layout/LoginPage'
import { useThemeStore } from './stores/theme.store'
import { useAuthStore } from './stores/auth.store'
import { isAuthenticated } from '@edforge/auth'
import { useLocaleEffect, useTranslation } from '@edforge/i18n'

// Landing Pages (public)
import { PublicLayout } from './components/landing/PublicLayout'
import { PublicErrorBoundary } from './components/landing/PublicErrorBoundary'
import LandingPage from './components/landing/pages/LandingPage'
import AboutPage from './components/landing/pages/AboutPage'
import ContactPage from './components/landing/pages/ContactPage'
import PrivacyPage from './components/landing/pages/PrivacyPage'
import TermsPage from './components/landing/pages/TermsPage'
import SecurityLandingPage from './components/landing/pages/SecurityPage'

import HomePage from './pages/HomePage'
import SettingsPage from './pages/SettingsPage'
// AuthDebugPage removed — dev-only utility not needed in production
import StudentPortalLayout from './pages/student-portal/StudentPortalLayout'
import StudentGradesPage from './pages/student-portal/StudentGradesPage'
import StudentAttendancePage from './pages/student-portal/StudentAttendancePage'
import StudentSchedulePage from './pages/student-portal/StudentSchedulePage'
import ParentPortalLayout from './pages/parent-portal/ParentPortalLayout'
import ParentOverviewPage from './pages/parent-portal/ParentOverviewPage'
import ParentGradesPage from './pages/parent-portal/ParentGradesPage'
import ParentAttendancePage from './pages/parent-portal/ParentAttendancePage'
import ParentSchedulePage from './pages/parent-portal/ParentSchedulePage'
import FeePaymentPage from './pages/parent-portal/FeePaymentPage'
import PaymentCallbackPage from './pages/payments/callback'
import ReceiptPage from './pages/payments/receipt'
import FeeStructuresPage from './pages/settings/fee-structures'
import PaymentGatewaysPage from './pages/settings/payment-gateways'
import {
  AccountPage,
  SecurityPage,
  // [MVP-PARKED] NotificationsPage,  // merged into PreferencesPage
  PreferencesPage,
  WorkspaceSettingsPage,
  SchoolDetailPage,
  SchoolCreatePage,
  OrganizationSettingsPage,
  EducationOrgDetailPage,
  // [MVP-PARKED] EdFiExportPreviewPage,
  RBACSecurityPage,
  // [MVP-PARKED] IntegrationsSettingsPage,
  // [MVP-PARKED] BillingSettingsPage,
  PeopleSettingsPage,
  // [MVP-PARKED] DangerZonePage,
} from './pages/settings'
import { loadRemote } from '@module-federation/enhanced/runtime'
import React from 'react'

const AcademicsModule = React.lazy(async () => {
  const module = await loadRemote<{ default: React.ComponentType }>('academics/AcademicsModule')
  if (!module) throw new Error('Failed to load Academics remote')
  return module
})
// [MVP-PARKED] Finance module
// const FinanceModule = React.lazy(async () => {
//   const module = await loadRemote<{ default: React.ComponentType }>('finance/FinanceModule')
//   if (!module) throw new Error('Failed to load Finance remote')
//   return module
// })
// [/MVP-PARKED]
// [MVP-PARKED] Special Programs module
// const SpecialProgramsModule = React.lazy(async () => {
//   const module = await loadRemote<{ default: React.ComponentType }>('special-programs/SpecialProgramsModule')
//   if (!module) throw new Error('Failed to load Special Programs remote')
//   return module
// })
// [/MVP-PARKED]
const PeopleModule = React.lazy(async () => {
  const module = await loadRemote<{ default: React.ComponentType }>('people/PeopleModule')
  if (!module) throw new Error('Failed to load People remote')
  return module
})
// [MVP-PARKED] Messages, Analytics, Ed-Fi modules
// const MessagesModule = React.lazy(async () => {
//   const module = await loadRemote<{ default: React.ComponentType }>('messages/MessagesModule')
//   if (!module) throw new Error('Failed to load Messages remote')
//   return module
// })
// const AnalyticsModule = React.lazy(async () => {
//   const module = await loadRemote<{ default: React.ComponentType }>('analytics/AnalyticsModule')
//   if (!module) throw new Error('Failed to load Analytics remote')
//   return module
// })
// const EdFiModule = React.lazy(async () => {
//   const module = await loadRemote<{ default: React.ComponentType }>('edfi/EdFiModule')
//   if (!module) throw new Error('Failed to load Ed-Fi remote')
//   return module
// })
// [/MVP-PARKED]

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

  // Show landing page for unauthenticated users
  if (!isLoading && !isAuthenticatedState) {
    return <LandingPage />
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

// [MVP-PARKED] Notifications merged into Preferences page — redirect for bookmarks
const settingsNotificationsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/notifications',
  beforeLoad: () => {
    throw redirect({ to: '/settings/preferences' })
  },
})
// [/MVP-PARKED]

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

// [MVP-PARKED] Ed-Fi export preview settings route
// const settingsEdFiExportPreviewRoute = createRoute({
//   getParentRoute: () => settingsRoute,
//   path: '/organization/edfi-preview',
//   component: EdFiExportPreviewPage,
// })
// [/MVP-PARKED]

// New: School detail under organization hierarchy
const settingsOrgSchoolDetailRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/organization/schools/$schoolId',
  component: SchoolDetailPage,
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

// Settings: Fee Structures
const settingsFeeStructuresRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/fee-structures',
  component: FeeStructuresPage,
})

// Settings: Payment Gateways
const settingsPaymentGatewaysRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/payment-gateways',
  component: PaymentGatewaysPage,
})

// [MVP-PARKED] Billing, Integrations, Import/Export, Danger Zone — not needed for MVP pilot schools
// const settingsBillingRoute = createRoute({
//   getParentRoute: () => settingsRoute,
//   path: '/billing',
//   component: BillingSettingsPage,
// })
//
// const settingsIntegrationsRoute = createRoute({
//   getParentRoute: () => settingsRoute,
//   path: '/integrations',
//   component: IntegrationsSettingsPage,
// })
//
// const settingsImportExportRoute = createRoute({
//   getParentRoute: () => settingsRoute,
//   path: '/import-export',
//   component: IntegrationsSettingsPage,
// })
//
// const settingsDangerZoneRoute = createRoute({
//   getParentRoute: () => settingsRoute,
//   path: '/danger-zone',
//   component: DangerZonePage,
// })
// [/MVP-PARKED]

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



// [MVP-PARKED] Finance route definition
// const financeRoute = createRoute({
//   getParentRoute: () => protectedRoute,
//   path: '/finance/$',
//   component: () => (
//     <Suspense fallback={<LoadingScreen />}>
//       <FinanceModule />
//     </Suspense>
//   ),
// })
// [/MVP-PARKED]




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

// [MVP-PARKED] Messages, Analytics, Ed-Fi route definitions
// const messagesRoute = createRoute({
//   getParentRoute: () => protectedRoute,
//   path: '/messages/$',
//   component: () => (
//     <Suspense fallback={<LoadingScreen />}>
//       <MessagesModule />
//     </Suspense>
//   ),
// })
// const analyticsRoute = createRoute({
//   getParentRoute: () => protectedRoute,
//   path: '/analytics/$',
//   component: () => (
//     <Suspense fallback={<LoadingScreen />}>
//       <AnalyticsModule />
//     </Suspense>
//   ),
// })
// const edfiRoute = createRoute({
//   getParentRoute: () => protectedRoute,
//   path: '/edfi/$',
//   component: () => (
//     <Suspense fallback={<LoadingScreen />}>
//       <EdFiModule />
//     </Suspense>
//   ),
// })
// [/MVP-PARKED]

// [REMOVED] AuthDebugPage — dev-only utility removed for production

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
  beforeLoad: () => {
    throw redirect({ to: '/student-portal/grades' })
  },
  component: () => null,
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

const studentPortalAssignmentsRoute = createRoute({
  getParentRoute: () => studentPortalRoute,
  path: '/assignments',
  component: () => <ComingSoon moduleName="Assignments" />,
})

const studentPortalCurriculumRoute = createRoute({
  getParentRoute: () => studentPortalRoute,
  path: '/curriculum',
  component: () => <ComingSoon moduleName="Curriculum" />,
})

const studentPortalCalendarRoute = createRoute({
  getParentRoute: () => studentPortalRoute,
  path: '/calendar',
  component: () => <ComingSoon moduleName="School Calendar" />,
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

const parentPortalCalendarRoute = createRoute({
  getParentRoute: () => parentPortalRoute,
  path: '/calendar',
  component: () => <ComingSoon moduleName="School Calendar" />,
})

// [MVP-PARKED] Special Programs route definition
// const specialProgramsRoute = createRoute({
//   getParentRoute: () => protectedRoute,
//   path: '/special-programs/$',
//   component: () => (
//     <Suspense fallback={<LoadingScreen />}>
//       <SpecialProgramsModule />
//     </Suspense>
//   ),
// })
// [/MVP-PARKED]

// ============================================================================
// [MVP-PARKED] COMING SOON CATCH-ALL ROUTES
// ============================================================================

const messagesComingSoonRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/messages/$',
  component: () => <ComingSoon moduleName="Messages" />,
})

const analyticsComingSoonRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/analytics/$',
  component: () => <ComingSoon moduleName="Analytics" />,
})

const edfiComingSoonRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/edfi/$',
  component: () => <ComingSoon moduleName="State Reporting" />,
})

const specialProgramsComingSoonRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/special-programs/$',
  component: () => <ComingSoon moduleName="Special Programs" />,
})

// ============================================================================
// PAYMENT ROUTES (callback + receipt)
// ============================================================================

const paymentCallbackRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/payments/callback',
  component: PaymentCallbackPage,
})

const paymentReceiptRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/payments/$paymentId/receipt',
  component: PaymentReceiptRouteComponent,
})

function PaymentReceiptRouteComponent() {
  const params = useParams({ strict: false }) as { paymentId?: string }
  return <ReceiptPage paymentId={params.paymentId ?? ''} />
}

const financeComingSoonRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/finance/$',
  component: () => <ComingSoon moduleName="Finance" />,
})

// [/MVP-PARKED]

// ============================================================================
// ROUTE TREE
// ============================================================================

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  authCallbackRoute,
  publicRoute.addChildren([
    aboutRoute,
    contactRoute,
    privacyRoute,
    termsRoute,
    securityLandingRoute,
  ]),
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
      settingsOrganizationRoute,
      settingsOrgSchoolDetailRoute,
      settingsOrgSchoolCreateRoute,
      settingsEdOrgDetailRoute,
      // [MVP-PARKED] settingsEdFiExportPreviewRoute,
      settingsAccessRoute,
      settingsSecurityPoliciesRoute,
      settingsFeeStructuresRoute,
      settingsPaymentGatewaysRoute,
      // [MVP-PARKED] settingsBillingRoute,
      // [MVP-PARKED] settingsIntegrationsRoute,
      // [MVP-PARKED] settingsImportExportRoute,
      // [MVP-PARKED] settingsDangerZoneRoute,
    ]),
    academicsRoute,
    // [MVP-PARKED] financeRoute,
    peopleRoute,
    // [MVP-PARKED] Original module routes removed from tree
    // messagesRoute,
    // analyticsRoute,
    // edfiRoute,
    // specialProgramsRoute,
    // Coming Soon catch-all routes for parked modules
    messagesComingSoonRoute,
    analyticsComingSoonRoute,
    edfiComingSoonRoute,
    specialProgramsComingSoonRoute,
    financeComingSoonRoute,
    // [/MVP-PARKED]
    // Payment routes
    paymentCallbackRoute,
    paymentReceiptRoute,
    studentPortalRoute.addChildren([
      studentPortalIndexRoute,
      studentPortalGradesRoute,
      studentPortalAttendanceRoute,
      studentPortalScheduleRoute,
      studentPortalAssignmentsRoute,
      studentPortalCurriculumRoute,
      studentPortalCalendarRoute,
    ]),
    parentPortalRoute.addChildren([
      parentPortalIndexRoute,
      parentPortalGradesRoute,
      parentPortalAttendanceRoute,
      parentPortalScheduleRoute,
      parentPortalFeesRoute,
      parentPortalCalendarRoute,
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
