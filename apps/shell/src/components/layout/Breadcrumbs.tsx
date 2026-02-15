/**
 * Breadcrumbs Component
 * 
 * Path-aware breadcrumb navigation using TanStack Router's useMatches().
 * Provides visual wayfinding for deep navigation within modules.
 * 
 * Features:
 * - Route-aware breadcrumb generation using TanStack Router matches
 * - Support for dynamic route parameters (e.g., $studentId -> actual name)
 * - Automatic path segment to label mapping with fallbacks
 * - Clickable navigation links (except current page)
 * - Responsive design with truncation for long paths
 * - Smooth animations on route changes
 * - Accessible with proper ARIA attributes
 */

import { useMemo } from 'react'
import { Link, useMatches } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'

// ============================================================================
// ROUTE LABEL MAPPING
// ============================================================================

/**
 * Maps URL path segments to human-readable labels.
 * Add new mappings as routes are created.
 */
const ROUTE_LABELS: Record<string, string> = {
  // Top-level modules
  home: 'Home',
  academics: 'Academics',
  finance: 'Finance & Billing',
  people: 'People & HR',
  messages: 'Messages',
  analytics: 'Analytics',
  settings: 'Settings',
  'student-portal': 'Student Portal',
  'parent-portal': 'Family Portal',
  'special-programs': 'Special Programs',
  edfi: 'State Reporting',

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
  attendance: 'Student Attendance',

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

  // People & HR sub-routes
  staff: 'Staff Directory',
  hr: 'Human Resources',
  payroll: 'Payroll',
  contracts: 'Contracts',
  'professional-development': 'Professional Development',
  'performance-reviews': 'Performance Reviews',
  department: 'Departments',
  tasks: 'Staff Tasks',
  assignments: 'Duty Assignments',
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
  grades: 'Grades',
  schedule: 'Schedule',

  // Parent Portal
  fees: 'Fee Payments',

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
 * Maps route parameter names to friendly display labels.
 * Used when displaying dynamic segments like $studentId.
 */
const PARAM_LABELS: Record<string, string> = {
  studentId: 'Student Details',
  teacherId: 'Teacher Details',
  staffId: 'Staff Details',
  parentId: 'Parent Details',
  classId: 'Class Details',
  classroomId: 'Classroom Details',
  schoolId: 'School Details',
}

/**
 * Convert a path segment to a human-readable label.
 * Falls back to title-casing the segment if no mapping exists.
 */
function getSegmentLabel(segment: string): string {
  // Check if it's a dynamic segment (starts with $)
  if (segment.startsWith('$')) {
    const paramName = segment.slice(1)
    return PARAM_LABELS[paramName] ||
      paramName.charAt(0).toUpperCase() + paramName.slice(1).replace(/Id$/, ' Details')
  }

  // Check static mapping
  if (ROUTE_LABELS[segment]) {
    return ROUTE_LABELS[segment]
  }

  // Fallback: title case the segment
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Check if a string looks like a dynamic ID (UUID, numeric ID, etc.)
 */
function isDynamicSegment(segment: string): boolean {
  // UUID pattern (with or without dashes)
  const uuidPattern = /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i
  // Short UUID or numeric ID
  const shortIdPattern = /^[a-f0-9-]{8,}$/i
  // Pure numeric ID
  const numericPattern = /^\d+$/

  return uuidPattern.test(segment) || shortIdPattern.test(segment) || numericPattern.test(segment)
}

/**
 * Segments that are route parameters (not standalone routes).
 * These should not be rendered as clickable breadcrumb links because
 * navigating to their partial path would result in a 404.
 * e.g. /settings/organization/sea/UUID — "sea" is part of $orgType param.
 */
const NON_NAVIGABLE_SEGMENTS = new Set(['sea', 'lea', 'esc'])

// ============================================================================
// BREADCRUMB TYPES
// ============================================================================

interface BreadcrumbItem {
  /** Unique identifier for this breadcrumb */
  id: string
  /** Display label */
  label: string
  /** Navigation path */
  path: string
  /** Whether this is the current page */
  isCurrentPage: boolean
  /** Whether this segment represents a dynamic parameter */
  isDynamic: boolean
  /** Whether this segment should not be a clickable link */
  isNonNavigable: boolean
  /** Route ID from TanStack Router (for debugging) */
  routeId?: string
}

// ============================================================================
// BREADCRUMBS COMPONENT
// ============================================================================

export function Breadcrumbs() {
  // Get all matched routes from TanStack Router
  const matches = useMatches()

  // Build breadcrumb items from route matches
  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    if (!matches || matches.length === 0) return []

    // Get the current pathname from the last match
    const currentMatch = matches[matches.length - 1]
    const pathname = currentMatch?.pathname || '/'

    // Don't show breadcrumbs on home page
    if (pathname === '/' || pathname === '/home') {
      return []
    }

    // Build breadcrumbs from path segments
    const segments = pathname.split('/').filter(Boolean)

    // Extract any dynamic params from route matches for display
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

      // Find the corresponding route match for this path level
      const matchingRoute = matches.find(m => m.pathname === path)

      // Determine the label
      let label: string
      if (isDynamic) {
        // For dynamic segments, try to get a meaningful label from params
        // or fall back to "Details"
        const paramKey = Object.keys(params).find(key => params[key] === segment)
        label = paramKey ? PARAM_LABELS[paramKey] || 'Details' : 'Details'
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
        label: 'Home',
        path: '/home',
        isCurrentPage: false,
        isDynamic: false,
        isNonNavigable: false,
      },
      ...items,
    ]
  }, [matches])

  // Don't render if no breadcrumbs (home page)
  if (breadcrumbs.length === 0) {
    return null
  }

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className="flex items-center gap-1.5 text-sm"
    >
      <ol className="flex items-center gap-1.5 list-none m-0 p-0">
        <AnimatePresence mode="popLayout">
          {breadcrumbs.map((crumb, index) => (
            <motion.li
              key={crumb.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15, delay: index * 0.03 }}
              className="flex items-center gap-1.5"
            >
              {/* Separator (except for first item) */}
              {index > 0 && (
                <ChevronRight
                  className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))] flex-shrink-0"
                  aria-hidden="true"
                />
              )}

              {/* Breadcrumb item */}
              {crumb.isCurrentPage || crumb.isNonNavigable ? (
                <span
                  className={cn(
                    crumb.isCurrentPage
                      ? 'font-medium text-[rgb(var(--text-primary))]'
                      : 'text-[rgb(var(--text-tertiary))]',
                    'max-w-[200px] truncate',
                    crumb.isDynamic && 'italic'
                  )}
                  aria-current={crumb.isCurrentPage ? 'page' : undefined}
                  title={crumb.label}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className={cn(
                    'flex items-center gap-1.5',
                    'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))]',
                    'transition-colors duration-150',
                    'max-w-[150px] truncate',
                    'hover:underline underline-offset-2',
                    'focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:ring-offset-1 rounded-sm',
                    crumb.isDynamic && 'italic'
                  )}
                  title={crumb.label}
                >
                  <span className="truncate">{crumb.label}</span>
                </Link>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </nav>
  )
}

