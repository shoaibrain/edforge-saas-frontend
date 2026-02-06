/**
 * StudentTable Component
 *
 * Displays a paginated table of students with sorting, row actions,
 * and navigation to student profiles.
 */

import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { User, MoreVertical, Eye, Pencil, UserMinus } from 'lucide-react'
import { DataTable, type Column } from '@edforge/ui'
import type { StudentResponseDto } from '@edforge/shared-types'
import { StudentStatusBadge } from './StudentStatusBadge'
import { ConfirmationDialog } from '../common'
import { useDeleteStudent } from '../../hooks'

// ============================================================================
// TYPES
// ============================================================================

interface StudentTableProps {
  /** Student data to display */
  students: StudentResponseDto[]
  /** Whether data is loading */
  isLoading?: boolean
  /** Whether there are more items to load */
  hasMore?: boolean
  /** Whether currently fetching more items */
  isFetchingMore?: boolean
  /** Callback when "Load More" is clicked */
  onLoadMore?: () => void
  /** Callback when "Add Student" is clicked (empty state) */
  onAddStudent?: () => void
  /** Callback when "Edit" is clicked */
  onEditStudent?: (student: StudentResponseDto) => void
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format date for display
 */
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return '-'
  }
}

/**
 * Get initials from name
 */
function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

// ============================================================================
// ROW ACTIONS DROPDOWN
// ============================================================================

interface RowActionsProps {
  student: StudentResponseDto
  onView: () => void
  onEdit?: () => void
  onWithdraw: () => void
}

function RowActions({ student, onView, onEdit, onWithdraw }: RowActionsProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
        aria-label="Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
            }}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg bg-surface-primary border border-border-primary shadow-lg py-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
                onView()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Eye className="w-4 h-4" />
              View Profile
            </button>

            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsOpen(false)
                  onEdit()
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit Student
              </button>
            )}

            {student.status === 'active' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsOpen(false)
                  onWithdraw()
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <UserMinus className="w-4 h-4" />
                Withdraw Student
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// STUDENT TABLE COMPONENT
// ============================================================================

export function StudentTable({
  students,
  isLoading = false,
  hasMore = false,
  isFetchingMore = false,
  onLoadMore,
  onAddStudent,
  onEditStudent,
}: StudentTableProps) {
  const navigate = useNavigate()
  const deleteStudentMutation = useDeleteStudent()

  // State for withdrawal confirmation dialog
  const [withdrawStudent, setWithdrawStudent] = useState<StudentResponseDto | null>(null)

  // Navigate to student profile
  // Note: Use relative path since router has basepath '/academics'
  const handleViewProfile = (student: StudentResponseDto) => {
    navigate({ to: `/students/${student.studentId}` })
  }

  // Handle row click
  const handleRowClick = (student: StudentResponseDto) => {
    handleViewProfile(student)
  }

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

  // Define columns
  const columns: Column<StudentResponseDto>[] = useMemo(
    () => [
      {
        key: 'fullName',
        header: 'Student',
        sortable: true,
        width: '280px',
        render: (student) => (
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-medium text-sm">
              {getInitials(student.firstName, student.lastName)}
            </div>
            {/* Name and student number */}
            <div className="min-w-0">
              <p className="font-medium text-text-primary truncate">
                {student.fullName}
              </p>
              {student.studentNumber && (
                <p className="text-xs text-text-tertiary truncate">
                  #{student.studentNumber}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'currentGradeLevel',
        header: 'Grade',
        sortable: true,
        width: '100px',
        render: (student) => (
          <span className="font-medium text-text-primary">
            {student.currentGradeLevel}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        width: '120px',
        render: (student) => <StudentStatusBadge status={student.status} />,
      },
      {
        key: 'enrollmentDate',
        header: 'Enrolled',
        sortable: true,
        width: '140px',
        render: (student) => (
          <span className="text-text-secondary">
            {formatDate(student.enrollmentDate)}
          </span>
        ),
      },
      {
        key: 'contactInfo.email',
        header: 'Contact',
        width: '200px',
        render: (student) => {
          const email = student.contactInfo?.email
          const phone = student.contactInfo?.phone
          return (
            <div className="min-w-0">
              {email && (
                <p className="text-sm text-text-primary truncate">{email}</p>
              )}
              {phone && (
                <p className="text-xs text-text-tertiary truncate">{phone}</p>
              )}
              {!email && !phone && (
                <span className="text-text-tertiary">-</span>
              )}
            </div>
          )
        },
      },
    ],
    []
  )

  return (
    <>
      <DataTable
        columns={columns}
        data={students}
        keyExtractor={(student) => student.studentId}
        isLoading={isLoading}
        skeletonRows={8}
        emptyState={{
          icon: <User className="w-12 h-12" />,
          title: 'No students found',
          description:
            'Get started by adding your first student to the directory.',
          action: onAddStudent
            ? {
                label: 'Add Student',
                onClick: onAddStudent,
              }
            : undefined,
        }}
        hasMore={hasMore}
        isFetchingMore={isFetchingMore}
        onLoadMore={onLoadMore}
        onRowClick={handleRowClick}
        rowActions={(student) => (
          <RowActions
            student={student}
            onView={() => handleViewProfile(student)}
            onEdit={onEditStudent ? () => onEditStudent(student) : undefined}
            onWithdraw={() => setWithdrawStudent(student)}
          />
        )}
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
    </>
  )
}
