/**
 * Student Portal Layout
 *
 * Wraps all student portal pages with identity resolution.
 * Provides StudentPortalContext with the resolved studentId and profile
 * so child pages don't need to individually resolve identity.
 */

import { createContext, useContext } from 'react'
import { Outlet } from '@tanstack/react-router'
import { useStudentIdentity } from '../../hooks/useStudentIdentity'
import { Skeleton } from '@edforge/ui'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@edforge/ui'
import { RouteErrorBoundary } from '../../components/layout/ErrorBoundary'
import '../../styles/family-portal.css'

// ============================================================================
// CONTEXT
// ============================================================================

interface StudentPortalContextValue {
  studentId: string
  studentProfile: {
    studentId: string
    firstName: string
    lastName: string
    email: string
    gradeLevel?: string
    enrollmentStatus?: string
    schoolId: string
    [key: string]: unknown
  }
}

const StudentPortalContext = createContext<StudentPortalContextValue | null>(null)

export function useStudentPortal() {
  const ctx = useContext(StudentPortalContext)
  if (!ctx) throw new Error('useStudentPortal must be used inside StudentPortalLayout')
  return ctx
}

// ============================================================================
// LAYOUT COMPONENT
// ============================================================================

export default function StudentPortalLayout() {
  const { studentId, studentProfile, isLoading, error } = useStudentIdentity()

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error || !studentId || !studentProfile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">
            Unable to Load Student Profile
          </h1>
          <p className="text-sm text-[rgb(var(--text-secondary))] mb-8">
            We couldn't find your student record. Please contact your school administrator if this issue persists.
          </p>
          <Button onClick={() => window.location.href = '/home'}>
            Go to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <StudentPortalContext.Provider value={{ studentId, studentProfile }}>
      <div data-family-portal="true">
        <RouteErrorBoundary>
          <Outlet />
        </RouteErrorBoundary>
      </div>
    </StudentPortalContext.Provider>
  )
}
