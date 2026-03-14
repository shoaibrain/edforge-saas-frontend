/**
 * Students Module
 *
 * Comprehensive student roster and management for the Academics domain.
 * This is the primary entry point for viewing and managing student records.
 *
 * Design Philosophy:
 * The Student Directory serves as the hub for all student-related operations.
 * Enrollment and Profiles are accessible as tabs/actions within individual records,
 * following the "Object-Oriented" navigation pattern that reduces sidebar clutter.
 */

import { useMemo, useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Users,
  Plus,
  AlertCircle,
  RefreshCw,
  UserMinus,
  Upload,
  MoreVertical,
} from 'lucide-react'
import { Button } from '@edforge/ui'
import { useResourcePermissions } from '@edforge/abac'
import { StudentTable, StudentFilters, StudentDrawer, CSVImport } from '../../components/students'
import { ConfirmationDialog } from '../../components/common'
import {
  useStudents,
  flattenStudentPages,
  getTotalFromPages,
  useDeleteStudent,
} from '../../hooks'
import { useActiveSchoolId } from '../../stores'
import { useStudentFilters } from '../../stores/students.store'
import type { StudentResponseDto } from '@aibrains/shared-types'

// ============================================================================
// STUDENT ACTIONS MENU (3-DOT)
// ============================================================================

function StudentActionsMenu({
  onImport,
  onAddStudent,
}: {
  onImport: () => void
  onAddStudent: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-interactive-hover transition-colors"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl bg-surface-primary border border-border-secondary shadow-lg overflow-hidden">
            <button
              onClick={() => { onAddStudent(); setOpen(false) }}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-text-secondary hover:bg-interactive-hover transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Student
            </button>
            <button
              onClick={() => { onImport(); setOpen(false) }}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-text-secondary hover:bg-interactive-hover transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// NO SCHOOL SELECTED STATE
// ============================================================================

function NoSchoolSelected() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          No School Selected
        </h3>
        <p className="text-text-secondary">
          Please select a school from the sidebar to view students.
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// ERROR STATE
// ============================================================================

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Failed to Load Students
        </h3>
        <p className="text-text-secondary mb-4">
          Something went wrong while loading the student directory. Please try again.
        </p>
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StudentsModule() {
  const navigate = useNavigate()

  // Get active school from shared store
  const activeSchoolId = useActiveSchoolId()

  // ABAC: check what this user can do with students
  const studentPerms = useResourcePermissions('students')

  // Get filter state from store
  const filters = useStudentFilters()

  // Fetch students with filters
  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useStudents({
    schoolId: activeSchoolId ?? '',
    filters: {
      searchTerm: filters.searchTerm || undefined,
      gradeLevel: filters.gradeLevel || undefined,
      status: filters.status || undefined,
    },
    enabled: !!activeSchoolId,
  })

  // Flatten paginated data
  const students = useMemo(() => flattenStudentPages(data), [data])
  const totalCount = getTotalFromPages(data)

  // Calculate stats from data
  const stats = useMemo(() => {
    if (!students.length) {
      return {
        total: totalCount ?? 0,
        active: 0,
        newEnrollments: 0,
        pendingReview: 0,
      }
    }

    const active = students.filter((s) => s.status === 'active').length
    // For demo purposes, estimate new enrollments as students enrolled in last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const newEnrollments = students.filter((s) => {
      if (!s.enrollmentDate) return false
      return new Date(s.enrollmentDate) >= thirtyDaysAgo
    }).length

    // Pending review could be students with incomplete profiles
    const pendingReview = students.filter(
      (s) => s.status === 'inactive' || !s.contactInfo?.email
    ).length

    return {
      total: totalCount ?? students.length,
      active,
      newEnrollments,
      pendingReview,
    }
  }, [students, totalCount])

  // Student drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentResponseDto | null>(null)

  // CSV Import state
  const [showImport, setShowImport] = useState(false)

  // Withdrawal state
  const [withdrawStudent, setWithdrawStudent] = useState<StudentResponseDto | null>(null)
  const deleteStudentMutation = useDeleteStudent()

  // Navigate to the full-page registration wizard
  const handleAddStudent = () => {
    navigate({ to: '/students/enrollment' })
  }

  // Open student drawer
  const handleViewStudent = useCallback((student: StudentResponseDto) => {
    setSelectedStudent(student)
    setDrawerOpen(true)
  }, [])

  // Close student drawer
  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
    setSelectedStudent(null)
  }, [])

  // Handle withdraw from drawer
  const handleWithdrawFromDrawer = useCallback((student: StudentResponseDto) => {
    setDrawerOpen(false)
    setSelectedStudent(null)
    setWithdrawStudent(student)
  }, [])

  // Handle withdraw confirmation
  const handleWithdrawConfirm = async () => {
    if (!withdrawStudent) return
    try {
      await deleteStudentMutation.mutateAsync(withdrawStudent.studentId)
      setWithdrawStudent(null)
    } catch {
      // Error handling is done in the mutation hook
    }
  }

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-500/10 dark:bg-teal-500/20">
                <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <h1 className="text-xl font-semibold text-text-primary tracking-tight">Students</h1>
              {!isLoading && activeSchoolId && (
                <span className="hidden sm:inline text-sm text-text-tertiary">
                  {stats.total} enrolled · {stats.active} active
                </span>
              )}
            </div>
            {studentPerms.create && activeSchoolId && (
              <StudentActionsMenu
                onImport={() => setShowImport(true)}
                onAddStudent={handleAddStudent}
              />
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* No School Selected State */}
        {!activeSchoolId ? (
          <NoSchoolSelected />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <>
            {/* Filters */}
            <StudentFilters />

            {/* Student Table */}
            <StudentTable
              students={students}
              isLoading={isLoading}
              hasMore={hasNextPage ?? false}
              isFetchingMore={isFetchingNextPage}
              onLoadMore={() => fetchNextPage()}
              onAddStudent={handleAddStudent}
              onViewStudent={handleViewStudent}
            />
          </>
        )}
      </div>

      {/* Student Quick-Info Drawer */}
      <StudentDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        student={selectedStudent}
        onWithdraw={studentPerms.delete ? handleWithdrawFromDrawer : undefined}
      />

      {/* Withdrawal Confirmation Dialog */}
      <ConfirmationDialog
        open={!!withdrawStudent}
        onClose={() => setWithdrawStudent(null)}
        onConfirm={handleWithdrawConfirm}
        title="Withdraw Student"
        description={
          withdrawStudent
            ? `Are you sure you want to withdraw ${withdrawStudent.fullName}? This action can be reversed by a school administrator.`
            : ''
        }
        confirmText="Withdraw"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteStudentMutation.isPending}
        icon={<UserMinus className="w-5 h-5 text-red-600 dark:text-red-400" />}
      />

      {/* CSV Import Modal */}
      {showImport && (
        <CSVImport
          onClose={() => setShowImport(false)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  )
}

export default StudentsModule
