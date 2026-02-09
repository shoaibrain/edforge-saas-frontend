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
  GraduationCap,
  UserCheck,
  AlertCircle,
  RefreshCw,
  UserMinus,
} from 'lucide-react'
import { Button } from '@edforge/ui'
import { StudentTable, StudentFilters, StudentDrawer } from '../../components/students'
import { ConfirmationDialog } from '../../components/common'
import {
  useStudents,
  flattenStudentPages,
  getTotalFromPages,
  useDeleteStudent,
} from '../../hooks'
import { useActiveSchoolId } from '../../stores'
import { useStudentFilters } from '../../stores/students.store'
import type { StudentResponseDto } from '@edforge/shared-types'

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  bg,
  isLoading = false,
}: {
  icon: typeof Users
  label: string
  value: string | number
  accent: string
  bg: string
  isLoading?: boolean
}) {
  return (
    <div className="bg-surface-secondary rounded-xl border border-border-secondary p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`w-4 h-4 ${accent}`} />
        </div>
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          {isLoading ? (
            <div className="h-7 w-16 bg-surface-tertiary rounded animate-pulse mt-0.5" />
          ) : (
            <p className="text-xl font-semibold text-text-primary">{value}</p>
          )}
        </div>
      </div>
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
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20">
                <Users className="w-6 h-6 text-teal-600 dark:text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">
                  Student Directory
                </h1>
                <p className="text-text-secondary mt-1">
                  Comprehensive student roster with enrollment status, demographics, and academic standing
                </p>
              </div>
            </div>
            <Button
              onClick={handleAddStudent}
              disabled={!activeSchoolId}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
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
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                label="Total Enrolled"
                value={stats.total.toLocaleString()}
                accent="text-teal-600 dark:text-cyan-400"
                bg="bg-teal-500/10"
                isLoading={isLoading}
              />
              <StatCard
                icon={GraduationCap}
                label="Active Students"
                value={stats.active.toLocaleString()}
                accent="text-blue-600 dark:text-blue-400"
                bg="bg-blue-500/10"
                isLoading={isLoading}
              />
              <StatCard
                icon={UserCheck}
                label="New Enrollments"
                value={stats.newEnrollments.toLocaleString()}
                accent="text-emerald-600 dark:text-emerald-400"
                bg="bg-emerald-500/10"
                isLoading={isLoading}
              />
              <StatCard
                icon={AlertCircle}
                label="Pending Review"
                value={stats.pendingReview.toLocaleString()}
                accent="text-amber-600 dark:text-amber-400"
                bg="bg-amber-500/10"
                isLoading={isLoading}
              />
            </div>

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
        onWithdraw={handleWithdrawFromDrawer}
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
    </div>
  )
}

export default StudentsModule
