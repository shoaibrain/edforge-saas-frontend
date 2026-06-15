/**
 * StudentTable Component
 *
 * Paginated, sortable student roster. Row click opens the quick-info drawer.
 *
 * Columns: Student · Grade (chip) · Attendance (trend) · Guardian (stack) ·
 * Location · Status · Enrolled · Actions. Guardian/Location are ABAC-gated and
 * responsively hidden on narrow panes (Columns menu to opt back in).
 */

import { useMemo, useState, type ReactNode } from 'react'
import { User, MoreVertical, UserMinus, ExternalLink } from 'lucide-react'
import {
  TanstackDataTable,
  AttendanceTrend,
  type AttendanceTrendDirection,
  type ColumnDef,
  type DataTableColumnMeta,
} from '@edforge/ui'
import { gradeSort } from '@edforge/types'
import type { StudentResponseDto } from '@aibrains/shared-types'
import { StudentStatusBadge } from './StudentStatusBadge'
import { UserAvatar } from '../common/UserAvatar'
import { GradeChip } from './cells/GradeChip'
import { GuardianCell } from './cells/GuardianCell'
import { StudentLocationCell } from './cells/StudentLocationCell'

// ============================================================================
// TYPES
// ============================================================================

export interface StudentAttendanceSignal {
  rate: number
  trend?: AttendanceTrendDirection
  /** Optional daily series (Sprint 2 batch endpoint) — drives the sparkline. */
  series?: number[]
}

interface StudentTableProps {
  students: StudentResponseDto[]
  /** studentId → attendance signal (rate + trend [+ series]). At-risk only until Sprint 2. */
  attendanceByStudent: Map<string, StudentAttendanceSignal>
  isLoading?: boolean
  onAddStudent?: () => void
  onViewStudent?: (student: StudentResponseDto) => void
  onWithdraw?: (student: StudentResponseDto) => void
  /** Locale for attendance % formatting (e.g. tenant 'ne-NP'). */
  locale?: string
  /** ABAC gates — render Guardian/Location columns only when permitted. */
  canViewGuardians?: boolean
  canViewLocation?: boolean
  /** Toolbar content: filter presets/search/selects (left) and Export (right). */
  toolbarStart?: ReactNode
  toolbarExtra?: ReactNode
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
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return '-'
  }
}

const CENTER: DataTableColumnMeta = { align: 'center' }

// Responsive initial visibility, read synchronously at mount so the table
// doesn't flash the wrong column set (effect-based hooks capture `false` on
// first paint). Resize-reactivity + persistence are a follow-up (STU-TBL-1.8b).
function computeInitialVisibility(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  const xl = window.matchMedia('(min-width: 1280px)').matches
  const lg = window.matchMedia('(min-width: 1024px)').matches
  return { enrollmentDate: xl, guardian: lg, location: lg }
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
        className="p-1 rounded-md transition-colors hover:opacity-80 text-[rgb(var(--text-tertiary))]"
        aria-label="Student actions"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border overflow-hidden shadow-lg bg-[rgb(var(--background-tertiary))] border-[rgb(var(--border-primary))]">
            {onView && (
              <button
                onClick={() => { onView(student); setOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors hover:opacity-80 text-[rgb(var(--text-secondary))]"
              >
                <ExternalLink className="w-3 h-3" />
                View Profile
              </button>
            )}
            {onWithdraw && (
              <button
                onClick={() => { onWithdraw(student); setOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors hover:opacity-80 text-[rgb(var(--accent-finance-text))]"
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
  attendanceByStudent,
  isLoading = false,
  onAddStudent,
  onViewStudent,
  onWithdraw,
  locale,
  canViewGuardians = true,
  canViewLocation = true,
  toolbarStart,
  toolbarExtra,
  hasMore,
  isFetchingMore,
  onLoadMore,
  serverTotalHint,
}: StudentTableProps) {
  const columns: ColumnDef<StudentResponseDto, unknown>[] = useMemo(() => {
    const cols: ColumnDef<StudentResponseDto, unknown>[] = [
      {
        accessorKey: 'fullName',
        header: 'Student',
        size: 230,
        cell: ({ row }) => {
          const student = row.original
          return (
            <div className="flex items-center gap-3">
              <UserAvatar userId={student.studentId} userName={student.fullName} role="student" size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate text-[rgb(var(--text-primary))]">
                  {student.fullName}
                </p>
                {student.studentNumber && (
                  <p className="text-xs font-mono truncate text-[rgb(var(--text-tertiary))]">
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
        size: 64,
        meta: CENTER,
        sortingFn: (a, b) => gradeSort(a.original.currentGradeLevel ?? '', b.original.currentGradeLevel ?? ''),
        cell: ({ row }) => <GradeChip grade={row.original.currentGradeLevel} />,
      },
      {
        id: 'attendance',
        header: 'Attendance',
        size: 132,
        enableSorting: false,
        cell: ({ row }) => {
          const signal = attendanceByStudent.get(row.original.studentId)
          return (
            <AttendanceTrend
              rate={signal?.rate ?? null}
              series={signal?.series ?? null}
              trend={signal?.trend}
              locale={locale}
            />
          )
        },
      },
    ]

    if (canViewGuardians) {
      cols.push({
        id: 'guardian',
        header: 'Guardian',
        size: 176,
        enableSorting: false,
        meta: { enableHiding: true },
        cell: ({ row }) => <GuardianCell guardians={row.original.guardians} />,
      })
    }

    if (canViewLocation) {
      cols.push({
        id: 'location',
        header: 'Location',
        size: 148,
        enableSorting: false,
        meta: { enableHiding: true },
        cell: ({ row }) => <StudentLocationCell address={row.original.contactInfo?.address} />,
      })
    }

    cols.push(
      {
        accessorKey: 'status',
        header: 'Status',
        size: 96,
        cell: ({ row }) => <StudentStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'enrollmentDate',
        header: 'Enrolled',
        size: 116,
        meta: { enableHiding: true },
        cell: ({ row }) => (
          <span className="text-xs text-[rgb(var(--text-secondary))]">
            {formatDate(row.original.enrollmentDate)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 44,
        enableSorting: false,
        cell: ({ row }) => <RowActionMenu student={row.original} onView={onViewStudent} onWithdraw={onWithdraw} />,
      },
    )

    return cols
  }, [attendanceByStudent, onViewStudent, onWithdraw, locale, canViewGuardians, canViewLocation])

  const initialColumnVisibility = useMemo(computeInitialVisibility, [])

  const serverPagination = onLoadMore
    ? { hasMore: Boolean(hasMore), isFetching: Boolean(isFetchingMore), onLoadMore, serverTotalHint }
    : undefined

  return (
    <TanstackDataTable
      columns={columns}
      data={students}
      isLoading={isLoading}
      enableSorting={true}
      enableColumnVisibility
      tableId="academics-students-table"
      initialColumnVisibility={initialColumnVisibility}
      toolbarStart={toolbarStart}
      toolbarExtra={toolbarExtra}
      pagination={{ pageSize: 50 }}
      serverPagination={serverPagination}
      emptyState={{
        icon: <User className="w-12 h-12" />,
        title: 'No students found',
        description: 'Get started by adding your first student to the directory.',
        action: onAddStudent ? { label: 'Add Student', onClick: onAddStudent } : undefined,
      }}
      onRowClick={onViewStudent}
      maxHeight="calc(100vh - 22rem)"
    />
  )
}
