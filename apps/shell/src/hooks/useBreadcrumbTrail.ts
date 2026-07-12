/**
 * Breadcrumb trail derivation — path-aware wayfinding labels using TanStack
 * Router's useMatches().
 *
 * Extracted from the Breadcrumbs component so the phone app bar can title
 * subpages with the same label pipeline (i18n key → nav key → static fallback
 * → title-case) instead of growing a second label system. Breadcrumbs.tsx is
 * the desktop renderer of this trail.
 */

import { useMemo } from 'react'
import { useMatches } from '@tanstack/react-router'
import { useTranslation } from '@edforge/i18n'

// ============================================================================
// ROUTE LABEL FALLBACKS
// Used when no i18n key is found for a segment.
// ============================================================================

const ROUTE_LABELS: Record<string, string> = {
  // Top-level modules
  home: 'Home',
  academics: 'Academics',
  people: 'People',
  settings: 'Settings',
  'student-portal': 'Student Portal',
  'parent-portal': 'Family Portal',

  // Academics sub-routes
  students: 'Students',
  enrollment: 'Enrollment',
  'grade-levels': 'Grade Levels',
  classrooms: 'Classrooms',
  schedules: 'Class Schedules',
  timetables: 'Timetables',
  curriculum: 'Curriculum',
  courses: 'Courses',
  standards: 'Standards',
  gradebooks: 'Gradebooks',
  assessments: 'Assessments',
  exams: 'Exams',
  calendar: 'Academic Calendar',
  attendance: 'My Attendance',

  // Finance sub-routes
  accounting: 'Accounting',
  'general-ledger': 'General Ledger',
  'accounts-payable': 'Accounts Payable',
  'accounts-receivable': 'Accounts Receivable',
  billing: 'Billing',
  'tuition-fees': 'Tuition & Fees',
  'fee-structures': 'Fee Structures',
  collections: 'Collections',
  expenses: 'Expenses',
  approvals: 'Approvals',
  budgets: 'Budgets',
  reports: 'Financial Reports',
  'audit-trail': 'Audit Trail',

  // People sub-routes
  staff: 'Staff Directory',
  payroll: 'Payroll',
  contracts: 'Contracts',
  'professional-development': 'Professional Development',
  'performance-reviews': 'Performance Reviews',
  department: 'Departments',
  tasks: 'Staff Tasks',
  parents: 'Parent Directory',
  '504-plans': '504 Plans',

  // Messages sub-routes
  inbox: 'Inbox',
  announcements: 'Announcements',
  meetings: 'Meetings',
  integrations: 'Integrations',

  // Analytics sub-routes
  academic: 'Academic Performance',
  financial: 'Financial Analytics',

  // Settings sub-routes
  organization: 'Organization',
  sea: 'State Education Agency',
  lea: 'District',
  esc: 'Service Center',
  account: 'My Account',
  preferences: 'Preferences',
  notifications: 'Notifications',
  security: 'Security',
  connections: 'Connections',
  general: 'General',
  schools: 'Schools',

  data: 'Import/Export',
  danger: 'Danger Zone',

  // Student Portal
  grades: 'My Grades',
  schedule: 'My Schedule',
  assignments: 'Assignments',

  // Parent Portal
  fees: 'Fee Payments',
  overview: 'Overview',

  // Special Programs sub-routes
  ieps: 'IEPs',
  goals: 'Goals & Objectives',
  accommodations: 'Accommodations',
  accessibility: 'Accessibility Services',
  counseling: 'Counseling',
  interventions: 'Interventions',

  // Common
  new: 'New',
}

/**
 * Maps route parameter names to i18n breadcrumb keys.
 */
const PARAM_KEYS: Record<string, string> = {
  studentId: 'breadcrumb.studentDetails',
  teacherId: 'breadcrumb.teacherDetails',
  staffId: 'breadcrumb.staffDetails',
  parentId: 'breadcrumb.parentDetails',
  classId: 'breadcrumb.classDetails',
  classroomId: 'breadcrumb.classroomDetails',
  schoolId: 'breadcrumb.schoolDetails',
}

const PARAM_FALLBACKS: Record<string, string> = {
  studentId: 'Student Details',
  teacherId: 'Teacher Details',
  staffId: 'Staff Details',
  parentId: 'Parent Details',
  classId: 'Class Details',
  classroomId: 'Classroom Details',
  schoolId: 'School Details',
}

/**
 * Check if a string looks like a dynamic ID (UUID, numeric ID, etc.)
 */
function isDynamicSegment(segment: string): boolean {
  const uuidPattern = /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i
  const shortIdPattern = /^[a-f0-9-]{8,}$/i
  const numericPattern = /^\d+$/

  return uuidPattern.test(segment) || shortIdPattern.test(segment) || numericPattern.test(segment)
}

/**
 * Segments that are route parameters (not standalone routes).
 */
const NON_NAVIGABLE_SEGMENTS = new Set(['sea', 'lea', 'esc'])

// ============================================================================
// BREADCRUMB TYPES
// ============================================================================

export interface BreadcrumbItem {
  id: string
  label: string
  path: string
  isCurrentPage: boolean
  isDynamic: boolean
  isNonNavigable: boolean
  routeId?: string
}

// ============================================================================
// TRAIL HOOK
// ============================================================================

/**
 * Returns the breadcrumb trail for the current route (home crumb first),
 * or [] on the home route itself.
 */
export function useBreadcrumbTrail(): BreadcrumbItem[] {
  const matches = useMatches()
  const { t: tNav } = useTranslation('nav')

  /**
   * Translate a URL segment to a localized label.
   * Priority: breadcrumb.{segment} → top-level nav key → ROUTE_LABELS fallback → title-case
   */
  const getSegmentLabel = (segment: string): string => {
    // Try breadcrumb-specific key first (handles hyphenated segments like "grade-levels")
    const breadcrumbKey = `breadcrumb.${segment}`
    const breadcrumbResult = tNav(breadcrumbKey, { defaultValue: '' })
    if (breadcrumbResult) return breadcrumbResult

    // Try top-level nav key (handles simple segments like "students", "settings")
    const topLevelResult = tNav(segment, { defaultValue: '' })
    if (topLevelResult) return topLevelResult

    // Fallback to static map
    if (ROUTE_LABELS[segment]) return ROUTE_LABELS[segment]

    // Last resort: title-case
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getParamLabel = (paramKey: string): string => {
    const i18nKey = PARAM_KEYS[paramKey]
    if (i18nKey) {
      return tNav(i18nKey, { defaultValue: PARAM_FALLBACKS[paramKey] || 'Details' })
    }
    return PARAM_FALLBACKS[paramKey] ||
      paramKey.charAt(0).toUpperCase() + paramKey.slice(1).replace(/Id$/, ' Details')
  }

  return useMemo<BreadcrumbItem[]>(() => {
    if (!matches || matches.length === 0) return []

    const currentMatch = matches[matches.length - 1]
    const pathname = currentMatch?.pathname || '/'

    if (pathname === '/' || pathname === '/home') {
      return []
    }

    const segments = pathname.split('/').filter(Boolean)

    const params: Record<string, string> = {}
    matches.forEach(match => {
      if (match.params) {
        Object.assign(params, match.params)
      }
    })

    const items: BreadcrumbItem[] = segments.map((segment, index) => {
      const path = '/' + segments.slice(0, index + 1).join('/')
      const isCurrentPage = index === segments.length - 1
      const isDynamic = isDynamicSegment(segment)
      const isNonNavigable = NON_NAVIGABLE_SEGMENTS.has(segment)
      const matchingRoute = matches.find(m => m.pathname === path)

      let label: string
      if (isDynamic) {
        const paramKey = Object.keys(params).find(key => params[key] === segment)
        label = paramKey ? getParamLabel(paramKey) : tNav('breadcrumb.details', { defaultValue: 'Details' })
      } else {
        label = getSegmentLabel(segment)
      }

      return {
        id: `crumb-${path}`,
        label,
        path,
        isCurrentPage,
        isDynamic,
        isNonNavigable,
        routeId: matchingRoute?.routeId,
      }
    })

    // Prepend home breadcrumb
    return [
      {
        id: 'crumb-home',
        label: tNav('home'),
        path: '/home',
        isCurrentPage: false,
        isDynamic: false,
        isNonNavigable: false,
      },
      ...items,
    ]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, tNav])
}
