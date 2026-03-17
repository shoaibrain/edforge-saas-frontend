/**
 * StudentTable Component
 *
 * Displays a paginated table of students with sorting.
 * Row click opens a quick-info drawer (managed by parent).
 * Withdrawal flow managed by parent via onWithdraw callback.
 */

import { useMemo } from 'react'
import { User } from 'lucide-react'
import { TanstackDataTable, type ColumnDef } from '@edforge/ui'
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
  onAddStudent,
  onViewStudent,
}: StudentTableProps) {
  // Define columns using TanStack ColumnDef format
  const columns: ColumnDef<StudentResponseDto, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'fullName',
        header: 'Student',
        size: 280,
        cell: ({ row }) => {
          const student = row.original
          return (
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
          )
        },
      },
      {
        accessorKey: 'studentNumber',
        header: 'Student ID',
        size: 160,
        cell: ({ row }) => (
          <span className="text-sm font-mono text-text-secondary">
            {row.original.studentNumber || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'currentGradeLevel',
        header: 'Grade',
        size: 100,
        cell: ({ row }) => (
          <span className="font-medium text-text-primary">
            {row.original.currentGradeLevel}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 120,
        cell: ({ row }) => (
          <StudentStatusBadge status={row.original.status} />
        ),
      },
      {
        accessorKey: 'enrollmentDate',
        header: 'Enrolled',
        size: 140,
        cell: ({ row }) => (
          <span className="text-text-secondary">
            {formatDate(row.original.enrollmentDate)}
          </span>
        ),
      },
      {
        accessorFn: (row) => row.contactInfo?.email,
        id: 'contactInfo',
        header: 'Contact',
        size: 200,
        enableSorting: false,
        cell: ({ row }) => {
          const email = row.original.contactInfo?.email
          const phone = row.original.contactInfo?.phone
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
    <TanstackDataTable
      columns={columns}
      data={students}
      isLoading={isLoading}
      enableSorting={true}
      pagination={{ pageSize: 20 }}
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
      onRowClick={onViewStudent}
    />
  )
}
