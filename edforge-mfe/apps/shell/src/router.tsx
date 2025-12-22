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
import { LoginPage } from './components/layout/LoginPage'
import { useThemeStore } from './stores/theme.store'
import { useAuthStore } from './stores/auth.store'
import { useEffect } from 'react'

// Pages
import HomePage from './pages/HomePage'
import SettingsPage from './pages/SettingsPage'
import AcademicsPage from './pages/AcademicsPage'
import FinancePage from './pages/FinancePage'

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
  path: '/academics',
  component: AcademicsPage,
})

const academicsIndexRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/',
  component: () => null, // AcademicsPage handles overview
})

const academicsStudentsRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/students',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Students</h1><p className="text-gray-500 mt-2">Student management coming soon...</p></div>,
})

const academicsTeachersRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/teachers',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Teachers</h1><p className="text-gray-500 mt-2">Teacher management coming soon...</p></div>,
})

const academicsEnrollmentRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/enrollment',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Enrollment</h1><p className="text-gray-500 mt-2">Enrollment management coming soon...</p></div>,
})

const academicsGradelevelsRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/gradelevels',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Grade Levels</h1><p className="text-gray-500 mt-2">Grade level management coming soon...</p></div>,
})

const academicsClassroomsRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/classrooms',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Classrooms</h1><p className="text-gray-500 mt-2">Classroom management coming soon...</p></div>,
})

const academicsCurriculumRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/curriculum',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Curriculum</h1><p className="text-gray-500 mt-2">Curriculum management coming soon...</p></div>,
})

const academicsCalendarRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/schoolcalendar',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">School Calendar</h1><p className="text-gray-500 mt-2">Calendar coming soon...</p></div>,
})

const academicsAttendanceRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/attendance',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Attendance</h1><p className="text-gray-500 mt-2">Attendance tracking coming soon...</p></div>,
})

const academicsGradebooksRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/gradebooks',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Gradebooks</h1><p className="text-gray-500 mt-2">Gradebook management coming soon...</p></div>,
})

// ============================================================================
// FINANCE ROUTES
// ============================================================================

const financeRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/finance',
  component: FinancePage,
})

const financeIndexRoute = createRoute({
  getParentRoute: () => financeRoute,
  path: '/',
  component: () => null, // FinancePage handles overview
})

const financeFinancialsRoute = createRoute({
  getParentRoute: () => financeRoute,
  path: '/financials',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Financials</h1><p className="text-gray-500 mt-2">Financial overview coming soon...</p></div>,
})

const financePayrollRoute = createRoute({
  getParentRoute: () => financeRoute,
  path: '/payroll',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Payroll</h1><p className="text-gray-500 mt-2">Payroll management coming soon...</p></div>,
})

const financeTuitionRoute = createRoute({
  getParentRoute: () => financeRoute,
  path: '/tuitionandfees',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Tuition & Fees</h1><p className="text-gray-500 mt-2">Tuition management coming soon...</p></div>,
})

const financeExpensesRoute = createRoute({
  getParentRoute: () => financeRoute,
  path: '/expenses',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Expenses</h1><p className="text-gray-500 mt-2">Expense tracking coming soon...</p></div>,
})

const financeReportsRoute = createRoute({
  getParentRoute: () => financeRoute,
  path: '/reports',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Reports</h1><p className="text-gray-500 mt-2">Financial reports coming soon...</p></div>,
})

// ============================================================================
// PEOPLE ROUTES
// ============================================================================

const peopleRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/people',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">My People</h1><p className="text-gray-500 mt-2">People directory coming soon...</p></div>,
})

const peopleIndexRoute = createRoute({
  getParentRoute: () => peopleRoute,
  path: '/',
  component: () => null,
})

const peopleNewRoute = createRoute({
  getParentRoute: () => peopleRoute,
  path: '/new',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Add Person</h1><p className="text-gray-500 mt-2">Add new person form coming soon...</p></div>,
})

// ============================================================================
// MESSAGES ROUTES
// ============================================================================

const messagesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/messages',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Messages</h1><p className="text-gray-500 mt-2">Messaging coming soon...</p></div>,
})

const messagesIndexRoute = createRoute({
  getParentRoute: () => messagesRoute,
  path: '/',
  component: () => null,
})

// ============================================================================
// ANALYTICS ROUTES
// ============================================================================

const analyticsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/analytics',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Analytics</h1><p className="text-gray-500 mt-2">Analytics dashboard coming soon...</p></div>,
})

const analyticsIndexRoute = createRoute({
  getParentRoute: () => analyticsRoute,
  path: '/',
  component: () => null,
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
    academicsRoute.addChildren([
      academicsIndexRoute,
      academicsStudentsRoute,
      academicsTeachersRoute,
      academicsEnrollmentRoute,
      academicsGradelevelsRoute,
      academicsClassroomsRoute,
      academicsCurriculumRoute,
      academicsCalendarRoute,
      academicsAttendanceRoute,
      academicsGradebooksRoute,
    ]),
    financeRoute.addChildren([
      financeIndexRoute,
      financeFinancialsRoute,
      financePayrollRoute,
      financeTuitionRoute,
      financeExpensesRoute,
      financeReportsRoute,
    ]),
    peopleRoute.addChildren([
      peopleIndexRoute,
      peopleNewRoute,
    ]),
    messagesRoute.addChildren([
      messagesIndexRoute,
    ]),
    analyticsRoute.addChildren([
      analyticsIndexRoute,
    ]),
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
