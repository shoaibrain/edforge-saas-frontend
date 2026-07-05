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
import { useAcademicsI18n } from '../../lib/i18n'

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

const STATUS_VALUES = ['enrolled', 'pending', 'withdrawn', 'transferred', 'graduated'] as const

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
  const { t } = useAcademicsI18n()
  return (
    <UiStatusBadge tone={STATUS_TONE[status] ?? 'neutral'} className="capitalize">
      {t(`status.${status}`, { defaultValue: status })}
    </UiStatusBadge>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

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
  const { t } = useAcademicsI18n()
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
          <div className="absolute ef-inset-inline-end-0 z-20 mt-1 w-44 rounded-lg py-1 overflow-hidden shadow-lg bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-primary)/0.35)]">
            <button
              type="button"
              onClick={() => { onWithdraw(); setOpen(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors hover:opacity-80 text-[rgb(var(--accent-finance-text))]"
            >
              <UserMinus className="w-3.5 h-3.5" />
              {t('tables.enrollment.actions.withdraw')}
            </button>
            <button
              type="button"
              onClick={() => { onTransfer(); setOpen(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors hover:opacity-80 text-[rgb(var(--accent-academics-text))]"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              {t('tables.enrollment.actions.transfer')}
            </button>
            {onMarkNoShow && (
              <button
                type="button"
                onClick={() => { onMarkNoShow(); setOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors hover:opacity-80 text-[rgb(var(--accent-attendance-text))]"
              >
                <UserX className="w-3.5 h-3.5" />
                {t('tables.enrollment.actions.markNoShow')}
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
  const { t, dataTableLabels, formatDate, enumLabel } = useAcademicsI18n()
  // Gate the dropdown on profile-load so the user doesn't see the full
  // 20-code catalog flash before the school's enabledGradeLevels resolve.
  // When schoolId is null the underlying query is disabled → isLoading=false
  // → the picker stays interactive and shows the full catalog, which is the
  // correct behavior for "no active school context".
  const { options: gradeLevelOptions, isLoading: gradeOptionsLoading } =
    useSchoolEnabledGradeOptions(schoolId)
  const hasActions = !!(onWithdraw || onTransfer || onMarkNoShow)
  const statusOptions = useMemo(
    () => STATUS_VALUES.map((value) => ({
      value,
      label: t(`status.${value}`, { defaultValue: value }),
    })),
    [t],
  )

  const columns: ColumnDef<EnrollmentResponseDto, unknown>[] = useMemo(() => {
    const cols: ColumnDef<EnrollmentResponseDto, unknown>[] = [
      {
        accessorFn: (row) =>
          ((row as Record<string, unknown>).studentName as string) || '',
        id: 'studentName',
        header: t('tables.enrollment.columns.student'),
        enableSorting: true,
        cell: ({ getValue, row }) => (
          <span className="font-medium text-xs text-[rgb(var(--text-primary))]">
            {getValue<string>() || <UuidBadge value={row.original.studentId} />}
          </span>
        ),
      },
      {
        accessorKey: 'gradeLevel',
        header: t('tables.enrollment.columns.gradeLevel'),
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="text-xs text-[rgb(var(--text-secondary))]">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('tables.enrollment.columns.status'),
        enableSorting: true,
        cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
      },
      {
        accessorFn: (row) => row.entryDate || row.enrollmentDate || null,
        id: 'entryDate',
        header: t('tables.enrollment.columns.entryDate'),
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="text-xs text-[rgb(var(--text-secondary))] tabular-nums">
            {formatDate(getValue<string | null>())}
          </span>
        ),
      },
      {
        accessorFn: (row) => row.exitWithdrawDate || row.withdrawalDate || null,
        id: 'exitDate',
        header: t('tables.enrollment.columns.exitDate'),
        enableSorting: true,
        cell: ({ getValue }) => {
          const val = getValue<string | null>()
          return (
            <span className={`text-xs tabular-nums ${val ? 'text-[rgb(var(--text-secondary))]' : 'text-[rgb(var(--text-disabled))]'}`}>
              {formatDate(val)}
            </span>
          )
        },
      },
      {
        accessorKey: 'enrollmentType',
        header: t('tables.enrollment.columns.type'),
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="text-xs text-[rgb(var(--text-secondary))]">
            {enumLabel('tables.enrollment.types', getValue<string>())}
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
  }, [hasActions, onWithdraw, onTransfer, onMarkNoShow, enumLabel, formatDate, t])

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
      tableId="academics.enrollment"
      enableSorting={true}
      pagination={{ pageSize: 20 }}
      serverPagination={
        onLoadMore
          ? { hasMore: Boolean(hasMore), isFetching: Boolean(isFetchingMore), onLoadMore }
          : undefined
      }
      searchPlaceholder={t('tables.enrollment.search')}
      emptyState={{
        icon: <Users className="w-10 h-10" />,
        title: t('tables.enrollment.empty.title'),
        description: t('tables.enrollment.empty.description'),
      }}
      labels={dataTableLabels}
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
            placeholder={gradeOptionsLoading ? t('tables.enrollment.filters.loadingGrades') : t('tables.enrollment.filters.allGrades')}
            options={gradeOptionsLoading ? [] : gradeLevelOptions}
          />
          <Select
            size="sm"
            className="w-36"
            clearable
            value={statusFilter ?? ''}
            onChange={(v) => onStatusChange(v || null)}
            placeholder={t('tables.enrollment.filters.allStatus')}
            options={statusOptions}
          />
          {(gradeLevel || statusFilter) && (
            <button
              type="button"
              onClick={() => { onGradeLevelChange(null); onStatusChange(null) }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-[8px] transition-colors hover:opacity-80 bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-tertiary))]"
            >
              <X className="w-3 h-3" />
              {t('tables.enrollment.filters.clear')}
            </button>
          )}
        </div>
      }
    />
  )
}
