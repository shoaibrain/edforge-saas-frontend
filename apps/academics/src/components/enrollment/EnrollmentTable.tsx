/**
 * EnrollmentTable Component — V2
 *
 * DataTable for enrollment records using TanstackDataTable from @edforge/ui.
 *
 * V2 changes:
 * - Status badge with V2 semantic colors
 * - Type column: re_enrollment → Re-enrollment
 * - Entry Date: MMM DD, YYYY format
 * - Exit Date: em-dash in ghost color when empty
 * - V2 token-based filter dropdowns
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
  StatusBadge as UiStatusBadge,
  Select,
  type ColumnDef,
  type StatusTone,
} from '@edforge/ui'
import { UuidBadge } from '@edforge/archetype'
import type { EnrollmentResponseDto } from '../../services/academics.service'
import { useSchoolEnabledGradeOptions } from '../../hooks/useGradeOptions'

// ============================================================================
// TYPES
// ============================================================================

interface EnrollmentTableProps {
  enrollments: EnrollmentResponseDto[]
  isLoading: boolean
  hasMore?: boolean
  isFetchingMore?: boolean
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
  /**
   * Active school. The Grade filter dropdown reads `enabledGradeLevels`
   * (with `gradeRange` fallback) via `useSchoolEnabledGradeOptions`.
   */
  schoolId: string | null
}

const statusOptions = [
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'pending', label: 'Pending' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'graduated', label: 'Graduated' },
]

// ============================================================================
// STATUS BADGE — domain status -> semantic tone
// ============================================================================

const STATUS_TONE: Record<string, StatusTone> = {
  enrolled: 'success',
  active: 'success',
  pending: 'warning',
  withdrawn: 'danger',
  transferred: 'info',
  graduated: 'neutral',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <UiStatusBadge tone={STATUS_TONE[status] ?? 'neutral'} className="capitalize">
      {status}
    </UiStatusBadge>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '\u2014'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return '\u2014'
  }
}

function formatEnrollmentType(type: string | undefined | null): string {
  if (!type) return '\u2014'
  return type
    .replace(/_/g, '-')
    .replace(/^(.)/, (m) => m.toUpperCase())
    .replace(/-(.)/g, (_, c) => `-${c}`)
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
        className="p-1.5 rounded-md transition-colors hover:opacity-80 text-[rgb(var(--text-tertiary))]"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg py-1 overflow-hidden shadow-lg bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-primary)/0.35)]">
            <button
              type="button"
              onClick={() => { onWithdraw(); setOpen(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors hover:opacity-80 text-[rgb(var(--accent-finance))]"
            >
              <UserMinus className="w-3.5 h-3.5" />
              Withdraw
            </button>
            <button
              type="button"
              onClick={() => { onTransfer(); setOpen(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors hover:opacity-80 text-[rgb(var(--accent-academics))]"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Transfer
            </button>
            {onMarkNoShow && (
              <button
                type="button"
                onClick={() => { onMarkNoShow(); setOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors hover:opacity-80 text-[rgb(var(--accent-attendance))]"
              >
                <UserX className="w-3.5 h-3.5" />
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
// COMPONENT
// ============================================================================

export function EnrollmentTable({
  enrollments,
  isLoading,
  hasMore,
  isFetchingMore,
  onLoadMore,
  searchTerm: _searchTerm,
  onSearchChange: _onSearchChange,
  gradeLevel,
  onGradeLevelChange,
  statusFilter,
  onStatusChange,
  onWithdraw,
  onTransfer,
  onMarkNoShow,
  schoolId,
}: EnrollmentTableProps) {
  // Gate the dropdown on profile-load so the user doesn't see the full
  // 20-code catalog flash before the school's enabledGradeLevels resolve.
  // When schoolId is null the underlying query is disabled → isLoading=false
  // → the picker stays interactive and shows the full catalog, which is the
  // correct behavior for "no active school context".
  const { options: gradeLevelOptions, isLoading: gradeOptionsLoading } =
    useSchoolEnabledGradeOptions(schoolId)
  const hasActions = !!(onWithdraw || onTransfer || onMarkNoShow)

  const columns: ColumnDef<EnrollmentResponseDto, unknown>[] = useMemo(() => {
    const cols: ColumnDef<EnrollmentResponseDto, unknown>[] = [
      {
        accessorFn: (row) =>
          ((row as Record<string, unknown>).studentName as string) || '',
        id: 'studentName',
        header: 'Student',
        enableSorting: true,
        cell: ({ getValue, row }) => (
          <span className="font-medium text-xs text-[rgb(var(--text-primary))]">
            {getValue<string>() || <UuidBadge value={row.original.studentId} />}
          </span>
        ),
      },
      {
        accessorKey: 'gradeLevel',
        header: 'Grade Level',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="text-xs text-[rgb(var(--text-secondary))]">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        enableSorting: true,
        cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
      },
      {
        accessorFn: (row) => row.entryDate || row.enrollmentDate || null,
        id: 'entryDate',
        header: 'Entry Date',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="text-xs text-[rgb(var(--text-secondary))]">
            {formatDate(getValue<string | null>())}
          </span>
        ),
      },
      {
        accessorFn: (row) => row.exitWithdrawDate || row.withdrawalDate || null,
        id: 'exitDate',
        header: 'Exit Date',
        enableSorting: true,
        cell: ({ getValue }) => {
          const val = getValue<string | null>()
          return (
            <span className={`text-xs ${val ? 'text-[rgb(var(--text-secondary))]' : 'text-[rgb(var(--text-disabled))]'}`}>
              {formatDate(val)}
            </span>
          )
        },
      },
      {
        accessorKey: 'enrollmentType',
        header: 'Type',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="text-xs text-[rgb(var(--text-secondary))]">
            {formatEnrollmentType(getValue<string>())}
          </span>
        ),
      },
    ]

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

  return (
    <TanstackDataTable<EnrollmentResponseDto>
      columns={columns}
      data={filteredData}
      getRowId={(row) => `${row.studentId}-${row.schoolId}`}
      isLoading={isLoading}
      enableSorting={true}
      pagination={{ pageSize: 20 }}
      serverPagination={
        onLoadMore
          ? { hasMore: Boolean(hasMore), isFetching: Boolean(isFetchingMore), onLoadMore }
          : undefined
      }
      searchPlaceholder="Search students..."
      emptyState={{
        icon: <Users className="w-10 h-10 opacity-40 text-[rgb(var(--text-disabled))]" />,
        title: 'No enrollments found',
        description: 'Try adjusting your filters or search term.',
      }}
      maxHeight="calc(100vh - 13rem)"
      toolbarExtra={
        <div className="flex items-center gap-2">
          <Select
            size="sm"
            className="w-40"
            clearable
            value={gradeLevel ?? ''}
            onChange={(v) => onGradeLevelChange(v || null)}
            disabled={gradeOptionsLoading}
            placeholder={gradeOptionsLoading ? 'Loading grades…' : 'All Grades'}
            options={gradeOptionsLoading ? [] : gradeLevelOptions}
          />
          <Select
            size="sm"
            className="w-36"
            clearable
            value={statusFilter ?? ''}
            onChange={(v) => onStatusChange(v || null)}
            placeholder="All Status"
            options={statusOptions}
          />
          {(gradeLevel || statusFilter) && (
            <button
              type="button"
              onClick={() => { onGradeLevelChange(null); onStatusChange(null) }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-[8px] transition-colors hover:opacity-80 bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-tertiary))]"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      }
    />
  )
}
