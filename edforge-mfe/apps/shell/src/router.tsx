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
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Student Directory</h1><p className="text-gray-500 mt-2">Student management coming soon...</p></div>,
})

const academicsStudentsEnrollmentRoute = createRoute({
  getParentRoute: () => academicsStudentsRoute,
  path: '/enrollment',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Enrollment</h1><p className="text-gray-500 mt-2">Enrollment management coming soon...</p></div>,
})

const academicsStudentsProfilesRoute = createRoute({
  getParentRoute: () => academicsStudentsRoute,
  path: '/profiles',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Student Profiles</h1><p className="text-gray-500 mt-2">Student profiles coming soon...</p></div>,
})

const academicsEnrollmentRedirect = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/enrollment',
  beforeLoad: () => {
    throw redirect({ to: '/academics/students/enrollment' })
  },
})

const academicsTeachersRedirect = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/teachers',
  beforeLoad: () => {
    throw redirect({ to: '/people/staff' })
  },
})

const academicsEnrollmentRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/enrollment',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Enrollment</h1><p className="text-gray-500 mt-2">Enrollment management coming soon...</p></div>,
})

const academicsGradelevelsRedirect = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/gradelevels',
  beforeLoad: () => {
    throw redirect({ to: '/academics/grade-levels' })
  },
})

const academicsGradeLevelsRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/grade-levels',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Grade Levels</h1><p className="text-gray-500 mt-2">Grade level management coming soon...</p></div>,
})

const academicsClassroomsRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/classrooms',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Classrooms</h1><p className="text-gray-500 mt-2">Classroom management coming soon...</p></div>,
})

const academicsSchedulesRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/schedules',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Class Schedules</h1><p className="text-gray-500 mt-2">Class scheduling coming soon...</p></div>,
})

const academicsTimetablesRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/timetables',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Timetables</h1><p className="text-gray-500 mt-2">Timetable management coming soon...</p></div>,
})

const academicsCurriculumRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/curriculum',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Curriculum</h1><p className="text-gray-500 mt-2">Curriculum management coming soon...</p></div>,
})

const academicsCoursesRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/courses',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Courses</h1><p className="text-gray-500 mt-2">Course management coming soon...</p></div>,
})

const academicsStandardsRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/standards',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Standards</h1><p className="text-gray-500 mt-2">Standards management coming soon...</p></div>,
})

const academicsSchoolCalendarRedirect = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/schoolcalendar',
  beforeLoad: () => {
    throw redirect({ to: '/academics/calendar' })
  },
})

const academicsCalendarRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/calendar',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Academic Calendar</h1><p className="text-gray-500 mt-2">Calendar coming soon...</p></div>,
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

const academicsAssessmentsRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/assessments',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Assessments</h1><p className="text-gray-500 mt-2">Assessment management coming soon...</p></div>,
})

const academicsExamsRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/exams',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Exams</h1><p className="text-gray-500 mt-2">Exam management coming soon...</p></div>,
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

const financeFinancialsRedirect = createRoute({
  getParentRoute: () => financeRoute,
  path: '/financials',
  beforeLoad: () => {
    throw redirect({ to: '/finance/accounting/general-ledger' })
  },
})

const financeAccountingRoute = createRoute({
  getParentRoute: () => financeRoute,
  path: '/accounting',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Accounting</h1><p className="text-gray-500 mt-2">Accounting dashboard coming soon...</p></div>,
})

const financeAccountingGeneralLedgerRoute = createRoute({
  getParentRoute: () => financeAccountingRoute,
  path: '/general-ledger',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">General Ledger</h1><p className="text-gray-500 mt-2">General ledger coming soon...</p></div>,
})

const financeAccountingAccountsPayableRoute = createRoute({
  getParentRoute: () => financeAccountingRoute,
  path: '/accounts-payable',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Accounts Payable</h1><p className="text-gray-500 mt-2">Accounts payable coming soon...</p></div>,
})

const financeAccountingAccountsReceivableRoute = createRoute({
  getParentRoute: () => financeAccountingRoute,
  path: '/accounts-receivable',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Accounts Receivable</h1><p className="text-gray-500 mt-2">Accounts receivable coming soon...</p></div>,
})

const financeBillingRoute = createRoute({
  getParentRoute: () => financeRoute,
  path: '/billing',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Billing</h1><p className="text-gray-500 mt-2">Billing dashboard coming soon...</p></div>,
})

const financeBillingTuitionFeesRoute = createRoute({
  getParentRoute: () => financeBillingRoute,
  path: '/tuition-fees',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Tuition & Fees</h1><p className="text-gray-500 mt-2">Tuition management coming soon...</p></div>,
})

const financeBillingFeeStructuresRoute = createRoute({
  getParentRoute: () => financeBillingRoute,
  path: '/fee-structures',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Fee Structures</h1><p className="text-gray-500 mt-2">Fee structures coming soon...</p></div>,
})

const financeBillingCollectionsRoute = createRoute({
  getParentRoute: () => financeBillingRoute,
  path: '/collections',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Collections</h1><p className="text-gray-500 mt-2">Collections coming soon...</p></div>,
})

const financeTuitionRedirect = createRoute({
  getParentRoute: () => financeRoute,
  path: '/tuitionandfees',
  beforeLoad: () => {
    throw redirect({ to: '/finance/billing/tuition-fees' })
  },
})

const financeExpensesRoute = createRoute({
  getParentRoute: () => financeRoute,
  path: '/expenses',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Expense Tracking</h1><p className="text-gray-500 mt-2">Expense tracking coming soon...</p></div>,
})

const financeExpensesApprovalsRoute = createRoute({
  getParentRoute: () => financeExpensesRoute,
  path: '/approvals',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Expense Approvals</h1><p className="text-gray-500 mt-2">Expense approvals coming soon...</p></div>,
})

const financeExpensesBudgetsRoute = createRoute({
  getParentRoute: () => financeExpensesRoute,
  path: '/budgets',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Budgets</h1><p className="text-gray-500 mt-2">Budget management coming soon...</p></div>,
})

const financeReportsRoute = createRoute({
  getParentRoute: () => financeRoute,
  path: '/reports',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Financial Reports</h1><p className="text-gray-500 mt-2">Financial reports coming soon...</p></div>,
})

const financeReportsAuditTrailRoute = createRoute({
  getParentRoute: () => financeReportsRoute,
  path: '/audit-trail',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Audit Trail</h1><p className="text-gray-500 mt-2">Audit trail coming soon...</p></div>,
})

const financePayrollRedirect = createRoute({
  getParentRoute: () => financeRoute,
  path: '/payroll',
  beforeLoad: () => {
    throw redirect({ to: '/people/hr/payroll' })
  },
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

const peopleStaffRoute = createRoute({
  getParentRoute: () => peopleRoute,
  path: '/staff',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Staff Directory</h1><p className="text-gray-500 mt-2">Staff directory coming soon...</p></div>,
})

const peopleHrRoute = createRoute({
  getParentRoute: () => peopleRoute,
  path: '/hr',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Human Resources</h1><p className="text-gray-500 mt-2">HR dashboard coming soon...</p></div>,
})

const peopleHrPayrollRoute = createRoute({
  getParentRoute: () => peopleHrRoute,
  path: '/payroll',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Payroll</h1><p className="text-gray-500 mt-2">Payroll management coming soon...</p></div>,
})

const peopleHrContractsRoute = createRoute({
  getParentRoute: () => peopleHrRoute,
  path: '/contracts',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Contracts</h1><p className="text-gray-500 mt-2">Contract management coming soon...</p></div>,
})

const peopleHrProfessionalDevRoute = createRoute({
  getParentRoute: () => peopleHrRoute,
  path: '/professional-development',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Professional Development</h1><p className="text-gray-500 mt-2">Professional development coming soon...</p></div>,
})

const peopleHrPerformanceReviewsRoute = createRoute({
  getParentRoute: () => peopleHrRoute,
  path: '/performance-reviews',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Performance Reviews</h1><p className="text-gray-500 mt-2">Performance reviews coming soon...</p></div>,
})

const peopleHrAttendanceRoute = createRoute({
  getParentRoute: () => peopleHrRoute,
  path: '/attendance',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Staff Attendance</h1><p className="text-gray-500 mt-2">Staff attendance tracking coming soon...</p></div>,
})

const peopleTasksRoute = createRoute({
  getParentRoute: () => peopleRoute,
  path: '/tasks',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Staff Tasks</h1><p className="text-gray-500 mt-2">Staff tasks coming soon...</p></div>,
})

const peopleTasksAssignmentsRoute = createRoute({
  getParentRoute: () => peopleTasksRoute,
  path: '/assignments',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Duty Assignments</h1><p className="text-gray-500 mt-2">Duty assignments coming soon...</p></div>,
})

const peopleAssignmentsRedirect = createRoute({
  getParentRoute: () => peopleRoute,
  path: '/assignments',
  beforeLoad: () => {
    throw redirect({ to: '/people/tasks' })
  },
})

const peopleAttendanceRedirect = createRoute({
  getParentRoute: () => peopleRoute,
  path: '/attendance',
  beforeLoad: () => {
    throw redirect({ to: '/people/hr/attendance' })
  },
})

const peopleParentsRoute = createRoute({
  getParentRoute: () => peopleRoute,
  path: '/parents',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Parent Directory</h1><p className="text-gray-500 mt-2">Parent directory coming soon...</p></div>,
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
// SPECIAL PROGRAMS ROUTES
// ============================================================================

const specialProgramsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/special-programs',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Special Programs</h1><p className="text-gray-500 mt-2">Special Programs dashboard coming soon...</p></div>,
})

const specialProgramsIndexRoute = createRoute({
  getParentRoute: () => specialProgramsRoute,
  path: '/',
  component: () => null,
})

const specialProgramsIEPsRoute = createRoute({
  getParentRoute: () => specialProgramsRoute,
  path: '/ieps',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">IEPs</h1><p className="text-gray-500 mt-2">IEP management coming soon...</p></div>,
})

const specialProgramsIEPsMeetingsRoute = createRoute({
  getParentRoute: () => specialProgramsIEPsRoute,
  path: '/meetings',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">IEP Meetings</h1><p className="text-gray-500 mt-2">IEP meetings coming soon...</p></div>,
})

const specialProgramsIEPsGoalsRoute = createRoute({
  getParentRoute: () => specialProgramsIEPsRoute,
  path: '/goals',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Goals & Objectives</h1><p className="text-gray-500 mt-2">IEP goals and objectives coming soon...</p></div>,
})

const specialPrograms504PlansRoute = createRoute({
  getParentRoute: () => specialProgramsRoute,
  path: '/504-plans',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">504 Plans</h1><p className="text-gray-500 mt-2">504 Plans management coming soon...</p></div>,
})

const specialProgramsAccommodationsRoute = createRoute({
  getParentRoute: () => specialProgramsRoute,
  path: '/accommodations',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Accommodations</h1><p className="text-gray-500 mt-2">Accommodations management coming soon...</p></div>,
})

const specialProgramsAccessibilityRoute = createRoute({
  getParentRoute: () => specialProgramsRoute,
  path: '/accessibility',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Accessibility Services</h1><p className="text-gray-500 mt-2">Accessibility services coming soon...</p></div>,
})

const specialProgramsCounselingRoute = createRoute({
  getParentRoute: () => specialProgramsRoute,
  path: '/counseling',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Counseling</h1><p className="text-gray-500 mt-2">Counseling services coming soon...</p></div>,
})

const specialProgramsInterventionsRoute = createRoute({
  getParentRoute: () => specialProgramsRoute,
  path: '/interventions',
  component: () => <div className="p-6"><h1 className="text-2xl font-bold">Interventions</h1><p className="text-gray-500 mt-2">Interventions management coming soon...</p></div>,
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
      academicsStudentsRoute.addChildren([
        academicsStudentsEnrollmentRoute,
        academicsStudentsProfilesRoute,
      ]),
      academicsTeachersRedirect,
      academicsEnrollmentRedirect,
      academicsGradelevelsRedirect,
      academicsGradeLevelsRoute,
      academicsClassroomsRoute,
      academicsSchedulesRoute,
      academicsTimetablesRoute,
      academicsCurriculumRoute,
      academicsCoursesRoute,
      academicsStandardsRoute,
      academicsSchoolCalendarRedirect,
      academicsCalendarRoute,
      academicsAttendanceRoute,
      academicsGradebooksRoute,
      academicsAssessmentsRoute,
      academicsExamsRoute,
    ]),
    financeRoute.addChildren([
      financeIndexRoute,
      financeFinancialsRedirect,
      financeAccountingRoute.addChildren([
        financeAccountingGeneralLedgerRoute,
        financeAccountingAccountsPayableRoute,
        financeAccountingAccountsReceivableRoute,
      ]),
      financeBillingRoute.addChildren([
        financeBillingTuitionFeesRoute,
        financeBillingFeeStructuresRoute,
        financeBillingCollectionsRoute,
      ]),
      financePayrollRedirect,
      financeTuitionRedirect,
      financeExpensesRoute.addChildren([
        financeExpensesApprovalsRoute,
        financeExpensesBudgetsRoute,
      ]),
      financeReportsRoute.addChildren([
        financeReportsAuditTrailRoute,
      ]),
    ]),
    peopleRoute.addChildren([
      peopleIndexRoute,
      peopleNewRoute,
      peopleStaffRoute,
      peopleHrRoute.addChildren([
        peopleHrPayrollRoute,
        peopleHrContractsRoute,
        peopleHrProfessionalDevRoute,
        peopleHrPerformanceReviewsRoute,
        peopleHrAttendanceRoute,
      ]),
      peopleTasksRoute.addChildren([
        peopleTasksAssignmentsRoute,
      ]),
      peopleAssignmentsRedirect,
      peopleAttendanceRedirect,
      peopleParentsRoute,
    ]),
    messagesRoute.addChildren([
      messagesIndexRoute,
    ]),
    analyticsRoute.addChildren([
      analyticsIndexRoute,
    ]),
    specialProgramsRoute.addChildren([
      specialProgramsIndexRoute,
      specialProgramsIEPsRoute.addChildren([
        specialProgramsIEPsMeetingsRoute,
        specialProgramsIEPsGoalsRoute,
      ]),
      specialPrograms504PlansRoute,
      specialProgramsAccommodationsRoute,
      specialProgramsAccessibilityRoute,
      specialProgramsCounselingRoute,
      specialProgramsInterventionsRoute,
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
