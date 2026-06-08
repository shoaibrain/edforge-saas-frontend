/**
 * StudentTable Component — V2
 *
 * Displays a paginated table of students with sorting.
 * Row click opens a quick-info drawer (managed by parent).
 *
 * V2 changes:
 * - Gradient initials avatar instead of DiceBear
 * - Attendance column with semantic color + progress bar
 * - Contact column removed
 * - StudentNumber standalone column removed (shown under name)
 * - Three-dot action column
 * - V2 StatusBadge styling
 */

import { useMemo, useState } from 'react'
import { User, MoreVertical, UserMinus, ExternalLink } from 'lucide-react'
import { TanstackDataTable, AttendanceDonutRing, type ColumnDef } from '@edforge/ui'
import type { StudentResponseDto } from '@aibrains/shared-types'
import { StudentStatusBadge } from './StudentStatusBadge'
import { UserAvatar } from '../common/UserAvatar'

// ============================================================================
// TYPES
// ============================================================================

interface StudentTableProps {
  students: StudentResponseDto[]
  alertsMap: Map<string, number>
  isLoading?: boolean
  onAddStudent?: () => void
  onViewStudent?: (student: StudentResponseDto) => void
  onWithdraw?: (student: StudentResponseDto) => void
  /**
   * Server-pagination adapter. Set when the caller is driving an infinite
   * query; keeps the Next button enabled while `hasMore=true`, auto-fetches
   * additional pages when the user runs off the end of the client buffer.
   */
  hasMore?: boolean
  isFetchingMore?: boolean
  onLoadMore?: () => void
  serverTotalHint?: number
}

// ============================================================================
// HELPERS
// ============================================================================

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

function getAttendanceRateColor(rate: number): string {
  if (rate < 80) return '#E24B4A'
  if (rate < 90) return '#EF9F27'
  return '#1D9E75'
}

// ============================================================================
// ROW ACTION MENU
// ============================================================================

function RowActionMenu({
  student,
  onView,
  onWithdraw,
}: {
  student: StudentResponseDto
  onView?: (student: StudentResponseDto) => void
  onWithdraw?: (student: StudentResponseDto) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded-md transition-colors hover:opacity-80"
        style={{ color: 'var(--v2-text-hint)' }}
        aria-label="Student actions"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 z-20 mt-1 w-40 rounded-lg border overflow-hidden shadow-lg"
            style={{
              background: 'var(--v2-bg-elevated)',
              borderColor: 'var(--v2-border-default)',
            }}
          >
            {onView && (
              <button
                onClick={() => { onView(student); setOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors hover:opacity-80"
                style={{ color: 'var(--v2-text-secondary)' }}
              >
                <ExternalLink className="w-3 h-3" />
                View Profile
              </button>
            )}
            {onWithdraw && (
              <button
                onClick={() => { onWithdraw(student); setOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors hover:opacity-80"
                style={{ color: '#E24B4A' }}
              >
                <UserMinus className="w-3 h-3" />
                Withdraw
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
  alertsMap,
  isLoading = false,
  onAddStudent,
  onViewStudent,
  onWithdraw,
  hasMore,
  isFetchingMore,
  onLoadMore,
  serverTotalHint,
}: StudentTableProps) {
  const columns: ColumnDef<StudentResponseDto, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'fullName',
        header: 'Student',
        size: 260,
        cell: ({ row }) => {
          const student = row.original
          return (
            <div className="flex items-center gap-3">
              <UserAvatar
                userId={student.studentId}
                userName={student.fullName}
                role="student"
                size="lg"
              />
              <div className="min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--v2-text-primary)' }}
                >
                  {student.fullName}
                </p>
                {student.studentNumber && (
                  <p
                    className="text-xs font-mono truncate"
                    style={{ color: 'var(--v2-text-hint)' }}
                  >
                    #{student.studentNumber}
                  </p>
                )}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'currentGradeLevel',
        header: 'Grade',
        size: 100,
        cell: ({ row }) => (
          <span
            className="text-[12px] font-medium"
            style={{ color: 'var(--v2-text-primary)' }}
          >
            {row.original.currentGradeLevel}
          </span>
        ),
      },
      {
        id: 'attendance',
        header: 'Attendance',
        size: 140,
        enableSorting: false,
        cell: ({ row }) => {
          const rate = alertsMap.get(row.original.studentId) ?? null
          if (rate === null || rate === undefined) {
            return (
              <span
                className="text-[12px]"
                style={{ color: 'var(--v2-text-hint)' }}
                title="No attendance recorded yet"
              >
                —
              </span>
            )
          }
          const color = getAttendanceRateColor(rate)
          return (
            <div className="flex items-center gap-2">
              <AttendanceDonutRing rate={rate} size={24} strokeWidth={3} />
              <span className="text-[12px] font-medium" style={{ color }}>
                {rate.toFixed(1)}%
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 110,
        cell: ({ row }) => (
          <StudentStatusBadge status={row.original.status} />
        ),
      },
      {
        accessorKey: 'enrollmentDate',
        header: 'Enrolled',
        size: 130,
        cell: ({ row }) => (
          <span
            className="text-[12px]"
            style={{ color: 'var(--v2-text-secondary)' }}
          >
            {formatDate(row.original.enrollmentDate)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 48,
        enableSorting: false,
        cell: ({ row }) => (
          <RowActionMenu
            student={row.original}
            onView={onViewStudent}
            onWithdraw={onWithdraw}
          />
        ),
      },
    ],
    [alertsMap, onViewStudent, onWithdraw]
  )

  const serverPagination = onLoadMore
    ? {
        hasMore: Boolean(hasMore),
        isFetching: Boolean(isFetchingMore),
        onLoadMore,
        serverTotalHint,
      }
    : undefined

  return (
    <TanstackDataTable
      columns={columns}
      data={students}
      isLoading={isLoading}
      enableSorting={true}
      pagination={{ pageSize: 20 }}
      serverPagination={serverPagination}
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
      maxHeight="calc(100vh - 22rem)"
    />
  )
}
