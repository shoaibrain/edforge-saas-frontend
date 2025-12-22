/**
 * Shell Router Configuration
 * 
 * Minimal TanStack Router setup for the MFE shell.
 * Provides the router context needed by copied components.
 */

import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { App } from './App'

// Root route - wraps the entire app
const rootRoute = createRootRoute({
  component: App,
})

// Index route - redirects to home
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => null, // App handles rendering
})

// Home route
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/home',
  component: () => null,
})

// Login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: () => null,
})

// ============================================================================
// Settings routes
// ============================================================================
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: () => null,
})

const settingsIndexRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/',
  component: () => null,
})

const settingsAccountRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/account',
  component: () => null,
})

const settingsSecurityRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/security',
  component: () => null,
})

const settingsNotificationsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/notifications',
  component: () => null,
})

const settingsSchoolsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/schools',
  component: () => null,
})

const settingsBillingRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/billing',
  component: () => null,
})

// ============================================================================
// Academics routes
// ============================================================================
const academicsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/academics',
  component: () => null,
})

const academicsIndexRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/',
  component: () => null,
})

const academicsStudentsRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/students',
  component: () => null,
})

const academicsTeachersRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/teachers',
  component: () => null,
})

const academicsClassroomsRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/classrooms',
  component: () => null,
})

const academicsEnrollmentRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/enrollment',
  component: () => null,
})

const academicsGradelevelsRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/gradelevels',
  component: () => null,
})

const academicsCurriculumRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/curriculum',
  component: () => null,
})

const academicsCalendarRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/schoolcalendar',
  component: () => null,
})

const academicsAttendanceRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/attendance',
  component: () => null,
})

const academicsGradebooksRoute = createRoute({
  getParentRoute: () => academicsRoute,
  path: '/gradebooks',
  component: () => null,
})

// ============================================================================
// Finance routes
// ============================================================================
const financeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/finance',
  component: () => null,
})

const financeIndexRoute = createRoute({
  getParentRoute: () => financeRoute,
  path: '/',
  component: () => null,
})

const financeFinancialsRoute = createRoute({
  getParentRoute: () => financeRoute,
  path: '/financials',
  component: () => null,
})

const financePayrollRoute = createRoute({
  getParentRoute: () => financeRoute,
  path: '/payroll',
  component: () => null,
})

const financeTuitionRoute = createRoute({
  getParentRoute: () => financeRoute,
  path: '/tuitionandfees',
  component: () => null,
})

const financeExpensesRoute = createRoute({
  getParentRoute: () => financeRoute,
  path: '/expenses',
  component: () => null,
})

const financeReportsRoute = createRoute({
  getParentRoute: () => financeRoute,
  path: '/reports',
  component: () => null,
})

// ============================================================================
// People routes
// ============================================================================
const peopleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/people',
  component: () => null,
})

const peopleIndexRoute = createRoute({
  getParentRoute: () => peopleRoute,
  path: '/',
  component: () => null,
})

const peopleNewRoute = createRoute({
  getParentRoute: () => peopleRoute,
  path: '/new',
  component: () => null,
})

// ============================================================================
// Messages routes
// ============================================================================
const messagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/messages',
  component: () => null,
})

const messagesIndexRoute = createRoute({
  getParentRoute: () => messagesRoute,
  path: '/',
  component: () => null,
})

// ============================================================================
// Analytics routes
// ============================================================================
const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics',
  component: () => null,
})

const analyticsIndexRoute = createRoute({
  getParentRoute: () => analyticsRoute,
  path: '/',
  component: () => null,
})

// ============================================================================
// Student Portal routes
// ============================================================================
const studentPortalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/student-portal',
  component: () => null,
})

// ============================================================================
// Parent Portal routes
// ============================================================================
const parentPortalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/parent-portal',
  component: () => null,
})

// ============================================================================
// Route tree
// ============================================================================
const routeTree = rootRoute.addChildren([
  indexRoute,
  homeRoute,
  loginRoute,
  settingsRoute.addChildren([
    settingsIndexRoute,
    settingsAccountRoute,
    settingsSecurityRoute,
    settingsNotificationsRoute,
    settingsSchoolsRoute,
    settingsBillingRoute,
  ]),
  academicsRoute.addChildren([
    academicsIndexRoute,
    academicsStudentsRoute,
    academicsTeachersRoute,
    academicsClassroomsRoute,
    academicsEnrollmentRoute,
    academicsGradelevelsRoute,
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
])

// Create router
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
