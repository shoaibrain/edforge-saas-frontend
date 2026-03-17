/**
 * EnrollmentTable Component
 *
 * DataTable for enrollment records using TanstackDataTable from @edforge/ui.
 * Search, pagination, sorting, and skeleton are handled by the DataTable.
 * Grade-level and status filters are parent-controlled via toolbarExtra.
 */

import { useState, useMemo } from 'react'
import {
  MoreHorizontal,
  UserMinus,
  ArrowRightLeft,
  Users,
  X,
  UserX,
} from 'lucide-react'
import {
  TanstackDataTable,
  createActionsColumn,
  type ColumnDef,
} from '@edforge/ui'
import type { EnrollmentResponseDto } from '../../services/academics.service'
import { useFilteredGradeOptions } from '../../hooks/useGradeOptions'

// ============================================================================
// TYPES
// ============================================================================

interface EnrollmentTableProps {
  enrollments: EnrollmentResponseDto[]
  isLoading: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  searchTerm: string
  onSearchChange: (term: string) => void
  gradeLevel: string | null
  onGradeLevelChange: (level: string | null) => void
  statusFilter: string | null
  onStatusChange: (status: string | null) => void
  onWithdraw?: (enrollment: EnrollmentResponseDto) => void
  onTransfer?: (enrollment: EnrollmentResponseDto) => void
  onMarkNoShow?: (enrollment: EnrollmentResponseDto) => void
  /** School's configured grade range for filtering the grade dropdown */
  schoolGradeRange?: { start: string; end: string } | null
}

const statusOptions = [
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'pending', label: 'Pending' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'graduated', label: 'Graduated' },
]

// ============================================================================
// BADGE HELPERS
// ============================================================================

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    enrolled: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    withdrawn: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    transferred: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    graduated: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  }
  return styles[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400'
}

// ============================================================================
// ACTION MENU
// ============================================================================

function ActionMenu({
  enrollment,
  onWithdraw,
  onTransfer,
  onMarkNoShow,
}: {
  enrollment: EnrollmentResponseDto
  onWithdraw: () => void
  onTransfer: () => void
  onMarkNoShow?: () => void
}) {
  const [open, setOpen] = useState(false)
  const isActive = enrollment.status === 'enrolled' || enrollment.status === 'active' || enrollment.status === 'pending'

  if (!isActive) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 bg-surface-primary border border-border-secondary rounded-lg shadow-lg py-1">
            <button
              type="button"
              onClick={() => { onWithdraw(); setOpen(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <UserMinus className="w-4 h-4 text-red-500" />
              Withdraw
            </button>
            <button
              type="button"
              onClick={() => { onTransfer(); setOpen(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <ArrowRightLeft className="w-4 h-4 text-blue-500" />
              Transfer
            </button>
            {onMarkNoShow && (
              <button
                type="button"
                onClick={() => { onMarkNoShow(); setOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
              >
                <UserX className="w-4 h-4 text-orange-500" />
                Mark No-Show
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// DATE HELPER
// ============================================================================

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '\u2014'
  try {
    return new Date(dateStr).toLocaleDateString()
  } catch {
    return '\u2014'
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EnrollmentTable({
  enrollments,
  isLoading,
  // hasMore and onLoadMore are kept in the interface for backwards compat
  // but pagination is now handled by the DataTable
  hasMore: _hasMore,
  onLoadMore: _onLoadMore,
  // searchTerm and onSearchChange are kept in the interface for backwards compat
  // but globalFilter search is now handled internally by the DataTable
  searchTerm: _searchTerm,
  onSearchChange: _onSearchChange,
  gradeLevel,
  onGradeLevelChange,
  statusFilter,
  onStatusChange,
  onWithdraw,
  onTransfer,
  onMarkNoShow,
  schoolGradeRange,
}: EnrollmentTableProps) {
  const gradeLevelOptions = useFilteredGradeOptions(schoolGradeRange)

  const hasActions = !!(onWithdraw || onTransfer || onMarkNoShow)

  // ------------------------------------------------------------------
  // Column definitions
  // ------------------------------------------------------------------
  const columns: ColumnDef<EnrollmentResponseDto, unknown>[] = useMemo(() => {
    const cols: ColumnDef<EnrollmentResponseDto, unknown>[] = [
      {
        accessorFn: (row) =>
          (row as Record<string, unknown>).studentName as string ||
          row.studentId.slice(0, 8),
        id: 'studentName',
        header: 'Student',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="font-medium text-text-primary">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'gradeLevel',
        header: 'Grade Level',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="text-text-secondary">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        enableSorting: true,
        cell: ({ getValue }) => {
          const status = getValue<string>()
          return (
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(status)}`}
            >
              {status}
            </span>
          )
        },
      },
      {
        accessorFn: (row) => row.entryDate || row.enrollmentDate || null,
        id: 'entryDate',
        header: 'Entry Date',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="text-text-secondary">
            {formatDate(getValue<string | null>())}
          </span>
        ),
      },
      {
        accessorFn: (row) => row.exitWithdrawDate || row.withdrawalDate || null,
        id: 'exitDate',
        header: 'Exit Date',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="text-text-secondary">
            {formatDate(getValue<string | null>())}
          </span>
        ),
      },
      {
        accessorKey: 'enrollmentType',
        header: 'Type',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="text-text-secondary capitalize">
            {getValue<string>() || '\u2014'}
          </span>
        ),
      },
    ]

    // Actions column (only if action callbacks are provided)
    if (hasActions) {
      cols.push(
        createActionsColumn<EnrollmentResponseDto>({
          cell: ({ row }) => (
            <ActionMenu
              enrollment={row.original}
              onWithdraw={() => onWithdraw?.(row.original)}
              onTransfer={() => onTransfer?.(row.original)}
              onMarkNoShow={
                onMarkNoShow ? () => onMarkNoShow(row.original) : undefined
              }
            />
          ),
          size: 48,
        })
      )
    }

    return cols
  }, [hasActions, onWithdraw, onTransfer, onMarkNoShow])

  // ------------------------------------------------------------------
  // Pre-filter data by grade-level and status (parent-controlled)
  // Search / globalFilter is handled internally by TanstackDataTable
  // ------------------------------------------------------------------
  const filteredData = useMemo(() => {
    let result = enrollments
    if (gradeLevel) {
      result = result.filter((e) => e.gradeLevel === gradeLevel)
    }
    if (statusFilter) {
      result = result.filter((e) => e.status === statusFilter)
    }
    return result
  }, [enrollments, gradeLevel, statusFilter])

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <TanstackDataTable<EnrollmentResponseDto>
      columns={columns}
      data={filteredData}
      getRowId={(row) => `${row.studentId}-${row.schoolId}`}
      isLoading={isLoading}
      enableSorting={true}
      pagination={{ pageSize: 20 }}
      searchPlaceholder="Search students..."
      emptyState={{
        icon: <Users className="w-10 h-10 text-text-tertiary opacity-40" />,
        title: 'No enrollments found',
        description: 'Try adjusting your filters or search term.',
      }}
      toolbarExtra={
        <div className="flex items-center gap-2">
          <select
            value={gradeLevel ?? ''}
            onChange={(e) => onGradeLevelChange(e.target.value || null)}
            className="px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="">All Grades</option>
            {gradeLevelOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={statusFilter ?? ''}
            onChange={(e) => onStatusChange(e.target.value || null)}
            className="px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="">All Status</option>
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {(gradeLevel || statusFilter) && (
            <button
              type="button"
              onClick={() => { onGradeLevelChange(null); onStatusChange(null) }}
              className="flex items-center gap-1 px-3 py-2 text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] bg-[rgb(var(--surface-secondary))] hover:bg-[rgb(var(--surface-tertiary))] rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      }
    />
  )
}
