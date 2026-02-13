/**
 * StudentTable Component
 *
 * Displays a paginated table of students with sorting.
 * Row click opens a quick-info drawer (managed by parent).
 * Withdrawal flow managed by parent via onWithdraw callback.
 */

import { useMemo } from 'react'
import { User } from 'lucide-react'
import { DataTable, type Column } from '@edforge/ui'
import type { StudentResponseDto } from '@aibrains/shared-types'
import { StudentStatusBadge } from './StudentStatusBadge'

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
  /** Callback when a student row is clicked (opens drawer) */
  onViewStudent?: (student: StudentResponseDto) => void
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

/**
 * Generate DiceBear Adventurer avatar URL
 */
function getAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
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
  onViewStudent,
}: StudentTableProps) {
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
            {/* DiceBear Adventurer Avatar */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-surface-tertiary">
              <img
                src={getAvatarUrl(student.studentId)}
                alt={getInitials(student.firstName, student.lastName)}
                className="w-full h-full object-cover"
                loading="lazy"
              />
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
      onRowClick={onViewStudent}
    />
  )
}
