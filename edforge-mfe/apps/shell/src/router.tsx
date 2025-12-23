/**
 * Shell Router Configuration
 * 
 * TanStack Router setup following the monolith pattern.
 * Uses proper layout routes with Outlet for nested routing.
 */

import { Suspense } from 'react'
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { ShellProvider } from './lib/shell-context'
import { AppShell } from './components/layout/AppShell'
import { LoadingScreen } from './components/layout/LoadingScreen'
// Pages
import { LoginPage } from './components/layout/LoginPage'
import { useThemeStore } from './stores/theme.store'
import { useAuthStore } from './stores/auth.store'
import { useEffect } from 'react'

import HomePage from './pages/HomePage'
import SettingsPage from './pages/SettingsPage'
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
// PROTECTED ROUTE - Wraps all authenticated routes
// ============================================================================

const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_protected',
  beforeLoad: () => {
    const { token, user } = useAuthStore.getState()
    if (!token || !user) {
      throw redirect({ to: '/login' })
    }
  },
  component: ProtectedLayout,
})

// ============================================================================
// INDEX ROUTE - Redirects to home
// ============================================================================

const indexRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/home' })
  },
  component: () => null,
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
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Account Settings</h1><p className="text-gray-500 mt-2">Coming soon...</p></div>,
})

const settingsPreferencesRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/preferences',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Preferences</h1><p className="text-gray-500 mt-2">Coming soon...</p></div>,
})

const settingsSecurityRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/security',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Security Settings</h1><p className="text-gray-500 mt-2">Coming soon...</p></div>,
})

const settingsNotificationsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/notifications',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Notification Settings</h1><p className="text-gray-500 mt-2">Coming soon...</p></div>,
})

const settingsConnectionsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/connections',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Connections</h1><p className="text-gray-500 mt-2">Coming soon...</p></div>,
})

const settingsGeneralRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/general',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">General Settings</h1><p className="text-gray-500 mt-2">Coming soon...</p></div>,
})

const settingsAccessRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/access',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Access Policy</h1><p className="text-gray-500 mt-2">Coming soon...</p></div>,
})

const settingsSchoolsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/schools',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Schools</h1><p className="text-gray-500 mt-2">Coming soon...</p></div>,
})

const settingsBillingRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/billing',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Billing</h1><p className="text-gray-500 mt-2">Coming soon...</p></div>,
})

const settingsIntegrationsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/integrations',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Integrations</h1><p className="text-gray-500 mt-2">Coming soon...</p></div>,
})

const settingsImportExportRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/import-export',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Import / Export</h1><p className="text-gray-500 mt-2">Coming soon...</p></div>,
})

const settingsDangerZoneRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/danger-zone',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold text-red-600">Danger Zone</h1><p className="text-gray-500 mt-2">Destructive actions...</p></div>,
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
  loginRoute,
  protectedRoute.addChildren([
    indexRoute,
    homeRoute,
    settingsRoute.addChildren([
      settingsIndexRoute,
      settingsAccountRoute,
      settingsPreferencesRoute,
      settingsSecurityRoute,
      settingsNotificationsRoute,
      settingsConnectionsRoute,
      settingsGeneralRoute,
      settingsAccessRoute,
      settingsSchoolsRoute,
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
    specialProgramsRoute,
    studentPortalRoute,
    parentPortalRoute,
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
