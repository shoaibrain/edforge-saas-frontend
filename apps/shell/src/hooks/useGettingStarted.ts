/**
 * useGettingStarted — Getting-started checklist for freshly onboarded tenants.
 *
 * Determines whether to show a guided setup checklist on the home page,
 * calculates completion status for each step, and handles dismissal.
 */

import { useMemo, useCallback } from 'react'
import {
  School,
  UserPlus,
  LayoutGrid,
  Receipt,
  Users,
  CalendarDays,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useShell } from '../lib/shell-context'
import { useAuthStore, getUserRoleCategory } from '../stores/auth.store'
import { useAppStore } from '../stores/app.store'
import { useHomeAcademicYear, useAcademicsSnapshot } from './useHomeData'

// ============================================================================
// TYPES
// ============================================================================

export interface GettingStartedItem {
  id: string
  title: string
  description: string
  href: string
  icon: LucideIcon
  completed: boolean
  /** Items that depend on a school being created first */
  blocked: boolean
  blockedHint?: string
}

export interface GettingStartedState {
  show: boolean
  items: GettingStartedItem[]
  completedCount: number
  totalCount: number
  dismiss: () => void
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DISMISSED_KEY_PREFIX = 'edforge-getting-started-dismissed-'

// ============================================================================
// HOOK
// ============================================================================

export function useGettingStarted(): GettingStartedState {
  const { availableSchools, user, onboardingCompletedAt } = useShell()
  const authUser = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)

  const tenantId = user?.tenantId ?? ''
  const roleCategory = getUserRoleCategory(authUser, activeSchoolId)
  const isAdmin = roleCategory === 'administrator'

  // Data for completion checks (only fetch when admin)
  const hasSchool = availableSchools.length > 0
  const schoolId = hasSchool ? activeSchoolId : null

  const { data: academicYear } = useHomeAcademicYear(schoolId)
  const academicYearId = academicYear?.yearId
  const snapshot = useAcademicsSnapshot(schoolId, academicYearId)

  // Check if dismissed
  const isDismissed = useMemo(() => {
    if (!tenantId) return true
    try {
      return !!localStorage.getItem(`${DISMISSED_KEY_PREFIX}${tenantId}`)
    } catch {
      return false
    }
  }, [tenantId])

  const dismiss = useCallback(() => {
    if (!tenantId) return
    try {
      localStorage.setItem(
        `${DISMISSED_KEY_PREFIX}${tenantId}`,
        new Date().toISOString(),
      )
    } catch { /* ignore */ }
    // Force re-render by reloading (simplest approach; localStorage isn't reactive)
    window.location.reload()
  }, [tenantId])

  // Build checklist items
  const items = useMemo<GettingStartedItem[]>(() => {
    const needsSchool = !hasSchool
    const blockedHint = 'Create a school first'

    return [
      {
        id: 'create-school',
        title: 'Create your first school',
        description: 'Set up a school to start managing students and staff',
        href: '/settings/organization/schools/new',
        icon: School,
        completed: hasSchool,
        blocked: false,
      },
      {
        id: 'add-students',
        title: 'Add your first students',
        description: 'Enroll students individually or import from a spreadsheet',
        href: '/academics/students',
        icon: UserPlus,
        completed: (snapshot.totalEnrolled ?? 0) > 0,
        blocked: needsSchool,
        blockedHint,
      },
      {
        id: 'create-sections',
        title: 'Create class sections',
        description: 'Organize students into classrooms and assign teachers',
        href: '/academics/classrooms',
        icon: LayoutGrid,
        completed: (snapshot.activeSections ?? 0) > 0,
        blocked: needsSchool,
        blockedHint,
      },
      {
        id: 'academic-calendar',
        title: 'Configure academic calendar',
        description: 'Set up your academic year, terms, and school schedule',
        href: '/settings/organization/academic-years',
        icon: CalendarDays,
        completed: !!academicYear,
        blocked: needsSchool,
        blockedHint,
      },
      {
        id: 'invite-team',
        title: 'Invite team members',
        description: 'Add teachers, administrators, and other staff',
        href: '/settings/security/users',
        icon: Users,
        completed: false, // Conservative: always show until dismissed
        blocked: false,
      },
      {
        id: 'setup-fees',
        title: 'Set up fee structures',
        description: 'Configure tuition fees, billing cycles, and payment options',
        href: '/finance/billing/fee-structures',
        icon: Receipt,
        completed: false, // Conservative: always show until dismissed
        blocked: needsSchool,
        blockedHint,
      },
    ]
  }, [hasSchool, snapshot.totalEnrolled, snapshot.activeSections, academicYear])

  const completedCount = items.filter((i) => i.completed).length
  const totalCount = items.length
  const allComplete = completedCount === totalCount

  // Show logic: admin, onboarding completed, not dismissed, not all complete
  const show = isAdmin && !!onboardingCompletedAt && !isDismissed && !allComplete

  return {
    show,
    items,
    completedCount,
    totalCount,
    dismiss,
  }
}
